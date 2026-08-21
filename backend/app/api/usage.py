from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.api.auth import AuthContext, get_current_user
from app.services.supabase import get_user_client

router = APIRouter(prefix="/api/usage", tags=["usage"])


class UsageTotals(BaseModel):
    input_tokens: int
    output_tokens: int


class UsageSummary(BaseModel):
    session: UsageTotals
    week: UsageTotals


def _sum(rows: list[dict]) -> UsageTotals:
    return UsageTotals(
        input_tokens=sum(r["input_tokens"] for r in rows),
        output_tokens=sum(r["output_tokens"] for r in rows),
    )


@router.get("/summary", response_model=UsageSummary)
async def usage_summary(
    conversation_id: str = Query(...),
    auth: AuthContext = Depends(get_current_user),
):
    """"Session" is this conversation (the app has no broader session concept);
    "week" is the trailing 7 days across all of the user's conversations."""
    client = get_user_client(auth.access_token)

    session_resp = (
        client.table("usage_events")
        .select("input_tokens,output_tokens")
        .eq("conversation_id", conversation_id)
        .execute()
    )

    week_start = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    week_resp = (
        client.table("usage_events")
        .select("input_tokens,output_tokens")
        .eq("user_id", auth.user_id)
        .gte("created_at", week_start)
        .execute()
    )

    return UsageSummary(session=_sum(session_resp.data or []), week=_sum(week_resp.data or []))
