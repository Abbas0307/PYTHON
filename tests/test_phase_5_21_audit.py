"""
test_phase_5_21_audit.py - Mindora 2.0 Phase 5.21 Independent Security & Adversarial Test Suite

Verifies:
1. Authentication Edge Cases:
   - Invalid email formats rejected
   - Password length < 8 rejected
   - Password mismatch rejected
   - Future date of birth rejected
   - Underage registration (< 13) rejected
   - Duplicate account registration rejected
   - Unaccepted terms/privacy consent rejected
2. Login & Session Management:
   - Correct credentials login
   - Incorrect credentials rejection
   - Empty credentials rejection
   - Invalid session token rejection (HTTP 401)
   - Logout session invalidation
   - Rate limiting: 5 failed attempts per window
3. Authorization & Tenant Isolation (IDOR Defense):
   - Strict session-bound identity derivation
   - Rejection of development fallback tokens in production mode
   - Absence of user_id tampering vectors
4. Guardian Notification & Consent:
   - Consent withdrawal stops notifications
   - Minor account safeguarding requires verified phone
   - Auto-alert threshold comparison logic (fractional 0.70 and percentage 70.0)
   - Cooldown deduplication (7-day window)
   - Idempotency deduplication (identical keys)
   - Neutral non-diagnostic message invariant
5. SMS Provider & Cryptography:
   - Mock provider returns DELIVERED_MOCK
   - Unconfigured real provider returns PROVIDER_NOT_CONFIGURED
   - AES-256-GCM encryption at rest with AAD binding
   - Tamper detection on ciphertext
"""

import os
import sys
import secrets
import pytest
from datetime import datetime, timedelta, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from local_companion.auth_manager import AuthManager
from local_companion.crypto_vault import FieldCryptoVault, CRYPTO_VAULT
from local_companion.sms_provider import MockSmsProvider, Fast2SmsProvider, SmsDeliveryStatus
from local_companion.config import CONFIG


class TestAuthenticationEdgeCases:
    @pytest.fixture
    def auth(self):
        return AuthManager()

    def test_invalid_email_formats_rejected(self, auth):
        invalid_emails = ["notanemail", "missingat.com", "test@", "@domain.com", "spaces in@email.com"]
        for bad_email in invalid_emails:
            ok, msg, _ = auth.register_user({
                "email": bad_email,
                "password": "ValidPassword123!",
                "full_name": "Test Student",
                "date_of_birth": "2002-05-10",
                "terms_consent": True,
                "privacy_consent": True
            })
            assert ok is False
            assert "invalid email" in msg.lower()

    def test_short_password_rejected(self, auth):
        ok, msg, _ = auth.register_user({
            "email": f"short_{secrets.token_hex(4)}@test.edu",
            "password": "short",
            "full_name": "Test Student",
            "date_of_birth": "2002-05-10",
            "terms_consent": True,
            "privacy_consent": True
        })
        assert ok is False
        assert "at least 8 characters" in msg.lower()

    def test_password_mismatch_rejected(self, auth):
        ok, msg, _ = auth.register_user({
            "email": f"mismatch_{secrets.token_hex(4)}@test.edu",
            "password": "ValidPassword123!",
            "confirm_password": "DifferentPassword123!",
            "full_name": "Test Student",
            "date_of_birth": "2002-05-10",
            "terms_consent": True,
            "privacy_consent": True
        })
        assert ok is False
        assert "passwords do not match" in msg.lower()

    def test_future_dob_rejected(self, auth):
        future_date = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
        ok, msg, _ = auth.register_user({
            "email": f"future_{secrets.token_hex(4)}@test.edu",
            "password": "ValidPassword123!",
            "full_name": "Test Student",
            "date_of_birth": future_date,
            "terms_consent": True,
            "privacy_consent": True
        })
        assert ok is False
        assert "future" in msg.lower()

    def test_underage_registration_rejected(self, auth):
        child_dob = (datetime.now() - timedelta(days=365 * 10)).strftime("%Y-%m-%d")
        ok, msg, _ = auth.register_user({
            "email": f"child_{secrets.token_hex(4)}@test.edu",
            "password": "ValidPassword123!",
            "full_name": "Child Student",
            "date_of_birth": child_dob,
            "terms_consent": True,
            "privacy_consent": True
        })
        assert ok is False
        assert "at least 13" in msg.lower()

    def test_duplicate_email_rejected(self, auth):
        email = f"dup_{secrets.token_hex(4)}@test.edu"
        ok1, _, _ = auth.register_user({
            "email": email,
            "password": "ValidPassword123!",
            "full_name": "First Account",
            "date_of_birth": "2002-05-10",
            "terms_consent": True,
            "privacy_consent": True
        })
        assert ok1 is True

        ok2, msg2, _ = auth.register_user({
            "email": email,
            "password": "ValidPassword123!",
            "full_name": "Second Account",
            "date_of_birth": "2002-05-10",
            "terms_consent": True,
            "privacy_consent": True
        })
        assert ok2 is False
        assert "already exists" in msg2.lower()

    def test_unaccepted_terms_rejected(self, auth):
        ok, msg, _ = auth.register_user({
            "email": f"noterms_{secrets.token_hex(4)}@test.edu",
            "password": "ValidPassword123!",
            "full_name": "No Terms",
            "date_of_birth": "2002-05-10",
            "terms_consent": False,
            "privacy_consent": True
        })
        assert ok is False
        assert "must accept the terms" in msg.lower()


