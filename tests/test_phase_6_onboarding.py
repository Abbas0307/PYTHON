import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER

client = TestClient(app)

def test_phase_6_full_onboarding_lifecycle():
    """
    Test Step-by-Step Onboarding:
    LOGIN/REGISTER -> PARENT INFORMATION -> STUDENT INFORMATION -> DASHBOARD
    """
    email = f"student_phase6_{int(datetime.now().timestamp())}@university.edu"
    password = "StrongPassword2026!"

    # 1. New student registers with basic credentials
    reg_resp = client.post("/api/auth/register", json={
        "email": email,
        "password": password,
        "confirm_password": password,
        "terms_consent": True,
        "privacy_consent": True
    })
    assert reg_resp.status_code == 200, reg_resp.text
    reg_data = reg_resp.json()
    token = reg_data["data"]["token"]
    profile = reg_data["data"]["profile"]

    assert profile["email"] == email
    assert profile["onboarding"]["parent_info_completed"] is False
    assert profile["onboarding"]["student_info_completed"] is False
    assert profile["onboarding"]["onboarding_completed"] is False
    assert profile["onboarding"]["next_step"] == "parent_info"

    # 2. Check onboarding status endpoint
    status_resp = client.get("/api/onboarding/status", headers={"Authorization": f"Bearer {token}"})
    assert status_resp.status_code == 200
    assert status_resp.json()["onboarding"]["next_step"] == "parent_info"

    # 3. Validation failure on invalid parent phone
    invalid_parent = client.post("/api/onboarding/parent", json={
        "name": "Jane Doe",
        "relationship": "Mother",
        "country_code": "+91",
        "phone": "123", # Too short
        "consent": True
    }, headers={"Authorization": f"Bearer {token}"})
    assert invalid_parent.status_code == 400

    # 4. Save valid Parent Information
    parent_resp = client.post("/api/onboarding/parent", json={
        "name": "Jane Doe",
        "relationship": "Mother",
        "country_code": "+91",
        "phone": "9876543210",
        "secondary_phone": "9876543211",
        "preferred_contact": "WhatsApp",
        "priority": "Primary",
        "consent": True
    }, headers={"Authorization": f"Bearer {token}"})
    assert parent_resp.status_code == 200, parent_resp.text
    p_data = parent_resp.json()["data"]["profile"]
    assert p_data["guardian"]["name"] == "Jane Doe"
    assert p_data["guardian"]["phone"] == "9876543210"
    assert p_data["guardian"]["secondary_phone"] == "9876543211"
    assert p_data["guardian"]["preferred_contact"] == "WhatsApp"
    assert p_data["guardian"]["priority"] == "Primary"
    assert p_data["onboarding"]["parent_info_completed"] is True
    assert p_data["onboarding"]["student_info_completed"] is False
    assert p_data["onboarding"]["next_step"] == "student_info"

    # 5. Incomplete state recovery: Log out and log back in
    logout_resp = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    login_resp = client.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    assert login_resp.status_code == 200
    new_token = login_resp.json()["data"]["token"]
    login_profile = login_resp.json()["data"]["profile"]
    assert login_profile["onboarding"]["parent_info_completed"] is True
    assert login_profile["onboarding"]["student_info_completed"] is False
    assert login_profile["onboarding"]["next_step"] == "student_info"

    # 6. Validation failures on Student Information:
    # A. Future DOB
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    fail_dob_future = client.post("/api/onboarding/student", json={
        "full_name": "Alex Student",
        "date_of_birth": tomorrow,
        "gender": "Non-binary",
        "institution_name": "MIT College of Engineering",
        "department": "Computer Science",
        "academic_year": "2nd Year"
    }, headers={"Authorization": f"Bearer {new_token}"})
    assert fail_dob_future.status_code == 400
    assert "future" in fail_dob_future.json()["detail"].lower()

    # B. Underage (< 13)
    young_dob = (datetime.now() - timedelta(days=365 * 10)).strftime("%Y-%m-%d")
    fail_dob_young = client.post("/api/onboarding/student", json={
        "full_name": "Alex Student",
        "date_of_birth": young_dob,
        "gender": "Non-binary",
        "institution_name": "MIT College of Engineering",
        "department": "Computer Science",
        "academic_year": "2nd Year"
    }, headers={"Authorization": f"Bearer {new_token}"})
    assert fail_dob_young.status_code == 400
    assert "13" in fail_dob_young.json()["detail"]

    # 7. Save valid Student Information
    student_resp = client.post("/api/onboarding/student", json={
        "full_name": "Alex Student",
        "date_of_birth": "2003-08-14",
        "gender": "Non-binary",
        "institution_name": "National Institute of Technology",
        "department": "Data Science & Artificial Intelligence",
        "academic_year": "3rd Year",
        "student_phone": "9123456789"
    }, headers={"Authorization": f"Bearer {new_token}"})
    assert student_resp.status_code == 200, student_resp.text
    final_profile = student_resp.json()["data"]["profile"]

    assert final_profile["full_name"] == "Alex Student"
    assert final_profile["date_of_birth"] == "2003-08-14"
    assert final_profile["is_adult"] is True
    assert final_profile["gender"] == "Non-binary"
    assert final_profile["institution_name"] == "National Institute of Technology"
    assert final_profile["department"] == "Data Science & Artificial Intelligence"
    assert final_profile["academic_year"] == "3rd Year"
    assert final_profile["onboarding"]["parent_info_completed"] is True
    assert final_profile["onboarding"]["student_info_completed"] is True
    assert final_profile["onboarding"]["onboarding_completed"] is True
    assert final_profile["onboarding"]["next_step"] == "dashboard"

    # 8. Returning User: logging in skips directly to Dashboard
    client.post("/api/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    return_login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert return_login.status_code == 200
    assert return_login.json()["data"]["profile"]["onboarding"]["next_step"] == "dashboard"

def test_unauthenticated_onboarding_protection():
    """Verify all onboarding routes strictly reject unauthenticated requests."""
    assert client.post("/api/onboarding/parent", json={}).status_code == 401
    assert client.post("/api/onboarding/student", json={}).status_code == 401
    assert client.get("/api/onboarding/status").status_code == 401
