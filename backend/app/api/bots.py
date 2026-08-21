import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.api.auth import AuthContext, get_current_user
from app.schemas.machine import Bot, BotCreate
from app.services import machine
from app.services.machine_agent_client import MachineAgentError, send_job
from app.services.supabase import get_admin_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bots", tags=["bots"])


@router.get("", response_model=list[Bot])
async def list_bots(auth: AuthContext = Depends(get_current_user)):
    resp = (
        get_admin_client()
        .table("bots")
        .select("*")
        .eq("user_id", auth.user_id)
        .neq("status", "deleted")
        .order("created_at")
        .execute()
    )
    return resp.data or []


@router.post("", response_model=Bot)
async def create_bot(body: BotCreate, auth: AuthContext = Depends(get_current_user)):
    row = await machine.ensure_machine(auth.user_id)
    if row["status"] == "error":
        raise HTTPException(status_code=502, detail="Cloud computer failed to provision")

    admin = get_admin_client()
    inserted = (
        admin.table("bots")
        .insert(
            {
                "user_id": auth.user_id,
                "machine_id": row["id"],
                "name": body.name,
                "config": body.config,
                "status": "creating",
            }
        )
        .execute()
    )
    bot = inserted.data[0]

    admin.table("machine_jobs").insert(
        {
            "machine_id": row["id"],
            "bot_id": bot["id"],
            "job_type": "start_bot",
            "payload": body.config,
        }
    ).execute()

    if row.get("provider_machine_id") and row["status"] == "running":
        try:
            await send_job(
                row["provider_machine_id"],
                job_type="start_bot",
                bot_id=bot["id"],
                payload=body.config,
            )
            admin.table("bots").update({"status": "running"}).eq("id", bot["id"]).execute()
            bot["status"] = "running"
        except MachineAgentError:
            logger.exception("Failed to start bot %s on machine %s", bot["id"], row["id"])
            admin.table("bots").update({"status": "error"}).eq("id", bot["id"]).execute()
            bot["status"] = "error"
    # Machine not running yet (still starting/provisioning): the bot record
    # stays "creating" -- the agent's own startup reconciliation (or a retry
    # of this endpoint's job row) is what actually starts it once healthy.

    return bot


@router.delete("/{bot_id}", status_code=204)
async def delete_bot(bot_id: str, auth: AuthContext = Depends(get_current_user)):
    try:
        uuid.UUID(bot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid bot id")

    admin = get_admin_client()
    resp = (
        admin.table("bots").select("*").eq("id", bot_id).eq("user_id", auth.user_id).maybe_single().execute()
    )
    bot = resp.data if resp else None
    if bot is None:
        raise HTTPException(status_code=404, detail="Bot not found")

    row = await machine.get_machine(auth.user_id)
    if row and row.get("provider_machine_id") and row["status"] == "running":
        try:
            await send_job(row["provider_machine_id"], job_type="stop_bot", bot_id=bot_id, payload={})
        except MachineAgentError:
            logger.exception("Failed to stop bot %s on machine %s", bot_id, row["id"])
            # Still mark it deleted -- the agent reconciles orphaned bot
            # directories against the (now-shorter) bot list on its next pass.

    admin.table("bots").update({"status": "deleted"}).eq("id", bot_id).execute()
