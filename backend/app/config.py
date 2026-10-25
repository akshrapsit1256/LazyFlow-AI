import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "LazyFlow AI"
    VERSION: str = "1.0.0"
    TAGLINE: str = "Less busywork. More breathing room."
    
    # Ollama Local AI Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    DEFAULT_MODEL: str = os.getenv("OLLAMA_MODEL", "gemma2:2b")
    REQUEST_TIMEOUT_SECONDS: float = float(os.getenv("OLLAMA_TIMEOUT", "90.0"))
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./lazyflow.db")
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

settings = Settings()
