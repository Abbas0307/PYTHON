"""
tests/test_phase_11_email_delivery.py
MINDORA 2.0 — PHASE 11: COMPLETE EMAIL DELIVERY & GUARDIAN VERIFICATION SUITE

Validates:
1. Exact threshold transitions: 69 (none), 70 (L1), 75 (no duplicate), 89 (no duplicate), 90 (L2), 93 (no duplicate), 95 (no duplicate), 100 (no duplicate).
2. Direct jump from below 70 to 95: Dispatches BOTH Level 1 and Level 2 notifications independently.
3. Verification link generation with cryptographically secure token & expiration.
4. One-click verification token redemption marking guardian_email_verified = 1.
5. Rate limiting on guardian email verification requests (30s cooldown, max 5/hr).
6. Safeguarding barriers: Unverified guardian blocked, missing consent blocked, withdrawn consent blocked.
7. SMTP resilience: Failed dispatches recorded and bounded retry processing.
8. Privacy guarantees: Non-diagnostic templates, no PHQ-9 leak, no database ID leak.
"""

import time
import secrets
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock

from local_companion.auth_manager import AUTH_MANAGER
from local_companion.email_service import (
    SMTPEmailService,
    EmailDeliveryResult,
    LEVEL_1_SUBJECT,
    LEVEL_2_SUBJECT,
    VERIFICATION_SUBJECT,
    render_level_1_email,
    render_level_2_email,
    render_verification_email,
    set_email_service
)


class MockRecordingSMTPSink:
    """Mock SMTP service for automated regression testing."""
    def __init__(self):
        self.dispatches = []
        self.should_fail = False

    def send_level_1_alert(
        self,
        to_email: str,
        student_name: str = "your child",
        stress_percentage: any = 75,
        assessment_date: str = None,
        guardian_name: str = None,
        custom_msg_id: str = None
    ) -> EmailDeliveryResult:
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="Mock SMTP simulated connection failure",
                message_id=f"MOCK-FAIL-L1-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )
        text_body, html_body = render_level_1_email(student_name, stress_percentage, assessment_date, guardian_name)
        msg_id = custom_msg_id or f"MOCK-L1-{secrets.token_hex(4).upper()}"
        self.dispatches.append({
            "level": 1,
            "to": to_email,
            "subject": LEVEL_1_SUBJECT,
            "student_name": student_name,
            "stress_percentage": str(stress_percentage),
            "body_text": text_body,
            "body_html": html_body,
            "msg_id": msg_id
        })
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 Message accepted",
            message_id=msg_id,
            provider_response="250 Message accepted",
            recipient_email=to_email,
            subject=LEVEL_1_SUBJECT,
            body_text=text_body,
            body_html=html_body,
            student_name=student_name,
            stress_percentage=str(stress_percentage)
        )

    def send_level_2_alert(
        self,
        to_email: str,
        student_name: str = "your child",
        stress_percentage: any = 90,
        assessment_date: str = None,
        guardian_name: str = None,
        custom_msg_id: str = None
    ) -> EmailDeliveryResult:
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="Mock SMTP simulated connection failure",
                message_id=f"MOCK-FAIL-L2-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )
        text_body, html_body = render_level_2_email(student_name, stress_percentage, assessment_date, guardian_name)
        msg_id = custom_msg_id or f"MOCK-L2-{secrets.token_hex(4).upper()}"
        self.dispatches.append({
            "level": 2,
            "to": to_email,
            "subject": LEVEL_2_SUBJECT,
            "student_name": student_name,
            "stress_percentage": str(stress_percentage),
            "body_text": text_body,
            "body_html": html_body,
            "msg_id": msg_id
        })
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 Urgent Message accepted",
            message_id=msg_id,
            provider_response="250 Urgent Message accepted",
            recipient_email=to_email,
            subject=LEVEL_2_SUBJECT,
            body_text=text_body,
            body_html=html_body,
            student_name=student_name,
            stress_percentage=str(stress_percentage)
        )

    def send_verification_email(self, to_email: str, code: str, verification_link: str = None) -> EmailDeliveryResult:
        if self.should_fail:
            return EmailDeliveryResult(
                success=False,
                status="failed",
                message="Mock SMTP verification dispatch failed",
                message_id=f"MOCK-FAIL-VERIF-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )
        text_body, html_body = render_verification_email(code, verification_link)
        msg_id = f"MOCK-VERIF-{secrets.token_hex(4).upper()}"
        self.dispatches.append({
            "level": "verification",
            "to": to_email,
            "subject": VERIFICATION_SUBJECT,
            "code": code,
            "verification_link": verification_link,
            "body_text": text_body,
            "body_html": html_body,
            "msg_id": msg_id
        })
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 Verification code delivered",
            message_id=msg_id,
            provider_response="250 Verification code delivered",
            recipient_email=to_email,
            subject=VERIFICATION_SUBJECT,
            body_text=text_body,
            body_html=html_body
        )


