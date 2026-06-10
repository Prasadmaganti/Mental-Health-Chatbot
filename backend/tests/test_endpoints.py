import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_knowledge_base():
    response = client.get("/knowledge")
    assert response.status_code == 200
    data = response.json()
    assert "categories" in data
    assert "stress_and_anxiety" in data["categories"]
    assert len(data["categories"]) == 10

def test_chat_empty_message():
    payload = {
        "message": "",
        "session_id": "test_session_1"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "empty" in data["reply"].lower()
    assert data["is_crisis"] is False

def test_chat_crisis_suicide():
    payload = {
        "message": "I think I want to kill myself, everything is too hard.",
        "session_id": "test_session_2"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_crisis"] is True
    assert data["category"] == "suicide"
    assert "helplines" in data
    assert len(data["helplines"]) > 0
    assert "988" in "".join(data["helplines"])

def test_chat_crisis_self_harm():
    payload = {
        "message": "I feel like cutting myself tonight.",
        "session_id": "test_session_3"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_crisis"] is True
    assert data["category"] == "self_harm"
    assert "741741" in "".join(data["helplines"])

def test_chat_crisis_abuse():
    payload = {
        "message": "My partner hit me and is physically abusive.",
        "session_id": "test_session_4"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_crisis"] is True
    assert data["category"] == "abuse"
    assert "Domestic Violence" in "".join(data["helplines"]) or "799" in "".join(data["helplines"])

def test_chat_standard_anxiety_mock():
    # Tests that when OpenAI API is not present, we fallback cleanly to mock responder
    payload = {
        "message": "I am having severe anxiety about my upcoming test next week.",
        "session_id": "test_session_5"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_crisis"] is False
    # Check that we got a valid response (either from AI or the fallback coping strategies)
    reply_lower = data["reply"].lower()
    assert len(reply_lower) > 0
    assert any(term in reply_lower for term in ["anxious", "anxiety", "exam", "test", "stress", "apologize", "breathing", "coping", "exercise", "strategy"])
