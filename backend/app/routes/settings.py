from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AppSetting
from app.schemas import SettingUpdate, SettingResponse
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=List[SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    """Retrieve all current user configurations."""
    settings_records = db.query(AppSetting).all()
    # If selected_model is not stored yet, add default
    keys = {s.key for s in settings_records}
    if "selected_model" not in keys:
        default_model_setting = AppSetting(key="selected_model", value=settings.DEFAULT_MODEL)
        db.add(default_model_setting)
        db.commit()
        db.refresh(default_model_setting)
        settings_records.append(default_model_setting)

    return settings_records

@router.post("", response_model=SettingResponse)
def update_setting(payload: SettingUpdate, db: Session = Depends(get_db)):
    """Update or insert a configuration key/value."""
    setting = db.query(AppSetting).filter(AppSetting.key == payload.key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = AppSetting(key=payload.key, value=payload.value)
        db.add(setting)

    db.commit()
    db.refresh(setting)
    return setting
