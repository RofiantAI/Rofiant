"""Self-check for the Claude OAuth token cache: run with `uv run python test_anthropic_oauth.py`."""

import asyncio
from datetime import datetime, timedelta, timezone

import httpx

from app.services import anthropic_oauth


class FakeTable:
    def __init__(self, store):
        self.store = store

    def select(self, *_):
        return self

    def eq(self, *_):
        return self

    def execute(self):
        return type("Resp", (), {"data": self.store["rows"]})()

    def upsert(self, row, on_conflict=None):
        self.store["upserted"] = row
        self.store["rows"] = [row]
        return self

    def delete(self):
        self.store["rows"] = []
        self.store["deleted"] = True
        return self


class FakeClient:
    def __init__(self, rows):
        self.store = {"rows": rows, "upserted": None}

    def table(self, _name):
        return FakeTable(self.store)


def iso(delta_seconds: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(seconds=delta_seconds)).isoformat()


async def main():
    # Not connected.
    assert await anthropic_oauth.get_access_token(FakeClient([]), "u1") is None

    # Valid token is used as-is, no refresh call.
    client = FakeClient([{"access_token": "live", "refresh_token": "r", "expires_at": iso(3600)}])
    assert await anthropic_oauth.get_access_token(client, "u1") == "live"
    assert client.store["upserted"] is None

    # Expired token refreshes and persists the new one.
    async def fake_refresh(refresh_token):
        assert refresh_token == "r"
        return {"access_token": "fresh", "expires_in": 3600}

    anthropic_oauth.refresh_access_token = fake_refresh
    client = FakeClient([{"access_token": "stale", "refresh_token": "r", "expires_at": iso(-10)}])
    assert await anthropic_oauth.get_access_token(client, "u1") == "fresh"
    assert client.store["upserted"]["access_token"] == "fresh"
    # Provider kept the old refresh token when it didn't issue a new one.
    assert client.store["upserted"]["refresh_token"] == "r"

    # Expired with nothing to refresh from: dead row gets cleared, not left
    # around looking "connected".
    client = FakeClient([{"access_token": "stale", "refresh_token": None, "expires_at": iso(-10)}])
    assert await anthropic_oauth.get_access_token(client, "u1") is None
    assert client.store["rows"] == []

    # Refresh token revoked server-side: same cleanup, no crash.
    async def fake_refresh_rejected(refresh_token):
        request = httpx.Request("POST", "https://example.invalid")
        response = httpx.Response(401, request=request)
        raise httpx.HTTPStatusError("revoked", request=request, response=response)

    anthropic_oauth.refresh_access_token = fake_refresh_rejected
    client = FakeClient([{"access_token": "stale", "refresh_token": "r", "expires_at": iso(-10)}])
    assert await anthropic_oauth.get_access_token(client, "u1") is None
    assert client.store["rows"] == []

    print("ok")


if __name__ == "__main__":
    asyncio.run(main())
