from datetime import datetime
from decimal import Decimal
from typing import List

from pydantic import BaseModel, ConfigDict, field_validator


class OrderItemInput(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("Quantity must be greater than 0")
        return value


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemInput]

    @field_validator("items")
    @classmethod
    def validate_items(cls, value: List[OrderItemInput]) -> List[OrderItemInput]:
        if not value:
            raise ValueError("At least one order item is required")
        return value


class OrderItemResponse(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: str
    status: str
    total_amount: Decimal
    items: List[OrderItemResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
