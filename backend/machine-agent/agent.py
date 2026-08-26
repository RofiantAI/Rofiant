"""Machine agent: runs inside every user's Fly Machine as PID-adjacent
supervisor for that user's bots. No shell/SSH endpoint -- the only surface
is this small authenticated job API.

Responsibilities (see README "Machine Agent" section):
  - authenticate every request (HMAC, see _verify_signature)
  - heartbeat to the backend on a timer
  - start/stop bot subprocesses, track their status
  - persist bot state on the mounted volume so a Machine restart can
    reconcile which bots were running
  - stream bot logs
  - handle SIGTERM by stopping bot children before exiting

Runs as the non-root `agent` user (see Dockerfile). Bot processes run as
that same user -- there is no privilege boundary between bots on one
Machine, only between Machines (one Machine per Supabase user).
"""

import asyncio
import contextlib
import hashlib
import hmac
import json
import logging
import os
import re
import time
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("machine-agent")

SIGNING_SECRET = os.environ["MACHINE_AGENT_SIGNING_SECRET"]
FLY_MACHINE_ID = os.environ.get("FLY_MACHINE_ID", "local-dev")
BACKEND_URL = os.environ.get("BACKEND_URL", "")
WORKSPACE_ROOT = Path(os.environ.get("WORKSPACE_ROOT", "/workspace"))
BOTS_ROOT = WORKSPACE_ROOT / "bots"
HEARTBEAT_INTERVAL_S = 30
DISPLAY = os.environ.get("DISPLAY_NUM", ":99")
BOT_ID_RE = re.compile(r"^[a-f0-9-]{36}$")  # uuid only -- blocks path traversal

app = FastAPI(title="Rofiant machine agent")
# Concurrent `import` calls against Xvfb were enough to wedge the display
# under load (multiple pollers, multiple browser tabs) -- one capture at a
# time, full stop.
_screen_lock = asyncio.Lock()


class Bot:
    def __init__(self, bot_id: str, process: asyncio.subprocess.Process | None):
        self.bot_id = bot_id
        self.process = process
        self.status = "running" if process else "stopped"


bots: dict[str, Bot] = {}


def _bot_dir(bot_id: str) -> Path:
    if not BOT_ID_RE.match(bot_id):
        raise HTTPException(status_code=400, detail="Invalid bot id")
    # Belt and suspenders on top of the regex: resolve and re-check containment.
    path = (BOTS_ROOT / bot_id).resolve()
    if path.parent != BOTS_ROOT.resolve():
        raise HTTPException(status_code=400, detail="Invalid bot id")
    return path


def _verify_signature(machine_id: str, timestamp: str, body: bytes, signature: str) -> bool:
    try:
        if abs(int(timestamp) - int(time.time())) > 60:
            return False
    except ValueError:
        return False
    body_hash = hashlib.sha256(body).hexdigest()
    message = f"{machine_id}:{timestamp}:{body_hash}".encode()
    expected = hmac.new(SIGNING_SECRET.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)  # Fly's healthcheck probe, unauthenticated, no data

    machine_id = request.headers.get("X-Machine-Id", "")
    timestamp = request.headers.get("X-Timestamp", "")
    signature = request.headers.get("X-Signature", "")
    body = await request.body()
    if machine_id != FLY_MACHINE_ID or not _verify_signature(machine_id, timestamp, body, signature):
        return _json_response(401, {"detail": "Invalid signature"})

    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    request._receive = receive  # re-inject the body we already consumed
    return await call_next(request)


def _json_response(status_code: int, content: dict):
    from fastapi.responses import JSONResponse

    return JSONResponse(status_code=status_code, content=content)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/status")
async def status():
    return {
        "bots": [
            {"bot_id": b.bot_id, "status": b.status, "pid": b.process.pid if b.process else None}
            for b in bots.values()
        ]
    }


@app.post("/jobs")
async def submit_job(request: Request):
    body = await request.json()
    job_type = body.get("job_type")
    bot_id = body.get("bot_id", "")
    payload = body.get("payload") or {}

    if job_type == "start_bot":
        await _start_bot(bot_id, payload)
    elif job_type == "stop_bot":
        await _stop_bot(bot_id)
    elif job_type == "restart_bot":
        await _stop_bot(bot_id)
        await _start_bot(bot_id, payload)
    else:
        raise HTTPException(status_code=400, detail=f"Unknown job_type {job_type!r}")

    return {"ok": True, "status": bots[bot_id].status if bot_id in bots else "stopped"}


