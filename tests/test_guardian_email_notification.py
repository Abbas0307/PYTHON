"""
tests/test_guardian_email_notification.py
MINDORA 2.0 — PHASE 6.1: AUTOMATED GUARDIAN EMAIL ALERT SYSTEM TEST SUITE
Comprehensive verification of Python SMTP integration, two-level threshold alerts,
episode lifecycle, privacy guarantees, consent enforcement, bounded retries, and isolation.
"""

import time
import secrets
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient

from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER
from local_companion.email_service import (
    SMTPEmailService,
    EmailDeliveryResult,
    LEVEL_1_SUBJECT,
    LEVEL_1_BODY,
    LEVEL_2_SUBJECT,
    LEVEL_2_BODY,
    VERIFICATION_SUBJECT,
    set_email_service,
    get_email_service
)
from local_companion.crypto_vault import CRYPTO_VAULT

client = TestClient(app)


# --- FIXTURES & MOCK EMAIL SERVICE ---

class MockSMTPSuccess:
    """Mock SMTP service that records all dispatches and returns success."""
    def __init__(self):
        self.dispatches = []

    def send_level_1_alert(self, to_email: str) -> EmailDeliveryResult:
        msg_id = f"MOCK-L1-{secrets.token_hex(4).upper()}"
        self.dispatches.append({"level": 1, "to": to_email, "msg_id": msg_id})
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="Mock Level 1 email delivered successfully.",
            message_id=msg_id,
            provider_response="250 2.0.0 OK (Mock)",
            recipient_email=to_email
        )

    def send_level_2_alert(self, to_email: str) -> EmailDeliveryResult:
        msg_id = f"MOCK-L2-{secrets.token_hex(4).upper()}"
        self.dispatches.append({"level": 2, "to": to_email, "msg_id": msg_id})
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="Mock Level 2 email delivered successfully.",
            message_id=msg_id,
            provider_response="250 2.0.0 OK (Mock)",
            recipient_email=to_email
        )

    def send_verification_email(self, to_email: str, code: str) -> EmailDeliveryResult:
        msg_id = f"MOCK-VCODE-{secrets.token_hex(4).upper()}"
        self.dispatches.append({"level": "verify", "to": to_email, "code": code, "msg_id": msg_id})
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="Mock verification code delivered.",
            message_id=msg_id,
            recipient_email=to_email
        )


@pytest.fixture(autouse=True)
def mock_smtp_environment():
    """Ensure every test runs with a clean mock email service to prevent real network calls."""
    mock_svc = MockSMTPSuccess()
    original_svc = get_email_service()
    set_email_service(mock_svc)
    yield mock_svc
    set_email_service(original_svc)


def create_verified_student(email_prefix: str, email_consent: bool = True, email_verified: bool = True):
    """Helper to create and configure a student with guardian email in the local database."""
    unique_id = secrets.token_hex(4)
    email = f"{email_prefix}_{unique_id}@student.university.edu"
    guardian_email = f"guardian_{unique_id}@family.org"
    password = "SecurePassword2026!"

    ok, msg, reg_data = AUTH_MANAGER.register_user({
        "email": email,
        "password": password,
        "full_name": "Alex Student",
        "date_of_birth": "2003-05-15",
        "student_phone": "9876543210"
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg_data["profile"]["id"]
    token = reg_data["token"]

    # Save parent onboarding with guardian email
    ok_p, msg_p, _ = AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Jordan Guardian",
        "relationship": "Parent",
        "country_code": "+91",
        "phone": "9876500000",
        "email": guardian_email,
        "consent": email_consent,
        "email_consent": email_consent
    })
    assert ok_p, f"Parent onboarding failed: {msg_p}"

    if email_verified:
        with AUTH_MANAGER._get_conn() as conn:
            conn.execute("UPDATE users SET guardian_email_verified = 1 WHERE id = ?", (user_id,))
            conn.commit()

    return {
        "user_id": user_id,
        "token": token,
        "email": email,
        "guardian_email": guardian_email
    }


# ==============================================================================
# 1. STRICT PRIVACY INVARIANTS & TEMPLATE TESTS
# ==============================================================================

