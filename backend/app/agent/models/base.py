from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Literal, Union

Role = Literal["user", "assistant", "system", "tool"]


@dataclass
class ChatMessage:
    role: Role
    # str for a plain turn. list[dict] for a turn carrying raw provider
    # content blocks (tool_use / tool_result) — needed mid agent-loop to
    # round-trip a provider's native tool-call protocol verbatim.
    content: Any


@dataclass
class TextDelta:
    text: str


@dataclass
class ToolUseRequest:
    id: str
    name: str
    input: dict[str, Any]


@dataclass
class TurnComplete:
    """One full model turn: the assistant's text (if any), any tool calls it
    made, and the raw content blocks to append back to history verbatim so
    the next turn's tool_result messages line up correctly."""

    text: str
    tool_uses: list[ToolUseRequest] = field(default_factory=list)
    raw_content: Any = None
    usage: dict[str, int] | None = None


ModelEvent = Union[TextDelta, TurnComplete]


class ModelProvider(ABC):
    """Swappable AI backend. The rest of the app only ever talks to this
    interface, never to a specific provider's SDK."""

    @abstractmethod
    def generate(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[ModelEvent]:
        ...
