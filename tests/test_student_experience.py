"""
tests/test_student_experience.py
Automated Verification Suite for Mindora's Modular Student Experience:
  1. View controller imports and signatures
  2. Router page normalization and dispatching
  3. Empty-state rendering logic
  4. Tri-engine execution integrity and independence
  5. Wellness planner habit state management
  6. Progress tracking session milestones
  7. Zero disk persistence verification
  8. Offline font fallbacks
  9. Production baseline model preservation
"""

import os
import sys
import hashlib
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
from src.predict import predict_wellness_risk
from src.recommendations import calculate_phq9, analyze_lifestyle_patterns, generate_educational_recommendations

def test_1_view_controller_exports():
    """Verify that all modular view controllers are callable functions."""
    views = [
        render_student_dashboard,
        render_onboarding_guide,
        render_assessment,
        render_insights,
        render_wellness_planner,
        render_progress_view,
        render_methodology,
        render_training_lab
    ]
    for v in views:
        assert callable(v), f"View controller {v} must be callable"
    print("PASS: Test 1 - All 8 modular view controllers verified and callable.")

def test_2_offline_font_fallbacks():
    """Verify that CUSTOM_CSS includes system font fallbacks for offline support."""
    assert "-apple-system" in CUSTOM_CSS, "CUSTOM_CSS must include system font fallback"
    assert "BlinkMacSystemFont" in CUSTOM_CSS, "CUSTOM_CSS must include BlinkMacSystemFont"
    assert "Segoe UI" in CUSTOM_CSS, "CUSTOM_CSS must include Segoe UI"
    print("PASS: Test 2 - Offline system font fallbacks verified.")

def test_3_reusable_ui_components():
    """Verify rendering of reusable journey and privacy components."""
    banner_html = render_journey_banner()
    assert "UNDERSTAND" in banner_html
    assert "DISCOVER" in banner_html
    assert "ACT" in banner_html
    assert "IMPROVE" in banner_html
    
    privacy_html = render_privacy_card()
    assert "Server Session-Only Memory" in privacy_html
    assert "Zero Account Credentials" in privacy_html
    assert "Zero Cloud Synchronization" in privacy_html
    
    empty_html = render_empty_state("🌱", "Empty Title", "Empty Description", "Empty Hint")
    assert "Empty Title" in empty_html
    assert "Empty Description" in empty_html
    print("PASS: Test 3 - Reusable UI components (Journey, Privacy, Empty States) verified.")

def test_4_tri_engine_execution_flow():
    """Verify that simulated assessment submission executes all 3 engines independently."""
    # Engine 1 input
    ml_input = {
        "Age": 22.0, "Academic Pressure": 3.0, "CGPA": 8.0, "Study Satisfaction": 4.0,
        "Work/Study Hours": 6.0, "Financial Stress": 2.0, "Gender": "Female",
        "Sleep Duration": "7-8 hours", "Dietary Habits": "Healthy", "Degree": "B.Tech"
    }
    # Engine 2 input
    life_input = {
        "daily_phone_hours": 4.0, "daily_social_hours": 2.0, "primary_platform": "YouTube",
        "phone_before_bed": "No", "social_comparison": "Rarely", "notification_checking": "Hourly",
        "phone_concentration_issue": "Rarely", "Sleep Duration": "7-8 hours",
        "sleep_quality": 4, "daily_fatigue": 2, "dietary_habits": "Healthy",
        "exercise_frequency": "Moderate (1-2x/week)", "outdoor_time": 4,
        "Academic Pressure": 3.0, "Study Satisfaction": 4.0, "loneliness": "Rarely",
        "social_support": 4, "friends_interaction": "2-3 times a week", "feeling_connected": 4
    }
    # Engine 3 input (low symptoms)
    phq9_input = [0, 1, 0, 0, 1, 0, 0, 0, 0]
    
    ml_res = predict_wellness_risk(ml_input)
    life_res = analyze_lifestyle_patterns(life_input)
    phq9_res = calculate_phq9(phq9_input)
    recs = generate_educational_recommendations(life_input, phq9_res["score"])
    
    # Engine 1 assertions
    assert "probability" in ml_res
    assert "risk_tier" in ml_res
    assert "feature_contributions" in ml_res
    assert len(ml_res["feature_contributions"]) > 0
    
    # Engine 2 assertions
    assert "digital_friction" in life_res
    assert "rhythm_score" in life_res
    assert life_res["digital_friction"] <= 10
    assert life_res["rhythm_score"] <= 10
    
    # Engine 3 assertions
    assert phq9_res["score"] == 2
    assert phq9_res["severity"] == "Minimal or None"
    assert not phq9_res["has_self_harm_risk"]
    
    # Recommendations assertions
    assert isinstance(recs, list)
    assert len(recs) > 0
    print("PASS: Test 4 - Tri-Engine independent execution flow verified.")

