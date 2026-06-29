from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, CheckConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    location: Mapped[str] = mapped_column(String(500), nullable=False)
    capacity_sqft: Mapped[int] = mapped_column(Integer, default=10000)
    current_utilization_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    stock = relationship("WarehouseStock", back_populates="warehouse", cascade="all, delete-orphan")


class WarehouseStock(Base):
    __tablename__ = "warehouse_stocks"
    __table_args__ = (
        CheckConstraint("quantity >= 0", name="ck_warehouse_stocks_quantity_non_negative"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    warehouse_id: Mapped[int] = mapped_column(ForeignKey("warehouses.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    batch_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location_code: Mapped[str | None] = mapped_column(String(50), nullable=True)

    warehouse = relationship("Warehouse", back_populates="stock")
    product = relationship("Product", back_populates="warehouse_stocks")
