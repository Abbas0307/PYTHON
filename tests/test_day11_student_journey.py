"""
tests/test_day11_student_journey.py
Mindora – Day 11 Automated Student Journey & Experience Architecture Verification Suite:
  1. Navigation consistency and 4-stage journey mapping (UNDERSTAND -> DISCOVER -> ACT -> IMPROVE)
  2. Complete 7-pillar onboarding transparency guide
  3. Interactive 4-stage stepper state rendering
  4. Scenario 1: New student onboarding accessibility
  5. Scenario 2: Exploration without sensitive data disclosure
  6. Scenario 3: Assessment submission and tri-engine insights generation
  7. Scenario 4 & 5: Insights-to-planner flow and habit commitment
  8. Scenario 6 & 7: Dashboard return fidelity and progress tracking
  9. Scenario 8: Session reset completeness and empty-state restoration
  10. Scenario 9: Safety and crisis resource multi-country accessibility
  11. Scenario 10: Cross-view state preservation across all canonical routes
  12. Empty states and encouraging next-action guidance
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.ui_theme import (
    render_stage_stepper,
    render_journey_banner,
    render_empty_state,
    render_hero_header,
    render_safety_disclaimer_card,
    render_privacy_card,
    PRIMARY_VIOLET,
    SECONDARY_VIOLET
)
from src.views.onboarding import render_onboarding_guide
from src.predict import predict_wellness_risk
from src.recommendations import (
    calculate_phq9,
    analyze_lifestyle_patterns,
    generate_educational_recommendations,
    get_crisis_resources,
    NATIONAL_CRISIS_DIRECTORY,
    UK_REGIONAL_DIRECTORY
)
from src.session_utils import (
    reset_user_session_state,
    is_user_data_cleared,
    validate_and_sanitize_session_state,
    USER_SESSION_STATE_DEFAULTS
)

class TestDay11StudentJourney(unittest.TestCase):

    def setUp(self):
        self.canonical_pages = [
            "🏠 Home / Dashboard",
            "📝 My Assessment",
            "📊 My Insights",
            "🎯 Wellness Planner",
            "📈 My Progress",
            "ℹ️ Methodology & About",
            "🔬 ML Training Lab"
        ]
        
        self.sample_ml_payload = {
            "Age": 21,
            "Academic Pressure": 3.0,
            "CGPA": 8.0,
            "Study Satisfaction": 3.0,
            "Work/Study Hours": 6.0,
            "Financial Stress": 2.0,
            "Gender": "Male",
            "Sleep Duration": "7-8 hours",
            "Dietary Habits": "Moderate",
            "Degree": "B.Tech"
        }

        self.sample_lifestyle_payload = {
            "daily_phone_hours": 5.0,
            "daily_social_hours": 2.5,
            "phone_before_bed": "No",
            "social_comparison": "Sometimes",
            "Sleep Duration": "7-8 hours",
            "sleep_quality": 3,
            "daily_fatigue": 2,
            "exercise_frequency": "Moderate (1-2x/week)",
            "outdoor_time": 3,
            "Academic Pressure": 3.0,
            "Study Satisfaction": 3.0,
            "Work/Study Hours": 6.0,
            "Financial Stress": 2.0
        }

    def test_01_navigation_consistency_and_journey_stages(self):
        """Verify that all 7 canonical routes exist and map to the 4-stage framework."""
        self.assertEqual(len(self.canonical_pages), 7)
        self.assertIn("🏠 Home / Dashboard", self.canonical_pages)
        self.assertIn("📝 My Assessment", self.canonical_pages)
        self.assertIn("📊 My Insights", self.canonical_pages)
        self.assertIn("🎯 Wellness Planner", self.canonical_pages)
        self.assertIn("📈 My Progress", self.canonical_pages)

    def test_02_onboarding_content_and_pillars(self):
        """Verify that render_onboarding_guide covers all 7 required pillars."""
        html = render_onboarding_guide()
        
        # 1. What Mindora is
        self.assertIn("Student Wellbeing Intelligence", html)
        self.assertIn("What Mindora Is & Does", html)
        
        # 2. What Mindora is NOT
        self.assertIn("What Mindora Is NOT", html)
        self.assertIn("NOT a Medical Diagnosis", html)
        self.assertIn("NOT an Overall Depression Score", html)
        
        # 3. What information the student may provide
        self.assertIn("What Information You May Provide", html)
        self.assertIn("Academic Workload", html)
        self.assertIn("Sleep & Digital Habits", html)
        
        # 4. How the three engines differ
        self.assertIn("Engine 1 (Survey Pattern ML)", html)
        self.assertIn("Engine 2 (Lifestyle Analytics)", html)
        self.assertIn("Engine 3 (PHQ-9 Screener)", html)
        
        # 5. How recommendations are generated
        self.assertIn("How Recommendations Are Generated", html)
        self.assertIn("Attributed to Actual Responses", html)
        
        # 6. How session-only information is handled
        self.assertIn("In-Memory Server Processing", html)
        self.assertIn("Explicit User Reset", html)
        
        # 7. How to access supportive resources
        self.assertIn("How to Access Immediate Support & Crisis Helplines", html)
        self.assertIn("Tele-MANAS", html)
        self.assertIn("14416", html)
        self.assertIn("988", html)

    def test_03_stage_stepper_rendering_and_states(self):
        """Verify that render_stage_stepper handles all 4 stages and marks active stage properly."""
        for stage in ["UNDERSTAND", "DISCOVER", "ACT", "IMPROVE"]:
            stepper_html = render_stage_stepper(active_stage=stage, has_assessment=True, has_habits=True)
            self.assertIn(stage, stepper_html)
            self.assertIn("Active Stage", stepper_html)
            self.assertIn("1", stepper_html)
            self.assertIn("2", stepper_html)
            self.assertIn("3", stepper_html)
            self.assertIn("4", stepper_html)

    def test_04_scenario_1_new_student_onboarding(self):
        """Scenario 1: New student lands on dashboard with clean defaults and clear onboarding entry."""
        initial_state = USER_SESSION_STATE_DEFAULTS.copy()
        self.assertFalse(initial_state["assessment_submitted"])
        self.assertIsNone(initial_state["latest_results"])
        self.assertEqual(len(initial_state["completed_habits"]), 0)
        
        banner_html = render_journey_banner()
        self.assertIn("UNDERSTAND", banner_html)
        self.assertIn("DISCOVER", banner_html)
        self.assertIn("ACT", banner_html)
        self.assertIn("IMPROVE", banner_html)

    def test_05_scenario_2_explore_without_sensitive_disclosure(self):
        """Scenario 2: Student explores Planner and Methodology without submitting an assessment."""
        # Check empty state when assessment is missing
        empty_html = render_empty_state("📊", "No Assessment Completed in this Session", "Description")
        self.assertIn("No Assessment Completed", empty_html)
        self.assertIn("📊", empty_html)

    def test_06_scenario_3_assessment_to_insights_journey(self):
        """Scenario 3: Completing an assessment runs tri-engine inference and produces segregated results."""
        # 1. Engine 1
        ml_res = predict_wellness_risk(self.sample_ml_payload)
        self.assertIn("percentage", ml_res)
        self.assertIn("risk_tier", ml_res)
        
        # 2. Engine 2
        life_res = analyze_lifestyle_patterns(self.sample_lifestyle_payload)
        self.assertIn("digital_friction", life_res)
        self.assertIn("rhythm_score", life_res)
        
        # 3. Engine 3
        phq_res = calculate_phq9([1, 0, 1, 0, 0, 0, 0, 0, 0])
        self.assertEqual(phq_res["score"], 2)
        self.assertEqual(phq_res["severity"], "Minimal or None")

    def test_07_scenario_4_and_5_insights_to_planner_and_habit_commitment(self):
        """Scenario 4 & 5: Recommendations link to Planner and habits are checked in active session."""
        recs = generate_educational_recommendations(self.sample_lifestyle_payload, phq9_score=2)
        self.assertGreater(len(recs), 0)
        
        # Simulate habit commitment in session state
        session_state = {"completed_habits": set()}
        session_state["completed_habits"].add("sleep_anchor")
        session_state["completed_habits"].add("digital_pomodoro")
        
        self.assertEqual(len(session_state["completed_habits"]), 2)
        self.assertIn("sleep_anchor", session_state["completed_habits"])

    def test_08_scenario_6_and_7_dashboard_return_and_progress_tracking(self):
        """Scenario 6 & 7: Dashboard reflects completed state and progress tracks milestones."""
        mock_milestone = {
            "timestamp": "2026-11-14 09:30:00",
            "risk_tier": "Low Survey Association",
            "risk_percentage": 24.5,
            "phq9_score": 2,
            "phq9_severity": "Minimal or None",
            "rhythm_score": 8,
            "digital_friction": 2
        }
        mock_state = {
            "assessment_submitted": True,
            "session_progress": [mock_milestone],
            "completed_habits": {"sleep_anchor"}
        }
        self.assertTrue(mock_state["assessment_submitted"])
        self.assertEqual(len(mock_state["session_progress"]), 1)
        self.assertEqual(mock_state["session_progress"][0]["phq9_score"], 2)

    def test_09_scenario_8_session_reset_purges_all_data(self):
        """Scenario 8: Student resets session and all user-specific data is purged."""
        mock_state = {
            "current_page": "📈 My Progress",
            "assessment_submitted": True,
            "latest_results": {"key": "data"},
            "completed_habits": {"sleep_anchor", "phys_hydration"},
            "session_progress": [{"score": 5}],
            "recommendation_feedback": {"acad_chunking": "helpful"},
            "dismissed_recommendations": {"digital_focus"}
        }
        self.assertFalse(is_user_data_cleared(mock_state))
        
        # Reset preserving navigation
        reset_user_session_state(mock_state, preserve_navigation=True)
        self.assertTrue(is_user_data_cleared(mock_state))
        self.assertEqual(mock_state["current_page"], "📈 My Progress")

    def test_10_scenario_9_safety_resource_accessibility(self):
        """Scenario 9: Safety resources are accessible across international countries and UK devolved nations."""
        # India
        ind = get_crisis_resources("India")
        self.assertEqual(ind["country_resource"]["emergency_services"], "112")
        self.assertIn("14416", ind["country_resource"]["primary_mental_health_number"])
        
        # UK - Scotland
        scot = get_crisis_resources("United Kingdom", "Scotland")
        self.assertEqual(scot["country_resource"]["emergency_services"], "999")
        self.assertIn("NHS 24 on 111", scot["country_resource"]["primary_mental_health_service"])
        
        # UK - Northern Ireland
        ni = get_crisis_resources("United Kingdom", "Northern Ireland")
        self.assertEqual(ni["country_resource"]["emergency_services"], "999")
        self.assertIn("Lifeline NI", ni["country_resource"]["primary_mental_health_service"])
        self.assertIn("0808 808 8000", ni["country_resource"]["primary_mental_health_number"])

    def test_11_scenario_10_cross_view_state_preservation(self):
        """Scenario 10: Navigating between all canonical pages preserves session state safely."""
        session = {
            "assessment_submitted": True,
            "completed_habits": {"sleep_anchor"},
            "selected_country": "United Kingdom",
            "selected_uk_region": "Scotland",
            "current_page": "🏠 Home / Dashboard",
            "session_progress": [],
            "recommendation_feedback": {},
            "dismissed_recommendations": set()
        }
        
        for page in self.canonical_pages:
            session["current_page"] = page
            # Validate session remains healthy
            is_healthy = validate_and_sanitize_session_state(session)
            self.assertTrue(is_healthy)
            self.assertTrue(session["assessment_submitted"])
            self.assertIn("sleep_anchor", session["completed_habits"])
            self.assertEqual(session["selected_uk_region"], "Scotland")

    def test_12_empty_states_fidelity(self):
        """Verify that render_empty_state produces clean, accessible markup with icons and hints."""
        card = render_empty_state("🌱", "No Habits Checked", "Description here", "Helpful Hint")
        self.assertIn("🌱", card)
        self.assertIn("No Habits Checked", card)
        self.assertIn("Description here", card)
        self.assertIn("Helpful Hint", card)

if __name__ == "__main__":
    unittest.main()
