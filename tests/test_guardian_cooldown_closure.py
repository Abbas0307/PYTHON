"""
Phase 5.22 Final Closure: Guardian Cooldown Lifecycle & Consent Verification Test Suite.
Verifies the approved 7-day cooldown policy across:
1. First alert execution.
2. Duplicate alert idempotency suppression.
3. Cooldown suppression within the 7-day window.
4. Successful alert dispatch after the 7-day cooldown expires.
5. Immediate alert blocking upon consent withdrawal.
6. Successful alert resumption after re-enabling consent.
Uses MockSMSProvider only; transmits zero cellular data.
"""

import os
import pytest
import secrets
import tempfile
from datetime import datetime, timedelta, timezone

from local_companion.auth_manager import AuthManager
from local_companion.sms_provider import SmsDeliveryStatus, MockSmsProvider, get_sms_provider


@pytest.fixture
def auth_mgr():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    mgr = AuthManager(db_path=path)
    yield mgr
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception:
        pass


class TestGuardianCooldownLifecycle:
    """Verifies complete 7-day cooldown and consent lifecycle."""

    def test_complete_guardian_cooldown_and_consent_cycle(self, auth_mgr):
        # Ensure mock provider is active
        provider = get_sms_provider()
        assert isinstance(provider, MockSmsProvider), "Must use MockSmsProvider during testing."

        # Setup student account
        email = f"cooldown_student_{secrets.token_hex(4)}@mindora.edu"
        _, _, data = auth_mgr.register_user({
            "email": email,
            "password": "StrongPassword123!",
            "full_name": "Cooldown Test Student",
            "date_of_birth": "2002-05-15",
            "is_adult": True,
            "guardian_name": "Jordan Rivera",
            "guardian_relationship": "Parent",
            "guardian_country_code": "+1",
            "guardian_phone": "5551234567",
            "guardian_consent": True
        })
        user_id = data["profile"]["id"]
        v_code = data["verification_code"]
        ver_ok, ver_msg = auth_mgr.verify_guardian_phone(user_id, v_code)
        assert ver_ok is True, f"Failed verification: {ver_msg}"

        # Configure notification policy with approved 7-day cooldown and threshold 75.0
        upd_ok, upd_msg = auth_mgr.update_notification_policy(
            user_id=user_id,
            is_enabled=True,
            threshold_score=75.0,
            max_frequency_days=7
        )
        assert upd_ok is True

        policy = auth_mgr.get_notification_policy(user_id)
        assert policy["max_frequency_days"] == 7, "Policy must default to 7 days."
        assert policy["stress_threshold_score"] == 75.0

        # -------------------------------------------------------------
        # STEP 1: First Alert (should succeed)
        # -------------------------------------------------------------
        key_1 = f"alert-key-{secrets.token_hex(6)}"
        trig1, reason1, receipt1 = auth_mgr.evaluate_and_trigger_automatic_alert(
            user_id=user_id,
            friction_score=82.0,
            idempotency_key=key_1
        )
        assert trig1 is True, f"Step 1 failed: {reason1}"
        assert receipt1 is not None
        assert receipt1["status"] == SmsDeliveryStatus.DELIVERED_MOCK.value
        assert "Automatic alert processed" in reason1

        # Verify DB records updated
        pol_after1 = auth_mgr.get_notification_policy(user_id)
        assert pol_after1["last_triggered_at"] is not None

        # -------------------------------------------------------------
        # STEP 2: Duplicate Alert (same idempotency key should be blocked)
        # -------------------------------------------------------------
        trig2, reason2, receipt2 = auth_mgr.evaluate_and_trigger_automatic_alert(
            user_id=user_id,
            friction_score=85.0,
            idempotency_key=key_1  # Re-use identical idempotency key
        )
        assert trig2 is False
        assert receipt2 is None
        assert "duplicate" in reason2.lower()

        # -------------------------------------------------------------
        # STEP 3: Alert inside 7-day cooldown (new key, score >= threshold)
        # -------------------------------------------------------------
        key_3 = f"alert-key-{secrets.token_hex(6)}"
        trig3, reason3, receipt3 = auth_mgr.evaluate_and_trigger_automatic_alert(
            user_id=user_id,
            friction_score=88.0,
            idempotency_key=key_3
        )
        assert trig3 is False
        assert receipt3 is None
        assert "cooldown" in reason3.lower()
        assert "7 days" in reason3

        # -------------------------------------------------------------
        # STEP 4: Alert after cooldown (> 7 days elapsed)
        # -------------------------------------------------------------
        # Simulate elapsed time by backdating last_triggered_at by 8 days
        eight_days_ago = (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
        with auth_mgr._get_conn() as conn:
            conn.execute(
                "UPDATE notification_policies SET last_triggered_at = ? WHERE user_id = ?",
                (eight_days_ago, user_id)
            )
            conn.commit()

        key_4 = f"alert-key-{secrets.token_hex(6)}"
        trig4, reason4, receipt4 = auth_mgr.evaluate_and_trigger_automatic_alert(
            user_id=user_id,
            friction_score=80.0,
            idempotency_key=key_4
        )
        assert trig4 is True, f"Step 4 failed: {reason4}"
        assert receipt4 is not None
        assert receipt4["status"] == SmsDeliveryStatus.DELIVERED_MOCK.value

        # -------------------------------------------------------------
        # STEP 5: Consent Withdrawal (revoking consent immediately blocks alerts)
        # -------------------------------------------------------------
        rev_ok, rev_msg = auth_mgr.revoke_guardian_consent(user_id)
        assert rev_ok is True
        profile_rev = auth_mgr.get_user_profile(user_id)
        assert profile_rev["guardian"]["consent"] is False

        # Attempt alert after consent revoked
        key_5 = f"alert-key-{secrets.token_hex(6)}"
        trig5, reason5, receipt5 = auth_mgr.evaluate_and_trigger_automatic_alert(
            user_id=user_id,
            friction_score=92.0,
            idempotency_key=key_5
        )
        assert trig5 is False
        assert receipt5 is None
        assert "not active" in reason5.lower() or "not enabled" in reason5.lower()

        # -------------------------------------------------------------
        # STEP 6: Re-enabling Consent & Verification
        # -------------------------------------------------------------
        # Student re-enters consent and phone
        upd_g_ok, upd_g_msg, g_data = auth_mgr.update_guardian(
            user_id=user_id,
            data={
                "name": "Jordan Rivera",
                "relationship": "Parent",
                "country_code": "+1",
                "phone": "5551234567",
                "consent": True
            }
        )
        assert upd_g_ok is True
        new_v_code = g_data["verification_code"]
        ver2_ok, _ = auth_mgr.verify_guardian_phone(user_id, new_v_code)
        assert ver2_ok is True

        # Re-enable notification policy (also backdate last_triggered_at past 7 days)
        ten_days_ago = (datetime.now(timezone.utc) - timedelta(days=10)).isoformat()
        with auth_mgr._get_conn() as conn:
            conn.execute(
                "UPDATE notification_policies SET is_enabled = 1, last_triggered_at = ? WHERE user_id = ?",
                (ten_days_ago, user_id)
            )
            conn.commit()

        key_6 = f"alert-key-{secrets.token_hex(6)}"
        trig6, reason6, receipt6 = auth_mgr.evaluate_and_trigger_automatic_alert(
            user_id=user_id,
            friction_score=85.0,
            idempotency_key=key_6
        )
        assert trig6 is True, f"Step 6 failed: {reason6}"
        assert receipt6 is not None
        assert receipt6["status"] == SmsDeliveryStatus.DELIVERED_MOCK.value
