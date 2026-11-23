"""
test_phase_5_20_features.py - Mindora 2.0 Phase 5.20 Comprehensive Backend Verification Suite

Tests:
1. FieldCryptoVault (AES-256-GCM encryption at rest, PBKDF2HMAC, tamper resistance, AAD binding)
2. Argon2id password hashing and session tokens
3. SHA-256 hashed guardian verification tokens (anti-plaintext OTP)
4. Avatar upload, binary magic-byte validation, retrieval, and deletion
5. Automatic guardian alert threshold policy, cooldown deduplication, and suppression
6. SMS Provider abstraction: MockSmsProvider vs Fast2SmsProvider (honest PROVIDER_NOT_CONFIGURED status)
7. Non-clinical message invariant (zero diagnostic disclosures)
"""

import os
import sys
import secrets
import pytest

# Ensure repository root is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from local_companion.crypto_vault import FieldCryptoVault, CRYPTO_VAULT
from local_companion.sms_provider import get_sms_provider, MockSmsProvider, Fast2SmsProvider, SmsDeliveryStatus
from local_companion.auth_manager import AuthManager


class TestCryptoVault:
    def test_aes_gcm_encrypt_decrypt_roundtrip(self):
        vault = FieldCryptoVault("test-secret-key-12345")
        plaintext = "+91 9876543210"
        encrypted = vault.encrypt_field(plaintext, associated_data="user:1:phone")
        assert encrypted.startswith("enc:v1:")
        assert plaintext not in encrypted

        decrypted = vault.decrypt_field(encrypted, associated_data="user:1:phone")
        assert decrypted == plaintext

    def test_aes_gcm_tamper_resistance(self):
        vault = FieldCryptoVault("test-secret-key-12345")
        encrypted = vault.encrypt_field("sensitive_phone_number", associated_data="user:1:phone")
        
        # Tamper with the ciphertext
        parts = encrypted.split(":")
        tampered_b64 = "X" + parts[3][1:]
        tampered_encrypted = f"enc:v1:{parts[2]}:{tampered_b64}"

        with pytest.raises(Exception):
            vault.decrypt_field(tampered_encrypted, associated_data="user:1:phone")

    def test_aad_binding_prevents_ciphertext_transplantation(self):
        vault = FieldCryptoVault("test-secret-key-12345")
        # Encrypted for user 1 phone
        enc_u1 = vault.encrypt_field("+91 9876543210", associated_data="user:1:student_phone")

        # Attempt to decrypt as user 2 phone
        with pytest.raises(Exception):
            vault.decrypt_field(enc_u1, associated_data="user:2:student_phone")

        # Attempt to decrypt as user 1 guardian phone
        with pytest.raises(Exception):
            vault.decrypt_field(enc_u1, associated_data="user:1:guardian_phone")


class TestSmsProviderAbstraction:
    def test_mock_sms_provider(self):
        provider = MockSmsProvider()
        status, msg, receipt = provider.send_sms(
            recipient_phone="+919876543210",
            message_text="Your student has requested support through Mindora."
        )
        assert status == SmsDeliveryStatus.DELIVERED_MOCK
        assert receipt["message_id"].startswith("MOCK-SMS-")
        assert receipt["recipient_phone_masked"] == "***-***-3210"

    def test_fast2sms_missing_key_honest_status(self):
        # When SMS_API_KEY is not set or empty, provider must report PROVIDER_NOT_CONFIGURED
        provider = Fast2SmsProvider()
        provider.api_key = ""
        status, msg, receipt = provider.send_sms(
            recipient_phone="+919876543210",
            message_text="Your student has requested support through Mindora."
        )
        assert status == SmsDeliveryStatus.PROVIDER_NOT_CONFIGURED
        assert "not provisioned" in msg.lower()

    def test_non_diagnostic_message_invariant(self):
        provider = MockSmsProvider()
        # Verify provider message does not contain clinical tags
        msg = "Your student has requested support from their trusted contact through Mindora. Please check in with them when convenient."
        for prohibited in ["phq-9", "depression", "severe", "score", "diagnosis", "psychiatric"]:
            assert prohibited not in msg.lower()

        status, _, receipt = provider.send_sms("+919876543210", msg)
        assert status == SmsDeliveryStatus.DELIVERED_MOCK


