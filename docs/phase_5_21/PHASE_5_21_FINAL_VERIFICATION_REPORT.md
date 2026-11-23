# Mindora 2.0 — Phase 5.21: Final Verification Report
## Independent Source Code Audit, Security Validation & Complete End-to-End Testing

**Document ID:** `DOC-P521-FINAL-008`  
**Date:** November 16, 2026  
**Auditor Roles:** Senior Full-Stack Engineer, Application Security Auditor, QA Automation Engineer, Database Engineer & ML Platform Reviewer  
**Overall Determination:** **PASS WITH LIMITATIONS**  

---

## 1. Executive Summary

An independent source code audit and empirical verification of Mindora 2.0 was conducted following Phase 5.20. The evaluation was conducted without assuming Phase 5.20 assertions were accurate.

### Key Discoveries & Actions:
1. **Identified & Remediated Integration Defects:** Discovered that the automated guardian alert policy was silently failing due to parameter key discrepancies between frontend and backend (`policy_enabled` vs `is_enabled`, `trigger_threshold` vs `stress_threshold_score`, `cooldown_days` vs `max_frequency_days`), and a scale mismatch between probability fraction ($0.75$) and percentage ($75\%$). These were corrected and verified.
2. **Eliminated Unauthenticated Token Leakage in UI:** Identified that `GuardianSupportScreen.tsx` fell back to `'local_dev_session'` when unauthenticated, potentially exposing User 1's mock notifications during local development. This fallback was removed; unauthenticated requests now properly return HTTP 401.
3. **Hardened Registration Validation:** Replaced a permissive email regex that allowed whitespace and added sanity bounds to date-of-birth (rejecting future dates and ages $< 13$).
4. **Verified Cryptography & Security Invariants:** Confirmed that passwords use Argon2id, sensitive phone numbers in SQLite are encrypted with AES-256-GCM and Bound Associated Data (`AAD`), OTP tokens are salted SHA-256 hashes, and brute-force rate limiting is enforced.
5. **Full Test Execution:** Executed all 228 backend pytest cases (100% passing) and 123 frontend unit test cases (100% passing). Verified that all 11 frozen research assets remain bit-identical.

---

## 2. Files Inspected

- **Backend:** `local_companion/service.py`, `local_companion/auth_manager.py`, `local_companion/crypto_vault.py`, `local_companion/sms_provider.py`, `local_companion/config.py`.
- **Frontend:** `frontend/src/pages/LoginScreen.tsx`, `frontend/src/pages/SignupScreen.tsx`, `frontend/src/pages/ProfileSettingsScreen.tsx`, `frontend/src/pages/GuardianSupportScreen.tsx`, `frontend/src/components/common/Header.tsx`, `frontend/src/storage/sessionStorage.ts`, `frontend/src/App.tsx`, `frontend/src/config/api.ts`.
- **Database & Scripts:** `scripts/migrate_phase_5_20_db.py`, `scripts/db_backup.py`, `data/mindora_auth.db`.
- **Deployment & Config:** `render.yaml`, `frontend/vercel.json`, `requirements-production.txt`, `.env.example`.
- **Frozen ML & Research:** `app.py`, `models/best_model.pkl`, `dataset/Student_Depression_Dataset.csv`, `models/feature_importance.csv`, `models/model_comparison.json`.

---

## 3. Files Modified During Remediation

1. `local_companion/service.py`: Supported dual parameter key nomenclatures and automatic scale normalization for alert thresholds.
2. `local_companion/auth_manager.py`: Upgraded email regex to RFC 5322 compliance; added date of birth sanity checks (rejecting future dates and ages $< 13$).
3. `frontend/src/pages/GuardianSupportScreen.tsx`: Removed development token fallback; updated policy save and test simulation payloads to pass normalized parameters.
4. `.env.example`: Documented SMS provider configuration variables (`SMS_PROVIDER`, `SMS_API_KEY`, `SMS_SENDER_ID`).
5. `tests/test_phase_5_21_audit.py`: Created comprehensive 14-test security and edge-case test suite.

---

## 4. Security Audit Findings

| Category | Finding | Severity | Resolution Status |
| :--- | :--- | :--- | :--- |
| **Authentication** | Permissive email regex accepted whitespace | Low | **Fixed** (RFC 5322 regex) |
| **Authentication** | Registration allowed future dates of birth | Low | **Fixed** (Validation bounds) |
| **Authorization** | Missing token in Guardian screen defaulted to dev user in dev mode | Medium | **Fixed** (Empty fallback / HTTP 401) |
| **IDOR** | User ID tampering across private endpoints | Critical | **Secure by Design** (Derived from session token) |
| **Brute-Force** | Rapid repeated login attempts | High | **Secure by Design** (5 attempts/15 min rate limit) |
| **SQL Injection** | Dynamic string formatting in queries | Critical | **Secure by Design** (0 unparameterized queries) |
| **Status:** | **PASS** | | |

---

## 5. Encryption Architecture Findings

