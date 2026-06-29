from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.returns import Return, ReturnStatus, ReturnType
from app.models.product import Product
from app.schemas.returns import ReturnCreate, ReturnUpdate, ReturnResponse
from app.services.audit import log_action

router = APIRouter(prefix="/returns", tags=["Returns"])


@router.post("/", response_model=ReturnResponse, status_code=status.HTTP_201_CREATED)
def create_return(payload: ReturnCreate, db: Session = Depends(get_db)):
    prod = db.query(Product).filter(Product.id == payload.product_id).first()
    if not prod:
        raise HTTPException(status_code=400, detail="Product not found")

    ret = Return(
        type=payload.type,
        status=payload.status,
        product_id=payload.product_id,
        quantity=payload.quantity,
        reason=payload.reason,
    )
    db.add(ret)

    # If completed on creation, adjust product stock
    if payload.status == ReturnStatus.completed:
        if payload.type == ReturnType.customer:
            prod.quantity += payload.quantity
        elif payload.type == ReturnType.supplier:
            if prod.quantity < payload.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock to return to supplier")
            prod.quantity -= payload.quantity

    db.commit()
    db.refresh(ret)
    log_action(db, "CREATE_RETURN", f"Created return #{ret.id} of type {ret.type}", "return", ret.id)
    return ret


@router.get("/", response_model=list[ReturnResponse])
def list_returns(db: Session = Depends(get_db)):
    return db.query(Return).all()


@router.put("/{return_id}", response_model=ReturnResponse)
def update_return(return_id: int, payload: ReturnUpdate, db: Session = Depends(get_db)):
    ret = db.query(Return).filter(Return.id == return_id).first()
    if not ret:
        raise HTTPException(status_code=404, detail="Return record not found")

    old_status = ret.status
    if payload.status is not None:
        ret.status = payload.status

        # transition to completed adjust stock
        if old_status != ReturnStatus.completed and payload.status == ReturnStatus.completed:
            prod = db.query(Product).filter(Product.id == ret.product_id).first()
            if prod:
                if ret.type == ReturnType.customer:
                    prod.quantity += ret.quantity
                elif ret.type == ReturnType.supplier:
                    if prod.quantity < ret.quantity:
                        raise HTTPException(status_code=400, detail="Insufficient stock to complete return to supplier")
                    prod.quantity -= ret.quantity

    if payload.reason is not None:
        ret.reason = payload.reason

    db.commit()
    db.refresh(ret)
    log_action(db, "UPDATE_RETURN", f"Updated return #{ret.id} status to {ret.status}", "return", ret.id)
    return ret
