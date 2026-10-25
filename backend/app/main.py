from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.models import Task, AppSetting
from app.routes import (
    health,
    tasks,
    summarizer,
    emails,
    files,
    briefing,
    settings as settings_router,
    dashboard
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    init_db()

    # Seed initial tutorial tasks if tasks table is empty
    db = SessionLocal()
    try:
        task_count = db.query(Task).count()
        if task_count == 0:
            sample_tasks = [
                Task(
                    title="Welcome to LazyFlow AI!",
                    description="Explore the local AI tools in the sidebar: Summarizer, Task Generator, and Email Assistant.",
                    priority="high",
                    due_date="Today",
                    is_completed=False
                ),
                Task(
                    title="Verify local Ollama connection",
                    description="Confirm that Ollama is running and Gemma 2 model is loaded for private, offline AI inference.",
                    priority="high",
                    due_date="Today",
                    is_completed=True
                ),
                Task(
                    title="Try generating tasks from messy notes",
                    description="Go to Task Generator, paste your rough meeting notes, and watch them become structured items.",
                    priority="medium",
                    due_date=None,
                    is_completed=False
                ),
                Task(
                    title="Organize your messy Downloads folder",
                    description="Use the File Organizer Assistant to preview safe categorization recommendations.",
                    priority="low",
                    due_date="This week",
                    is_completed=False
                )
            ]
            for t in sample_tasks:
                db.add(t)

        # Set default model in AppSettings if not present
        model_setting = db.query(AppSetting).filter(AppSetting.key == "selected_model").first()
        if not model_setting:
            db.add(AppSetting(key="selected_model", value=settings.DEFAULT_MODEL))

        db.commit()
    except Exception as e:
        print(f"Startup initialization notice: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Local AI Productivity Assistant powered by open-weight models (Ollama & Gemma 2).",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(summarizer.router, prefix="/api")
app.include_router(emails.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(briefing.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": settings.TAGLINE,
        "docs_url": "/docs",
        "api_health": "/api/health"
    }
