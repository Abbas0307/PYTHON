# Mindora 2.0 — Phase 5.20: Database Migration and Integrity Report

**Document ID:** `DOC-P520-DB-010`  
**Date:** November 16, 2026  
**Status:** Verified & Active  
**Author:** Principal Software Architect & Database Auditor  

---

## 1. Pre-Migration Baseline & Integrity Backup

Prior to executing any Phase 5.20 schema alterations or data migrations:
1. `scripts/db_backup.py` was executed.
2. Verified backup archive created: `data/backups/mindora_auth_backup_20261116_160928.db`.
3. Backup SHA-256 Digest: `7dacb4f01ca1b7686f3b59762ae1267741c9080b745a40a8faffac23dae49386`.
4. Integrity Check: `PRAGMA integrity_check` returned `ok`.

---

## 2. Phase 5.20 Schema Modifications

Migration script: `scripts/migrate_phase_5_20_db.py`.

### 2.1 Alterations to `users` Table
- `student_phone TEXT`: Encrypted phone number of the student (`enc:v1:...`).
- `profile_image_path TEXT`: Relative path to sanitized avatar file (`avatar_{uid}_{token}.{ext}`).
- `profile_image_mime TEXT`: MIME type (`image/jpeg`, `image/png`, `image/webp`).
- `profile_image_uploaded_at TEXT`: ISO-8601 UTC timestamp of avatar upload.

### 2.2 New Tables Created
```sql
-- 1. Granular Consent Tracking
CREATE TABLE IF NOT EXISTS consent_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    consent_type TEXT NOT NULL,
    consent_version TEXT NOT NULL,
    is_granted INTEGER NOT NULL,
    granted_at TEXT NOT NULL,
    purpose_description TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Configurable Notification Policies
CREATE TABLE IF NOT EXISTS notification_policies (
    user_id INTEGER NOT NULL,
    policy_name TEXT NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 0,
    stress_threshold_score REAL NOT NULL DEFAULT 70.0,
    max_frequency_days INTEGER NOT NULL DEFAULT 7,
    last_triggered_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user_id, policy_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Notification History & Audit Records
CREATE TABLE IF NOT EXISTS notification_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message_id TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    recipient_name TEXT,
    message_text TEXT NOT NULL,
    trigger_source TEXT NOT NULL,
    status TEXT NOT NULL,
    provider TEXT NOT NULL,
    created_at TEXT NOT NULL,
    delivered_at TEXT,
    diagnostic_free_guarantee INTEGER NOT NULL DEFAULT 1,
    idempotency_key TEXT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Hashed Guardian Verification Tokens
CREATE TABLE IF NOT EXISTS guardian_verification_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at REAL NOT NULL,
    created_at TEXT NOT NULL,
    used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 3. Existing Plaintext Re-Encryption

- All existing `guardian_name` and `guardian_phone` rows in `users` were scanned.
- Plaintext records were encrypted in place with `FieldCryptoVault` using bound AAD (`user:{id}:guardian_name` and `user:{id}:guardian_phone`).
- Zero plaintext phone numbers remain in SQLite.

---

## 4. Post-Migration Verification

- Executed `PRAGMA integrity_check`: Output: `ok`.
- Executed `PRAGMA foreign_key_check`: Output: `0 violations`.
- Schema migration completed cleanly with zero data loss.
