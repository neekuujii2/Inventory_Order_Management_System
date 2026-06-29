from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import Customer, Order, OrderItem, Product, User
from app.routers import auth, customers, dashboard, orders, products, seed, categories, warehouses, suppliers, purchase_orders, stock_transfers, returns, audit_logs, settings as app_settings, notifications
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.create_tables_on_startup:
        Base.metadata.create_all(bind=engine)

    if settings.auto_seed:
        db = SessionLocal()
        try:
            product_count = db.query(Product).count()
            if product_count == 0:
                seed_database(db)
        finally:
            db.close()
    yield


app = FastAPI(title="IMS API v1.0", version="1.0.0", lifespan=lifespan)

if settings.enable_gzip:
    app.add_middleware(GZipMiddleware, minimum_size=settings.gzip_minimum_size)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(seed.router, prefix="/seed", tags=["Seed"])
app.include_router(categories.router, tags=["Categories"])
app.include_router(warehouses.router, tags=["Warehouses"])
app.include_router(suppliers.router, tags=["Suppliers"])
app.include_router(purchase_orders.router, tags=["Purchase Orders"])
app.include_router(stock_transfers.router, tags=["Stock Transfers"])
app.include_router(returns.router, tags=["Returns"])
app.include_router(audit_logs.router, tags=["Audit Logs"])
app.include_router(app_settings.router, tags=["Settings"])
app.include_router(notifications.router, tags=["Notifications"])


@app.get("/health")
def health():
    db_status = "ok"
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "status": "ok",
        "database": db_status,
        "environment": settings.app_env,
        "version": "1.0.0",
    }
