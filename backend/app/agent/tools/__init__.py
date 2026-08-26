from app.agent.tools.base import AgentTool
from app.agent.tools.composio import ComposioActionTool, ComposioConnectAccountTool
from app.agent.tools.filesystem import ListFilesTool, ReadFileTool, WriteFileTool
from app.agent.tools.git import GitDiffTool, GitStatusTool
from app.agent.tools.local_fs import LocalListDirTool, LocalReadFileTool, LocalWriteFileTool
from app.agent.tools.terminal import TerminalTool
from app.agent.tools.web_search import WebSearchTool
from app.config import settings

ALL_TOOLS: list[AgentTool] = [
    ReadFileTool(),
    WriteFileTool(),
    ListFilesTool(),
    TerminalTool(),
    GitStatusTool(),
    GitDiffTool(),
    WebSearchTool(),
    LocalReadFileTool(),
    LocalWriteFileTool(),
    LocalListDirTool(),
]
if settings.composio_api_key:
    ALL_TOOLS.append(ComposioActionTool())
    ALL_TOOLS.append(ComposioConnectAccountTool())

TOOLS_BY_NAME: dict[str, AgentTool] = {tool.name: tool for tool in ALL_TOOLS}
