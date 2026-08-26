from typing import Any

from app.agent.tools.base import AgentTool

# These run on the user's real computer via the desktop app (Tauri), not the
# E2B sandbox -- see run_client_tool in app/api/messages.py. execute() is
# never called for a client_executed tool; it exists only to satisfy
# AgentTool's abstract interface.
_NOT_SERVER_EXECUTED = "This tool runs on the client and has no server-side implementation."


class LocalReadFileTool(AgentTool):
    name = "local_read_file"
    description = (
        "Read a file from the user's own computer (not the sandbox workspace). "
        "Takes an absolute path, e.g. /home/user/Documents/notes.txt or "
        "C:\\Users\\user\\Documents\\notes.txt."
    )
    input_schema = {
        "type": "object",
        "properties": {"path": {"type": "string", "description": "Absolute path on the user's computer."}},
        "required": ["path"],
    }
    client_executed = True

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        raise NotImplementedError(_NOT_SERVER_EXECUTED)


class LocalWriteFileTool(AgentTool):
    name = "local_write_file"
    description = (
        "Create or overwrite a file on the user's own computer (not the sandbox workspace). "
        "Takes an absolute path."
    )
    input_schema = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Absolute path on the user's computer."},
            "content": {"type": "string", "description": "Full file contents to write."},
        },
        "required": ["path", "content"],
    }
    client_executed = True

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        raise NotImplementedError(_NOT_SERVER_EXECUTED)


class LocalListDirTool(AgentTool):
    name = "local_list_dir"
    description = (
        "List files and directories at an absolute path on the user's own computer "
        "(not the sandbox workspace)."
    )
    input_schema = {
        "type": "object",
        "properties": {"path": {"type": "string", "description": "Absolute directory path on the user's computer."}},
        "required": ["path"],
    }
    client_executed = True

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        raise NotImplementedError(_NOT_SERVER_EXECUTED)
