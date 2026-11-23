"""
tests/model_parity/test_feature_contract.py
Validates that shared/contracts/feature_contract.json is bit-compatible
with the production models/best_model.pkl and validates the benchmark cases.
"""

import os
import sys
import json
import joblib
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class TestFeatureContract(unittest.TestCase):

    def setUp(self):
        self.root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.contract_path = os.path.join(self.root_dir, "shared", "contracts", "feature_contract.json")
        self.fixtures_path = os.path.join(self.root_dir, "shared", "fixtures", "benchmark_cases.json")
        self.model_path = os.path.join(self.root_dir, "models", "best_model.pkl")

        with open(self.contract_path, "r", encoding="utf-8") as f:
            self.contract = json.load(f)

        with open(self.fixtures_path, "r", encoding="utf-8") as f:
            self.fixtures = json.load(f)

    def test_01_feature_count_and_ordering(self):
        """Verify contract features count and ordering match exactly 10 features."""
        self.assertEqual(self.contract["approved_feature_count"], 10)
        self.assertEqual(len(self.contract["feature_order"]), 10)
        expected_order = [
            "Age", "Academic Pressure", "CGPA", "Study Satisfaction", 
            "Work/Study Hours", "Financial Stress", "Gender", 
            "Sleep Duration", "Dietary Habits", "Degree"
        ]
        self.assertEqual(self.contract["feature_order"], expected_order)

    def test_02_model_preprocessor_vocabulary_alignment(self):
        """Verify contract vocabularies match models/best_model.pkl exactly."""
        model = joblib.load(self.model_path)
        preprocessor = model.named_steps["preprocessor"]
        for name, trans, cols in preprocessor.transformers_:
            if name == "cat":
                enc = trans.named_steps["encoder"]
                for col_name, cats in zip(cols, enc.categories_):
                    self.assertEqual(
                        self.contract["features"][col_name]["vocabulary"],
                        list(cats),
                        f"Mismatch in vocabulary for {col_name}"
                    )

    def test_03_benchmark_fixtures_conformance(self):
        """Verify benchmark cases adhere to numeric bounds and feature sets."""
        for case in self.fixtures["cases"]:
            inputs = case["inputs"]
            for f_name in self.contract["feature_order"]:
                self.assertIn(f_name, inputs)
                spec = self.contract["features"][f_name]
                if spec["type"] == "numeric":
                    val = float(inputs[f_name])
                    self.assertGreaterEqual(val, spec["min"])
                    self.assertLessEqual(val, spec["max"])
                elif spec["type"] == "categorical":
                    # Unseen categories are allowed for testing handle_unknown
                    pass

if __name__ == "__main__":
    unittest.main()
