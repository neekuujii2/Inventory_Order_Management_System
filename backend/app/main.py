from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import Customer, Order, OrderItem, Product
from app.routers import customers, dashboard, orders, products, seed
from app.seed import seed_database


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Auto-seed database on startup if empty
    db = SessionLocal()
    try:
        product_count = db.query(Product).count()
        if product_count == 0:
            seed_database(db)
    finally:
        db.close()
    yield


app = FastAPI(title="IMS API v1.0", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(orders.router, prefix="/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(seed.router, prefix="/seed", tags=["Seed"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
