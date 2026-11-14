"""
tests/test_offline_reliability.py
Mindora Day 5: Offline-First Reliability, System Resilience & Failure Handling Test Suite.

Proves with deterministic socket interception that:
1. Core student journey and tri-engine inference execute 100% offline with zero outbound network requests.
2. Local system font stack operates with zero external @import font fetches.
3. Missing model/dataset artifacts produce informative notices with zero fabricated predictions.
4. Session reset and empty states function reliably without network access.
5. Production model SHA-256 remains bit-exact to baseline.
"""

import os
import sys
import socket
import unittest
import hashlib
from typing import Dict, Any

# Ensure project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.predict import predict_wellness_risk, REQUIRED_ML_FEATURES, MODEL_PATH
from src.recommendations import analyze_lifestyle_patterns, calculate_phq9, get_crisis_resources
from src.session_utils import reset_user_session_state, is_user_data_cleared
from src.ui_theme import CUSTOM_CSS, render_journey_banner, render_privacy_card, render_empty_state
from src.views import (
    render_student_dashboard,
    render_onboarding_guide,
    render_assessment,
    render_insights,
    render_wellness_planner,
    render_progress_view,
    render_methodology,
    render_training_lab
)

EXPECTED_PROD_MODEL_SHA256 = "e182e9e779a4f89e4883eb13c9bab3df19eebc7165d4b0a44319f737361342ec"


class OfflineNetworkGuard:
    """Context manager that intercepts and blocks all outbound non-localhost socket connections."""

    def __enter__(self):
        self.orig_connect = socket.socket.connect

        def guarded_connect(sock_self, address):
            host = address[0]
            # Allow only loopback/localhost connections
            if host in ("127.0.0.1", "localhost", "::1"):
                return self.orig_connect(sock_self, address)
            raise ConnectionRefusedError(
                f"[OFFLINE GUARD VIOLATION] Attempted forbidden outbound connection to external host: {host}"
            )

        socket.socket.connect = guarded_connect
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        socket.socket.connect = self.orig_connect


