from datetime import datetime
from pydantic import BaseModel, Field
from app.models.stock_transfer import TransferStatus


class StockTransferBase(BaseModel):
    source_warehouse_id: int
    destination_warehouse_id: int
    product_id: int
    quantity: int = Field(..., gt=0)
    status: TransferStatus = TransferStatus.pending


class StockTransferCreate(StockTransferBase):
    pass


class StockTransferUpdate(BaseModel):
    status: TransferStatus | None = None
    quantity: int | None = Field(None, gt=0)


class StockTransferResponse(StockTransferBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