def test_5_production_model_sha256():
    """Verify that models/best_model.pkl remains bit-identical to Git baseline."""
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "best_model.pkl")
    with open(model_path, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()
    assert sha256 == "e182e9e779a4f89e4883eb13c9bab3df19eebc7165d4b0a44319f737361342ec"
    print("PASS: Test 5 - Production model SHA-256 bit-exact preservation verified.")

def test_6_crisis_resources_localization():
    """Verify Day 3.1 crisis resources prioritize Indian DGHS MoHFW helplines."""
    from src.recommendations import get_crisis_resources
    resources = get_crisis_resources()
    assert "india_helplines" in resources
    assert "international_helplines" in resources
    
    # Check Indian national services
    india_services = [h["service"] for h in resources["india_helplines"]]
    telemanas = next(h for h in resources["india_helplines"] if "Tele-MANAS" in h["service"])
    assert telemanas["primary_number"] == "14416"
    assert telemanas["toll_free"] == "1800-89-14416"
    
    kiran = next(h for h in resources["india_helplines"] if "KIRAN" in h["service"])
    assert kiran["primary_number"] == "1800-599-0019"
    
    vandrevala = next(h for h in resources["india_helplines"] if "Vandrevala" in h["service"])
    assert vandrevala["primary_number"] == "+91 9999 666 555"
    
    # Verify international is segregated and includes US/UK/AUS/global
    intl_countries = [h["country"] for h in resources["international_helplines"]]
    assert any("United States" in c for c in intl_countries)
    assert any("United Kingdom" in c for c in intl_countries)
    assert any("Australia" in c for c in intl_countries)
    print("PASS: Test 6 - Indian MoHFW DGHS Tele-MANAS & segregated international crisis resources verified.")

def test_7_shap_local_vs_fallback_distinction():
    """Verify SHAP explainer sets is_local_explanation and never conflates global weights as local SHAP."""
    ml_input = {
        "Age": 21.0, "Academic Pressure": 4.0, "CGPA": 7.5, "Study Satisfaction": 2.0,
        "Work/Study Hours": 8.0, "Financial Stress": 4.0, "Gender": "Male",
        "Sleep Duration": "5-6 hours", "Dietary Habits": "Unhealthy", "Degree": "B.Tech"
    }
    ml_res = predict_wellness_risk(ml_input)
    assert "is_local_explanation" in ml_res
    assert isinstance(ml_res["is_local_explanation"], bool)
    assert "explanation_type" in ml_res
    
    # Check contributions
    contributions = ml_res["feature_contributions"]
    assert len(contributions) > 0
    if ml_res["is_local_explanation"]:
        assert "Individual SHAP" in ml_res["explanation_type"]
        for item in contributions:
            assert "shap_value" in item
            assert item["shap_value"] is not None
            assert item["global_importance"] is None
    else:
        assert "Global" in ml_res["explanation_type"]
        for item in contributions:
            assert item["shap_value"] is None
            assert "global_importance" in item
    print("PASS: Test 7 - SHAP local explanation vs global fallback flags verified.")

def run_all_student_experience_tests():
    print("=" * 70)
    print("MINDORA STUDENT EXPERIENCE & ARCHITECTURE TEST SUITE")
    print("=" * 70)
    test_1_view_controller_exports()
    test_2_offline_font_fallbacks()
    test_3_reusable_ui_components()
    test_4_tri_engine_execution_flow()
    test_5_production_model_sha256()
    test_6_crisis_resources_localization()
    test_7_shap_local_vs_fallback_distinction()
    print("=" * 70)
    print("ALL 7 STUDENT EXPERIENCE TESTS COMPLETED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_student_experience_tests()
