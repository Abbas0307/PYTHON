# MINDORA 2.0 — PHASE 5.19 BACKUP & RECOVERY PLAN
# OPERATIONAL PROCEDURES, INTEGRITY DRILLS & DISASTER RECOVERY

**Principal Auditor:** Senior DevOps Engineer & Database Reliability Architect  
**Date:** November 16, 2026  
**Product:** Mindora 2.0 — Student Mental Wellness & Risk Insights Platform  
**Target Repository:** `D:\Depression calculator`  

---

## 1. Executive Summary

This plan specifies the operational procedures for SQLite database backup, data verification, disaster recovery, and data retention for Mindora 2.0. The procedures ensure that student authentication records and guardian consent records can be restored without data loss or corruption in the event of hardware failure, disk corruption, or accidental deletion.

---

## 2. Backup Architecture & Online Snapshots

### 2.1 Online SQLite Backup Mechanism
Mindora utilizes Python's native `sqlite3.Connection.backup()` API (`scripts/db_backup.py`). This performs an online page-by-page copy of the live database without placing an exclusive table lock or interfering with active student sessions.

### 2.2 Operational Backup Command
```bash
python scripts/db_backup.py
```
- **Backup Destination:** `data/backups/mindora_auth_backup_YYYYMMDD_HHMMSS.db`
- **Pre-Snapshot Check:** Verifies source database integrity via `PRAGMA integrity_check`.
- **Post-Snapshot Check:** Verifies destination snapshot integrity via `PRAGMA integrity_check`.
- **Cryptographic Hash:** Computes and records the SHA-256 checksum of the backup file.

---

## 3. Automated Cron / Scheduled Backup Specification

In a cloud Linux container (e.g. Render), scheduled backups should be executed via a cron task or external scheduler:

```cron
# Execute Mindora DB snapshot every 6 hours
0 */6 * * * python /app/scripts/db_backup.py >> /var/log/mindora_backup.log 2>&1
```

### 3.1 Backup Retention Policy
- **Hourly/Snapshot:** Retain 24 hours of snapshots.
- **Daily:** Retain daily snapshots for 30 days.
- **Weekly:** Retain weekly snapshots for 12 weeks.
- **Purge Command:** Automatically delete backup files older than 30 days:
  ```bash
  find data/backups/ -name "*.db" -mtime +30 -delete
  ```

---

## 4. Disaster Recovery & Restoration Procedures

### 4.1 Step-by-Step Restoration Protocol
1. **Quarantine Active Service:**
   Stop the running backend process to prevent concurrent writes during restore:
   ```bash
   # Stop Uvicorn daemon
   pkill -f "uvicorn local_companion.service:app"
   ```
2. **Select Verified Snapshot:**
   Identify the latest verified backup file in `data/backups/`.
3. **Verify Integrity Prior to Restore:**
   ```python
   from scripts.db_backup import verify_sqlite_integrity
   ok, msg = verify_sqlite_integrity("data/backups/mindora_auth_backup_20261116_153142.db")
   assert ok, f"Corrupted backup: {msg}"
   ```
4. **Execute Safe Atomic Restoration:**
   ```bash
   python -c "
   from scripts.db_backup import restore_backup
   restore_backup('data/backups/mindora_auth_backup_20261116_153142.db', 'data/mindora_auth.db')
   "
   ```
5. **Verify Database Consistency:**
   Confirm SQLite reports `ok` on the restored database:
   ```bash
   sqlite3 data/mindora_auth.db "PRAGMA integrity_check;"
   ```
6. **Restart Backend Service:**
   Restart Uvicorn and verify the `/ready` health probe returns HTTP 200.

---

## 5. Empirical Drill Results (Simulated Recovery Verification)

During Phase 5.19, a recovery drill was executed into an isolated sandbox:
- **Source Database:** `data/mindora_auth.db`
- **Backup File:** `data/backups/mindora_auth_backup_20261116_153142.db`
- **Sandbox Restore Target:** `data/test_restore_sandbox/mindora_auth.db`
- **Result:**
  - Backup creation: **SUCCESS**
  - Post-backup integrity: **PRAGMA integrity_check -> ok**
  - Restore into sandbox: **SUCCESS**
  - Restored file integrity: **PRAGMA integrity_check -> ok**
  - Active database: **100% UNTOUCHED** (Zero downtime or data contamination)

---

## 6. Audit Verdict

**Status:** **`PASS`**  
Backup procedures, integrity checks, and restore protocols are verified operational.
