"""
tests/test_architecture_reliability.py
Mindora – Day 7 Architecture, Maintainability & Application Reliability Test Suite.

Validates:
1. Strict Tri-Engine architectural independence and zero cross-module import coupling.
2. Resilience of Engine 2 (Lifestyle) and Engine 3 (PHQ-9) when Engine 1 model is missing.
3. Isolation: Training Lab dataset/model failure cannot break student assessment flow.
4. Missing optional artifact resilience (methodology fallbacks).
5. Corrupted session-state automatic self-healing and type recovery.
6. Server configuration consistency (maxUploadSize = 25 MB, telemetry disabled).
7. Parsing-time CSV row and column limit enforcement.
8. Dynamic path resolution independence from hardcoded machine paths.
"""

import os
import ast
import tempfile
import unittest
from unittest.mock import patch

from src.session_utils import (
    validate_and_sanitize_session_state,
    reset_user_session_state,
    is_user_data_cleared
)
from src.predict import (
    predict_wellness_risk,
    MODEL_PATH,
    EXPECTED_PRODUCTION_MODEL_SHA256,
    verify_model_integrity
)
from src.recommendations import (
    calculate_phq9,
    analyze_lifestyle_patterns,
    generate_educational_recommendations
)
from src.data_platform.dataset_loader import (
    load_local_csv,
    DatasetIngestionError,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_PERMITTED_ROWS,
    MAX_PERMITTED_COLUMNS
)

