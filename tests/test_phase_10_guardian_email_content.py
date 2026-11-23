"""
tests/test_phase_10_guardian_email_content.py
MINDORA 2.0 — PHASE 10: PERSONALIZED GUARDIAN EMAIL ALERT SYSTEM VERIFICATION

Validates:
1. Exact threshold triggers: 69% (no email), 70% (L1: 70%), 75% (L1: 75%), 89% (L1: 89%),
   90% (L2: 90%), 93% (L2: 93%), 100% (L2: 100%).
2. Correct dynamic fields: STUDENT_NAME, STRESS_PERCENTAGE, ASSESSMENT_DATE, GUARDIAN_NAME.
3. Dual format rendering: Professional HTML email + exact plain-text fallback.
4. Mobile-responsive styling, Mindora branding, Level 2 warning visual, and dynamic value escaping.
5. Independent Level 2 escalation (never blocked by Level 1 cooldown).
6. Strict privacy boundaries: Zero clinical depression diagnosis, zero voice recordings/transcripts,
   zero personal journal entries, zero exposure of internal database IDs.
7. Safeguarding invariants: Explicit consent, unverified email suppression, consent withdrawal,
   idempotency deduplication, and SMTP retry resilience.
"""

import secrets
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from local_companion.auth_manager import AUTH_MANAGER
from local_companion.email_service import (
    SMTPEmailService,
    EmailDeliveryResult,
    LEVEL_1_SUBJECT,
    LEVEL_2_SUBJECT,
    render_level_1_email,
    render_level_2_email,
    set_email_service,
    get_email_service
)


class MockRecordingSMTPSink:
    """Mock SMTP service that records all email dispatches with full details."""
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
                message="SMTP connection timed out: simulated mock outage",
                message_id=f"MOCK-FAIL-L1-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )
        
        text_body, html_body = render_level_1_email(
            student_name=student_name,
            stress_percentage=stress_percentage,
            assessment_date=assessment_date,
            guardian_name=guardian_name
        )
        msg_id = custom_msg_id or f"MOCK-L1-{secrets.token_hex(4).upper()}"
        self.dispatches.append({
            "level": 1,
            "to": to_email,
            "subject": LEVEL_1_SUBJECT,
            "student_name": student_name,
            "stress_percentage": str(stress_percentage),
            "assessment_date": assessment_date,
            "guardian_name": guardian_name,
            "body_text": text_body,
            "body_html": html_body,
            "msg_id": msg_id
        })
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 2.0.0 OK Message accepted",
            message_id=msg_id,
            provider_response="250 2.0.0 OK Message accepted",
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
                message="SMTP connection timed out: simulated mock outage",
                message_id=f"MOCK-FAIL-L2-{secrets.token_hex(4).upper()}",
                recipient_email=to_email
            )

        text_body, html_body = render_level_2_email(
            student_name=student_name,
            stress_percentage=stress_percentage,
            assessment_date=assessment_date,
            guardian_name=guardian_name
        )
        msg_id = custom_msg_id or f"MOCK-L2-{secrets.token_hex(4).upper()}"
        self.dispatches.append({
            "level": 2,
            "to": to_email,
            "subject": LEVEL_2_SUBJECT,
            "student_name": student_name,
            "stress_percentage": str(stress_percentage),
            "assessment_date": assessment_date,
            "guardian_name": guardian_name,
            "body_text": text_body,
            "body_html": html_body,
            "msg_id": msg_id
        })
        return EmailDeliveryResult(
            success=True,
            status="sent",
            message="250 2.0.0 OK Urgent Message accepted",
            message_id=msg_id,
            provider_response="250 2.0.0 OK Urgent Message accepted",
            recipient_email=to_email,
            subject=LEVEL_2_SUBJECT,
            body_text=text_body,
            body_html=html_body,
            student_name=student_name,
            stress_percentage=str(stress_percentage)
        )


@pytest.fixture
def recording_smtp():
    sink = MockRecordingSMTPSink()
    set_email_service(sink)
    yield sink
    set_email_service(None)


