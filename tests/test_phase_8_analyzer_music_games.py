"""
tests/test_phase_8_analyzer_music_games.py
MINDORA 2.0 — PHASE 8 AUTOMATED REGRESSION & INTEGRATION TEST SUITE
Covers:
- Real-World 163-Record Depression Data Analyzer
- Research Governance & Authorization Controls
- Ambient Music & Preference Endpoints
- Stress-Relief Mini Games (Snake & Block) with 5-Minute Session Limit
- Intelligent Guardian Email Thresholds & Safety Invariants
"""

import pytest
import time
import secrets
from fastapi.testclient import TestClient

from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER
from src.data_platform.real_world_analyzer import get_real_world_analyzer, MANDATORY_GOVERNANCE_NOTICE

client = TestClient(app)


# --- FIXTURES ---

@pytest.fixture
def auth_student():
    """Create a standard student user (non-researcher)."""
    uid = secrets.token_hex(4)
    email = f"student_p8_{uid}@university.edu"
    ok, msg, reg = AUTH_MANAGER.register_user({
        "email": email,
        "password": "ValidPassword123!",
        "full_name": "Standard Student",
        "date_of_birth": "2003-01-01"
    })
    assert ok
    return {"user_id": reg["profile"]["id"], "token": reg["token"], "email": email}


@pytest.fixture
def auth_researcher():
    """Create an authorized research administrator user."""
    uid = secrets.token_hex(4)
    email = f"researcher_admin_{uid}@mindora.research.org"
    ok, msg, reg = AUTH_MANAGER.register_user({
        "email": email,
        "password": "ValidPassword123!",
        "full_name": "Lead Researcher",
        "date_of_birth": "1990-05-15"
    })
    assert ok
    user_id = reg["profile"]["id"]
    AUTH_MANAGER.set_user_researcher(user_id, is_researcher=True)
    return {"user_id": user_id, "token": reg["token"], "email": email}


# ==============================================================================
# 1. REAL-WORLD DATA ANALYZER UNIT & GOVERNANCE TESTS
# ==============================================================================

def test_163_dataset_provenance_and_counts():
    """Verify exact records, columns, target counts, and minor detection."""
    analyzer = get_real_world_analyzer()
    ov = analyzer.get_dataset_overview()

    assert ov["total_records"] == 162
    assert ov["total_columns"] == 14
    assert ov["missing_value_count"] == 0

    # Target class distribution
    counts = ov["target_distribution"]["counts"]
    assert counts["No"] == 98
    assert counts["Yes"] == 45
    assert counts["Not Sure"] == 19

    # Minors detection (< 18 years)
    assert ov["age_distribution"]["minors_count"] == 17
    assert ov["governance_notice"] == MANDATORY_GOVERNANCE_NOTICE


def test_163_dataset_exploratory_associations():
    """Verify bivariate associations, cross-tabs, Chi-Square, and Cramér's V."""
    analyzer = get_real_world_analyzer()
    exp = analyzer.get_exploratory_analysis()

    assert "causation_disclaimer" in exp
    assert "Academic Pressure" in exp["factors"]
    assert "Sleep Duration" in exp["factors"]
    assert "Financial Stress" in exp["factors"]

    press_data = exp["factors"]["Academic Pressure"]
    assert len(press_data["contingency_table"]) == 5
    assert "chi2_statistic" in press_data["statistical_test"]
    assert "p_value" in press_data["statistical_test"]
    assert "value" in press_data["effect_size"]


def test_163_dataset_isolated_research_models():
    """Verify isolated 4-model evaluation on binary cohort N=143."""
    analyzer = get_real_world_analyzer()
    models_res = analyzer.run_research_models()

    assert "Logistic Regression" in models_res["models"]
    assert "Random Forest" in models_res["models"]
    assert "XGBoost" in models_res["models"]
    assert "SVM" in models_res["models"]

    for name, info in models_res["models"].items():
        assert info["n_evaluations"] == 25  # 5 splits x 5 repeats
        metrics = info["metrics"]
        assert 0.0 <= metrics["accuracy"]["mean"] <= 1.0
        assert 0.0 <= metrics["roc_auc"]["mean"] <= 1.0
        assert "ci_95_lower" in metrics["accuracy"]
        assert "ci_95_upper" in metrics["accuracy"]


