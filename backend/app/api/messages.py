import asyncio
import json
import logging
from collections.abc import AsyncIterator
from typing import Literal
from uuid import UUID
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.agent.models.anthropic import AnthropicProvider
from app.agent.models.base import ModelProvider
from app.agent.models.custom_openai import CustomOpenAIProvider
from app.agent.models.openrouter import OpenRouterProvider
from app.agent.prompts import CODE_FIDELITY_SUFFIX, system_prompt_for
from app.agent.runner import MAX_STEPS, run_agent
from app.agent.title import DEFAULT_TITLE, generate_title
from app.api.auth import AuthContext, get_current_user
from app.config import settings

logger = logging.getLogger(__name__)
from app.schemas.message import MessageCreate, MessageOut
from app.services.anthropic_oauth import get_access_token
from app.services.supabase import get_admin_client, get_user_client
from app.services.workspace import get_or_create_workspace

router = APIRouter(prefix="/api/messages", tags=["messages"])

# A single backend process serves the desktop app. Keep at most one agent
# run active per conversation so duplicate clicks/requests cannot execute
# tools and persist replies from the same history snapshot twice.
_active_runs: set[str] = set()
_active_runs_guard = asyncio.Lock()
_pending_approvals: dict[str, tuple[str, asyncio.Future[bool]]] = {}
_pending_approvals_guard = asyncio.Lock()
# Results for tools the desktop app runs itself (real local filesystem
# access) instead of the backend -- keyed by tool_use.id, same
# register/resolve shape as _pending_approvals.
_pending_client_tool_results: dict[str, tuple[str, asyncio.Future[str]]] = {}
_pending_client_tool_results_guard = asyncio.Lock()
# Tools that touch the user's real computer always need a yes/no, regardless
# of tool_approval_policy -- there's no sandbox boundary to fall back on.
_ALWAYS_RISKY_TOOLS = {"terminal", "local_read_file", "local_write_file", "local_list_dir"}


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(body: MessageCreate, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    owned = client.table("conversations").select("id").eq("id", str(body.conversation_id)).maybe_single().execute()
    if not owned.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    _validate_user_content(body.content)
    admin = get_admin_client()
    resp = (
        admin.table("messages")
        .insert(
            {
                "conversation_id": str(body.conversation_id),
                "role": "user",
                "content": body.content,
            }
        )
        .execute()
    )
    if not resp.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conversation not found or not owned by user",
        )
    return resp.data[0]


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def clear_messages(conversation_id: UUID, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    owned = client.table("conversations").select("id").eq("id", str(conversation_id)).maybe_single().execute()
    if not owned.data:
        raise HTTPException(status_code=404, detail="Conversation not found")
    admin = get_admin_client()
    admin.table("messages").delete().eq("conversation_id", str(conversation_id)).execute()
    admin.table("tool_calls").delete().eq("conversation_id", str(conversation_id)).execute()


def _validate_user_content(content: str) -> None:
    if len(content) > 28_000_000:
        raise HTTPException(status_code=413, detail="Message is too large")
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        if len(content) > 100_000:
            raise HTTPException(status_code=413, detail="Message text is too large")
        return
    if not isinstance(parsed, dict) or parsed.get("kind") != "multimodal":
        if len(content) > 100_000:
            raise HTTPException(status_code=413, detail="Message text is too large")
        return
    images = parsed.get("images")
    if not isinstance(images, list) or len(images) > 4:
        raise HTTPException(status_code=400, detail="A message can contain at most 4 images")
    for image in images:
        if (
            not isinstance(image, dict)
            or not isinstance(image.get("media_type"), str)
            or not image["media_type"].startswith("image/")
            or not isinstance(image.get("data"), str)
            or len(image["data"]) > 7_000_000
        ):
            raise HTTPException(status_code=400, detail="Invalid or oversized image attachment")


class StreamRequest(BaseModel):
    conversation_id: UUID
    model: str | None = None
    # Upper bound on model turns in one run; the runner clamps it to its own
    # ceiling, so a large value here can't extend a run past MAX_STEPS.
    max_steps: int = MAX_STEPS
    # @mentioned bot ids parsed client-side from the message text. Group
    # chats only: when set, only these bots (intersected with the roster)
    # reply this turn instead of every bot.
    mentioned_personas: list[str] | None = None
    tool_approval_policy: Literal["risky", "always", "automatic"] = "risky"
    max_run_minutes: int = Field(default=10, ge=1, le=30)
    # IANA name (e.g. "America/Denver") from the client's Intl API, so the
    # system prompt can state local time instead of UTC-only.
    timezone: str | None = None


class ApprovalDecision(BaseModel):
    approved: bool


@router.post("/approvals/{approval_id}", status_code=status.HTTP_204_NO_CONTENT)
async def decide_approval(
    approval_id: str, body: ApprovalDecision, auth: AuthContext = Depends(get_current_user)
):
    async with _pending_approvals_guard:
        pending = _pending_approvals.get(approval_id)
        if not pending or pending[0] != auth.user_id:
            raise HTTPException(status_code=404, detail="Approval request not found")
        _pending_approvals.pop(approval_id)
    if not pending[1].done():
        pending[1].set_result(body.approved)


class ClientToolResult(BaseModel):
    result: str


@router.post("/tool-results/{call_id}", status_code=status.HTTP_204_NO_CONTENT)
async def submit_tool_result(
    call_id: str, body: ClientToolResult, auth: AuthContext = Depends(get_current_user)
):
    async with _pending_client_tool_results_guard:
        pending = _pending_client_tool_results.get(call_id)
        if not pending or pending[0] != auth.user_id:
            raise HTTPException(status_code=404, detail="No pending local tool call with that id")
        _pending_client_tool_results.pop(call_id)
    if not pending[1].done():
        pending[1].set_result(body.result)


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/stream")
async def stream_reply(body: StreamRequest, auth: AuthContext = Depends(get_current_user)):
    """Run the agent loop for this conversation: load history, let the model
    reply and optionally call tools (in a lazily-created sandbox workspace),
    streaming every step to the client and persisting the results."""
    client = get_user_client(auth.access_token)
    admin = get_admin_client()
    conversation_id = str(body.conversation_id)

    history_resp = (
        client.table("messages")
        .select("role,content")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    )
    if not history_resp.data:
        # RLS returns no rows for a conversation that doesn't exist *or*
        # isn't the caller's — either way, don't distinguish the two.
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Claude models run on the user's own connected subscription, "custom"
    # on the user's own OpenAI-compatible endpoint, and everything else
    # falls back to the app-paid free OpenRouter tier. A non-free,
    # non-Claude id in the body is ignored rather than trusted.
    provider: ModelProvider
    if body.model and body.model.startswith("claude-"):
        token = await get_access_token(client, auth.user_id)
        if not token:
            raise HTTPException(status_code=400, detail="Claude account not connected")
        provider = AnthropicProvider(model=body.model, oauth_access_token=token)
        provider_model = body.model
    elif body.model == "custom":
        custom_resp = (
            client.table("provider_connections")
            .select("api_key,base_url,model")
            .eq("provider", "custom_openai")
            .maybe_single()
            .execute()
        )
        custom = custom_resp.data if custom_resp else None
        if not custom:
            raise HTTPException(status_code=400, detail="Custom provider not connected")
        provider = CustomOpenAIProvider(base_url=custom["base_url"], api_key=custom["api_key"], model=custom["model"])
        provider_model = custom["model"]
    else:
        wants_free = bool(body.model) and body.model.endswith(":free")
        provider_model = body.model if wants_free else settings.openrouter_model
        provider = OpenRouterProvider(model=body.model if wants_free else None)

    conversation_resp = (
        client.table("conversations")
        .select("title,persona,personas")
        .eq("id", conversation_id)
        .execute()
    )
    row = conversation_resp.data[0] if conversation_resp.data else {}
    current_title = row.get("title")
    # Group roster if set, else the solo persona — same single-bot behavior
    # as before for every existing conversation.
    bots: list[str] = row.get("personas") or [row.get("persona") or "agent"]
    if body.mentioned_personas:
        mentioned = [p for p in body.mentioned_personas if p in bots]
        if mentioned:
            bots = mentioned
    first_user_message = next((m["content"] for m in history_resp.data if m["role"] == "user"), None)

    skills_resp = client.table("skills").select("name,content").execute()
    skills_suffix = "".join(f"\n\n## Skill: {s['name']}\n{s['content']}" for s in skills_resp.data or [])
    profile_resp = (
        client.table("profiles")
        .select("custom_instructions")
        .eq("id", auth.user_id)
        .execute()
    )
    custom_instructions = (
        profile_resp.data[0].get("custom_instructions", "")
        if profile_resp.data
        else ""
    )

    async def get_sandbox_id() -> str:
        return await get_or_create_workspace(client, auth.user_id, conversation_id)

    async with _active_runs_guard:
        if conversation_id in _active_runs:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An agent run is already active for this conversation",
            )
        _active_runs.add(conversation_id)

    try:
        claim = admin.rpc(
            "claim_conversation_run",
            {"target_conversation_id": conversation_id, "target_user_id": auth.user_id},
        ).execute()
    except Exception:
        async with _active_runs_guard:
            _active_runs.discard(conversation_id)
        await provider.close()
        raise
    if not claim.data:
        async with _active_runs_guard:
            _active_runs.discard(conversation_id)
        await provider.close()
        raise HTTPException(status_code=409, detail="An agent run is already active for this conversation")

    async def event_stream() -> AsyncIterator[str]:
        active_task: asyncio.Task | None = None
        try:
            yield _sse("agent.started", {})
            # Running history: each bot below sees every prior bot's reply
            # from this same turn, not just what was on disk when we started.
            history = list(history_resp.data)
            try:
                async def approve_tool(call_id: str, tool: str, arguments: dict) -> bool:
                    policy = body.tool_approval_policy
                    needs_approval = policy == "always" or (policy == "risky" and tool in _ALWAYS_RISKY_TOOLS)
                    if not needs_approval:
                        return True
                    approval_id = str(uuid4())
                    future: asyncio.Future[bool] = asyncio.get_running_loop().create_future()
                    async with _pending_approvals_guard:
                        _pending_approvals[approval_id] = (auth.user_id, future)
                    await approval_events.put(_sse("tool.approval_required", {
                        "approval_id": approval_id, "id": call_id, "tool": tool, "arguments": arguments
                    }))
                    try:
                        return await asyncio.wait_for(future, timeout=120)
                    except TimeoutError:
                        return False
                    finally:
                        async with _pending_approvals_guard:
                            _pending_approvals.pop(approval_id, None)

                async def run_client_tool(call_id: str, tool: str, arguments: dict) -> str:
                    future: asyncio.Future[str] = asyncio.get_running_loop().create_future()
                    async with _pending_client_tool_results_guard:
                        _pending_client_tool_results[call_id] = (auth.user_id, future)
                    await approval_events.put(_sse("tool.client_exec_required", {
                        "id": call_id, "tool": tool, "arguments": arguments
                    }))
                    try:
                        return await asyncio.wait_for(future, timeout=120)
                    except TimeoutError:
                        return "Error: timed out waiting for the desktop app to run this."
                    finally:
                        async with _pending_client_tool_results_guard:
                            _pending_client_tool_results.pop(call_id, None)

                approval_events: asyncio.Queue[str] = asyncio.Queue()

                deadline = max(1, min(body.max_run_minutes, 30)) * 60
                started = asyncio.get_running_loop().time()
                for persona in bots:
                    bot_started = asyncio.get_running_loop().time()
                    agent_events: asyncio.Queue = asyncio.Queue()

                    async def run_bot() -> None:
                        try:
                            system_prompt = system_prompt_for(
                                persona, body.timezone, custom_instructions,
                                composio_enabled=bool(settings.composio_api_key),
                            ) + skills_suffix + CODE_FIDELITY_SUFFIX
                            async for event in run_agent(
                                history=history, provider=provider, get_sandbox_id=get_sandbox_id,
                                user_id=auth.user_id, max_steps=body.max_steps,
                                system_prompt=system_prompt, approve_tool=approve_tool,
                                run_client_tool=run_client_tool,
                            ):
                                await agent_events.put(event)
                        except Exception as exc:
                            await agent_events.put(exc)
                        finally:
                            await agent_events.put(None)

                    task = asyncio.create_task(run_bot())
                    active_task = task
                    while True:
                        remaining = deadline - (asyncio.get_running_loop().time() - started)
                        if remaining <= 0:
                            task.cancel()
                            raise TimeoutError("Run timed out")
                        approval_get = asyncio.create_task(approval_events.get())
                        agent_get = asyncio.create_task(agent_events.get())
                        done, pending = await asyncio.wait(
                            {approval_get, agent_get}, timeout=remaining, return_when=asyncio.FIRST_COMPLETED
                        )
                        for pending_task in pending:
                            pending_task.cancel()
                        if not done:
                            task.cancel()
                            raise TimeoutError("Run timed out")
                        if approval_get in done:
                            yield approval_get.result()
                            if agent_get not in done:
                                continue
                        event = agent_get.result()
                        if isinstance(event, Exception):
                            raise event
                        if event is None:
                            await task
                            break
                        data = (
                            {**event.data, "persona": persona}
                            if event.type in ("assistant.delta", "assistant.completed")
                            else event.data
                        )
                        if event.type == "assistant.completed":
                            duration_ms = round(
                                (asyncio.get_running_loop().time() - bot_started) * 1000
                            )
                            admin.table("messages").insert(
                                {
                                    "conversation_id": conversation_id,
                                    "role": "assistant",
                                    "content": event.data["content"],
                                    "persona": persona,
                                    "duration_ms": duration_ms,
                                }
                            ).execute()
                            history.append({"role": "assistant", "content": event.data["content"]})
                            usage = event.data.get("usage") or {}
                            if usage.get("input_tokens") or usage.get("output_tokens"):
                                admin.table("usage_events").insert(
                                    {
                                        "user_id": auth.user_id,
                                        "conversation_id": conversation_id,
                                        "model": provider_model,
                                        "input_tokens": usage.get("input_tokens", 0),
                                        "output_tokens": usage.get("output_tokens", 0),
                                    }
                                ).execute()
                        elif event.type in ("tool.completed", "tool.failed"):
                            admin.table("tool_calls").insert(
                                {
                                    "provider_call_id": event.data["id"],
                                    "conversation_id": conversation_id,
                                    "tool_name": event.data["tool"],
                                    "arguments": event.data["arguments"],
                                    "result": event.data.get("result") or event.data.get("error"),
                                    "status": "completed" if event.type == "tool.completed" else "failed",
                                }
                            ).execute()
                        yield _sse(event.type, data)
            except Exception as exc:
                logger.exception("Agent run failed for conversation %s", conversation_id)
                detail = str(exc) if isinstance(exc, TimeoutError) else "Agent run failed"
                yield _sse("agent.failed", {"error": detail})
                return

            # Name the chat from its opening message, once, after the reply is
            # already streamed — titling costs a model call and shouldn't delay
            # the answer the user is waiting on.
            if current_title == DEFAULT_TITLE and first_user_message:
                title = await generate_title(provider, first_user_message)
                if title:
                    admin.table("conversations").update({"title": title}).eq(
                        "id", conversation_id
                    ).execute()
                    yield _sse("conversation.titled", {"title": title})

            yield _sse("agent.completed", {})
        finally:
            if active_task and not active_task.done():
                active_task.cancel()
            try:
                await provider.close()
            finally:
                try:
                    admin.rpc(
                        "release_conversation_run",
                        {"target_conversation_id": conversation_id, "target_user_id": auth.user_id},
                    ).execute()
                finally:
                    async with _active_runs_guard:
                        _active_runs.discard(conversation_id)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
