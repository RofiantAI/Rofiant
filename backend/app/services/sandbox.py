import asyncio
import shlex
import shutil
from abc import ABC, abstractmethod
from dataclasses import dataclass

from e2b import AsyncSandbox

from app.agent.tools.base import WORKSPACE_ROOT
from app.config import settings


@dataclass
class CommandResult:
    stdout: str
    stderr: str
    exit_code: int


@dataclass
class FileEntry:
    name: str
    path: str
    is_dir: bool


class SandboxProvider(ABC):
    """Isolated execution environment for agent tools. Swappable — nothing
    outside this module talks to a specific sandbox vendor's SDK."""

    @abstractmethod
    async def create(self) -> str:
        """Returns a sandbox_id."""

    @abstractmethod
    async def execute(
        self, sandbox_id: str, command: str, cwd: str | None = None, timeout: int = 30
    ) -> CommandResult:
        ...

    @abstractmethod
    async def read_file(self, sandbox_id: str, path: str) -> str:
        ...

    @abstractmethod
    async def write_file(self, sandbox_id: str, path: str, content: str) -> None:
        ...

    @abstractmethod
    async def list_files(self, sandbox_id: str, path: str) -> list[FileEntry]:
        ...

    @abstractmethod
    async def destroy(self, sandbox_id: str) -> None:
        ...


class E2BSandboxProvider(SandboxProvider):
    async def create(self) -> str:
        sandbox = await AsyncSandbox.create(
            api_key=settings.e2b_api_key, timeout=settings.sandbox_timeout_seconds
        )
        return sandbox.sandbox_id

    async def _connect(self, sandbox_id: str) -> AsyncSandbox:
        return await AsyncSandbox.connect(
            sandbox_id, api_key=settings.e2b_api_key, timeout=settings.sandbox_timeout_seconds
        )

    async def execute(
        self, sandbox_id: str, command: str, cwd: str | None = None, timeout: int = 30
    ) -> CommandResult:
        sandbox = await self._connect(sandbox_id)
        result = await sandbox.commands.run(command, cwd=cwd, timeout=timeout)
        return CommandResult(
            stdout=result.stdout, stderr=result.stderr, exit_code=result.exit_code
        )

    async def read_file(self, sandbox_id: str, path: str) -> str:
        sandbox = await self._connect(sandbox_id)
        return await sandbox.files.read(path, format="text")

    async def write_file(self, sandbox_id: str, path: str, content: str) -> None:
        sandbox = await self._connect(sandbox_id)
        await sandbox.files.write(path, content)

    async def list_files(self, sandbox_id: str, path: str) -> list[FileEntry]:
        sandbox = await self._connect(sandbox_id)
        entries = await sandbox.files.list(path)
        return [
            FileEntry(name=e.name, path=e.path, is_dir=e.type == "dir") for e in entries
        ]

    async def destroy(self, sandbox_id: str) -> None:
        sandbox = await AsyncSandbox.connect(sandbox_id, api_key=settings.e2b_api_key)
        await sandbox.kill()


class LocalSandboxProvider(SandboxProvider):
    """The bot's own VM on this machine: one container per workspace, run by
    whichever of docker/podman is installed. `sandbox_id` is the container id.

    The container is the safety boundary — the agent runs arbitrary commands,
    so nothing here ever touches the host filesystem or shell directly.
    """

    def _runtime(self) -> str:
        runtime = shutil.which("docker") or shutil.which("podman")
        if not runtime:
            raise RuntimeError(
                "sandbox_backend=local needs docker or podman on PATH. "
                "Install one, or set sandbox_backend=e2b."
            )
        return runtime

    async def _run(self, *args: str, stdin: str | None = None, timeout: int = 60) -> CommandResult:
        process = await asyncio.create_subprocess_exec(
            self._runtime(),
            *args,
            stdin=asyncio.subprocess.PIPE if stdin is not None else asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(stdin.encode() if stdin is not None else None), timeout
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            raise TimeoutError(f"Command timed out after {timeout}s")
        return CommandResult(
            stdout=stdout.decode(errors="replace"),
            stderr=stderr.decode(errors="replace"),
            exit_code=process.returncode or 0,
        )

    async def _check(self, *args: str, stdin: str | None = None, timeout: int = 60) -> str:
        result = await self._run(*args, stdin=stdin, timeout=timeout)
        if result.exit_code != 0:
            raise RuntimeError(result.stderr.strip() or f"exit code {result.exit_code}")
        return result.stdout

    async def create(self) -> str:
        # `sleep infinity` keeps the container alive so later exec calls land in
        # the same filesystem; pids-limit blocks fork bombs from the agent.
        container = await self._check(
            "run",
            "-d",
            "--memory", settings.sandbox_memory,
            "--cpus", settings.sandbox_cpus,
            "--network", settings.sandbox_network,
            "--pids-limit", "512",
            "-w", WORKSPACE_ROOT,
            settings.sandbox_image,
            "sh", "-c", f"mkdir -p {shlex.quote(WORKSPACE_ROOT)} && sleep infinity",
            timeout=300,  # first run may pull the image
        )
        return container.strip()

    async def execute(
        self, sandbox_id: str, command: str, cwd: str | None = None, timeout: int = 30
    ) -> CommandResult:
        return await self._run(
            "exec", "-w", cwd or WORKSPACE_ROOT, sandbox_id, "sh", "-c", command, timeout=timeout
        )

    async def read_file(self, sandbox_id: str, path: str) -> str:
        return await self._check("exec", sandbox_id, "cat", path)

    async def write_file(self, sandbox_id: str, path: str, content: str) -> None:
        quoted = shlex.quote(path)
        await self._check(
            "exec", "-i", sandbox_id, "sh", "-c",
            f"mkdir -p $(dirname {quoted}) && cat > {quoted}",
            stdin=content,
        )

    async def list_files(self, sandbox_id: str, path: str) -> list[FileEntry]:
        # -p appends "/" to directories, which is the only type info needed here.
        output = await self._check(
            "exec", sandbox_id, "sh", "-c", f"ls -A -p {shlex.quote(path)}"
        )
        entries = []
        for line in output.splitlines():
            if not line:
                continue
            is_dir = line.endswith("/")
            name = line.rstrip("/") if is_dir else line
            entries.append(
                FileEntry(name=name, path=f"{path.rstrip('/')}/{name}", is_dir=is_dir)
            )
        return entries

    async def destroy(self, sandbox_id: str) -> None:
        await self._check("rm", "-f", sandbox_id)


sandbox_provider: SandboxProvider = (
    LocalSandboxProvider() if settings.sandbox_backend == "local" else E2BSandboxProvider()
)
