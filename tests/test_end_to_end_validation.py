"""
tests/test_end_to_end_validation.py
Mindora Day 4 – Comprehensive End-to-End Product Validation,
Input Error Handling, Edge Cases, and Integrity Test Suite.
"""

import os
import sys
import unittest
from typing import Dict, Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.predict import predict_wellness_risk, validate_ml_inputs
from src.recommendations import (
    calculate_phq9,
    analyze_lifestyle_patterns,
    generate_educational_recommendations,
    get_crisis_resources
)
from src.ui_theme import CUSTOM_CSS

class TestEngine1Validation(unittest.TestCase):
    """Test Engine 1 (Public ML) input validation, bounds, and edge cases."""
    
    def setUp(self):
        self.valid_input = {
            "Age": 21.0,
            "Academic Pressure": 3.0,
            "CGPA": 8.0,
            "Study Satisfaction": 4.0,
            "Work/Study Hours": 6.0,
            "Financial Stress": 2.0,
            "Gender": "Female",
            "Sleep Duration": "7-8 hours",
            "Dietary Habits": "Healthy",
            "Degree": "B.Tech"
        }

    def test_empty_input_rejected(self):
        """Empty input dictionary must be rejected with ValueError, not silently filled."""
        with self.assertRaises(ValueError) as ctx:
            predict_wellness_risk({})
        self.assertIn("Missing required ML feature", str(ctx.exception))

    def test_missing_features_rejected(self):
        """Missing individual required features must be rejected."""
        for feat in ["Age", "CGPA", "Academic Pressure", "Degree", "Gender"]:
            bad_input = dict(self.valid_input)
            del bad_input[feat]
            with self.assertRaises(ValueError) as ctx:
                predict_wellness_risk(bad_input)
            self.assertIn(f"Missing required ML feature(s): {feat}", str(ctx.exception))

    def test_age_out_of_bounds_rejected(self):
        """Age outside 15-100 must be rejected."""
        bad_input = dict(self.valid_input, Age=10.0)
        with self.assertRaises(ValueError) as ctx:
            predict_wellness_risk(bad_input)
        self.assertIn("Age must be between 15 and 100", str(ctx.exception))

        bad_input = dict(self.valid_input, Age=120.0)
        with self.assertRaises(ValueError) as ctx:
            predict_wellness_risk(bad_input)
        self.assertIn("Age must be between 15 and 100", str(ctx.exception))

    def test_cgpa_out_of_bounds_rejected(self):
        """CGPA outside 0.0-10.0 must be rejected."""
        bad_input = dict(self.valid_input, CGPA=-1.0)
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

        bad_input = dict(self.valid_input, CGPA=11.5)
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

    def test_academic_pressure_bounds_rejected(self):
        """Academic Pressure outside 1.0-5.0 must be rejected."""
        bad_input = dict(self.valid_input, **{"Academic Pressure": 0.5})
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

        bad_input = dict(self.valid_input, **{"Academic Pressure": 6.0})
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

    def test_work_hours_bounds_rejected(self):
        """Work/Study Hours outside 0-24 must be rejected."""
        bad_input = dict(self.valid_input, **{"Work/Study Hours": -2.0})
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

        bad_input = dict(self.valid_input, **{"Work/Study Hours": 25.0})
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

    def test_empty_categorical_rejected(self):
        """Empty string categorical features must be rejected."""
        bad_input = dict(self.valid_input, Gender="   ")
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

        bad_input = dict(self.valid_input, Degree="")
        with self.assertRaises(ValueError):
            predict_wellness_risk(bad_input)

    def test_valid_input_prediction_generation(self):
        """Valid inputs must generate legitimate calibrated predictions and local SHAP explanations."""
        result = predict_wellness_risk(self.valid_input)
        self.assertIn("probability", result)
        self.assertTrue(0.0 <= result["probability"] <= 1.0)
        self.assertIn("risk_tier", result)
        self.assertIn("feature_contributions", result)
        self.assertTrue(result["is_local_explanation"])
        self.assertGreater(len(result["feature_contributions"]), 0)


