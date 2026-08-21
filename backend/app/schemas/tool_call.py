from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel

ToolCallStatus = Literal["completed", "failed"]


class ToolCallOut(BaseModel):
    id: UUID
    conversation_id: UUID
    tool_name: str
    arguments: dict[str, Any]
    result: Any
    status: ToolCallStatus
    created_at: datetime


class FileEntryOut(BaseModel):
    name: str
    path: str
    is_dir: bool


class FileContentOut(BaseModel):
    path: str
    content: str


class FileWriteIn(BaseModel):
    content: str
