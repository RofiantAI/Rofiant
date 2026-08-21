from supabase import Client

from app.services.sandbox import sandbox_provider


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
    client.table("workspaces").insert(
        {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "sandbox_id": sandbox_id,
            "status": "active",
        }
    ).execute()
    return sandbox_id
