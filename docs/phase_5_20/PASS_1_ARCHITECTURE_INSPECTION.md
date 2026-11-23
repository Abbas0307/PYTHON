# MINDORA 2.0 — PHASE 5.20 PASS 1 ARCHITECTURE INSPECTION
# ARCHITECTURE AND FUNCTIONALITY EVALUATION

**Auditor:** Principal Software Architect & Application Security Engineer  
**Inspection Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. What Works
1. **Deterministic Student Assessment:** 10-feature survey, PHQ-9 scoring, and lifestyle friction calculations run entirely client-side in `wellbeingEngine.ts`.
2. **PHQ-9 Item 9 Safeguard:** Item 9 endorsement triggers emergency safety banners in memory without persisting sensitive psychological responses.
3. **Four ML Models:** Logistic Regression, Random Forest, XGBoost, and SVM pipelines deserialize safely with SHA-256 pre-verification in `src/predict.py`.
4. **Backend Loopback API:** FastAPI endpoints execute correctly on loopback with security headers and CORS restrictions.
5. **Argon2id Authentication:** `auth_manager.py` hashes passwords with $64\text{ MiB}$ memory cost, issues 256-bit URL-safe tokens, and rejects `local_dev_session` in production mode.
6. **Encrypted Client Vaults:** IndexedDB stores weekly trends using AES-256-GCM derived from student passphrases with 600,000 PBKDF2 iterations.
7. **Database Backup:** `scripts/db_backup.py` takes non-blocking online snapshots with `PRAGMA integrity_check` verification.

---

## 2. What Does Not Work / Is Incomplete
1. **Dedicated Signup & Login Screens:**
   - Currently, authentication is crammed into `ProfileSettingsScreen.tsx` as a toggle tab between "Sign In" and "Create Account".
   - There are no separate dedicated `/login` and `/signup` screens.
   - Consent checkboxes do not explicitly separate general terms from specific guardian notification consent.
2. **Top-Right Profile Picture & Dropdown:**
   - `Header.tsx` currently only contains the brand logo, offline badge, country selector, and "Crisis Help" button.
   - There is no profile picture avatar, no user status, and no dropdown menu for profile navigation, settings, or logout.
3. **Profile Image Handling:**
   - There is no API or storage backend for uploading, previewing, storing, or serving student profile images.
   - No MIME validation, file signature magic-byte verification, or safe storage paths exist.
4. **Guardian Notification Policy & Threshold Alerts:**
   - Guardian notifications are currently manual only (student clicks "Dispatch Immediate Notification").
   - There is no configurable threshold engine for automatic alerts based on student-approved wellness friction scores.
   - There is no deduplication cooldown period to prevent multiple messages from being sent during repeated checks.
5. **Real SMS Gateway Integration:**
   - SMS notifications are handled exclusively via an in-memory mock array in `auth_manager.py`.
   - There is no SMS provider abstraction, no real gateway adapter (e.g. Fast2SMS / Twilio), and no delivery state tracking (`PROVIDER_NOT_CONFIGURED`, `QUEUED`, `SENT_TO_PROVIDER`, `DELIVERED`, `FAILED`).
6. **Server-Side Encryption at Rest:**
   - Guardian names, phone numbers, and student details are stored in plain text in `users` table in SQLite.
   - There is no server-side encryption at rest using AES-256-GCM for sensitive contact columns.
7. **Database Schema Normalization:**
   - `users` table contains all fields in a single denormalized table.
   - Lacks dedicated tables for `consent_records`, `notification_policies`, `notification_history`, and `guardian_verification_tokens`.
   - Plain verification code is stored in `users.verification_code` instead of a cryptographic hash.

---

## 3. What Is Hardcoded or Insecure
1. **Plaintext OTP Storage:** `verification_code` is stored as plaintext `481923` or random 6-digit string directly in the database row. If the database file is accessed, OTP codes are immediately exposed.
2. **Guardian Fallback OTP:** `GuardianSupportScreen.tsx` has hardcoded fallback OTP `'481923'`, which allows bypassing OTP verification during frontend network interruptions.
3. **Mock SMS Delivery State:** The current frontend labels mock messages as `'DELIVERED_MOCK'` without tracking whether a real SMS provider was configured or rejected.

---

## 4. Pass 1 Inspection Summary Matrix

| Subsystem | Current State | Target Phase 5.20 Standard | Priority |
| :--- | :--- | :--- | :---: |
| **Auth Navigation** | Mixed toggle tab in ProfileSettings | Dedicated `/login` and `/signup` screens with unselected consents | **CRITICAL** |
| **Header Avatar** | Missing from `Header.tsx` | Profile avatar with dropdown (Profile, Settings, Privacy, Logout) | **HIGH** |
| **Profile Photos** | No backend or UI support | Upload, preview, replace, MIME/magic-byte validation, secure storage | **HIGH** |
| **SMS Provider** | In-memory mock only | Provider abstraction (Mock + Real adapter, honest delivery status) | **CRITICAL** |
| **Threshold Alerts**| Manual dispatch only | Configurable threshold engine, explicit opt-in, deduplication cooldown | **CRITICAL** |
| **DB Encryption** | Plaintext guardian contacts in SQLite | AES-256-GCM authenticated encryption at rest for sensitive columns | **CRITICAL** |
| **OTP Security** | Plaintext in DB + hardcoded '481923' | Hashed OTP in DB (SHA-256), rate limiting, hardcoded fallback removed | **HIGH** |
| **Schema Design** | Single `users` table | Normalized schema: `users`, `consent`, `policies`, `sms_logs`, `tokens` | **CRITICAL** |
| **UI Polish** | Inconsistent card spacing & tabs | Unified white-and-violet theme across all 14 screens | **MEDIUM** |
