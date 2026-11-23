"""
src/privacy_policy.py
Mindora – Day 12 Privacy, Data Classification & Consent Policy Definitions.

Pure architectural specification defining data classifications, retention
boundaries, and consent invariants. Contains ZERO database, network,
or storage side-effects.

Architecture Stage: Day 12 (Policy & Design Specification)
Implementation Status: SPECIFICATION ONLY (NOT IMPLEMENTED IN PRODUCTION STORAGE)
"""

from typing import Dict, Any, List, Set

# ==============================================================================
# THREE DATA CLASSIFICATIONS (DAY 12 SPECIFICATION)
# ==============================================================================

# CATEGORY A: Highly Sensitive Information
# Strict Policy: NEVER eligible for persistent retention. Strictly session-only.
# Never used for profiling, retraining, or longitudinal tracking.
CATEGORY_A_FIELDS: Set[str] = {
    "phq9_answers",           # Raw 9-question ordinal answers (0-3)
    "phq9_item_9",            # Self-harm / suicidal thoughts item
    "phq9_total_score",       # Aggregate score (0-27)
    "phq9_severity",          # Clinical tier (Minimal, Mild, Moderate, etc.)
    "has_self_harm_risk",     # Crisis safeguard trigger
    "optional_notes",         # Free-form personal reflections/text disclosures
    "crisis_helpline_access"  # Timestamp/record of crisis resource clicks
}

# CATEGORY B: Personal Student Information
# Strict Policy: Session-only by default. Ineligible for persistent retention
# under ordinary personalization. Pseudonymization does NOT render these non-sensitive.
CATEGORY_B_FIELDS: Set[str] = {
    "age",
    "gender",
    "degree",
    "cgpa",
    "academic_pressure",
    "study_satisfaction",
    "work_study_hours",
    "financial_stress",
    "sleep_duration",
    "dietary_habits",
    "daily_phone_hours",
    "daily_social_hours",
    "primary_platform",
    "phone_before_bed",
    "social_comparison",
    "notification_checking",
    "phone_concentration_issue",
    "sleep_quality",
    "daily_fatigue",
    "exercise_frequency",
    "outdoor_time",
    "loneliness",
    "social_support",
    "friends_interaction",
    "feeling_connected",
    "ml_risk_percentage",
    "ml_risk_tier",
    "shap_feature_contributions",
    "lifestyle_rhythm_score",
    "digital_friction_score"
}

# CATEGORY C: Optional Progress Information
# Strict Policy: Eligible for strictly OPTIONAL, opt-in persistent retention
# with separate, explicit, non-coercive student consent.
CATEGORY_C_FIELDS: Set[str] = {
    "completed_habit_ids",           # Non-clinical habit IDs (e.g. 'sleep_anchor')
    "selected_habit_domains",        # Non-clinical interest tags (e.g. 'Sleep Hygiene')
    "checkin_completion_dates",      # Plain calendar dates of check-in (NO scores)
    "recommendation_feedback_types", # High-level feedback ("helpful"/"unhelpful") on habit IDs
    "selected_country",              # Regional directory preference for emergency hotlines
    "selected_uk_region"             # Devolved nation selector for UK mental health triage
}

# ==============================================================================
# MINIMAL VIABLE INITIAL RETENTION SCHEMA (DAY 12 REFINED SPECIFICATION)
# ==============================================================================
# The smallest viable schema for any future optional persistence:
# Strictly restricted to non-clinical habit IDs (e.g., 'sleep_anchor', 'digital_pomodoro').
# Excludes calendar dates, temporal frequency patterns, subjective feedback ratings,
# and geographic preference tags to prevent behavioral tracking or inferential profiling.
MINIMAL_INITIAL_RETENTION_SCHEMA: Set[str] = {
    "completed_habit_ids"
}

# ==============================================================================
# CONSENT & RETENTION INVARIANTS
# ==============================================================================

CONSENT_INVARIANTS: Dict[str, Any] = {
    "default_mode": "SESSION_ONLY",
    "account_required_for_exploration": False,
    "consent_preselected": False,
    "assessment_consent_separate_from_storage": True,
    "declining_storage_restricts_functionality": False,
    "right_to_withdraw": True,
    "right_to_erasure": True,
    "persistent_storage_implemented": False
}

def is_field_eligible_for_persistence(field_name: str) -> bool:
    """
    Evaluates whether a field name is eligible for optional persistent retention.
    Returns True ONLY for Category C fields.
    Returns False for Category A (Strictly Forbidden) and Category B (Session-Only Default).
    """
    clean_field = field_name.strip().lower()
    if clean_field in CATEGORY_A_FIELDS or clean_field in CATEGORY_B_FIELDS:
        return False
    return clean_field in CATEGORY_C_FIELDS
