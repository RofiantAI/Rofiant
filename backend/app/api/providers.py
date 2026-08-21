import logging
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth import AuthContext, get_current_user
from app.schemas.provider_connection import (
    AnthropicAuthExchange,
    AnthropicAuthStart,
    GeminiKeySave,
    OpenAIKeySave,
    ProviderConnectionStatus,
)
from app.services.anthropic_oauth import build_authorize_url, exchange_code
from app.services.supabase import get_user_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("/status", response_model=ProviderConnectionStatus)
async def get_status(auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    resp = client.table("provider_connections").select("provider,refresh_token,expires_at").execute()
    connected = {row["provider"] for row in resp.data}

    anthropic_row = next((r for r in resp.data if r["provider"] == "anthropic_oauth"), None)
    anthropic_connected = anthropic_row is not None and (
        datetime.fromisoformat(anthropic_row["expires_at"]) > datetime.now(timezone.utc)
        or bool(anthropic_row.get("refresh_token"))
    )

    return ProviderConnectionStatus(
        anthropic_oauth=anthropic_connected,
        openai_api_key="openai_api_key" in connected,
        gemini_api_key="gemini_api_key" in connected,
    )


@router.post("/anthropic/start", response_model=AnthropicAuthStart)
async def anthropic_start(auth: AuthContext = Depends(get_current_user)):
    url, verifier = build_authorize_url()
    return AnthropicAuthStart(authorize_url=url, code_verifier=verifier)


@router.post("/anthropic/exchange", status_code=status.HTTP_204_NO_CONTENT)
async def anthropic_exchange(
    body: AnthropicAuthExchange, auth: AuthContext = Depends(get_current_user)
):
    try:
        tokens = await exchange_code(body.code, body.code_verifier)
    except httpx.HTTPStatusError as exc:
        logger.warning("Anthropic token exchange failed: %s", exc.response.text)
        raise HTTPException(status_code=400, detail="Invalid or expired code") from exc

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=tokens["expires_in"])
    client = get_user_client(auth.access_token)
    client.table("provider_connections").upsert(
        {
            "user_id": auth.user_id,
            "provider": "anthropic_oauth",
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token"),
            "expires_at": expires_at.isoformat(),
        },
        on_conflict="user_id,provider",
    ).execute()


@router.delete("/anthropic", status_code=status.HTTP_204_NO_CONTENT)
async def anthropic_disconnect(auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    client.table("provider_connections").delete().eq("provider", "anthropic_oauth").execute()


@router.post("/openai/key", status_code=status.HTTP_204_NO_CONTENT)
async def save_openai_key(body: OpenAIKeySave, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    client.table("provider_connections").upsert(
        {"user_id": auth.user_id, "provider": "openai_api_key", "api_key": body.api_key},
        on_conflict="user_id,provider",
    ).execute()


@router.delete("/openai", status_code=status.HTTP_204_NO_CONTENT)
async def openai_disconnect(auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    client.table("provider_connections").delete().eq("provider", "openai_api_key").execute()


@router.post("/gemini/key", status_code=status.HTTP_204_NO_CONTENT)
async def save_gemini_key(body: GeminiKeySave, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    client.table("provider_connections").upsert(
        {"user_id": auth.user_id, "provider": "gemini_api_key", "api_key": body.api_key},
        on_conflict="user_id,provider",
    ).execute()


@router.delete("/gemini", status_code=status.HTTP_204_NO_CONTENT)
async def gemini_disconnect(auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    client.table("provider_connections").delete().eq("provider", "gemini_api_key").execute()
