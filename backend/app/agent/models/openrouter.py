import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.agent.models.base import (
    ChatMessage,
    ModelEvent,
    ModelProvider,
    TextDelta,
    ToolUseRequest,
    TurnComplete,
)
from app.config import settings

API_URL = "https://openrouter.ai/api/v1/chat/completions"


def _tools_to_openai(tools: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t["description"],
                "parameters": t["input_schema"],
            },
        }
        for t in tools
    ]


def _messages_to_openai(messages: list[ChatMessage]) -> list[dict[str, Any]]:
    """Runner-shared history uses Anthropic-shaped tool blocks (content-block
    lists for tool_result, raw SDK content for assistant turns). This
    provider owns both directions of that translation: it reads history
    other providers may have written in that shape, and it writes its own
    `raw_content` (an OpenAI-shaped assistant message dict, see `generate`)
    back in a form it can read again next turn."""
    out: list[dict[str, Any]] = []
    for m in messages:
        if m.role == "assistant" and isinstance(m.content, dict):
            out.append(m.content)
        elif m.role == "user" and isinstance(m.content, list) and m.content and m.content[0].get("type") == "tool_result":
            for block in m.content:
                out.append(
                    {
                        "role": "tool",
                        "tool_call_id": block["tool_use_id"],
                        "content": block["content"],
                    }
                )
        elif m.role == "user" and isinstance(m.content, list):
            # Anthropic-shape text/image blocks (see runner._decode_content) —
            # most free OpenRouter models aren't vision-capable and will
            # ignore or reject the image part; the text still gets through.
            out.append(
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": b["text"]}
                        if b["type"] == "text"
                        else {
                            "type": "image_url",
                            "image_url": {"url": f"data:{b['source']['media_type']};base64,{b['source']['data']}"},
                        }
                        for b in m.content
                    ],
                }
            )
        else:
            out.append({"role": m.role, "content": m.content})
    return out


class OpenRouterProvider(ModelProvider):
    """Free-tier fallback for users with no provider of their own linked.
    ponytail: non-streaming — OpenRouter's SSE tool-call deltas arrive as
    fragmented JSON needing cross-chunk accumulation, not worth the fragility
    for a fallback tier. Upgrade to streaming if free-tier UX needs it."""

    def __init__(self, model: str | None = None) -> None:
        self._model = model or settings.openrouter_model
        self._client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {settings.openrouter_api_key}"},
            timeout=120,
        )

    async def generate(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[ModelEvent]:
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": _messages_to_openai(messages),
        }
        if tools:
            payload["tools"] = _tools_to_openai(tools)

        resp = await self._client.post(API_URL, json=payload)
        resp.raise_for_status()
        body = resp.json()
        # OpenRouter can 200 with an error envelope instead of a real
        # completion (model overloaded, moderation, etc) — surface that
        # message instead of a bare KeyError on "choices".
        if "choices" not in body:
            message = (body.get("error") or {}).get("message") or "OpenRouter returned no response"
            raise RuntimeError(message)
        choice = body["choices"][0]["message"]
        raw_usage = body.get("usage") or {}

        text = choice.get("content") or ""
        if text:
            yield TextDelta(text=text)

        raw_tool_calls = choice.get("tool_calls") or []
        tool_uses = [
            ToolUseRequest(
                id=tc["id"],
                name=tc["function"]["name"],
                input=json.loads(tc["function"]["arguments"] or "{}"),
            )
            for tc in raw_tool_calls
        ]

        raw_content: dict[str, Any] = {"role": "assistant", "content": choice.get("content")}
        if raw_tool_calls:
            raw_content["tool_calls"] = raw_tool_calls

        yield TurnComplete(
            text=text,
            tool_uses=tool_uses,
            raw_content=raw_content,
            usage={
                "input_tokens": raw_usage.get("prompt_tokens", 0),
                "output_tokens": raw_usage.get("completion_tokens", 0),
            },
        )
