from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse
from app.services.audit import log_action

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.post("/", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    supplier = Supplier(
        name=payload.name,
        contact_name=payload.contact_name,
        email=payload.email,
        phone=payload.phone,
        rating=5.0,
        delivery_performance=100.0,
        outstanding_payments=0.0,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    log_action(db, "CREATE_SUPPLIER", f"Created supplier {supplier.name}", "supplier", supplier.id)
    return supplier


@router.get("/", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    if payload.name is not None:
        supplier.name = payload.name
    if payload.contact_name is not None:
        supplier.contact_name = payload.contact_name
    if payload.email is not None:
        supplier.email = payload.email
    if payload.phone is not None:
        supplier.phone = payload.phone
    if payload.rating is not None:
        supplier.rating = payload.rating
    if payload.delivery_performance is not None:
        supplier.delivery_performance = payload.delivery_performance
    if payload.outstanding_payments is not None:
        supplier.outstanding_payments = payload.outstanding_payments

    db.commit()
    db.refresh(supplier)
    log_action(db, "UPDATE_SUPPLIER", f"Updated supplier {supplier.name}", "supplier", supplier.id)
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    log_action(db, "DELETE_SUPPLIER", f"Deleted supplier {supplier_id}", "supplier", supplier_id)
    return
