"""
test_phase_9_guardian_email_alerts.py
MINDORA 2.0 — PHASE 9 GUARDIAN EMAIL ALERTS COMPREHENSIVE VERIFICATION
Validates:
1. Stress indicator 69: no email.
2. Stress indicator 70: first email.
3. Stress indicator 75: no duplicate first email.
4. Stress indicator 89: no duplicate first email.
5. Stress indicator 90: second warning email.
6. Stress indicator 95: no duplicate second email for the same event.
7. Consent disabled: no email.
8. Guardian email unverified: no email.
9. Consent withdrawn: no future emails.
10. SMTP failure: persistent retry.
11. Repeated backend event processing: no duplicate email.
12. Voice-based indicator: never triggers an email.
13. Research dataset: never triggers an email.
14. Diagnostic endpoint: admin/researcher telemetry access control.
"""

import pytest
import secrets
from fastapi.testclient import TestClient
from local_companion.service import app
from local_companion.auth_manager import AUTH_MANAGER
from local_companion.email_service import set_email_service, EmailDeliveryResult

client = TestClient(app)

class MockSMTPSink:
    def __init__(self):
        self.dispatches = []
        self.should_fail = False

    def send_level_1_alert(self, to_email: str) -> EmailDeliveryResult:
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="SMTP connection refused: Simulated mock outage",
                message_id=f"MOCK-FAIL-L1-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )
        msg_id = f"MOCK-L1-{secrets.token_hex(4).upper()}"
        self.dispatches.append({"level": 1, "to": to_email, "msg_id": msg_id})
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 2.0.0 OK Message queued",
            message_id=msg_id,
            provider_response="250 2.0.0 OK Message queued",
            recipient_email=to_email
        )

    def send_level_2_alert(self, to_email: str) -> EmailDeliveryResult:
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="SMTP connection refused: Simulated mock outage",
                message_id=f"MOCK-FAIL-L2-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )
        msg_id = f"MOCK-L2-{secrets.token_hex(4).upper()}"
        self.dispatches.append({"level": 2, "to": to_email, "msg_id": msg_id})
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 2.0.0 OK Message queued",
            message_id=msg_id,
            provider_response="250 2.0.0 OK Message queued",
            recipient_email=to_email
        )

@pytest.fixture
def mock_smtp():
    sink = MockSMTPSink()
    set_email_service(sink)
    yield sink
    set_email_service(None)

def create_verified_student(prefix="phase9"):
    token_str = secrets.token_hex(4)
    email = f"{prefix}_{token_str}@test.mindora.edu"
    pwd = "SecurePass123!"

    ok, msg, reg_data = AUTH_MANAGER.register_user({
        "email": email,
        "password": pwd,
        "full_name": f"Student {prefix}",
        "student_phone": "+919876543200"
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg_data["profile"]["id"]
    token = reg_data["token"]

    guardian_email = f"guardian_{token_str}@example.com"
    ok_p, msg_p, _ = AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Jordan Guardian",
        "phone": "9876543299",
        "country_code": "+91",
        "relationship": "Mother",
        "email": guardian_email,
        "consent": True
    })
    assert ok_p, f"Parent onboarding failed: {msg_p}"

    # Mark email as verified and adult
    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("""
        UPDATE users
        SET guardian_email_verified = 1, guardian_email_consent = 1, is_adult = 1
        WHERE id = ?
        """, (user_id,))
        conn.commit()

    return {"user_id": user_id, "token": token, "email": email}

def test_phase_9_exact_threshold_sequence(mock_smtp):
    """
    1. Score 69: no email
    2. Score 70: first email (Level 1)
    3. Score 75: no duplicate first email
    4. Score 89: no duplicate first email
    5. Score 90: second warning email (Level 2, not blocked by 70 cooldown)
    6. Score 95: no duplicate second email
    """
    student = create_verified_student("seq_test")
    uid = student["user_id"]

    # 1. Score 69: No email
    ok, msg, r69 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 69.0)
    assert ok is False
    assert r69["status"] == "below_threshold"
    assert len(mock_smtp.dispatches) == 0

    # 2. Score 70: First email (Level 1 triggered!)
    ok, msg, r70 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 70.0)
    assert ok is True
    assert r70["threshold_level"] == 1
    assert r70["status"] == "sent"
    assert len(mock_smtp.dispatches) == 1
    assert mock_smtp.dispatches[0]["level"] == 1

    # 3. Score 75: Duplicate Level 1 suppressed
    ok, msg, r75 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 75.0)
    assert ok is False
    assert r75["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 1

    # 4. Score 89: Still in Level 1 range, duplicate suppressed
    ok, msg, r89 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 89.0)
    assert ok is False
    assert r89["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 1

    # 5. Score 90: Reaches Level 2! Dispatches Level 2 warning (NOT blocked by Level 1 cooldown)
    ok, msg, r90 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 90.0)
    assert ok is True
    assert r90["threshold_level"] == 2
    assert r90["status"] == "sent"
    assert len(mock_smtp.dispatches) == 2
    assert mock_smtp.dispatches[1]["level"] == 2

    # 6. Score 95: Duplicate Level 2 suppressed
    ok, msg, r95 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 95.0)
    assert ok is False
    assert r95["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 2

def test_consent_disabled_suppresses_alert(mock_smtp):
    """7. Consent disabled: no email sent."""
    student = create_verified_student("no_consent")
    uid = student["user_id"]

    # Explicitly turn off consent
    AUTH_MANAGER.update_guardian_email_consent(uid, False)

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 72.0)
    assert ok is False
    assert receipt["status"] == "suppressed"
    assert receipt["reason"] == "consent_missing"
    assert len(mock_smtp.dispatches) == 0

