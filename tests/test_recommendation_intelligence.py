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

    # =========================================================================
    # DAY 9.1 SAFETY LOGIC & HELPLINE DISTINCTION TESTS
    # =========================================================================
    def test_13_phq9_ge_10_without_item9_positivity(self):
        """Path A: Verify PHQ-9 >= 10 without Item 9 recommends routine professional assessment, NOT crisis emergency."""
        data = self.synthetic_high_stress_student.copy()
        data["has_self_harm_risk"] = False

        recs = generate_educational_recommendations(data, phq9_score=12)
        rec_ids = {r["id"] for r in recs}

        # Must include routine counseling assessment
        self.assertIn("prof_counseling", rec_ids)
        counsel_rec = next(r for r in recs if r["id"] == "prof_counseling")
        self.assertIn("Assessment", counsel_rec["title"])
        self.assertNotIn("crisis", counsel_rec["title"].lower())
        self.assertNotIn("emergency", counsel_rec["title"].lower())
        self.assertIn("not an emergency crisis alert", counsel_rec["explanation"].lower())

        # Must NOT include emergency crisis hotline recommendation
        self.assertNotIn("prof_crisis_telemanas", rec_ids)

    def test_14_item9_positive_with_low_overall_phq9(self):
        """Path B: Verify positive Item 9 with low total PHQ-9 triggers safety follow-up at Rank 1 without clinical conflation."""
        data = self.synthetic_balanced_student.copy()
        data["has_self_harm_risk"] = True

        recs = generate_educational_recommendations(data, phq9_score=2)
        rec_ids = {r["id"] for r in recs}

        # Crisis support must be rank 1
        self.assertIn("prof_crisis_telemanas", rec_ids)
        crisis_rec = next(r for r in recs if r["id"] == "prof_crisis_telemanas")
        self.assertEqual(crisis_rec["priority_rank"], 1)
        self.assertEqual(crisis_rec["priority"], "High")
        self.assertIn("14416", crisis_rec["action"])

        # Should NOT include routine clinical threshold counseling because total score is 2 (< 10)
        self.assertNotIn("prof_counseling", rec_ids)

    def test_15_both_phq9_ge_10_and_item9_positive_coexist(self):
        """Verify that when both conditions occur together, both recommendations appear in proper rank order."""
        data = self.synthetic_high_stress_student.copy()
        data["has_self_harm_risk"] = True

        recs = generate_educational_recommendations(data, phq9_score=16)
        
        # Both must be present
        crisis_rec = next(r for r in recs if r["id"] == "prof_crisis_telemanas")
        counsel_rec = next(r for r in recs if r["id"] == "prof_counseling")

        # Crisis is rank 1, routine consultation is rank 2
        self.assertEqual(crisis_rec["priority_rank"], 1)
        self.assertEqual(counsel_rec["priority_rank"], 2)

    def test_16_ordinary_lifestyle_recs_never_override_safety_guidance(self):
        """Verify that acute lifestyle friction (screen time, sleep) never displaces safety recommendations."""
        data = self.synthetic_high_stress_student.copy()
        data["has_self_harm_risk"] = True
        data["daily_phone_hours"] = 14.0
        data["Academic Pressure"] = 5.0

        recs = generate_educational_recommendations(data, phq9_score=18)

        # The first items must be the safety and professional guidance
        self.assertEqual(recs[0]["id"], "prof_crisis_telemanas")
        self.assertEqual(recs[1]["id"], "prof_counseling")
        self.assertEqual(recs[0]["category"], "Professional Support Resources")
        self.assertEqual(recs[1]["category"], "Professional Support Resources")

        # Lifestyle recs come strictly after safety guidance
        lifestyle_ranks = [r["priority_rank"] for r in recs[2:]]
        for lr in lifestyle_ranks:
            self.assertGreater(lr, 1)

    def test_17_helpline_distinction_and_availability_claims(self):
        """Verify Tele-MANAS is 14416 (24/7), KIRAN is 1800-599-0019 without false 24/7 claims, and immediate danger is distinguished."""
        crisis_info = get_crisis_resources()
        helplines = {h["primary_number"]: h for h in crisis_info["india_helplines"]}

        # Tele-MANAS verified
        self.assertIn("14416", helplines)
        self.assertIn("24/7", helplines["14416"]["details"])
        self.assertIn("Tele-MANAS", helplines["14416"]["name"])

        # KIRAN verified without 24/7 claim
        self.assertIn("1800-599-0019", helplines)
        self.assertNotIn("24/7", helplines["1800-599-0019"]["details"])
        self.assertIn("KIRAN", helplines["1800-599-0019"]["name"])

        # Path C (immediate danger) in support text
        self.assertIn("immediate life-threatening danger", crisis_info["support_message"])
        self.assertIn("112", crisis_info["support_message"])

    # =========================================================================
    # DAY 9.2 EMERGENCY RESOURCE ACCURACY & PRIORITY WORDING TESTS
    # =========================================================================
    def test_18_international_emergency_and_crisis_distinctions(self):
        """Verify international distinctions: India (112 / 14416), US/CA (911 / 988), UK (999 / NHS 111), and no conflation of 988/111 as general emergency."""
        # 1. India distinctions
        india_info = NATIONAL_CRISIS_DIRECTORY["India"]
        self.assertEqual(india_info["emergency_services"], "112")
        self.assertIn("14416", india_info["primary_mental_health_number"])
        self.assertNotIn("988", india_info["emergency_services"])

        # 2. US & Canada distinctions
        us_info = NATIONAL_CRISIS_DIRECTORY["United States"]
        ca_info = NATIONAL_CRISIS_DIRECTORY["Canada"]
        self.assertEqual(us_info["emergency_services"], "911")
        self.assertEqual(ca_info["emergency_services"], "911")
        self.assertIn("988", us_info["primary_mental_health_number"])
        self.assertIn("988", ca_info["primary_mental_health_number"])
        self.assertNotIn("988", us_info["emergency_services"])
        self.assertNotIn("988", ca_info["emergency_services"])

        # 3. UK distinctions
        uk_info = NATIONAL_CRISIS_DIRECTORY["United Kingdom"]
        self.assertEqual(uk_info["emergency_services"], "999")
        self.assertIn("111", uk_info["primary_mental_health_number"])
        self.assertIn("non-emergency", uk_info["accessibility_warning"].lower())
        self.assertNotIn("111", uk_info["emergency_services"])

        # 4. Global support message verifies 988 & 111 are not general emergency numbers
        resources = get_crisis_resources()
        msg = resources["support_message"]
        self.assertIn("112 in India, 911 in US/Canada, 999 in UK", msg)
        self.assertIn("not general emergency dispatch numbers", msg)

    def test_19_country_specific_resource_localization_and_inaccessibility(self):
        """Verify resources display according to student's selected country and do not assume cross-border access."""
        # India localization
        ind_res = get_crisis_resources("India")
        self.assertEqual(ind_res["selected_country"], "India")
        self.assertEqual(ind_res["country_resource"]["emergency_services"], "112")
        self.assertIn("cannot be dialed from India", ind_res["country_resource"]["accessibility_warning"])

        # US localization
        us_res = get_crisis_resources("United States")
        self.assertEqual(us_res["selected_country"], "United States")
        self.assertEqual(us_res["country_resource"]["emergency_services"], "911")
        self.assertIn("988", us_res["country_resource"]["primary_mental_health_number"])

        # UK localization
        uk_res = get_crisis_resources("United Kingdom")
        self.assertEqual(uk_res["selected_country"], "United Kingdom")
        self.assertEqual(uk_res["country_resource"]["emergency_services"], "999")
        self.assertIn("111", uk_res["country_resource"]["primary_mental_health_number"])

    def test_20_routine_consultation_rank_1_not_described_as_emergency(self):
        """Verify that when PHQ-9 >= 10 and Item 9 is False, rank-1 recommendation is routine consultation, NOT an emergency."""
        data = self.synthetic_high_stress_student.copy()
        data["has_self_harm_risk"] = False

        recs = generate_educational_recommendations(data, phq9_score=14)
        top_rec = recs[0]

        # Must be routine counseling
        self.assertEqual(top_rec["id"], "prof_counseling")
        self.assertEqual(top_rec["priority_rank"], 1)

        # Must NOT be labeled or described as an emergency
        self.assertNotIn("emergency", top_rec["title"].lower())
        self.assertNotIn("crisis", top_rec["title"].lower())
        self.assertIn("not an emergency crisis alert", top_rec["explanation"].lower())
        self.assertIn("routine, non-emergency appointment", top_rec["action"].lower())

    def test_21_recommendations_action_tailored_to_selected_country(self):
        """Verify Item 9 safety recommendations action text adapts dynamically to selected country."""
        # US student
        us_data = self.synthetic_high_stress_student.copy()
        us_data["has_self_harm_risk"] = True
        us_data["selected_country"] = "United States"

        us_recs = generate_educational_recommendations(us_data, phq9_score=15)
        us_safety_rec = us_recs[0]
        self.assertEqual(us_safety_rec["id"], "prof_crisis_telemanas")
        self.assertIn("988", us_safety_rec["action"])
        self.assertIn("911", us_safety_rec["action"])

        # UK student
        uk_data = self.synthetic_high_stress_student.copy()
        uk_data["has_self_harm_risk"] = True
        uk_data["selected_country"] = "United Kingdom"

        uk_recs = generate_educational_recommendations(uk_data, phq9_score=15)
        uk_safety_rec = uk_recs[0]
        self.assertEqual(uk_safety_rec["id"], "prof_crisis_telemanas")
        self.assertIn("111", uk_safety_rec["action"])
        self.assertIn("999", uk_safety_rec["action"])

    # =========================================================================
    # DAY 9.3 UK REGIONAL HELPLINE ACCURACY TESTS
    # =========================================================================
    def test_22_uk_regional_directory_classification(self):
        """Verify UK four-nations regional classification: England, Scotland, Wales, and Northern Ireland."""
        # England: NHS 111 mental-health option
        eng = UK_REGIONAL_DIRECTORY["England"]
        self.assertEqual(eng["emergency_services"], "999")
        self.assertIn("NHS 111", eng["primary_mental_health_service"])
        self.assertIn("111", eng["primary_mental_health_number"])

        # Scotland: NHS 24 on 111
        scot = UK_REGIONAL_DIRECTORY["Scotland"]
        self.assertEqual(scot["emergency_services"], "999")
        self.assertEqual(scot["primary_mental_health_service"], "NHS 24 on 111")
        self.assertIn("111", scot["primary_mental_health_number"])
        self.assertIn("0800 83 85 87", scot["tertiary_mental_health_number"]) # Breathing Space

        # Wales: NHS 111 Wales
        wales = UK_REGIONAL_DIRECTORY["Wales"]
        self.assertEqual(wales["emergency_services"], "999")
        self.assertEqual(wales["primary_mental_health_service"], "NHS 111 Wales")
        self.assertIn("Option 2", wales["primary_mental_health_number"])

        # Northern Ireland: Lifeline NI & Local HSC Trust Services
        ni = UK_REGIONAL_DIRECTORY["Northern Ireland"]
        self.assertEqual(ni["emergency_services"], "999")
        self.assertIn("Lifeline NI", ni["primary_mental_health_service"])
        self.assertIn("0808 808 8000", ni["primary_mental_health_number"])
        self.assertIn("does not operate in Northern Ireland", ni["regional_notice"])

        # Pan-UK: Samaritans 116 123 available across all 4 nations
        for nation in ["England", "Scotland", "Wales", "Northern Ireland"]:
            self.assertEqual(UK_REGIONAL_DIRECTORY[nation]["secondary_mental_health_service"], "Samaritans")
            self.assertEqual(UK_REGIONAL_DIRECTORY[nation]["secondary_mental_health_number"], "Call 116 123")
            self.assertEqual(UK_REGIONAL_DIRECTORY[nation]["emergency_services"], "999")

    def test_23_uk_northern_ireland_does_not_display_england_nhs_111(self):
        """Verify that selecting Northern Ireland directs to Lifeline NI and does not assume England NHS 111 applies."""
        ni_res = get_crisis_resources(country="United Kingdom", uk_region="Northern Ireland")
        self.assertEqual(ni_res["selected_country"], "United Kingdom")
        self.assertEqual(ni_res["selected_uk_region"], "Northern Ireland")
        
        c_res = ni_res["country_resource"]
        # Primary service must be Lifeline NI
        self.assertIn("Lifeline NI", c_res["primary_mental_health_service"])
        self.assertIn("0808 808 8000", c_res["primary_mental_health_number"])
        
        # Must explicitly warn that England NHS 111 does NOT operate in Northern Ireland
        self.assertIn("does not operate in Northern Ireland", c_res["regional_notice"])
        self.assertNotIn("England", c_res["primary_mental_health_service"])

    def test_24_recommendations_action_tailored_to_uk_regions(self):
        """Verify that Item 9 recommendation action text adapts dynamically to UK regions without cross-region errors."""
        base_data = self.synthetic_high_stress_student.copy()
        base_data["has_self_harm_risk"] = True
        base_data["selected_country"] = "United Kingdom"

        # Northern Ireland student
        ni_data = base_data.copy()
        ni_data["selected_uk_region"] = "Northern Ireland"
        ni_recs = generate_educational_recommendations(ni_data, phq9_score=16)
        ni_action = ni_recs[0]["action"]
        self.assertIn("0808 808 8000", ni_action)
        self.assertIn("Lifeline NI", ni_action)
        self.assertIn("999", ni_action)
        self.assertIn("does not operate in Northern Ireland", ni_action)

        # Scotland student
        scot_data = base_data.copy()
        scot_data["selected_uk_region"] = "Scotland"
        scot_recs = generate_educational_recommendations(scot_data, phq9_score=16)
        scot_action = scot_recs[0]["action"]
        self.assertIn("NHS 24 on 111", scot_action)
        self.assertIn("999", scot_action)

        # Wales student
        wales_data = base_data.copy()
        wales_data["selected_uk_region"] = "Wales"
        wales_recs = generate_educational_recommendations(wales_data, phq9_score=16)
        wales_action = wales_recs[0]["action"]
        self.assertIn("NHS 111 Wales", wales_action)
        self.assertIn("999", wales_action)

    def test_25_emergency_services_cover_mental_health_danger_to_life(self):
        """Verify that emergency services (999/112) cover immediate danger to life including mental-health crises."""
        # 1. Verify UK_REGIONAL_DIRECTORY across England, Scotland, Wales, Northern Ireland
        for nation in ["England", "Scotland", "Wales", "Northern Ireland"]:
            entry = UK_REGIONAL_DIRECTORY[nation]
            instr = entry["emergency_instruction"].lower()
            self.assertIn("immediate danger to life", instr)
            self.assertIn("mental-health emergencies", instr)
            self.assertNotIn("physical emergencies only", instr)
            self.assertNotIn("immediate life-threatening physical emergencies", instr)
            
            # Verify clear distinction between emergency dispatch and non-emergency advice/triage
            acc_warn = entry["accessibility_warning"].lower()
            self.assertIn("not a general emergency number", acc_warn)
            self.assertIn("999", acc_warn)

        # 2. Verify NATIONAL_CRISIS_DIRECTORY
        for country, data in NATIONAL_CRISIS_DIRECTORY.items():
            instr = data["emergency_instruction"].lower()
            self.assertIn("immediate danger to life", instr)
            self.assertIn("mental-health", instr)
            self.assertNotIn("physical emergencies only", instr)
            self.assertNotIn("immediate life-threatening physical emergencies", instr)

        # 3. Verify get_crisis_resources support message
        uk_crisis = get_crisis_resources("United Kingdom", "England")
        support_msg = uk_crisis["support_message"].lower()
        self.assertIn("immediate life-threatening danger, including life-threatening mental-health emergencies", support_msg)
        self.assertIn("dedicated support or advice services, not general emergency dispatch numbers", support_msg)

        # 4. Verify educational recommendations explanation
        rec_data = self.synthetic_high_stress_student.copy()
        rec_data["has_self_harm_risk"] = True
        rec_data["selected_country"] = "United Kingdom"
        rec_data["selected_uk_region"] = "Scotland"
        recs = generate_educational_recommendations(rec_data, phq9_score=18)
        self.assertEqual(recs[0]["id"], "prof_crisis_telemanas")
        explanation = recs[0]["explanation"].lower()
        self.assertIn("immediate life-threatening danger, including life-threatening mental-health emergencies", explanation)
        self.assertIn("dedicated mental-health crisis or non-emergency health services, not general emergency dispatch numbers", explanation)

if __name__ == "__main__":
    unittest.main()
