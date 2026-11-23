"""
tests/test_auth_guardian_security.py
Comprehensive tests for Mindora 2.0 Authentication, Guardian Management,
and Elevated-Stress Notification Workflow.
"""

import pytest
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER

client = TestClient(app)

def test_student_registration_and_login():
    email = f"test_student_{id(app)}@university.edu"
    reg_payload = {
        "email": email,
        "password": "SecurePassword2026!",
        "full_name": "Jordan Lee",
        "date_of_birth": "2003-09-20",
        "is_adult": True,
        "guardian_name": "Taylor Lee",
        "guardian_relationship": "Parent",
        "guardian_country_code": "+91",
        "guardian_phone": "9123456789",
        "guardian_consent": True
    }
    
    # 1. Register
    reg_resp = client.post("/api/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    reg_data = reg_resp.json()
    assert reg_data["status"] == "success"
    token = reg_data["data"]["token"]
    v_code = reg_data["data"]["verification_code"]
    assert token is not None
    assert v_code is not None

    # 2. Get Profile
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    profile = me_resp.json()["profile"]
    assert profile["email"] == email
    assert profile["full_name"] == "Jordan Lee"
    assert profile["guardian"]["phone"] == "9123456789"
    assert profile["guardian"]["verified"] is False

    # 3. Verify Guardian Phone
    verify_resp = client.post("/api/guardian/verify", json={"code": v_code}, headers={"Authorization": f"Bearer {token}"})
    assert verify_resp.status_code == 200

    # Check verified status
    me_resp2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp2.json()["profile"]["guardian"]["verified"] is True

    # 4. Elevated Stress Notification (Mock SMS)
    # Fail if student confirmation is false
    fail_notify = client.post("/api/guardian/notify-stress", json={"confirmed": False}, headers={"Authorization": f"Bearer {token}"})
    assert fail_notify.status_code == 400

    # Succeed when student explicitly confirms
    notify_resp = client.post("/api/guardian/notify-stress", json={"confirmed": True}, headers={"Authorization": f"Bearer {token}"})
    assert notify_resp.status_code == 200
    notify_data = notify_resp.json()
    assert notify_data["status"] == "success"
    assert notify_data["audit"]["status"] == "DELIVERED_MOCK"
    assert "Your student has requested support" in notify_data["audit"]["message_text"]

    # 5. Revoke Consent
    revoke_resp = client.post("/api/guardian/revoke", headers={"Authorization": f"Bearer {token}"})
    assert revoke_resp.status_code == 200

    # Notification fails after revocation
    after_revoke = client.post("/api/guardian/notify-stress", json={"confirmed": True}, headers={"Authorization": f"Bearer {token}"})
    assert after_revoke.status_code == 400

    # 6. Logout
    logout_resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    # Me fails after logout
    after_logout = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert after_logout.status_code == 401

def test_model_metrics_endpoints():
    # Large dataset metrics endpoint
    resp_large = client.get("/api/models/large-dataset")
    assert resp_large.status_code == 200
    data_large = resp_large.json()
    assert "models" in data_large
    assert "Logistic Regression" in data_large["models"]
    assert "Random Forest" in data_large["models"]
    assert "XGBoost" in data_large["models"]
    assert "Support Vector Machine" in data_large["models"]

    # Small dataset metrics endpoint
    resp_small = client.get("/api/models/real-world-163")
    assert resp_small.status_code == 200
    data_small = resp_small.json()
    assert data_small["dataset_provenance"] == "163-RECORD DATASET — PROVENANCE UNVERIFIED"
    assert "models" in data_small
    assert "XGBoost" in data_small["models"]
