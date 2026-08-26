import asyncio
import functools

import httpx

from app.agent.tools.composio import ComposioActionTool, ComposioConnectAccountTool

_RealAsyncClient = httpx.AsyncClient


def _mock_client(handler):
    return functools.partial(_RealAsyncClient, transport=httpx.MockTransport(handler))


def test_missing_api_key_returns_error(monkeypatch):
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_api_key", None)
    result = asyncio.run(ComposioActionTool().execute("sandbox", {"slug": "GMAIL_SEND_EMAIL", "arguments": {}}))
    assert "not configured" in result or "isn't configured" in result


def test_successful_action_returns_data(monkeypatch):
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_api_key", "test-key")
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_user_id", "u1")

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/v3.1/tools/execute/GMAIL_SEND_EMAIL"
        assert request.headers["x-api-key"] == "test-key"
        return httpx.Response(200, json={"successful": True, "data": {"sent": True}})

    monkeypatch.setattr(httpx, "AsyncClient", _mock_client(handler))

    result = asyncio.run(
        ComposioActionTool().execute("sandbox", {"slug": "GMAIL_SEND_EMAIL", "arguments": {"to": "a@b.com"}})
    )
    assert "sent" in result


def test_failed_action_returns_error(monkeypatch):
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_api_key", "test-key")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"successful": False, "error": "no connected account"})

    monkeypatch.setattr(httpx, "AsyncClient", _mock_client(handler))

    result = asyncio.run(ComposioActionTool().execute("sandbox", {"slug": "GMAIL_SEND_EMAIL", "arguments": {}}))
    assert "no connected account" in result


def test_connect_reuses_existing_enabled_auth_config(monkeypatch):
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_api_key", "test-key")
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_user_id", "u1")
    calls = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append((request.method, request.url.path))
        if request.url.path == "/api/v3.1/auth_configs" and request.method == "GET":
            return httpx.Response(200, json={"items": [{"id": "ac_existing", "status": "ENABLED"}]})
        if request.url.path == "/api/v3.1/connected_accounts/link":
            return httpx.Response(200, json={"redirect_url": "https://connect.composio.dev/link/xyz"})
        raise AssertionError(f"unexpected call: {request.method} {request.url.path}")

    monkeypatch.setattr(httpx, "AsyncClient", _mock_client(handler))

    result = asyncio.run(ComposioConnectAccountTool().execute("sandbox", {"toolkit": "gmail"}))
    assert "https://connect.composio.dev/link/xyz" in result
    assert ("POST", "/api/v3.1/auth_configs") not in calls


def test_connect_creates_auth_config_when_none_exists(monkeypatch):
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_api_key", "test-key")
    monkeypatch.setattr("app.agent.tools.composio.settings.composio_user_id", "u1")

    def handler(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/v3.1/auth_configs" and request.method == "GET":
            return httpx.Response(200, json={"items": []})
        if request.url.path == "/api/v3.1/auth_configs" and request.method == "POST":
            return httpx.Response(201, json={"auth_config": {"id": "ac_new"}})
        if request.url.path == "/api/v3.1/connected_accounts/link":
            return httpx.Response(200, json={"redirect_url": "https://connect.composio.dev/link/new"})
        raise AssertionError(f"unexpected call: {request.method} {request.url.path}")

    monkeypatch.setattr(httpx, "AsyncClient", _mock_client(handler))

    result = asyncio.run(ComposioConnectAccountTool().execute("sandbox", {"toolkit": "gmail"}))
    assert "https://connect.composio.dev/link/new" in result
