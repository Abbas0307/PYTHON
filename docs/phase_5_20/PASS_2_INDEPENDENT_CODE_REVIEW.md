# MINDORA 2.0 — PHASE 5.20 PASS 2 INDEPENDENT CODE REVIEW
# DEEP CODE-LEVEL VULNERABILITY & DESIGN DEFECT AUDIT

**Auditor:** Independent Application Security Auditor & Cryptography Specialist  
**Inspection Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

Pass 2 independently inspects the critical code paths of Mindora 2.0: session lifecycle, consent enforcement, SMS provider simulation, cryptographic boundaries, and schema architecture. This review verifies the findings of Pass 1 and identifies additional defects requiring remediation in Phase 5.20.

---

## 2. Independent Code-Level Defect Findings

### Defect 1: OTP Plaintext Storage & Static Hardcoded Fallback Bypass
- **File:** `local_companion/auth_manager.py` (lines 154, 268) and `frontend/src/pages/GuardianSupportScreen.tsx` (lines 85, 107)
- **Vulnerability:**
  - `auth_manager.py` generates `v_code = f"{secrets.randbelow(900000) + 100000}"` and writes it unhashed to `users.verification_code`.
  - `GuardianSupportScreen.tsx` lines 107–110:
    ```typescript
    if (verificationCode === pendingCode || verificationCode === '481923') {
      setIsVerified(true);
    }
    ```
    If backend requests fail or the student types `'481923'`, the UI marks the phone verified without backend confirmation!
- **Remediation:**
  1. Store OTP only as a salted cryptographic hash (`hashlib.sha256(otp.encode()).hexdigest()`) with a 10-minute expiration.
  2. Eliminate the `'481923'` static fallback bypass completely from frontend code.

### Defect 2: Missing Automated Alert Threshold Engine & Event Deduplication
- **File:** `local_companion/auth_manager.py` (lines 315–350)
- **Vulnerability:**
  - `send_stress_notification()` requires manual student dispatch on every single message.
  - There is no automated policy engine to detect when a student's deterministic wellness score crosses an approved threshold (e.g. friction index $> 70\%$).
  - There is no deduplication window: if multiple assessments occur on the same day, duplicate alerts could be dispatched to the guardian without a cooldown period.
- **Remediation:**
  1. Implement `NotificationPolicyManager` with configurable stress thresholds (e.g., elevated friction $> 70\%$).
  2. Enforce a minimum 7-day cooldown between automatic alerts.
  3. Require explicit prior opt-in consent specifically for automatic threshold alerts.

### Defect 3: Lack of Real SMS Gateway Adapter & False Delivery Claims
- **File:** `local_companion/auth_manager.py` (lines 352–365)
- **Vulnerability:**
  - Dispatches are recorded directly with `"status": "DELIVERED_MOCK"`.
  - There is no pluggable provider architecture to support external SMS gateways (e.g. Fast2SMS for Indian numbers, Twilio, or generic REST).
  - If a real provider is requested but missing API keys, the system must report `PROVIDER_NOT_CONFIGURED` and block dispatch, rather than claiming successful delivery.
- **Remediation:**
  1. Create `local_companion/sms_provider.py` with `BaseSmsProvider`, `MockSmsProvider`, and `RealSmsProvider`.
  2. Support environment variables `SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID`.
  3. Track honest statuses: `PROVIDER_NOT_CONFIGURED`, `QUEUED`, `SENT_TO_PROVIDER`, `DELIVERED`, `FAILED`, `CANCELLED`, `DELIVERED_MOCK`.

### Defect 4: Guardian Contact Plaintext in Database & Cryptographic Boundary
- **File:** `local_companion/auth_manager.py` (lines 62–79)
- **Vulnerability:**
  - Guardian names and phone numbers are stored as plaintext in SQLite.
  - While client-side vaults use PBKDF2 + AES-256-GCM, the server-side database has no field-level encryption at rest.
- **Remediation:**
  1. Implement AES-256-GCM authenticated encryption at rest in `local_companion/crypto_vault.py`.
  2. Encrypt `guardian_phone`, `guardian_name`, and student phone number using a key derived from `MINDORA_ENCRYPTION_KEY` or `MINDORA_SECRET_KEY`.
  3. Document clear encryption boundaries: client vaults are zero-knowledge E2EE; server database is encrypted at rest; transport is TLS; SMS is plaintext cellular network.

### Defect 5: Missing Profile Image Storage & Validation Backend
- **File:** `local_companion/service.py`
- **Vulnerability:**
  - No profile picture endpoints exist.
  - Untrusted file uploads can lead to arbitrary file write, path traversal, or remote code execution (RCE) if MIME types and magic bytes are not strictly validated.
- **Remediation:**
  1. Implement `POST /api/profile/avatar` and `GET /api/profile/avatar/{filename}`.
  2. Enforce magic-byte validation (JPEG `\xFF\xD8\xFF`, PNG `\x89PNG\r\n\x1a\n`, WebP `RIFF...WEBP`).
  3. Restrict file sizes to max $2\text{ MB}$.
  4. Generate random UUID filenames (`secrets.token_hex(16).jpg`) to prevent path traversal.
  5. Enforce user authorization: only the authenticated student can upload or delete their avatar.

### Defect 6: Conflated General Terms & Guardian Consent Checkboxes
- **File:** `frontend/src/pages/WelcomePrivacyScreen.tsx` & `ProfileSettingsScreen.tsx`
- **Vulnerability:**
  - Checkboxes sometimes group general terms and data usage.
  - Under GDPR/DPDP/COPPA, guardian disclosure consent must be completely separate from terms of service.
  - Checkboxes must never be pre-selected.
- **Remediation:**
  1. Implement separate, unselected checkboxes for Terms of Service, Privacy Policy, and Guardian Support.
  2. Clearly describe what triggers automatic notifications and explicitly note that private assessment responses are never shared.

---

## 3. Discrepancies vs. Pass 1 & Prioritized Action Plan

| Discrepancy / Additional Finding | Severity | Resolution in Phase 5.20 |
| :--- | :---: | :--- |
| **Hardcoded `'481923'` frontend bypass** | **HIGH** | Delete hardcoded fallback; enforce server-verified OTP only |
| **Plaintext OTP in database** | **HIGH** | Hash OTP using SHA-256 + salt; store in `guardian_verification_tokens` |
| **No auto-alert threshold policy** | **HIGH** | Implement `notification_policies` table and threshold trigger engine |
| **Lack of SMS provider abstraction** | **HIGH** | Implement `sms_provider.py` supporting Mock and Real adapters |
| **No server encryption at rest** | **HIGH** | Implement `crypto_vault.py` (AES-256-GCM) for sensitive contact fields |
| **No profile picture upload/serving** | **MEDIUM** | Implement secure avatar upload with magic-byte validation |

Both Pass 1 and Pass 2 are complete. Architecture and remediation specifications are aligned.
