import pytest
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.services.ollama_client import ollama_client

# In-memory SQLite for isolated, fast test runs
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(autouse=True)
def mock_ollama(monkeypatch):
    """Mock Ollama client by default in tests so no external server/model download is needed."""
    mock_health = AsyncMock(return_value={
        "connected": True,
        "base_url": "http://127.0.0.1:11434",
        "models_available": [{"name": "gemma2:2b", "size": 1600000000}],
        "error": None,
        "setup_instructions": None
    })
    mock_generate = AsyncMock(return_value="Mocked AI response for testing.")
    monkeypatch.setattr(ollama_client, "check_health", mock_health)
    monkeypatch.setattr(ollama_client, "generate", mock_generate)