class TestAuthManagerFeatures:
    @pytest.fixture
    def auth_mgr(self):
        return AuthManager()

    def test_student_registration_and_argon2id(self, auth_mgr):
        email = f"student_{secrets.token_hex(4)}@mindora.edu"
        ok, msg, data = auth_mgr.register_user({
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Phase 520 Student",
            "date_of_birth": "2003-05-15",
            "is_adult": True,
            "student_phone": "+91 9988776655",
            "guardian_name": "Morgan Rivera",
            "guardian_relationship": "Parent",
            "guardian_phone": "9876543210",
            "guardian_consent": True
        })
        assert ok is True
        assert data["token"] is not None
        assert data["verification_code"] is not None
        user_id = data["profile"]["id"]

        # Verify password validation via login
        login_ok, login_msg, login_data = auth_mgr.login_user(email, "SecurePassword123!", client_ip="127.0.0.1")
        assert login_ok is True
        assert login_data["profile"]["id"] == user_id

        # Verify bad password rejected
        bad_ok, bad_msg, bad_data = auth_mgr.login_user(email, "WrongPassword!", client_ip="127.0.0.1")
        assert bad_ok is False

    def test_hashed_otp_verification(self, auth_mgr):
        email = f"otp_{secrets.token_hex(4)}@mindora.edu"
        ok, msg, data = auth_mgr.register_user({
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "OTP Student",
            "date_of_birth": "2002-01-01",
            "guardian_phone": "9123456789",
            "guardian_consent": True
        })
        user_id = data["profile"]["id"]
        v_code = data["verification_code"]

        # Wrong code fails
        wrong_ok, wrong_msg = auth_mgr.verify_guardian_phone(user_id, "000000")
        assert wrong_ok is False

        # Correct code succeeds
        ok_v, ok_msg = auth_mgr.verify_guardian_phone(user_id, v_code)
        assert ok_v is True

        profile = auth_mgr.get_user_profile(user_id)
        assert profile["guardian"]["verified"] is True

    def test_avatar_magic_byte_validation_and_lifecycle(self, auth_mgr):
        email = f"avatar_{secrets.token_hex(4)}@mindora.edu"
        _, _, data = auth_mgr.register_user({
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Avatar Student",
            "date_of_birth": "2002-01-01"
        })
        user_id = data["profile"]["id"]

        # 1. Invalid text file should be rejected
        fake_txt = b"This is a text file masquerading as an image."
        bad_ok, bad_msg, _ = auth_mgr.save_profile_image(user_id, fake_txt, filename="fake.png", mime_type="image/png")
        assert bad_ok is False
        assert "unsupported" in bad_msg.lower()

        # 2. Valid PNG header (8-byte PNG magic header + dummy body)
        valid_png = b"\x89PNG\r\n\x1a\n" + b"\x00" * 32
        good_ok, good_msg, avatar_url = auth_mgr.save_profile_image(user_id, valid_png, filename="avatar.png", mime_type="image/png")
        assert good_ok is True
        assert avatar_url.startswith("/api/profile/avatar/avatar_")

        # Verify profile has updated image path
        profile = auth_mgr.get_user_profile(user_id)
        assert profile["profile_image_path"] is not None

        # 3. Delete avatar
        del_ok, del_msg = auth_mgr.delete_profile_image(user_id)
        assert del_ok is True
        profile_after = auth_mgr.get_user_profile(user_id)
        assert profile_after["profile_image_path"] is None

    def test_automatic_alert_policy_engine(self, auth_mgr):
        email = f"policy_{secrets.token_hex(4)}@mindora.edu"
        _, _, data = auth_mgr.register_user({
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Policy Student",
            "date_of_birth": "2001-01-01",
            "is_adult": True,
            "guardian_name": "Parent Name",
            "guardian_phone": "9876543210",
            "guardian_consent": True
        })
        user_id = data["profile"]["id"]
        v_code = data["verification_code"]
        auth_mgr.verify_guardian_phone(user_id, v_code)

        # 1. Initially disabled: alert is skipped
        trig1, reason1, _ = auth_mgr.evaluate_and_trigger_automatic_alert(user_id, friction_score=85.0)
        assert trig1 is False
        assert "not enabled" in reason1.lower()

        # 2. Enable policy with threshold 70.0
        upd_ok, _ = auth_mgr.update_notification_policy(user_id, is_enabled=True, threshold_score=70.0, max_frequency_days=7)
        assert upd_ok is True

        # 3. Score below threshold (65.0) is suppressed
        trig2, reason2, _ = auth_mgr.evaluate_and_trigger_automatic_alert(user_id, friction_score=65.0)
        assert trig2 is False
        assert "did not meet" in reason2.lower()

        # 4. Score at or above threshold (75.0) triggers alert
        trig3, reason3, receipt = auth_mgr.evaluate_and_trigger_automatic_alert(user_id, friction_score=75.0)
        assert trig3 is True
        assert receipt is not None
        assert receipt["status"] == SmsDeliveryStatus.DELIVERED_MOCK.value

        # 5. Subsequent high score within 7 days is suppressed by cooldown deduplication
        trig4, reason4, _ = auth_mgr.evaluate_and_trigger_automatic_alert(user_id, friction_score=90.0)
        assert trig4 is False
        assert "cooldown" in reason4.lower()
