from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product

router = APIRouter()


class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    price: Decimal
    quantity: int

    model_config = ConfigDict(from_attributes=True)


class DashboardStatsResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    low_stock: list[LowStockProduct]
    recent_revenue: float


@router.get("/stats", response_model=DashboardStatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total_products = db.execute(select(func.count(Product.id))).scalar_one()
    total_customers = db.execute(select(func.count(Customer.id))).scalar_one()
    total_orders = db.execute(select(func.count(Order.id))).scalar_one()
    low_stock = list(
        db.execute(
            select(Product)
            .where(Product.quantity < settings.low_stock_threshold)
            .order_by(Product.quantity, Product.id)
            .limit(settings.dashboard_low_stock_limit)
        )
        .scalars()
        .all()
    )
    # Calculate revenue from non-cancelled orders
    recent_revenue = db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(Order.status != "cancelled")
    ).scalar_one()

    return DashboardStatsResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        low_stock=low_stock,
        recent_revenue=float(recent_revenue),
    )
