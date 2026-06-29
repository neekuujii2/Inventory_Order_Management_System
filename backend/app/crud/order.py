from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate


def _order_detail_query():
    return (
        select(Order)
        .options(
            joinedload(Order.customer),
            selectinload(Order.items).joinedload(OrderItem.product),
        )
        .order_by(Order.id.desc())
    )


def get_all(db: Session, skip: int = 0, limit: int = 25) -> list[Order]:
    statement = _order_detail_query().offset(skip).limit(limit)
    return list(db.execute(statement).scalars().unique().all())


def get_by_id(db: Session, order_id: int) -> Order | None:
    statement = _order_detail_query().where(Order.id == order_id)
    return db.execute(statement).scalars().unique().one_or_none()


def create_order(db: Session, order_in: OrderCreate) -> Order:
    customer = db.get(Customer, order_in.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    locked_items: list[tuple[Product, int, Decimal]] = []
    total = Decimal("0.00")

    for item in order_in.items:
        statement = select(Product).where(Product.id == item.product_id).with_for_update()
        product = db.execute(statement).scalar_one_or_none()

        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for '{product.name}'. "
                    f"Available: {product.quantity}, Requested: {item.quantity}"
                ),
            )

        subtotal = product.price * item.quantity
        total += subtotal
        locked_items.append((product, item.quantity, product.price))

    order = Order(customer_id=order_in.customer_id, total_amount=total)
    db.add(order)
    db.flush()

    for product, quantity, unit_price in locked_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=unit_price,
            )
        )
        product.quantity -= quantity

    order_id = order.id
    db.commit()
    order = get_by_id(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found after creation")
    return order


def delete_by_id(db: Session, order_id: int) -> bool:
    order = db.get(Order, order_id)
    if not order:
        return False
    db.delete(order)
    db.commit()
    return True
