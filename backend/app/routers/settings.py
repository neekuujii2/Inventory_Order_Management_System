from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.settings import Settings
from app.schemas.settings import SettingsCreate, SettingsResponse
from app.services.audit import log_action

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/", response_model=list[SettingsResponse])
def get_all_settings(db: Session = Depends(get_db)):
    return db.query(Settings).all()


@router.post("/", response_model=SettingsResponse, status_code=status.HTTP_201_CREATED)
def set_setting(payload: SettingsCreate, db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == payload.key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = Settings(key=payload.key, value=payload.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    log_action(db, "SET_SETTING", f"Set setting {setting.key} = {setting.value}", "settings")
    return setting


@router.get("/{key}", response_model=SettingsResponse)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting
