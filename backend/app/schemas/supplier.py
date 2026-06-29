from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field


class SupplierBase(BaseModel):
    name: str = Field(..., max_length=200)
    contact_name: str | None = Field(None, max_length=200)
    email: EmailStr
    phone: str = Field(..., max_length=50)


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    rating: float | None = None
    delivery_performance: float | None = None
    outstanding_payments: Decimal | None = None


class SupplierResponse(SupplierBase):
    id: int
    rating: float
    delivery_performance: float
    outstanding_payments: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