Mindora does **not** claim complete end-to-end encryption across the entire application. Cryptographic boundaries are delineated as follows:
- **Client Zero-Knowledge Vault:** Personal student reflection notes are stored in IndexedDB encrypted via AES-256-GCM using client-derived keys (PBKDF2 with 600,000 iterations). Ciphertext keys never touch the server.
- **Server-Side Data at Rest:** Sensitive phone numbers in SQLite are encrypted with AES-256-GCM and Bound Associated Data (`user:{id}:{field}`). Tampered ciphertext or transplanted rows fail authentication.
- **Server ML Inference Boundary:** ML models evaluate student features in plaintext RAM during assessment calculation. Features are transient and not saved to the database.
- **Cellular SMS Boundary:** Cellular SMS is unencrypted over GSM/LTE networks. Mindora guarantees that zero clinical scores, answers, or diagnoses are sent via SMS.
- **Status:** **PASS WITH LIMITATIONS** (Key management currently relies on server environment variables; HSM/KMS integration recommended for production).

---

## 6. Authentication Results

Tested across 14 dedicated test cases in `tests/test_phase_5_21_audit.py`:
- Registration validation: PASS (Rejects invalid emails, short passwords, password mismatch, future birthdates, under-13 ages, duplicate emails, and unaccepted terms).
- Login validation: PASS (Authenticates valid credentials; returns generic error on invalid email or password).
- Session lifecycle: PASS (Logout invalidates session token; expired tokens rejected).
- Rate limiting: PASS (Blocks after 5 consecutive failures).
- Production token guard: PASS (`local_dev_session` strictly rejected in production mode).
- **Status:** **PASS**

---

## 7. Guardian Consent & Alert Results

- **Prior Consent Enforcement:** Mandatory affirmative opt-in verified. Notifications cannot be enabled without student consent.
- **Threshold Comparison Logic:** Correctly evaluates thresholds regardless of whether passed as fractions ($0.75$) or percentages ($75\%$).
- **7-Day Cooldown:** Successfully suppresses repeated alerts within 168 hours of a prior alert.
- **Idempotency:** Rejects duplicate events sharing the same idempotency key.
- **Minor Safeguarding:** Minor accounts ($< 18$) cannot enable auto-alerts without verified guardian phone authorization.
- **Content Sanitization:** Outbound messages use a fixed neutral template with zero clinical depression terms.
- **Status:** **PASS**

---

## 8. Database Integrity Results

- Pre-audit backup verified: `data/backups/mindora_auth_backup_20261116_164621.db` (SHA-256: `02cac44aa5012436151d1b0748a39a6863384dd24adf70b43a21256fbdd28562`).
- `PRAGMA integrity_check` returned `ok`.
- `PRAGMA foreign_key_check` returned `0 violations`.
- Database restore drill executed successfully into an isolated test sandbox.
- **Status:** **PASS**

---

## 9. Frontend Results

- All 14 screens render with white-and-violet design tokens and without horizontal scrollbars.
- Top-right Header profile avatar displays image or initials fallback with working navigation dropdown.
- WCAG 2.1 AA automated checks pass (contrast ratios $\ge 4.5:1$, form labels explicit, ARIA attributes present).
- Interactive keyboard navigation functional with visible focus rings.
- **Status:** **PASS WITH LIMITATIONS** (Full assistive hardware trial with screen readers recommended prior to public launch).

---

## 10. ML & Research Regression Results

- Baseline production model (`models/best_model.pkl`) SHA-256: `E182E9E779A4F89E4883EB13C9BAB3DF19EEBC7165D4B0A44319F737361342EC` (UNMODIFIED).
- Streamlit prototype (`app.py`) SHA-256: `5F15ADD9F3A5F5809D80154931E98A5B79D06BBC9BB69323028BFA3898E46BBE` (UNMODIFIED).
- Dataset (`dataset/Student_Depression_Dataset.csv`) SHA-256: `A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404` (UNMODIFIED).
- 163-record real-world dataset strictly quarantined as research-only.
- **Status:** **PASS**

---

## 11. Complete Test Execution Table

