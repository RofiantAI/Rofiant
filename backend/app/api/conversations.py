from fastapi import APIRouter, Depends, HTTPException, status

from app.api.auth import AuthContext, get_current_user
from app.schemas.conversation import ConversationCreate, ConversationOut
from app.services.supabase import get_user_client

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationOut])
async def list_conversations(auth: AuthContext = Depends(get_current_user)):
    client = get_user_client(auth.access_token)
    resp = (
        client.table("conversations")
        .select("*")
        .order("updated_at", desc=True)
        .execute()
    )
    return resp.data


@router.post("", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    body: ConversationCreate, auth: AuthContext = Depends(get_current_user)
):
    client = get_user_client(auth.access_token)
    resp = (
        client.table("conversations")
        .insert(
            {
                "user_id": auth.user_id,
                "title": body.title,
                "persona": body.persona,
                "personas": body.personas,
            }
        )
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=500, detail="Failed to create conversation")
    return resp.data[0]