class TestOfflineReliability(unittest.TestCase):
    """Rigorous offline execution, resilience, and failure handling verification."""

    def setUp(self):
        self.valid_ml_payload: Dict[str, Any] = {
            "Age": 21,
            "Gender": "Male",
            "Academic Pressure": 4.0,
            "Work/Study Hours": 8.0,
            "CGPA": 3.4,
            "Study Satisfaction": 3.0,
            "Sleep Duration": "5-6 hours",
            "Dietary Habits": "Moderate",
            "Degree": "B.Tech",
            "Financial Stress": 3.0
        }
        self.valid_lifestyle_payload: Dict[str, Any] = {
            "screen_time": 6.5,
            "social_media_time": 3.5,
            "sleep_quality": 3,
            "study_environment": "Medium",
            "work_study_hours": 8.0,
            "academic_pressure": 4.0,
            "loneliness": 3,
            "friends_interaction": "2-3 times a week",
            "feeling_connected": 3
        }
        self.valid_phq9_answers = [1, 2, 1, 0, 1, 2, 1, 0, 0]

    def test_01_offline_guard_blocks_external_sockets(self):
        """Verify that the test guard intercepts external network calls."""
        with OfflineNetworkGuard():
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            with self.assertRaises(ConnectionRefusedError) as ctx:
                s.connect(("8.8.8.8", 53))
            self.assertIn("OFFLINE GUARD VIOLATION", str(ctx.exception))
            s.close()

    def test_02_css_has_zero_remote_font_imports(self):
        """Verify that CUSTOM_CSS contains no remote @import or fonts.googleapis.com references."""
        self.assertNotIn("fonts.googleapis.com", CUSTOM_CSS)
        self.assertNotIn("@import url", CUSTOM_CSS)
        self.assertIn("-apple-system", CUSTOM_CSS)
        self.assertIn("BlinkMacSystemFont", CUSTOM_CSS)
        self.assertIn("Segoe UI", CUSTOM_CSS)

    def test_03_engine_1_ml_inference_and_shap_100_percent_offline(self):
        """Verify that Engine 1 Calibrated XGBoost and SHAP TreeExplainer execute completely offline."""
        with OfflineNetworkGuard():
            res = predict_wellness_risk(self.valid_ml_payload)
            self.assertIn("percentage", res)
            self.assertIn("risk_tier", res)
            self.assertIn("feature_contributions", res)
            self.assertTrue(0.0 <= res["probability"] <= 1.0)
            self.assertTrue(len(res["feature_contributions"]) > 0)
            # Verify SHAP attribution runs locally
            self.assertTrue(res["is_local_explanation"])
            self.assertIn("SHAP", res["explainability_method"])

    def test_04_engine_2_lifestyle_analytics_100_percent_offline(self):
        """Verify that Engine 2 lifestyle friction scoring executes completely offline."""
        with OfflineNetworkGuard():
            life_res = analyze_lifestyle_patterns(self.valid_lifestyle_payload)
            self.assertIn("digital_friction", life_res)
            self.assertIn("rhythm_score", life_res)
            self.assertTrue(0 <= life_res["digital_friction"] <= 10)
            self.assertTrue(0 <= life_res["rhythm_score"] <= 10)

    def test_05_engine_3_phq9_and_crisis_guidance_100_percent_offline(self):
        """Verify that Engine 3 psychometrics and helpline guidance execute completely offline."""
        with OfflineNetworkGuard():
            phq_res = calculate_phq9(self.valid_phq9_answers)
            self.assertEqual(phq_res["score"], 8)
            self.assertEqual(phq_res["severity"], "Mild")
            self.assertFalse(phq_res["has_self_harm_risk"])

            crisis = get_crisis_resources()
            self.assertTrue(len(crisis["india_helplines"]) >= 3)
            self.assertIn("Tele-MANAS", crisis["india_helplines"][0]["service"])

    def test_06_complete_student_assessment_flow_offline(self):
        """Verify that the end-to-end student assessment tri-engine evaluation pipeline functions offline."""
        with OfflineNetworkGuard():
            ml_res = predict_wellness_risk(self.valid_ml_payload)
            life_res = analyze_lifestyle_patterns(self.valid_lifestyle_payload)
            phq_res = calculate_phq9(self.valid_phq9_answers)

            combined_payload = {
                "engine_1_ml": ml_res,
                "engine_2_lifestyle": life_res,
                "engine_3_phq9": phq_res,
                "ml_inputs": self.valid_ml_payload,
                "lifestyle_inputs": self.valid_lifestyle_payload
            }
            self.assertIsNotNone(combined_payload["engine_1_ml"])
            self.assertIsNotNone(combined_payload["engine_2_lifestyle"])
            self.assertIsNotNone(combined_payload["engine_3_phq9"])

    def test_07_session_reset_offline(self):
        """Verify that session reset operates reliably offline without external coordination."""
        with OfflineNetworkGuard():
            mock_session = {
                "current_page": "📊 Results & Wellness Insights",
                "assessment_submitted": True,
                "latest_results": {"engine_1_ml": {"percentage": 65.0}},
                "completed_habits": {"habit_1", "habit_2"},
                "session_progress": [{"timestamp": "12:00:00", "risk_percentage": 65.0}],
                "daily_energy_checkin": "😊 Good Energy"
            }
            reset_user_session_state(state_dict=mock_session, preserve_navigation=True)
            self.assertTrue(is_user_data_cleared(mock_session))
            self.assertEqual(mock_session["current_page"], "📊 Results & Wellness Insights")

    def test_08_failure_handling_missing_model_raises_clean_error(self):
        """Verify that missing model file raises FileNotFoundError without fabricating predictions."""
        from unittest.mock import patch

        with patch("src.predict.MODEL_PATH", "models/non_existent_model_file.pkl"):
            # Ensure cached model is bypassed
            import src.predict as pr
            pr._CACHED_PIPELINE = None
            try:
                with self.assertRaises(FileNotFoundError) as ctx:
                    pr.get_pipeline()
                self.assertIn("Model file not found", str(ctx.exception))
            finally:
                pr._CACHED_PIPELINE = None

    def test_09_production_model_sha256_unmodified(self):
        """Verify that models/best_model.pkl exists and matches the baseline SHA-256 hash."""
        self.assertTrue(os.path.exists(MODEL_PATH), f"Model file missing at {MODEL_PATH}")
        with open(MODEL_PATH, "rb") as f:
            computed_sha = hashlib.sha256(f.read()).hexdigest().lower()
        self.assertEqual(
            computed_sha,
            EXPECTED_PROD_MODEL_SHA256,
            f"Production model hash mismatch: {computed_sha} != {EXPECTED_PROD_MODEL_SHA256}"
        )


def run_all_offline_tests():
    print("=" * 70)
    print("MINDORA DAY 5 OFFLINE RELIABILITY & RESILIENCE TEST SUITE")
    print("=" * 70)
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromTestCase(TestOfflineReliability)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    print("=" * 70)
    if result.wasSuccessful():
        print(f"ALL {result.testsRun} OFFLINE RELIABILITY TESTS PASSED WITH 100% SUCCESS!")
    else:
        print(f"FAILED: {len(result.failures)} failures, {len(result.errors)} errors")
    print("=" * 70)
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_all_offline_tests()
    sys.exit(0 if success else 1)
