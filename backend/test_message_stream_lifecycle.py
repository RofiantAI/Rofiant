"""Regression checks for agent-run cleanup and persistence ordering."""

import asyncio
from uuid import uuid4

import pytest

from app.agent.models.base import TurnComplete
from app.api import messages
from app.api.auth import AuthContext


class Result:
    def __init__(self, data=None):
        self.data = data

    def execute(self):
        return self


class Table:
    def __init__(self, name, log):
        self.name = name
        self.log = log

    def select(self, *_): return self
    def eq(self, *_): return self
    def order(self, *_): return self

    def execute(self):
        if self.name == "messages":
            return Result([{"role": "user", "content": "hello"}])
        if self.name == "conversations":
            return Result([{"title": "Existing", "persona": "agent", "personas": None}])
        if self.name == "skills":
            return Result([])
        return Result([])

    def insert(self, _row):
        self.log.append(f"insert:{self.name}")
        return self

    def update(self, _row): return self


class Client:
    def __init__(self, log):
        self.log = log

    def table(self, name):
        return Table(name, self.log)


class Admin(Client):
    def __init__(self, log, fail_claim=False):
        super().__init__(log)
        self.fail_claim = fail_claim

    def rpc(self, name, _args):
        if name == "claim_conversation_run" and self.fail_claim:
            raise RuntimeError("database unavailable")
        self.log.append(f"rpc:{name}")
        return Result(True)


class Provider:
    def __init__(self):
        self.closed = False

    async def generate(self, _messages, tools=None):
        yield TurnComplete(text="done", raw_content=[])

    async def close(self):
        self.closed = True


def setup(monkeypatch, *, fail_claim=False):
    log = []
    provider = Provider()
    monkeypatch.setattr(messages, "get_user_client", lambda _token: Client(log))
    monkeypatch.setattr(messages, "get_admin_client", lambda: Admin(log, fail_claim))
    monkeypatch.setattr(messages, "OpenRouterProvider", lambda model=None: provider)
    messages._active_runs.clear()
    body = messages.StreamRequest(conversation_id=uuid4(), model="test:free")
    auth = AuthContext(user_id=str(uuid4()), email=None, access_token="token")
    return log, provider, body, auth


def test_claim_failure_releases_local_lock_and_provider(monkeypatch):
    _log, provider, body, auth = setup(monkeypatch, fail_claim=True)
    with pytest.raises(RuntimeError, match="database unavailable"):
        asyncio.run(messages.stream_reply(body, auth))
    assert not messages._active_runs
    assert provider.closed


def test_completion_is_persisted_before_it_is_streamed(monkeypatch):
    log, provider, body, auth = setup(monkeypatch)

    async def consume():
        response = await messages.stream_reply(body, auth)
        saw_completion = False
        async for chunk in response.body_iterator:
            if "event: assistant.completed" in chunk:
                saw_completion = True
                assert "insert:messages" in log
        return saw_completion

    assert asyncio.run(consume())
    assert provider.closed
    assert not messages._active_runs
