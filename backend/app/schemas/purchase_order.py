from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field
from app.models.purchase_order import PurchaseOrderStatus


class PurchaseOrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItemResponse(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    status: PurchaseOrderStatus = PurchaseOrderStatus.draft


class PurchaseOrderCreate(PurchaseOrderBase):
    items: list[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    status: PurchaseOrderStatus | None = None
    supplier_id: int | None = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    total_amount: Decimal
    created_at: datetime
    items: list[PurchaseOrderItemResponse] = []

    class Config:
        from_attributes = True