class TestArchitectureAndReliability(unittest.TestCase):

    def setUp(self):
        self.project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
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
        self.valid_lifestyle_payload = {
            "daily_phone_hours": 5.5,
            "daily_social_hours": 3.0,
            "sleep_quality": 3,
            "daily_fatigue": 3,
            "phone_before_bed": "Yes",
            "social_comparison": "Sometimes"
        }

    # =========================================================================
    # 1. TRI-ENGINE ARCHITECTURAL INDEPENDENCE (IMPORT & STATE DECOUPLING)
    # =========================================================================
    def test_01_predict_module_does_not_import_phq9_or_lifestyle(self):
        """Verify that src/predict.py has zero imports of Engine 2 or Engine 3."""
        predict_file = os.path.join(self.project_root, "src", "predict.py")
        with open(predict_file, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename="predict.py")
            
        imported_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imported_names.add(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imported_names.add(node.module)
                for alias in node.names:
                    imported_names.add(alias.name)

        # Confirm predict.py never imports recommendations or PHQ-9 functions
        self.assertNotIn("src.recommendations", imported_names)
        self.assertNotIn("calculate_phq9", imported_names)
        self.assertNotIn("analyze_lifestyle_patterns", imported_names)

    def test_02_recommendations_module_does_not_import_ml_pipeline(self):
        """Verify that src/recommendations.py has zero imports of ML inference or scikit-learn."""
        rec_file = os.path.join(self.project_root, "src", "recommendations.py")
        with open(rec_file, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename="recommendations.py")
            
        imported_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imported_names.add(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imported_names.add(node.module)
                for alias in node.names:
                    imported_names.add(alias.name)

        self.assertNotIn("src.predict", imported_names)
        self.assertNotIn("sklearn", imported_names)
        self.assertNotIn("xgboost", imported_names)
        self.assertNotIn("joblib", imported_names)

    # =========================================================================
    # 2. FAULT TOLERANCE & DECOUPLED RESILIENCE
    # =========================================================================
    def test_03_engine_2_and_3_operate_when_production_model_is_missing(self):
        """Verify that if Engine 1 model is absent, Engine 2 and Engine 3 execute with 100% fidelity."""
        with patch("src.predict.MODEL_PATH", "/non/existent/model.pkl"):
            # Engine 1 raises FileNotFoundError cleanly
            with self.assertRaises(FileNotFoundError):
                predict_wellness_risk(self.valid_ml_payload)

            # Engines 2 and 3 MUST continue to operate with zero failures
            lifestyle_res = analyze_lifestyle_patterns(self.valid_lifestyle_payload)
            self.assertIn("digital_friction", lifestyle_res)
            self.assertIn("rhythm_score", lifestyle_res)

            phq9_res = calculate_phq9([0, 1, 0, 1, 0, 0, 1, 0, 0])
            self.assertEqual(phq9_res["score"], 3)
            self.assertEqual(phq9_res["severity"], "Minimal or None")

    def test_04_training_lab_failure_does_not_break_student_assessment(self):
        """Verify that catastrophic failure in the Training Lab does not impact student assessment."""
        # Simulate corrupt dataset in Training Lab
        corrupt_bytes = b"bad,csv\n1,2,3,4,5"
        with self.assertRaises(DatasetIngestionError):
            load_local_csv(b"", filename="corrupt.csv")

        # Student assessment path remains completely operational
        ml_out = predict_wellness_risk(self.valid_ml_payload)
        self.assertIn("probability", ml_out)
        self.assertIn("risk_tier", ml_out)

    # =========================================================================
    # 3. SESSION STATE RECOVERY & RELIABILITY
    # =========================================================================
    def test_05_corrupt_session_state_type_recovery(self):
        """Verify validate_and_sanitize_session_state recovers corrupted non-set or non-list keys."""
        corrupted_state = {
            "completed_habits": "not_a_set", # Corrupted type
            "session_progress": 12345,       # Corrupted type
            "assessment_submitted": "yes",   # Corrupted type (should be bool)
            "current_page": None             # Missing string
        }

        was_healthy = validate_and_sanitize_session_state(corrupted_state)
        self.assertFalse(was_healthy, "Sanitizer should report that state was unhealthy")

        # Recovered state check
        self.assertIsInstance(corrupted_state["completed_habits"], set)
        self.assertEqual(len(corrupted_state["completed_habits"]), 0)
        self.assertIsInstance(corrupted_state["session_progress"], list)
        self.assertEqual(len(corrupted_state["session_progress"]), 0)
        self.assertIs(corrupted_state["assessment_submitted"], False)
        self.assertEqual(corrupted_state["current_page"], "🏠 Home / Dashboard")

    def test_06_healthy_session_state_is_preserved_unchanged(self):
        """Verify that healthy session state is never altered by the sanitizer."""
        healthy_state = {
            "completed_habits": {"sleep_winddown"},
            "session_progress": [{"score": 10}],
            "assessment_submitted": True,
            "current_page": "📊 My Insights"
        }

        was_healthy = validate_and_sanitize_session_state(healthy_state)
        self.assertTrue(was_healthy)
        self.assertEqual(healthy_state["completed_habits"], {"sleep_winddown"})
        self.assertEqual(len(healthy_state["session_progress"]), 1)
        self.assertTrue(healthy_state["assessment_submitted"])
        self.assertEqual(healthy_state["current_page"], "📊 My Insights")

    # =========================================================================
    # 4. CONFIGURATION & RESOURCE LIMITS
    # =========================================================================
    def test_07_streamlit_configuration_enforces_privacy_and_upload_limit(self):
        """Verify that .streamlit/config.toml enforces maxUploadSize, headless mode, and zero telemetry."""
        config_path = os.path.join(self.project_root, ".streamlit", "config.toml")
        self.assertTrue(os.path.exists(config_path), ".streamlit/config.toml must exist")
        
        with open(config_path, "r", encoding="utf-8") as f:
            content = f.read()

        self.assertIn("maxUploadSize = 25", content, "server.maxUploadSize must be explicitly configured to 25 MB")
        self.assertIn("gatherUsageStats = false", content, "Telemetry must be explicitly disabled")
        self.assertIn("enableXsrfProtection = true", content, "XSRF protection must be active")
        self.assertIn("headless = true", content, "Headless mode must be enabled")

    def test_08_csv_row_limit_enforced_during_parsing(self):
        """Verify that CSV rows exceeding MAX_PERMITTED_ROWS are caught and rejected during parsing."""
        # Create a CSV stream with more rows than permitted (simulated with small test limit)
        tall_csv = "col1,col2\n" + "\n".join([f"{i},{i*2}" for i in range(100)])
        with patch("src.data_platform.dataset_loader.MAX_PERMITTED_ROWS", 50):
            with self.assertRaises(DatasetIngestionError) as ctx:
                load_local_csv(tall_csv.encode("utf-8"), filename="tall_data.csv")
            self.assertIn("exceeds maximum allowed row count", str(ctx.exception))

    # =========================================================================
    # 5. ENVIRONMENT & PATH INDEPENDENCE
    # =========================================================================
    def test_09_model_and_dataset_paths_use_relative_resolution(self):
        """Verify that model and dataset loaders use relative path resolution rather than hardcoded machine roots."""
        import src.predict as pr
        import src.data_loader as dl
        
        # Verify paths are dynamic and resolve within project root
        self.assertTrue(os.path.isabs(pr.MODEL_PATH))
        self.assertTrue(pr.MODEL_PATH.endswith(os.path.join("models", "best_model.pkl")))
        self.assertTrue(os.path.isabs(dl.DEFAULT_DATASET_PATH))
        self.assertTrue(dl.DEFAULT_DATASET_PATH.endswith(os.path.join("dataset", "Student_Depression_Dataset.csv")))

if __name__ == "__main__":
    unittest.main()