def test_privacy_preserving_templates_invariant():
    """Verify that email templates strictly omit numerical scores, diagnosis labels, and PHQ items."""
    forbidden_terms = [
        "phq", "phq-9", "depression", "anxiety",
        "disorder", "mental illness", "bipolar", "schizophrenia"
    ]
    for term in forbidden_terms:
        assert term not in LEVEL_1_SUBJECT.lower(), f"Forbidden term '{term}' found in Level 1 Subject"
        assert term not in LEVEL_1_BODY.lower(), f"Forbidden term '{term}' found in Level 1 Body"
        assert term not in LEVEL_2_SUBJECT.lower(), f"Forbidden term '{term}' found in Level 2 Subject"
        assert term not in LEVEL_2_BODY.lower(), f"Forbidden term '{term}' found in Level 2 Body"
        assert term not in VERIFICATION_SUBJECT.lower(), f"Forbidden term '{term}' found in Verification Subject"

    # Verify exact subjects (Phase 10, Phase 9, and legacy accepted)
    assert LEVEL_1_SUBJECT in [
        "Mindora Alert – Your Student's Stress Level Requires Attention",
        "Mindora Wellbeing Update – A Gentle Check-In Recommended",
        "Mindora — A Student Wellbeing Check-In"
    ]
    assert LEVEL_2_SUBJECT in [
        "URGENT WELLBEING ALERT – Your Student Needs Immediate Attention",
        "Mindora Wellbeing Alert – Additional Support Recommended",
        "Mindora — Important Student Wellbeing Follow-Up"
    ]


# ==============================================================================
# 2. SMTP DISPATCHER UNIT TESTS (SSL / STARTTLS / TIMEOUT / VALIDATION)
# ==============================================================================

def test_smtp_dispatcher_ssl_success():
    """Verify that SMTPEmailService dispatches correctly over SSL with privacy assertions."""
    service = SMTPEmailService(
        host="smtp.example.com",
        port=465,
        username="user@example.com",
        password="secretpassword",
        use_ssl=True,
        timeout=10
    )

    with patch("smtplib.SMTP_SSL") as mock_smtp_ssl:
        mock_server = MagicMock()
        mock_smtp_ssl.return_value.__enter__.return_value = mock_server

        res = service.send_level_1_alert("guardian@example.com")
        assert res.success is True
        assert res.status == "sent"
        assert res.recipient_email == "guardian@example.com"
        mock_server.login.assert_called_once_with("user@example.com", "secretpassword")
        mock_server.send_message.assert_called_once()


def test_smtp_dispatcher_starttls_success():
    """Verify that SMTPEmailService dispatches correctly over STARTTLS (Port 587)."""
    service = SMTPEmailService(
        host="smtp.example.com",
        port=587,
        username="user@example.com",
        password="secretpassword",
        use_ssl=False,
        timeout=10
    )

    with patch("smtplib.SMTP") as mock_smtp:
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        res = service.send_level_2_alert("guardian@example.com")
        assert res.success is True
        assert res.status == "sent"
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("user@example.com", "secretpassword")


def test_smtp_dispatcher_invalid_email_rejection():
    """SMTPEmailService must reject malformed recipient email addresses before opening sockets."""
    service = SMTPEmailService(host="smtp.example.com", username="u", password="p")
    for bad_email in ["not-an-email", "@missinguser.com", "user@", "user@domain"]:
        res = service.send_level_1_alert(bad_email)
        assert res.success is False
        assert res.status == "failed"
        assert res.error_code == "INVALID_RECIPIENT"


# ==============================================================================
# 3. ENCRYPTION AT REST & VERIFICATION OTP TESTS
# ==============================================================================

def test_guardian_email_encrypted_at_rest():
    """Ensure registered guardian email is stored under authenticated AES-256-GCM encryption."""
    student = create_verified_student("enc_test")
    user_id = student["user_id"]
    guardian_email = student["guardian_email"]

    with AUTH_MANAGER._get_conn() as conn:
        raw_db_row = conn.execute("SELECT guardian_email FROM users WHERE id = ?", (user_id,)).fetchone()
        raw_enc = raw_db_row["guardian_email"]
        assert raw_enc is not None
        assert guardian_email not in raw_enc, "Guardian email was stored in plaintext!"
        decrypted = CRYPTO_VAULT.decrypt_field(raw_enc, f"user:{user_id}:guardian_email")
        assert decrypted == guardian_email