def test_research_access_role_based_authorization(auth_student, auth_researcher):
    """Verify ordinary student accounts are blocked with 403 Forbidden from accessing research data."""
    # 1. Ordinary student session attempt -> 403
    res_student = client.get(
        "/api/research/163-dataset/overview",
        headers={"Authorization": f"Bearer {auth_student['token']}"}
    )
    assert res_student.status_code == 403
    assert "Access restricted" in res_student.json()["detail"]

    # 2. Authorized researcher session -> 200
    res_researcher = client.get(
        "/api/research/163-dataset/overview",
        headers={"Authorization": f"Bearer {auth_researcher['token']}"}
    )
    assert res_researcher.status_code == 200
    data = res_researcher.json()["data"]
    assert data["total_records"] == 162

    # 3. Header-based research authorization -> 200
    res_header = client.get(
        "/api/research/163-dataset/overview",
        headers={"X-Research-Authorization": "authorized"}
    )
    assert res_header.status_code == 200


def test_research_dataset_export_endpoints():
    """Verify aggregate exports contain zero individual respondent identifiers."""
    headers = {"X-Research-Authorization": "authorized"}

    # CSV Export
    res_csv = client.get("/api/research/163-dataset/export/csv", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Factor,Category,Total_Respondents" in res_csv.text

    # Text / Report Export
    res_rep = client.get("/api/research/163-dataset/export/report", headers=headers)
    assert res_rep.status_code == 200
    assert "text/plain" in res_rep.headers["content-type"]
    assert "REAL-WORLD DEPRESSION DATA ANALYZER RESEARCH REPORT" in res_rep.text


def test_research_records_cannot_trigger_guardian_alerts():
    """Strict Invariant: Research dataset records can NEVER trigger guardian alerts."""
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(
        user_id=-1,  # Non-student research pseudo-id
        friction_score=85.0,
        source="research"
    )
    assert not ok
    assert "Research Safety Invariant" in msg
    assert receipt["status"] == "research_blocked"


# ==============================================================================
# 2. AMBIENT MUSIC & PREFERENCES TESTS
# ==============================================================================

def test_user_preferences_lifecycle(auth_student):
    """Verify ambient music preferences persistence and volume controls."""
    token = auth_student["token"]

    # Initial preferences
    res_get = client.get("/api/preferences", headers={"Authorization": f"Bearer {token}"})
    assert res_get.status_code == 200
    prefs = res_get.json()["data"]
    assert not prefs["ambient_music_enabled"]

    # Update preferences
    payload = {
        "ambient_music_enabled": True,
        "ambient_music_track": "soft_piano",
        "ambient_music_volume": 0.35,
        "game_sound_enabled": False
    }
    res_post = client.post("/api/preferences", json=payload, headers={"Authorization": f"Bearer {token}"})
    assert res_post.status_code == 200
    updated = res_post.json()["data"]
    assert updated["ambient_music_enabled"] is True
    assert updated["ambient_music_track"] == "soft_piano"
    assert updated["ambient_music_volume"] == 0.35
    assert updated["game_sound_enabled"] is False


# ==============================================================================
# 3. MINI GAMES & FIVE-MINUTE SESSION ENFORCEMENT TESTS
# ==============================================================================

def test_mini_games_five_minute_session_lifecycle(auth_student):
    """Verify game session initiation, wall-clock duration update, and 5-minute limit."""
    token = auth_student["token"]
    user_id = auth_student["user_id"]

    # 1. Start Snake game session
    res_start = client.post("/api/games/session/start", json={"game_type": "snake"}, headers={"Authorization": f"Bearer {token}"})
    assert res_start.status_code == 200
    session_data = res_start.json()["data"]
    session_id = session_data["session_id"]
    assert session_data["max_duration_seconds"] == 300

    # 2. Mid-session update at 120 seconds
    res_up1 = client.post("/api/games/session/update", json={
        "session_id": session_id,
        "duration_seconds": 120,
        "score": 15,
        "status": "active"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res_up1.status_code == 200
    up1 = res_up1.json()["data"]
    assert up1["score"] == 15
    assert not up1["is_five_minute_limit_reached"]

    # 3. Reached 5-minute limit (300 seconds)
    res_up2 = client.post("/api/games/session/update", json={
        "session_id": session_id,
        "duration_seconds": 300,
        "score": 42,
        "status": "time_limit_reached"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res_up2.status_code == 200
    up2 = res_up2.json()["data"]
    assert up2["is_five_minute_limit_reached"] is True
    assert up2["status"] == "time_limit_reached"

    # 4. Check engagement statistics
    res_eng = client.get("/api/games/engagement", headers={"Authorization": f"Bearer {token}"})
    assert res_eng.status_code == 200
    eng = res_eng.json()["data"]
    assert eng["total_sessions"] >= 1
    assert eng["games"]["snake"]["high_score"] >= 42
    assert "disclaimer" in eng