| Test Suite | Execution Command | Total | Pass | Fail | Skip | Duration | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Phase 5.21 Security Audit** | `pytest tests/test_phase_5_21_audit.py` | 14 | 14 | 0 | 0 | 0.55s | **PASS** |
| **Phase 5.20 Features** | `pytest tests/test_phase_5_20_features.py` | 10 | 10 | 0 | 0 | 0.72s | **PASS** |
| **Production Hardening** | `pytest tests/test_production_security_hardening.py` | 10 | 10 | 0 | 0 | 3.52s | **PASS** |
| **End-to-End Validation** | `pytest tests/test_end_to_end_validation.py` | 25 | 25 | 0 | 0 | 0.48s | **PASS** |
| **Offline Reliability** | `pytest tests/test_offline_reliability.py` | 9 | 9 | 0 | 0 | 0.35s | **PASS** |
| **Architecture Reliability** | `pytest tests/test_architecture_reliability.py` | 9 | 9 | 0 | 0 | 0.22s | **PASS** |
| **Day 11 Student Journey** | `pytest tests/test_day11_student_journey.py` | 12 | 12 | 0 | 0 | 0.28s | **PASS** |
| **Day 12 Privacy** | `pytest tests/test_day12_privacy_architecture.py` | 8 | 8 | 0 | 0 | 0.19s | **PASS** |
| **Day 8 UX & Accessibility** | `pytest tests/test_day8_ux_accessibility.py` | 10 | 10 | 0 | 0 | 0.25s | **PASS** |
| **Recommendation Engine** | `pytest tests/test_recommendation_intelligence.py` | 37 | 37 | 0 | 0 | 0.81s | **PASS** |
| **Security & Privacy** | `pytest tests/test_security_privacy.py` | 16 | 16 | 0 | 0 | 0.36s | **PASS** |
| **Student Experience** | `pytest tests/test_student_experience.py` | 7 | 7 | 0 | 0 | 0.18s | **PASS** |
| **Training Platform** | `pytest tests/test_training_platform.py` | 15 | 15 | 0 | 0 | 0.34s | **PASS** |
| **ML Lab Stage 3b-2** | `pytest ml_lab/tests/test_stage_3b_2.py` | 12 | 12 | 0 | 0 | 0.42s | **PASS** |
| **ML Lab Preflight** | `pytest ml_lab/tests/test_stage_3b_4_preflight.py` | 5 | 5 | 0 | 0 | 0.15s | **PASS** |
| **ML Lab Isolation** | `pytest ml_lab/tests/test_pre_ingestion_isolation.py` | 10 | 10 | 0 | 0 | 0.31s | **PASS** |
| **Local Companion API** | `pytest local_companion/test_local_companion.py` | 9 | 9 | 0 | 0 | 0.29s | **PASS** |
| **Auth & Guardian Security** | `pytest tests/test_auth_guardian_security.py` | 2 | 2 | 0 | 0 | 0.12s | **PASS** |
| **Feature Contract** | `pytest tests/model_parity/test_feature_contract.py` | 3 | 3 | 0 | 0 | 0.08s | **PASS** |
| **Engine Independence** | `pytest tests/test_engine_independence.py` | 5 | 5 | 0 | 0 | 0.11s | **PASS** |
| **TOTAL PYTHON BACKEND** | `pytest tests ml_lab/tests local_companion` | **228** | **228** | **0** | **0** | **17.75s** | **PASS** |
| **FRONTEND UNIT & INTEGRATION** | `node --test` (14 test files) | **123** | **123** | **0** | **0** | **1.04s** | **PASS** |
| **TYPESCRIPT COMPILATION** | `npx tsc --noEmit` | — | 0 err | 0 | 0 | 3.82s | **PASS** |
| **PRODUCTION BUILD** | `npm run build` | — | 1,651 mod | 0 | 0 | 2.91s | **PASS** |

---

## 12. Production Deployment Readiness

- **Status:** **PASS WITH LIMITATIONS**
- `render.yaml` mounts a 1 GB persistent disk at `/var/data` covering both SQLite and avatars.
- `requirements-production.txt` contains pinned production dependencies.
- Frontend security headers configured in `vercel.json`.
- Health check at `/ready` and `/health` returns HTTP 200.

---

## 13. Remaining Risks

1. **Carrier Dependency for Real SMS:** If using Fast2SMS in production, deliverability depends on carrier DLT template approval in India.
2. **Ephemeral File Threat:** If deployed to cloud environments without persistent volume mounts, the SQLite database and uploaded avatars would be lost upon container restart.
3. **Key Secret Exposure:** The secret key is stored in environment variables; compromised host environments could expose derived keys.

---

## 14. Unresolved Defects

- **Zero Critical or High Defects Remaining.** All 5 defects identified during the initial Phase 5.21 audit were remediated, tested, and verified.
- **Track B Provenance:** 163-record dataset provenance remains unverified (quarantine policy strictly maintained).

---

## 15. Exact Commands to Run Mindora Locally

### Step 1: Start FastAPI Companion Backend
```powershell
cd "D:\Depression calculator"
$env:PYTHONPATH="."
py -3.14 -m uvicorn local_companion.service:app --host 127.0.0.1 --port 8000
```

### Step 2: Start Vite Frontend Server
```powershell
cd "D:\Depression calculator\frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```

### Step 3: Access Application
Open a modern web browser to `http://127.0.0.1:5173/`.

---

## 16. Exact Steps Required Before Public Deployment

1. **Provision Production Cryptographic Secrets:** Generate a 64-character random hex string for `MINDORA_SECRET_KEY` and configure it in Render/cloud secrets.
2. **Verify Persistent Disk Mounting:** Ensure `/var/data` is mounted to `mindora-db-volume` in Render settings.
3. **Configure SMS Credentials:** If real guardian notifications are desired, configure `SMS_PROVIDER=fast2sms`, `SMS_API_KEY`, and register DLT headers. Otherwise, keep `SMS_PROVIDER=mock`.
4. **Institutional Ethics Approval:** Obtain formal university Institutional Review Board (IRB) or Ethics Committee approval prior to recruiting real student human participants.
5. **Set Production Environment Mode:** Set `MINDORA_ENV=production` to ensure development bypass tokens are strictly rejected.
