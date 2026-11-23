"""
tests/test_phase_8_5_profile_and_auth_fixes.py
MINDORA 2.0 — PHASE 8.5 AUTOMATED TEST SUITE
Comprehensive unit & integration tests for:
1. 163-Record Student Profile Analysis & Non-Diagnostic Safety Disclaimers.
2. Authenticated Change Password & Profile Update Endpoints.
3. Dual 'profile' / 'user' payload compatibility on /api/auth/me.
4. Research Isolation & RBAC enforcement on profile comparison.
"""

import pytest
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.auth_manager import AuthManager
from ml_lab.real_world_analyzer import RealWorldDepressionAnalyzer, get_real_world_analyzer


@pytest.fixture
def client():
    return TestClient(app)


def test_analyzer_profile_comparison_success():
    """Verify profile comparison calculates cohort percentiles and exploratory projection."""
    analyzer = get_real_world_analyzer()
    profile = {
        "age": 20,
        "gender": "Male",
        "dietary_habits": "Moderate",
        "degree": "Engineering & Tech",
        "cgpa": 7.5,
        "academic_pressure": 4,
        "study_satisfaction": 2,
        "sleep_duration": "5–6 hours",
        "study_hours": 4.5,
        "financial_stress": 3
    }
    res = analyzer.compare_student_profile(profile)
    assert res["status"] == "success"
    assert "cohort_benchmarks" in res
    assert "percentiles" in res["cohort_benchmarks"]

    # Percentiles must be computed
    pcts = res["cohort_benchmarks"]["percentiles"]
    assert 0.0 <= pcts["academic_pressure"] <= 100.0
    assert 0.0 <= pcts["study_hours"] <= 100.0
    assert 0.0 <= pcts["cgpa"] <= 100.0

    # Exploratory projection bounds
    proj = res["exploratory_projection"]
    assert 0.0 <= proj["historical_target_probability_pct"] <= 100.0
    assert proj["affinity_tier"] in [
        "Low Exploratory Affinity",
        "Moderate Exploratory Affinity",
        "Elevated Exploratory Affinity"
    ]

    # Mandatory non-diagnostic clinical disclaimer
    assert res["mandatory_disclaimer"] == (
        "EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT."
    )
    assert "NOT constitute medical advice" in res["clinical_safety_notice"]


def test_analyzer_profile_comparison_validation_errors():
    """Verify out-of-range profile inputs are caught and rejected cleanly."""
    analyzer = get_real_world_analyzer()
    invalid_profile = {
        "age": 8,  # under 13
        "cgpa": 12.5,  # above 10.0
        "academic_pressure": 8,  # above 5
        "study_hours": 30.0  # above 24
    }
    res = analyzer.compare_student_profile(invalid_profile)
    assert res["status"] == "error"
    assert len(res["errors"]) >= 3
    assert res["mandatory_disclaimer"] == (
        "EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT."
    )


def test_auth_manager_change_password_lifecycle():
    """Verify password change enforces current password and length rules."""
    auth = AuthManager()
    test_email = "phase85_pwd_tester@university.edu"
    test_pwd = "OriginalPassword123!"

    # Register or find user
    with auth._get_conn() as conn:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (test_email,)).fetchone()
        user_id = row["id"] if row else None

    if not user_id:
        ok, msg, u_data = auth.register_user({
            "email": test_email,
            "password": test_pwd,
            "full_name": "Phase 8.5 Password Tester",
            "date_of_birth": "2002-05-10"
        })
        assert ok
        user_id = u_data["profile"]["id"]

    # 1. Reject incorrect current password
    ok, msg = auth.change_password(user_id, "WrongPassword999!", "NewSecurePassword123!")
    assert not ok
    assert "does not match" in msg.lower()

    # 2. Reject short new password
    ok, msg = auth.change_password(user_id, test_pwd, "short")
    assert not ok
    assert "at least 8" in msg.lower()

    # 3. Successful change
    new_pwd = "UpdatedSecurePassword456!"
    ok, msg = auth.change_password(user_id, test_pwd, new_pwd)
    assert ok

    # 4. Login verifies new password works
    login_ok, login_msg, _ = auth.login_user(test_email, new_pwd)
    assert login_ok

    # Reset back to original password for idempotency
    auth.change_password(user_id, new_pwd, test_pwd)


def test_service_profile_and_me_endpoints(client):
    """Verify /api/auth/me returns both profile and user, and PUT /api/auth/profile updates records."""
    test_email = "phase85_api_tester@university.edu"
    test_pwd = "TestPassword85!"

    auth = AuthManager()
    with auth._get_conn() as conn:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (test_email,)).fetchone()
        user_id = row["id"] if row else None

    if not user_id:
        auth.register_user({
            "email": test_email,
            "password": test_pwd,
            "full_name": "API Profile Tester",
            "date_of_birth": "2003-01-15"
        })

    login_res = client.post("/api/auth/login", json={"email": test_email, "password": test_pwd})
    assert login_res.status_code == 200
    token = login_res.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /api/auth/me returns BOTH 'profile' and 'user'
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert "profile" in me_data
    assert "user" in me_data
    assert me_data["profile"]["email"] == test_email
    assert me_data["user"]["email"] == test_email

    # Verify PUT /api/auth/profile updates guardian info
    put_res = client.put("/api/auth/profile", headers=headers, json={
        "guardian_name": "Dr. Eleanor Vance",
        "guardian_relationship": "Mother",
        "guardian_email": "eleanor.vance@parent.edu",
        "guardian_phone": "+1-555-019-2834"
    })
    assert put_res.status_code == 200
    put_data = put_res.json()
    assert put_data["status"] == "success"

    # Verify change-password endpoint
    chg_res = client.post("/api/auth/change-password", headers=headers, json={
        "current_password": "WrongPassword!",
        "new_password": "BrandNewPassword123!"
    })
    assert chg_res.status_code == 400


def test_research_profile_compare_endpoint(client):
    """Verify POST /api/research/163-dataset/profile-compare requires research authorization and returns benchmarks."""
    profile_payload = {
        "age": 21,
        "gender": "Female",
        "dietary_habits": "Healthy",
        "degree": "Sciences & Computing",
        "cgpa": 8.5,
        "academic_pressure": 3,
        "study_satisfaction": 4,
        "sleep_duration": "7–8 hours",
        "study_hours": 5.0,
        "financial_stress": 2
    }

    # 1. Denied without research authorization
    unauth_res = client.post("/api/research/163-dataset/profile-compare", json=profile_payload)
    assert unauth_res.status_code == 403

    # 2. Authorized with X-Research-Authorization header
    auth_res = client.post(
        "/api/research/163-dataset/profile-compare",
        headers={"X-Research-Authorization": "authorized"},
        json=profile_payload
    )
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert auth_data["status"] == "success"
    assert "cohort_benchmarks" in auth_data["data"]
    assert "exploratory_projection" in auth_data["data"]
    assert auth_data["data"]["mandatory_disclaimer"] == (
        "EXPLORATORY RESEARCH ESTIMATE — NOT A DEPRESSION DIAGNOSIS OR CLINICAL SCREENING RESULT."
    )
