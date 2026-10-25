import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import DailyBriefing, Task, AppSetting
from app.schemas import (
    DailyBriefingGenerateRequest,
    DailyBriefingResponse,
    DailyBriefingSaveRequest
)
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/briefings", tags=["Daily Briefing"])

def get_current_model(db: Session) -> str:
    setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
    return setting.value if setting else settings.DEFAULT_MODEL

@router.post("/generate", response_model=DailyBriefingResponse)
async def generate_briefing(
    payload: DailyBriefingGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Synthesizes real task and priority data from SQLite into an executive
    daily briefing using local AI.
    """
    model_to_use = get_current_model(db)

    # Fetch real task statistics from SQLite
    all_tasks = db.query(Task).all()
    total = len(all_tasks)
    pending_tasks = [t for t in all_tasks if not t.is_completed]
    completed_tasks = [t for t in all_tasks if t.is_completed]

    # Simple heuristic to identify overdue tasks if due_date is set and contains words like 'yesterday' or dates
    overdue_tasks = []
    for t in pending_tasks:
        if t.due_date and any(w in t.due_date.lower() for w in ["yesterday", "past", "overdue"]):
            overdue_tasks.append({"title": t.title, "due_date": t.due_date})

    tasks_data = {
        "total": total,
        "pending": len(pending_tasks),
        "completed": len(completed_tasks),
        "overdue_tasks": overdue_tasks,
        "pending_tasks_list": [
            {"title": t.title, "priority": t.priority, "due_date": t.due_date}
            for t in pending_tasks
        ]
    }

    try:
        result = await ai_service.generate_daily_briefing(
            tasks_data=tasks_data,
            additional_notes=payload.additional_notes,
            model=model_to_use
        )
        return DailyBriefingResponse(
            title="Daily Briefing",
            briefing_content=result["briefing_content"],
            priorities_content=result["priorities_content"],
            recommended_actions=result["recommended_actions"],
            stats_snapshot=result["stats_snapshot"],
            model_used=result["model_used"]
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("", response_model=DailyBriefingResponse, status_code=status.HTTP_201_CREATED)
def save_briefing(
    payload: DailyBriefingSaveRequest,
    db: Session = Depends(get_db)
):
    """Save a generated daily briefing to SQLite history."""
    briefing = DailyBriefing(
        title=payload.title,
        briefing_content=payload.briefing_content,
        priorities_content=payload.priorities_content,
        recommended_actions=payload.recommended_actions,
        stats_snapshot=json.dumps(payload.stats_snapshot),
        model_used=payload.model_used
    )
    db.add(briefing)
    db.commit()
    db.refresh(briefing)

    return DailyBriefingResponse(
        id=briefing.id,
        title=briefing.title,
        briefing_content=briefing.briefing_content,
        priorities_content=briefing.priorities_content,
        recommended_actions=briefing.recommended_actions,
        stats_snapshot=json.loads(briefing.stats_snapshot or "{}"),
        model_used=briefing.model_used,
        created_at=briefing.created_at
    )

@router.get("", response_model=List[DailyBriefingResponse])
def get_briefings(db: Session = Depends(get_db)):
    """Retrieve history of saved daily briefings."""
    records = db.query(DailyBriefing).order_by(DailyBriefing.id.desc()).all()
    results = []
    for b in records:
        try:
            stats = json.loads(b.stats_snapshot or "{}")
        except Exception:
            stats = {}
        results.append(DailyBriefingResponse(
            id=b.id,
            title=b.title,
            briefing_content=b.briefing_content,
            priorities_content=b.priorities_content,
            recommended_actions=b.recommended_actions,
            stats_snapshot=stats,
            model_used=b.model_used,
            created_at=b.created_at
        ))
    return results

@router.delete("/{briefing_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_briefing(briefing_id: int, db: Session = Depends(get_db)):
    """Delete a saved briefing by ID."""
    briefing = db.query(DailyBriefing).filter(DailyBriefing.id == briefing_id).first()
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    db.delete(briefing)
    db.commit()
    return None
