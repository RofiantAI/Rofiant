"""Self-check for chat-title cleanup: run with `uv run python test_title.py`."""

import asyncio
import json

from app.agent.models.base import TextDelta, TurnComplete
from app.agent.title import MAX_TITLE_CHARS, clean_title, generate_title


class FakeProvider:
    def __init__(self, text: str):
        self.text = text
        self.seen: str | None = None

    async def generate(self, messages, tools=None):
        self.seen = messages[-1].content
        yield TextDelta(text=self.text)
        yield TurnComplete(text=self.text)


class FailingProvider:
    async def generate(self, messages, tools=None):
        raise RuntimeError("model down")
        yield  # pragma: no cover - generator marker


def main():
    assert clean_title('"Fix the OAuth flow"') == "Fix the OAuth flow"
    assert clean_title("Title: Renaming chats.") == "Renaming chats"
    assert clean_title("Deploy plan\nand some rambling after") == "Deploy plan"
    assert clean_title("   ") == ""
    long = clean_title("word " * 40)
    assert len(long) <= MAX_TITLE_CHARS + 1 and long.endswith("…"), long

    # Multimodal envelopes contribute their text, not their base64 payload.
    provider = FakeProvider("Resizing an image")
    envelope = json.dumps({"kind": "multimodal", "text": "how do I resize this?", "images": [{"data": "AAAA"}]})
    assert asyncio.run(generate_title(provider, envelope)) == "Resizing an image"
    assert provider.seen == "how do I resize this?"

    # Nothing usable -> no title rather than a bad one.
    assert asyncio.run(generate_title(FakeProvider("  "), "hello")) is None
    assert asyncio.run(generate_title(FakeProvider("Anything"), "")) is None
    assert asyncio.run(generate_title(FailingProvider(), "hello")) is None

    print("ok")


if __name__ == "__main__":
    main()