@app.get("/screen")
async def screen():
    """PNG snapshot of the virtual display -- the "see what's going on
    inside the VM" view. Polled, not streamed: simplest thing that shows
    something real without standing up VNC/WebRTC plus input forwarding."""
    if _screen_lock.locked():
        raise HTTPException(status_code=429, detail="A screen capture is already in progress")

    async with _screen_lock:
        proc = await asyncio.create_subprocess_exec(
            "import", "-window", "root", "-display", DISPLAY, "png:-",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            png, err = await asyncio.wait_for(proc.communicate(), timeout=8)
        except asyncio.TimeoutError:
            # A dead Xvfb leaves `import` hung on a stale X11 socket rather
            # than erroring -- kill it so it doesn't pile up across polls.
            proc.kill()
            await proc.wait()
            raise HTTPException(status_code=503, detail="Screen capture timed out (display may be restarting)")
        except FileNotFoundError as exc:
            raise HTTPException(status_code=503, detail=f"Screen capture unavailable: {exc}")
    if proc.returncode != 0 or not png:
        raise HTTPException(status_code=503, detail=f"Screen capture failed: {err.decode(errors='replace')}")

    from fastapi.responses import Response

    return Response(content=png, media_type="image/png")


@app.get("/bots/{bot_id}/logs")
async def bot_logs(bot_id: str, lines: int = 200):
    log_path = _bot_dir(bot_id) / "logs" / "output.log"
    if not log_path.exists():
        return {"lines": []}
    text = log_path.read_text(errors="replace").splitlines()
    return {"lines": text[-lines:]}


async def _start_bot(bot_id: str, payload: dict) -> None:
    existing = bots.get(bot_id)
    if existing and existing.process and existing.process.returncode is None:
        return  # already running -- idempotent

    bot_dir = _bot_dir(bot_id)
    (bot_dir / "logs").mkdir(parents=True, exist_ok=True)
    (bot_dir / "state.json").write_text(json.dumps({"config": payload}))

    command = payload.get("command")
    if not isinstance(command, list) or not command or not all(isinstance(c, str) for c in command):
        # No runnable command supplied -- record the config, don't guess a
        # shell string out of untrusted input. This is where a real bot
        # runtime plugs in later (e.g. resolve `payload["template"]` to a
        # known, pre-approved command list server-side, never client text).
        logger.info("start_bot %s: no command in payload, config persisted only", bot_id)
        bots[bot_id] = Bot(bot_id, None)
        bots[bot_id].status = "stopped"
        return

    log_file = open(bot_dir / "logs" / "output.log", "ab")
    process = await asyncio.create_subprocess_exec(
        *command,  # list form -- never shell=True on caller-influenced input
        cwd=str(bot_dir),
        stdout=log_file,
        stderr=asyncio.subprocess.STDOUT,
        env={**os.environ, "DISPLAY": DISPLAY},  # so a GUI bot renders to the virtual display
    )
    bots[bot_id] = Bot(bot_id, process)
    logger.info("start_bot %s: pid %s", bot_id, process.pid)


async def _stop_bot(bot_id: str) -> None:
    bot = bots.get(bot_id)
    if not bot or not bot.process or bot.process.returncode is not None:
        if bot:
            bot.status = "stopped"
        return
    bot.process.terminate()
    try:
        await asyncio.wait_for(bot.process.wait(), timeout=10)
    except asyncio.TimeoutError:
        bot.process.kill()
        await bot.process.wait()
    bot.status = "stopped"
    logger.info("stop_bot %s", bot_id)


async def _reconcile_on_boot() -> None:
    """After a Machine restart, bot processes are gone but their state
    directories on the volume survive. Bots marked as having a runnable
    command get restarted; the rest just get their status reported."""
    if not BOTS_ROOT.exists():
        return
    for bot_dir in BOTS_ROOT.iterdir():
        if not bot_dir.is_dir() or not BOT_ID_RE.match(bot_dir.name):
            continue
        state_file = bot_dir / "state.json"
        if not state_file.exists():
            continue
        try:
            state = json.loads(state_file.read_text())
            await _start_bot(bot_dir.name, state.get("config", {}))
        except Exception:
            logger.exception("Failed to reconcile bot %s on boot", bot_dir.name)


def _sign_outbound(timestamp: str, body: bytes) -> str:
    body_hash = hashlib.sha256(body).hexdigest()
    message = f"{FLY_MACHINE_ID}:{timestamp}:{body_hash}".encode()
    return hmac.new(SIGNING_SECRET.encode(), message, hashlib.sha256).hexdigest()


async def _heartbeat_loop() -> None:
    if not BACKEND_URL:
        logger.warning("BACKEND_URL not set -- heartbeat disabled")
        return
    async with httpx.AsyncClient(base_url=BACKEND_URL, timeout=10) as client:
        while True:
            try:
                data = {"bot_count": len(bots)}
                body = json.dumps(data).encode()
                timestamp = str(int(time.time()))
                await client.post(
                    "/api/machine/agent/heartbeat",
                    content=body,
                    headers={
                        "Content-Type": "application/json",
                        "X-Machine-Id": FLY_MACHINE_ID,
                        "X-Timestamp": timestamp,
                        "X-Signature": _sign_outbound(timestamp, body),
                    },
                )
            except Exception:
                logger.exception("Heartbeat failed")
            await asyncio.sleep(HEARTBEAT_INTERVAL_S)


@app.on_event("startup")
async def on_startup():
    BOTS_ROOT.mkdir(parents=True, exist_ok=True)
    await _reconcile_on_boot()
    asyncio.create_task(_heartbeat_loop())


async def _shutdown_all_bots() -> None:
    for bot_id in list(bots.keys()):
        with contextlib.suppress(Exception):
            await _stop_bot(bot_id)


@app.on_event("shutdown")
async def on_shutdown():
    # uvicorn traps SIGTERM/SIGINT itself and fires this shutdown event --
    # no manual signal handler needed on top of it.
    await _shutdown_all_bots()
