from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.crud import order as order_crud
from app.database import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter()


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


def _serialize_order(order: Order) -> OrderResponse:
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=order.customer.full_name,
        status=order.status.value if hasattr(order.status, "value") else str(order.status),
        total_amount=order.total_amount,
        items=[
            {
                "product_id": item.product_id,
                "product_name": item.product.name,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": Decimal(item.unit_price) * item.quantity,
            }
            for item in order.items
        ],
        created_at=order.created_at,
    )


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_in: OrderCreate, db: Session = Depends(get_db)):
    order = order_crud.create_order(db, order_in)
    return _serialize_order(order)


@router.get("/", response_model=list[OrderResponse])
def list_orders(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
):
    return [_serialize_order(order) for order in order_crud.get_all(db, skip=skip, limit=limit)]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = order_crud.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(order)


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, payload: OrderStatusUpdate, db: Session = Depends(get_db)):
    order = order_crud.get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    refreshed = order_crud.get_by_id(db, order_id)
    if not refreshed:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(refreshed)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    deleted = order_crud.delete_by_id(db, order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
