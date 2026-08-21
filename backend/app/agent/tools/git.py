from typing import Any

from app.agent.tools.base import WORKSPACE_ROOT, AgentTool
from app.services.sandbox import sandbox_provider


class GitStatusTool(AgentTool):
    name = "git_status"
    description = "Show the working tree status of the workspace's git repository."
    input_schema = {"type": "object", "properties": {}}

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        result = await sandbox_provider.execute(sandbox_id, "git status", cwd=WORKSPACE_ROOT)
        return result.stdout or result.stderr or "(no output)"


class GitDiffTool(AgentTool):
    name = "git_diff"
    description = "Show uncommitted changes in the workspace's git repository."
    input_schema = {"type": "object", "properties": {}}

    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        result = await sandbox_provider.execute(sandbox_id, "git diff", cwd=WORKSPACE_ROOT)
        return result.stdout or result.stderr or "(no changes)"
