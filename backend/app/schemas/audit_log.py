from datetime import datetime
from pydantic import BaseModel


class AuditLogBase(BaseModel):
    user_email: str | None = None
    action: str
    entity_type: str | None = None
    entity_id: int | None = None
    details: str | None = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
