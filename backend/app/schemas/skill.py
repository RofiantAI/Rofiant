from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SkillCreate(BaseModel):
    source_url: str


class SkillOut(BaseModel):
    id: UUID
    name: str
    description: str
    source_url: str
    created_at: datetime
