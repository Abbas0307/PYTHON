"""
tests/test_day12_privacy_architecture.py
Mindora – Day 12 Privacy, Data Classification & Consent Architecture Test Suite.

Verifies:
  1. Category A, B, and C field classifications and partition exclusivity.
  2. Absolute ineligibility of PHQ-9, Item 9, and free-form notes for persistence.
  3. Strict segregation of Category C optional fields (zero clinical scores).
  4. Consent architectural invariants (session-only default, no preselection).
  5. Policy contract: persistent storage is explicitly NOT implemented in production.
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.privacy_policy import (
    CATEGORY_A_FIELDS,
    CATEGORY_B_FIELDS,
    CATEGORY_C_FIELDS,
    CONSENT_INVARIANTS,
    is_field_eligible_for_persistence
)
from src.session_utils import USER_SESSION_STATE_DEFAULTS

class TestDay12PrivacyArchitecture(unittest.TestCase):

    def test_01_classification_partition_exclusivity(self):
        """Verify that Category A, B, and C sets are strictly mutually exclusive."""
        overlap_ab = CATEGORY_A_FIELDS.intersection(CATEGORY_B_FIELDS)
        overlap_ac = CATEGORY_A_FIELDS.intersection(CATEGORY_C_FIELDS)
        overlap_bc = CATEGORY_B_FIELDS.intersection(CATEGORY_C_FIELDS)
        
        self.assertEqual(len(overlap_ab), 0, f"Overlap between Category A and B: {overlap_ab}")
        self.assertEqual(len(overlap_ac), 0, f"Overlap between Category A and C: {overlap_ac}")
        self.assertEqual(len(overlap_bc), 0, f"Overlap between Category B and C: {overlap_bc}")

    def test_02_category_a_fields_strictly_forbidden_from_persistence(self):
        """Verify that all Category A mental health and crisis fields reject persistence."""
        for field in CATEGORY_A_FIELDS:
            self.assertFalse(
                is_field_eligible_for_persistence(field),
                f"Category A field '{field}' must never be eligible for persistent retention"
            )

    def test_03_category_b_fields_session_only_by_default(self):
        """Verify that Category B demographic and predictive fields reject persistence by default."""
        for field in CATEGORY_B_FIELDS:
            self.assertFalse(
                is_field_eligible_for_persistence(field),
                f"Category B field '{field}' must not be eligible for persistent retention"
            )

    def test_04_category_c_fields_strictly_non_clinical(self):
        """Verify that Category C optional fields contain zero clinical or predictive metrics."""
        clinical_keywords = ["phq", "score", "risk", "percentage", "tier", "suicide", "harm", "diagnosis"]
        for field in CATEGORY_C_FIELDS:
            self.assertTrue(
                is_field_eligible_for_persistence(field),
                f"Category C field '{field}' should be eligible for optional retention"
            )
            for kw in clinical_keywords:
                self.assertNotIn(
                    kw, field.lower(),
                    f"Category C field '{field}' improperly contains clinical keyword '{kw}'"
                )

    def test_05_phq9_item_9_absolute_ban(self):
        """Specific verification that PHQ-9 Item 9 is classified in Category A and barred from persistence."""
        self.assertIn("phq9_item_9", CATEGORY_A_FIELDS)
        self.assertIn("has_self_harm_risk", CATEGORY_A_FIELDS)
        self.assertFalse(is_field_eligible_for_persistence("phq9_item_9"))
        self.assertFalse(is_field_eligible_for_persistence("has_self_harm_risk"))

    def test_06_consent_invariants_specification(self):
        """Verify that consent invariants enforce privacy-first non-coercive defaults."""
        self.assertEqual(CONSENT_INVARIANTS["default_mode"], "SESSION_ONLY")
        self.assertFalse(CONSENT_INVARIANTS["account_required_for_exploration"])
        self.assertFalse(CONSENT_INVARIANTS["consent_preselected"])
        self.assertTrue(CONSENT_INVARIANTS["assessment_consent_separate_from_storage"])
        self.assertFalse(CONSENT_INVARIANTS["declining_storage_restricts_functionality"])
        self.assertTrue(CONSENT_INVARIANTS["right_to_withdraw"])
        self.assertTrue(CONSENT_INVARIANTS["right_to_erasure"])
        self.assertFalse(CONSENT_INVARIANTS["persistent_storage_implemented"])

    def test_07_session_defaults_align_with_session_only_mode(self):
        """Verify that existing session defaults remain strictly in-memory session-only."""
        self.assertFalse(USER_SESSION_STATE_DEFAULTS["assessment_submitted"])
        self.assertIsNone(USER_SESSION_STATE_DEFAULTS["latest_results"])
        self.assertEqual(len(USER_SESSION_STATE_DEFAULTS["completed_habits"]), 0)
        self.assertEqual(len(USER_SESSION_STATE_DEFAULTS["session_progress"]), 0)

if __name__ == "__main__":
    unittest.main()