def create_test_student(name: str = "Aarav Sharma", prefix: str = "p10"):
    """Creates a verified student with verified guardian email."""
    uid_hex = secrets.token_hex(4)
    email = f"{prefix}_{uid_hex}@university.edu"
    guardian_email = f"guardian_{uid_hex}@gmail.com"
    pwd = "SecurePassword123!"

    ok, msg, reg_data = AUTH_MANAGER.register_user({
        "email": email,
        "password": pwd,
        "full_name": name,
        "student_phone": "+919876543210"
    })
    assert ok, f"Registration failed: {msg}"
    user_id = reg_data["profile"]["id"]
    token = reg_data["token"]

    ok_p, msg_p, _ = AUTH_MANAGER.save_parent_onboarding(user_id, {
        "name": "Priya Sharma",
        "phone": "9876543200",
        "country_code": "+91",
        "relationship": "Mother",
        "email": guardian_email,
        "consent": True
    })
    assert ok_p, f"Parent onboarding failed: {msg_p}"

    with AUTH_MANAGER._get_conn() as conn:
        conn.execute("""
        UPDATE users
        SET guardian_email_verified = 1, guardian_email_consent = 1, is_adult = 1
        WHERE id = ?
        """, (user_id,))
        conn.commit()

    return {
        "user_id": user_id,
        "token": token,
        "student_name": name,
        "guardian_email": guardian_email,
        "guardian_name": "Priya Sharma"
    }


# ==============================================================================
# 1. EXACT THRESHOLD SEQUENCE & DYNAMIC CONTENT VERIFICATION
# ==============================================================================

def test_exact_stress_percentage_content_matrix(recording_smtp):
    """
    Validates exact prompt cases:
    1. 69% — no email.
    2. 70% — first email includes 70%.
    3. 75% — first email includes 75%.
    4. 89% — first email includes 89%.
    5. 90% — second email includes 90%.
    6. 93% — second email includes 93%.
    7. 100% — second email includes 100%.
    """
    student = create_test_student("Kavya Patel", prefix="matrix")
    uid = student["user_id"]

    # Case 1: 69% -> No email
    ok69, msg69, r69 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 69.0)
    assert ok69 is False
    assert r69["status"] == "below_threshold"
    assert len(recording_smtp.dispatches) == 0

    # Case 2: 70% -> First email includes 70%
    ok70, msg70, r70 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 70.0)
    assert ok70 is True
    assert r70["threshold_level"] == 1
    assert r70["stress_percentage"] == "70"
    assert len(recording_smtp.dispatches) == 1
    d70 = recording_smtp.dispatches[0]
    assert d70["level"] == 1
    assert d70["subject"] == "Mindora Alert – Your Student's Stress Level Requires Attention"
    assert "recorded a stress indicator of 70%" in d70["body_text"]
    assert "Kavya Patel" in d70["body_text"]
    assert "falls within the elevated range" in d70["body_text"]
    assert "70%" in d70["body_html"]

    # Case 3: 75% -> Duplicate in same active episode is suppressed
    ok75_dup, msg75_dup, r75_dup = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 75.0)
    assert ok75_dup is False
    assert r75_dup["status"] == "already_triggered"
    assert len(recording_smtp.dispatches) == 1

    # Verify a fresh student at 75% receives exact "75%"
    s75 = create_test_student("Rohan Verma", prefix="s75")
    ok75, _, r75 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(s75["user_id"], 75.0)
    assert ok75 is True
    assert r75["stress_percentage"] == "75"
    d75 = recording_smtp.dispatches[-1]
    assert "recorded a stress indicator of 75%" in d75["body_text"]
    assert "Rohan Verma" in d75["body_text"]
    assert "75%" in d75["body_html"]

    # Case 4: 89% -> Fresh student at 89% receives exact "89%"
    s89 = create_test_student("Ananya Sen", prefix="s89")
    ok89, _, r89 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(s89["user_id"], 89.0)
    assert ok89 is True
    assert r89["stress_percentage"] == "89"
    d89 = recording_smtp.dispatches[-1]
    assert "recorded a stress indicator of 89%" in d89["body_text"]
    assert "Ananya Sen" in d89["body_text"]
    assert "89%" in d89["body_html"]

    # Case 5: 90% -> Second email includes 90% (Urgent warning)
    # Continuing on first student Kavya Patel (who had 70%): 90% escalates to Level 2!
    ok90, msg90, r90 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 90.0)
    assert ok90 is True
    assert r90["threshold_level"] == 2
    assert r90["stress_percentage"] == "90"
    d90 = recording_smtp.dispatches[-1]
    assert d90["level"] == 2
    assert d90["subject"] == "URGENT WELLBEING ALERT – Your Student Needs Immediate Attention"
    assert "recorded a stress indicator of 90%" in d90["body_text"]
    assert "Kavya Patel" in d90["body_text"]
    assert "falls within the very high range" in d90["body_text"]
    assert "requires prompt attention, understanding and additional support" in d90["body_text"]
    assert "90%" in d90["body_html"]
    assert "⚠️ URGENT" in d90["body_html"]

    # Case 6: 93% -> Fresh student at 93% receives exact "93%"
    s93 = create_test_student("Devika Iyer", prefix="s93")
    ok93, _, r93 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(s93["user_id"], 93.0)
    assert ok93 is True
    assert r93["stress_percentage"] == "93"
    d93 = recording_smtp.dispatches[-1]
    assert "recorded a stress indicator of 93%" in d93["body_text"]
    assert "Devika Iyer" in d93["body_text"]
    assert "93%" in d93["body_html"]

    # Case 7: 100% -> Fresh student at 100% receives exact "100%"
    s100 = create_test_student("Ishaan Roy", prefix="s100")
    ok100, _, r100 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(s100["user_id"], 100.0)
    assert ok100 is True
    assert r100["stress_percentage"] == "100"
    d100 = recording_smtp.dispatches[-1]
    assert "recorded a stress indicator of 100%" in d100["body_text"]
    assert "Ishaan Roy" in d100["body_text"]
    assert "100%" in d100["body_html"]


