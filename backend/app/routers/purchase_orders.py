from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
from app.models.product import Product
from app.models.warehouse import Warehouse, WarehouseStock
from app.schemas.purchase_order import PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse
from app.services.audit import log_action

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(payload: PurchaseOrderCreate, db: Session = Depends(get_db)):
    po = PurchaseOrder(
        supplier_id=payload.supplier_id,
        status=payload.status,
        total_amount=0,
    )
    db.add(po)
    db.flush()

    total = 0
    for item in payload.items:
        prod = db.query(Product).filter(Product.id == item.product_id).first()
        if not prod:
            raise HTTPException(status_code=400, detail=f"Product with ID {item.product_id} not found")

        po_item = PurchaseOrderItem(
            purchase_order_id=po.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
        )
        db.add(po_item)
        total += item.quantity * item.unit_price

    po.total_amount = total
    db.commit()
    db.refresh(po)
    log_action(db, "CREATE_PURCHASE_ORDER", f"Created purchase order #{po.id}", "purchase_order", po.id)
    return po


@router.get("/", response_model=list[PurchaseOrderResponse])
def list_purchase_orders(db: Session = Depends(get_db)):
    return db.query(PurchaseOrder).all()


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(po_id: int, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return po


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(po_id: int, payload: PurchaseOrderUpdate, db: Session = Depends(get_db)):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    old_status = po.status
    if payload.status is not None:
        po.status = payload.status

        # If PO status transitions to "received", increment product qty and warehouse stock
        if old_status != PurchaseOrderStatus.received and payload.status == PurchaseOrderStatus.received:
            default_warehouse = db.query(Warehouse).first()
            if not default_warehouse:
                default_warehouse = Warehouse(
                    name="Main Hub",
                    code="MAIN-01",
                    location="Central Depot",
                    capacity_sqft=50000,
                    current_utilization_pct=10.0,
                )
                db.add(default_warehouse)
                db.flush()

            for item in po.items:
                prod = db.query(Product).filter(Product.id == item.product_id).first()
                if prod:
                    prod.quantity += item.quantity

                stock = (
                    db.query(WarehouseStock)
                    .filter(
                        WarehouseStock.warehouse_id == default_warehouse.id,
                        WarehouseStock.product_id == item.product_id,
                    )
                    .first()
                )
                if stock:
                    stock.quantity += item.quantity
                else:
                    stock = WarehouseStock(
                        warehouse_id=default_warehouse.id,
                        product_id=item.product_id,
                        quantity=item.quantity,
                        batch_number="BATCH-" + str(po_id),
                        location_code="AISLE-1",
                    )
                    db.add(stock)

            total_stock = db.query(WarehouseStock).filter(WarehouseStock.warehouse_id == default_warehouse.id).all()
            total_qty = sum(s.quantity for s in total_stock)
            default_warehouse.current_utilization_pct = min(100.0, float(total_qty / 100.0))

    if payload.supplier_id is not None:
        po.supplier_id = payload.supplier_id

    db.commit()
    db.refresh(po)
    log_action(
        db,
        "UPDATE_PURCHASE_ORDER",
        f"Updated purchase order #{po.id} status to {po.status}",
        "purchase_order",
        po.id,
    )
    return po
