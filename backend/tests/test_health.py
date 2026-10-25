from unittest.mock import AsyncMock
from app.services.ollama_client import ollama_client

def test_health_check_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "LazyFlow AI"
    assert data["ollama"]["connected"] is True
    assert data["ollama"]["configured_model"] == "gemma2:2b"

def test_ollama_status_offline(client, monkeypatch):
    """Test response when Ollama service is unavailable."""
    offline_check = AsyncMock(return_value={
        "connected": False,
        "base_url": "http://127.0.0.1:11434",
        "models_available": [],
        "error": "Could not connect to Ollama. Service is offline.",
        "setup_instructions": "Run `ollama serve` to start the local service."
    })
    monkeypatch.setattr(ollama_client, "check_health", offline_check)

    response = client.get("/api/ollama/status")
    assert response.status_code == 200
    data = response.json()
    assert data["connected"] is False
    assert "offline" in data["error"]
    assert "ollama serve" in data["setup_instructions"]
