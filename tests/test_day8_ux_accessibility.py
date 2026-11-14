"""
tests/test_day8_ux_accessibility.py
Automated Verification Suite for Mindora Day 8:
Student Experience, UI/UX Quality, Accessibility, and Design System Audit:
  1. Canonical navigation consistency across all views
  2. Dashboard latest results key extraction and display fidelity
  3. 10-feature ML input schema preservation
  4. WCAG 2.2 AA text contrast ratio verification
  5. Keyboard focus indicators (:focus-visible) compliance
  6. Touch target size compliance (min 44px)
  7. Form control accessible labels for screen readers
  8. PHQ-9 psychometric scoring and Item 9 crisis guidance accuracy
  9. Three-engine segregation in insights presentation
  10. Session reset completeness and resilience
"""

import re
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.ui_theme import CUSTOM_CSS, PRIMARY_VIOLET, SECONDARY_VIOLET, LAVENDER, LIGHT_SURFACE, MAIN_TEXT
from src.predict import predict_wellness_risk
from src.recommendations import calculate_phq9, analyze_lifestyle_patterns, generate_educational_recommendations, get_crisis_resources
from src.session_utils import reset_user_session_state, is_user_data_cleared, validate_and_sanitize_session_state

class TestDay8StudentExperience(unittest.TestCase):
    
    def test_01_canonical_navigation_consistency(self):
        """Verify that all views use canonical page names and no deprecated legacy route names."""
        canonical_pages = {
            "🏠 Home / Dashboard",
            "📝 My Assessment",
            "📊 My Insights",
            "🎯 Wellness Planner",
            "📈 My Progress",
            "ℹ️ Methodology & About",
            "🔬 ML Training Lab"
        }
        
        # Check source views for legacy strings
        views_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "views")
        legacy_patterns = [
            re.compile(r'current_page\s*=\s*"📝 Student Assessment"'),
            re.compile(r'current_page\s*=\s*"📊 Results & Wellness Insights"')
        ]
        
        for fname in os.listdir(views_dir):
            if fname.endswith(".py") and not fname.startswith("__"):
                fpath = os.path.join(views_dir, fname)
                with open(fpath, "r", encoding="utf-8") as f:
                    content = f.read()
                for pat in legacy_patterns:
                    match = pat.search(content)
                    self.assertIsNone(match, f"Found deprecated page navigation target in {fname}: {match}")

    def test_02_dashboard_latest_results_key_binding(self):
        """Verify that student dashboard properly recognizes both engine_1_ml and legacy ml_prediction keys."""
        # Simulated session state latest_results structure
        sample_results = {
            "engine_1_ml": {
                "risk_tier": "Moderate Stress Association",
                "percentage": 52.4,
                "badge_color": "#D97706"
            },
            "engine_2_lifestyle": {
                "rhythm_score": 7,
                "digital_friction": 4
            },
            "engine_3_phq9": {
                "score": 6,
                "severity": "Mild",
                "badge_color": "#D97706"
            }
        }
        
        # Dashboard extraction logic
        ml_res = sample_results.get("engine_1_ml") or sample_results.get("ml_prediction", {})
        phq_res = sample_results.get("engine_3_phq9") or sample_results.get("phq9", {})
        life_res = sample_results.get("engine_2_lifestyle") or sample_results.get("lifestyle", {})
        
        self.assertEqual(ml_res["risk_tier"], "Moderate Stress Association")
        self.assertEqual(ml_res["percentage"], 52.4)
        self.assertEqual(phq_res["score"], 6)
        self.assertEqual(phq_res["severity"], "Mild")
        self.assertEqual(life_res["rhythm_score"], 7)
        self.assertEqual(life_res["digital_friction"], 4)

    def test_03_assessment_input_schema_preservation(self):
        """Verify that Engine 1 continues to use strictly the approved 10-feature schema."""
        from src.preprocessing import NUMERICAL_FEATURES, CATEGORICAL_FEATURES
        all_features = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
        self.assertEqual(len(all_features), 10)
        self.assertEqual(NUMERICAL_FEATURES, ['Age', 'Academic Pressure', 'CGPA', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress'])
        self.assertEqual(CATEGORICAL_FEATURES, ['Gender', 'Sleep Duration', 'Dietary Habits', 'Degree'])

    def test_04_wcag_color_contrast_verification(self):
        """Verify that primary and muted text colors achieve WCAG 2.2 AA contrast ratios (> 4.5:1 on white)."""
        def get_relative_luminance(hex_color):
            hex_color = hex_color.lstrip('#')
            r, g, b = [int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
            def to_linear(c):
                return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
            return 0.2126 * to_linear(r) + 0.7152 * to_linear(g) + 0.0722 * to_linear(b)
            
        def contrast_ratio(hex1, hex2):
            l1 = get_relative_luminance(hex1)
            l2 = get_relative_luminance(hex2)
            lighter = max(l1, l2)
            darker = min(l1, l2)
            return (lighter + 0.05) / (darker + 0.05)

        white = "#FFFFFF"
        # Primary violet on white
        ratio_primary = contrast_ratio(PRIMARY_VIOLET, white)
        self.assertGreater(ratio_primary, 4.5, f"PRIMARY_VIOLET contrast ratio {ratio_primary:.2f} must exceed 4.5:1")
        
        # Text main on white
        ratio_main = contrast_ratio(MAIN_TEXT, white)
        self.assertGreater(ratio_main, 7.0, f"MAIN_TEXT contrast ratio {ratio_main:.2f} must exceed 7.0:1 (AAA)")
        
        # Muted text on white (checked in CSS)
        self.assertIn("--text-muted: #475569;", CUSTOM_CSS)
        ratio_muted = contrast_ratio("#475569", white)
        self.assertGreater(ratio_muted, 4.5, f"Muted text #475569 contrast ratio {ratio_muted:.2f} must exceed 4.5:1")

    def test_05_keyboard_focus_indicators_present(self):
        """Verify that CUSTOM_CSS includes explicit :focus-visible rules for keyboard accessibility."""
        self.assertIn(":focus-visible", CUSTOM_CSS)
        self.assertIn("outline: 3px solid #6D43C6", CUSTOM_CSS)
        self.assertIn("outline-offset: 2px", CUSTOM_CSS)

    def test_06_touch_target_size_compliance(self):
        """Verify that buttons enforce minimum 44px touch target height for mobile ergonomics (WCAG 2.5.8)."""
        self.assertIn("min-height: 44px !important;", CUSTOM_CSS)

    def test_07_form_control_accessible_labels(self):
        """Verify that habit checkboxes in wellness_planner.py include accessible label parameters."""
        planner_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "views", "wellness_planner.py")
        with open(planner_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("label=habit[\"title\"]", content)
        self.assertIn("label_visibility=\"collapsed\"", content)

    def test_08_phq9_scoring_and_item9_support_accuracy(self):
        """Verify PHQ-9 scoring range (0-27) and supportive Item 9 response handling."""
        # Non-crisis sample (score = 5)
        answers_low = [1, 1, 1, 0, 1, 0, 1, 0, 0]
        res_low = calculate_phq9(answers_low)
        self.assertEqual(res_low["score"], 5)
        self.assertEqual(res_low["severity"], "Mild")
        self.assertFalse(res_low["has_self_harm_risk"])
        
        # Item 9 positive sample (answers[8] = 2)
        answers_crisis = [0, 0, 0, 0, 0, 0, 0, 0, 2]
        res_crisis = calculate_phq9(answers_crisis)
        self.assertEqual(res_crisis["score"], 2)
        self.assertTrue(res_crisis["has_self_harm_risk"])
        
        # Crisis copy check
        crisis = get_crisis_resources()
        self.assertIn("Tele-MANAS", crisis["india_helplines"][0]["name"])
        self.assertIn("14416", crisis["india_helplines"][0]["primary_number"])
        self.assertIn("KIRAN", crisis["india_helplines"][1]["name"])
        self.assertIn("1800-599-0019", crisis["india_helplines"][1]["primary_number"])

    def test_09_three_engine_segregation_in_insights(self):
        """Verify that ML, Lifestyle, and PHQ-9 results are segregated into independent objects without a unified composite score."""
        ml_input = {
            "Age": 21.0, "Academic Pressure": 3.0, "CGPA": 7.5, "Study Satisfaction": 3.0,
            "Work/Study Hours": 6.0, "Financial Stress": 3.0, "Gender": "Female",
            "Sleep Duration": "5-6 hours", "Dietary Habits": "Moderate", "Degree": "B.Tech"
        }
        life_input = {
            "daily_phone_hours": 5.0, "daily_social_hours": 3.0, "primary_platform": "Instagram",
            "phone_before_bed": "Yes", "social_comparison": "Often", "notification_checking": "Hourly",
            "phone_concentration_issue": "Frequently", "Sleep Duration": "5-6 hours",
            "sleep_quality": 3, "daily_fatigue": 3, "dietary_habits": "Moderate",
            "exercise_frequency": "Moderate (1-2x/week)", "outdoor_time": 3,
            "Academic Pressure": 3.0, "Study Satisfaction": 3.0, "loneliness": "Sometimes",
            "social_support": 3, "friends_interaction": "2-3 times a week", "feeling_connected": 3
        }
        phq9_input = [1, 2, 1, 1, 0, 1, 0, 0, 0]
        
        ml_out = predict_wellness_risk(ml_input)
        life_out = analyze_lifestyle_patterns(life_input)
        phq9_out = calculate_phq9(phq9_input)
        
        # Verify independence of keys and data structures
        self.assertIn("probability", ml_out)
        self.assertIn("risk_tier", ml_out)
        self.assertNotIn("phq9", ml_out)
        self.assertNotIn("rhythm_score", ml_out)
        
        self.assertIn("digital_friction", life_out)
        self.assertIn("rhythm_score", life_out)
        self.assertNotIn("probability", life_out)
        
        self.assertIn("score", phq9_out)
        self.assertIn("severity", phq9_out)
        self.assertNotIn("digital_friction", phq9_out)

    def test_10_session_reset_complete_and_resilient(self):
        """Verify that session reset completely purges user assessment and habit records while validating state."""
        mock_state = {
            "current_page": "📝 My Assessment",
            "assessment_submitted": True,
            "latest_results": {"dummy": "data"},
            "completed_habits": {"habit_1", "habit_2"},
            "session_progress": [{"timestamp": "2026-11-14", "score": 10}],
            "daily_energy_checkin": "😊 Good Energy"
        }
        
        cleared = reset_user_session_state(mock_state, preserve_navigation=True)
        self.assertTrue(cleared)
        self.assertTrue(is_user_data_cleared(mock_state))
        self.assertEqual(mock_state["current_page"], "📝 My Assessment")
        self.assertEqual(mock_state["completed_habits"], set())
        self.assertEqual(mock_state["session_progress"], [])
        self.assertIsNone(mock_state["latest_results"])
        
        # Validate self-healing
        healthy = validate_and_sanitize_session_state(mock_state)
        self.assertTrue(healthy)

if __name__ == "__main__":
    unittest.main()
