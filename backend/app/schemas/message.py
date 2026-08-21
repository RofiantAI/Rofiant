from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

MessageRole = Literal["user", "assistant", "system", "tool"]


class MessageCreate(BaseModel):
    conversation_id: UUID
    role: MessageRole
    content: str


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    persona: str | None = None
    created_at: datetime
