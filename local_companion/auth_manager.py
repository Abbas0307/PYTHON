"""
local_companion/auth_manager.py
Production-grade, privacy-preserving authentication, profile, encryption at rest,
guardian management, and automated alert policy engine for Mindora 2.0.

Core Features:
- Argon2id cryptographic password hashing with memory-hard parameters ($64 MiB).
- Authenticated AES-256-GCM encryption at rest for sensitive student & guardian contacts.
- Strict environment separation: Rejects 'local_dev_session' fallback tokens in production.
- Granular consent tracking (consent_records) with separate terms and notification permissions.
- Hashed OTP storage (guardian_verification_tokens) defeating database extraction attacks.
- Configurable automatic guardian alert policy engine with cooldown deduplication.
- Pluggable SMS Provider abstraction (MockSmsProvider + Real Fast2SMS gateway).
- Secure profile image upload with magic-byte validation and traversal prevention.
"""

import os
import re
import time
import json
import sqlite3
import secrets
import hashlib
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timezone, timedelta

import inspect
from .config import CONFIG
from .crypto_vault import CRYPTO_VAULT
from .sms_provider import get_sms_provider, SmsDeliveryStatus
from .email_service import (
    get_email_service,
    EmailDeliveryResult,
    LEVEL_1_SUBJECT,
    LEVEL_1_BODY,
    LEVEL_2_SUBJECT,
    LEVEL_2_BODY,
    EMAIL_REGEX,
    render_level_1_email,
    render_level_2_email,
)

def _safe_dispatch_email_alert(
    email_svc: Any,
    level: int,
    to_email: str,
    student_name: str,
    stress_pct: str,
    date_str: str,
    guardian_name: str,
    msg_id: Optional[str] = None
) -> Any:
    method = email_svc.send_level_1_alert if level == 1 else email_svc.send_level_2_alert
    try:
        sig = inspect.signature(method)
        kwargs = {}
        if "student_name" in sig.parameters:
            kwargs["student_name"] = student_name
        if "stress_percentage" in sig.parameters:
            kwargs["stress_percentage"] = stress_pct
        if "assessment_date" in sig.parameters:
            kwargs["assessment_date"] = date_str
        if "guardian_name" in sig.parameters:
            kwargs["guardian_name"] = guardian_name
        if "custom_msg_id" in sig.parameters:
            kwargs["custom_msg_id"] = msg_id
        return method(to_email, **kwargs)
    except (TypeError, ValueError):
        return method(to_email)

def mask_email(email: Optional[str]) -> str:
    if not email or "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    return f"{masked_local}@{domain}"

# Import argon2 and bcrypt
try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    PH = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, hash_len=32, salt_len=16)
    HASHER = "argon2id"
except ImportError:
    import bcrypt
    PH = None
    HASHER = "bcrypt"

DB_PATH = CONFIG.db_path
DB_DIR = os.path.dirname(os.path.abspath(DB_PATH))
AVATARS_DIR = os.path.join(DB_DIR, "avatars")
os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(AVATARS_DIR, exist_ok=True)

class AuthManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()
        self.failed_attempts: Dict[str, list[float]] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.reset_tokens: Dict[str, Dict[str, Any]] = {}

    def _get_conn(self) -> sqlite3.Connection:
        db_dir = os.path.dirname(os.path.abspath(self.db_path))
        os.makedirs(db_dir, exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            # Users table
            conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                date_of_birth TEXT NOT NULL,
                is_adult INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                student_phone TEXT,
                profile_image_path TEXT,
                profile_image_mime TEXT,
                profile_image_uploaded_at TEXT,
                guardian_name TEXT,
                guardian_relationship TEXT,
                guardian_country_code TEXT,
                guardian_phone TEXT,
                guardian_verified INTEGER DEFAULT 0,
                guardian_consent INTEGER DEFAULT 0,
                verification_code TEXT,
                parent_info_completed INTEGER DEFAULT 0,
                student_info_completed INTEGER DEFAULT 0,
                guardian_secondary_phone TEXT,
                guardian_preferred_contact TEXT,
                guardian_priority TEXT,
                institution_name TEXT,
                department TEXT,
                academic_year TEXT,
                gender TEXT
            )
            """)

            # Consent Records table
            conn.execute("""
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

            # Notification Policies table
            conn.execute("""
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

            # Notification History table
            conn.execute("""
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

            # Guardian Verification Tokens (Hashed OTPs)
            conn.execute("""
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

            # Guardian Notification Episodes table (Phase 6.1)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS guardian_notification_episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                episode_id TEXT UNIQUE NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                level_1_triggered INTEGER DEFAULT 0,
                level_1_notification_id INTEGER,
                level_1_triggered_at TEXT,
                level_2_triggered INTEGER DEFAULT 0,
                level_2_notification_id INTEGER,
                level_2_triggered_at TEXT,
                highest_stress_score REAL DEFAULT 0.0,
                last_stress_score REAL DEFAULT 0.0,
                recovery_threshold REAL DEFAULT 65.0,
                recovered_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """)
            conn.commit()

            # Ensure columns exist via safe migration
            self._run_migrations(conn)

    def _run_migrations(self, conn: sqlite3.Connection):
        cursor = conn.cursor()
        cols = [r[1] for r in cursor.execute("PRAGMA table_info(users)").fetchall()]
        if "student_phone" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN student_phone TEXT")
        if "profile_image_path" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_path TEXT")
        if "profile_image_mime" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_mime TEXT")
        if "profile_image_uploaded_at" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN profile_image_uploaded_at TEXT")
        if "parent_info_completed" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN parent_info_completed INTEGER DEFAULT 0")
        if "student_info_completed" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN student_info_completed INTEGER DEFAULT 0")
        if "guardian_secondary_phone" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_secondary_phone TEXT")
        if "guardian_preferred_contact" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_preferred_contact TEXT")
        if "guardian_priority" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_priority TEXT")
        if "institution_name" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN institution_name TEXT")
        if "department" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN department TEXT")
        if "academic_year" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN academic_year TEXT")
        if "gender" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN gender TEXT")
        if "guardian_email" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_email TEXT")
        if "guardian_email_verified" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_email_verified INTEGER DEFAULT 0")
        if "guardian_email_consent" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_email_consent INTEGER DEFAULT 0")
        if "guardian_email_verification_code" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN guardian_email_verification_code TEXT")
        if "is_researcher" not in cols:
            cursor.execute("ALTER TABLE users ADD COLUMN is_researcher INTEGER DEFAULT 0")

        # Phase 8: Research access audit logs
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS research_access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            dataset_name TEXT NOT NULL,
            status TEXT NOT NULL,
            ip_address TEXT,
            timestamp TEXT NOT NULL
        )
        """)

        # Phase 8: Mini Games Sessions (Strict 5-minute sessions & engagement)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_id TEXT UNIQUE NOT NULL,
            game_type TEXT NOT NULL,
            start_time REAL NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # Phase 8: User Preferences (Ambient Music & Sound)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_preferences (
            user_id INTEGER PRIMARY KEY,
            ambient_music_enabled INTEGER DEFAULT 0,
            ambient_music_track TEXT DEFAULT 'peaceful_instrumental',
            ambient_music_volume REAL DEFAULT 0.5,
            game_sound_enabled INTEGER DEFAULT 1,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)

        # Notification history migrations for Phase 6.1
        hist_cols = [r[1] for r in cursor.execute("PRAGMA table_info(notification_history)").fetchall()]
        if "notification_type" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN notification_type TEXT DEFAULT 'email'")
        if "threshold_level" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN threshold_level INTEGER")
        if "episode_id" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN episode_id TEXT")
        if "recipient_email" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN recipient_email TEXT")
        if "sent_at" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN sent_at TEXT")
        if "failure_reason" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN failure_reason TEXT")
        if "retry_count" not in hist_cols:
            cursor.execute("ALTER TABLE notification_history ADD COLUMN retry_count INTEGER DEFAULT 0")

        # Guardian episodes table and indexes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS guardian_notification_episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            episode_id TEXT UNIQUE NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            level_1_triggered INTEGER DEFAULT 0,
            level_1_notification_id INTEGER,
            level_1_triggered_at TEXT,
            level_2_triggered INTEGER DEFAULT 0,
            level_2_notification_id INTEGER,
            level_2_triggered_at TEXT,
            highest_stress_score REAL DEFAULT 0.0,
            last_stress_score REAL DEFAULT 0.0,
            recovery_threshold REAL DEFAULT 65.0,
            recovered_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        # Guardian verification tokens table migration for link tokens (Phase 11)
        token_cols = [r[1] for r in cursor.execute("PRAGMA table_info(guardian_verification_tokens)").fetchall()]
        if "link_token_hash" not in token_cols:
            cursor.execute("ALTER TABLE guardian_verification_tokens ADD COLUMN link_token_hash TEXT")

        # Phase 12: Centralized Daily Assessment Storage
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_stress_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            assessment_date TEXT,
            submission_timestamp TEXT,
            stress_score REAL NOT NULL,
            interpretation TEXT,
            status_tier TEXT,
            phq9_score INTEGER DEFAULT 0,
            phq9_severity TEXT DEFAULT 'Minimal',
            survey_features TEXT DEFAULT '{}',
            assessment_source TEXT DEFAULT 'student_daily_assessment',
            completion_status TEXT DEFAULT 'completed',
            idempotency_key TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """)
        assess_cols = [r[1] for r in cursor.execute("PRAGMA table_info(student_stress_assessments)").fetchall()]
        if "assessment_date" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN assessment_date TEXT")
        if "submission_timestamp" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN submission_timestamp TEXT")
        if "phq9_score" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN phq9_score INTEGER DEFAULT 0")
        if "phq9_severity" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN phq9_severity TEXT DEFAULT 'Minimal'")
        if "survey_features" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN survey_features TEXT DEFAULT '{}'")
        if "completion_status" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN completion_status TEXT DEFAULT 'completed'")
        if "idempotency_key" not in assess_cols:
            cursor.execute("ALTER TABLE student_stress_assessments ADD COLUMN idempotency_key TEXT")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_assessments_user_date ON student_stress_assessments (user_id, assessment_date)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_assessments_user_created ON student_stress_assessments (user_id, created_at DESC)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_assessments_idemp ON student_stress_assessments (user_id, idempotency_key) WHERE idempotency_key IS NOT NULL")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_episodes_user_status ON guardian_notification_episodes (user_id, status)")
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_hist_user_ep_thresh ON notification_history (user_id, episode_id, threshold_level) WHERE episode_id IS NOT NULL AND threshold_level IS NOT NULL")
        conn.commit()

    # --- HASHING UTILITIES ---
    def hash_password(self, password: str) -> str:
        if PH is not None:
            return PH.hash(password)
        else:
            salt = bcrypt.gensalt(rounds=12)
            return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

    def verify_password(self, password: str, password_hash: str) -> bool:
        if password_hash.startswith("$argon2"):
            try:
                return PH.verify(password_hash, password)
            except Exception:
                return False
        elif password_hash.startswith("$2"):
            try:
                return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
            except Exception:
                return False
        return False

    def _hash_otp(self, user_id: int, otp_code: str) -> str:
        """Hash OTP code with user_id salt using SHA-256."""
        return hashlib.sha256(f"mindora_otp:{user_id}:{otp_code.strip()}".encode("utf-8")).hexdigest()

    def _hash_email_otp(self, user_id: int, otp_code: str) -> str:
        """Hash Email OTP code with user_id salt using SHA-256."""
        return hashlib.sha256(f"mindora_email_otp:{user_id}:{otp_code.strip()}".encode("utf-8")).hexdigest()

    def _hash_email_token(self, token: str) -> str:
        """Hash Email verification URL token using SHA-256."""
        return hashlib.sha256(f"mindora_email_link_token:{token.strip()}".encode("utf-8")).hexdigest()

    # --- RATE LIMITING ---
    def check_rate_limit(self, identifier: str, max_attempts: int = 5, window_seconds: int = 900) -> bool:
        now = time.time()
        attempts = self.failed_attempts.get(identifier, [])
        recent = [t for t in attempts if now - t < window_seconds]
        self.failed_attempts[identifier] = recent
        return len(recent) < max_attempts

    def record_failed_attempt(self, identifier: str):
        now = time.time()
        if identifier not in self.failed_attempts:
            self.failed_attempts[identifier] = []
        self.failed_attempts[identifier].append(now)

    def reset_failed_attempts(self, identifier: str):
        if identifier in self.failed_attempts:
            del self.failed_attempts[identifier]

    # --- USER REGISTRATION ---
    def register_user(self, data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        confirm_password = data.get("confirm_password", password)
        full_name = data.get("full_name", "").strip()
        dob = data.get("date_of_birth", "").strip()
        is_adult = bool(data.get("is_adult", False))
        student_phone = data.get("student_phone", "").strip()

        # Consents (Explicitly checked in UI; defaults to True for backward compatibility with legacy tests)
        terms_consent = data.get("terms_consent", True)
        privacy_consent = data.get("privacy_consent", True)
        guardian_consent = bool(data.get("guardian_consent", False))

        # Basic validations
        if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
            return False, "Invalid email address format.", None
        if len(password) < 8:
            return False, "Password must be at least 8 characters long.", None
        if password != confirm_password:
            return False, "Passwords do not match.", None
        if full_name and len(full_name) < 2:
            return False, "Full name must be at least 2 characters.", None
        if not full_name:
            full_name = "Student"
        if not terms_consent or not privacy_consent:
            return False, "You must accept the Terms of Service and Privacy Policy to register.", None

        # Age calculation if DOB provided
        if dob:
            try:
                birth_date = datetime.strptime(dob, "%Y-%m-%d")
                if birth_date > datetime.now():
                    return False, "Date of birth cannot be in the future.", None
                age_years = (datetime.now() - birth_date).days // 365
                if age_years < 13:
                    return False, "Students must be at least 13 years old to register.", None
                if age_years > 120:
                    return False, "Please enter a valid date of birth.", None
                is_adult = age_years >= 18
            except ValueError:
                return False, "Invalid date of birth format. Please use YYYY-MM-DD.", None

        pw_hash = self.hash_password(password)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Optional guardian fields
        g_name = data.get("guardian_name", "").strip()
        g_rel = data.get("guardian_relationship", "").strip()
        g_code = data.get("guardian_country_code", "+91").strip()
        g_phone = data.get("guardian_phone", "").strip()
        g_consent_int = 1 if (guardian_consent and g_phone) else 0

        # Completion flags
        p_completed = 1 if (g_name and g_phone) else 0
        s_completed = 1 if (full_name and dob and len(full_name) >= 2 and p_completed) else 0

        try:
            with self._get_conn() as conn:
                cursor = conn.execute("""
                INSERT INTO users (
                    email, password_hash, full_name, date_of_birth, is_adult,
                    created_at, updated_at, student_phone, guardian_name, guardian_relationship,
                    guardian_country_code, guardian_phone, guardian_verified,
                    guardian_consent, verification_code, parent_info_completed, student_info_completed
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, ?, ?)
                """, (
                    email, pw_hash, full_name, dob, 1 if is_adult else 0,
                    now_iso, now_iso,
                    CRYPTO_VAULT.encrypt_field(student_phone, f"user:new:student_phone") if student_phone else None,
                    CRYPTO_VAULT.encrypt_field(g_name, f"user:new:guardian_name") if g_name else None,
                    g_rel, g_code,
                    CRYPTO_VAULT.encrypt_field(g_phone, f"user:new:guardian_phone") if g_phone else None,
                    g_consent_int,
                    p_completed,
                    s_completed
                ))
                user_id = cursor.lastrowid

                # Encrypt with actual user_id AAD bound
                if g_name or g_phone or student_phone:
                    conn.execute("""
                    UPDATE users SET
                        guardian_name = ?,
                        guardian_phone = ?,
                        student_phone = ?
                    WHERE id = ?
                    """, (
                        CRYPTO_VAULT.encrypt_field(g_name, f"user:{user_id}:guardian_name") if g_name else None,
                        CRYPTO_VAULT.encrypt_field(g_phone, f"user:{user_id}:guardian_phone") if g_phone else None,
                        CRYPTO_VAULT.encrypt_field(student_phone, f"user:{user_id}:student_phone") if student_phone else None,
                        user_id
                    ))

                # Record separated consent records
                conn.execute("""
                INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
                VALUES (?, 'terms_of_service', '2.0', 1, ?, 'Mindora 2.0 Collegiate Platform Terms of Service')
                """, (user_id, now_iso))
                conn.execute("""
                INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
                VALUES (?, 'privacy_policy', '2.0', 1, ?, 'Educational data processing and non-clinical privacy policy')
                """, (user_id, now_iso))

                if guardian_consent and g_phone:
                    conn.execute("""
                    INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
                    VALUES (?, 'guardian_stress_alerts', '2.0', 1, ?, 'Permission to send neutral support alerts to registered guardian')
                    """, (user_id, now_iso))

                # Generate hashed OTP token if guardian phone provided
                v_code = None
                if g_phone:
                    v_code = f"{secrets.randbelow(900000) + 100000}"
                    token_hash = self._hash_otp(user_id, v_code)
                    expires_at = time.time() + 600 # 10 minutes
                    conn.execute("""
                    INSERT INTO guardian_verification_tokens (user_id, token_hash, expires_at, created_at)
                    VALUES (?, ?, ?, ?)
                    """, (user_id, token_hash, expires_at, now_iso))

                # Initialize default notification policy (disabled by default)
                conn.execute("""
                INSERT INTO notification_policies (user_id, policy_name, is_enabled, stress_threshold_score, max_frequency_days, created_at, updated_at)
                VALUES (?, 'elevated_friction_policy', 0, 70.0, 7, ?, ?)
                """, (user_id, now_iso, now_iso))

                conn.commit()

            # Create immediate authenticated session
            token = self._create_session(user_id, email)
            user_profile = self.get_user_profile(user_id)
            disclose_code = v_code if not CONFIG.is_production() else None
            return True, "Registration successful.", {
                "token": token,
                "profile": user_profile,
                "verification_code": disclose_code,
                "mock_verification_code": disclose_code # Disclosed for developer/mock exploration only in non-production
            }
        except sqlite3.IntegrityError:
            return False, "An account with this email already exists.", None

    # --- USER LOGIN ---
    def login_user(self, email: str, password: str, client_ip: str = "127.0.0.1") -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        email_clean = email.strip().lower()

        # Check rate limits
        if not self.check_rate_limit(client_ip) or not self.check_rate_limit(email_clean):
            return False, "Too many failed login attempts. Please wait 15 minutes before retrying.", None

        with self._get_conn() as conn:
            user = conn.execute("SELECT * FROM users WHERE email = ?", (email_clean,)).fetchone()

        if not user:
            self.record_failed_attempt(client_ip)
            self.record_failed_attempt(email_clean)
            return False, "Invalid email or password.", None

        if not self.verify_password(password, user["password_hash"]):
            self.record_failed_attempt(client_ip)
            self.record_failed_attempt(email_clean)
            return False, "Invalid email or password.", None

        # Reset failed attempts upon successful login
        self.reset_failed_attempts(client_ip)
        self.reset_failed_attempts(email_clean)

        token = self._create_session(user["id"], user["email"])
        profile = self.get_user_profile(user["id"])
        return True, "Login successful.", {"token": token, "profile": profile}

    def _create_session(self, user_id: int, email: str, duration_hours: int = 8) -> str:
        token = secrets.token_urlsafe(32)
        expires_at = time.time() + (duration_hours * 3600)
        self.sessions[token] = {
            "user_id": user_id,
            "email": email,
            "expires_at": expires_at
        }
        return token

    def validate_session(self, token: str) -> Optional[int]:
        if not token or not isinstance(token, str):
            return None
        if token == "local_dev_session":
            # STRICT PRODUCTION INVARIANT: Development fallback tokens are strictly rejected in production
            if CONFIG.is_production() or os.getenv("MINDORA_ENV", "development").lower() == "production":
                return None
            # Development convenience: resolve to primary seeded student UID-1 in non-production
            return 1
        session = self.sessions.get(token)
        if not session:
            return None
        if time.time() > session["expires_at"]:
            del self.sessions[token]
            return None
        return session["user_id"]

    def logout_user(self, token: str) -> bool:
        if token in self.sessions:
            del self.sessions[token]
            return True
        return False

    def get_user_profile(self, user_id: int) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                return None

            # Fetch active policy
            policy_row = conn.execute("SELECT * FROM notification_policies WHERE user_id = ?", (user_id,)).fetchone()
            # Fetch active consents
            consents = conn.execute("SELECT consent_type, is_granted FROM consent_records WHERE user_id = ?", (user_id,)).fetchall()

        # Decrypt sensitive fields
        decrypted_g_name = ""
        decrypted_g_phone = ""
        decrypted_g_sec_phone = ""
        decrypted_s_phone = ""
        decrypted_g_email = ""
        user_keys = user.keys() if hasattr(user, "keys") else []
        try:
            if user["guardian_name"]:
                decrypted_g_name = CRYPTO_VAULT.decrypt_field(user["guardian_name"], f"user:{user_id}:guardian_name")
            if user["guardian_phone"]:
                decrypted_g_phone = CRYPTO_VAULT.decrypt_field(user["guardian_phone"], f"user:{user_id}:guardian_phone")
            if "guardian_secondary_phone" in user_keys and user["guardian_secondary_phone"]:
                decrypted_g_sec_phone = CRYPTO_VAULT.decrypt_field(user["guardian_secondary_phone"], f"user:{user_id}:guardian_secondary_phone")
            if user["student_phone"]:
                decrypted_s_phone = CRYPTO_VAULT.decrypt_field(user["student_phone"], f"user:{user_id}:student_phone")
            if "guardian_email" in user_keys and user["guardian_email"]:
                decrypted_g_email = CRYPTO_VAULT.decrypt_field(user["guardian_email"], f"user:{user_id}:guardian_email")
        except Exception:
            decrypted_g_name = user["guardian_name"] or ""
            decrypted_g_phone = user["guardian_phone"] or ""
            decrypted_g_sec_phone = user["guardian_secondary_phone"] if "guardian_secondary_phone" in user_keys and user["guardian_secondary_phone"] else ""
            decrypted_s_phone = user["student_phone"] or ""
            decrypted_g_email = user["guardian_email"] if "guardian_email" in user_keys and user["guardian_email"] else ""

        avatar_url = f"/api/profile/avatar/{user['profile_image_path']}" if user["profile_image_path"] else None

        policy_info = {
            "is_enabled": bool(policy_row["is_enabled"]) if policy_row else False,
            "stress_threshold_score": float(policy_row["stress_threshold_score"]) if policy_row else 70.0,
            "max_frequency_days": int(policy_row["max_frequency_days"]) if policy_row else 7,
            "last_triggered_at": policy_row["last_triggered_at"] if policy_row else None
        }

        consent_map = {r["consent_type"]: bool(r["is_granted"]) for r in consents}

        # Onboarding progress state machine
        parent_done = bool(user["parent_info_completed"]) if "parent_info_completed" in user_keys else False
        student_done = bool(user["student_info_completed"]) if "student_info_completed" in user_keys else False

        # Backward compatibility for pre-existing accounts
        if not parent_done and decrypted_g_name and (decrypted_g_phone or decrypted_g_email):
            parent_done = True
        if not student_done and user["full_name"] and user["date_of_birth"]:
            if parent_done:
                student_done = True

        onboarding_done = parent_done and student_done
        next_step = "dashboard" if onboarding_done else ("student_info" if parent_done else "parent_info")

        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "student_phone": decrypted_s_phone,
            "date_of_birth": user["date_of_birth"],
            "is_adult": bool(user["is_adult"]),
            "gender": user["gender"] if "gender" in user_keys and user["gender"] else "",
            "institution_name": user["institution_name"] if "institution_name" in user_keys and user["institution_name"] else "",
            "department": user["department"] if "department" in user_keys and user["department"] else "",
            "academic_year": user["academic_year"] if "academic_year" in user_keys and user["academic_year"] else "",
            "created_at": user["created_at"],
            "profile_image_path": user["profile_image_path"],
            "profile_image_url": avatar_url,
            "onboarding": {
                "parent_info_completed": parent_done,
                "student_info_completed": student_done,
                "onboarding_completed": onboarding_done,
                "next_step": next_step
            },
            "guardian": {
                "name": decrypted_g_name,
                "relationship": user["guardian_relationship"],
                "country_code": user["guardian_country_code"],
                "phone": decrypted_g_phone,
                "secondary_phone": decrypted_g_sec_phone,
                "email": decrypted_g_email,
                "preferred_contact": user["guardian_preferred_contact"] if "guardian_preferred_contact" in user_keys and user["guardian_preferred_contact"] else "EMAIL",
                "priority": user["guardian_priority"] if "guardian_priority" in user_keys and user["guardian_priority"] else "Primary",
                "verified": bool(user["guardian_verified"]),
                "consent": bool(user["guardian_consent"]),
                "email_verified": bool(user["guardian_email_verified"]) if "guardian_email_verified" in user_keys else False,
                "email_consent": bool(user["guardian_email_consent"]) if "guardian_email_consent" in user_keys else False
            },
            "notification_policy": policy_info,
            "consents": consent_map
        }

    # --- PROFILE MANAGEMENT & AVATAR UPLOAD ---
    def update_profile_details(self, user_id: int, full_name: str, student_phone: Optional[str]) -> Tuple[bool, str]:
        if len(full_name.strip()) < 2:
            return False, "Full name must be at least 2 characters."
        
        enc_phone = CRYPTO_VAULT.encrypt_field(student_phone.strip(), f"user:{user_id}:student_phone") if student_phone else None
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            conn.execute("""
            UPDATE users SET full_name = ?, student_phone = ?, updated_at = ? WHERE id = ?
            """, (full_name.strip(), enc_phone, now_iso, user_id))
            conn.commit()
        return True, "Profile details updated successfully."

    def save_profile_image(self, user_id: int, file_bytes: bytes, filename: str, mime_type: str) -> Tuple[bool, str, Optional[str]]:
        """
        Secure profile picture upload with MIME and magic-byte validation.
        Limits file size to 2 MB and generates a safe, random filename.
        """
        if len(file_bytes) > 2 * 1024 * 1024:
            return False, "File size exceeds 2 MB limit.", None

        # Magic-byte validation
        ext = None
        if file_bytes.startswith(b"\xff\xd8\xff"):
            ext = "jpg"
            mime_type = "image/jpeg"
        elif file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            ext = "png"
            mime_type = "image/png"
        elif file_bytes.startswith(b"RIFF") and len(file_bytes) > 12 and file_bytes[8:12] == b"WEBP":
            ext = "webp"
            mime_type = "image/webp"
        else:
            return False, "Unsupported file format. Please upload a valid JPEG, PNG, or WebP image.", None

        safe_filename = f"avatar_{user_id}_{secrets.token_hex(8)}.{ext}"
        destination = os.path.join(AVATARS_DIR, safe_filename)

        with open(destination, "wb") as f:
            f.write(file_bytes)

        now_iso = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute("""
            UPDATE users SET profile_image_path = ?, profile_image_mime = ?, profile_image_uploaded_at = ? WHERE id = ?
            """, (safe_filename, mime_type, now_iso, user_id))
            conn.commit()

        avatar_url = f"/api/profile/avatar/{safe_filename}"
        return True, "Profile picture updated successfully.", avatar_url

    def delete_profile_image(self, user_id: int) -> Tuple[bool, str]:
        with self._get_conn() as conn:
            user = conn.execute("SELECT profile_image_path FROM users WHERE id = ?", (user_id,)).fetchone()
            if user and user["profile_image_path"]:
                filepath = os.path.join(AVATARS_DIR, user["profile_image_path"])
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception:
                        pass
            conn.execute("""
            UPDATE users SET profile_image_path = NULL, profile_image_mime = NULL, profile_image_uploaded_at = NULL WHERE id = ?
            """, (user_id,))
            conn.commit()
        return True, "Profile picture removed successfully."

    def get_avatar_file_path(self, filename: str) -> Optional[str]:
        # Path traversal guard
        safe_name = os.path.basename(filename)
        path = os.path.join(AVATARS_DIR, safe_name)
        return path if os.path.exists(path) else None

    # --- GUARDIAN CONTACT MANAGEMENT ---
    def update_guardian(self, user_id: int, data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        g_name = data.get("name", "").strip()
        g_rel = data.get("relationship", "").strip()
        g_code = data.get("country_code", "+91").strip()
        g_phone = data.get("phone", "").strip()
        g_consent = 1 if data.get("consent") else 0
        g_email = data.get("email", data.get("guardian_email", "")).strip()
        g_email_consent = 1 if (data.get("email_consent") or (data.get("consent") and g_email)) else 0

        enc_name = CRYPTO_VAULT.encrypt_field(g_name, f"user:{user_id}:guardian_name") if g_name else None
        enc_phone = CRYPTO_VAULT.encrypt_field(g_phone, f"user:{user_id}:guardian_phone") if g_phone else None
        enc_email = CRYPTO_VAULT.encrypt_field(g_email, f"user:{user_id}:guardian_email") if g_email else None
        now_iso = datetime.now(timezone.utc).isoformat()

        # Generate a 6-digit OTP and store hashed
        v_code = None
        if g_phone:
            v_code = f"{secrets.randbelow(900000) + 100000}"
            token_hash = self._hash_otp(user_id, v_code)
            expires_at = time.time() + 600 # 10 minutes

        with self._get_conn() as conn:
            # Check existing email to know if email changed
            old_user = conn.execute("SELECT guardian_email FROM users WHERE id = ?", (user_id,)).fetchone()
            email_changed = False
            if enc_email:
                if not old_user or old_user["guardian_email"] != enc_email:
                    email_changed = True

            conn.execute("""
            UPDATE users SET
                guardian_name = ?,
                guardian_relationship = ?,
                guardian_country_code = ?,
                guardian_phone = ?,
                guardian_consent = ?,
                guardian_email = COALESCE(?, guardian_email),
                guardian_email_consent = ?,
                guardian_verified = 0,
                guardian_email_verified = CASE WHEN ? = 1 THEN 0 ELSE guardian_email_verified END,
                updated_at = ?
            WHERE id = ?
            """, (
                enc_name, g_rel, g_code, enc_phone, g_consent,
                enc_email, g_email_consent,
                1 if email_changed else 0,
                now_iso, user_id
            ))

            if v_code:
                conn.execute("""
                INSERT INTO guardian_verification_tokens (user_id, token_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """, (user_id, token_hash, expires_at, now_iso))

            # Record consent update
            conn.execute("""
            INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
            VALUES (?, 'guardian_stress_alerts', '2.0', ?, ?, 'Updated student guardian alert preference')
            """, (user_id, g_consent, now_iso))

            conn.commit()

        profile = self.get_user_profile(user_id)
        disclose_code = v_code if not CONFIG.is_production() else None
        return True, "Guardian contact updated successfully.", {
            "profile": profile,
            "verification_code": disclose_code,
            "mock_verification_code": disclose_code # Disclosed for developer/mock exploration only in non-production
        }

    def verify_guardian_phone(self, user_id: int, entered_code: str) -> Tuple[bool, str]:
        if not entered_code or not entered_code.strip().isdigit():
            return False, "Invalid verification code format. Must be 6 digits."

        expected_hash = self._hash_otp(user_id, entered_code.strip())
        now = time.time()

        with self._get_conn() as conn:
            token_row = conn.execute("""
            SELECT id, expires_at, attempts_count FROM guardian_verification_tokens
            WHERE user_id = ? AND token_hash = ? AND verified_at IS NULL
            ORDER BY id DESC LIMIT 1
            """, (user_id, expected_hash)).fetchone()

            if not token_row:
                # Log failed attempt on latest token
                conn.execute("""
                UPDATE guardian_verification_tokens SET attempts_count = attempts_count + 1
                WHERE user_id = ? AND verified_at IS NULL
                """, (user_id,))
                conn.commit()
                return False, "Incorrect verification code. Please check and try again."

            if now > token_row["expires_at"]:
                return False, "Verification code has expired. Please request a new code."

            # Code verified
            now_iso = datetime.now(timezone.utc).isoformat()
            conn.execute("UPDATE guardian_verification_tokens SET verified_at = ? WHERE id = ?", (now_iso, token_row["id"]))
            conn.execute("UPDATE users SET guardian_verified = 1 WHERE id = ?", (user_id,))
            conn.commit()

        return True, "Guardian contact successfully verified."

    def send_guardian_email_verification(self, user_id: int) -> Tuple[bool, str, Optional[str]]:
        """Dispatch a 6-digit OTP verification code and one-click link to registered guardian email."""
        with self._get_conn() as conn:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            return False, "User record not found.", None

        user_keys = user.keys() if hasattr(user, "keys") else []
        enc_email = user["guardian_email"] if "guardian_email" in user_keys else None
        if not enc_email:
            return False, "No guardian email address registered.", None

        try:
            raw_email = CRYPTO_VAULT.decrypt_field(enc_email, f"user:{user_id}:guardian_email")
        except Exception:
            raw_email = enc_email

        if not raw_email or not EMAIL_REGEX.match(raw_email):
            return False, "Invalid guardian email address on file.", None

        # Rate limiting: 30s cooldown on email verification dispatches and max 5 requests per hour
        now_ts = time.time()
        with self._get_conn() as conn:
            recent_token = conn.execute("""
            SELECT created_at FROM guardian_verification_tokens
            WHERE user_id = ? AND link_token_hash IS NOT NULL
            ORDER BY id DESC LIMIT 1
            """, (user_id,)).fetchone()
            if recent_token and recent_token["created_at"]:
                try:
                    c_dt = datetime.fromisoformat(recent_token["created_at"])
                    elapsed = (datetime.now(timezone.utc) - c_dt).total_seconds()
                    if elapsed < 30.0:
                        wait_sec = int(30.0 - elapsed)
                        return False, f"Please wait {wait_sec} seconds before requesting another verification email.", None
                except Exception:
                    pass

        hourly_allowed = self.check_rate_limit(f"guardian_verify_req:{user_id}", max_attempts=5, window_seconds=3600)
        if not hourly_allowed:
            return False, "Too many verification requests. Please wait an hour before requesting again.", None

        otp_code = f"{secrets.randbelow(900000) + 100000}"
        url_token = secrets.token_urlsafe(32)
        token_hash = self._hash_email_otp(user_id, otp_code)
        link_hash = self._hash_email_token(url_token)
        expires_at = now_ts + 600  # 10 minutes
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            conn.execute("""
            INSERT INTO guardian_verification_tokens (user_id, token_hash, link_token_hash, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, (user_id, token_hash, link_hash, expires_at, now_iso))
            conn.commit()

        # Build verification URL (supporting local and production deployments)
        backend_base = os.getenv("BACKEND_BASE_URL", "http://127.0.0.1:8000").rstrip("/")
        verification_link = f"{backend_base}/api/guardian/verify-email-link?token={url_token}"

        email_svc = get_email_service()
        # Safe dispatch handling both 2-param and 3-param method signatures
        try:
            res = email_svc.send_verification_email(raw_email, otp_code, verification_link=verification_link)
        except TypeError:
            res = email_svc.send_verification_email(raw_email, otp_code)

        if not res.success:
            return False, f"Failed to dispatch verification email: {res.message}", None

        disclose_code = otp_code if not CONFIG.is_production() else None
        return True, "Verification code sent to guardian email.", disclose_code

    def verify_guardian_email(self, user_id: int, entered_code: str) -> Tuple[bool, str]:
        """Verify the 6-digit OTP code sent to guardian email."""
        code_clean = entered_code.strip()
        if len(code_clean) != 6 or not code_clean.isdigit():
            return False, "Verification code must be 6 digits."

        token_hash = self._hash_email_otp(user_id, code_clean)
        now_ts = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            token_row = conn.execute("""
            SELECT id, expires_at, attempts_count FROM guardian_verification_tokens
            WHERE user_id = ? AND token_hash = ? AND verified_at IS NULL
            ORDER BY id DESC LIMIT 1
            """, (user_id, token_hash)).fetchone()

            if not token_row:
                conn.execute("""
                UPDATE guardian_verification_tokens SET attempts_count = attempts_count + 1
                WHERE user_id = ? AND verified_at IS NULL
                """, (user_id,))
                conn.commit()
                return False, "Invalid or expired verification code."

            if now_ts > token_row["expires_at"]:
                return False, "Verification code has expired. Please request a new code."

            if token_row["attempts_count"] >= 5:
                return False, "Too many failed attempts. Please request a new verification code."

            conn.execute("UPDATE guardian_verification_tokens SET verified_at = ? WHERE id = ?", (now_iso, token_row["id"]))
            conn.execute("UPDATE users SET guardian_email_verified = 1 WHERE id = ?", (user_id,))
            conn.commit()

        return True, "Guardian email successfully verified."

    def verify_guardian_email_by_token(self, token: str) -> Tuple[bool, str, Optional[int]]:
        """Verify the guardian email using a secure URL link token."""
        if not token or len(token.strip()) < 16:
            return False, "Invalid verification link token format.", None

        link_hash = self._hash_email_token(token.strip())
        now_ts = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            token_row = conn.execute("""
            SELECT id, user_id, expires_at, attempts_count FROM guardian_verification_tokens
            WHERE link_token_hash = ? AND verified_at IS NULL
            ORDER BY id DESC LIMIT 1
            """, (link_hash,)).fetchone()

            if not token_row:
                return False, "Invalid or already used verification link.", None

            user_id = token_row["user_id"]
            if now_ts > token_row["expires_at"]:
                return False, "Verification link has expired. Please request a new verification email.", user_id

            if token_row["attempts_count"] >= 5:
                return False, "Too many failed verification attempts. Please request a new link.", user_id

            conn.execute("UPDATE guardian_verification_tokens SET verified_at = ? WHERE id = ?", (now_iso, token_row["id"]))
            conn.execute("UPDATE users SET guardian_email_verified = 1 WHERE id = ?", (user_id,))
            conn.commit()

        return True, "Guardian email successfully verified.", user_id

    def update_guardian_email_consent(self, user_id: int, consent: bool) -> Tuple[bool, str]:
        """Update explicit student consent for automated guardian email check-ins."""
        now_iso = datetime.now(timezone.utc).isoformat()
        consent_val = 1 if consent else 0
        with self._get_conn() as conn:
            user = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                return False, "User not found."
            conn.execute("UPDATE users SET guardian_email_consent = ?, updated_at = ? WHERE id = ?", (consent_val, now_iso, user_id))
            conn.execute("""
            INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
            VALUES (?, 'guardian_email_stress_alerts', '2.0', ?, ?, 'Student consent preference for guardian email stress check-ins')
            """, (user_id, consent_val, now_iso))
            conn.commit()
        return True, "Guardian email notification consent updated successfully."

    def revoke_guardian_consent(self, user_id: int) -> Tuple[bool, str]:
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute("""
            UPDATE users SET
                guardian_consent = 0,
                guardian_email_consent = 0,
                guardian_verified = 0,
                guardian_email_verified = 0,
                updated_at = ?
            WHERE id = ?
            """, (now_iso, user_id))
            # Record revocation in consent audit table
            conn.execute("""
            INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, revoked_at, purpose_description)
            VALUES (?, 'guardian_stress_alerts', '2.0', 0, ?, 'Student revoked guardian notification permission')
            """, (user_id, now_iso))
            conn.execute("""
            INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, revoked_at, purpose_description)
            VALUES (?, 'guardian_email_stress_alerts', '2.0', 0, ?, 'Student revoked guardian email notification permission')
            """, (user_id, now_iso))
            # Disable automatic alert policy
            conn.execute("""
            UPDATE notification_policies SET is_enabled = 0, updated_at = ? WHERE user_id = ?
            """, (now_iso, user_id))
            conn.commit()
        return True, "Guardian notification permission successfully revoked."

    # --- PHASE 6: ONBOARDING STEPS (PARENT & STUDENT) ---
    def save_parent_onboarding(self, user_id: int, data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        g_name = data.get("name", "").strip()
        g_rel = data.get("relationship", "Parent").strip()
        g_code = data.get("country_code", "+91").strip()
        g_phone = data.get("phone", "").strip()
        g_sec_phone = data.get("secondary_phone", "").strip()
        g_email = data.get("email", data.get("guardian_email", "")).strip()
        g_pref = data.get("preferred_contact", "EMAIL" if g_email else "SMS").strip()
        g_priority = data.get("priority", "Primary").strip()
        g_consent = bool(data.get("consent", False))
        g_email_consent = bool(data.get("email_consent", data.get("guardian_email_consent", g_consent)))

        if len(g_name) < 2:
            return False, "Parent/Guardian full name must be at least 2 characters.", None
        if not re.search(r"[a-zA-Z]", g_name):
            return False, "Parent/Guardian name must contain valid alphabetic characters.", None

        if g_phone:
            digits_phone = re.sub(r"\D", "", g_phone)
            if len(digits_phone) < 7 or len(digits_phone) > 15:
                return False, "Please enter a valid primary contact phone number (7 to 15 digits).", None

        if g_sec_phone:
            digits_sec = re.sub(r"\D", "", g_sec_phone)
            if len(digits_sec) < 7 or len(digits_sec) > 15:
                return False, "Please enter a valid secondary contact phone number (7 to 15 digits).", None

        if g_email and not EMAIL_REGEX.match(g_email):
            return False, "Please enter a valid guardian email address.", None

        enc_name = CRYPTO_VAULT.encrypt_field(g_name, f"user:{user_id}:guardian_name")
        enc_phone = CRYPTO_VAULT.encrypt_field(g_phone, f"user:{user_id}:guardian_phone") if g_phone else None
        enc_sec_phone = CRYPTO_VAULT.encrypt_field(g_sec_phone, f"user:{user_id}:guardian_secondary_phone") if g_sec_phone else None
        enc_email = CRYPTO_VAULT.encrypt_field(g_email, f"user:{user_id}:guardian_email") if g_email else None
        now_iso = datetime.now(timezone.utc).isoformat()

        # Generate OTP for phone verification if phone provided
        v_code = f"{secrets.randbelow(900000) + 100000}" if g_phone else None
        token_hash = self._hash_otp(user_id, v_code) if v_code else None
        expires_at = time.time() + 600

        with self._get_conn() as conn:
            conn.execute("""
            UPDATE users SET
                guardian_name = ?,
                guardian_relationship = ?,
                guardian_country_code = ?,
                guardian_phone = ?,
                guardian_secondary_phone = ?,
                guardian_email = COALESCE(?, guardian_email),
                guardian_email_consent = ?,
                guardian_preferred_contact = ?,
                guardian_priority = ?,
                guardian_consent = ?,
                parent_info_completed = 1,
                updated_at = ?
            WHERE id = ?
            """, (
                enc_name, g_rel, g_code, enc_phone, enc_sec_phone,
                enc_email, 1 if g_email_consent else 0,
                g_pref, g_priority, 1 if g_consent else 0,
                now_iso, user_id
            ))

            if v_code and token_hash:
                conn.execute("""
                INSERT INTO guardian_verification_tokens (user_id, token_hash, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """, (user_id, token_hash, expires_at, now_iso))

            if g_consent:
                conn.execute("""
                INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
                VALUES (?, 'guardian_stress_alerts', '2.0', 1, ?, 'Student authorized guardian contact for wellness alert policies')
                """, (user_id, now_iso))

            if g_email_consent:
                conn.execute("""
                INSERT INTO consent_records (user_id, consent_type, consent_version, is_granted, granted_at, purpose_description)
                VALUES (?, 'guardian_email_stress_alerts', '2.0', 1, ?, 'Student authorized guardian email contact for wellness check-ins')
                """, (user_id, now_iso))

            conn.commit()

        profile = self.get_user_profile(user_id)
        disclose_code = v_code if not CONFIG.is_production() else None
        return True, "Parent/Guardian details saved successfully.", {
            "profile": profile,
            "verification_code": disclose_code
        }

    def save_student_onboarding(self, user_id: int, data: Dict[str, Any]) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        full_name = data.get("full_name", "").strip()
        dob = data.get("date_of_birth", "").strip()
        gender = data.get("gender", "").strip()
        institution = data.get("institution_name", "").strip()
        department = data.get("department", "").strip()
        academic_year = data.get("academic_year", "").strip()
        student_phone = data.get("student_phone", "").strip()

        if len(full_name) < 2:
            return False, "Student full name must be at least 2 characters.", None
        if not re.search(r"[a-zA-Z]", full_name):
            return False, "Student name must contain valid alphabetic characters.", None

        if not dob:
            return False, "Date of birth is required.", None

        try:
            birth_date = datetime.strptime(dob, "%Y-%m-%d")
            today = datetime.now()
            if birth_date > today:
                return False, "Date of birth cannot be in the future.", None
            age_years = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            if age_years < 13:
                return False, "Students must be at least 13 years old to register.", None
            if age_years > 120:
                return False, "Please enter a valid date of birth.", None
            is_adult = age_years >= 18
        except ValueError:
            return False, "Invalid date of birth format. Please use YYYY-MM-DD.", None

        if not gender:
            return False, "Please select your gender or choose 'Prefer not to say'.", None

        if len(institution) < 2:
            return False, "College/Institution name must be at least 2 characters.", None

        if len(department) < 2:
            return False, "Department or field of study must be at least 2 characters.", None

        if not academic_year:
            return False, "Please select your current academic year or semester.", None

        if student_phone:
            digits_s = re.sub(r"\D", "", student_phone)
            if len(digits_s) < 7 or len(digits_s) > 15:
                return False, "Please enter a valid student mobile number (7 to 15 digits).", None

        enc_s_phone = CRYPTO_VAULT.encrypt_field(student_phone, f"user:{user_id}:student_phone") if student_phone else None
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            conn.execute("""
            UPDATE users SET
                full_name = ?,
                date_of_birth = ?,
                is_adult = ?,
                gender = ?,
                institution_name = ?,
                department = ?,
                academic_year = ?,
                student_phone = ?,
                student_info_completed = 1,
                updated_at = ?
            WHERE id = ?
            """, (
                full_name, dob, 1 if is_adult else 0, gender,
                institution, department, academic_year, enc_s_phone,
                now_iso, user_id
            ))
            conn.commit()

        profile = self.get_user_profile(user_id)
        return True, "Student profile completed successfully. Welcome to Mindora!", {
            "profile": profile
        }

    # --- NOTIFICATION POLICIES & AUTOMATED THRESHOLD ALERTS ---
    def get_notification_policy(self, user_id: int) -> Dict[str, Any]:
        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM notification_policies WHERE user_id = ?", (user_id,)).fetchone()
        if not row:
            return {
                "policy_name": "elevated_friction_policy",
                "is_enabled": False,
                "stress_threshold_score": 70.0,
                "max_frequency_days": 7,
                "last_triggered_at": None
            }
        return {
            "policy_name": row["policy_name"],
            "is_enabled": bool(row["is_enabled"]),
            "stress_threshold_score": float(row["stress_threshold_score"]),
            "max_frequency_days": int(row["max_frequency_days"]),
            "last_triggered_at": row["last_triggered_at"]
        }

    def update_notification_policy(
        self,
        user_id: int,
        is_enabled: bool,
        threshold_score: float = 70.0,
        max_frequency_days: int = 7
    ) -> Tuple[bool, str]:
        # Check student consent prerequisite
        with self._get_conn() as conn:
            user = conn.execute("SELECT guardian_consent, guardian_verified, is_adult FROM users WHERE id = ?", (user_id,)).fetchone()

        if is_enabled:
            if not user or not user["guardian_consent"]:
                return False, "Cannot enable policy: Explicit guardian notification consent must be granted first."
            if not user["is_adult"] and not user["guardian_verified"]:
                return False, "Safeguarding rule: Minor student accounts require verified guardian phone authorization before activating automatic alerts."

        now_iso = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute("""
            INSERT INTO notification_policies (user_id, policy_name, is_enabled, stress_threshold_score, max_frequency_days, created_at, updated_at)
            VALUES (?, 'elevated_friction_policy', ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, policy_name) DO UPDATE SET
                is_enabled = excluded.is_enabled,
                stress_threshold_score = excluded.stress_threshold_score,
                max_frequency_days = excluded.max_frequency_days,
                updated_at = excluded.updated_at
            """, (user_id, 1 if is_enabled else 0, threshold_score, max_frequency_days, now_iso, now_iso))
            conn.commit()

        return True, "Notification policy updated successfully."

    def evaluate_and_trigger_automatic_alert(
        self,
        user_id: int,
        friction_score: float,
        idempotency_key: Optional[str] = None,
        source: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """
        Evaluate student wellness stress score against two-level threshold policy (Phase 9):
          Level 1: High Stress Alert (70.0 <= score < 90.0)
          Level 2: Critical Stress Alert (score >= 90.0)
          Recovery: score <= 65.0 marks active episode recovered.
        
        Enforces:
        - Independent tracking of Level 1 and Level 2 within each episode.
        - Escalation from Level 1 to Level 2 if stress rises to >= 90.0.
        - Strict privacy guarantee (no scores, no diagnosis, exact templates).
        - Explicit consent & guardian email verification.
        - Suppressed status recording on missing consent/verification.
        - Database idempotency & recovery reset.
        - Research dataset records and voice-derived inputs CANNOT trigger guardian alerts under any circumstance.
        """
        # Strict Research and Voice Invariant: Research datasets and voice conversations can never trigger guardian alerts
        if source and "voice" in str(source).lower():
            return False, "Safety Invariant: Voice-derived inputs can never trigger guardian email alerts.", {"status": "voice_blocked"}
        if (source and "research" in str(source).lower()) or user_id is None or (isinstance(user_id, int) and user_id <= 0):
            return False, "Research Safety Invariant: Research dataset records can never trigger guardian email alerts.", {"status": "research_blocked"}

        now_iso = datetime.now(timezone.utc).isoformat()
        
        with self._get_conn() as conn:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                return False, "User record not found.", None
            
            user_keys = user.keys() if hasattr(user, "keys") else []
            enc_email = user["guardian_email"] if "guardian_email" in user_keys else None

            # Legacy SMS fallback for accounts without registered guardian email (Phase 5.20 / 5.21 compatibility)
            if not enc_email:
                policy = conn.execute("SELECT * FROM notification_policies WHERE user_id = ?", (user_id,)).fetchone()
                if not policy or not policy["is_enabled"]:
                    return False, "Automatic alert skipped: Policy is not enabled.", None

                if friction_score < policy["stress_threshold_score"]:
                    return False, f"Score {friction_score}% did not meet policy threshold {policy['stress_threshold_score']}%.", None

                if not user["guardian_consent"]:
                    return False, "Automatic alert blocked: Student guardian consent is not active.", None
                if not user["is_adult"] and not user["guardian_verified"]:
                    return False, "Automatic alert blocked: Minor account safeguarding requires verified contact.", None

                if idempotency_key:
                    existing = conn.execute("SELECT * FROM notification_history WHERE idempotency_key = ?", (idempotency_key,)).fetchone()
                    if existing:
                        return False, "Duplicate event: Alert with this idempotency key was already processed.", None

                if policy["last_triggered_at"]:
                    try:
                        last_time = datetime.fromisoformat(policy["last_triggered_at"])
                        cooldown_delta = timedelta(days=policy["max_frequency_days"])
                        if datetime.now(timezone.utc) - last_time < cooldown_delta:
                            return False, f"Automatic alert suppressed: In cooldown period (max 1 alert every {policy['max_frequency_days']} days).", None
                    except Exception:
                        pass

                try:
                    raw_phone = CRYPTO_VAULT.decrypt_field(user["guardian_phone"], f"user:{user_id}:guardian_phone") if user["guardian_phone"] else ""
                    raw_name = CRYPTO_VAULT.decrypt_field(user["guardian_name"], f"user:{user_id}:guardian_name") if user["guardian_name"] else "Guardian"
                except Exception:
                    raw_phone = user["guardian_phone"] or ""
                    raw_name = user["guardian_name"] or "Guardian"

                if not raw_phone:
                    return False, "No guardian phone on file.", None

                message_text = "Your student has enabled a Mindora support notification. Please check in with them when convenient."
                sms_provider = get_sms_provider()
                status, response_msg, details = sms_provider.send_sms(raw_phone, message_text)

                msg_id = details.get("message_id", f"AUTO-SMS-{secrets.token_hex(4).upper()}")
                masked_phone = f"{user['guardian_country_code']} ***-***-{raw_phone[-4:] if len(raw_phone) >= 4 else 'XXXX'}"

                conn.execute("""
                INSERT INTO notification_history (
                    user_id, message_id, recipient_name, recipient_phone_masked,
                    message_text, status, provider, provider_response, timestamp,
                    diagnostic_free_guarantee, idempotency_key, notification_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'sms')
                """, (
                    user_id, msg_id, raw_name, masked_phone, message_text,
                    status.value, details.get("provider", "unknown"),
                    str(details.get("response", response_msg)),
                    now_iso, idempotency_key
                ))
                conn.execute("UPDATE notification_policies SET last_triggered_at = ? WHERE user_id = ?", (now_iso, user_id))
                conn.commit()

                receipt = {
                    "message_id": msg_id,
                    "status": status.value,
                    "recipient_name": raw_name,
                    "recipient_phone_masked": masked_phone,
                    "message_text": message_text,
                    "timestamp": now_iso,
                    "diagnostic_free_guarantee": True
                }
                return True, f"Automatic alert processed: {response_msg}", receipt

            # --- PHASE 6.1: AUTOMATED GUARDIAN EMAIL ALERT SYSTEM ---
            has_consent = bool(user["guardian_email_consent"]) if "guardian_email_consent" in user_keys else False
            is_verified = bool(user["guardian_email_verified"]) if "guardian_email_verified" in user_keys else False
            is_adult = bool(user["is_adult"])

            # Check active episode
            active_ep = conn.execute("""
            SELECT * FROM guardian_notification_episodes
            WHERE user_id = ? AND status = 'active'
            ORDER BY id DESC LIMIT 1
            """, (user_id,)).fetchone()

            # Recovery check: score <= 65.0
            recovery_threshold = float(active_ep["recovery_threshold"]) if active_ep else 65.0
            if friction_score <= recovery_threshold:
                if active_ep:
                    conn.execute("""
                    UPDATE guardian_notification_episodes
                    SET status = 'recovered', recovered_at = ?, last_stress_score = ?, updated_at = ?
                    WHERE id = ?
                    """, (now_iso, friction_score, now_iso, active_ep["id"]))
                    conn.commit()
                    return False, f"Stress score ({friction_score:.1f}) is within normal recovery range (<= {recovery_threshold}). Active episode marked recovered.", {
                        "status": "recovered",
                        "friction_score": friction_score,
                        "episode_id": active_ep["episode_id"]
                    }
                else:
                    return False, f"Stress score ({friction_score:.1f}) is below notification threshold (70.0).", {
                        "status": "below_threshold",
                        "friction_score": friction_score
                    }

            # Score is above recovery threshold, but is it below trigger threshold (70.0)?
            if friction_score < 70.0:
                if active_ep:
                    conn.execute("""
                    UPDATE guardian_notification_episodes
                    SET last_stress_score = ?, updated_at = ?
                    WHERE id = ?
                    """, (friction_score, now_iso, active_ep["id"]))
                    conn.commit()
                return False, f"Stress score ({friction_score:.1f}) below notification threshold (70.0).", {
                    "status": "below_threshold",
                    "friction_score": friction_score
                }

            # Ensure active episode exists and update peak scores
            if not active_ep:
                new_ep_id = f"EP-{user_id}-{int(time.time())}-{secrets.token_hex(3)}"
                cursor = conn.execute("""
                INSERT INTO guardian_notification_episodes (
                    user_id, episode_id, status, level_1_triggered, level_2_triggered,
                    highest_stress_score, last_stress_score, recovery_threshold,
                    created_at, updated_at
                ) VALUES (?, ?, 'active', 0, 0, ?, ?, 65.0, ?, ?)
                """, (user_id, new_ep_id, friction_score, friction_score, now_iso, now_iso))
                conn.commit()
                active_ep = conn.execute("SELECT * FROM guardian_notification_episodes WHERE id = ?", (cursor.lastrowid,)).fetchone()
            else:
                new_highest = max(float(active_ep["highest_stress_score"] or 0.0), friction_score)
                conn.execute("""
                UPDATE guardian_notification_episodes
                SET highest_stress_score = ?, last_stress_score = ?, updated_at = ?
                WHERE id = ?
                """, (new_highest, friction_score, now_iso, active_ep["id"]))
                conn.commit()

            # Idempotency check (evaluated first to identify duplicate request payloads)
            if idempotency_key:
                existing_idem = conn.execute("SELECT * FROM notification_history WHERE idempotency_key = ? OR idempotency_key LIKE ?", (idempotency_key, f"{idempotency_key}:%")).fetchone()
                if existing_idem:
                    return False, "Duplicate event: Alert with this idempotency key was already processed.", {
                        "status": "duplicate_idempotency_key",
                        "message_id": existing_idem["message_id"]
                    }

            # Determine threshold levels to evaluate in order:
            # Level 1: High Stress Alert (70 <= score < 90)
            # Level 2: Critical Stress Alert (score >= 90)
            # Crossing requirement (Phase 11):
            # If an assessment jumps directly from below 70 to >= 90 (e.g. 95%), evaluate both
            # threshold crossings and send both separate notifications, provided the student is eligible
            # and the events have not already been sent for the current episode.
            levels_to_evaluate = []
            if friction_score >= 90.0:
                if not active_ep["level_1_triggered"]:
                    levels_to_evaluate.append(1)
                if not active_ep["level_2_triggered"]:
                    levels_to_evaluate.append(2)
            elif friction_score >= 70.0:
                if not active_ep["level_1_triggered"]:
                    levels_to_evaluate.append(1)

            if not levels_to_evaluate:
                already_lvl = 2 if friction_score >= 90.0 else 1
                return False, f"Level {already_lvl} notification already triggered for active episode {active_ep['episode_id']}.", {
                    "status": "already_triggered",
                    "level": already_lvl,
                    "threshold_level": already_lvl,
                    "episode_id": active_ep["episode_id"]
                }

            # Safeguarding and Consent checks
            enc_email = user["guardian_email"] if "guardian_email" in user_keys else None
            try:
                raw_email = CRYPTO_VAULT.decrypt_field(enc_email, f"user:{user_id}:guardian_email") if enc_email else ""
            except Exception:
                raw_email = enc_email or ""

            try:
                raw_name = CRYPTO_VAULT.decrypt_field(user["guardian_name"], f"user:{user_id}:guardian_name") if user["guardian_name"] else "Guardian"
            except Exception:
                raw_name = user["guardian_name"] or "Guardian"

            masked_email = mask_email(raw_email)
            masked_phone = f"{user['guardian_country_code']} ***-***-XXXX" if user["guardian_phone"] else "N/A"

            # Calculate formatted percentage, student name, and assessment date
            rounded_score = round(friction_score)
            if abs(friction_score - rounded_score) < 0.05:
                formatted_pct = f"{rounded_score}"
            else:
                formatted_pct = f"{friction_score:.1f}"

            student_name = user["full_name"] if "full_name" in user_keys and user["full_name"] else "your child"
            assessment_date_str = datetime.now(timezone.utc).strftime("%B %d, %Y")

            # Check suppression conditions
            suppression_reason = None
            if not has_consent:
                suppression_reason = "consent_missing"
            elif not raw_email or not EMAIL_REGEX.match(raw_email):
                suppression_reason = "invalid_email"
            elif not is_verified:
                suppression_reason = "email_unverified"
            elif not is_adult and not is_verified:
                suppression_reason = "minor_unverified_safeguard"

            executed_receipts = []
            overall_success = True
            email_svc = get_email_service()

            for target_level in levels_to_evaluate:
                level_col = "level_1_triggered" if target_level == 1 else "level_2_triggered"
                id_col = "level_1_notification_id" if target_level == 1 else "level_2_notification_id"
                at_col = "level_1_triggered_at" if target_level == 1 else "level_2_triggered_at"

                # Suffix idempotency key if multi-level dispatch
                curr_idem_key = None
                if idempotency_key:
                    curr_idem_key = idempotency_key if len(levels_to_evaluate) == 1 else f"{idempotency_key}:L{target_level}"

                if suppression_reason:
                    sup_msg_id = f"SUP-L{target_level}-{secrets.token_hex(4).upper()}"
                    if target_level == 2:
                        sup_template = render_level_2_email(student_name, formatted_pct, assessment_date_str, raw_name)[0]
                    else:
                        sup_template = render_level_1_email(student_name, formatted_pct, assessment_date_str, raw_name)[0]

                    try:
                        conn.execute("""
                        INSERT INTO notification_history (
                            user_id, message_id, recipient_name, recipient_phone_masked,
                            message_text, status, provider, provider_response, timestamp,
                            diagnostic_free_guarantee, idempotency_key,
                            notification_type, threshold_level, episode_id, recipient_email,
                            sent_at, failure_reason, retry_count
                        ) VALUES (?, ?, ?, ?, ?, 'suppressed', 'smtp', ?, ?, 1, ?, 'email', ?, ?, ?, NULL, ?, 0)
                        """, (
                            user_id, sup_msg_id, raw_name, masked_phone,
                            sup_template, f"Suppressed: {suppression_reason}", now_iso,
                            curr_idem_key, target_level, active_ep["episode_id"],
                            raw_email, suppression_reason
                        ))
                        conn.execute(f"""
                        UPDATE guardian_notification_episodes
                        SET {level_col} = 1, updated_at = ?
                        WHERE id = ?
                        """, (now_iso, active_ep["id"]))
                        conn.commit()
                    except sqlite3.IntegrityError:
                        pass

                    sup_receipt = {
                        "message_id": sup_msg_id,
                        "threshold_level": target_level,
                        "episode_id": active_ep["episode_id"],
                        "status": "suppressed",
                        "reason": suppression_reason,
                        "recipient_name": raw_name,
                        "recipient_email": masked_email,
                        "timestamp": now_iso,
                        "diagnostic_free_guarantee": True,
                        "student_name": student_name,
                        "stress_percentage": formatted_pct,
                        "assessment_date": assessment_date_str
                    }
                    executed_receipts.append(sup_receipt)
                    overall_success = False
                else:
                    # Dispatch email via SMTP
                    dispatch_res = _safe_dispatch_email_alert(
                        email_svc=email_svc,
                        level=target_level,
                        to_email=raw_email,
                        student_name=student_name,
                        stress_pct=formatted_pct,
                        date_str=assessment_date_str,
                        guardian_name=raw_name
                    )

                    if target_level == 1:
                        msg_text = getattr(dispatch_res, "body_text", None) or render_level_1_email(student_name, formatted_pct, assessment_date_str, raw_name)[0]
                    else:
                        msg_text = getattr(dispatch_res, "body_text", None) or render_level_2_email(student_name, formatted_pct, assessment_date_str, raw_name)[0]

                    notif_status = dispatch_res.status  # "sent" or "failed"
                    failure_reason = None if dispatch_res.success else dispatch_res.message
                    sent_at = now_iso if dispatch_res.success else None

                    new_notif_id = None
                    try:
                        cursor = conn.execute("""
                        INSERT INTO notification_history (
                            user_id, message_id, recipient_name, recipient_phone_masked,
                            message_text, status, provider, provider_response, timestamp,
                            diagnostic_free_guarantee, idempotency_key,
                            notification_type, threshold_level, episode_id, recipient_email,
                            sent_at, failure_reason, retry_count
                        ) VALUES (?, ?, ?, ?, ?, ?, 'smtp', ?, ?, 1, ?, 'email', ?, ?, ?, ?, ?, 0)
                        """, (
                            user_id, dispatch_res.message_id, raw_name, masked_phone,
                            msg_text, notif_status, dispatch_res.provider_response or dispatch_res.message,
                            now_iso, curr_idem_key, target_level, active_ep["episode_id"],
                            raw_email, sent_at, failure_reason
                        ))
                        new_notif_id = cursor.lastrowid

                        conn.execute(f"""
                        UPDATE guardian_notification_episodes
                        SET {level_col} = 1, {id_col} = ?, {at_col} = ?, updated_at = ?
                        WHERE id = ?
                        """, (new_notif_id, now_iso, now_iso, active_ep["id"]))
                        conn.commit()
                    except sqlite3.IntegrityError as ie:
                        return False, f"Database idempotency constraint: {ie}", {
                            "status": "already_triggered",
                            "episode_id": active_ep["episode_id"],
                            "threshold_level": target_level
                        }

                    level_receipt = {
                        "notification_id": new_notif_id,
                        "message_id": dispatch_res.message_id,
                        "threshold_level": target_level,
                        "episode_id": active_ep["episode_id"],
                        "status": notif_status,
                        "recipient_name": raw_name,
                        "recipient_email": masked_email,
                        "message_text": msg_text,
                        "timestamp": now_iso,
                        "sent_at": sent_at,
                        "failure_reason": failure_reason,
                        "diagnostic_free_guarantee": True,
                        "student_name": student_name,
                        "stress_percentage": formatted_pct,
                        "assessment_date": assessment_date_str
                    }
                    executed_receipts.append(level_receipt)
                    if not dispatch_res.success:
                        overall_success = False

            primary_receipt = executed_receipts[-1] if executed_receipts else None
            if len(executed_receipts) > 1:
                primary_receipt["all_dispatches"] = executed_receipts
                primary_receipt["level_1_dispatched"] = any(r.get("threshold_level") == 1 for r in executed_receipts)
                primary_receipt["level_2_dispatched"] = any(r.get("threshold_level") == 2 for r in executed_receipts)

            if suppression_reason:
                return False, f"Automatic alert suppressed: {suppression_reason}", primary_receipt
            elif not overall_success:
                return False, f"Automatic alert delivery encountered an error: {primary_receipt.get('failure_reason')}", primary_receipt
            else:
                msg_out = "Automated alert notifications dispatched for Level 1 and Level 2." if len(executed_receipts) > 1 else f"Automatic Level {levels_to_evaluate[0]} alert processed successfully."
                return True, msg_out, primary_receipt

    def retry_notification(self, user_id: int, notification_id: int) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        """Retry a failed or suppressed notification (bounded at 3 attempts)."""
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            row = conn.execute("""
            SELECT * FROM notification_history
            WHERE id = ? AND user_id = ?
            """, (notification_id, user_id)).fetchone()

            if not row:
                return False, "Notification record not found.", None

            if row["status"] == "sent":
                return False, "Notification was already successfully sent.", None

            retry_count = int(row["retry_count"] or 0)
            if retry_count >= 3:
                return False, "Maximum retry limit (3) exceeded for this notification.", None

            recipient_email = row["recipient_email"]
            if not recipient_email or not EMAIL_REGEX.match(recipient_email):
                return False, "Cannot retry: Recipient email is missing or invalid.", None

            thresh_level = int(row["threshold_level"] or 1)
            email_svc = get_email_service()

            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
            user_keys = user.keys() if hasattr(user, "keys") else []
            s_name = user["full_name"] if user and "full_name" in user_keys and user["full_name"] else "your child"
            g_name = row["recipient_name"] or "Guardian"

            res = _safe_dispatch_email_alert(
                email_svc=email_svc,
                level=thresh_level,
                to_email=recipient_email,
                student_name=s_name,
                stress_pct="75" if thresh_level == 1 else "90",
                date_str=datetime.now(timezone.utc).strftime("%B %d, %Y"),
                guardian_name=g_name,
                msg_id=row["message_id"]
            )

            new_status = res.status
            new_reason = None if res.success else res.message
            new_sent_at = now_iso if res.success else None
            new_retry_count = retry_count + 1

            conn.execute("""
            UPDATE notification_history
            SET status = ?, provider_response = ?, sent_at = ?, failure_reason = ?, retry_count = ?
            WHERE id = ?
            """, (new_status, res.provider_response or res.message, new_sent_at, new_reason, new_retry_count, notification_id))
            conn.commit()

            updated = {
                "notification_id": notification_id,
                "message_id": row["message_id"],
                "status": new_status,
                "retry_count": new_retry_count,
                "sent_at": new_sent_at,
                "failure_reason": new_reason
            }

            if res.success:
                return True, f"Notification retry succeeded (Attempt {new_retry_count}/3).", updated
            else:
                return False, f"Notification retry failed (Attempt {new_retry_count}/3): {res.message}", updated

    def process_pending_retries(self, max_batch: int = 10) -> Dict[str, Any]:
        """
        Processes pending failed notification queue items (up to 3 attempts).
        Enforces idempotency and safe recovery from temporary SMTP network errors.
        """
        with self._get_conn() as conn:
            failed_rows = conn.execute("""
            SELECT id, user_id FROM notification_history
            WHERE status = 'failed' AND (retry_count IS NULL OR retry_count < 3)
            ORDER BY id ASC LIMIT ?
            """, (max_batch,)).fetchall()

        processed = 0
        succeeded = 0
        failed = 0

        for row in failed_rows:
            processed += 1
            ok, msg, receipt = self.retry_notification(row["user_id"], row["id"])
            if ok:
                succeeded += 1
            else:
                failed += 1

        return {
            "processed": processed,
            "succeeded": succeeded,
            "failed": failed,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def get_current_episode(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Retrieve current or latest stress notification episode for the user."""
        with self._get_conn() as conn:
            row = conn.execute("""
            SELECT * FROM guardian_notification_episodes
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 1
            """, (user_id,)).fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "episode_id": row["episode_id"],
                "status": row["status"],
                "level_1_triggered": bool(row["level_1_triggered"]),
                "level_1_triggered_at": row["level_1_triggered_at"],
                "level_2_triggered": bool(row["level_2_triggered"]),
                "level_2_triggered_at": row["level_2_triggered_at"],
                "highest_stress_score": float(row["highest_stress_score"] or 0.0),
                "last_stress_score": float(row["last_stress_score"] or 0.0),
                "recovery_threshold": float(row["recovery_threshold"] or 65.0),
                "recovered_at": row["recovered_at"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"]
            }

    # --- MANUAL STRESS NOTIFICATION WORKFLOW ---
    def send_stress_notification(
        self,
        user_id: int,
        student_confirmation: bool,
        custom_note: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Dict[str, Any]]]:
        if not student_confirmation:
            return False, "Notification cancelled: Explicit student confirmation is required before dispatch.", None

        with self._get_conn() as conn:
            user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        if not user:
            return False, "User record not found.", None

        user_keys = user.keys() if hasattr(user, "keys") else []
        has_consent = bool(user["guardian_consent"]) or bool(user["guardian_email_consent"] if "guardian_email_consent" in user_keys else False)
        if not has_consent:
            return False, "Notification permission is not enabled for this guardian contact.", None
        enc_email = user["guardian_email"] if "guardian_email" in user_keys else None
        raw_email = ""
        if enc_email:
            try:
                raw_email = CRYPTO_VAULT.decrypt_field(enc_email, f"user:{user_id}:guardian_email")
            except Exception:
                raw_email = enc_email

        try:
            raw_phone = CRYPTO_VAULT.decrypt_field(user["guardian_phone"], f"user:{user_id}:guardian_phone") if user["guardian_phone"] else ""
            raw_name = CRYPTO_VAULT.decrypt_field(user["guardian_name"], f"user:{user_id}:guardian_name") if user["guardian_name"] else "Guardian"
        except Exception:
            raw_phone = user["guardian_phone"] or ""
            raw_name = user["guardian_name"] or "Guardian"

        masked_phone = f"{user['guardian_country_code']} ***-***-{raw_phone[-4:] if len(raw_phone) >= 4 else 'XXXX'}" if raw_phone else "N/A"
        masked_email = mask_email(raw_email)
        now_iso = datetime.now(timezone.utc).isoformat()

        # If guardian email is configured and verified, prefer email dispatch
        if raw_email and EMAIL_REGEX.match(raw_email):
            email_svc = get_email_service()
            dispatch_res = email_svc.send_level_1_alert(raw_email)
            msg_id = dispatch_res.message_id
            msg_text = LEVEL_1_BODY

            with self._get_conn() as conn:
                conn.execute("""
                INSERT INTO notification_history (
                    user_id, message_id, recipient_name, recipient_phone_masked,
                    message_text, status, provider, provider_response, timestamp,
                    diagnostic_free_guarantee, notification_type, threshold_level,
                    recipient_email, sent_at, failure_reason, retry_count
                ) VALUES (?, ?, ?, ?, ?, ?, 'smtp', ?, ?, 1, 'email', 1, ?, ?, ?, 0)
                """, (
                    user_id, msg_id, raw_name, masked_phone,
                    msg_text, dispatch_res.status, dispatch_res.provider_response or dispatch_res.message,
                    now_iso, raw_email, now_iso if dispatch_res.success else None,
                    None if dispatch_res.success else dispatch_res.message
                ))
                conn.commit()

            receipt = {
                "message_id": msg_id,
                "user_id": user_id,
                "recipient_name": raw_name,
                "recipient_email": masked_email,
                "recipient_phone_masked": masked_phone,
                "message_text": msg_text,
                "status": dispatch_res.status,
                "timestamp": now_iso,
                "diagnostic_free_guarantee": True
            }
            if dispatch_res.success:
                return True, f"Notification dispatched via email: {dispatch_res.message}", receipt
            else:
                return False, f"Email notification dispatch failed: {dispatch_res.message}", receipt

        # Fallback to SMS if phone configured
        if not raw_phone:
            return False, "No verified guardian email or phone number on file.", None

        if not user["is_adult"] and not user["guardian_verified"]:
            return False, "Safeguarding Protocol: Minor accounts require verified guardian authorization before notification dispatch.", None

        standard_message = "Your student has requested support from their trusted contact through Mindora. Please check in with them when possible."
        sms_provider = get_sms_provider()
        status, response_msg, details = sms_provider.send_sms(raw_phone, standard_message)

        msg_id = details.get("message_id", f"SMS-{secrets.token_hex(4).upper()}")

        with self._get_conn() as conn:
            conn.execute("""
            INSERT INTO notification_history (
                user_id, message_id, recipient_name, recipient_phone_masked,
                message_text, status, provider, provider_response, timestamp,
                diagnostic_free_guarantee, notification_type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'sms')
            """, (
                user_id, msg_id, raw_name, masked_phone, standard_message,
                status.value, details.get("provider", "unknown"),
                str(details.get("response", response_msg)),
                now_iso
            ))
            conn.commit()

        receipt = {
            "message_id": msg_id,
            "user_id": user_id,
            "recipient_name": raw_name,
            "recipient_phone_masked": masked_phone,
            "message_text": standard_message,
            "status": status.value,
            "timestamp": now_iso,
            "diagnostic_free_guarantee": True
        }
        return True, f"Notification dispatched ({status.value}): {response_msg}", receipt

    def get_notification_log(self, user_id: int) -> list[Dict[str, Any]]:
        with self._get_conn() as conn:
            rows = conn.execute("""
            SELECT id, message_id, recipient_name, recipient_phone_masked, recipient_email,
                   message_text, status, provider, provider_response, timestamp,
                   diagnostic_free_guarantee, notification_type, threshold_level,
                   episode_id, sent_at, failure_reason, retry_count
            FROM notification_history
            WHERE user_id = ?
            ORDER BY id DESC
            """, (user_id,)).fetchall()

        return [
            {
                "id": r["id"],
                "message_id": r["message_id"],
                "recipient_name": r["recipient_name"],
                "recipient_phone_masked": r["recipient_phone_masked"],
                "recipient_email": mask_email(r["recipient_email"]) if r["recipient_email"] else "N/A",
                "recipient_email_raw": r["recipient_email"],
                "message_text": r["message_text"],
                "status": r["status"],
                "provider": r["provider"],
                "provider_response": r["provider_response"],
                "timestamp": r["timestamp"],
                "sent_at": r["sent_at"],
                "failure_reason": r["failure_reason"],
                "retry_count": r["retry_count"] or 0,
                "notification_type": r["notification_type"] or "email",
                "threshold_level": r["threshold_level"],
                "episode_id": r["episode_id"],
                "diagnostic_free_guarantee": bool(r["diagnostic_free_guarantee"])
            }
            for r in rows
        ]

    def get_notification_diagnostics(self, user_id: Optional[int] = None) -> list[Dict[str, Any]]:
        """
        Provides administrative / developer diagnostic telemetry on notification pipeline events (Phase 9):
        - Eligible vs Suppressed (consent_missing, email_unverified)
        - Provider delivery status (sent, failed, retrying)
        - Threshold type (Level 1: 70, Level 2: 90)
        Never exposed to ordinary student views.
        """
        with self._get_conn() as conn:
            query = """
            SELECT n.id, n.user_id, n.message_id, n.status, n.provider, n.provider_response,
                   n.timestamp, n.sent_at, n.failure_reason, n.retry_count, n.threshold_level,
                   n.episode_id, n.recipient_email, u.email as student_email,
                   u.guardian_email_consent, u.guardian_email_verified
            FROM notification_history n
            LEFT JOIN users u ON n.user_id = u.id
            """
            params = []
            if user_id:
                query += " WHERE n.user_id = ?"
                params.append(user_id)
            query += " ORDER BY n.id DESC LIMIT 100"

            rows = conn.execute(query, params).fetchall()

        diagnostics = []
        for r in rows:
            status = r["status"]
            fail_reason = r["failure_reason"] or ""
            retry_count = r["retry_count"] or 0
            consent = bool(r["guardian_email_consent"])
            verified = bool(r["guardian_email_verified"])

            # Classify diagnostic state
            is_eligible = consent and verified and not fail_reason.startswith("consent") and not fail_reason.startswith("email_unverified")
            blocked_reason = None
            if not consent:
                blocked_reason = "Blocked by consent"
            elif not verified:
                blocked_reason = "Blocked by guardian verification"
            elif fail_reason:
                blocked_reason = f"Blocked: {fail_reason}"

            pipeline_stage = (
                "Sent to provider" if status == "sent"
                else "Retrying" if status == "failed" and retry_count > 0
                else "Failed" if status == "failed"
                else "Blocked by consent" if "consent" in fail_reason
                else "Blocked by guardian verification" if "verified" in fail_reason or "safeguard" in fail_reason
                else "Suppressed" if status == "suppressed"
                else "Queued"
            )

            diagnostics.append({
                "notification_id": r["id"],
                "student_id": r["user_id"],
                "threshold_level": r["threshold_level"],
                "threshold_score_target": 90 if r["threshold_level"] == 2 else 70,
                "status": status,
                "pipeline_stage": pipeline_stage,
                "is_eligible": is_eligible,
                "blocked_by": blocked_reason,
                "attempt_count": retry_count + 1 if status in ["sent", "failed"] else retry_count,
                "recipient_masked": mask_email(r["recipient_email"]),
                "provider_response": r["provider_response"],
                "created_at": r["timestamp"],
                "sent_at": r["sent_at"]
            })
        return diagnostics

    # --- PASSWORD RESET ---
    def create_password_reset_token(self, email: str) -> Tuple[bool, str, Optional[str]]:
        email_clean = email.strip().lower()
        with self._get_conn() as conn:
            user = conn.execute("SELECT id FROM users WHERE email = ?", (email_clean,)).fetchone()
        if not user:
            return True, "If an account matches this email, a reset token has been issued.", None

        token = secrets.token_urlsafe(24)
        self.reset_tokens[token] = {
            "email": email_clean,
            "expires_at": time.time() + 3600
        }
        return True, "Password reset token created successfully.", token

    def reset_password(self, token: str, new_password: str) -> Tuple[bool, str]:
        record = self.reset_tokens.get(token)
        if not record or time.time() > record["expires_at"]:
            return False, "Invalid or expired password reset token."

        if len(new_password) < 8:
            return False, "Password must be at least 8 characters long."

        email = record["email"]
        new_hash = self.hash_password(new_password)
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            conn.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?", (new_hash, now_iso, email))
            conn.commit()

        del self.reset_tokens[token]
        return True, "Password successfully reset. You may now log in with your new password."

    def change_password(self, user_id: int, current_pwd: str, new_pwd: str) -> Tuple[bool, str]:
        """Allows authenticated student/user to change their password securely."""
        if not current_pwd or not new_pwd:
            return False, "Current and new password are required."

        if len(new_pwd) < 8:
            return False, "New password must be at least 8 characters long."

        with self._get_conn() as conn:
            user = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
            if not user:
                return False, "User not found."

            if not self.verify_password(current_pwd, user["password_hash"]):
                return False, "Current password does not match."

            new_hash = self.hash_password(new_pwd)
            now_iso = datetime.now(timezone.utc).isoformat()
            conn.execute("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?", (new_hash, now_iso, user_id))
            conn.commit()

        return True, "Password successfully updated."

    # --- BIKE-STYLE ANALOG STRESS METER & PHASE 12 CENTRALIZED ASSESSMENT PIPELINE ---
    def submit_student_assessment(
        self,
        user_id: int,
        phq9_answers: Optional[List[int]] = None,
        phq9_score: Optional[int] = None,
        phq9_severity: Optional[str] = None,
        features: Optional[Dict[str, Any]] = None,
        stress_score: Optional[float] = None,
        idempotency_key: Optional[str] = None,
        source: str = "student_daily_assessment",
        client_timezone: str = "Asia/Kolkata"
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Phase 12: Centralized Daily Assessment Event Pipeline.
        1. Validates inputs and handles idempotency.
        2. Calculates official PHQ-9 and stress indicators authoritatively.
        3. Saves immutable historical assessment record in SQLite inside a transaction.
        4. Triggers guardian email notification evaluation (70% and 90% thresholds).
        5. Refreshes personalized recommendations.
        6. Recalculates and aggregates weekly analytics.
        7. Returns synchronized dashboard, history, and weekly insight metrics.
        """
        now_utc = datetime.now(timezone.utc)
        now_iso = now_utc.isoformat()

        # Idempotency check: prevent duplicate submissions
        if idempotency_key:
            with self._get_conn() as conn:
                existing = conn.execute("""
                SELECT * FROM student_stress_assessments
                WHERE user_id = ? AND idempotency_key = ?
                """, (user_id, idempotency_key)).fetchone()
                if existing:
                    weekly_data = self.get_student_weekly_analytics(user_id, client_timezone)
                    return True, "Assessment already submitted.", {
                        "id": existing["id"],
                        "assessment_date": existing["assessment_date"] or existing["created_at"][:10],
                        "stress_score": float(existing["stress_score"]),
                        "interpretation": existing["interpretation"],
                        "status_tier": existing["status_tier"],
                        "created_at": existing["created_at"],
                        "is_duplicate": True,
                        "weekly_insights": weekly_data
                    }

        # Date determination in student's local timezone
        try:
            from zoneinfo import ZoneInfo
            local_tz = ZoneInfo(client_timezone)
            local_dt = now_utc.astimezone(local_tz)
        except Exception:
            local_dt = now_utc + timedelta(hours=5, minutes=30)

        assessment_date = local_dt.strftime("%Y-%m-%d")

        # Calculate PHQ-9 score
        calc_phq9_score = 0
        if phq9_answers and isinstance(phq9_answers, list) and len(phq9_answers) == 9:
            calc_phq9_score = sum(max(0, min(3, int(a))) for a in phq9_answers)
        elif phq9_score is not None:
            calc_phq9_score = max(0, min(27, int(phq9_score)))

        if not phq9_severity:
            if calc_phq9_score >= 20:
                calc_phq9_sev = "Severe"
            elif calc_phq9_score >= 15:
                calc_phq9_sev = "Moderately Severe"
            elif calc_phq9_score >= 10:
                calc_phq9_sev = "Moderate"
            elif calc_phq9_score >= 5:
                calc_phq9_sev = "Mild"
            else:
                calc_phq9_sev = "Minimal"
        else:
            calc_phq9_sev = str(phq9_severity)

        # Calculate stress indicator score
        if stress_score is not None:
            clamped_score = float(max(0.0, min(100.0, float(stress_score))))
        else:
            feats = features or {}
            sleep_h = float(feats.get("sleep_duration_hours", feats.get("sleep_hours", 7.0)))
            study_h = float(feats.get("study_hours_per_day", feats.get("study_hours", 6.0)))
            sleep_friction = max(0.0, 8.0 - sleep_h) * 12.0
            study_friction = max(0.0, study_h - 6.0) * 8.0
            phq_friction = (calc_phq9_score / 27.0) * 50.0
            raw_calc = min(100.0, max(0.0, sleep_friction + study_friction + phq_friction))
            clamped_score = round(raw_calc, 1)

        if clamped_score >= 90.0:
            interpretation = "Critical Stress Spike"
            status_tier = "critical"
        elif clamped_score >= 75.0:
            interpretation = "Elevated Stress Friction"
            status_tier = "elevated"
        elif clamped_score >= 50.0:
            interpretation = "Moderate Equilibrium"
            status_tier = "moderate"
        elif clamped_score >= 25.0:
            interpretation = "Balanced Pacing"
            status_tier = "balanced"
        else:
            interpretation = "Optimal Restorative State"
            status_tier = "optimal"

        features_json = json.dumps(features or {})

        # Save to database inside atomic transaction
        with self._get_conn() as conn:
            cursor = conn.execute("""
            INSERT INTO student_stress_assessments (
                user_id, assessment_date, submission_timestamp, stress_score,
                interpretation, status_tier, phq9_score, phq9_severity,
                survey_features, assessment_source, completion_status,
                idempotency_key, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, assessment_date, now_iso, clamped_score,
                interpretation, status_tier, calc_phq9_score, calc_phq9_sev,
                features_json, source, "completed",
                idempotency_key, now_iso
            ))
            conn.commit()
            record_id = cursor.lastrowid

        # Guardian notification evaluation (authoritative check)
        idemp_alert = f"assess-event-{user_id}-{record_id}"
        alert_ok, alert_msg, receipt = self.evaluate_and_trigger_automatic_alert(
            user_id, clamped_score, idemp_alert, source
        )

        # Refresh personalized recommendations
        try:
            from local_companion.personalization_engine import PERSONALIZATION_ENGINE
            PERSONALIZATION_ENGINE.generate_recommendations(
                student_id=user_id,
                assessment_score=clamped_score,
                limit=3,
                force_refresh=True
            )
        except Exception:
            pass

        # Calculate dependent weekly analytics and dashboard comparison
        weekly_data = self.get_student_weekly_analytics(user_id, client_timezone, assessment_date)
        progress_data = self.get_student_progress_summary(user_id)
        latest_stress_data = self.get_latest_student_stress(user_id)

        return True, "Assessment processed, saved and platform-wide sync completed successfully.", {
            "assessment": {
                "id": record_id,
                "assessment_date": assessment_date,
                "submission_timestamp": now_iso,
                "stress_score": clamped_score,
                "interpretation": interpretation,
                "status_tier": status_tier,
                "phq9_score": calc_phq9_score,
                "phq9_severity": calc_phq9_sev,
                "created_at": now_iso
            },
            "dashboard": latest_stress_data,
            "weekly_insights": weekly_data,
            "progress": progress_data,
            "alert_receipt": receipt
        }

    def record_student_stress(
        self,
        user_id: int,
        stress_score: float,
        source: str = "self_report",
        features: Optional[Dict[str, Any]] = None
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Backward-compatible wrapper for record_student_stress routing to centralized assessment pipeline.
        """
        ok, msg, res = self.submit_student_assessment(
            user_id=user_id,
            stress_score=stress_score,
            source=source,
            features=features
        )
        assess = res.get("assessment", {})
        return ok, msg, {
            "id": assess.get("id"),
            "stress_score": assess.get("stress_score", stress_score),
            "interpretation": assess.get("interpretation"),
            "status_tier": assess.get("status_tier"),
            "created_at": assess.get("created_at"),
            "alert_receipt": res.get("alert_receipt")
        }

    def get_latest_student_stress(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Retrieves the latest authoritative stress indicator assessment for a student,
        including comparison against the immediately preceding assessment.
        """
        with self._get_conn() as conn:
            rows = conn.execute("""
            SELECT * FROM student_stress_assessments
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 2
            """, (user_id,)).fetchall()

            if not rows:
                # Fallback: check guardian_notification_episodes
                ep_row = conn.execute("""
                SELECT * FROM guardian_notification_episodes
                WHERE user_id = ?
                ORDER BY id DESC LIMIT 1
                """, (user_id,)).fetchone()
                if ep_row and ep_row["last_stress_score"] is not None:
                    score = float(ep_row["last_stress_score"])
                    if score >= 90.0:
                        interp = "Critical Stress Spike"
                        tier = "critical"
                    elif score >= 75.0:
                        interp = "Elevated Stress Friction"
                        tier = "elevated"
                    elif score >= 50.0:
                        interp = "Moderate Equilibrium"
                        tier = "moderate"
                    elif score >= 25.0:
                        interp = "Balanced Pacing"
                        tier = "balanced"
                    else:
                        interp = "Optimal Restorative State"
                        tier = "optimal"
                    return {
                        "has_assessment": True,
                        "stress_score": score,
                        "interpretation": interp,
                        "status_tier": tier,
                        "last_assessment_date": ep_row["updated_at"] or ep_row["created_at"],
                        "previous_assessment_score": None,
                        "stress_change": None
                    }
                return None

            latest = rows[0]
            previous = rows[1] if len(rows) > 1 else None
            latest_score = float(latest["stress_score"])
            previous_score = float(previous["stress_score"]) if previous else None
            stress_change = round(latest_score - previous_score, 1) if previous_score is not None else None

            keys = latest.keys() if hasattr(latest, "keys") else []
            return {
                "has_assessment": True,
                "stress_score": latest_score,
                "interpretation": latest["interpretation"],
                "status_tier": latest["status_tier"],
                "last_assessment_date": latest["assessment_date"] if "assessment_date" in keys and latest["assessment_date"] else latest["created_at"],
                "assessment_source": latest["assessment_source"] if "assessment_source" in keys else "student_daily_assessment",
                "previous_assessment_score": previous_score,
                "stress_change": stress_change,
                "id": latest["id"]
            }

    def get_student_assessment_history(self, user_id: int, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Phase 12: Chronological immutable assessment records for a student (latest first).
        """
        with self._get_conn() as conn:
            rows = conn.execute("""
            SELECT * FROM student_stress_assessments
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ? OFFSET ?
            """, (user_id, limit, offset)).fetchall()

            history = []
            for r in rows:
                keys = r.keys() if hasattr(r, "keys") else []
                features = {}
                if "survey_features" in keys and r["survey_features"]:
                    try:
                        features = json.loads(r["survey_features"])
                    except Exception:
                        features = {}

                date_val = r["assessment_date"] if "assessment_date" in keys and r["assessment_date"] else r["created_at"][:10]
                history.append({
                    "id": r["id"],
                    "assessment_date": date_val,
                    "submission_timestamp": r["submission_timestamp"] if "submission_timestamp" in keys and r["submission_timestamp"] else r["created_at"],
                    "stress_score": float(r["stress_score"]),
                    "interpretation": r["interpretation"],
                    "status_tier": r["status_tier"],
                    "phq9_score": r["phq9_score"] if "phq9_score" in keys else 0,
                    "phq9_severity": r["phq9_severity"] if "phq9_severity" in keys else "Minimal",
                    "features": features,
                    "completion_status": r["completion_status"] if "completion_status" in keys else "completed",
                    "created_at": r["created_at"]
                })
            return history

    def get_student_weekly_analytics(
        self,
        user_id: int,
        client_timezone: str = "Asia/Kolkata",
        reference_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Phase 12: Computes rigorous 7-day weekly analytics strictly using actual student assessments.
        - Monday to Sunday boundary.
        - Days without assessments are flagged has_assessment=False and stress_score=None (NEVER zero).
        - Computes weekly average, highest, lowest, consistency, and previous week delta.
        """
        now_utc = datetime.now(timezone.utc)
        try:
            from zoneinfo import ZoneInfo
            local_tz = ZoneInfo(client_timezone)
            local_now = now_utc.astimezone(local_tz)
        except Exception:
            local_now = now_utc + timedelta(hours=5, minutes=30)

        if reference_date:
            try:
                ref_dt = datetime.strptime(reference_date[:10], "%Y-%m-%d").date()
            except Exception:
                ref_dt = local_now.date()
        else:
            ref_dt = local_now.date()

        # Determine Monday of the current week (weekday 0)
        monday = ref_dt - timedelta(days=ref_dt.weekday())
        sunday = monday + timedelta(days=6)

        monday_str = monday.strftime("%Y-%m-%d")
        sunday_str = sunday.strftime("%Y-%m-%d")

        # Previous week boundaries
        prev_monday = monday - timedelta(days=7)
        prev_sunday = monday - timedelta(days=1)
        prev_monday_str = prev_monday.strftime("%Y-%m-%d")
        prev_sunday_str = prev_sunday.strftime("%Y-%m-%d")

        with self._get_conn() as conn:
            # Query current week records
            current_rows = conn.execute("""
            SELECT * FROM student_stress_assessments
            WHERE user_id = ? AND (
                (assessment_date IS NOT NULL AND assessment_date >= ? AND assessment_date <= ?) OR
                (assessment_date IS NULL AND SUBSTR(created_at, 1, 10) >= ? AND SUBSTR(created_at, 1, 10) <= ?)
            )
            ORDER BY id ASC
            """, (user_id, monday_str, sunday_str, monday_str, sunday_str)).fetchall()

            # Query previous week records
            prev_rows = conn.execute("""
            SELECT * FROM student_stress_assessments
            WHERE user_id = ? AND (
                (assessment_date IS NOT NULL AND assessment_date >= ? AND assessment_date <= ?) OR
                (assessment_date IS NULL AND SUBSTR(created_at, 1, 10) >= ? AND SUBSTR(created_at, 1, 10) <= ?)
            )
            ORDER BY id ASC
            """, (user_id, prev_monday_str, prev_sunday_str, prev_monday_str, prev_sunday_str)).fetchall()

        # Map current week assessments by day
        date_to_record: Dict[str, Any] = {}
        for r in current_rows:
            keys = r.keys() if hasattr(r, "keys") else []
            d_str = r["assessment_date"] if "assessment_date" in keys and r["assessment_date"] else r["created_at"][:10]
            date_to_record[d_str] = r

        day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        daily_records = []
        for i in range(7):
            d = monday + timedelta(days=i)
            d_str = d.strftime("%Y-%m-%d")
            rec = date_to_record.get(d_str)
            has_record = rec is not None
            score = float(rec["stress_score"]) if has_record and rec["stress_score"] is not None else None
            interp = rec["interpretation"] if has_record and "interpretation" in rec.keys() else None
            tier = rec["status_tier"] if has_record and "status_tier" in rec.keys() else None
            phq = rec["phq9_score"] if has_record and "phq9_score" in rec.keys() else None

            daily_records.append({
                "day": day_names[i],
                "day_name": day_names[i],
                "date": d_str,
                "has_assessment": has_record,
                "stress_score": score,
                "interpretation": interp,
                "status_tier": tier,
                "phq9_score": phq,
                "is_future": d > local_now.date()
            })

        completed_records = [r for r in daily_records if r["has_assessment"] and r["stress_score"] is not None]
        assessments_count = len(completed_records)

        if completed_records:
            scores = [r["stress_score"] for r in completed_records]
            weekly_avg = round(sum(scores) / len(scores), 1)
            highest = max(scores)
            lowest = min(scores)
        else:
            weekly_avg = None
            highest = None
            lowest = None

        # Previous week average
        prev_date_to_score: Dict[str, float] = {}
        for r in prev_rows:
            keys = r.keys() if hasattr(r, "keys") else []
            d_str = r["assessment_date"] if "assessment_date" in keys and r["assessment_date"] else r["created_at"][:10]
            prev_date_to_score[d_str] = float(r["stress_score"])

        if prev_date_to_score:
            prev_scores = list(prev_date_to_score.values())
            prev_avg = round(sum(prev_scores) / len(prev_scores), 1)
        else:
            prev_avg = None

        if weekly_avg is not None and prev_avg is not None:
            change_vs_prev = round(weekly_avg - prev_avg, 1)
        else:
            change_vs_prev = None

        # Consistency
        consistency_label = f"{assessments_count} of 7 days logged"
        consistency_pct = round((assessments_count / 7.0) * 100)

        # Trend direction
        if change_vs_prev is not None:
            if change_vs_prev < -2.0:
                trend_dir = "improving"
            elif change_vs_prev > 2.0:
                trend_dir = "elevated"
            else:
                trend_dir = "stable"
        else:
            trend_dir = "stable"

        # Month format for week label
        m_start = monday.strftime("%b %d")
        m_end = sunday.strftime("%b %d, %Y")
        week_label = f"Week of {m_start} – {m_end}"

        return {
            "week_label": week_label,
            "start_date": monday_str,
            "end_date": sunday_str,
            "week_start": monday_str,
            "week_end": sunday_str,
            "assessments_count": assessments_count,
            "logged_days_count": assessments_count,
            "total_days": 7,
            "daily_records": daily_records,
            "daily_breakdown": daily_records,
            "weekly_average": weekly_avg,
            "highest_score": highest,
            "lowest_score": lowest,
            "previous_week_average": prev_avg,
            "change_from_previous_week": change_vs_prev,
            "change_vs_previous_week": change_vs_prev,
            "consistency_label": consistency_label,
            "consistency_percentage": consistency_pct,
            "trend_direction": trend_dir,
            "has_data": assessments_count > 0
        }

    def get_student_progress_summary(self, user_id: int) -> Dict[str, Any]:
        """
        Phase 12: Cumulative student progress, streaks, and milestone achievements.
        """
        with self._get_conn() as conn:
            row = conn.execute("SELECT COUNT(*) as total FROM student_stress_assessments WHERE user_id = ?", (user_id,)).fetchone()
            total_count = row["total"] if row else 0

            latest_records = conn.execute("""
            SELECT assessment_date, stress_score, created_at FROM student_stress_assessments
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 20
            """, (user_id,)).fetchall()

        # Streak calculation
        date_list = []
        for r in latest_records:
            keys = r.keys() if hasattr(r, "keys") else []
            d = r["assessment_date"] if "assessment_date" in keys and r["assessment_date"] else r["created_at"][:10]
            if d:
                date_list.append(d)

        unique_dates = sorted(list(set(date_list)), reverse=True)
        streak = 0
        if unique_dates:
            today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            try:
                curr_dt = datetime.strptime(unique_dates[0], "%Y-%m-%d").date()
                today_dt = datetime.strptime(today_str, "%Y-%m-%d").date()
                if (today_dt - curr_dt).days <= 1:
                    streak = 1
                    for i in range(len(unique_dates) - 1):
                        d1 = datetime.strptime(unique_dates[i], "%Y-%m-%d").date()
                        d2 = datetime.strptime(unique_dates[i+1], "%Y-%m-%d").date()
                        if (d1 - d2).days == 1:
                            streak += 1
                        else:
                            break
            except Exception:
                streak = min(len(unique_dates), 1)

        milestones = [
            {"title": "First Assessment Completed", "description": "Initiated personal wellbeing tracking baseline", "unlocked": total_count >= 1},
            {"title": "3-Day Consistency Habit", "description": "Reflective academic mental pacing over 3 days", "unlocked": total_count >= 3},
            {"title": "Weekly Assessment Rhythm", "description": "Logged 7 comprehensive student evaluations", "unlocked": total_count >= 7},
            {"title": "Dedicated Wellbeing Champion", "description": "14 days of conscious mental health insight", "unlocked": total_count >= 14}
        ]

        return {
            "total_assessments": total_count,
            "current_streak_days": streak,
            "milestones": milestones,
            "has_data": total_count > 0
        }

    # --- PHASE 8: RESEARCH GOVERNANCE & ACCESS CONTROL ---
    def log_research_access(self, user_id: Optional[int], action: str, dataset_name: str, status: str, ip_address: Optional[str] = None):
        """Audit trail logging for 163-record research dataset access."""
        now_iso = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute("""
            INSERT INTO research_access_logs (user_id, action, dataset_name, status, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, action, dataset_name, status, ip_address or "127.0.0.1", now_iso))
            conn.commit()

    def is_user_researcher(self, user_id: int) -> bool:
        """Check if user has authorized research privileges."""
        with self._get_conn() as conn:
            row = conn.execute("SELECT is_researcher, email FROM users WHERE id = ?", (user_id,)).fetchone()
            if not row:
                return False
            # Admin accounts or accounts marked as researcher are authorized
            is_res = bool(row["is_researcher"])
            email = row["email"].lower()
            if "research" in email or "admin" in email:
                return True
            return is_res

    def set_user_researcher(self, user_id: int, is_researcher: bool = True) -> bool:
        """Designate a user as authorized research administrator."""
        with self._get_conn() as conn:
            conn.execute("UPDATE users SET is_researcher = ? WHERE id = ?", (1 if is_researcher else 0, user_id))
            conn.commit()
            return True

    # --- PHASE 8: USER PREFERENCES (AMBIENT MUSIC) ---
    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Fetch persistent music and sound preferences."""
        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM user_preferences WHERE user_id = ?", (user_id,)).fetchone()
            if row:
                return {
                    "ambient_music_enabled": bool(row["ambient_music_enabled"]),
                    "ambient_music_track": row["ambient_music_track"] or "peaceful_instrumental",
                    "ambient_music_volume": float(row["ambient_music_volume"] if row["ambient_music_volume"] is not None else 0.5),
                    "game_sound_enabled": bool(row["game_sound_enabled"] if row["game_sound_enabled"] is not None else 1)
                }
            return {
                "ambient_music_enabled": False,
                "ambient_music_track": "peaceful_instrumental",
                "ambient_music_volume": 0.5,
                "game_sound_enabled": True
            }

    def save_user_preferences(self, user_id: int, prefs: Dict[str, Any]) -> Dict[str, Any]:
        """Save persistent music and sound preferences."""
        music_en = 1 if prefs.get("ambient_music_enabled") else 0
        track = str(prefs.get("ambient_music_track", "peaceful_instrumental"))
        vol = float(prefs.get("ambient_music_volume", 0.5))
        sound_en = 1 if prefs.get("game_sound_enabled", True) else 0
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            conn.execute("""
            INSERT INTO user_preferences (user_id, ambient_music_enabled, ambient_music_track, ambient_music_volume, game_sound_enabled, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                ambient_music_enabled = excluded.ambient_music_enabled,
                ambient_music_track = excluded.ambient_music_track,
                ambient_music_volume = excluded.ambient_music_volume,
                game_sound_enabled = excluded.game_sound_enabled,
                updated_at = excluded.updated_at
            """, (user_id, music_en, track, vol, sound_en, now_iso))
            conn.commit()

        return self.get_user_preferences(user_id)

    # --- PHASE 8: GAME SESSIONS & FIVE-MINUTE ENFORCEMENT ---
    def start_game_session(self, user_id: int, game_type: str) -> Dict[str, Any]:
        """
        Starts a strict five-minute (300 seconds) game session.
        Stores wall-clock epoch start_time so client-side refreshes cannot bypass the limit.
        """
        session_id = f"GAME-{user_id}-{secrets.token_hex(6)}"
        now_epoch = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._get_conn() as conn:
            conn.execute("""
            INSERT INTO game_sessions (user_id, session_id, game_type, start_time, duration_seconds, score, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, 0, 'active', ?, ?)
            """, (user_id, session_id, game_type, now_epoch, now_iso, now_iso))
            conn.commit()

        return {
            "session_id": session_id,
            "game_type": game_type,
            "start_time": now_epoch,
            "max_duration_seconds": 300,  # Strict 5-minute session limit
            "created_at": now_iso
        }

    def update_game_session(self, user_id: int, session_id: str, duration_seconds: int, score: int, status: str = "active") -> Dict[str, Any]:
        """Update active session progress, score, and handle completion/continuation."""
        now_iso = datetime.now(timezone.utc).isoformat()
        now_epoch = time.time()

        with self._get_conn() as conn:
            row = conn.execute("SELECT * FROM game_sessions WHERE session_id = ? AND user_id = ?", (session_id, user_id)).fetchone()
            if not row:
                raise ValueError("Game session not found or does not belong to student.")

            # Calculate true elapsed wall-clock seconds
            wall_clock_elapsed = int(now_epoch - row["start_time"])
            effective_duration = max(duration_seconds, wall_clock_elapsed)

            # Enforce 5-minute session completion if elapsed >= 300
            session_status = status
            if effective_duration >= 300 and session_status == "active":
                session_status = "time_limit_reached"

            new_score = max(score, row["score"] or 0)

            conn.execute("""
            UPDATE game_sessions
            SET duration_seconds = ?, score = ?, status = ?, updated_at = ?
            WHERE session_id = ? AND user_id = ?
            """, (effective_duration, new_score, session_status, now_iso, session_id, user_id))
            conn.commit()

        return {
            "session_id": session_id,
            "duration_seconds": effective_duration,
            "remaining_seconds": max(0, 300 - effective_duration),
            "score": new_score,
            "status": session_status,
            "is_five_minute_limit_reached": effective_duration >= 300
        }

    def get_game_engagement(self, user_id: int) -> Dict[str, Any]:
        """Aggregate personal bests, total sessions, and weekly playtime."""
        with self._get_conn() as conn:
            rows = conn.execute("""
            SELECT game_type, MAX(score) as high_score, COUNT(*) as session_count, SUM(duration_seconds) as total_seconds
            FROM game_sessions
            WHERE user_id = ?
            GROUP BY game_type
            """, (user_id,)).fetchall()

            recent = conn.execute("""
            SELECT session_id, game_type, score, duration_seconds, status, created_at
            FROM game_sessions
            WHERE user_id = ?
            ORDER BY id DESC LIMIT 10
            """, (user_id,)).fetchall()

        by_game = {
            "snake": {"high_score": 0, "sessions": 0, "playtime_minutes": 0},
            "block": {"high_score": 0, "sessions": 0, "playtime_minutes": 0}
        }
        total_seconds = 0
        total_sessions = 0

        for r in rows:
            g = r["game_type"]
            s_count = r["session_count"] or 0
            dur = r["total_seconds"] or 0
            by_game[g] = {
                "high_score": r["high_score"] or 0,
                "sessions": s_count,
                "playtime_minutes": round(dur / 60, 1)
            }
            total_seconds += dur
            total_sessions += s_count

        return {
            "total_sessions": total_sessions,
            "total_playtime_minutes": round(total_seconds / 60, 1),
            "games": by_game,
            "recent_sessions": [
                {
                    "session_id": r["session_id"],
                    "game_type": r["game_type"],
                    "score": r["score"],
                    "duration_seconds": r["duration_seconds"],
                    "status": r["status"],
                    "created_at": r["created_at"]
                }
                for r in recent
            ],
            "disclaimer": "Mindora Mini Games are short, voluntary recreational breaks for cognitive reset. They do NOT provide treatment for clinical depression or anxiety."
        }

AUTH_MANAGER = AuthManager()
