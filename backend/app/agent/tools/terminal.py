from typing import Any

from app.agent.tools.base import WORKSPACE_ROOT, AgentTool
from app.services.sandbox import sandbox_provider

# ponytail: no allowlist yet — the sandbox's own isolation (E2B: ephemeral VM,
# no host access, no secrets) is the actual safety boundary for now. Add a
# command allowlist/denylist here if the sandbox boundary alone isn't enough.
COMMAND_TIMEOUT_SECONDS = 30


class TerminalTool(AgentTool):
    name = "terminal"
    description = "Run a shell command in the workspace's sandbox."
    input_schema = {
        "type": "object",
        "properties": {"command": {"type": "string", "description": "Shell command to run."}},
        "required": ["command"],
    }

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        command = str(arguments["command"])
        try:
            result = await sandbox_provider.execute(
                sandbox_id, command, cwd=WORKSPACE_ROOT, timeout=COMMAND_TIMEOUT_SECONDS
            )
        except Exception as exc:
            return f"Error running command: {exc}"

        parts = [f"$ {command}", f"exit code: {result.exit_code}"]
        if result.stdout:
            parts.append(result.stdout)
        if result.stderr:
            parts.append(f"stderr:\n{result.stderr}")
        return "\n".join(parts)