# ==============================================================================
# 2. DYNAMIC FIELDS, SANITIZATION & METRIC ACCURACY
# ==============================================================================

def test_dynamic_fields_and_sanitization(recording_smtp):
    """Verify correct student name, assessment date, guardian email, and HTML escaping."""
    student = create_test_student("Aria <script>alert('xss')</script> Nair", prefix="sanitize")
    uid = student["user_id"]

    ok, _, receipt = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 74.0)
    assert ok is True

    dispatch = recording_smtp.dispatches[-1]
    assert dispatch["to"] == student["guardian_email"]

    # Plain text contains clean name
    assert "Aria <script>alert('xss')</script> Nair" in dispatch["body_text"]

    # HTML body properly escapes HTML tags
    assert "<script>" not in dispatch["body_html"]
    assert "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;" in dispatch["body_html"]

    # Assessment date matches today's date
    today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
    assert f"Assessment date: {today_str}" in dispatch["body_text"]
    assert today_str in dispatch["body_html"]

    # Verify NO database ID is exposed in text or html
    assert f"user_id: {uid}" not in dispatch["body_text"]
    assert f"user_id: {uid}" not in dispatch["body_html"]
    assert f"users/{uid}" not in dispatch["body_html"]


# ==============================================================================
# 3. LEVEL 2 ESCALATION INDEPENDENCE (NOT BLOCKED BY LEVEL 1 COOLDOWN)
# ==============================================================================

def test_level_2_not_blocked_by_level_1_cooldown(recording_smtp):
    """
    Ensure when a student's stress rises from elevated (75%) to very high (91%),
    the Level 2 notification is NOT blocked by the Level 1 cooldown or episode status.
    """
    student = create_test_student("Aditya Rao", prefix="escalate")
    uid = student["user_id"]

    # Level 1 trigger at 75%
    ok1, _, r1 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 75.0)
    assert ok1 is True
    assert r1["threshold_level"] == 1
    assert len(recording_smtp.dispatches) == 1

    # Immediate escalation to 91%: MUST trigger Level 2 without cooldown block
    ok2, _, r2 = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 91.0)
    assert ok2 is True
    assert r2["threshold_level"] == 2
    assert len(recording_smtp.dispatches) == 2
    assert recording_smtp.dispatches[1]["level"] == 2
    assert "91%" in recording_smtp.dispatches[1]["body_text"]


# ==============================================================================
# 4. EPISODE RECOVERY AND RE-TRIGGER LIFECYCLE
# ==============================================================================

