"""
scripts/db_backup.py
Production-grade SQLite Backup, Verification, and Restore Utility for Mindora 2.0.

Uses Python's native sqlite3 online backup API to take atomic, non-blocking snapshots
of the SQLite database. Enforces PRAGMA integrity_check before and after backup/restore.
"""

import os
import sys
import sqlite3
import hashlib
from datetime import datetime, timezone
from typing import Tuple, Dict, Any, Optional

def compute_sha256(filepath: str) -> str:
    """Compute cryptographic hash of a database file."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest().lower()

def verify_sqlite_integrity(db_path: str) -> Tuple[bool, str]:
    """Execute PRAGMA integrity_check on the specified SQLite database."""
    if not os.path.exists(db_path):
        return False, f"Database file does not exist: {db_path}"
    
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        cursor = conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        rows = cursor.fetchall()
        conn.close()
        
        if rows and rows[0][0] == "ok":
            return True, "Integrity check passed (ok)."
        errors = "; ".join([r[0] for r in rows])
        return False, f"Integrity check failed: {errors}"
    except Exception as exc:
        return False, f"Database connection error: {str(exc)}"

def create_backup(source_path: str, backup_dir: str) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
    """
    Take an online, atomic snapshot of source_path into backup_dir using sqlite3 backup API.
    Does not lock out readers or corrupt concurrent transactions.
    """
    if not os.path.exists(source_path):
        return False, f"Source database not found at {source_path}", None
    
    # Verify source integrity prior to snapshot
    src_ok, src_msg = verify_sqlite_integrity(source_path)
    if not src_ok:
        return False, f"Pre-backup source integrity check failed: {src_msg}", None

    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"mindora_auth_backup_{timestamp}.db"
    dest_path = os.path.join(backup_dir, backup_filename)

    try:
        source_conn = sqlite3.connect(source_path)
        dest_conn = sqlite3.connect(dest_path)
        
        # Use sqlite3 online backup API
        source_conn.backup(dest_conn, pages=100)
        
        dest_conn.close()
        source_conn.close()

        # Verify backup integrity
        bak_ok, bak_msg = verify_sqlite_integrity(dest_path)
        if not bak_ok:
            os.remove(dest_path)
            return False, f"Post-backup integrity check failed: {bak_msg}", None

        metadata = {
            "backup_file": dest_path,
            "filename": backup_filename,
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "source_path": source_path,
            "file_size_bytes": os.path.getsize(dest_path),
            "sha256": compute_sha256(dest_path),
            "integrity_verified": True
        }
        return True, "Backup created and verified successfully.", metadata
    except Exception as exc:
        return False, f"Backup procedure failed: {str(exc)}", None

def restore_backup(backup_path: str, target_path: str, isolate_dir: Optional[str] = None) -> Tuple[bool, str]:
    """
    Safely restore database from backup_path into target_path.
    If isolate_dir is specified, restores to an isolated test target without touching production.
    """
    if not os.path.exists(backup_path):
        return False, f"Backup file not found at {backup_path}"

    # Verify backup integrity before restoring
    bak_ok, bak_msg = verify_sqlite_integrity(backup_path)
    if not bak_ok:
        return False, f"Cannot restore: Backup integrity verification failed ({bak_msg})"

    effective_target = target_path
    if isolate_dir:
        os.makedirs(isolate_dir, exist_ok=True)
        effective_target = os.path.join(isolate_dir, os.path.basename(target_path))

    target_dir = os.path.dirname(os.path.abspath(effective_target))
    os.makedirs(target_dir, exist_ok=True)

    try:
        backup_conn = sqlite3.connect(backup_path)
        dest_conn = sqlite3.connect(effective_target)
        backup_conn.backup(dest_conn, pages=100)
        dest_conn.close()
        backup_conn.close()

        # Verify restored database integrity
        res_ok, res_msg = verify_sqlite_integrity(effective_target)
        if not res_ok:
            return False, f"Restored database integrity failed: {res_msg}"
        return True, f"Database restored and verified successfully at {effective_target}"
    except Exception as exc:
        return False, f"Restore failed: {str(exc)}"

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_db = os.path.join(base, "data", "mindora_auth.db")
    default_backup_dir = os.path.join(base, "data", "backups")
    
    print("Executing Mindora 2.0 Database Backup Drill...")
    success, message, meta = create_backup(default_db, default_backup_dir)
    print(f"Backup Result: {message}")
    if success and meta:
        print(f"Backup File: {meta['backup_file']}")
        print(f"SHA-256: {meta['sha256']}")
        print(f"Size: {meta['file_size_bytes']} bytes")
        
        # Test isolated restore drill
        test_restore_dir = os.path.join(base, "data", "test_restore_sandbox")
        r_ok, r_msg = restore_backup(meta['backup_file'], default_db, isolate_dir=test_restore_dir)
        print(f"Restore Drill Result: {r_msg}")