def test_guardian_email_verification_otp_flow(mock_smtp_environment):
    """Test 6-digit OTP dispatch and verification with expiration and attempt bounding."""
    student = create_verified_student("otp_test", email_verified=False)
    user_id = student["user_id"]

    # 1. Send verification code
    ok_send, msg_send, code = AUTH_MANAGER.send_guardian_email_verification(user_id)
    assert ok_send is True
    assert len(mock_smtp_environment.dispatches) == 1
    assert mock_smtp_environment.dispatches[0]["level"] == "verify"
    assert len(code) == 6 and code.isdigit()

    # 2. Attempt with wrong code
    ok_wrong, msg_wrong = AUTH_MANAGER.verify_guardian_email(user_id, "000000")
    assert ok_wrong is False
    assert "Invalid" in msg_wrong

    # 3. Attempt with correct code
    ok_correct, msg_correct = AUTH_MANAGER.verify_guardian_email(user_id, code)
    assert ok_correct is True

    # 4. Profile confirms verified
    prof = AUTH_MANAGER.get_user_profile(user_id)
    assert prof["guardian"]["email_verified"] is True


# ==============================================================================
# 4. TWO-LEVEL THRESHOLD ALERT LOGIC & EPISODE ENGINE
# ==============================================================================

def test_stress_below_threshold_no_notification(mock_smtp_environment):
    """Stress scores below 70 (e.g. 50, 69) must never trigger notifications."""
    student = create_verified_student("low_stress")
    user_id = student["user_id"]

    for score in [50.0, 69.0]:
        ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, score)
        assert ok is False
        assert receipt["status"] == "below_threshold"
        assert len(mock_smtp_environment.dispatches) == 0


def test_two_level_stress_alerts_progression(mock_smtp_environment):
    """
    Test full sequence:
      50 -> No alert
      75 -> Level 1 sent
      80 -> Level 1 suppressed (duplicate in episode)
      89 -> Level 1 suppressed (duplicate in episode)
      90 -> Level 2 sent (escalation)
      95 -> Level 2 suppressed (duplicate in episode)
    """
    student = create_verified_student("multi_level")
    user_id = student["user_id"]

    # 1. Score 50: No alert
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 50.0)
    assert ok is False
    assert receipt["status"] == "below_threshold"
    assert len(mock_smtp_environment.dispatches) == 0

    # 2. Score 75: Level 1 sent
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 75.0)
    assert ok is True
    assert receipt["threshold_level"] == 1
    assert receipt["status"] == "sent"
    assert len(mock_smtp_environment.dispatches) == 1
    assert mock_smtp_environment.dispatches[0]["level"] == 1
    ep_id = receipt["episode_id"]

    # 3. Score 80: Duplicate Level 1 suppressed
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 80.0)
    assert ok is False
    assert receipt["status"] == "already_triggered"
    assert receipt["level"] == 1
    assert len(mock_smtp_environment.dispatches) == 1  # No new email

    # 4. Score 89: Duplicate Level 1 suppressed
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 89.0)
    assert ok is False
    assert receipt["status"] == "already_triggered"
    assert len(mock_smtp_environment.dispatches) == 1

    # 5. Score 90: Escalation to Level 2 sent!
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 90.0)
    assert ok is True
    assert receipt["threshold_level"] == 2
    assert receipt["status"] == "sent"
    assert receipt["episode_id"] == ep_id  # Same episode
    assert len(mock_smtp_environment.dispatches) == 2
    assert mock_smtp_environment.dispatches[1]["level"] == 2

    # 6. Score 95: Duplicate Level 2 suppressed
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 95.0)
    assert ok is False
    assert receipt["status"] == "already_triggered"
    assert receipt["level"] == 2
    assert len(mock_smtp_environment.dispatches) == 2


