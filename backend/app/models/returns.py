import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class ReturnType(str, enum.Enum):
    customer = "customer"
    supplier = "supplier"


class ReturnStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    completed = "completed"
    rejected = "rejected"


class Return(Base):
    __tablename__ = "returns"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[ReturnType] = mapped_column(Enum(ReturnType, native_enum=False, length=20), nullable=False)
    status: Mapped[ReturnStatus] = mapped_column(
        Enum(ReturnStatus, native_enum=False, length=20),
        nullable=False,
        default=ReturnStatus.pending,
    )
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product")
