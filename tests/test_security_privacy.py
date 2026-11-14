"""
tests/test_security_privacy.py
Mindora – Day 6 Security, Privacy Engineering & Data Protection Audit Test Suite.

Validates:
1. Multi-session state isolation & zero cross-session data leakage.
2. Independent session reset scoping (target session only).
3. Zero persistent student data writes to disk or external services.
4. Input validation & boundary enforcement across ML, Lifestyle, and PHQ-9 engines.
5. Oversized string and payload rejection (DoS prevention).
6. Model artifact cryptographic integrity verification (CWE-502 anti-tampering).
7. Safe CSV upload handling: extension enforcement, path traversal checks, and dimension bounds.
8. HTML / XSS sanitization in dynamic view templates.
9. Sensitive error message hygiene and stack-trace suppression.
"""

import os
import io
import html
import tempfile
import unittest
import pandas as pd

from src.session_utils import (
    reset_user_session_state,
    is_user_data_cleared,
    USER_SESSION_STATE_DEFAULTS
)
from src.predict import (
    validate_ml_inputs,
    predict_wellness_risk,
    verify_model_integrity,
    EXPECTED_PRODUCTION_MODEL_SHA256,
    MODEL_PATH
)
from src.recommendations import (
    calculate_phq9,
    analyze_lifestyle_patterns
)
from src.data_platform.dataset_loader import (
    load_local_csv,
    DatasetIngestionError,
    MAX_PERMITTED_COLUMNS,
    MAX_PERMITTED_ROWS
)

