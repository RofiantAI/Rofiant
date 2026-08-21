from app.agent.tools.base import AgentTool
from app.agent.tools.filesystem import ListFilesTool, ReadFileTool, WriteFileTool
from app.agent.tools.git import GitDiffTool, GitStatusTool
from app.agent.tools.terminal import TerminalTool

ALL_TOOLS: list[AgentTool] = [
    ReadFileTool(),
    WriteFileTool(),
    ListFilesTool(),
    TerminalTool(),
    GitStatusTool(),
    GitDiffTool(),
]

TOOLS_BY_NAME: dict[str, AgentTool] = {tool.name: tool for tool in ALL_TOOLS}
