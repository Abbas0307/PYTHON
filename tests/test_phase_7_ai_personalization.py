"""
tests/test_phase_7_ai_personalization.py
Comprehensive Verification Suite for Mindora 2.0 Phase 7:
- AI Companion conversational persistence & deterministic safety guardrails
- Intelligent Personalization Engine & Non-Diagnostic Bands (A, B, C, D)
- Max 3 recommendations constraint
- Task lifecycle (started, completed, skipped without penalty)
- Engagement metrics & rest-day flexible streaks
"""

import pytest
import sqlite3
import os
from fastapi.testclient import TestClient

from local_companion.service import app
from local_companion.personalization_engine import (
    PERSONALIZATION_ENGINE,
    PersonalizationEngine,
    BAND_CONFIGURATIONS
)
from local_companion.companion_chat import COMPANION_CHAT_MANAGER, CompanionChatManager
from local_companion.auth_manager import AUTH_MANAGER

client = TestClient(app)

TEST_USER_EMAIL = "phase7_tester@example.com"
TEST_USER_PASS = "ValidPassword123!"

@pytest.fixture(scope="module")
def authenticated_session():
    """Ensure a test user exists and return a valid session token."""
    # Attempt register
    reg_ok, _, reg_data = AUTH_MANAGER.register_user({
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASS,
        "full_name": "Phase 7 Scholar",
        "student_phone": "+919876543210"
    })
    
    # Login
    login_ok, _, login_data = AUTH_MANAGER.login_user(TEST_USER_EMAIL, TEST_USER_PASS, "127.0.0.1")
    assert login_ok is True
    token = login_data["token"]
    user_id = login_data["profile"]["id"]
    return {"token": token, "user_id": user_id}


# ==============================================================================
# 1. PERSONALIZATION ENGINE UNIT TESTS
# ==============================================================================

def test_band_classification_boundaries():
    """Verify non-diagnostic score-to-band mapping across all four ranges."""
    engine = PERSONALIZATION_ENGINE
    
    # Band A: 0.0 - 35.0
    assert engine.determine_band(0.0)["band_id"] == "BAND_A"
    assert engine.determine_band(25.0)["band_id"] == "BAND_A"
    assert engine.determine_band(35.0)["band_id"] == "BAND_A"

    # Band B: 35.1 - 65.0
    assert engine.determine_band(35.1)["band_id"] == "BAND_B"
    assert engine.determine_band(50.0)["band_id"] == "BAND_B"
    assert engine.determine_band(65.0)["band_id"] == "BAND_B"

    # Band C: 65.1 - 85.0
    assert engine.determine_band(65.1)["band_id"] == "BAND_C"
    assert engine.determine_band(75.0)["band_id"] == "BAND_C"
    assert engine.determine_band(85.0)["band_id"] == "BAND_C"

    # Band D: 85.1 - 100.0
    assert engine.determine_band(85.1)["band_id"] == "BAND_D"
    assert engine.determine_band(95.0)["band_id"] == "BAND_D"
    assert engine.determine_band(100.0)["band_id"] == "BAND_D"


def test_max_three_recommendations_constraint(authenticated_session):
    """Verify that personalization engine strictly returns at most 3 recommendations."""
    user_id = authenticated_session["user_id"]
    recs = PERSONALIZATION_ENGINE.generate_recommendations(
        student_id=user_id,
        assessment_score=40.0,
        force_refresh=True
    )
    
    assert 1 <= len(recs) <= 3
    
    # Check non-diagnostic explanation
    for rec in recs:
        assert "why_recommended" in rec
        assert "duration_minutes" in rec
        assert "effort_level" in rec
        assert "status" in rec


def test_task_lifecycle_completion_and_skip(authenticated_session):
    """Verify activity lifecycle: started -> completed / skipped, with no penalty on skip."""
    user_id = authenticated_session["user_id"]
    recs = PERSONALIZATION_ENGINE.generate_recommendations(
        student_id=user_id,
        assessment_score=70.0,
        force_refresh=True
    )
    assert len(recs) >= 1
    
    first_act_id = recs[0]["id"]
    
    # Start activity
    start_res = PERSONALIZATION_ENGINE.update_activity_status(user_id, first_act_id, "started")
    assert start_res["success"] is True
    assert start_res["status"] == "started"
    
    # Complete activity
    comp_res = PERSONALIZATION_ENGINE.update_activity_status(user_id, first_act_id, "completed")
    assert comp_res["success"] is True
    assert comp_res["status"] == "completed"
    
    # Skip another activity if available
    if len(recs) > 1:
        second_act_id = recs[1]["id"]
        skip_res = PERSONALIZATION_ENGINE.update_activity_status(user_id, second_act_id, "skipped")
        assert skip_res["success"] is True
        assert skip_res["status"] == "skipped"


def test_engagement_metrics_and_badges(authenticated_session):
    """Verify engagement tracking includes rest-day flexibility and achievement badges."""
    user_id = authenticated_session["user_id"]
    metrics = PERSONALIZATION_ENGINE.get_engagement_metrics(user_id)
    
    assert "completed_activities_count" in metrics
    assert "current_streak_days" in metrics
    assert "rest_day_flexibility" in metrics
    assert "badges" in metrics
    assert len(metrics["badges"]) >= 4


