from datetime import datetime
from pydantic import BaseModel, Field
from app.models.returns import ReturnType, ReturnStatus


class ReturnBase(BaseModel):
    type: ReturnType
    status: ReturnStatus = ReturnStatus.pending
    product_id: int
    quantity: int = Field(..., gt=0)
    reason: str = Field(..., max_length=500)


class ReturnCreate(ReturnBase):
    pass


class ReturnUpdate(BaseModel):
    status: ReturnStatus | None = None
    reason: str | None = Field(None, max_length=500)


class ReturnResponse(ReturnBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
