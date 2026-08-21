import asyncio
import json
from collections.abc import AsyncIterator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.agent.models.anthropic import AnthropicProvider
from app.agent.models.base import ModelProvider
from app.agent.models.openrouter import OpenRouterProvider
from app.agent.prompts import system_prompt_for
from app.agent.runner import MAX_STEPS, run_agent
from app.agent.title import DEFAULT_TITLE, generate_title
from app.api.auth import AuthContext, get_current_user
from app.config import settings
from app.schemas.message import MessageCreate, MessageOut
from app.services.anthropic_oauth import get_access_token
from app.services.supabase import get_user_client
from app.services.workspace import get_or_create_workspace

router = APIRouter(prefix="/api/messages", tags=["messages"])

# A single backend process serves the desktop app. Keep at most one agent
# run active per conversation so duplicate clicks/requests cannot execute
# tools and persist replies from the same history snapshot twice.
_active_runs: set[str] = set()
_active_runs_guard = asyncio.Lock()


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_message(body: MessageCreate, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    # No explicit ownership check needed here: the messages_insert_own RLS
    # policy rejects the insert if this conversation isn't the caller's.
    resp = (
        client.table("messages")
        .insert(
            {
                "conversation_id": str(body.conversation_id),
                "role": body.role,
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


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


@router.post("/stream")
async def stream_reply(body: StreamRequest, auth: AuthContext = Depends(get_current_user)):
    """Run the agent loop for this conversation: load history, let the model
    reply and optionally call tools (in a lazily-created sandbox workspace),
    streaming every step to the client and persisting the results."""
    client = get_user_client(auth.access_token)
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

    # Claude models run on the user's own connected subscription; everything
    # else falls back to the app-paid free OpenRouter tier. A non-free,
    # non-Claude id in the body is ignored rather than trusted.
    provider: ModelProvider
    if body.model and body.model.startswith("claude-"):
        token = await get_access_token(client, auth.user_id)
        if not token:
            raise HTTPException(status_code=400, detail="Claude account not connected")
        provider = AnthropicProvider(model=body.model, oauth_access_token=token)
        provider_model = body.model
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

    async def get_sandbox_id() -> str:
        return await get_or_create_workspace(client, auth.user_id, conversation_id)

    async with _active_runs_guard:
        if conversation_id in _active_runs:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An agent run is already active for this conversation",
            )
        _active_runs.add(conversation_id)

    async def event_stream() -> AsyncIterator[str]:
        try:
            yield _sse("agent.started", {})
            # Running history: each bot below sees every prior bot's reply
            # from this same turn, not just what was on disk when we started.
            history = list(history_resp.data)
            try:
                for persona in bots:
                    system_prompt = system_prompt_for(persona) + skills_suffix
                    async for event in run_agent(
                        history=history,
                        provider=provider,
                        get_sandbox_id=get_sandbox_id,
                        max_steps=body.max_steps,
                        system_prompt=system_prompt,
                    ):
                        data = (
                            {**event.data, "persona": persona}
                            if event.type in ("assistant.delta", "assistant.completed")
                            else event.data
                        )
                        yield _sse(event.type, data)

                        if event.type == "assistant.completed":
                            client.table("messages").insert(
                                {
                                    "conversation_id": conversation_id,
                                    "role": "assistant",
                                    "content": event.data["content"],
                                    "persona": persona,
                                }
                            ).execute()
                            history.append({"role": "assistant", "content": event.data["content"]})
                            usage = event.data.get("usage") or {}
                            if usage.get("input_tokens") or usage.get("output_tokens"):
                                client.table("usage_events").insert(
                                    {
                                        "user_id": auth.user_id,
                                        "conversation_id": conversation_id,
                                        "model": provider_model,
                                        "input_tokens": usage.get("input_tokens", 0),
                                        "output_tokens": usage.get("output_tokens", 0),
                                    }
                                ).execute()
                        elif event.type in ("tool.completed", "tool.failed"):
                            client.table("tool_calls").insert(
                                {
                                    "conversation_id": conversation_id,
                                    "tool_name": event.data["tool"],
                                    "arguments": event.data["arguments"],
                                    "result": event.data.get("result") or event.data.get("error"),
                                    "status": "completed" if event.type == "tool.completed" else "failed",
                                }
                            ).execute()
            except Exception as exc:
                yield _sse("agent.failed", {"error": str(exc)})
                return

            # Name the chat from its opening message, once, after the reply is
            # already streamed — titling costs a model call and shouldn't delay
            # the answer the user is waiting on.
            if current_title == DEFAULT_TITLE and first_user_message:
                title = await generate_title(provider, first_user_message)
                if title:
                    client.table("conversations").update({"title": title}).eq(
                        "id", conversation_id
                    ).execute()
                    yield _sse("conversation.titled", {"title": title})

            yield _sse("agent.completed", {})
        finally:
            async with _active_runs_guard:
                _active_runs.discard(conversation_id)

    return StreamingResponse(event_stream(), media_type="text/event-stream")