# ==============================================================================
# 2. AI COMPANION UNIT TESTS
# ==============================================================================

def test_companion_crisis_safety_interceptor(authenticated_session):
    """Verify crisis expressions are deterministically intercepted without LLM invocation."""
    user_id = authenticated_session["user_id"]
    res = COMPANION_CHAT_MANAGER.process_chat(
        user_id=user_id,
        query="I want to kill myself, I cannot take this anymore",
        country="India"
    )
    
    assert res["is_crisis"] is True
    assert "IMMEDIATE SAFETY SAFEGUARD ACTIVATED" in res["content"]
    assert "Tele-MANAS" in res["content"] or "14416" in res["content"] or "112" in res["content"]
    assert res["source"] == "safety_guard_crisis"


def test_companion_diagnostic_safety_interceptor(authenticated_session):
    """Verify clinical diagnosis requests are deterministically intercepted."""
    user_id = authenticated_session["user_id"]
    res = COMPANION_CHAT_MANAGER.process_chat(
        user_id=user_id,
        query="Can you diagnose me with major clinical depression and prescribe an antidepressant?"
    )
    
    assert res["is_diagnostic"] is True
    assert "CANNOT provide clinical psychiatric diagnoses" in res["content"]
    assert res["source"] == "safety_guard_diagnostic"


def test_companion_collegiate_fallback_and_history(authenticated_session):
    """Verify chat fallback response and database history persistence."""
    user_id = authenticated_session["user_id"]
    
    # Clear history first
    COMPANION_CHAT_MANAGER.clear_history(user_id)
    history_initial = COMPANION_CHAT_MANAGER.get_history(user_id)
    assert len(history_initial) == 0
    
    # Chat about exams
    res = COMPANION_CHAT_MANAGER.process_chat(
        user_id=user_id,
        query="I have an exam in two days and I'm feeling overwhelmed with the syllabus",
        include_context=True,
        context_data={"band_name": "Balanced Rhythm", "goals": ["Study Block 25min"]}
    )
    
    assert res["is_crisis"] is False
    assert res["is_diagnostic"] is False
    assert len(res["content"]) > 30
    assert "Pomodoro" in res["content"] or "Syllabus" in res["content"] or "breath" in res["content"]
    
    # Check history persisted
    history = COMPANION_CHAT_MANAGER.get_history(user_id)
    assert len(history) == 2  # user + assistant
    assert history[0]["role"] == "user"
    assert history[1]["role"] == "assistant"


def test_companion_context_disclosure():
    """Verify transparency disclosure structure."""
    disc = COMPANION_CHAT_MANAGER.get_context_disclosure()
    assert "student_approved_context_items" in disc
    assert "strictly_excluded_data" in disc
    assert any("journal" in item.lower() for item in disc["strictly_excluded_data"])
    assert any("guardian" in item.lower() for item in disc["strictly_excluded_data"])


# ==============================================================================
# 3. HTTP ENDPOINT INTEGRATION TESTS
# ==============================================================================

def test_api_companion_endpoints(authenticated_session):
    """Verify AI Companion HTTP endpoints with authentication."""
    headers = {"Authorization": f"Bearer {authenticated_session['token']}"}
    
    # Context disclosure (unauthenticated or authenticated)
    r_disc = client.get("/api/ai-companion/context-info")
    assert r_disc.status_code == 200
    assert r_disc.json()["status"] == "success"
    
    # Chat endpoint
    r_chat = client.post(
        "/api/ai-companion/chat",
        headers=headers,
        json={"query": "How can I improve my sleep routine during exam week?", "include_context": True}
    )
    assert r_chat.status_code == 200
    data = r_chat.json()
    assert data["status"] == "success"
    assert len(data["data"]["content"]) > 20
    
    # History endpoint
    r_hist = client.get("/api/ai-companion/history", headers=headers)
    assert r_hist.status_code == 200
    assert len(r_hist.json()["history"]) >= 2
    
    # Clear history
    r_clear = client.delete("/api/ai-companion/history", headers=headers)
    assert r_clear.status_code == 200
    assert r_clear.json()["status"] == "success"
    
    # Verify cleared
    r_hist2 = client.get("/api/ai-companion/history", headers=headers)
    assert len(r_hist2.json()["history"]) == 0


def test_api_personalization_endpoints(authenticated_session):
    """Verify Personalization HTTP endpoints with authentication."""
    headers = {"Authorization": f"Bearer {authenticated_session['token']}"}
    
    # Get recommendations
    r_recs = client.get("/api/personalization/recommendations?stress_score=55.0&force_refresh=true", headers=headers)
    assert r_recs.status_code == 200
    data = r_recs.json()["data"]
    assert "band" in data
    assert len(data["recommendations"]) <= 3
    
    act_id = data["recommendations"][0]["id"]
    
    # Update status to completed
    r_status = client.post(
        "/api/personalization/activity-status",
        headers=headers,
        json={"activity_id": act_id, "status": "completed"}
    )
    assert r_status.status_code == 200
    assert r_status.json()["status"] == "success"
    
    # Get engagement metrics
    r_eng = client.get("/api/personalization/engagement", headers=headers)
    assert r_eng.status_code == 200
    eng_data = r_eng.json()["data"]
    assert eng_data["completed_activities_count"] >= 1
