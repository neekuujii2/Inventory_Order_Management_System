import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[NotificationResponse])
def list_notifications(db: Session = Depends(get_db)):
    return db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    noti = Notification(
        title=payload.title,
        message=payload.message,
        type=payload.type,
        is_read=False,
    )
    db.add(noti)
    db.commit()
    db.refresh(noti)
    return noti


@router.put("/{noti_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(noti_id: int, db: Session = Depends(get_db)):
    noti = db.query(Notification).filter(Notification.id == noti_id).first()
    if not noti:
        raise HTTPException(status_code=404, detail="Notification not found")
    noti.is_read = True
    db.commit()
    db.refresh(noti)
    return noti


@router.put("/read-all", response_model=dict)
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.get("/stream")
def stream_notifications():
    async def event_generator():
        yield "data: { \"status\": \"connected\" }\n\n"
        while True:
            await asyncio.sleep(15)
            yield "data: { \"status\": \"ping\" }\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
