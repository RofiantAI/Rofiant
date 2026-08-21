"""Per-user Fly Machine lifecycle. Owns every write to `user_machines` --
routes never call FlyProvider or Postgrest directly for this table.

Idempotency: `user_machines.user_id` is UNIQUE, so `ensure_machine()` does an
INSERT ... nothing-on-conflict as the very first step. Whichever concurrent
request's insert actually lands owns provisioning; every other request (and
every later call once the row exists) just reads and returns the existing
row. No app-level locking needed -- Postgres's unique index is the lock.
"""

import logging

from app.config import settings
from app.services.fly import FlyProvider
from app.services.supabase import get_admin_client

logger = logging.getLogger(__name__)


class MachineNotFound(Exception):
    pass


def _admin():
    return get_admin_client()


async def get_machine(user_id: str) -> dict | None:
    resp = (
        _admin()
        .table("user_machines")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return resp.data if resp else None


def _log_event(machine_id: str, event_type: str, data: dict | None = None) -> None:
    _admin().table("machine_events").insert(
        {"machine_id": machine_id, "event_type": event_type, "data": data or {}}
    ).execute()


async def ensure_machine(user_id: str) -> dict:
    """Return the user's machine, provisioning it first if this is the
    first call. Safe to call concurrently and repeatedly."""
    client = _admin()

    inserted = (
        client.table("user_machines")
        .upsert(
            {"user_id": user_id, "status": "provisioning"},
            on_conflict="user_id",
            ignore_duplicates=True,
        )
        .execute()
    )
    row = inserted.data[0] if inserted.data else await get_machine(user_id)
    if row is None:
        raise RuntimeError("user_machines row missing immediately after upsert")

    # Someone else already provisioned (or is provisioning) this user's
    # machine -- just hand back current state, don't redo the Fly calls.
    if row["status"] != "provisioning" or row.get("provider_machine_id"):
        return row
    if not inserted.data:
        # Row existed already and is mid-provisioning from another request.
        return row

    return await _provision(row)


async def _provision(row: dict) -> dict:
    user_id = row["user_id"]
    machine_id = row["id"]
    fly = None
    try:
        fly = FlyProvider()
        if not settings.machine_agent_signing_secret:
            # Must be the exact value the agent verifies backend requests
            # against (see machine_agent_client.py) -- there is no
            # per-machine secret, it's one shared value injected into every
            # Machine's env.
            raise RuntimeError("MACHINE_AGENT_SIGNING_SECRET is not configured")

        await fly.ensure_app()

        volume_id = await fly.create_volume(name=f"vol_{machine_id.replace('-', '')[:20]}")
        _update(machine_id, {"provider_app_id": settings.fly_app, "provider_volume_id": volume_id})

        machine = await fly.create_machine(
            name=f"user-{machine_id}",
            volume_id=volume_id,
            signing_secret=settings.machine_agent_signing_secret,
            user_id=user_id,
        )
        provider_machine_id = machine["id"]
        _update(
            machine_id,
            {
                "provider_machine_id": provider_machine_id,
                "region": machine.get("region", settings.fly_region),
                "status": "starting",
            },
        )

        await fly.wait_for_state(provider_machine_id, state="started", timeout=60)
        _update(machine_id, {"status": "running", "last_seen_at": "now()"})
        _log_event(machine_id, "machine_provisioned", {"provider_machine_id": provider_machine_id})
        return await get_machine_by_id(machine_id)
    except Exception as exc:  # noqa: BLE001 -- must never leave status=running on failure
        logger.exception("Provisioning failed for user %s", user_id)
        _update(machine_id, {"status": "error", "error_message": str(exc)[:500]})
        _log_event(machine_id, "provisioning_failed", {"error": str(exc)[:500]})
        raise
    finally:
        if fly is not None:
            await fly.aclose()


async def get_machine_by_id(machine_id: str) -> dict:
    resp = _admin().table("user_machines").select("*").eq("id", machine_id).single().execute()
    return resp.data


def _update(machine_id: str, fields: dict) -> None:
    _admin().table("user_machines").update({**fields, "updated_at": "now()"}).eq(
        "id", machine_id
    ).execute()


async def _require_machine(user_id: str) -> dict:
    row = await get_machine(user_id)
    if row is None or not row.get("provider_machine_id"):
        raise MachineNotFound(user_id)
    return row


async def start_machine(user_id: str) -> dict:
    row = await _require_machine(user_id)
    fly = FlyProvider()
    try:
        await fly.start_machine(row["provider_machine_id"])
        _update(row["id"], {"status": "starting"})
    finally:
        await fly.aclose()
    return await get_machine_by_id(row["id"])


async def stop_machine(user_id: str) -> dict:
    row = await _require_machine(user_id)
    fly = FlyProvider()
    try:
        await fly.stop_machine(row["provider_machine_id"])
        _update(row["id"], {"status": "stopping"})
    finally:
        await fly.aclose()
    return await get_machine_by_id(row["id"])


async def restart_machine(user_id: str) -> dict:
    row = await _require_machine(user_id)
    fly = FlyProvider()
    try:
        await fly.restart_machine(row["provider_machine_id"])
        _update(row["id"], {"status": "starting"})
    finally:
        await fly.aclose()
    return await get_machine_by_id(row["id"])


async def record_heartbeat(provider_machine_id: str, data: dict) -> None:
    """Called from the agent-facing heartbeat route, not by the user. Keyed
    by the Fly machine id (`FLY_MACHINE_ID` in the agent's own env), which
    is what the agent knows about itself -- not our internal row id."""
    resp = (
        _admin()
        .table("user_machines")
        .select("id")
        .eq("provider_machine_id", provider_machine_id)
        .maybe_single()
        .execute()
    )
    if resp is None or not resp.data:
        logger.warning("Heartbeat from unknown machine %s", provider_machine_id)
        return
    machine_id = resp.data["id"]
    _update(machine_id, {"status": "running", "last_seen_at": "now()"})
    _log_event(machine_id, "heartbeat", data)
