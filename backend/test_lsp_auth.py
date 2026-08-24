import asyncio
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.api import lsp


class StopAfterAuth(Exception):
    pass


class WebSocket:
    def __init__(self, query_token=None):
        self.query_params = {"token": query_token} if query_token else {}
        self.accepted = False
        self.auth_frame = {"type": "auth", "token": "frame-token"}

    async def accept(self):
        self.accepted = True

    async def receive_json(self):
        return self.auth_frame

    async def close(self, **_kwargs):
        pass


@pytest.mark.parametrize(
    "query_token, expected", [("query-token", "query-token"), (None, "frame-token")]
)
def test_lsp_accepts_old_and_new_auth(monkeypatch, query_token, expected):
    seen = []
    websocket = WebSocket(query_token)

    monkeypatch.setattr(
        lsp,
        "verify_jwt",
        lambda token: seen.append(token)
        or SimpleNamespace(user_id="user", access_token=token),
    )
    monkeypatch.setattr(lsp, "get_user_client", lambda _token: object())
    monkeypatch.setattr(lsp.lsp_connection_limiter, "retry_after", lambda _user: None)

    async def sandbox_id(_client, _conversation_id):
        return "sandbox"

    async def stop_after_auth(*_args):
        raise StopAfterAuth

    monkeypatch.setattr(lsp, "_sandbox_id_for", sandbox_id)
    monkeypatch.setattr(lsp, "sync_workspace_mirror", stop_after_auth)

    with pytest.raises(StopAfterAuth):
        asyncio.run(lsp.lsp_bridge(websocket, uuid4(), "python"))

    assert seen == [expected]
    assert websocket.accepted
