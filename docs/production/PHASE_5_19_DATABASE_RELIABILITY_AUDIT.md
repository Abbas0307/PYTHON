# MINDORA 2.0 — PHASE 5.19 DATABASE RELIABILITY AUDIT
# SQLITE TRANSACTION INTEGRITY, CONCURRENCY, BACKUP & RECOVERY DRILL

**Principal Auditor:** Senior Backend Engineer & Database Reliability Specialist  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This audit assesses the database tier of Mindora 2.0 (`data/mindora_auth.db`). SQLite 3 serves as the lightweight, embedded relational database for student accounts and guardian management. The audit covers connection management, foreign keys, transaction boundaries, automated backup procedures, integrity verification, and persistent hosting disk requirements.

---

## 2. SQLite Database Architecture & Concurrency Analysis

### 2.1 File Location & Access Isolation
- **Default Path:** `data/mindora_auth.db` (governed dynamically by `MINDORA_DB_PATH`).
- **Web Root Isolation:** Database is located outside the frontend `dist/` and `src/` trees. Static asset servers cannot serve the database file.
- **Git Hygiene:** Explicitly excluded in `.gitignore` (`*.db`, `data/*.db`, `data/*.sqlite3`).

### 2.2 Connection Management & Integrity Pragmas
- **Connection Factory:** `AuthManager._get_conn()` initializes standard connections with:
  - `conn.row_factory = sqlite3.Row` (Column name access).
  - `conn.execute("PRAGMA foreign_keys = ON")` (Enforces referential integrity).
  - Context manager pattern (`with self._get_conn() as conn:`) guaranteeing atomic transactions and automatic rollbacks on unhandled errors.

### 2.3 Cloud Persistence & Deployment Blockers
- **Ephemeral Filesystem Blocker:** Deploying to serverless functions or container environments without persistent volumes will wipe user credentials and guardian logs upon container recycle.
- **Remediation Specification:** For Render hosting, `render.yaml` specifies a persistent disk mount:
  ```yaml
  disk:
    name: mindora-db-volume
    mountPath: /var/data
    sizeGB: 1
  ```
  And sets `MINDORA_DB_PATH=/var/data/mindora_auth.db`.
- **Verdict on PostgreSQL Migration:** Not required at current scale (student demo / pilot cohort). SQLite is technically sufficient provided persistent disk storage is provisioned.

---

## 3. Automated Backup & Recovery Drill Verification

### 3.1 Implementation (`scripts/db_backup.py`)
Mindora 2.0 implements an online, non-blocking backup utility leveraging Python's `sqlite3.Connection.backup()` API:
- **Pre-Backup Integrity Verification:** Executes `PRAGMA integrity_check` before copying pages.
- **Atomic Online Snapshot:** Copies database pages incrementally without locking readers or writer transactions.
- **Post-Backup Integrity Check:** Executes `PRAGMA integrity_check` on the resulting backup file and records SHA-256 hash.
- **Isolated Restore Drill:** Restores snapshot into a quarantined sandbox directory (`data/test_restore_sandbox/`) without overwriting active data.

### 3.2 Live Drill Execution Evidence
- **Source Database:** `D:\Depression calculator\data\mindora_auth.db`
- **Backup File Created:** `D:\Depression calculator\data\backups\mindora_auth_backup_20261116_153142.db`
- **Backup SHA-256:** `1c4429593258fc466f39de2ee6deb7b2c7a8fa62cef7ed30a994429ae975cc20`
- **File Size:** $16,384\text{ bytes}$
- **Integrity Result:** `PRAGMA integrity_check` returned `ok`.
- **Restore Target:** `D:\Depression calculator\data\test_restore_sandbox\mindora_auth.db`
- **Restore Verification:** Restored file verified functional with `PRAGMA integrity_check: ok`.

---

## 4. Audit Verdict

**Status:** **`PASS` (with Persistent Disk Requirement Flagged for Cloud Hosting)**  
Database connection handling, foreign keys, transaction boundaries, and online backup/restore procedures are verified production-ready.
