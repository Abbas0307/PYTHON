# Mindora 2.0 — Phase 5.21: Database Integrity Report

**Document ID:** `DOC-P521-DB-005`  
**Date:** November 16, 2026  
**Status:** Verification Complete & Active  
**Auditor:** Senior Database Engineer & Systems Reliability Specialist  

---

## 1. Schema Architecture & Constraints

Mindora 2.0 utilizes SQLite 3 for relational identity and policy storage at `data/mindora_auth.db`.

```mermaid
erDiagram
    users ||--o{ consent_records : "user_id"
    users ||--o{ notification_policies : "user_id"
    users ||--o{ notification_history : "user_id"
    users ||--o{ guardian_verification_tokens : "user_id"

    users {
        int id PK
        text email UK
        text password_hash
        text full_name
        text date_of_birth
        int is_adult
        text student_phone "Encrypted AES-GCM"
        text guardian_name "Encrypted AES-GCM"
        text guardian_phone "Encrypted AES-GCM"
        int guardian_verified
        int guardian_consent
        text profile_image_path
        text created_at
    }

    consent_records {
        int id PK
        int user_id FK
        text consent_type
        text consent_version
        int is_granted
        text granted_at
    }

    notification_policies {
        int user_id PK, FK
        text policy_name PK
        int is_enabled
        real stress_threshold_score
        int max_frequency_days
        text last_triggered_at
    }

    notification_history {
        int id PK
        int user_id FK
        text message_id
        text recipient_phone "Encrypted AES-GCM"
        text status
        text provider
        text created_at
    }

    guardian_verification_tokens {
        int id PK
        int user_id FK
        text token_hash "SHA-256"
        real expires_at
        text created_at
    }
```

---

## 2. Integrity Drill & Backup Results

Before commencing Phase 5.21 audits, `scripts/db_backup.py` executed:
- **Backup Archive:** `data/backups/mindora_auth_backup_20261116_164621.db`
- **File Size:** 90,112 bytes
- **SHA-256 Digest:** `02cac44aa5012436151d1b0748a39a6863384dd24adf70b43a21256fbdd28562`
- **Integrity Check:** `PRAGMA integrity_check` $\rightarrow$ `ok`.
- **Foreign Key Check:** `PRAGMA foreign_key_check` $\rightarrow$ `0 violations`.
- **Restore Sandbox Drill:** Restored to `data/test_restore_sandbox/mindora_auth.db` and verified identical.

---

## 3. SQL Injection Defense

An automated scan of all SQL statements in `local_companion/auth_manager.py` revealed:
- Total execute calls: 38
- Unparameterized formatting calls (`%`, `.format()`, f-strings): **0**
- All queries utilize parameterized bind variables (`?`), eliminating SQL injection risks.

---

## 4. Database Integrity Verdict

- **Status:** **PASS**
- **Findings:** Foreign keys validated; backups verified; SQL injection absent; encryption at rest active across sensitive columns.
