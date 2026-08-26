import asyncio
from types import SimpleNamespace

from app.agent import runner
from app.agent.models.base import ModelProvider, ToolUseRequest, TurnComplete
from app.main import _rate_limit_key
from app.rate_limit import RateLimiter


def test_sliding_window_limit_and_client_cap():
    limiter = RateLimiter(limit=2, window_seconds=10, max_clients=2)

    assert limiter.retry_after("alice", now=0) is None
    assert limiter.retry_after("alice", now=1) is None
    assert limiter.retry_after("alice", now=2) == 8
    assert limiter.retry_after("alice", now=10) is None

    assert limiter.retry_after("bob", now=10) is None
    assert limiter.retry_after("carol", now=10) is None
    assert len(limiter._requests) == 2


def test_authenticated_rate_limit_key_does_not_share_proxy_or_store_token():
    token = "Bearer secret"
    alice = SimpleNamespace(headers={"authorization": token}, client=SimpleNamespace(host="proxy"))
    bob = SimpleNamespace(headers={"authorization": "Bearer other"}, client=SimpleNamespace(host="proxy"))

    assert _rate_limit_key(alice) != _rate_limit_key(bob)
    assert token not in _rate_limit_key(alice)


def test_web_search_limit_is_per_user(monkeypatch):
    calls = 0

    class SearchTool:
        async def execute(self, _sandbox_id, _arguments):
            nonlocal calls
            calls += 1
            return "result"

    class Provider(ModelProvider):
        def __init__(self):
            self.turn = 0

        async def generate(self, _messages, tools=None):
            self.turn += 1
            if self.turn == 1:
                yield TurnComplete(
                    text="",
                    tool_uses=[ToolUseRequest("search", "web_search", {"query": "news"})],
                    raw_content=[],
                )
            else:
                yield TurnComplete(text="done", raw_content=[])

    monkeypatch.setitem(runner.TOOLS_BY_NAME, "web_search", SearchTool())
    monkeypatch.setattr(runner, "web_search_limiter", RateLimiter(limit=1, window_seconds=60))

    async def run(user_id):
        return [
            event
            async for event in runner.run_agent(
                history=[],
                provider=Provider(),
                get_sandbox_id=lambda: asyncio.sleep(0, result="sandbox"),
                user_id=user_id,
            )
        ]

    assert all(event.type != "tool.failed" for event in asyncio.run(run("alice")))
    assert any(event.type == "tool.failed" for event in asyncio.run(run("alice")))
    assert all(event.type != "tool.failed" for event in asyncio.run(run("bob")))
    assert calls == 2
