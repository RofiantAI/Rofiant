from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str = "New chat"
    persona: str = "agent"
    # Group chat roster. None/one entry = solo chat, unchanged behavior.
    personas: list[str] | None = None


class ConversationOut(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    persona: str = "agent"
    personas: list[str] | None = None
    subtitle: str | None = None
    description: str | None = None
    notifications_enabled: bool = False
    created_at: datetime
    updated_at: datetime
