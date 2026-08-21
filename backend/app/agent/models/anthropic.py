from collections.abc import AsyncIterator
from typing import Any

import anthropic

from app.agent.models.base import (
    ChatMessage,
    ModelEvent,
    ModelProvider,
    TextDelta,
    ToolUseRequest,
    TurnComplete,
)
from app.config import settings
from app.services.anthropic_oauth import OAUTH_INFERENCE_HEADERS

MAX_TOKENS = 4096
CLAUDE_CODE_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude."


class AnthropicProvider(ModelProvider):
    def __init__(self, model: str | None = None, oauth_access_token: str | None = None) -> None:
        self._model = model or settings.anthropic_model
        self._oauth = bool(oauth_access_token)
        if oauth_access_token:
            # User's own Claude Pro/Max quota via their connected account —
            # see app/services/anthropic_oauth.py. An OAuth token authenticates
            # as `Authorization: Bearer`, not as an x-api-key, and sending both
            # headers makes the API reject it as an invalid key — hence
            # auth_token plus an explicit api_key=None.
            self._client = anthropic.AsyncAnthropic(
                api_key=None,
                auth_token=oauth_access_token,
                default_headers=OAUTH_INFERENCE_HEADERS,
            )
        else:
            self._client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def generate(
        self,
        messages: list[ChatMessage],
        tools: list[dict[str, Any]] | None = None,
    ) -> AsyncIterator[ModelEvent]:
        system: Any = next((m.content for m in messages if m.role == "system"), None)
        if self._oauth:
            # OAuth (Claude Code client) tokens are only accepted when the
            # CLI identity is the first system block — anything else gets
            # rejected by the API.
            system = [{"type": "text", "text": CLAUDE_CODE_IDENTITY}] + (
                [{"type": "text", "text": system}] if system else []
            )
        history = [
            {"role": m.role, "content": m.content}
            for m in messages
            if m.role in ("user", "assistant")
        ]

        kwargs: dict[str, Any] = dict(
            model=self._model, max_tokens=MAX_TOKENS, system=system, messages=history
        )
        if tools:
            kwargs["tools"] = tools

        async with self._client.messages.stream(**kwargs) as stream:
            async for event in stream:
                if event.type == "content_block_delta" and event.delta.type == "text_delta":
                    yield TextDelta(text=event.delta.text)

            final = await stream.get_final_message()

        text = "".join(b.text for b in final.content if b.type == "text")
        tool_uses = [
            ToolUseRequest(id=b.id, name=b.name, input=b.input)
            for b in final.content
            if b.type == "tool_use"
        ]
        yield TurnComplete(
            text=text,
            tool_uses=tool_uses,
            raw_content=final.content,
            usage={"input_tokens": final.usage.input_tokens, "output_tokens": final.usage.output_tokens},
        )