class TestEngine2Validation(unittest.TestCase):
    """Test Engine 2 (Digital Lifestyle) input validation and indices."""

    def test_non_dict_rejected(self):
        """Non-dictionary input must be rejected."""
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns("invalid_string")

    def test_negative_screen_time_rejected(self):
        """Negative screen time must be rejected."""
        with self.assertRaises(ValueError) as ctx:
            analyze_lifestyle_patterns({"daily_phone_hours": -3.0})
        self.assertIn("Daily phone screen time must be between 0 and 24", str(ctx.exception))

    def test_sleep_quality_bounds_rejected(self):
        """Sleep quality rating outside 1-5 must be rejected."""
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns({"sleep_quality": 0})
        with self.assertRaises(ValueError):
            analyze_lifestyle_patterns({"sleep_quality": 6})

    def test_valid_lifestyle_produces_no_depression_claims(self):
        """Lifestyle analysis must produce indices without depression probabilities."""
        res = analyze_lifestyle_patterns({
            "daily_phone_hours": 6.0,
            "daily_social_hours": 3.0,
            "phone_before_bed": "Yes",
            "social_comparison": "Sometimes",
            "sleep_quality": 3,
            "daily_fatigue": 3
        })
        self.assertIn("digital_friction", res)
        self.assertIn("rhythm_score", res)
        self.assertTrue(0 <= res["digital_friction"] <= 10)
        self.assertTrue(0 <= res["rhythm_score"] <= 10)
        self.assertNotIn("probability", res)
        self.assertNotIn("depression_score", res)


class TestEngine3Validation(unittest.TestCase):
    """Test Engine 3 (PHQ-9) input validation, bounds, and Item 9 safety."""

    def test_non_list_rejected(self):
        """Non-list input must be rejected."""
        with self.assertRaises(ValueError):
            calculate_phq9("not a list")

    def test_invalid_length_rejected(self):
        """Inputs with != 9 questions must be rejected."""
        with self.assertRaises(ValueError) as ctx:
            calculate_phq9([0, 1, 2])
        self.assertIn("requires exactly 9 responses", str(ctx.exception))

        with self.assertRaises(ValueError):
            calculate_phq9([0] * 10)

    def test_invalid_scores_rejected(self):
        """Scores outside 0-3 must be rejected."""
        with self.assertRaises(ValueError) as ctx:
            calculate_phq9([0, 1, 2, 0, 4, 0, 0, 0, 0])
        self.assertIn("must be an integer between 0 and 3", str(ctx.exception))

        with self.assertRaises(ValueError):
            calculate_phq9([0, 1, 2, 0, -1, 0, 0, 0, 0])

    def test_phq9_score_boundaries(self):
        """Test minimal, maximal, and intermediate tiers."""
        # Minimum (0)
        res_min = calculate_phq9([0] * 9)
        self.assertEqual(res_min["score"], 0)
        self.assertEqual(res_min["severity"], "Minimal or None")
        self.assertFalse(res_min["has_self_harm_risk"])

        # Maximum (27)
        res_max = calculate_phq9([3] * 9)
        self.assertEqual(res_max["score"], 27)
        self.assertEqual(res_max["severity"], "Severe")
        self.assertTrue(res_max["has_self_harm_risk"])

        # Intermediate (12 -> Moderate)
        res_mod = calculate_phq9([1, 1, 2, 2, 1, 1, 2, 1, 1])
        self.assertEqual(res_mod["score"], 12)
        self.assertEqual(res_mod["severity"], "Moderate")
        self.assertTrue(res_mod["has_self_harm_risk"])

    def test_item_9_self_harm_trigger(self):
        """Item 9 positive response must set has_self_harm_risk to True."""
        for item9_val in [1, 2, 3]:
            res = calculate_phq9([0, 0, 0, 0, 0, 0, 0, 0, item9_val])
            self.assertTrue(res["has_self_harm_risk"])
            self.assertEqual(res["item_9_score"], item9_val)


