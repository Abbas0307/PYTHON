"""
test_motorcycle_stress_meter.py
Tests for the motorcycle-style analog stress gauge backend APIs:
- GET /api/student/stress-indicator (unassessed vs recorded states)
- POST /api/student/stress-indicator/record (score clamping, tiers, alerts)
- Notification safety (gauge inspection never triggers alerts)
- Test matrix (0, 10, 25, 40, 60, 74, 75, 90, 100)
"""

import pytest
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER

client = TestClient(app)

def get_auth_token_for_email(email, password="TestPassword123!"):
    # Attempt registration if not existing
    AUTH_MANAGER.register_user({
        "email": email,
        "password": password,
        "full_name": "Motorcycle Gauge Tester",
        "student_phone": "+919876543299"
    })

    # Login to obtain session token
    login_ok, _, login_data = AUTH_MANAGER.login_user(email, password, "127.0.0.1")
    assert login_ok is True, f"Login failed for {email}"
    token = login_data["token"]
    user_id = login_data["profile"]["id"]
    return token, user_id

def test_unassessed_student_stress_indicator():
    """Unassessed student should return has_assessment: False and stress_score: None, not fake 0."""
    unassessed_email = "new_unassessed_student@test.mindora.edu"
    token, user_id = get_auth_token_for_email(unassessed_email)

    # Wipe any past assessment records for this user in db
    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("DELETE FROM student_stress_assessments WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM guardian_notification_episodes WHERE user_id = ?", (user_id,))
        conn.commit()

    resp = client.get("/api/student/stress-indicator", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    payload = data["data"]
    assert payload["has_assessment"] is False
    assert payload["stress_score"] is None
    assert payload["status_tier"] == "unassessed"
    assert "No Assessment Recorded" in payload["interpretation"]

def test_record_student_stress_matrix():
    """Verify test matrix values (0, 10, 25, 40, 60, 74, 75, 90, 100) and clamping."""
    test_email = "matrix_tester@test.mindora.edu"
    token, user_id = get_auth_token_for_email(test_email)

    test_cases = [
        (0, "Optimal Restorative State", "optimal"),
        (10, "Optimal Restorative State", "optimal"),
        (25, "Balanced Pacing", "balanced"),
        (40, "Balanced Pacing", "balanced"),
        (60, "Moderate Equilibrium", "moderate"),
        (74, "Moderate Equilibrium", "moderate"),
        (75, "Elevated Stress Friction", "elevated"),
        (90, "Critical Stress Spike", "critical"),
        (100, "Critical Stress Spike", "critical"),
    ]

    for score, expected_interp, expected_tier in test_cases:
        resp = client.post(
            "/api/student/stress-indicator/record",
            headers={"Authorization": f"Bearer {token}"},
            json={"stress_score": score, "source": "unit_test_matrix"}
        )
        assert resp.status_code == 200
        data = resp.json()["data"]
        assert data["stress_score"] == float(score)
        assert data["interpretation"] == expected_interp
        assert data["status_tier"] == expected_tier

        # Verify subsequent GET returns latest authoritative score
        get_resp = client.get("/api/student/stress-indicator", headers={"Authorization": f"Bearer {token}"})
        assert get_resp.status_code == 200
        get_data = get_resp.json()["data"]
        assert get_data["has_assessment"] is True
        assert get_data["stress_score"] == float(score)
        assert get_data["status_tier"] == expected_tier

def test_score_clamping():
    """Scores outside 0-100 must be clamped to [0, 100]."""
    test_email = "clamp_tester@test.mindora.edu"
    token, user_id = get_auth_token_for_email(test_email)

    # Below 0 clamps to 0
    resp_low = client.post(
        "/api/student/stress-indicator/record",
        headers={"Authorization": f"Bearer {token}"},
        json={"stress_score": -15.5}
    )
    assert resp_low.status_code == 200
    assert resp_low.json()["data"]["stress_score"] == 0.0

    # Above 100 clamps to 100
    resp_high = client.post(
        "/api/student/stress-indicator/record",
        headers={"Authorization": f"Bearer {token}"},
        json={"stress_score": 142.0}
    )
    assert resp_high.status_code == 200
    assert resp_high.json()["data"]["stress_score"] == 100.0

def test_notification_safety_on_gauge_reads():
    """Querying GET /api/student/stress-indicator must be read-only and never trigger alerts."""
    test_email = "safety_tester@test.mindora.edu"
    token, user_id = get_auth_token_for_email(test_email)

    # Record 90 (triggers alert once)
    client.post(
        "/api/student/stress-indicator/record",
        headers={"Authorization": f"Bearer {token}"},
        json={"stress_score": 90.0}
    )

    initial_log_count = len(AUTH_MANAGER.get_notification_log(user_id))

    # Query GET stress indicator 10 times (simulating UI poll / animations)
    for _ in range(10):
        resp = client.get("/api/student/stress-indicator", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    # Notification log count must not increase
    final_log_count = len(AUTH_MANAGER.get_notification_log(user_id))
    assert final_log_count == initial_log_count, "Stress gauge GET endpoint must never create notification records"