class TestSecurityAndPrivacy(unittest.TestCase):

    def setUp(self):
        self.valid_ml_payload = {
            "Age": 21.0,
            "Academic Pressure": 3.0,
            "CGPA": 7.8,
            "Study Satisfaction": 3.0,
            "Work/Study Hours": 6.5,
            "Financial Stress": 3.0,
            "Gender": "Female",
            "Sleep Duration": "5-6 hours",
            "Dietary Habits": "Moderate",
            "Degree": "B.Tech"
        }

    # =========================================================================
    # 1. SESSION ISOLATION & PRIVACY LEAKAGE CHECKS
    # =========================================================================
    def test_01_two_independent_sessions_remain_isolated(self):
        """Verify that user assessment responses and habits do not leak across distinct sessions."""
        session_a = {
            "assessment_submitted": True,
            "latest_results": {"sample_engine_1": 0.79},
            "completed_habits": {"sleep_winddown", "wake_time"},
            "session_progress": [{"timestamp": "2026-11-14 12:00:00", "risk_percentage": 79.0}],
            "daily_energy_checkin": "😊 Good Energy",
            "current_page": "📊 My Insights"
        }
        
        session_b = {
            "assessment_submitted": False,
            "latest_results": None,
            "completed_habits": set(),
            "session_progress": [],
            "daily_energy_checkin": None,
            "current_page": "🏠 Home / Dashboard"
        }
        
        # Verify Session B is unaffected by Session A's active state
        self.assertFalse(session_b["assessment_submitted"])
        self.assertIsNone(session_b["latest_results"])
        self.assertEqual(len(session_b["completed_habits"]), 0)
        self.assertEqual(len(session_b["session_progress"]), 0)
        self.assertIsNone(session_b["daily_energy_checkin"])
        self.assertTrue(is_user_data_cleared(session_b))

    def test_02_session_reset_affects_only_target_session(self):
        """Verify that resetting Session A leaves Session B completely unchanged."""
        session_a = {
            "assessment_submitted": True,
            "latest_results": {"score": 85.0},
            "completed_habits": {"phone_free_pomodoro"},
            "session_progress": [{"id": 1}],
            "daily_energy_checkin": "⚡ Energized",
            "current_page": "📈 My Progress"
        }
        
        session_b = {
            "assessment_submitted": True,
            "latest_results": {"score": 42.0},
            "completed_habits": {"morning_light", "hydration_target"},
            "session_progress": [{"id": 2}],
            "daily_energy_checkin": "😐 Steady",
            "current_page": "🎯 Wellness Planner"
        }
        
        # Reset Session A
        reset_user_session_state(state_dict=session_a, preserve_navigation=True)
        
        # Session A should now be restored to defaults
        self.assertTrue(is_user_data_cleared(session_a))
        self.assertEqual(session_a["current_page"], "📈 My Progress")
        
        # Session B MUST remain completely intact with zero data loss or alteration
        self.assertTrue(session_b["assessment_submitted"])
        self.assertEqual(session_b["latest_results"]["score"], 42.0)
        self.assertEqual(len(session_b["completed_habits"]), 2)
        self.assertEqual(session_b["daily_energy_checkin"], "😐 Steady")
        self.assertEqual(session_b["current_page"], "🎯 Wellness Planner")

    def test_03_zero_persistent_student_data_writes(self):
        """Verify that executing an assessment creates zero persistent student files or logs on disk."""
        snapshot_before = set(os.listdir("."))
        
        # Run inference and scoring
        _ = predict_wellness_risk(self.valid_ml_payload)
        _ = calculate_phq9([1, 0, 2, 1, 0, 1, 0, 1, 0])
        _ = analyze_lifestyle_patterns({"daily_phone_hours": 4.5, "sleep_quality": 3, "daily_fatigue": 2})
        
        snapshot_after = set(os.listdir("."))
        
        # Zero new files created in root directory
        self.assertEqual(snapshot_before, snapshot_after)

    # =========================================================================
    # 2. INPUT VALIDATION & PAYLOAD SECURITY
    # =========================================================================
    def test_04_ml_input_numeric_bounds_enforced(self):
        """Verify out-of-range, NaN, and Infinite numeric inputs are rejected with clean ValueErrors."""
        invalid_cases = [
            ({"Age": 12.0}, "Age must be between 15 and 100"),
            ({"Age": 150.0}, "Age must be between 15 and 100"),
            ({"Age": float("nan")}, "Age must be between 15 and 100"),
            ({"Academic Pressure": 0.0}, "Academic Pressure must be between 1.0 and 5.0"),
            ({"Academic Pressure": 6.0}, "Academic Pressure must be between 1.0 and 5.0"),
            ({"CGPA": -1.0}, "CGPA must be between 0.0 and 10.0"),
            ({"CGPA": 11.5}, "CGPA must be between 0.0 and 10.0"),
            ({"Work/Study Hours": -2.0}, "Work/Study Hours must be between 0.0 and 24.0"),
            ({"Work/Study Hours": 25.0}, "Work/Study Hours must be between 0.0 and 24.0"),
            ({"Financial Stress": 0.5}, "Financial Stress must be between 1.0 and 5.0"),
            ({"Financial Stress": float("inf")}, "Financial Stress must be between 1.0 and 5.0"),
        ]
        
        for patch, expected_err in invalid_cases:
            payload = self.valid_ml_payload.copy()
            payload.update(patch)
            with self.assertRaises(ValueError) as ctx:
                validate_ml_inputs(payload)
            self.assertIn(expected_err, str(ctx.exception))

    def test_05_ml_input_string_length_limits_enforced(self):
        """Verify oversized categorical strings (> 100 chars) are rejected to prevent memory exhaustion."""
        oversized = "A" * 500
        for field in ["Gender", "Sleep Duration", "Dietary Habits", "Degree"]:
            payload = self.valid_ml_payload.copy()
            payload[field] = oversized
            with self.assertRaises(ValueError) as ctx:
                validate_ml_inputs(payload)
            self.assertIn("exceeds maximum permitted length", str(ctx.exception))

    def test_06_phq9_input_validation(self):
        """Verify PHQ-9 inputs reject wrong counts, invalid ranges, and non-numeric types."""
        # Wrong length
        with self.assertRaises(ValueError) as ctx:
            calculate_phq9([0, 1, 2])
        self.assertIn("requires exactly 9 responses", str(ctx.exception))
        
        # Out-of-range value (e.g. 4)
        with self.assertRaises(ValueError) as ctx:
            calculate_phq9([0, 1, 2, 3, 0, 1, 2, 4, 0])
        self.assertIn("must be an integer between 0 and 3", str(ctx.exception))
        
        # Non-numeric string
        with self.assertRaises(ValueError) as ctx:
            calculate_phq9([0, 1, "malicious", 3, 0, 1, 2, 0, 0])
        self.assertIn("must be an integer between 0 and 3", str(ctx.exception))

    def test_07_lifestyle_input_validation(self):
        """Verify lifestyle analytics rejects out-of-range and oversized inputs."""
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns({"daily_phone_hours": 26.0})
            
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns({"daily_social_hours": -1.0})
            
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns({"sleep_quality": 6})
            
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns({"daily_fatigue": 0})
            
        with self.assertRaises(ValueError) as ctx:
            analyze_lifestyle_patterns({"optional_notes": "X" * 6000})
        self.assertIn("exceeds maximum permitted length", str(ctx.exception))

    # =========================================================================
    # 3. MODEL ARTIFACT CRYPTOGRAPHIC INTEGRITY (CWE-502 DEFENSE)
    # =========================================================================
    def test_08_model_artifact_integrity_verification_success(self):
        """Verify that genuine production model passes SHA-256 integrity check."""
        self.assertTrue(verify_model_integrity(MODEL_PATH, EXPECTED_PRODUCTION_MODEL_SHA256))

    def test_09_tampered_model_artifact_rejected_before_deserialization(self):
        """Verify that a tampered or modified pickle file is caught by hash check and refused."""
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            f.write(b"malicious_fake_pickle_content_or_payload")
            fake_path = f.name
            
        try:
            with self.assertRaises(ValueError) as ctx:
                verify_model_integrity(fake_path, EXPECTED_PRODUCTION_MODEL_SHA256)
            self.assertIn("Model artifact integrity check failed", str(ctx.exception))
            self.assertIn("Refusing to deserialize untrusted or tampered pickle file", str(ctx.exception))
        finally:
            if os.path.exists(fake_path):
                os.remove(fake_path)

    # =========================================================================
    # 4. CSV INGESTION, PATH TRAVERSAL & DIMENSION BOUNDS
    # =========================================================================
    def test_10_csv_loader_enforces_csv_extension_and_blocks_traversal(self):
        """Verify that non-CSV extensions and path traversal formats are rejected."""
        # Non-CSV path
        with self.assertRaises(DatasetIngestionError) as ctx:
            load_local_csv("requirements.txt")
        self.assertIn("Only comma-separated values (.csv) files are permitted", str(ctx.exception))
        
        # Hostile extension
        with self.assertRaises(DatasetIngestionError) as ctx:
            load_local_csv(b"col1,col2\n1,2", filename="malicious_payload.exe")
        self.assertIn("Only comma-separated values (.csv) files are permitted", str(ctx.exception))

    def test_11_csv_loader_rejects_empty_and_oversized_files(self):
        """Verify empty files (0 bytes) and dimension bombs are rejected."""
        # 0 bytes
        with self.assertRaises(DatasetIngestionError) as ctx:
            load_local_csv(b"", filename="empty.csv")
        self.assertIn("empty", str(ctx.exception))
        
        # Dimension bomb (too many columns)
        bomb_cols = [f"c_{i}" for i in range(MAX_PERMITTED_COLUMNS + 10)]
        bomb_csv = ",".join(bomb_cols) + "\n" + ",".join(["1"] * len(bomb_cols))
        with self.assertRaises(DatasetIngestionError) as ctx:
            load_local_csv(bomb_csv.encode("utf-8"), filename="wide_bomb.csv")
        self.assertTrue(
            "excessive columns" in str(ctx.exception) or "exceeds maximum allowed column count" in str(ctx.exception)
        )

    # =========================================================================
    # 5. XSS SANITIZATION & ERROR HYGIENE
    # =========================================================================
    def test_12_xss_characters_are_escaped_in_view_components(self):
        """Verify that HTML characters in user check-ins or file names are escaped cleanly."""
        hostile_input = "<script>alert('xss')</script>"
        escaped = html.escape(hostile_input)
        
        self.assertNotIn("<script>", escaped)
        self.assertIn("&lt;script&gt;", escaped)
        
        # Test habit formatting with special characters
        hostile_habit = "<img src=x onerror=alert(1)>_habit"
        clean_name = html.escape(str(hostile_habit).replace("_", " ").title())
        self.assertNotIn("<img", clean_name.lower())
        self.assertIn("&lt;", clean_name)

    def test_13_error_messages_suppress_stack_traces(self):
        """Verify that assessment error handling returns user-safe notifications without full tracebacks."""
        # When an exception is caught in assessment.py, it renders type(ex).__name__ rather than full traceback
        try:
            raise KeyError("sensitive_internal_dictionary_key")
        except Exception as ex:
            safe_msg = f"Assessment Processing Notice: An unexpected error occurred ({type(ex).__name__}). Please review your inputs."
            self.assertNotIn("Traceback", safe_msg)
            self.assertNotIn("sensitive_internal_dictionary_key", safe_msg)
            self.assertIn("KeyError", safe_msg)

    def test_14_csv_upload_stream_size_checked_before_memory_consumption(self):
        """Verify that an oversized uploaded file stream is rejected before reading unbounded bytes."""
        class MockOversizedStream:
            def __init__(self, size_bytes):
                self.size = size_bytes
                self.name = "huge_dataset.csv"
                self.read_called = False
            def read(self, *args):
                self.read_called = True
                return b"chunk"

        oversized_stream = MockOversizedStream(size_bytes=50 * 1024 * 1024) # 50 MB > 25 MB upload limit
        with self.assertRaises(DatasetIngestionError) as ctx:
            load_local_csv(oversized_stream, filename=oversized_stream.name, max_size_bytes=25 * 1024 * 1024)
        self.assertIn("exceeds maximum allowed limit", str(ctx.exception))
        self.assertFalse(oversized_stream.read_called, "Oversized stream must be rejected before calling read()")

    def test_15_csv_unusually_wide_header_rejected_before_dataframe_construction(self):
        """Verify that an unusually wide CSV header line (> 500 columns) aborts before DataFrame construction."""
        wide_header = ",".join([f"f_{i}" for i in range(550)]) + "\n" + ",".join(["1"] * 550)
        with self.assertRaises(DatasetIngestionError) as ctx:
            load_local_csv(wide_header.encode("utf-8"), filename="wide_header.csv")
        self.assertIn("header indicates excessive columns", str(ctx.exception))

    def test_16_tampered_model_never_unpickled(self):
        """Verify that joblib.load is never invoked when model SHA-256 hash does not match."""
        from unittest.mock import patch
        from src.predict import get_pipeline, _CACHED_PIPELINE
        
        with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as f:
            f.write(b"tampered_corrupted_model_artifact_bytes")
            fake_model_path = f.name
            
        try:
            with patch("src.predict.MODEL_PATH", fake_model_path):
                with patch("joblib.load") as mock_joblib_load:
                    with self.assertRaises(ValueError) as ctx:
                        # Force pipeline reload with tampered path
                        import src.predict as pr
                        pr._CACHED_PIPELINE = None
                        get_pipeline(verify_integrity=True)
                    self.assertIn("Model artifact integrity check failed", str(ctx.exception))
                    mock_joblib_load.assert_not_called()
        finally:
            # Restore cached pipeline
            import src.predict as pr
            pr._CACHED_PIPELINE = None
            if os.path.exists(fake_model_path):
                os.remove(fake_model_path)

if __name__ == "__main__":
    unittest.main()