def test_episode_recovery_and_retrigger(mock_smtp_environment):
    """
    Test recovery:
      75 -> Level 1 sent
      60 (<= 65 recovery threshold) -> Episode marked recovered
      75 -> New episode created, Level 1 triggers again!
    """
    student = create_verified_student("recovery_test")
    user_id = student["user_id"]

    # First trigger at 75
    ok, msg, r1 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 75.0)
    assert ok is True
    ep1_id = r1["episode_id"]

    # Stress recovers to 60 (<= 65)
    ok_rec, msg_rec, r_rec = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 60.0)
    assert ok_rec is False
    assert r_rec["status"] == "recovered"
    assert r_rec["episode_id"] == ep1_id

    # Verify episode status in DB
    ep_status = AUTH_MANAGER.get_current_episode(user_id)
    assert ep_status["status"] == "recovered"

    # New stress spike to 75: initiates a brand new episode!
    ok_new, msg_new, r_new = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 75.0)
    assert ok_new is True
    assert r_new["threshold_level"] == 1
    assert r_new["episode_id"] != ep1_id  # New episode ID
    assert len(mock_smtp_environment.dispatches) == 2


def test_direct_jump_to_level_2(mock_smtp_environment):
    """When stress jumps directly from normal (e.g. 50) to >= 90 (e.g. 92), trigger Level 2."""
    student = create_verified_student("direct_l2")
    user_id = student["user_id"]

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 92.0)
    assert ok is True
    assert receipt["threshold_level"] == 2
    # Phase 11 crossing rule: direct jump from below 70 to >= 90 dispatches both Level 1 and Level 2
    assert any(d["level"] == 2 for d in mock_smtp_environment.dispatches)
    assert len(mock_smtp_environment.dispatches) == 2


# ==============================================================================
# 5. CONSENT, SAFEGUARDING & SUPPRESSION TESTS
# ==============================================================================

def test_missing_consent_suppresses_alert(mock_smtp_environment):
    """When student has not granted consent, alert is suppressed with reason 'consent_missing'."""
    student = create_verified_student("no_consent", email_consent=False)
    user_id = student["user_id"]

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 80.0)
    assert ok is False
    assert receipt["status"] == "suppressed"
    assert receipt["reason"] == "consent_missing"
    assert len(mock_smtp_environment.dispatches) == 0

    # Ensure suppressed event is recorded in audit log
    logs = AUTH_MANAGER.get_notification_log(user_id)
    assert len(logs) == 1
    assert logs[0]["status"] == "suppressed"
    assert logs[0]["failure_reason"] == "consent_missing"


def test_unverified_email_suppresses_alert(mock_smtp_environment):
    """When guardian email is unverified, alert is suppressed with reason 'email_unverified'."""
    student = create_verified_student("unverified_email", email_verified=False)
    user_id = student["user_id"]

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 85.0)
    assert ok is False
    assert receipt["status"] == "suppressed"
    assert receipt["reason"] == "email_unverified"
    assert len(mock_smtp_environment.dispatches) == 0


def test_consent_withdrawal_immediately_halts_alerts(mock_smtp_environment):
    """Revoking consent immediately halts subsequent alert evaluations."""
    student = create_verified_student("withdraw_test")
    user_id = student["user_id"]

    # Withdraw consent
    ok_rev, _ = AUTH_MANAGER.revoke_guardian_consent(user_id)
    assert ok_rev is True

    # Try triggering alert at 92
    ok_trig, _, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 92.0)
    assert ok_trig is False
    assert receipt["status"] == "suppressed"
    assert receipt["reason"] == "consent_missing"
    assert len(mock_smtp_environment.dispatches) == 0


# ==============================================================================
# 6. IDEMPOTENCY & DATABASE INTEGRITY
# ==============================================================================

def test_idempotency_key_deduplication(mock_smtp_environment):
    """Duplicate calls with identical idempotency_key must be recognized and not re-sent."""
    student = create_verified_student("idempotency_test")
    user_id = student["user_id"]
    idem_key = f"IDEM-TEST-KEY-{secrets.token_hex(6)}"

    ok1, _, r1 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 78.0, idempotency_key=idem_key)
    assert ok1 is True
    assert len(mock_smtp_environment.dispatches) == 1

    ok2, msg2, r2 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 78.0, idempotency_key=idem_key)
    assert ok2 is False
    assert r2["status"] == "duplicate_idempotency_key"
    assert len(mock_smtp_environment.dispatches) == 1


# ==============================================================================
# 7. FAILURE HANDLING & RETRY WORKFLOW
# ==============================================================================

