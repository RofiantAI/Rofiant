"""Backend -> machine-agent calls: authenticated, no shell/SSH surface.

The backend runs on Railway, off Fly's private 6PN network, so it reaches
the agent over the Fly App's public edge (`<app>.fly.dev`) and targets the
right Machine with the `fly-force-instance-id` header. Every request is
HMAC-signed with MACHINE_AGENT_SIGNING_SECRET (shared secret, baked into the
VM image / set as a Fly secret -- never a Fly API token) over
machine_id:timestamp:body, with a 60s replay window. The agent exposes only
a small authenticated job API, never a raw shell.

ponytail: public-edge + HMAC instead of WireGuard peering into Fly's private
network. Simpler to run from Railway; upgrade to 6PN/WireGuard if the public
edge ever becomes a real concern.
"""

import hashlib
import hmac
import json as json_module
import time

import httpx

from app.config import settings


class MachineAgentError(RuntimeError):
    pass


def _sign(machine_id: str, timestamp: str, body: bytes) -> str:
    if not settings.machine_agent_signing_secret:
        raise RuntimeError("MACHINE_AGENT_SIGNING_SECRET is not configured")
    body_hash = hashlib.sha256(body).hexdigest()
    message = f"{machine_id}:{timestamp}:{body_hash}".encode()
    return hmac.new(
        settings.machine_agent_signing_secret.encode(), message, hashlib.sha256
    ).hexdigest()


async def call_agent(
    machine_id: str, method: str, path: str, *, json: dict | None = None, timeout: float = 15
) -> dict:
    body = json_module.dumps(json).encode() if json is not None else b""
    timestamp = str(int(time.time()))
    signature = _sign(machine_id, timestamp, body)

    try:
        async with httpx.AsyncClient(
            base_url=f"https://{settings.fly_app}.fly.dev", timeout=timeout
        ) as client:
            resp = await client.request(
                method,
                path,
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "fly-force-instance-id": machine_id,
                    "X-Machine-Id": machine_id,
                    "X-Timestamp": timestamp,
                    "X-Signature": signature,
                },
            )
    except httpx.HTTPError as exc:
        # DNS failure, connection refused, timeout, etc -- the Machine may
        # just be transiently unreachable. Callers treat this the same as
        # an error response, not an unhandled 500.
        raise MachineAgentError(f"agent {path} unreachable: {exc}") from exc
    if resp.status_code >= 400:
        raise MachineAgentError(f"agent {path} -> {resp.status_code}: {resp.text}")
    return resp.json() if resp.content else {}


async def send_job(machine_id: str, *, job_type: str, bot_id: str, payload: dict) -> dict:
    return await call_agent(
        machine_id,
        "POST",
        "/jobs",
        json={"job_type": job_type, "bot_id": bot_id, "payload": payload},
    )


async def get_status(machine_id: str) -> dict:
    return await call_agent(machine_id, "GET", "/status")


async def get_screen(machine_id: str) -> bytes:
    """PNG bytes of the machine's virtual display. Separate from call_agent
    since the response body is binary, not JSON."""
    timestamp = str(int(time.time()))
    signature = _sign(machine_id, timestamp, b"")
    try:
        async with httpx.AsyncClient(
            base_url=f"https://{settings.fly_app}.fly.dev", timeout=15
        ) as client:
            resp = await client.get(
                "/screen",
                headers={
                    "fly-force-instance-id": machine_id,
                    "X-Machine-Id": machine_id,
                    "X-Timestamp": timestamp,
                    "X-Signature": signature,
                },
            )
    except httpx.HTTPError as exc:
        raise MachineAgentError(f"agent /screen unreachable: {exc}") from exc
    if resp.status_code >= 400:
        raise MachineAgentError(f"agent /screen -> {resp.status_code}: {resp.text}")
    return resp.content


def verify_agent_signature(
    machine_id: str, timestamp: str, body: bytes, signature: str
) -> bool:
    """Inbound direction: the agent calling the backend (heartbeats).
    Same HMAC, same 60s window, checked with hmac.compare_digest."""
    try:
        if abs(int(timestamp) - int(time.time())) > 60:
            return False
    except ValueError:
        return False
    expected = _sign(machine_id, timestamp, body)
    return hmac.compare_digest(expected, signature)
