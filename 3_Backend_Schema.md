# Backend Schema Document
## Inventory & Order Management System (IMS)

**Version:** 1.0.0  
**Date:** 2025

---

## 1. Database Schema (PostgreSQL)

### 1.1 Entity Relationship Diagram (Text)

```
┌─────────────────┐         ┌─────────────────────┐
│    customers    │         │       orders         │
├─────────────────┤         ├─────────────────────┤
│ id (PK)         │◄──────  │ id (PK)              │
│ full_name       │  1  :  N│ customer_id (FK)     │
│ email (UNIQUE)  │         │ status               │
│ phone           │         │ total_amount         │
│ created_at      │         │ created_at           │
└─────────────────┘         └──────────┬──────────┘
                                        │ 1
                                        │
                                        │ N
                            ┌───────────▼──────────┐
                            │     order_items       │
                            ├──────────────────────┤
                            │ id (PK)               │
                            │ order_id (FK)         │
                            │ product_id (FK)       │
                            │ quantity              │
                            │ unit_price            │
                            └──────────┬────────────┘
                                        │ N
                                        │
                                        │ 1
                            ┌───────────▼──────────┐
                            │       products        │
                            ├──────────────────────┤
                            │ id (PK)               │
                            │ name                  │
                            │ sku (UNIQUE)          │
                            │ price                 │
                            │ quantity              │
                            │ created_at            │
                            │ updated_at            │
                            └──────────────────────┘
```

---

## 2. Table Definitions (SQL DDL)

### 2.1 `products` Table

```sql
CREATE TABLE products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200)   NOT NULL,
    sku         VARCHAR(50)    NOT NULL UNIQUE,
    price       NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    quantity    INTEGER        NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_sku ON products (sku);
CREATE INDEX idx_products_quantity ON products (quantity);
```

### 2.2 `customers` Table

```sql
CREATE TABLE customers (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(200) NOT NULL,
    email       VARCHAR(254) NOT NULL UNIQUE,
    phone       VARCHAR(20)  NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers (email);
```

### 2.3 `orders` Table

```sql
CREATE TYPE order_status AS ENUM ('pending', 'fulfilled', 'cancelled');

CREATE TABLE orders (
    id            SERIAL PRIMARY KEY,
    customer_id   INTEGER        NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status        order_status   NOT NULL DEFAULT 'pending',
    total_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created_at ON orders (created_at DESC);
```

### 2.4 `order_items` Table

```sql
CREATE TABLE order_items (
    id          SERIAL PRIMARY KEY,
    order_id    INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  INTEGER        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity    INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10, 2) NOT NULL CHECK (unit_price > 0)
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);
```

---

## 3. SQLAlchemy Models (Python)

### 3.1 `models/product.py`

```python
from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from app.database import Base

class Product(Base):
    __tablename__ = "products"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(200), nullable=False)
    sku        = Column(String(50), unique=True, nullable=False, index=True)
    price      = Column(Numeric(10, 2), nullable=False)
    quantity   = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### 3.2 `models/customer.py`

```python
from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id         = Column(Integer, primary_key=True, index=True)
    full_name  = Column(String(200), nullable=False)
    email      = Column(String(254), unique=True, nullable=False, index=True)
    phone      = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders     = relationship("Order", back_populates="customer")
```

### 3.3 `models/order.py`

```python
import enum
from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import relationship
from app.database import Base

class OrderStatus(str, enum.Enum):
    pending   = "pending"
    fulfilled = "fulfilled"
    cancelled = "cancelled"

class Order(Base):
    __tablename__ = "orders"

    id           = Column(Integer, primary_key=True, index=True)
    customer_id  = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status       = Column(Enum(OrderStatus), default=OrderStatus.pending, nullable=False)
    total_amount = Column(Numeric(12, 2), default=0, nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    customer     = relationship("Customer", back_populates="orders")
    items        = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order      = relationship("Order", back_populates="items")
    product    = relationship("Product")
```

---

## 4. Pydantic Schemas

### 4.1 `schemas/product.py`

```python
from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import datetime
from typing import Optional

class ProductBase(BaseModel):
    name:     str
    sku:      str
    price:    Decimal
    quantity: int

    @field_validator('price')
    def price_must_be_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v

    @field_validator('quantity')
    def quantity_must_be_non_negative(cls, v):
        if v < 0:
            raise ValueError('Quantity cannot be negative')
        return v

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name:     Optional[str]     = None
    price:    Optional[Decimal] = None
    quantity: Optional[int]     = None

class ProductResponse(ProductBase):
    id:         int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
```

### 4.2 `schemas/customer.py`

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime

class CustomerBase(BaseModel):
    full_name: str
    email:     EmailStr
    phone:     str

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id:         int
    created_at: datetime

    class Config:
        from_attributes = True
```

### 4.3 `schemas/order.py`

```python
from pydantic import BaseModel
from typing import List
from decimal import Decimal
from datetime import datetime

class OrderItemInput(BaseModel):
    product_id: int
    quantity:   int

class OrderCreate(BaseModel):
    customer_id: int
    items:       List[OrderItemInput]

class OrderItemResponse(BaseModel):
    product_id:   int
    product_name: str
    quantity:     int
    unit_price:   Decimal
    subtotal:     Decimal

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id:           int
    customer_id:  int
    customer_name: str
    status:       str
    total_amount: Decimal
    items:        List[OrderItemResponse]
    created_at:   datetime

    class Config:
        from_attributes = True
```

---

## 5. CRUD Operations

### 5.1 Create Order (Key Transaction Logic)

```python
# crud/order.py
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import OrderCreate
from decimal import Decimal

def create_order(db: Session, order_in: OrderCreate) -> Order:
    # 1. Validate all products exist and have sufficient stock
    order_items = []
    total = Decimal("0")

    for item in order_in.items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).with_for_update().first()  # row-level lock

        if not product:
            raise HTTPException(404, f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            raise HTTPException(400,
                f"Insufficient stock for '{product.name}'. "
                f"Available: {product.quantity}, Requested: {item.quantity}"
            )

        subtotal = product.price * item.quantity
        total += subtotal
        order_items.append((product, item.quantity, product.price))

    # 2. Create order record
    order = Order(customer_id=order_in.customer_id, total_amount=total)
    db.add(order)
    db.flush()  # get order.id without committing

    # 3. Create order items and reduce stock atomically
    for product, qty, price in order_items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=price
        ))
        product.quantity -= qty  # auto-tracked by SQLAlchemy

    db.commit()
    db.refresh(order)
    return order
```

---

## 6. Database Connection (`database.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/imsdb")

engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## 7. Alembic Migration Setup

```bash
# Initialize
alembic init alembic

# alembic/env.py — target_metadata
from app.models import product, customer, order
from app.database import Base
target_metadata = Base.metadata

# Generate initial migration
alembic revision --autogenerate -m "initial schema"

# Apply
alembic upgrade head
```

---

## 8. Dashboard Query

```python
# routers/dashboard.py
from sqlalchemy import func

def get_stats(db: Session):
    total_products  = db.query(func.count(Product.id)).scalar()
    total_customers = db.query(func.count(Customer.id)).scalar()
    total_orders    = db.query(func.count(Order.id)).scalar()
    low_stock       = db.query(Product).filter(Product.quantity < 10).all()

    return {
        "total_products":  total_products,
        "total_customers": total_customers,
        "total_orders":    total_orders,
        "low_stock":       low_stock
    }
```

---

*End of Backend Schema Document*
