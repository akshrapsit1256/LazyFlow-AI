from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Task, AppSetting
from app.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskGenerateRequest,
    TaskGenerateResponse,
    GeneratedTaskItem
)
from app.services.ai_service import ai_service
from app.config import settings

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def get_current_model(db: Session) -> str:
    setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
    return setting.value if setting else settings.DEFAULT_MODEL

@router.get("", response_model=List[TaskResponse])
def get_tasks(
    status_filter: Optional[str] = Query(default="all", alias="status"),
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve all tasks from SQLite with optional filtering."""
    query = db.query(Task)
    if status_filter == "pending":
        query = query.filter(Task.is_completed == False)
    elif status_filter == "completed":
        query = query.filter(Task.is_completed == True)

    if priority and priority in ["high", "medium", "low"]:
        query = query.filter(Task.priority == priority)

    return query.order_by(Task.is_completed.asc(), Task.id.desc()).all()

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task in SQLite."""
    task = Task(
        title=task_in.title.strip(),
        description=task_in.description.strip() if task_in.description else None,
        priority=task_in.priority.lower() if task_in.priority else "medium",
        due_date=task_in.due_date.strip() if task_in.due_date else None,
        is_completed=task_in.is_completed
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Fetch a single task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task_in: TaskUpdate, db: Session = Depends(get_db)):
    """Update task details or toggle completion status."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_in.title is not None:
        task.title = task_in.title.strip()
    if task_in.description is not None:
        task.description = task_in.description.strip() if task_in.description else None
    if task_in.priority is not None:
        task.priority = task_in.priority.lower()
    if task_in.due_date is not None:
        task.due_date = task_in.due_date.strip() if task_in.due_date else None
    if task_in.is_completed is not None:
        task.is_completed = task_in.is_completed

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task by ID."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None

@router.post("/generate", response_model=TaskGenerateResponse)
async def generate_tasks(
    payload: TaskGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Extract structured tasks from unstructured user notes using local AI.
    Never invents deadlines.
    """
    model_to_use = get_current_model(db)
    try:
        result = await ai_service.generate_tasks_from_notes(
            notes=payload.notes,
            model=model_to_use
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # If user wants to save immediately
    if payload.save_immediately and result.get("tasks"):
        for t in result["tasks"]:
            db_task = Task(
                title=t.title,
                description=t.description,
                priority=t.priority,
                due_date=t.due_date,
                is_completed=False
            )
            db.add(db_task)
        db.commit()

    return TaskGenerateResponse(
        tasks=result["tasks"],
        model_used=result["model_used"],
        note_extracted=result["note_extracted"]
    )

@router.post("/bulk", response_model=List[TaskResponse], status_code=status.HTTP_201_CREATED)
def create_bulk_tasks(tasks: List[GeneratedTaskItem], db: Session = Depends(get_db)):
    """Save multiple generated tasks at once into SQLite."""
    created_tasks = []
    for t in tasks:
        db_task = Task(
            title=t.title.strip(),
            description=t.description.strip() if t.description else None,
            priority=t.priority.lower() if t.priority else "medium",
            due_date=t.due_date.strip() if t.due_date else None,
            is_completed=False
        )
        db.add(db_task)
        created_tasks.append(db_task)
    db.commit()
    for task in created_tasks:
        db.refresh(task)
    return created_tasks
