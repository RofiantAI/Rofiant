import json
from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from app.agent.models.base import ChatMessage, ModelProvider, TextDelta, TurnComplete
from app.agent.prompts import SYSTEM_PROMPT
from app.agent.tools import ALL_TOOLS, TOOLS_BY_NAME

# Protections against runaway agent loops (spec: max_steps, max_tool_calls).
# ponytail: no wall-clock max_runtime yet — add if a run ever needs killing
# mid-stream rather than just bounded by step/call count.
MAX_STEPS = 8
# Hard ceiling a client-supplied max_steps is clamped to.
MAX_STEPS_CEILING = 16
MAX_TOOL_CALLS = 20


@dataclass
class RunnerEvent:
    type: str
    data: dict[str, Any]


def _decode_content(raw: str) -> Any:
    """A message's stored content is plain text, except when the client
    attached images — then it's a `{"kind": "multimodal", ...}` JSON
    envelope (see MessageInput's upload flow). Decode that shape into
    Anthropic-style content blocks, the in-memory representation every
    ModelProvider is expected to understand for image/text history."""
    try:
        parsed = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return raw
    if not isinstance(parsed, dict) or parsed.get("kind") != "multimodal":
        return raw

    images = parsed.get("images")
    if not isinstance(images, list):
        return raw
    blocks: list[dict[str, Any]] = []
    for img in images:
        if not isinstance(img, dict) or not isinstance(img.get("media_type"), str) or not isinstance(img.get("data"), str):
            return raw
        blocks.append({
            "type": "image",
            "source": {"type": "base64", "media_type": img["media_type"], "data": img["data"]},
        })
    if parsed.get("text"):
        blocks.append({"type": "text", "text": parsed["text"]})
    return blocks


async def run_agent(
    *,
    history: list[dict[str, str]],
    provider: ModelProvider,
    get_sandbox_id: Callable[[], Awaitable[str]],
    max_steps: int = MAX_STEPS,
    system_prompt: str = SYSTEM_PROMPT,
    approve_tool: Callable[[str, str, dict[str, Any]], Awaitable[bool]] | None = None,
) -> AsyncIterator[RunnerEvent]:
    """The agent loop: ask the model, run any tools it requests, feed the
    results back, repeat until it stops asking for tools or a limit hits.
    `get_sandbox_id` is only called the first time a tool is actually
    requested, so pure-chat conversations never spin up a sandbox.
    """
    messages: list[ChatMessage] = [ChatMessage(role="system", content=system_prompt)]
    messages += [ChatMessage(role=m["role"], content=_decode_content(m["content"])) for m in history]

    tool_schemas = [t.to_schema() for t in ALL_TOOLS]
    sandbox_id: str | None = None
    tool_call_count = 0
    last_turn: TurnComplete | None = None
    total_input_tokens = 0
    total_output_tokens = 0

    for _ in range(max(1, min(max_steps, MAX_STEPS_CEILING))):
        turn: TurnComplete | None = None
        async for event in provider.generate(messages, tools=tool_schemas):
            if isinstance(event, TextDelta):
                yield RunnerEvent("assistant.delta", {"text": event.text})
            elif isinstance(event, TurnComplete):
                turn = event

        if turn is None:
            break
        last_turn = turn
        if turn.usage:
            total_input_tokens += turn.usage.get("input_tokens", 0)
            total_output_tokens += turn.usage.get("output_tokens", 0)
        messages.append(ChatMessage(role="assistant", content=turn.raw_content))

        if not turn.tool_uses:
            yield RunnerEvent(
                "assistant.completed",
                {
                    "content": turn.text,
                    "usage": {"input_tokens": total_input_tokens, "output_tokens": total_output_tokens},
                },
            )
            return

        if sandbox_id is None:
            sandbox_id = await get_sandbox_id()
            yield RunnerEvent("workspace.created", {"sandbox_id": sandbox_id})

        tool_results = []
        for tool_use in turn.tool_uses:
            if tool_call_count >= MAX_TOOL_CALLS:
                result_text = "Tool call limit reached for this run."
                yield RunnerEvent(
                    "tool.failed",
                    {"id": tool_use.id, "tool": tool_use.name, "arguments": tool_use.input, "error": result_text},
                )
            else:
                tool_call_count += 1
                tool = TOOLS_BY_NAME.get(tool_use.name)
                yield RunnerEvent(
                    "tool.started", {"id": tool_use.id, "tool": tool_use.name, "arguments": tool_use.input}
                )
                if tool is None:
                    result_text = f"Unknown tool: {tool_use.name}"
                    yield RunnerEvent(
                        "tool.failed",
                        {"id": tool_use.id, "tool": tool_use.name, "arguments": tool_use.input, "error": result_text},
                    )
                else:
                    try:
                        approved = approve_tool is None or await approve_tool(
                            tool_use.id, tool_use.name, tool_use.input
                        )
                        if not approved:
                            result_text = "User denied this tool call."
                            yield RunnerEvent(
                                "tool.failed",
                                {"id": tool_use.id, "tool": tool_use.name, "arguments": tool_use.input, "error": result_text},
                            )
                        else:
                            result_text = await tool.execute(sandbox_id, tool_use.input)
                            yield RunnerEvent(
                                "tool.completed",
                                {
                                    "id": tool_use.id,
                                    "tool": tool_use.name,
                                    "arguments": tool_use.input,
                                    "result": result_text,
                                },
                            )
                    except Exception as exc:
                        result_text = f"Error: {exc}"
                        yield RunnerEvent(
                            "tool.failed",
                            {"id": tool_use.id, "tool": tool_use.name, "arguments": tool_use.input, "error": result_text},
                        )

            tool_results.append(
                {"type": "tool_result", "tool_use_id": tool_use.id, "content": result_text}
            )

        messages.append(ChatMessage(role="user", content=tool_results))

    # Step limit hit mid-tool-use: last_turn.text is empty (the model's last
    # turn was tool calls, no closing text). An empty content string would
    # persist as a permanently blank bubble, so fall back to a visible note.
    content = (last_turn.text if last_turn else "") or "Hit the step limit before finishing a reply."
    yield RunnerEvent(
        "assistant.completed",
        {
            "content": content,
            "usage": {"input_tokens": total_input_tokens, "output_tokens": total_output_tokens},
        },
    )
