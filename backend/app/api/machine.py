from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response

from app.api.auth import AuthContext, get_current_user
from app.schemas.machine import MachineStatus
from app.services import machine
from app.services.machine_agent_client import MachineAgentError, get_screen, verify_agent_signature
from app.services.supabase import get_admin_client

router = APIRouter(prefix="/api/machine", tags=["machine"])


def _bot_count(machine_id: str) -> int:
    resp = (
        get_admin_client()
        .table("bots")
        .select("id", count="exact")
        .eq("machine_id", machine_id)
        .neq("status", "deleted")
        .execute()
    )
    return resp.count or 0


def _to_status(row: dict) -> MachineStatus:
    return MachineStatus(
        status=row["status"],
        region=row.get("region"),
        bot_count=_bot_count(row["id"]),
        error_message=row.get("error_message"),
    )


@router.get("", response_model=MachineStatus | None)
async def get_machine(auth: AuthContext = Depends(get_current_user)):
    row = await machine.get_machine(auth.user_id)
    if row is None:
        return None
    return _to_status(row)


@router.post("/ensure", response_model=MachineStatus)
async def ensure_machine(auth: AuthContext = Depends(get_current_user)):
    row = await machine.ensure_machine(auth.user_id)
    return _to_status(row)


@router.post("/start", response_model=MachineStatus)
async def start_machine(auth: AuthContext = Depends(get_current_user)):
    try:
        row = await machine.start_machine(auth.user_id)
    except machine.MachineNotFound:
        raise HTTPException(status_code=404, detail="No cloud computer yet")
    return _to_status(row)


@router.post("/stop", response_model=MachineStatus)
async def stop_machine(auth: AuthContext = Depends(get_current_user)):
    try:
        row = await machine.stop_machine(auth.user_id)
    except machine.MachineNotFound:
        raise HTTPException(status_code=404, detail="No cloud computer yet")
    return _to_status(row)


@router.get("/screen")
async def get_machine_screen(auth: AuthContext = Depends(get_current_user)):
    """Proxies a PNG snapshot of the user's VM display. The browser never
    talks to the Machine directly -- it has no Fly credentials and no HMAC
    key, only this JWT-authenticated route does."""
    row = await machine.get_machine(auth.user_id)
    if row is None or not row.get("provider_machine_id"):
        raise HTTPException(status_code=404, detail="No cloud computer yet")
    if row["status"] != "running":
        raise HTTPException(status_code=409, detail="Cloud computer is not running")

    try:
        png = await get_screen(row["provider_machine_id"])
    except MachineAgentError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return Response(content=png, media_type="image/png")


@router.post("/agent/heartbeat")
async def agent_heartbeat(request: Request):
    """Called by the machine agent itself, not a browser -- authenticated
    with the HMAC signature scheme, not a Supabase JWT."""
    provider_machine_id = request.headers.get("X-Machine-Id", "")
    timestamp = request.headers.get("X-Timestamp", "")
    signature = request.headers.get("X-Signature", "")
    body = await request.body()

    if not verify_agent_signature(provider_machine_id, timestamp, body, signature):
        raise HTTPException(status_code=401, detail="Invalid agent signature")

    data = await request.json() if body else {}
    await machine.record_heartbeat(provider_machine_id, data)
    return {"ok": True}


@router.post("/restart", response_model=MachineStatus)
async def restart_machine(auth: AuthContext = Depends(get_current_user)):
    try:
        row = await machine.restart_machine(auth.user_id)
    except machine.MachineNotFound:
        raise HTTPException(status_code=404, detail="No cloud computer yet")
    return _to_status(row)
