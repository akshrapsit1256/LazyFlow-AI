from unittest.mock import AsyncMock
from app.services.ollama_client import ollama_client

def test_summarize_endpoint(client, monkeypatch):
    mock_summary = "- Key finding 1: Model inference runs locally.\n- Key finding 2: Zero cloud API fees."
    monkeypatch.setattr(ollama_client, "generate", AsyncMock(return_value=mock_summary))

    payload = {
        "text": "Local artificial intelligence inference empowers users by executing open-weight neural networks right on consumer hardware. This avoids cloud costs and preserves total data sovereignty.",
        "length_option": "concise",
        "format_option": "bullet"
    }
    response = client.post("/api/summaries/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Key finding 1" in data["summary"]
    assert data["length_option"] == "concise"
    assert data["format_option"] == "bullet"
    assert data["word_count_summary"] > 0

def test_summarize_validation_error(client):
    # Text shorter than 10 chars should be rejected
    res = client.post("/api/summaries/generate", json={"text": "short"})
    assert res.status_code == 422

def test_save_and_retrieve_summary(client):
    save_payload = {
        "title": "Local AI Privacy Study",
        "original_text": "Long original text about privacy in machine learning.",
        "summary_text": "Local models keep data secure.",
        "length_option": "concise",
        "format_option": "paragraph",
        "model_used": "gemma2:2b"
    }
    create_res = client.post("/api/summaries", json=save_payload)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # Retrieve all
    list_res = client.get("/api/summaries")
    assert list_res.status_code == 200
    assert any(s["id"] == created_id for s in list_res.json())

    # Delete
    del_res = client.delete(f"/api/summaries/{created_id}")
    assert del_res.status_code == 204
