from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Task, Summary, EmailDraft, DailyBriefing, AppSetting
from app.schemas import DashboardStatsResponse, OllamaStatusResponse, ModelItem
from app.services.ollama_client import ollama_client
from app.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns real statistics computed dynamically from SQLite database and Ollama service.
    """
    tasks = db.query(Task).all()
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.is_completed)
    pending_tasks = total_tasks - completed_tasks

    overdue_tasks = sum(
        1 for t in tasks if not t.is_completed and t.due_date and any(
            w in t.due_date.lower() for w in ["yesterday", "past", "overdue"]
        )
    )

    summaries = db.query(Summary).order_by(Summary.id.desc()).all()
    emails = db.query(EmailDraft).order_by(EmailDraft.id.desc()).all()
    briefings = db.query(DailyBriefing).order_by(DailyBriefing.id.desc()).all()

    # Calculate estimated time saved based on real automation actions
    # Summaries: ~15 mins, Emails: ~10 mins, Tasks: ~3 mins, Briefings: ~20 mins
    estimated_minutes = (
        (len(summaries) * 15) +
        (len(emails) * 10) +
        (completed_tasks * 5) +
        (len(briefings) * 20)
    )

    # Compile recent activity feed
    recent_activity: List[Dict[str, Any]] = []

    for t in tasks[-5:]:
        recent_activity.append({
            "type": "task",
            "title": f"Task: {t.title}",
            "status": "completed" if t.is_completed else "pending",
            "timestamp": t.updated_at.isoformat() if t.updated_at else t.created_at.isoformat()
        })

    for s in summaries[:3]:
        recent_activity.append({
            "type": "summary",
            "title": f"Summary: {s.title or 'Text Summary'}",
            "status": f"{s.word_count_summary} words",
            "timestamp": s.created_at.isoformat()
        })

    for e in emails[:3]:
        recent_activity.append({
            "type": "email",
            "title": f"Email Draft: {e.subject or e.tone.capitalize()}",
            "status": f"{e.tone} tone",
            "timestamp": e.created_at.isoformat()
        })

    for b in briefings[:2]:
        recent_activity.append({
            "type": "briefing",
            "title": f"{b.title}",
            "status": "Generated",
            "timestamp": b.created_at.isoformat()
        })

    # Sort combined activity by timestamp descending
    recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    recent_activity = recent_activity[:10]

    # Get local AI status
    ollama_health = await ollama_client.check_health()
    active_model_setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
    active_model = active_model_setting.value if active_model_setting else settings.DEFAULT_MODEL

    return DashboardStatsResponse(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        saved_summaries_count=len(summaries),
        saved_emails_count=len(emails),
        saved_briefings_count=len(briefings),
        estimated_time_saved_minutes=estimated_minutes,
        local_ai_status=OllamaStatusResponse(
            connected=ollama_health["connected"],
            version=ollama_health.get("version"),
            base_url=ollama_health["base_url"],
            configured_model=active_model,
            models_available=[
                ModelItem(**m) for m in ollama_health.get("models_available", [])
            ],
            error=ollama_health.get("error"),
            setup_instructions=ollama_health.get("setup_instructions")
        ),
        recent_activity=recent_activity
    )
