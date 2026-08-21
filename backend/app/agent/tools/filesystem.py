from typing import Any

from app.agent.tools.base import AgentTool, resolve_workspace_path
from app.services.sandbox import sandbox_provider


class ReadFileTool(AgentTool):
    name = "read_file"
    description = "Read a file's contents from the workspace."
    input_schema = {
        "type": "object",
        "properties": {"path": {"type": "string", "description": "Path relative to the workspace root."}},
        "required": ["path"],
    }

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        path = resolve_workspace_path(str(arguments["path"]))
        try:
            return await sandbox_provider.read_file(sandbox_id, path)
        except Exception as exc:
            return f"Error reading {arguments['path']}: {exc}"


class WriteFileTool(AgentTool):
    name = "write_file"
    description = "Create or overwrite a file in the workspace."
    input_schema = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Path relative to the workspace root."},
            "content": {"type": "string", "description": "Full file contents to write."},
        },
        "required": ["path", "content"],
    }

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        path = resolve_workspace_path(str(arguments["path"]))
        try:
            await sandbox_provider.write_file(sandbox_id, path, str(arguments["content"]))
            return f"Wrote {arguments['path']}"
        except Exception as exc:
            return f"Error writing {arguments['path']}: {exc}"


class ListFilesTool(AgentTool):
    name = "list_files"
    description = "List files and directories in the workspace."
    input_schema = {
        "type": "object",
        "properties": {
            "path": {
                "type": "string",
                "description": "Directory path relative to the workspace root. Defaults to the root.",
            }
        },
    }

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        path = resolve_workspace_path(str(arguments.get("path", ".")))
        try:
            entries = await sandbox_provider.list_files(sandbox_id, path)
        except Exception as exc:
            return f"Error listing {arguments.get('path', '.')}: {exc}"
        if not entries:
            return "(empty directory)"
        return "\n".join(f"{'d' if e.is_dir else 'f'} {e.name}" for e in entries)