def test_unverified_email_suppresses_alert(mock_smtp):
    """8. Guardian email unverified: no email sent."""
    student = create_verified_student("unverified_email")
    uid = student["user_id"]

    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("UPDATE users SET guardian_email_verified = 0 WHERE id = ?", (uid,))
        conn.commit()

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 72.0)
    assert ok is False
    assert receipt["status"] == "suppressed"
    assert receipt["reason"] == "email_unverified"
    assert len(mock_smtp.dispatches) == 0

def test_consent_withdrawn_halts_future_alerts(mock_smtp):
    """9. Consent withdrawn: halts future emails immediately."""
    student = create_verified_student("consent_withdraw")
    uid = student["user_id"]

    # Student withdraws consent
    ok_rev, _ = AUTH_MANAGER.revoke_guardian_consent(uid)
    assert ok_rev is True

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 92.0)
    assert ok is False
    assert receipt["status"] == "suppressed"
    assert len(mock_smtp.dispatches) == 0

def test_smtp_failure_and_retry(mock_smtp):
    """10. SMTP failure: persistent retry capability."""
    student = create_verified_student("smtp_fail")
    uid = student["user_id"]

    mock_smtp.should_fail = True
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 72.0)
    assert ok is False  # Email failed to dispatch
    assert receipt["status"] == "failed"

    # Get notification id
    notif_log = AUTH_MANAGER.get_notification_log(uid)
    assert len(notif_log) >= 1
    failed_id = notif_log[0]["id"]

    # Simulate SMTP recovery and retry
    mock_smtp.should_fail = False
    ok_retry, retry_msg, retry_receipt = AUTH_MANAGER.retry_notification(uid, failed_id)
    assert ok_retry is True
    assert retry_receipt["status"] == "sent"

def test_idempotency_key_deduplication(mock_smtp):
    """11. Repeated backend event processing with same idempotency key sends no duplicate."""
    student = create_verified_student("idemp_test")
    uid = student["user_id"]
    idemp_key = f"phase9-event-{secrets.token_hex(6)}"

    # First attempt: sends email
    ok1, _, r1 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 72.0, idempotency_key=idemp_key)
    assert ok1 is True
    assert len(mock_smtp.dispatches) == 1

    # Second attempt with same key: rejected as duplicate
    ok2, msg2, r2 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 72.0, idempotency_key=idemp_key)
    assert ok2 is False
    assert r2["status"] == "duplicate_idempotency_key"
    assert len(mock_smtp.dispatches) == 1

def test_voice_indicator_never_triggers_email(mock_smtp):
    """12. Voice-based indicator: strictly never triggers an email."""
    student = create_verified_student("voice_safety")
    uid = student["user_id"]

    # Attempt alert with source="voice_feelings_space" or "voice_analysis"
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(
        uid, 95.0, source="voice_feelings_space"
    )
    assert ok is False
    assert receipt["status"] == "voice_blocked"
    assert len(mock_smtp.dispatches) == 0

def test_research_dataset_never_triggers_email(mock_smtp):
    """13. Research dataset: strictly never triggers an email."""
    student = create_verified_student("research_safety")
    uid = student["user_id"]

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(
        uid, 95.0, source="research_dataset_163"
    )
    assert ok is False
    assert receipt["status"] == "research_blocked"
    assert len(mock_smtp.dispatches) == 0

def test_diagnostic_endpoint_access_control(mock_smtp):
    """14. Diagnostic endpoint: admin/researcher telemetry access control."""
    student = create_verified_student("diag_student")
    token = student["token"]

    # Ordinary student gets 403 Forbidden
    resp_student = client.get(
        "/api/admin/guardian-notifications/diagnostics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_student.status_code == 403

    # Researcher gets 200 OK
    AUTH_MANAGER.set_user_researcher(student["user_id"], is_researcher=True)
    resp_admin = client.get(
        "/api/admin/guardian-notifications/diagnostics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resp_admin.status_code == 200
    data = resp_admin.json()
    assert data["status"] == "success"
    assert isinstance(data["diagnostics"], list)
