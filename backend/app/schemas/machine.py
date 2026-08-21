from pydantic import BaseModel


class MachineStatus(BaseModel):
    """Safe status object for the frontend -- no provider ids, no secrets."""

    status: str
    region: str | None
    bot_count: int
    error_message: str | None = None


class BotCreate(BaseModel):
    name: str
    config: dict = {}


class Bot(BaseModel):
    id: str
    name: str
    status: str
    config: dict