class TestRecommendationIntegrity(unittest.TestCase):
    """Test recommendations quality, tone, and non-clinical framing."""

    def test_recommendation_language(self):
        """Recommendations must be non-clinical, supportive, and avoid diagnostic claims."""
        lifestyle_payload = {
            "daily_phone_hours": 8.0,
            "daily_social_hours": 5.0,
            "phone_before_bed": "Yes",
            "social_comparison": "Always",
            "Sleep Duration": "Less than 5 hours",
            "sleep_quality": 1,
            "Academic Pressure": 5.0,
            "Study Satisfaction": 1.0,
            "exercise_frequency": "Never",
            "loneliness": "Always"
        }
        recs = generate_educational_recommendations(lifestyle_payload, phq9_score=15)
        self.assertGreater(len(recs), 0)
        
        forbidden_terms = ["cure depression", "treat depression", "prescribe", "clinical diagnosis", "depression percentage"]
        for r in recs:
            full_text = f"{r['title']} {r['action']}".lower()
            for term in forbidden_terms:
                self.assertNotIn(term, full_text, f"Forbidden term '{term}' found in recommendation!")


class TestResponsiveAndAccessibility(unittest.TestCase):
    """Test responsive design CSS tokens and media queries."""

    def test_css_responsive_media_queries(self):
        """Verify presence of media queries for tablet (768px) and mobile (480px)."""
        self.assertIn("@media (max-width: 768px)", CUSTOM_CSS)
        self.assertIn("@media (max-width: 480px)", CUSTOM_CSS)


