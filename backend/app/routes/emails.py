from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import EmailDraft, AppSetting
from app.schemas import (
    EmailGenerateRequest,
    EmailGenerateResponse,
    EmailDraftSaveRequest,
    EmailDraftResponse
)
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/emails", tags=["Email Assistant"])

def get_current_model(db: Session) -> str:
    setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
    return setting.value if setting else settings.DEFAULT_MODEL

@router.post("/generate", response_model=EmailGenerateResponse)
async def generate_email_draft(
    payload: EmailGenerateRequest,
    db: Session = Depends(get_db)
):
    """Generate an email draft with the specified tone and situation."""
    model_to_use = get_current_model(db)
    try:
        result = await ai_service.draft_email(
            prompt_or_original=payload.prompt_or_original,
            tone=payload.tone,
            recipient=payload.recipient,
            subject=payload.subject,
            model=model_to_use
        )
        return EmailGenerateResponse(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("", response_model=EmailDraftResponse, status_code=status.HTTP_201_CREATED)
def save_email_draft(
    payload: EmailDraftSaveRequest,
    db: Session = Depends(get_db)
):
    """Save an email draft to SQLite for later use."""
    draft = EmailDraft(
        prompt_or_original=payload.prompt_or_original,
        draft_content=payload.draft_content,
        tone=payload.tone,
        recipient=payload.recipient,
        subject=payload.subject,
        model_used=payload.model_used
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)
    return draft

@router.get("", response_model=List[EmailDraftResponse])
def get_saved_drafts(db: Session = Depends(get_db)):
    """Retrieve all saved email drafts from SQLite."""
    return db.query(EmailDraft).order_by(EmailDraft.id.desc()).all()

@router.delete("/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft(draft_id: int, db: Session = Depends(get_db)):
    """Delete a saved draft by ID."""
    draft = db.query(EmailDraft).filter(EmailDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Email draft not found")
    db.delete(draft)
    db.commit()
    return None
