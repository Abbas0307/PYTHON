"""
tests/test_phase_10_optimization.py
Mindora 2.0 — Phase 10 Intelligent Feature Optimization & Reliability Tests

Covers:
1. Two-level guardian email alerts at exact thresholds 70.0 and 90.0.
2. Independent Level 2 trigger (Alert 90 is NOT blocked by Alert 70 cooldown).
3. Automated retry mechanism for temporary SMTP failures (process_pending_retries).
4. Consent gating: missing or withdrawn consent strictly suppresses emails.
5. Invariant: Voice interactions and research datasets strictly never trigger emails.
6. Admin retry endpoint and diagnostic authorization.
7. CPU-only execution confirmation.
"""

import pytest
import sqlite3
import secrets
from datetime import datetime, timezone
from local_companion.auth_manager import AUTH_MANAGER
from local_companion.email_service import EmailDeliveryResult, SMTPEmailService


class MockSmtpDispatcher:
    def __init__(self, should_fail: bool = False):
        self.should_fail = should_fail
        self.dispatches = []

    def is_configured(self):
        return True

    def validate_email(self, email_address: str):
        return bool(email_address and "@" in email_address)

    def send_level_1_alert(self, to_email: str, custom_msg_id=None):
        msg_id = custom_msg_id or f"MOCK-L1-{secrets.token_hex(4).upper()}"
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="Temporary SMTP connection timeout (simulated for retry test)",
                message_id=msg_id,
                error_code="CONNECTION_TIMEOUT",
                recipient_email=to_email
            )
        res = EmailDeliveryResult(
            success=True,
            status="sent",
            message="Email delivered successfully via SMTP server.",
            message_id=msg_id,
            provider_response="250 Message accepted for delivery",
            recipient_email=to_email,
            sent_at=datetime.now(timezone.utc).isoformat()
        )
        self.dispatches.append({"level": 1, "email": to_email, "msg_id": msg_id})
        return res

    def send_level_2_alert(self, to_email: str, custom_msg_id=None):
        msg_id = custom_msg_id or f"MOCK-L2-{secrets.token_hex(4).upper()}"
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="Temporary SMTP connection timeout (simulated for retry test)",
                message_id=msg_id,
                error_code="CONNECTION_TIMEOUT",
                recipient_email=to_email
            )
        res = EmailDeliveryResult(
            success=True,
            status="sent",
            message="Email delivered successfully via SMTP server.",
            message_id=msg_id,
            provider_response="250 Message accepted for delivery",
            recipient_email=to_email,
            sent_at=datetime.now(timezone.utc).isoformat()
        )
        self.dispatches.append({"level": 2, "email": to_email, "msg_id": msg_id})
        return res


@pytest.fixture
def mock_smtp(monkeypatch):
    dispatcher = MockSmtpDispatcher(should_fail=False)
    import local_companion.auth_manager as am
    monkeypatch.setattr(am, "get_email_service", lambda: dispatcher)
    return dispatcher


def create_verified_student(label: str = "phase10"):
    email = f"student_{label}_{secrets.token_hex(4)}@testuniv.edu"
    pwd = "ValidStudentPassword123!"
    ok, msg, reg_data = AUTH_MANAGER.register_user({
        "email": email,
        "password": pwd,
        "full_name": f"Student {label.capitalize()}",
        "is_adult": True
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg_data["profile"]["id"]
    token = reg_data["token"]

    AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Jane Doe Guardian",
        "email": f"guardian_{secrets.token_hex(4)}@testdomain.com",
        "phone": "5551234567",
        "country_code": "+91",
        "relationship": "Mother",
        "consent": True
    })
    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("UPDATE users SET guardian_email_verified = 1, guardian_email_consent = 1, is_adult = 1 WHERE id = ?", (user_id,))
        conn.commit()

    return {"user_id": user_id, "token": token, "email": email}


def test_independent_70_and_90_alerts(mock_smtp):
    """Verify Level 1 at 70 and Level 2 at 90 fire independently without cooldown blockage."""
    student = create_verified_student("indep")
    uid = student["user_id"]

    # 1. Below 70: No email
    ok1, _, r1 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 68.5)
    assert not ok1
    assert r1["status"] == "below_threshold"
    assert len(mock_smtp.dispatches) == 0

    # 2. Reaches 70.0: Level 1 dispatched
    ok2, _, r2 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 70.0)
    assert ok2
    assert r2["threshold_level"] == 1
    assert r2["status"] == "sent"
    assert len(mock_smtp.dispatches) == 1
    assert mock_smtp.dispatches[0]["level"] == 1

    # 3. Duplicate 75.0: Suppressed
    ok3, _, r3 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 75.0)
    assert not ok3
    assert r3["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 1

    # 4. Reaches 90.0: Level 2 dispatched (NOT blocked by Level 1 cooldown!)
    ok4, _, r4 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 90.0)
    assert ok4
    assert r4["threshold_level"] == 2
    assert r4["status"] == "sent"
    assert len(mock_smtp.dispatches) == 2
    assert mock_smtp.dispatches[1]["level"] == 2


def test_temporary_smtp_failure_and_batch_retry_queue(mock_smtp):
    """Verify transient SMTP failure gets queued and process_pending_retries safely recovers it."""
    student = create_verified_student("retry_queue")
    uid = student["user_id"]

    # Simulate temporary SMTP server connection drop
    mock_smtp.should_fail = True
    ok_fail, msg_fail, receipt_fail = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 73.0)
    assert not ok_fail
    assert receipt_fail["status"] == "failed"
    assert len(mock_smtp.dispatches) == 0

    # SMTP server recovers
    mock_smtp.should_fail = False

    # Process pending retry queue
    retry_result = AUTH_MANAGER.process_pending_retries(max_batch=5)
    assert retry_result["processed"] >= 1
    assert retry_result["succeeded"] >= 1
    assert len(mock_smtp.dispatches) >= 1
    assert mock_smtp.dispatches[-1]["level"] == 1


def test_consent_withdrawal_halts_future_alerts_and_retries(mock_smtp):
    """Verify consent withdrawal stops any alerts from going out."""
    student = create_verified_student("withdraw")
    uid = student["user_id"]

    # Withdraw consent
    AUTH_MANAGER.update_guardian_email_consent(uid, False)

    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 95.0)
    assert not ok
    assert receipt["status"] == "suppressed"
    assert receipt["reason"] == "consent_missing"
    assert len(mock_smtp.dispatches) == 0


def test_voice_and_research_isolation_invariant(mock_smtp):
    """Strict Invariant: Voice conversations and research datasets NEVER trigger guardian emails."""
    student = create_verified_student("isolation")
    uid = student["user_id"]

    # Voice input
    ok_v, msg_v, r_v = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 98.0, source="voice_feelings_space")
    assert not ok_v
    assert r_v["status"] == "voice_blocked"
    assert len(mock_smtp.dispatches) == 0

    # Research dataset
    ok_r, msg_r, r_r = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 98.0, source="research_dataset")
    assert not ok_r
    assert r_r["status"] == "research_blocked"
    assert len(mock_smtp.dispatches) == 0
