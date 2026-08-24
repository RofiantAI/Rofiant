import asyncio
import json
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Any

from app.agent.tools.base import WORKSPACE_ROOT
from app.services.sandbox import sandbox_provider

MIRROR_ROOT = Path(tempfile.gettempdir()) / "KiroBot-lsp"

# Language servers speak newline-agnostic stdio JSON-RPC (LSP's own
# Content-Length framing), not the browser's WebSocket framing — the WS
# bridge below translates between the two, one JSON-RPC message per side.
LANGUAGE_SERVERS: dict[str, list[str]] = {
    "python": ["pyright-langserver", "--stdio"],
    "typescript": ["typescript-language-server", "--stdio"],
}


def _resolve_command(argv: list[str]) -> list[str]:
    """`uv run` puts the venv's bin/ on PATH for this process, but a plain
    `uvicorn` launch may not — fall back to the venv's own bin/ next to the
    running interpreter so pyright-langserver still resolves either way."""
    exe = argv[0]
    found = shutil.which(exe) or str(Path(sys.executable).parent / exe)
    return [found, *argv[1:]]


def mirror_dir(conversation_id: str) -> Path:
    return MIRROR_ROOT / conversation_id


async def sync_workspace_mirror(conversation_id: str, sandbox_id: str) -> Path:
    """Language servers need real files on local disk to resolve imports
    across a project — the sandbox filesystem lives in a remote E2B VM, so
    this pulls a full local copy once per LSP session before the server
    starts. ponytail: one-shot snapshot, not a live watch — an edit the
    agent makes mid-session won't show up until the editor reopens."""
    root = mirror_dir(conversation_id)
    if root.exists():
        shutil.rmtree(root)
    root.mkdir(parents=True)

    async def walk(sandbox_path: str) -> None:
        entries = await sandbox_provider.list_files(sandbox_id, sandbox_path)
        for entry in entries:
            rel = entry.path[len(WORKSPACE_ROOT):].lstrip("/")
            local_path = root / rel
            if entry.is_dir:
                local_path.mkdir(parents=True, exist_ok=True)
                await walk(entry.path)
            else:
                local_path.parent.mkdir(parents=True, exist_ok=True)
                content = await sandbox_provider.read_file(sandbox_id, entry.path)
                local_path.write_text(content)

    await walk(WORKSPACE_ROOT)
    return root


def sync_file_to_mirror(conversation_id: str, workspace_path: str, content: str) -> None:
    """Keeps the local mirror in sync when a save happens through the plain
    file-content API, so a language server with a session already open still
    resolves the new content for cross-file lookups."""
    root = mirror_dir(conversation_id)
    if not root.exists():
        return
    rel = workspace_path.lstrip("/")
    local_path = root / rel
    local_path.parent.mkdir(parents=True, exist_ok=True)
    local_path.write_text(content)


async def spawn_language_server(language: str) -> asyncio.subprocess.Process:
    argv = LANGUAGE_SERVERS.get(language)
    if not argv:
        raise ValueError(f"No language server configured for {language!r}")
    return await asyncio.create_subprocess_exec(
        *_resolve_command(argv),
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )


async def read_lsp_message(stream: asyncio.StreamReader) -> dict[str, Any] | None:
    """Parses one `Content-Length: N\\r\\n\\r\\n<N bytes of JSON>` frame from
    a language server's stdout. Returns None at EOF."""
    content_length: int | None = None
    while True:
        line = await stream.readline()
        if not line:
            return None
        line = line.strip()
        if not line:
            break
        if line.lower().startswith(b"content-length:"):
            content_length = int(line.split(b":", 1)[1].strip())
    if content_length is None:
        return None
    body = await stream.readexactly(content_length)
    return json.loads(body)


def write_lsp_message(stream: asyncio.StreamWriter, message: dict[str, Any]) -> None:
    body = json.dumps(message).encode("utf-8")
    stream.write(f"Content-Length: {len(body)}\r\n\r\n".encode("ascii") + body)
