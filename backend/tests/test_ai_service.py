import pytest
from app.services.ai_service import extract_json_from_text, AIService
from unittest.mock import AsyncMock

def test_extract_json_from_markdown():
    markdown_wrapped = """Here is the extracted task list:
```json
[
  {"title": "Review draft", "priority": "high", "due_date": null}
]
```
Hope this helps!"""
    data = extract_json_from_text(markdown_wrapped)
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["title"] == "Review draft"

def test_extract_json_raw_object():
    obj_text = '{"status": "ready", "count": 42}'
    data = extract_json_from_text(obj_text)
    assert data["count"] == 42

def test_extract_json_invalid():
    with pytest.raises(ValueError):
        extract_json_from_text("This text has no json whatsoever")

@pytest.mark.asyncio
async def test_ai_service_does_not_invent_deadlines():
    mock_client = AsyncMock()
    # Note mentions no deadline for clean desk, only tomorrow for report
    mock_client.generate.return_value = """```json
[
  {"title": "Clean desk", "priority": "low", "due_date": null},
  {"title": "Submit report", "priority": "high", "due_date": "tomorrow"}
]
```"""
    service = AIService(client=mock_client)
    result = await service.generate_tasks_from_notes("Clean desk and submit report tomorrow")
    tasks = result["tasks"]
    assert len(tasks) == 2
    assert tasks[0].due_date is None
    assert tasks[1].due_date == "tomorrow"
