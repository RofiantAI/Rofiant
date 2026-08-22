from supabase import Client

from app.services.sandbox import sandbox_provider
from app.services.supabase import get_admin_client


async def get_or_create_workspace(client: Client, user_id: str, conversation_id: str) -> str:
    """Returns the sandbox_id for this conversation's workspace, creating one
    (and a sandbox to back it) on first use."""
    resp = (
        client.table("workspaces")
        .select("*")
        .eq("conversation_id", conversation_id)
        .maybe_single()
        .execute()
    )
    row = resp.data if resp else None
    if row:
        return row["sandbox_id"]

    sandbox_id = await sandbox_provider.create()
    admin = get_admin_client()
    try:
        admin.table("workspaces").insert(
            {
                "user_id": user_id,
                "conversation_id": conversation_id,
                "sandbox_id": sandbox_id,
                "status": "active",
            }
        ).execute()
    except Exception:
        await sandbox_provider.destroy(sandbox_id)
        winner = (
            client.table("workspaces")
            .select("sandbox_id")
            .eq("conversation_id", conversation_id)
            .maybe_single()
            .execute()
        )
        if winner.data:
            return winner.data["sandbox_id"]
        raise
    return sandbox_id