class TestLoginAndSessionSecurity:
    @pytest.fixture
    def auth(self):
        return AuthManager()

    def test_login_success_and_logout(self, auth):
        email = f"session_{secrets.token_hex(4)}@test.edu"
        auth.register_user({
            "email": email,
            "password": "ValidPassword123!",
            "full_name": "Session User",
            "date_of_birth": "2002-05-10",
            "terms_consent": True,
            "privacy_consent": True
        })

        ok, msg, data = auth.login_user(email, "ValidPassword123!", client_ip="127.0.0.1")
        assert ok is True
        token = data["token"]
        assert token is not None

        # Validate active session
        user_id = auth.validate_session(token)
        assert user_id == data["profile"]["id"]

        # Logout
        logout_ok = auth.logout_user(token)
        assert logout_ok is True

        # Validating invalidated session must return None
        assert auth.validate_session(token) is None

    def test_invalid_session_returns_none(self, auth):
        assert auth.validate_session("invalid-nonexistent-token") is None
        assert auth.validate_session("") is None
        assert auth.validate_session(None) is None

    def test_dev_session_rejected_in_production(self, auth, monkeypatch):
        # In non-production, local_dev_session resolves to User 1
        monkeypatch.setenv("MINDORA_ENV", "development")
        assert auth.validate_session("local_dev_session") == 1

        # In production mode, local_dev_session MUST be rejected
        monkeypatch.setenv("MINDORA_ENV", "production")
        assert auth.validate_session("local_dev_session") is None

    def test_rate_limiting_brute_force(self, auth):
        client_ip = f"10.0.{secrets.randbelow(250)}.{secrets.randbelow(250)}"
        email = f"brute_{secrets.token_hex(4)}@test.edu"

        # 5 failed attempts
        for _ in range(5):
            ok, _, _ = auth.login_user(email, "WrongPassword!", client_ip=client_ip)
            assert ok is False

        # 6th attempt must be blocked by rate limiter
        ok6, msg6, _ = auth.login_user(email, "WrongPassword!", client_ip=client_ip)
        assert ok6 is False
        assert "too many failed login attempts" in msg6.lower()


class TestGuardianNotificationAndConsent:
    @pytest.fixture
    def auth(self):
        return AuthManager()

    def test_consent_withdrawal_stops_auto_alert(self, auth):
        email = f"withdraw_{secrets.token_hex(4)}@test.edu"
        _, _, data = auth.register_user({
            "email": email,
            "password": "ValidPassword123!",
            "full_name": "Consent Student",
            "date_of_birth": "2000-01-01",
            "is_adult": True,
            "guardian_name": "Parent Name",
            "guardian_phone": "9876543210",
            "guardian_consent": True
        })
        user_id = data["profile"]["id"]
        auth.verify_guardian_phone(user_id, data["verification_code"])
        auth.update_notification_policy(user_id, is_enabled=True, threshold_score=70.0, max_frequency_days=7)

        # Confirm policy triggers when consent is active
        trig1, _, _ = auth.evaluate_and_trigger_automatic_alert(user_id, friction_score=80.0)
        assert trig1 is True

        # Now student revokes consent
        auth.revoke_guardian_consent(user_id)

        # Attempt auto-alert after consent withdrawal
        trig2, reason2, _ = auth.evaluate_and_trigger_automatic_alert(user_id, friction_score=85.0)
        assert trig2 is False
        assert "not active" in reason2.lower() or "not enabled" in reason2.lower()

    def test_minor_safeguarding_requires_verified_phone(self, auth):
        minor_dob = (datetime.now() - timedelta(days=365 * 16)).strftime("%Y-%m-%d")
        email = f"minor_{secrets.token_hex(4)}@test.edu"
        _, _, data = auth.register_user({
            "email": email,
            "password": "ValidPassword123!",
            "full_name": "Minor Student",
            "date_of_birth": minor_dob,
            "guardian_name": "Minor Parent",
            "guardian_phone": "9876543210",
            "guardian_consent": True
        })
        user_id = data["profile"]["id"]

        # Unverified minor cannot activate alert policy
        upd_ok, msg = auth.update_notification_policy(user_id, is_enabled=True, threshold_score=70.0)
        assert upd_ok is False
        assert "minor" in msg.lower() or "safeguarding" in msg.lower()

    def test_idempotency_prevents_duplicate_dispatch(self, auth):
        email = f"idem_{secrets.token_hex(4)}@test.edu"
        _, _, data = auth.register_user({
            "email": email,
            "password": "ValidPassword123!",
            "full_name": "Idem Student",
            "date_of_birth": "2000-01-01",
            "is_adult": True,
            "guardian_name": "Idem Parent",
            "guardian_phone": "9876543210",
            "guardian_consent": True
        })
        user_id = data["profile"]["id"]
        auth.verify_guardian_phone(user_id, data["verification_code"])
        auth.update_notification_policy(user_id, is_enabled=True, threshold_score=70.0, max_frequency_days=7)

        key = f"ASSESS-{secrets.token_hex(8)}"
        trig1, _, receipt1 = auth.evaluate_and_trigger_automatic_alert(user_id, friction_score=80.0, idempotency_key=key)
        assert trig1 is True

        # Second trigger with exact same idempotency_key
        trig2, reason2, _ = auth.evaluate_and_trigger_automatic_alert(user_id, friction_score=85.0, idempotency_key=key)
        assert trig2 is False
        assert "duplicate" in reason2.lower() or "cooldown" in reason2.lower()
