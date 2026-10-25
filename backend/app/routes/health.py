from fastapi import APIRouter
from app.config import settings
from app.schemas import HealthResponse, OllamaStatusResponse, ModelItem
from app.services.ollama_client import ollama_client

router = APIRouter(tags=["Health & AI Status"])

@router.get("/health", response_model=HealthResponse)
async def get_health():
    """Health check endpoint providing system status and Ollama availability."""
    ollama_health = await ollama_client.check_health()
    return HealthResponse(
        status="ok",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        ollama=OllamaStatusResponse(
            connected=ollama_health["connected"],
            version=ollama_health.get("version"),
            base_url=ollama_health["base_url"],
            configured_model=settings.DEFAULT_MODEL,
            models_available=[
                ModelItem(**m) for m in ollama_health.get("models_available", [])
            ],
            error=ollama_health.get("error"),
            setup_instructions=ollama_health.get("setup_instructions")
        )
    )

@router.get("/ollama/status", response_model=OllamaStatusResponse)
async def get_ollama_status():
    """Dedicated endpoint to check Ollama service connectivity."""
    ollama_health = await ollama_client.check_health()
    return OllamaStatusResponse(
        connected=ollama_health["connected"],
        version=ollama_health.get("version"),
        base_url=ollama_health["base_url"],
        configured_model=settings.DEFAULT_MODEL,
        models_available=[
            ModelItem(**m) for m in ollama_health.get("models_available", [])
        ],
        error=ollama_health.get("error"),
        setup_instructions=ollama_health.get("setup_instructions")
    )
