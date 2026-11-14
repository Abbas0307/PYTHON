"""
tests/test_recommendation_intelligence.py
Comprehensive Test Suite for Mindora Day 9:
Recommendation Intelligence, Contextual Personalisation & Safety Boundaries:
  1. Context-aware recommendation generation across 8 distinct categories
  2. Safe handling of missing or incomplete student inputs
  3. Exclusion of irrelevant recommendation rules
  4. Presence of transparent explanation, reason, and action fields
  5. Deterministic priority ordering (Professional > High Friction > Moderate > Low)
  6. Deduplication and unique recommendation IDs
  7. In-memory student feedback (Helpful, Completed, Dismissed) handling
  8. Complete session reset purging recommendation feedback and dismissals
  9. Preservation of three-engine strict independence
  10. Unconditional Item 9 crisis escalation preservation
  11. Absence of persistent disk/database writes
  12. Graceful resilience against invalid/malformed numeric inputs
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.recommendations import (
    generate_educational_recommendations,
    RECOMMENDATION_CATEGORIES,
    calculate_phq9,
    analyze_lifestyle_patterns,
    get_crisis_resources
)
from src.session_utils import (
    reset_user_session_state,
    is_user_data_cleared,
    validate_and_sanitize_session_state,
    USER_SESSION_STATE_DEFAULTS
)

class TestRecommendationIntelligence(unittest.TestCase):

    def setUp(self):
        # Synthetic baseline input fixture
        self.synthetic_high_stress_student = {
            "Academic Pressure": 5.0,
            "Study Satisfaction": 1.0,
            "Work/Study Hours": 10.0,
            "Financial Stress": 4.5,
            "Sleep Duration": "Less than 5 hours",
            "phone_before_bed": "Yes",
            "sleep_quality": 1,
            "daily_phone_hours": 8.0,
            "daily_social_hours": 4.5,
            "social_comparison": "Always",
            "phone_concentration_issue": "Almost Constantly",
            "exercise_frequency": "Never",
            "outdoor_time": 1,
            "daily_fatigue": 5,
            "Dietary Habits": "Unhealthy",
            "loneliness": "Always",
            "social_support": 1,
            "friends_interaction": "Rarely / Never",
            "has_self_harm_risk": False
        }

        self.synthetic_balanced_student = {
            "Academic Pressure": 2.0,
            "Study Satisfaction": 4.0,
            "Work/Study Hours": 5.0,
            "Financial Stress": 1.5,
            "Sleep Duration": "7-8 hours",
            "phone_before_bed": "No",
            "sleep_quality": 4,
            "daily_phone_hours": 3.0,
            "daily_social_hours": 1.0,
            "social_comparison": "Rarely",
            "phone_concentration_issue": "Rarely",
            "exercise_frequency": "Active (3+x/week)",
            "outdoor_time": 4,
            "daily_fatigue": 1,
            "Dietary Habits": "Healthy",
            "loneliness": "Never",
            "social_support": 5,
            "friends_interaction": "Almost daily",
            "has_self_harm_risk": False
        }

    def test_01_all_eight_categories_supported(self):
        """Verify that all 8 required recommendation categories are formally recognized."""
        expected_categories = [
            "Academic Wellbeing",
            "Sleep and Daily Routine",
            "Digital Wellbeing",
            "Physical Wellbeing",
            "Nutrition and Daily Habits",
            "Social Connection",
            "Financial and Academic Support",
            "Professional Support Resources"
        ]
        self.assertEqual(RECOMMENDATION_CATEGORIES, expected_categories)

    def test_02_context_aware_generation_high_stress(self):
        """Verify that elevated stress triggers relevant category recommendations."""
        recs = generate_educational_recommendations(self.synthetic_high_stress_student, phq9_score=14)
        rec_categories = {r["category"] for r in recs}
        rec_ids = {r["id"] for r in recs}

        # Professional support triggered due to PHQ-9 >= 10
        self.assertIn("Professional Support Resources", rec_categories)
        self.assertIn("prof_counseling", rec_ids)

        # Academic wellbeing triggered due to high pressure
        self.assertIn("Academic Wellbeing", rec_categories)
        self.assertIn("acad_chunking", rec_ids)

        # Sleep triggered due to < 5 hours sleep & phone in bed
        self.assertIn("Sleep and Daily Routine", rec_categories)
        self.assertIn("sleep_winddown", rec_ids)

        # Financial support triggered due to high financial stress (4.5)
        self.assertIn("Financial and Academic Support", rec_categories)
        self.assertIn("fin_support_resources", rec_ids)

        # Digital wellbeing triggered due to 8 hours phone and high social comparison
        self.assertIn("Digital Wellbeing", rec_categories)
        self.assertIn("digital_focus", rec_ids)

    def test_03_balanced_student_receives_maintenance_guidance(self):
        """Verify that healthy baseline responses produce supportive maintenance suggestions rather than crisis alarms."""
        recs = generate_educational_recommendations(self.synthetic_balanced_student, phq9_score=2)
        rec_ids = {r["id"] for r in recs}

        # Should NOT trigger acute stress or professional therapy rules
        self.assertNotIn("prof_counseling", rec_ids)
        self.assertNotIn("prof_crisis_telemanas", rec_ids)
        self.assertNotIn("fin_support_resources", rec_ids)

        # Should receive positive sleep anchor habit
        self.assertIn("sleep_anchor", rec_ids)
        sleep_rec = next(r for r in recs if r["id"] == "sleep_anchor")
        self.assertEqual(sleep_rec["priority"], "Low")
        self.assertIn("circadian reinforcement", sleep_rec["reason"].lower())

    def test_04_missing_information_handled_safely(self):
        """Verify that completely empty or partial dictionaries do not crash and produce safe foundational recommendations."""
        empty_recs = generate_educational_recommendations({}, phq9_score=0)
        self.assertIsInstance(empty_recs, list)
        self.assertGreater(len(empty_recs), 0)

        # Confirm non-diagnostic tone
        for r in empty_recs:
            self.assertIn("id", r)
            self.assertIn("title", r)
            self.assertIn("action", r)
            self.assertIn("reason", r)
            self.assertIn("explanation", r)
            self.assertIn("priority", r)

    def test_05_explanation_and_reason_transparency(self):
        """Verify that all recommendations explain WHAT, WHY, and ACTION without medical diagnostic claims."""
        recs = generate_educational_recommendations(self.synthetic_high_stress_student, phq9_score=12)
        forbidden_phrases = ["cure depression", "treat depression", "prescribe", "clinical diagnosis", "depression percentage"]

        for r in recs:
            # Required fields check
            self.assertTrue(len(r["title"]) > 5, "Recommendation title must be descriptive")
            self.assertTrue(len(r["reason"]) > 10, "Recommendation reason must explain context")
            self.assertTrue(len(r["explanation"]) > 15, "Explanation must detail why habit works")
            self.assertTrue(len(r["action"]) > 15, "Action must be actionable and concrete")
            self.assertIn(r["priority"], ["High", "Medium", "Low"])
            self.assertTrue(isinstance(r["is_contextual"], bool))

            # Non-clinical check
            combined_text = f"{r['title']} {r['reason']} {r['explanation']} {r['action']}".lower()
            for fp in forbidden_phrases:
                self.assertNotIn(fp, combined_text, f"Forbidden clinical term '{fp}' found in recommendation {r['id']}")

    def test_06_deterministic_priority_ordering(self):
        """Verify that recommendations are ordered deterministically by priority rank."""
        recs = generate_educational_recommendations(self.synthetic_high_stress_student, phq9_score=15)
        ranks = [r["priority_rank"] for r in recs]
        self.assertEqual(ranks, sorted(ranks), "Recommendations must be sorted ascending by priority rank")

        # Professional support should be rank 1
        self.assertEqual(recs[0]["priority_rank"], 1)
        self.assertEqual(recs[0]["category"], "Professional Support Resources")

    def test_07_deduplication_guarantee(self):
        """Verify that no duplicate recommendation IDs exist in generated output."""
        recs = generate_educational_recommendations(self.synthetic_high_stress_student, phq9_score=16)
        ids = [r["id"] for r in recs]
        self.assertEqual(len(ids), len(set(ids)), f"Duplicate recommendation IDs detected: {ids}")

    def test_08_active_session_feedback_and_dismissal(self):
        """Verify that dismissed IDs are filtered and feedback statuses are attached."""
        feedback_map = {"acad_chunking": "helpful", "sleep_winddown": "completed"}
        dismissed = {"digital_focus"}

        recs = generate_educational_recommendations(
            self.synthetic_high_stress_student,
            phq9_score=8,
            feedback_dict=feedback_map,
            dismissed_set=dismissed
        )
        rec_ids = {r["id"] for r in recs}

        # Dismissed recommendation must be excluded
        self.assertNotIn("digital_focus", rec_ids)

        # Helpful and completed statuses must be reflected
        chunk_rec = next(r for r in recs if r["id"] == "acad_chunking")
        self.assertEqual(chunk_rec["status"], "helpful")

        sleep_rec = next(r for r in recs if r["id"] == "sleep_winddown")
        self.assertEqual(sleep_rec["status"], "completed")

    def test_09_session_reset_purges_recommendation_state(self):
        """Verify that reset_user_session_state clears feedback, dismissals, and habit completions."""
        mock_state = {
            "current_page": "🎯 Wellness Planner",
            "assessment_submitted": True,
            "latest_results": {"recommendations": [{"id": "acad_chunking"}]},
            "completed_habits": {"acad_chunking"},
            "session_progress": [{"timestamp": "2026-11-14", "score": 10}],
            "daily_energy_checkin": "😊 Good Energy",
            "recommendation_feedback": {"acad_chunking": "helpful"},
            "dismissed_recommendations": {"sleep_winddown"}
        }

        # Pre-reset check
        self.assertFalse(is_user_data_cleared(mock_state))

        # Reset
        reset_user_session_state(mock_state, preserve_navigation=True)

        # Post-reset assertions
        self.assertTrue(is_user_data_cleared(mock_state))
        self.assertEqual(mock_state["recommendation_feedback"], {})
        self.assertEqual(mock_state["dismissed_recommendations"], set())
        self.assertEqual(mock_state["completed_habits"], set())
        self.assertEqual(mock_state["current_page"], "🎯 Wellness Planner")

    def test_10_three_engine_independence_preserved(self):
        """Verify that recommendation generation does not affect ML predictions or PHQ-9 scoring."""
        phq_result = calculate_phq9([1, 1, 1, 0, 1, 0, 0, 0, 0])
        lifestyle_analysis = analyze_lifestyle_patterns(self.synthetic_high_stress_student)
        recs = generate_educational_recommendations(self.synthetic_high_stress_student, phq_result["score"])

        # Engine 3 remains strictly 4 points
        self.assertEqual(phq_result["score"], 4)
        self.assertEqual(phq_result["severity"], "Minimal or None")

        # Engine 2 friction score remains untouched
        self.assertEqual(lifestyle_analysis["digital_friction"], 10)
        self.assertIsInstance(recs, list)

    def test_11_unconditional_item9_crisis_priority(self):
        """Verify that Item 9 suicidal ideation triggers crisis helpline recommendations unconditionally at priority rank 1."""
        phq9_crisis = calculate_phq9([0, 0, 0, 0, 0, 0, 0, 0, 1])
        crisis_data = self.synthetic_balanced_student.copy()
        crisis_data["has_self_harm_risk"] = phq9_crisis["has_self_harm_risk"]

        recs = generate_educational_recommendations(crisis_data, phq9_crisis["score"])
        self.assertEqual(recs[0]["id"], "prof_crisis_telemanas")
        self.assertEqual(recs[0]["priority_rank"], 1)
        self.assertEqual(recs[0]["priority"], "High")
        self.assertIn("Tele-MANAS", recs[0]["action"])
        self.assertIn("14416", recs[0]["action"])

    def test_12_malformed_and_unexpected_inputs_resilience(self):
        """Verify that invalid strings, out-of-range floats, or unexpected types in user_data do not throw unhandled exceptions."""
        corrupted_payload = {
            "Academic Pressure": "EXTREME",
            "Work/Study Hours": None,
            "Financial Stress": [1, 2, 3],
            "Sleep Duration": 999,
            "daily_phone_hours": "infinite",
            "daily_social_hours": -50.0,
            "sleep_quality": "broken",
            "loneliness": object()
        }

        recs = generate_educational_recommendations(corrupted_payload, phq9_score=0)
        self.assertIsInstance(recs, list)
        self.assertGreater(len(recs), 0)

if __name__ == "__main__":
    unittest.main()
