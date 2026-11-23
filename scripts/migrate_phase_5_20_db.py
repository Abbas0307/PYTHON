"""
scripts/migrate_phase_5_20_db.py
Database Migration Script for Mindora 2.0 Phase 5.20.

Performs:
1. Pre-migration SQLite integrity check and backup.
2. Safe schema upgrade adding student profile fields (student_phone, profile_image_path).
3. Creation of normalized tables:
   - consent_records (Granular consent tracking)
   - notification_policies (Configurable threshold policies)
   - notification_history (Persistent audit logs with provider states)
   - guardian_verification_tokens (Hashed OTP tokens)
4. Transparent encryption of sensitive contact fields at rest using AES-256-GCM.
5. Post-migration integrity verification.
"""

import os
import sys
from typing import Optional
import sqlite3
import hashlib
from datetime import datetime, timezone

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.db_backup import create_backup, verify_sqlite_integrity
from local_companion.config import CONFIG
from local_companion.crypto_vault import CRYPTO_VAULT

def migrate_database(db_path: Optional[str] = None) -> bool:
    target_db = db_path or CONFIG.db_path
    if not os.path.exists(target_db):
        print(f"Database does not exist yet at {target_db}. Will be initialized on first service run.")
        return True

    print(f"Starting Phase 5.20 Database Migration on {target_db}...")

    # Step 1: Pre-migration integrity check
    ok, msg = verify_sqlite_integrity(target_db)
    if not ok:
        print(f"Pre-migration integrity check failed: {msg}")
        return False

    # Step 2: Pre-migration backup
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(target_db)), "backups")
    bak_ok, bak_msg, meta = create_backup(target_db, backup_dir)
    if not bak_ok:
        print(f"Pre-migration backup failed: {bak_msg}")
        return False
    print(f"Pre-migration backup verified at: {meta['backup_file']}")

    # Step 3: Execute Schema Migrations
    conn = sqlite3.connect(target_db)
    conn.execute("PRAGMA foreign_keys = ON")
    cursor = conn.cursor()

    try:
        # 3a. Alter users table
        cols = [r[1] for r in cursor.execute("PRAGMA table_info(users)").fetchall()]
        if "student_phone" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN student_phone TEXT")
        if "profile_image_path" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_path TEXT")
        if "profile_image_mime" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_mime TEXT")
        if "profile_image_uploaded_at" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_uploaded_at TEXT")

        # 3b. Create consent_records table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS consent_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            consent_type TEXT NOT NULL,
            consent_version TEXT NOT NULL,
            is_granted INTEGER NOT NULL,
            granted_at TEXT,
            revoked_at TEXT,
            purpose_description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # 3c. Create notification_policies table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            policy_name TEXT NOT NULL,
            is_enabled INTEGER NOT NULL DEFAULT 0,
            stress_threshold_score REAL NOT NULL DEFAULT 70.0,
            max_frequency_days INTEGER NOT NULL DEFAULT 7,
            last_triggered_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, policy_name)
        )
        """)

        # 3d. Create notification_history table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notification_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            message_id TEXT UNIQUE NOT NULL,
            recipient_name TEXT NOT NULL,
            recipient_phone_masked TEXT NOT NULL,
            message_text TEXT NOT NULL,
            status TEXT NOT NULL,
            provider TEXT NOT NULL,
            provider_response TEXT,
            timestamp TEXT NOT NULL,
            diagnostic_free_guarantee INTEGER DEFAULT 1,
            idempotency_key TEXT UNIQUE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # 3e. Create guardian_verification_tokens table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS guardian_verification_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token_hash TEXT NOT NULL,
            expires_at REAL NOT NULL,
            attempts_count INTEGER DEFAULT 0,
            verified_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # Step 4: Encrypt legacy plaintext contacts at rest
        users = cursor.execute("SELECT id, guardian_name, guardian_phone FROM users").fetchall()
        for uid, g_name, g_phone in users:
            updates = []
            params = []
            if g_name and not g_name.startswith("enc:"):
                enc_name = CRYPTO_VAULT.encrypt_field(g_name, f"user:{uid}:guardian_name")
                updates.append("guardian_name = ?")
                params.append(enc_name)
            if g_phone and not g_phone.startswith("enc:"):
                enc_phone = CRYPTO_VAULT.encrypt_field(g_phone, f"user:{uid}:guardian_phone")
                updates.append("guardian_phone = ?")
                params.append(enc_phone)
            if updates:
                params.append(uid)
                cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(params))

        conn.commit()
        conn.close()

        # Step 5: Post-migration integrity verification
        post_ok, post_msg = verify_sqlite_integrity(target_db)
        if not post_ok:
            print(f"Post-migration integrity check failed: {post_msg}")
            return False

        print("Phase 5.20 Database Migration completed and verified successfully.")
        return True

    except Exception as exc:
        conn.rollback()
        conn.close()
        print(f"Migration error: {str(exc)}")
        return False

if __name__ == "__main__":
    db = sys.argv[1] if len(sys.argv) > 1 else None
    success = migrate_database(db)
    sys.exit(0 if success else 1)