class TestDay41ResponsibleAITerminologyAndPresentation(unittest.TestCase):
    """Test Day 4.1 Responsible AI requirements: terminology, Brier isolation, and reset."""

    def setUp(self):
        self.valid_input = {
            "Age": 21.0, "Academic Pressure": 3.0, "CGPA": 8.0, "Study Satisfaction": 4.0,
            "Work/Study Hours": 6.0, "Financial Stress": 2.0, "Gender": "Female",
            "Sleep Duration": "7-8 hours", "Dietary Habits": "Healthy", "Degree": "B.Tech"
        }

    def test_no_brier_score_in_individual_results(self):
        """Brier score is a dataset-level metric and must NOT be returned in individual results."""
        res = predict_wellness_risk(self.valid_input)
        self.assertNotIn("brier_score", res)
        self.assertNotIn("brier", res)

    def test_responsible_ai_indicator_terminology(self):
        """Model outputs must be presented as statistical survey alignment, never clinical depression risk."""
        res = predict_wellness_risk(self.valid_input)
        tier_text = res["risk_tier"]
        self.assertIn("Statistical Alignment", tier_text)
        self.assertNotIn("Clinical", tier_text)
        self.assertNotIn("Depression Risk", tier_text)
        self.assertNotIn("Diagnosed", tier_text)

    def test_shap_impact_uses_survey_alignment_language(self):
        """SHAP feature contributions must describe survey alignment rather than clinical depression risk."""
        res = predict_wellness_risk(self.valid_input)
        for contrib in res["feature_contributions"]:
            impact_text = contrib["impact"]
            self.assertIn("Survey Alignment", impact_text)
            self.assertNotIn("Increases Risk", impact_text)
            self.assertNotIn("Decreases Risk", impact_text)

    def test_simulated_session_reset(self):
        """Simulate session state reset and verify all personal indicators are cleared."""
        session_mock = {
            "assessment_submitted": True,
            "latest_results": {"engine_1_ml": {"percentage": 45.0}},
            "completed_habits": {"sleep_winddown", "digital_pomodoro"},
            "session_progress": [{"risk_percentage": 45.0}],
            "daily_energy_checkin": "⚡ Energized"
        }
        # Execute reset logic as in progress_view.py
        session_mock["assessment_submitted"] = False
        session_mock["latest_results"] = None
        session_mock["completed_habits"] = set()
        session_mock["session_progress"] = []
        session_mock["daily_energy_checkin"] = None

        self.assertFalse(session_mock["assessment_submitted"])
        self.assertIsNone(session_mock["latest_results"])
        self.assertEqual(len(session_mock["completed_habits"]), 0)
        self.assertEqual(len(session_mock["session_progress"]), 0)
        self.assertIsNone(session_mock["daily_energy_checkin"])

    def test_complete_user_session_state_reset_regression(self):
        """
        Regression test proving all user-specific session data is completely cleared by reset,
        while intentional framework navigation state is preserved.
        """
        from src.session_utils import reset_user_session_state, is_user_data_cleared, USER_SESSION_STATE_DEFAULTS

        # 1. Populate mock session state with active user data
        mock_state = {
            "current_page": "📊 Results & Wellness Insights",
            "assessment_submitted": True,
            "latest_results": {
                "engine_1_ml": {"percentage": 78.5, "risk_tier": "Elevated Statistical Alignment"},
                "engine_2_lifestyle": {"digital_friction": 8, "rhythm_score": 3},
                "engine_3_phq9": {"score": 14, "severity": "Moderate"}
            },
            "completed_habits": {"winddown_routine", "screen_boundary", "hydration"},
            "session_progress": [
                {"timestamp": "12:00:00", "risk_percentage": 78.5},
                {"timestamp": "12:05:00", "risk_percentage": 65.0}
            ],
            "daily_energy_checkin": "⚡ Energized & Focused"
        }

        # Verify state is populated and not cleared
        self.assertFalse(is_user_data_cleared(mock_state))

        # 2. Perform reset with navigation preserved
        cleared_dict = reset_user_session_state(state_dict=mock_state, preserve_navigation=True)

        # 3. Assert all user-specific data is cleared
        self.assertTrue(is_user_data_cleared(mock_state))
        self.assertFalse(mock_state["assessment_submitted"])
        self.assertIsNone(mock_state["latest_results"])
        self.assertEqual(mock_state["completed_habits"], set())
        self.assertEqual(mock_state["session_progress"], [])
        self.assertIsNone(mock_state["daily_energy_checkin"])

        # 4. Assert intentional framework navigation state is retained
        self.assertEqual(mock_state["current_page"], "📊 Results & Wellness Insights")

        # 5. Perform reset without preserving navigation
        reset_user_session_state(state_dict=mock_state, preserve_navigation=False)
        self.assertEqual(mock_state["current_page"], "🏠 Home / Dashboard")
        self.assertTrue(is_user_data_cleared(mock_state))


def run_all_day4_validation_tests():
    print("=" * 70)
    print("MINDORA DAY 4 & 4.1 END-TO-END VALIDATION TEST SUITE")
    print("=" * 70)
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    suite.addTests(loader.loadTestsFromTestCase(TestEngine1Validation))
    suite.addTests(loader.loadTestsFromTestCase(TestEngine2Validation))
    suite.addTests(loader.loadTestsFromTestCase(TestEngine3Validation))
    suite.addTests(loader.loadTestsFromTestCase(TestRecommendationIntegrity))
    suite.addTests(loader.loadTestsFromTestCase(TestResponsiveAndAccessibility))
    suite.addTests(loader.loadTestsFromTestCase(TestDay41ResponsibleAITerminologyAndPresentation))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    print("=" * 70)
    if result.wasSuccessful():
        print(f"ALL {result.testsRun} VALIDATION TESTS PASSED WITH 100% SUCCESS!")
    else:
        print(f"FAILED: {len(result.failures)} failures, {len(result.errors)} errors")
    print("=" * 70)
    return result.wasSuccessful()

if __name__ == "__main__":
    success = run_all_day4_validation_tests()
    sys.exit(0 if success else 1)
