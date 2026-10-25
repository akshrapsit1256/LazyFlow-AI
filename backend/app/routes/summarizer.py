from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Summary, AppSetting
from app.schemas import (
    SummarizeRequest,
    SummarizeResponse,
    SummarySaveRequest,
    SummaryResponse
)
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/summaries", tags=["Summarizer"])

def get_current_model(db: Session) -> str:
    setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
    return setting.value if setting else settings.DEFAULT_MODEL

@router.post("/generate", response_model=SummarizeResponse)
async def generate_summary(
    payload: SummarizeRequest,
    db: Session = Depends(get_db)
):
    """Generates a text summary using local open-weight AI."""
    model_to_use = get_current_model(db)
    try:
        result = await ai_service.summarize_text(
            text=payload.text,
            length_option=payload.length_option,
            format_option=payload.format_option,
            model=model_to_use
        )
        return SummarizeResponse(**result)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
def save_summary(
    payload: SummarySaveRequest,
    db: Session = Depends(get_db)
):
    """Saves a generated summary into SQLite."""
    summary = Summary(
        title=payload.title or "Summary",
        original_text=payload.original_text,
        summary_text=payload.summary_text,
        length_option=payload.length_option,
        format_option=payload.format_option,
        model_used=payload.model_used,
        word_count_original=len(payload.original_text.split()),
        word_count_summary=len(payload.summary_text.split()),
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary

@router.get("", response_model=List[SummaryResponse])
def get_saved_summaries(db: Session = Depends(get_db)):
    """Retrieve all previously saved summaries from SQLite."""
    return db.query(Summary).order_by(Summary.id.desc()).all()

@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_summary(summary_id: int, db: Session = Depends(get_db)):
    """Delete a saved summary by ID."""
    summary = db.query(Summary).filter(Summary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    db.delete(summary)
    db.commit()
    return None