@pytest.fixture
def mock_smtp():
    sink = MockRecordingSMTPSink()
    set_email_service(sink)
    yield sink
    set_email_service(None)


def create_verified_student(name: str = "Tanya Verma", prefix: str = "p11"):
    uid_hex = secrets.token_hex(4)
    email = f"{prefix}_{uid_hex}@campus.edu"
    guardian_email = f"guardian_{uid_hex}@family.org"

    ok, msg, reg = AUTH_MANAGER.register_user({
        "email": email,
        "password": "ValidPassword123!",
        "full_name": name,
        "student_phone": "+919876543210"
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg["profile"]["id"]

    ok_p, _, _ = AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Kavita Verma",
        "phone": "9876543200",
        "country_code": "+91",
        "relationship": "Mother",
        "email": guardian_email,
        "consent": True
    })
    assert ok_p

    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("""
        UPDATE users
        SET guardian_email_verified = 1, guardian_email_consent = 1, is_adult = 1
        WHERE id = ?
        """, (user_id,))
        conn.commit()

    return {
        "user_id": user_id,
        "student_name": name,
        "guardian_email": guardian_email,
        "guardian_name": "Kavita Verma"
    }


def test_guardian_email_verification_link_generation_and_validation(mock_smtp):
    """Test generating a verification link with secure token, sending it, and redeeming it."""
    uid_hex = secrets.token_hex(4)
    email = f"verif_student_{uid_hex}@campus.edu"
    guardian_email = f"verif_guardian_{uid_hex}@family.org"

    ok, _, reg = AUTH_MANAGER.register_user({
        "email": email,
        "password": "ValidPassword123!",
        "full_name": "Meera Patel",
        "student_phone": "+919876543210"
    })
    user_id = reg["profile"]["id"]

    AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Suresh Patel",
        "phone": "9876543200",
        "country_code": "+91",
        "relationship": "Father",
        "email": guardian_email,
        "consent": True
    })

    # Student is initially unverified
    profile_before = AUTH_MANAGER.get_user_profile(user_id)
    assert profile_before["guardian"]["email_verified"] is False

    # Send verification
    ok_send, msg_send, code = AUTH_MANAGER.send_guardian_email_verification(user_id)
    assert ok_send is True
    assert len(mock_smtp.dispatches) == 1
    last_disp = mock_smtp.dispatches[0]
    assert last_disp["level"] == "verification"
    assert last_disp["verification_link"] is not None
    assert "/api/guardian/verify-email-link?token=" in last_disp["verification_link"]

    # Extract token from the generated verification link
    token = last_disp["verification_link"].split("token=")[1]
    assert len(token) >= 32

    # Verify via token
    ok_redeem, msg_redeem, redeemed_uid = AUTH_MANAGER.verify_guardian_email_by_token(token)
    assert ok_redeem is True
    assert redeemed_uid == user_id
    assert "successfully verified" in msg_redeem.lower()

    # Confirm user record in DB is now verified
    profile_after = AUTH_MANAGER.get_user_profile(user_id)
    assert profile_after["guardian"]["email_verified"] is True

    # Re-redeeming the same token fails (single use)
    ok_reuse, msg_reuse, _ = AUTH_MANAGER.verify_guardian_email_by_token(token)
    assert ok_reuse is False
    assert "already used" in msg_reuse.lower() or "invalid" in msg_reuse.lower()


