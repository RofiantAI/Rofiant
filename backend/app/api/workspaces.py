import shlex
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.agent.tools.base import WORKSPACE_ROOT, resolve_workspace_path
from app.api.auth import AuthContext, get_current_user
from app.schemas.tool_call import FileContentOut, FileEntryOut, FileWriteIn, ToolCallOut
from app.services.lsp import sync_file_to_mirror
from app.services.sandbox import sandbox_provider
from app.services.supabase import get_user_client

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


async def _sandbox_id_for(client, conversation_id: UUID) -> str:
    resp = (
        client.table("workspaces")
        .select("sandbox_id")
        .eq("conversation_id", str(conversation_id))
        .maybe_single()
        .execute()
    )
    row = resp.data if resp else None
    if not row:
        raise HTTPException(status_code=404, detail="No workspace for this conversation yet")
    return row["sandbox_id"]


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def destroy_workspace(conversation_id: UUID, auth: AuthContext = Depends(get_current_user)):
    """Kills the sandbox/container backing this conversation. Call before
    deleting the conversation row — otherwise the sandbox leaks forever,
    since nothing else ever tears it down."""
    client = get_user_client(auth.access_token)
    resp = (
        client.table("workspaces")
        .select("sandbox_id")
        .eq("conversation_id", str(conversation_id))
        .maybe_single()
        .execute()
    )
    row = resp.data if resp else None
    if not row:
        return
    await sandbox_provider.destroy(row["sandbox_id"])


@router.get("/{conversation_id}/files", response_model=list[FileEntryOut])
async def list_workspace_files(
    conversation_id: UUID,
    path: str = Query(default="."),
    auth: AuthContext = Depends(get_current_user),
):
    client = get_user_client(auth.access_token)
    sandbox_id = await _sandbox_id_for(client, conversation_id)
    resolved = resolve_workspace_path(path)
    entries = await sandbox_provider.list_files(sandbox_id, resolved)
    return [FileEntryOut(name=e.name, path=e.path, is_dir=e.is_dir) for e in entries]


@router.get("/{conversation_id}/files/content", response_model=FileContentOut)
async def read_workspace_file(
    conversation_id: UUID,
    path: str = Query(...),
    auth: AuthContext = Depends(get_current_user),
):
    client = get_user_client(auth.access_token)
    sandbox_id = await _sandbox_id_for(client, conversation_id)
    resolved = resolve_workspace_path(path)
    content = await sandbox_provider.read_file(sandbox_id, resolved)
    return FileContentOut(path=path, content=content)


@router.put("/{conversation_id}/files/content", response_model=FileContentOut)
async def write_workspace_file(
    conversation_id: UUID,
    body: FileWriteIn,
    path: str = Query(...),
    auth: AuthContext = Depends(get_current_user),
):
    client = get_user_client(auth.access_token)
    sandbox_id = await _sandbox_id_for(client, conversation_id)
    resolved = resolve_workspace_path(path)
    await sandbox_provider.write_file(sandbox_id, resolved, body.content)
    sync_file_to_mirror(str(conversation_id), path, body.content)
    return FileContentOut(path=path, content=body.content)


@router.delete("/{conversation_id}/files", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_file(
    conversation_id: UUID,
    path: str = Query(...),
    auth: AuthContext = Depends(get_current_user),
):
    client = get_user_client(auth.access_token)
    sandbox_id = await _sandbox_id_for(client, conversation_id)
    resolved = resolve_workspace_path(path)
    if resolved == WORKSPACE_ROOT:
        raise HTTPException(status_code=400, detail="Refusing to delete the workspace root")
    result = await sandbox_provider.execute(sandbox_id, f"rm -rf {shlex.quote(resolved)}")
    if result.exit_code != 0:
        raise HTTPException(status_code=500, detail=result.stderr.strip() or "Delete failed")


@router.post("/{conversation_id}/files/rename", response_model=FileEntryOut)
async def rename_workspace_file(
    conversation_id: UUID,
    path: str = Query(...),
    new_name: str = Query(...),
    auth: AuthContext = Depends(get_current_user),
):
    """Renames within the same directory — new_name is a bare filename, never
    a path, so a rename can't move an entry out of its folder."""
    if not new_name.strip() or "/" in new_name:
        raise HTTPException(status_code=400, detail="Name must not be empty or contain '/'")
    client = get_user_client(auth.access_token)
    sandbox_id = await _sandbox_id_for(client, conversation_id)
    resolved = resolve_workspace_path(path)
    if resolved == WORKSPACE_ROOT:
        raise HTTPException(status_code=400, detail="Refusing to rename the workspace root")
    parent = resolved.rsplit("/", 1)[0]
    target = resolve_workspace_path(f"{parent}/{new_name.strip()}")
    # `mv -n` exits 0 when the target exists, so check first rather than
    # reporting a rename that silently didn't happen.
    exists = await sandbox_provider.execute(sandbox_id, f"test -e {shlex.quote(target)}")
    if exists.exit_code == 0:
        raise HTTPException(status_code=409, detail=f"{new_name} already exists")
    result = await sandbox_provider.execute(
        sandbox_id, f"mv {shlex.quote(resolved)} {shlex.quote(target)}"
    )
    if result.exit_code != 0:
        raise HTTPException(status_code=500, detail=result.stderr.strip() or "Rename failed")
    is_dir = (await sandbox_provider.execute(sandbox_id, f"test -d {shlex.quote(target)}")).exit_code == 0
    # ponytail: the LSP mirror isn't updated here — it is already a one-shot
    # snapshot that goes stale on agent edits, and reopening the editor rebuilds it.
    return FileEntryOut(name=new_name.strip(), path=target, is_dir=is_dir)


@router.get("/{conversation_id}/tool-calls", response_model=list[ToolCallOut])
async def list_tool_calls(conversation_id: UUID, auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    resp = (
        client.table("tool_calls")
        .select("*")
        .eq("conversation_id", str(conversation_id))
        .order("created_at")
        .execute()
    )
    return [
        {**row, "id": row.get("provider_call_id") or str(row["id"])}
        for row in (resp.data or [])
    ]
