"""Round-trip check for the local container sandbox.

Skips itself when no container runtime is installed, so it is safe to run
anywhere: `python test_sandbox_local.py`.
"""

import asyncio
import shutil
import sys

from app.agent.tools.base import WORKSPACE_ROOT
from app.services.sandbox import LocalSandboxProvider


async def main() -> None:
    if not (shutil.which("docker") or shutil.which("podman")):
        print("skip: no docker or podman on PATH")
        return

    provider = LocalSandboxProvider()
    sandbox_id = await provider.create()
    try:
        await provider.write_file(sandbox_id, f"{WORKSPACE_ROOT}/sub/hello.txt", "hi there")
        assert await provider.read_file(sandbox_id, f"{WORKSPACE_ROOT}/sub/hello.txt") == "hi there"

        entries = await provider.list_files(sandbox_id, WORKSPACE_ROOT)
        assert [(e.name, e.is_dir) for e in entries] == [("sub", True)], entries

        result = await provider.execute(sandbox_id, "echo out; echo err >&2; exit 3")
        assert result.exit_code == 3, result
        assert result.stdout.strip() == "out", result
        assert result.stderr.strip() == "err", result

        # Commands run in the workspace, not the host.
        cwd = await provider.execute(sandbox_id, "pwd")
        assert cwd.stdout.strip() == WORKSPACE_ROOT, cwd

        try:
            await provider.execute(sandbox_id, "sleep 5", timeout=1)
            raise AssertionError("expected timeout")
        except TimeoutError:
            pass
    finally:
        await provider.destroy(sandbox_id)

    print("ok")


if __name__ == "__main__":
    asyncio.run(main())
    sys.exit(0)
