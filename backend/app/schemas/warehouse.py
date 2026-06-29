from datetime import datetime
from pydantic import BaseModel, Field


class WarehouseStockBase(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=0)
    batch_number: str | None = None
    serial_number: str | None = None
    expiry_date: datetime | None = None
    location_code: str | None = None


class WarehouseStockCreate(WarehouseStockBase):
    pass


class WarehouseStockResponse(WarehouseStockBase):
    id: int
    warehouse_id: int

    class Config:
        from_attributes = True


class WarehouseBase(BaseModel):
    name: str = Field(..., max_length=200)
    code: str = Field(..., max_length=50)
    location: str | None = Field(None, max_length=500)
    capacity_sqft: int = Field(10000, ge=0)


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    location: str | None = None
    capacity_sqft: int | None = None


class WarehouseResponse(WarehouseBase):
    id: int
    current_utilization_pct: float
    created_at: datetime

    class Config:
        from_attributes = True
