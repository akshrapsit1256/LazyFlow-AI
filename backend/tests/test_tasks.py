from unittest.mock import AsyncMock
from app.services.ollama_client import ollama_client

def test_create_and_read_task(client):
    payload = {
        "title": "Complete AI report",
        "description": "Outline methodology and testing results",
        "priority": "high",
        "due_date": "2026-10-30",
        "is_completed": False
    }
    response = client.post("/api/tasks", json=payload)
    assert response.status_code == 201
    created = response.json()
    assert created["id"] is not None
    assert created["title"] == "Complete AI report"
    assert created["priority"] == "high"
    assert created["is_completed"] is False

    # Read all tasks
    list_res = client.get("/api/tasks")
    assert list_res.status_code == 200
    assert any(t["id"] == created["id"] for t in list_res.json())

def test_update_and_toggle_task(client):
    task = client.post("/api/tasks", json={"title": "Test toggle task"}).json()
    task_id = task["id"]

    # Toggle completion
    patch_res = client.patch(f"/api/tasks/{task_id}", json={"is_completed": True})
    assert patch_res.status_code == 200
    assert patch_res.json()["is_completed"] is True

    # Filter completed
    filter_res = client.get("/api/tasks?status=completed")
    assert filter_res.status_code == 200
    assert any(t["id"] == task_id for t in filter_res.json())

    # Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 204

    # Verify not found
    get_res = client.get(f"/api/tasks/{task_id}")
    assert get_res.status_code == 404

def test_task_validation_error(client):
    # Empty title should fail validation
    res = client.post("/api/tasks", json={"title": ""})
    assert res.status_code == 422

def test_task_generation_from_notes(client, monkeypatch):
    mock_ai_json = (
        '[\n'
        '  {"title": "Finish Java assignment", "description": "Academic coursework", "priority": "high", "due_date": "tomorrow"},\n'
        '  {"title": "Prepare for DBMS quiz", "description": null, "priority": "high", "due_date": "Friday"}\n'
        ']'
    )
    monkeypatch.setattr(ollama_client, "generate", AsyncMock(return_value=mock_ai_json))

    payload = {
        "notes": "I need to finish my Java assignment tomorrow and prepare for DBMS quiz on Friday.",
        "save_immediately": True
    }
    response = client.post("/api/tasks/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["tasks"]) == 2
    assert data["tasks"][0]["title"] == "Finish Java assignment"
    assert data["tasks"][0]["due_date"] == "tomorrow"
    assert data["tasks"][1]["due_date"] == "Friday"

    # Verify tasks were persisted in SQLite because save_immediately was True
    tasks_res = client.get("/api/tasks")
    assert any(t["title"] == "Finish Java assignment" for t in tasks_res.json())
