from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.warehouse import Warehouse, WarehouseStock
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseResponse, WarehouseStockResponse
from app.services.audit import log_action

router = APIRouter(prefix="/warehouses", tags=["Warehouses"])


@router.post("/", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(payload: WarehouseCreate, db: Session = Depends(get_db)):
    existing = db.query(Warehouse).filter(Warehouse.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Warehouse code already exists")

    warehouse = Warehouse(
        name=payload.name,
        code=payload.code,
        location=payload.location,
        capacity_sqft=payload.capacity_sqft,
        current_utilization_pct=0.0,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    log_action(db, "CREATE_WAREHOUSE", f"Created warehouse {warehouse.name}", "warehouse", warehouse.id)
    return warehouse


@router.get("/", response_model=list[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return w


@router.put("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(warehouse_id: int, payload: WarehouseUpdate, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    if payload.name is not None:
        w.name = payload.name
    if payload.code is not None:
        w.code = payload.code
    if payload.location is not None:
        w.location = payload.location
    if payload.capacity_sqft is not None:
        w.capacity_sqft = payload.capacity_sqft

    db.commit()
    db.refresh(w)
    log_action(db, "UPDATE_WAREHOUSE", f"Updated warehouse {w.name}", "warehouse", w.id)
    return w


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(w)
    db.commit()
    log_action(db, "DELETE_WAREHOUSE", f"Deleted warehouse {warehouse_id}", "warehouse", warehouse_id)
    return


@router.get("/{warehouse_id}/stock", response_model=list[WarehouseStockResponse])
def get_warehouse_stock(warehouse_id: int, db: Session = Depends(get_db)):
    return db.query(WarehouseStock).filter(WarehouseStock.warehouse_id == warehouse_id).all()
