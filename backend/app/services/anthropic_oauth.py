"""Claude Pro/Max sign-in via Anthropic's Claude Code OAuth client.

This is NOT a published third-party OAuth integration — it reuses the
client_id Anthropic issued to their own Claude Code CLI, the same way several
community tools (opencode, openclaw) do. It gives a user's own subscription
quota to their own self-hosted backend; it is not a security exploit against
Anthropic or other users. But it is unofficial: Anthropic could rotate the
client_id or start rejecting non-CLI user agents at any time, which would
break this without warning. Endpoints/headers below verified against
community documentation of the real Claude Code client as of 2026-08.
"""

import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import httpx

AUTHORIZE_URL = "https://claude.ai/oauth/authorize"
# console.anthropic.com moved to platform.claude.com; the old host now 404s
# on /v1/oauth/token and 301s the callback path.
TOKEN_URL = "https://platform.claude.com/v1/oauth/token"
REDIRECT_URI = "https://platform.claude.com/oauth/code/callback"
CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
SCOPE = "org:create_api_key user:profile user:inference"

# Headers required on Messages API calls when authenticating with an
# OAuth access token instead of a normal API key.
OAUTH_INFERENCE_HEADERS = {
    "anthropic-beta": "oauth-2025-04-20,claude-code-20250219",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-app": "cli",
    "user-agent": "claude-cli/1.0.0 (external, cli)",
}


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def build_authorize_url() -> tuple[str, str]:
    """Returns (authorize_url, code_verifier). The verifier doubles as
    `state` (matching Claude Code's own flow), so no server-side session is
    needed between start and exchange."""
    verifier = _b64url(secrets.token_bytes(32))
    challenge = _b64url(hashlib.sha256(verifier.encode()).digest())
    params = {
        "code": "true",
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPE,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "state": verifier,
    }
    return f"{AUTHORIZE_URL}?{urlencode(params)}", verifier


async def exchange_code(code: str, code_verifier: str) -> dict:
    # The page the user copies the code from renders it as "code#state".
    auth_code = code.split("#", 1)[0]
    async with httpx.AsyncClient() as http:
        resp = await http.post(
            TOKEN_URL,
            json={
                "grant_type": "authorization_code",
                "code": auth_code,
                "state": code_verifier,
                "code_verifier": code_verifier,
                "client_id": CLIENT_ID,
                "redirect_uri": REDIRECT_URI,
            },
            headers={
                "Content-Type": "application/json",
                "User-Agent": "claude-cli/1.0.0 (external, cli)",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_access_token(client, user_id: str) -> str | None:
    """Fresh OAuth access token for this user, or None if Claude isn't
    connected. Refreshes (and persists) when the stored one is near expiry."""
    resp = (
        client.table("provider_connections")
        .select("access_token,refresh_token,expires_at")
        .eq("provider", "anthropic_oauth")
        .execute()
    )
    if not resp.data:
        return None
    row = resp.data[0]

    expires_at = datetime.fromisoformat(row["expires_at"])
    # 60s slack so a token doesn't expire mid-run.
    if expires_at - timedelta(seconds=60) > datetime.now(timezone.utc):
        return row["access_token"]
    if not row.get("refresh_token"):
        # Dead row: expired, unrefreshable. Clear it so /status stops
        # reporting "connected" while every request 400s.
        client.table("provider_connections").delete().eq("provider", "anthropic_oauth").execute()
        return None

    try:
        tokens = await refresh_access_token(row["refresh_token"])
    except httpx.HTTPStatusError:
        # Refresh token revoked/rotated server-side. Same cleanup as above.
        client.table("provider_connections").delete().eq("provider", "anthropic_oauth").execute()
        return None
    new_expiry = datetime.now(timezone.utc) + timedelta(seconds=tokens["expires_in"])
    client.table("provider_connections").upsert(
        {
            "user_id": user_id,
            "provider": "anthropic_oauth",
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token", row["refresh_token"]),
            "expires_at": new_expiry.isoformat(),
        },
        on_conflict="user_id,provider",
    ).execute()
    return tokens["access_token"]


async def refresh_access_token(refresh_token: str) -> dict:
    async with httpx.AsyncClient() as http:
        resp = await http.post(
            TOKEN_URL,
            json={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": CLIENT_ID,
            },
            headers={
                "Content-Type": "application/json",
                "User-Agent": "claude-cli/1.0.0 (external, cli)",
            },
        )
        resp.raise_for_status()
        return resp.json()
