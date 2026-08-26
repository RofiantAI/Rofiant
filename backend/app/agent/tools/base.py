from abc import ABC, abstractmethod
from typing import Any

WORKSPACE_ROOT = "/home/user/workspace"


def resolve_workspace_path(path: str) -> str:
    """Join a tool-supplied path onto the workspace root and reject anything
    that escapes it (path traversal, absolute paths outside the workspace)."""
    import posixpath

    normalized = posixpath.normpath(path)
    already_rooted = normalized == WORKSPACE_ROOT or normalized.startswith(WORKSPACE_ROOT + "/")
    joined = normalized if already_rooted else posixpath.normpath(
        posixpath.join(WORKSPACE_ROOT, path.lstrip("/"))
    )
    if joined != WORKSPACE_ROOT and not joined.startswith(WORKSPACE_ROOT + "/"):
        raise ValueError(f"Path escapes the workspace: {path}")
    return joined


class AgentTool(ABC):
    name: str
    description: str
    input_schema: dict[str, Any]
    # True for tools that run on the user's own machine (via the desktop
    # app) instead of the E2B sandbox -- the backend has no way to execute
    # these itself, so the runner dispatches them to run_client_tool instead
    # of calling execute().
    client_executed: bool = False

    @abstractmethod
    async def execute(self, sandbox_id: str, arguments: dict[str, Any]) -> str:
        """Runs the tool and returns a plain-text result for the model."""

    def to_schema(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }
