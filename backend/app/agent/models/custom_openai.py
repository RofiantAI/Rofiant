import json
from collections.abc import AsyncIterator
from typing import Any

import httpx

from app.agent.models.base import ChatMessage, ModelEvent, ModelProvider, TextDelta, ToolUseRequest, TurnComplete
from app.agent.models.openrouter import _messages_to_openai, _tools_to_openai


class CustomOpenAIProvider(ModelProvider):
    """A user's own OpenAI-compatible endpoint (self-hosted, third-party,
    anything speaking the /chat/completions schema). Same request/response
    shape as OpenRouterProvider, just pointed at a user-supplied
    base_url/api_key/model instead of the app's OpenRouter key."""

    def __init__(self, base_url: str, api_key: str, model: str) -> None:
        self._model = model
        self._url = base_url.rstrip("/") + "/chat/completions"
        self._client = httpx.AsyncClient(headers={"Authorization": f"Bearer {api_key}"}, timeout=120)

    async def generate(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[ModelEvent]:
        payload: dict[str, Any] = {"model": self._model, "messages": _messages_to_openai(messages)}
        if tools:
            payload["tools"] = _tools_to_openai(tools)

        resp = await self._client.post(self._url, json=payload)
        resp.raise_for_status()
        body = resp.json()
        if "choices" not in body:
            message = (body.get("error") or {}).get("message") or "Custom provider returned no response"
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

    async def close(self) -> None:
        await self._client.aclose()
