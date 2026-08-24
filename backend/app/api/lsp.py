import asyncio
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from jwt import PyJWTError

from app.api.auth import verify_jwt
from app.api.workspaces import _sandbox_id_for
from app.rate_limit import RateLimiter
from app.services.lsp import (
    LANGUAGE_SERVERS,
    read_lsp_message,
    spawn_language_server,
    sync_workspace_mirror,
    write_lsp_message,
)
from app.services.supabase import get_user_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/workspaces", tags=["lsp"])
lsp_connection_limiter = RateLimiter(limit=10, window_seconds=60)


@router.websocket("/{conversation_id}/lsp/{language}")
async def lsp_bridge(websocket: WebSocket, conversation_id: UUID, language: str):
    if language not in LANGUAGE_SERVERS:
        await websocket.close(code=4404, reason=f"No language server for {language!r}")
        return

    # New clients authenticate in the first frame so access tokens never land
    # in URLs or proxy logs. Keep query auth during the desktop rollout so old
    # releases continue to connect; remove it after their compatibility window.
    token = websocket.query_params.get("token")
    accepted = False
    if not token:
        await websocket.accept()
        accepted = True
        try:
            auth_message = await asyncio.wait_for(websocket.receive_json(), timeout=5)
            if isinstance(auth_message, dict) and auth_message.get("type") == "auth":
                candidate = auth_message.get("token")
                token = candidate if isinstance(candidate, str) else None
        except WebSocketDisconnect:
            return
        except (TimeoutError, ValueError, TypeError):
            token = None
    try:
        if not token:
            raise ValueError("missing token")
        auth = verify_jwt(token)
    except (HTTPException, PyJWTError, ValueError):
        await websocket.close(code=4401, reason="Unauthorized")
        return

    if lsp_connection_limiter.retry_after(auth.user_id) is not None:
        await websocket.close(code=4429, reason="Rate limit exceeded")
        return

    client = get_user_client(auth.access_token)
    try:
        sandbox_id = await _sandbox_id_for(client, conversation_id)
    except Exception:
        await websocket.close(code=4404, reason="No workspace for this conversation yet")
        return

    if not accepted:
        await websocket.accept()
    mirror_root = await sync_workspace_mirror(str(conversation_id), sandbox_id)
    # Not an LSP message — a one-off preamble so the browser client knows
    # what local path to build file:// URIs against, since the language
    # server's project root lives on this backend's disk, not the client's.
    await websocket.send_json(
        {"kirobots": "mirrorRoot", "KiroBot": "mirrorRoot", "root": str(mirror_root)}
    )
    process = await spawn_language_server(language)
    assert process.stdin and process.stdout

    async def server_to_client() -> None:
        while True:
            message = await read_lsp_message(process.stdout)
            if message is None:
                break
            await websocket.send_json(message)

    async def client_to_server() -> None:
        while True:
            message = await websocket.receive_json()
            write_lsp_message(process.stdin, message)
            await process.stdin.drain()

    pump = asyncio.gather(server_to_client(), client_to_server())
    try:
        await pump
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("LSP bridge error for %s/%s", conversation_id, language)
    finally:
        pump.cancel()
        if process.returncode is None:
            process.kill()
        logger.info("LSP session ended for %s/%s (mirror: %s)", conversation_id, language, mirror_root)
