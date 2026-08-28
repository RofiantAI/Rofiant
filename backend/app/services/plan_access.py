"""Plan gating, mirrors RofiantWebsite's src/lib/service-plan-access.ts.

Plan lives on the shared Supabase auth.users.app_metadata.plan (same DB as
the website), so no extra table or API call is needed here.
"""

from fastapi import HTTPException

PLANS = ("free", "pro", "ultra")
PRODUCT_TOOLS = ("chat", "voice", "workflows")

PLAN_TOOLS: dict[str, tuple[str, ...]] = {
    "free": ("chat",),
    "pro": ("chat", "voice"),
    "ultra": ("chat", "voice", "workflows"),
}


def normalize_plan(plan: str | None) -> str:
    value = (plan or "free").lower()
    return value if value in PLANS else "free"


def can_access_tool(plan: str | None, tool: str) -> bool:
    return tool in PLAN_TOOLS[normalize_plan(plan)]


def require_tool(plan: str | None, tool: str) -> None:
    if can_access_tool(plan, tool):
        return
    min_plan = next(p for p in PLANS if tool in PLAN_TOOLS[p])
    raise HTTPException(
        status_code=403,
        detail=f"This feature requires the {min_plan.capitalize()} plan or higher.",
    )