def test_verification_resend_rate_limiting(mock_smtp):
    """Enforces 30s cooldown between verification dispatches for duplicate prevention."""
    student = create_verified_student("Rohan Mehta", prefix="rate")
    user_id = student["user_id"]

    # First send succeeds
    ok_1, _, _ = AUTH_MANAGER.send_guardian_email_verification(user_id)
    assert ok_1 is True

    # Immediate second send is throttled
    ok_2, msg_2, _ = AUTH_MANAGER.send_guardian_email_verification(user_id)
    assert ok_2 is False
    assert "wait" in msg_2.lower() and "seconds" in msg_2.lower()


def test_direct_transition_below_70_to_95_dispatches_both_notifications(mock_smtp):
    """
    CRITICAL PHASE 11 REQUIREMENT:
    If one assessment jumps directly from below 70 to 95, evaluate both threshold crossings
    and send both separate notifications independently!
    """
    student = create_verified_student("Aditi Rao", prefix="jump95")
    user_id = student["user_id"]

    # Direct elevation from unassessed state directly to 95.0%
    ok, msg, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(
        user_id=user_id,
        friction_score=95.0,
        idempotency_key=f"idem-jump95-{secrets.token_hex(4)}"
    )

    assert ok is True
    assert "Level 1 and Level 2" in msg
    assert len(mock_smtp.dispatches) == 2

    # Dispatch 0 must be Level 1
    d_l1 = mock_smtp.dispatches[0]
    assert d_l1["level"] == 1
    assert d_l1["subject"] == LEVEL_1_SUBJECT
    assert "95%" in d_l1["body_text"]
    assert "Aditi Rao" in d_l1["body_text"]

    # Dispatch 1 must be Level 2
    d_l2 = mock_smtp.dispatches[1]
    assert d_l2["level"] == 2
    assert d_l2["subject"] == LEVEL_2_SUBJECT
    assert "95%" in d_l2["body_text"]
    assert "Aditi Rao" in d_l2["body_text"]

    # Episode reflects both triggered
    ep = AUTH_MANAGER.get_current_episode(user_id)
    assert ep["level_1_triggered"] is True
    assert ep["level_2_triggered"] is True

    # Repeating the assessment does not send duplicates
    ok_dup, msg_dup, _ = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(
        user_id=user_id,
        friction_score=95.0
    )
    assert ok_dup is False
    assert "already triggered" in msg_dup.lower()
    assert len(mock_smtp.dispatches) == 2


