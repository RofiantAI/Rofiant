"""Names a fresh conversation from its first user message."""

import json
import logging

from app.agent.models.base import ChatMessage, ModelProvider, TurnComplete
from app.agent.prompts import TITLE_PROMPT

logger = logging.getLogger(__name__)

DEFAULT_TITLE = "New bot"
MAX_TITLE_CHARS = 60
# Enough of the message for the model to know what the chat is about.
MAX_SOURCE_CHARS = 500


def _plain_text(content: str) -> str:
    """Message content is plain text, or the multimodal JSON envelope the
    composer sends with attached images — the title only uses the text."""
    try:
        parsed = json.loads(content)
    except (json.JSONDecodeError, TypeError):
        return content
    if isinstance(parsed, dict) and parsed.get("kind") == "multimodal":
        return parsed.get("text") or ""
    return content


def clean_title(raw: str) -> str:
    """Models pad titles with quotes, trailing periods, or a "Title:" prefix
    however firmly the prompt says not to — strip all of it."""
    title = raw.strip().splitlines()[0].strip() if raw.strip() else ""
    if title.lower().startswith("title:"):
        title = title[len("title:") :].strip()
    title = title.strip("\"'“”‘’ ").rstrip(".!,;:").strip()
    if len(title) > MAX_TITLE_CHARS:
        title = title[:MAX_TITLE_CHARS].rsplit(" ", 1)[0] + "…"
    return title


async def generate_title(provider: ModelProvider, first_message: str) -> str | None:
    """Best-effort — returns None if the model gives nothing usable, so a
    failed title never breaks the chat it was named for."""
    source = _plain_text(first_message).strip()[:MAX_SOURCE_CHARS]
    if not source:
        return None

    messages = [
        ChatMessage(role="system", content=TITLE_PROMPT),
        ChatMessage(role="user", content=source),
    ]
    try:
        text = ""
        async for event in provider.generate(messages):
            if isinstance(event, TurnComplete):
                text = event.text
    except Exception:
        logger.warning("Title generation failed", exc_info=True)
        return None

    return clean_title(text) or None
