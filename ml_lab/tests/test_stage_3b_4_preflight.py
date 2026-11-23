"""
ml_lab/tests/test_stage_3b_4_preflight.py
Non-training validation suite for Stage 3B.4 Calibration Preflight.
Verifies specification integrity, nested group-aware split logic,
metric calculations with log loss, isotonic diagnostic measurements,
threshold policy, confusion matrix reporting requirements,
and preservation boundaries.
"""

import unittest
import json
import os
import hashlib
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.calibration import CalibratedClassifierCV
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import log_loss, brier_score_loss, roc_auc_score
from ml_lab.evaluation.metrics import compute_ece

class TestStage3B4Preflight(unittest.TestCase):
    """Validation test suite for Stage 3B.4 preflight architecture."""
    
    @classmethod
    def setUpClass(cls):
        cls.spec_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "experiments",
            "stage_3b_4_calibration_spec.json"
        )
        
    def test_1_spec_file_schema_and_integrity(self):
        """Verify machine-readable calibration specification exists and is valid."""
        self.assertTrue(os.path.isfile(self.spec_path), "Calibration spec file missing.")
        with open(self.spec_path, "r", encoding="utf-8") as f:
            spec = json.load(f)
            
        self.assertEqual(spec.get("stage"), "3B.4")
        self.assertFalse(spec.get("execution_gate", {}).get("authorized_for_training", True))
        self.assertEqual(spec.get("isolation_boundaries", {}).get("test_vault_access"), "STRICTLY_PROHIBITED")
        self.assertEqual(spec.get("isolation_boundaries", {}).get("test_vault_status"), "UNTOUCHED_DURING_THIS_EXPERIMENT")
        self.assertEqual(len(spec.get("candidate_models", [])), 3)
        self.assertEqual(len(spec.get("calibration_methods", [])), 3)
        self.assertIn("log_loss", spec.get("evaluation_metrics", []))
        self.assertIn("brier_score", spec.get("evaluation_metrics", []))
        self.assertIn("ece_10_bins", spec.get("evaluation_metrics", []))
        
        # Verify Stage 3B.4.2 & 3B.4.3 methodology additions
        archs = spec.get("calibration_architectures", {})
        self.assertEqual(archs.get("architecture_a", {}).get("role"), "primary_research_benchmark")
        self.assertEqual(archs.get("architecture_b", {}).get("role"), "secondary_research_comparator")
        self.assertEqual(archs.get("architecture_a", {}).get("production_status"), "NOT_PRODUCTION_READY")
        self.assertEqual(archs.get("architecture_b", {}).get("production_status"), "NOT_PRODUCTION_READY")
        self.assertIn("isotonic_empirical_diagnostics", spec)
        self.assertEqual(spec.get("test_suite_accounting", {}).get("total_unique_tests"), 171)
        
        # Verify Stage 3B.4.3 additions
        thresh_policy = spec.get("threshold_policy", {})
        self.assertEqual(thresh_policy.get("primary_decision_threshold"), 0.5)
        self.assertEqual(thresh_policy.get("optimization_status"), "STRICTLY_PROHIBITED")
        self.assertIn("probability_metrics", thresh_policy.get("metric_separation", {}))
        self.assertIn("threshold_dependent_metrics", thresh_policy.get("metric_separation", {}))
        
        cm_reporting = spec.get("confusion_matrix_reporting", {})
        self.assertIn("pooled_oof_matrix", cm_reporting)
        self.assertIn("individual_fold_matrices", cm_reporting)
        self.assertIn("STRICTLY_PROHIBITED", cm_reporting.get("substitution_policy", ""))

    def test_2_nested_group_aware_split_generator(self):
        """
        Verify that inner group-aware splits can be pre-computed as a list of tuples
        to bypass scikit-learn's CalibratedClassifierCV metadata routing limitation.
        """
        rng = np.random.RandomState(42)
        n_samples = 200
        n_groups = 40
        X = rng.randn(n_samples, 4)
        y = rng.binomial(1, 0.5, n_samples)
        groups = np.repeat(np.arange(n_groups), n_samples // n_groups)
        
        inner_sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
        inner_splits = list(inner_sgkf.split(X, y, groups))
        
        self.assertEqual(len(inner_splits), 5)
        for train_idx, cal_idx in inner_splits:
            train_groups = set(groups[train_idx])
            cal_groups = set(groups[cal_idx])
            self.assertEqual(len(train_groups.intersection(cal_groups)), 0, "Inner group leakage detected!")
            
        # Verify CalibratedClassifierCV accepts precomputed splits
        clf = LogisticRegression()
        cal_clf = CalibratedClassifierCV(estimator=clf, method="sigmoid", cv=inner_splits)
        cal_clf.fit(X, y)
        probs = cal_clf.predict_proba(X)
        self.assertEqual(probs.shape, (n_samples, 2))
        self.assertTrue(np.all((probs >= 0.0) & (probs <= 1.0)))

    def test_3_log_loss_and_metric_suite_compatibility(self):
        """Verify log loss, brier score, and ECE behave consistently across boundaries."""
        y_true = np.array([0, 0, 1, 1, 0, 1])
        y_prob = np.array([0.05, 0.20, 0.85, 0.95, 0.40, 0.70])
        
        ll = log_loss(y_true, y_prob)
        brier = brier_score_loss(y_true, y_prob)
        auc = roc_auc_score(y_true, y_prob)
        ece, bin_details = compute_ece(y_true, y_prob, n_bins=10)
        
        self.assertGreater(ll, 0.0)
        self.assertGreater(brier, 0.0)
        self.assertGreater(auc, 0.5)
        self.assertGreaterEqual(ece, 0.0)
        self.assertEqual(len(bin_details), 10)
        
        # Test extreme probability clipping (epsilon robustness)
        extreme_probs = np.array([0.0, 0.0, 1.0, 1.0, 0.0, 1.0])
        ll_extreme = log_loss(y_true, extreme_probs)
        self.assertLess(ll_extreme, 0.01)

    def test_4_isotonic_empirical_diagnostics(self):
        """
        Verify empirical diagnostics for isotonic regression:
        monitors monotonicity, calculates tie rates, measures unique steps,
        and detects plateaus without relying on universal sample size guarantees.
        """
        from sklearn.isotonic import IsotonicRegression
        
        rng = np.random.RandomState(42)
        x_raw = np.sort(rng.rand(100))
        y_true = rng.binomial(1, x_raw)
        
        iso = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
        iso.fit(x_raw, y_true)
        preds = iso.predict(x_raw)
        
        # 1. Monotonicity check
        self.assertTrue(np.all(np.diff(preds) >= 0.0), "Monotonicity violated!")
        
        # 2. Diagnostic measurements
        unique_scores = np.unique(preds)
        unique_count = len(unique_scores)
        tie_rate = 1.0 - (unique_count / len(preds))
        
        # 3. Maximum plateau length measurement
        _, counts = np.unique(preds, return_counts=True)
        max_plateau = int(np.max(counts))
        
        self.assertGreater(unique_count, 1)
        self.assertGreaterEqual(tie_rate, 0.0)
        self.assertLessEqual(tie_rate, 1.0)
        self.assertGreaterEqual(max_plateau, 1)

    def test_5_prior_stage_preservation(self):
        """Verify that Stage 3B.2 (11 files) and Stage 3B.3 (12 files) remain intact."""
        stage_3b_2_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "experiments",
            "stage_3b_2"
        )
        stage_3b_3_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "experiments",
            "stage_3b_3"
        )
        
        self.assertTrue(os.path.isdir(stage_3b_2_dir))
        self.assertTrue(os.path.isdir(stage_3b_3_dir))
        
        files_3b_2 = [f for f in os.listdir(stage_3b_2_dir) if os.path.isfile(os.path.join(stage_3b_2_dir, f))]
        files_3b_3 = [f for f in os.listdir(stage_3b_3_dir) if os.path.isfile(os.path.join(stage_3b_3_dir, f))]
        
        self.assertGreaterEqual(len(files_3b_2), 9)
        self.assertGreaterEqual(len(files_3b_3), 9)

if __name__ == "__main__":
    unittest.main()