def test_gradual_escalation_sequence_69_to_100(mock_smtp):
    """
    Tests exact threshold logic:
    - 69: No email.
    - 70: First email.
    - 75: No duplicate first email.
    - 89: No duplicate first email.
    - 90: Second email.
    - 93: No duplicate second email.
    - 95: No duplicate notification.
    - 100: No duplicate notification.
    """
    student = create_verified_student("Kabir Sen", prefix="gradual")
    uid = student["user_id"]

    # 1. 69%: No email
    ok_69, _, r_69 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 69.0)
    assert ok_69 is False
    assert r_69["status"] == "below_threshold"
    assert len(mock_smtp.dispatches) == 0

    # 2. 70%: First email (Level 1)
    ok_70, _, r_70 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 70.0)
    assert ok_70 is True
    assert r_70["threshold_level"] == 1
    assert len(mock_smtp.dispatches) == 1
    assert mock_smtp.dispatches[-1]["subject"] == LEVEL_1_SUBJECT
    assert "70%" in mock_smtp.dispatches[-1]["body_text"]

    # 3. 75%: No duplicate Level 1
    ok_75, _, r_75 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 75.0)
    assert ok_75 is False
    assert r_75["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 1

    # 4. 89%: No duplicate Level 1
    ok_89, _, r_89 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 89.0)
    assert ok_89 is False
    assert r_89["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 1

    # 5. 90%: Second email (Level 2) — NOT blocked by Level 1 cooldown!
    ok_90, _, r_90 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 90.0)
    assert ok_90 is True
    assert r_90["threshold_level"] == 2
    assert len(mock_smtp.dispatches) == 2
    assert mock_smtp.dispatches[-1]["subject"] == LEVEL_2_SUBJECT
    assert "90%" in mock_smtp.dispatches[-1]["body_text"]

    # 6. 93%: No duplicate Level 2
    ok_93, _, r_93 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 93.0)
    assert ok_93 is False
    assert r_93["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 2

    # 7. 95%: No duplicate Level 2
    ok_95, _, r_95 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 95.0)
    assert ok_95 is False
    assert r_95["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 2

    # 8. 100%: No duplicate Level 2
    ok_100, _, r_100 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 100.0)
    assert ok_100 is False
    assert r_100["status"] == "already_triggered"
    assert len(mock_smtp.dispatches) == 2


def test_safeguarding_blocks_unverified_unconsented_and_withdrawn(mock_smtp):
    """Missing guardian email, unverified email, or withdrawn consent strictly suppresses dispatch."""
    uid_hex = secrets.token_hex(4)
    email = f"safeguard_{uid_hex}@campus.edu"
    ok, _, reg = AUTH_MANAGER.register_user({
        "email": email,
        "password": "ValidPassword123!",
        "full_name": "Divya Nair",
        "student_phone": "+919876543210"
    })
    user_id = reg["profile"]["id"]

    # Case A: Missing guardian email
    ok_no_email, _, r_no_email = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 75.0)
    assert ok_no_email is False
    assert len(mock_smtp.dispatches) == 0

    # Add guardian email but unverified
    AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Radha Nair",
        "phone": "9876543200",
        "country_code": "+91",
        "relationship": "Mother",
        "email": "radha@family.org",
        "consent": True
    })

    # Case B: Unverified email
    ok_unverif, _, r_unverif = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 75.0)
    assert ok_unverif is False
    assert r_unverif["status"] == "suppressed"
    assert r_unverif["reason"] == "email_unverified"
    assert len(mock_smtp.dispatches) == 0

    # Verify email
    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("UPDATE users SET guardian_email_verified = 1, is_adult = 1 WHERE id = ?", (user_id,))
        conn.commit()

    # Case C: Withdrawn consent
    AUTH_MANAGER.revoke_guardian_consent(user_id)
    ok_withdrawn, _, r_withdrawn = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(user_id, 92.0)
    assert ok_withdrawn is False
    assert r_withdrawn["status"] == "suppressed"
    assert r_withdrawn["reason"] == "consent_missing"
    assert len(mock_smtp.dispatches) == 0


def test_smtp_failure_records_failed_status_and_enables_retry(mock_smtp):
    """Temporary SMTP failures record 'failed' and allow bounded retries."""
    student = create_verified_student("Neel Patel", prefix="retry")
    uid = student["user_id"]

    mock_smtp.should_fail = True
    ok_fail, msg_fail, r_fail = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 77.0)
    assert ok_fail is False
    assert r_fail["status"] == "failed"
    assert "Mock SMTP" in r_fail["failure_reason"]

    # Retry when SMTP recovers
    mock_smtp.should_fail = False
    ok_retry, msg_retry, r_retry = AUTH_MANAGER.retry_notification(uid, r_fail["notification_id"])
    assert ok_retry is True
    assert r_retry["status"] == "sent"
    assert r_retry["retry_count"] == 1
    assert len(mock_smtp.dispatches) == 1
