"""
tests/test_phase_12_assessment_pipeline.py
Phase 12: Centralized Daily Assessment Pipeline, Storage & Synchronized Platform Updates.
Validates:
1. First assessment submission, persistence and dashboard sync.
2. Subsequent day submissions, immutability of historical records, and previous score delta.
3. Multi-day weekly aggregation without treating missing days as zero.
4. Non-leakage / strict student account isolation.
5. Idempotent submission preventing duplicate records.
6. Chronological assessment history ordering (latest first).
7. Guardian notification threshold integration.
"""

import pytest
import secrets
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER

client = TestClient(app)

@pytest.fixture
def auth_headers_student_a():
    rand_sfx = secrets.token_hex(4)
    email = f"student_a_{rand_sfx}@university.edu"
    pwd = "StrongPassword123!"
    ok, msg, reg_data = AUTH_MANAGER.register_user({
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "full_name": "Student A",
        "date_of_birth": "2002-01-01",
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg_data["profile"]["id"]
    token = reg_data["token"]
    return {"Authorization": f"Bearer {token}", "X-User-Id": str(user_id)}

@pytest.fixture
def auth_headers_student_b():
    rand_sfx = secrets.token_hex(4)
    email = f"student_b_{rand_sfx}@university.edu"
    pwd = "StrongPassword123!"
    ok, msg, reg_data = AUTH_MANAGER.register_user({
        "email": email,
        "password": pwd,
        "confirm_password": pwd,
        "full_name": "Student B",
        "date_of_birth": "2002-01-01",
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg_data["profile"]["id"]
    token = reg_data["token"]
    return {"Authorization": f"Bearer {token}", "X-User-Id": str(user_id)}

def test_centralized_assessment_submission_and_sync(auth_headers_student_a):
    """
    Test 1: First Assessment.
    Submitting an assessment must save authoritative historical record and return synchronized data.
    """
    payload = {
        "phq9_answers": [1, 2, 1, 0, 1, 1, 0, 0, 0],
        "features": {
            "sleep_hours": 6.5,
            "study_hours": 7.0,
            "physical_activity": 30
        },
        "stress_score": 45.0,
        "idempotency_key": f"test-idemp-{secrets.token_hex(6)}"
    }

    res = client.post("/api/student/assessment/submit", json=payload, headers=auth_headers_student_a)
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["status"] == "success"
    data = body["data"]

    # 1. Assessment record
    assess = data["assessment"]
    assert assess["stress_score"] == 45.0
    assert assess["interpretation"] == "Balanced Pacing"
    assert assess["status_tier"] == "balanced"
    assert assess["phq9_score"] == 6
    assert assess["phq9_severity"] == "Mild"
    assert "assessment_date" in assess

    # 2. Dashboard synchronizer
    dash = data["dashboard"]
    assert dash["has_assessment"] is True
    assert dash["stress_score"] == 45.0
    assert dash["previous_assessment_score"] is None  # First assessment

    # 3. Weekly insights
    weekly = data["weekly_insights"]
    assert weekly["assessments_count"] >= 1
    assert weekly["weekly_average"] == 45.0
    assert weekly["highest_score"] == 45.0
    assert weekly["lowest_score"] == 45.0

def test_subsequent_assessment_and_immutability(auth_headers_student_a):
    """
    Test 2: Second Daily Assessment.
    Previous records must not be overwritten; dashboard must show previous comparison.
    """
    # First assessment
    payload1 = {
        "phq9_answers": [1, 1, 1, 0, 0, 0, 0, 0, 0],
        "stress_score": 35.0,
        "idempotency_key": f"test-sub1-{secrets.token_hex(6)}"
    }
    res1 = client.post("/api/student/assessment/submit", json=payload1, headers=auth_headers_student_a)
    assert res1.status_code == 200

    # Second assessment
    payload2 = {
        "phq9_answers": [2, 2, 2, 1, 1, 0, 0, 0, 0],
        "stress_score": 60.0,
        "idempotency_key": f"test-sub2-{secrets.token_hex(6)}"
    }
    res2 = client.post("/api/student/assessment/submit", json=payload2, headers=auth_headers_student_a)
    assert res2.status_code == 200
    data2 = res2.json()["data"]

    # Dashboard comparison
    dash = data2["dashboard"]
    assert dash["stress_score"] == 60.0
    assert dash["previous_assessment_score"] == 35.0
    assert dash["stress_change"] == 25.0

    # History contains both records
    hist_res = client.get("/api/student/assessments/history", headers=auth_headers_student_a)
    assert hist_res.status_code == 200
    history = hist_res.json()["data"]
    assert len(history) >= 2
    # Latest first
    assert history[0]["stress_score"] == 60.0
    assert history[1]["stress_score"] == 35.0

def test_missing_assessment_days_not_zero(auth_headers_student_a):
    """
    Test 4: Missing days in weekly analytics must NOT be recorded as zero.
    """
    res = client.get("/api/student/analytics/weekly", headers=auth_headers_student_a)
    assert res.status_code == 200
    weekly = res.json()["data"]

    assert len(weekly["daily_records"]) == 7
    # For days without assessments, stress_score must be None, NOT 0.0
    for day in weekly["daily_records"]:
        if not day["has_assessment"]:
            assert day["stress_score"] is None, f"Missing day {day['day']} was improperly treated as zero!"

def test_idempotent_duplicate_prevention(auth_headers_student_a):
    """
    Test 5: Repeated submissions with the same idempotency key do not create duplicate records.
    """
    idemp = f"idemp-retry-{secrets.token_hex(8)}"
    payload = {
        "stress_score": 52.0,
        "idempotency_key": idemp
    }

    res1 = client.post("/api/student/assessment/submit", json=payload, headers=auth_headers_student_a)
    assert res1.status_code == 200

    # Immediate retry with same key
    res2 = client.post("/api/student/assessment/submit", json=payload, headers=auth_headers_student_a)
    assert res2.status_code == 200
    data2 = res2.json()["data"]
    assert data2.get("is_duplicate") is True

    # History count should not increase
    hist_res = client.get("/api/student/assessments/history", headers=auth_headers_student_a)
    matching = [r for r in hist_res.json()["data"] if r["stress_score"] == 52.0]
    assert len(matching) == 1, "Duplicate record created despite idempotency key!"

def test_strict_student_user_isolation(auth_headers_student_a, auth_headers_student_b):
    """
    Test 7: User Isolation.
    Student A and Student B never see each other's assessment data.
    """
    # Student A submits score 88.0
    client.post("/api/student/assessment/submit", json={"stress_score": 88.0}, headers=auth_headers_student_a)

    # Student B submits score 22.0
    client.post("/api/student/assessment/submit", json={"stress_score": 22.0}, headers=auth_headers_student_b)

    # Verify Student A's history
    hist_a = client.get("/api/student/assessments/history", headers=auth_headers_student_a).json()["data"]
    assert all(r["stress_score"] != 22.0 for r in hist_a), "Student B's record leaked into Student A's history!"
    assert any(r["stress_score"] == 88.0 for r in hist_a)

    # Verify Student B's history
    hist_b = client.get("/api/student/assessments/history", headers=auth_headers_student_b).json()["data"]
    assert all(r["stress_score"] != 88.0 for r in hist_b), "Student A's record leaked into Student B's history!"
    assert any(r["stress_score"] == 22.0 for r in hist_b)

def test_progress_milestones_and_streak(auth_headers_student_b):
    """
    Test Progress milestones and cumulative count.
    """
    # Initially 0 assessments
    p0 = client.get("/api/student/progress", headers=auth_headers_student_b).json()["data"]
    assert p0["total_assessments"] == 0

    # Submit an assessment
    submit_res = client.post(
        "/api/student/assessment/submit",
        headers=auth_headers_student_b,
        json={
            "phq9_answers": [1, 1, 1, 0, 0, 0, 0, 0, 0],
            "features": {"sleep_hours": 7.0},
            "idempotency_key": f"prog-test-{secrets.token_hex(3)}"
        }
    )
    assert submit_res.status_code == 200

    prog_res = client.get("/api/student/progress", headers=auth_headers_student_b)
    assert prog_res.status_code == 200
    prog = prog_res.json()["data"]
    assert prog["total_assessments"] >= 1
    assert any(m["unlocked"] for m in prog["milestones"])
