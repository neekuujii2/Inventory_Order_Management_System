from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.stock_transfer import StockTransfer, TransferStatus
from app.models.warehouse import Warehouse, WarehouseStock
from app.schemas.stock_transfer import StockTransferCreate, StockTransferUpdate, StockTransferResponse
from app.services.audit import log_action

router = APIRouter(prefix="/stock-transfers", tags=["Stock Transfers"])


@router.post("/", response_model=StockTransferResponse, status_code=status.HTTP_201_CREATED)
def create_stock_transfer(payload: StockTransferCreate, db: Session = Depends(get_db)):
    src_stock = (
        db.query(WarehouseStock)
        .filter(
            WarehouseStock.warehouse_id == payload.source_warehouse_id,
            WarehouseStock.product_id == payload.product_id,
        )
        .first()
    )

    if not src_stock or src_stock.quantity < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient inventory in source warehouse")

    transfer = StockTransfer(
        source_warehouse_id=payload.source_warehouse_id,
        destination_warehouse_id=payload.destination_warehouse_id,
        product_id=payload.product_id,
        quantity=payload.quantity,
        status=payload.status,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)
    log_action(
        db,
        "CREATE_STOCK_TRANSFER",
        f"Requested transfer of {transfer.quantity} items of product #{transfer.product_id} to warehouse #{transfer.destination_warehouse_id}",
        "stock_transfer",
        transfer.id,
    )
    return transfer


@router.get("/", response_model=list[StockTransferResponse])
def list_stock_transfers(db: Session = Depends(get_db)):
    return db.query(StockTransfer).all()


@router.put("/{transfer_id}", response_model=StockTransferResponse)
def update_stock_transfer(transfer_id: int, payload: StockTransferUpdate, db: Session = Depends(get_db)):
    transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
    if not transfer:
        raise HTTPException(status_code=404, detail="Stock transfer not found")

    old_status = transfer.status
    if payload.status is not None:
        transfer.status = payload.status

        # If transitioning to "completed", perform stock movement
        if old_status != TransferStatus.completed and payload.status == TransferStatus.completed:
            src_stock = (
                db.query(WarehouseStock)
                .filter(
                    WarehouseStock.warehouse_id == transfer.source_warehouse_id,
                    WarehouseStock.product_id == transfer.product_id,
                )
                .first()
            )

            if not src_stock or src_stock.quantity < transfer.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock in source warehouse to complete transfer")

            src_stock.quantity -= transfer.quantity

            dest_stock = (
                db.query(WarehouseStock)
                .filter(
                    WarehouseStock.warehouse_id == transfer.destination_warehouse_id,
                    WarehouseStock.product_id == transfer.product_id,
                )
                .first()
            )
            if dest_stock:
                dest_stock.quantity += transfer.quantity
            else:
                dest_stock = WarehouseStock(
                    warehouse_id=transfer.destination_warehouse_id,
                    product_id=transfer.product_id,
                    quantity=transfer.quantity,
                    batch_number=src_stock.batch_number,
                    location_code="TRANSFERRED-01",
                )
                db.add(dest_stock)

            # Recalculate warehouse utilization
            src_w = db.query(Warehouse).filter(Warehouse.id == transfer.source_warehouse_id).first()
            if src_w:
                src_total = sum(
                    s.quantity for s in db.query(WarehouseStock).filter(WarehouseStock.warehouse_id == src_w.id).all()
                )
                src_w.current_utilization_pct = min(100.0, float(src_total / 100.0))

            dest_w = db.query(Warehouse).filter(Warehouse.id == transfer.destination_warehouse_id).first()
            if dest_w:
                dest_total = sum(
                    s.quantity for s in db.query(WarehouseStock).filter(WarehouseStock.warehouse_id == dest_w.id).all()
                )
                dest_w.current_utilization_pct = min(100.0, float(dest_total / 100.0))

    if payload.quantity is not None:
        transfer.quantity = payload.quantity

    db.commit()
    db.refresh(transfer)
    log_action(
        db,
        "UPDATE_STOCK_TRANSFER",
        f"Completed stock transfer #{transfer.id} with status {transfer.status}",
        "stock_transfer",
        transfer.id,
    )
    return transfer