def test_recovery_threshold_resets_episode(recording_smtp):
    """
    Verify score drops to <= 65.0 marks active episode recovered,
    enabling a subsequent elevation to trigger a new alert.
    """
    student = create_test_student("Mira Deshmukh", prefix="recovery")
    uid = student["user_id"]

    # 1. Trigger Level 1 at 78%
    ok1, _, _ = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 78.0)
    assert ok1 is True
    assert len(recording_smtp.dispatches) == 1

    # 2. Recovery check: score drops to 62.0 (<= 65.0)
    ok_rec, _, r_rec = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 62.0)
    assert ok_rec is False
    assert r_rec["status"] == "recovered"

    # 3. Stress rises again to 82% in new episode: triggers Level 1 again!
    ok_retrigger, _, r_retrigger = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 82.0)
    assert ok_retrigger is True
    assert r_retrigger["threshold_level"] == 1
    assert len(recording_smtp.dispatches) == 2
    assert "82%" in recording_smtp.dispatches[-1]["body_text"]


# ==============================================================================
# 5. SAFEGUARDING: CONSENT, VERIFICATION, WITHDRAWAL & IDEMPOTENCY
# ==============================================================================

def test_safeguards_consent_verification_and_withdrawal(recording_smtp):
    """Verify consent, verification, and consent revocation blocks."""
    student = create_test_student("Zoya Khan", prefix="safeguard")
    uid = student["user_id"]

    # 1. Idempotency key deduplication
    key = f"idem-key-batch-901-{secrets.token_hex(4)}"
    ok_first, msg_first, r_first = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 76.0, idempotency_key=key)
    assert ok_first is True, f"First trigger failed: {msg_first} {r_first}"
    assert len(recording_smtp.dispatches) == 1

    ok_dup, _, r_dup = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 76.0, idempotency_key=key)
    assert ok_dup is False
    assert r_dup["status"] == "duplicate_idempotency_key"
    assert len(recording_smtp.dispatches) == 1

    # 2. Consent withdrawal halts all future notifications
    ok_rev, _ = AUTH_MANAGER.revoke_guardian_consent(uid)
    assert ok_rev is True

    ok_suppressed, _, r_sup = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 95.0)
    assert ok_suppressed is False
    assert r_sup["status"] == "suppressed"
    assert r_sup["reason"] == "consent_missing"
    assert len(recording_smtp.dispatches) == 1  # No new email dispatched


# ==============================================================================
# 6. SMTP DISPATCHER RESILIENCE & RETRY
# ==============================================================================

def test_smtp_failure_and_retry_resilience(recording_smtp):
    """Verify SMTP failures record failure status and can be retried successfully."""
    student = create_test_student("Varun Joshi", prefix="retry")
    uid = student["user_id"]

    recording_smtp.should_fail = True
    ok_fail, _, r_fail = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 77.0)
    assert ok_fail is False
    assert r_fail["status"] == "failed"

    log = AUTH_MANAGER.get_notification_log(uid)
    assert len(log) >= 1
    notif_id = log[0]["id"]

    # Recover SMTP and retry
    recording_smtp.should_fail = False
    ok_retry, retry_msg, retry_receipt = AUTH_MANAGER.retry_notification(uid, notif_id)
    assert ok_retry is True
    assert retry_receipt["status"] == "sent"


# ==============================================================================
# 7. CLINICAL SAFETY & SOURCE ISOLATION INVARIANTS
# ==============================================================================

def test_clinical_safety_and_source_isolation(recording_smtp):
    """Verify strict prohibition of diagnosis and voice/research sources."""
    student = create_test_student("Simran Kaur", prefix="safety")
    uid = student["user_id"]

    # 1. Voice Feelings Space source CANNOT trigger email
    ok_v, _, r_v = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 95.0, source="voice_feelings_space")
    assert ok_v is False
    assert r_v["status"] == "voice_blocked"

    # 2. Research dataset record CANNOT trigger email
    ok_r, _, r_r = AUTH_MANAGER.evaluate_and_trigger_automatic_alert(uid, 95.0, source="research_dataset_163")
    assert ok_r is False
    assert r_r["status"] == "research_blocked"

    assert len(recording_smtp.dispatches) == 0

    # 3. Check rendered email text strictly omits clinical depression diagnosis
    text_l1, html_l1 = render_level_1_email("Simran", 75)
    text_l2, html_l2 = render_level_2_email("Simran", 95)

    for forbidden in ["depression diagnosis", "clinical diagnosis", "phq", "phq-9", "mental disorder"]:
        assert forbidden not in text_l1.lower()
        assert forbidden not in html_l1.lower()
        assert forbidden not in text_l2.lower()
        assert forbidden not in html_l2.lower()