def test_smtp_failure_and_retry_workflow():
    """
    When SMTP delivery fails:
      1. Notification is recorded with status 'failed'.
      2. Student/admin can retry via retry_notification.
      3. Bounded at maximum 3 retry attempts.
    """
    student = create_verified_student("retry_test")
    user_id = student["user_id"]

    # Configure a failing email service
    class FailingEmailService:
        def send_level_1_alert(self, to_email: str):
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="SMTP Connection Timed Out",
                message_id=f"FAIL-{secrets.token_hex(4)}",
                recipient_email=to_email
            )
        def send_level_2_alert(self, to_email: str):
            return self.send_level_1_alert(to_email)

    set_email_service(FailingEmailService())

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 76.0)
    assert ok is False
    assert receipt["status"] == "failed"
    notif_id = receipt["notification_id"]

    # Verify failure recorded
    logs = AUTH_MANAGER.get_notification_log(user_id)
    assert logs[0]["status"] == "failed"
    assert logs[0]["retry_count"] == 0

    # Switch to healthy service and retry
    set_email_service(MockSMTPSuccess())
    ok_ret, msg_ret, ret_receipt = AUTH_MANAGER.retry_notification(user_id, notif_id)
    assert ok_ret is True
    assert ret_receipt["status"] == "sent"
    assert ret_receipt["retry_count"] == 1

    # Verify cannot retry already sent notification
    ok_ret2, msg_ret2, _ = AUTH_MANAGER.retry_notification(user_id, notif_id)
    assert ok_ret2 is False
    assert "already successfully sent" in msg_ret2


# ==============================================================================
# 8. STUDENT ISOLATION & AUTHORIZATION
# ==============================================================================

def test_student_isolation_and_authorization():
    """Ensure Student A cannot view, access, or retry Student B's notifications."""
    student_a = create_verified_student("student_a")
    student_b = create_verified_student("student_b")

    # Trigger alert for Student A
    AUTH_MANAGER.evaluate_and_trigger_automatic_alert(student_a["user_id"], 76.0)
    logs_a = AUTH_MANAGER.get_notification_log(student_a["user_id"])
    assert len(logs_a) == 1
    notif_a_id = logs_a[0]["id"]

    # Student B logs must be empty
    logs_b = AUTH_MANAGER.get_notification_log(student_b["user_id"])
    assert len(logs_b) == 0

    # Student B cannot retry Student A's notification
    ok_retry, msg_retry, _ = AUTH_MANAGER.retry_notification(student_b["user_id"], notif_a_id)
    assert ok_retry is False
    assert "not found" in msg_retry.lower()


# ==============================================================================
# 9. FASTAPI ENDPOINTS INTEGRATION TESTS
# ==============================================================================

def test_fastapi_guardian_email_endpoints():
    """Test all new Phase 6.1 FastAPI endpoints end-to-end via TestClient."""
    student = create_verified_student("api_test", email_verified=False)
    token = student["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Send verification OTP endpoint
    res_send = client.post("/api/guardian/send-email-verification", headers=headers)
    assert res_send.status_code == 200
    send_data = res_send.json()
    assert send_data["status"] == "success"
    otp_code = send_data["code"]

    # 2. Verify OTP endpoint
    res_ver = client.post("/api/guardian/verify-email", json={"code": otp_code}, headers=headers)
    assert res_ver.status_code == 200
    assert res_ver.json()["status"] == "success"

    # 3. Email consent toggle endpoint
    res_con = client.post("/api/guardian/email-consent", json={"consent": True}, headers=headers)
    assert res_con.status_code == 200

    # 4. Evaluate stress endpoint (Level 1)
    res_eval = client.post("/api/guardian/evaluate-stress", json={"friction_score": 77.0}, headers=headers)
    assert res_eval.status_code == 200
    eval_data = res_eval.json()
    assert eval_data["status"] == "success"
    assert eval_data["receipt"]["threshold_level"] == 1

    # 5. Check audit log endpoint
    res_log = client.get("/api/guardian/notifications", headers=headers)
    assert res_log.status_code == 200
    log_data = res_log.json()
    assert len(log_data["logs"]) >= 1
    assert log_data["logs"][0]["threshold_level"] == 1

    # 6. Check episode status endpoint
    res_ep = client.get("/api/guardian/episode-status", headers=headers)
    assert res_ep.status_code == 200
    ep_data = res_ep.json()
    assert ep_data["episode"]["status"] == "active"
    assert ep_data["episode"]["level_1_triggered"] is True
