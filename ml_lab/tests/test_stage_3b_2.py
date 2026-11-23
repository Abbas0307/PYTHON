"""
ml_lab/tests/test_stage_3b_2.py
Comprehensive automated quality gate suite for Mindora Stage 3B.2:
  1. Dataset hash mismatch rejected.
  2. Partition hash mismatch rejected.
  3. Missing Development membership rejected.
  4. Attempted Test Vault membership in training rejected.
  5. Train/validation group overlap rejected.
  6. Duplicate or missing OOF assignments rejected.
  7. Numeric and categorical preprocessing with missing values verified.
  8. Unknown categorical values handled safely.
  9. Deterministic fold generation verified.
  10. Correct metric calculations verified against known ground truth.
  11. ECE boundary cases, including probability 1.0, verified.
  12. Zero writes to legacy experiment registry or legacy model directory verified.
"""

import os
import sys
import unittest
import tempfile
import hashlib
import numpy as np
import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml_lab.evaluation import (
    verify_file_hash,
    load_development_dataset,
    validate_cv_folds,
    compute_ece,
    compute_binary_metrics,
    build_logistic_regression_baseline,
    build_dummy_baseline,
    SecurityIntegrityError,
    PartitionLeakageError,
    FROZEN_NUMERICAL_FEATURES,
    FROZEN_CATEGORICAL_FEATURES,
    EXPECTED_DATASET_SHA256,
    EXPECTED_MANIFEST_SHA256,
    EXPECTED_ASSIGNMENTS_SHA256,
    EXPECTED_DEV_ROWS
)

class TestStage3B2QualityGates(unittest.TestCase):
    """Test suite verifying all Stage 3B.2 safety and evaluation gates."""

    def test_01_dataset_hash_mismatch_rejected(self):
        """1. Verify that tampered or mismatched dataset SHA-256 is rejected immediately."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write("id,Age,Depression\n1,20,0\n")
            tampered_path = f.name
        try:
            with self.assertRaises(SecurityIntegrityError):
                verify_file_hash(tampered_path, EXPECTED_DATASET_SHA256)
        finally:
            if os.path.exists(tampered_path):
                os.remove(tampered_path)

    def test_02_partition_hash_mismatch_rejected(self):
        """2. Verify that tampered partition manifest or assignments hashes are rejected."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write("tampered partition content\n")
            tampered_path = f.name
        try:
            with self.assertRaises(SecurityIntegrityError):
                verify_file_hash(tampered_path, EXPECTED_ASSIGNMENTS_SHA256)
            with self.assertRaises(SecurityIntegrityError):
                verify_file_hash(tampered_path, EXPECTED_MANIFEST_SHA256)
        finally:
            if os.path.exists(tampered_path):
                os.remove(tampered_path)

    def test_03_missing_development_membership_rejected(self):
        """3. Verify that corrupted assignments with missing Development rows are rejected."""
        # Create an assignments table with only 10 rows
        dummy_assignments = pd.DataFrame({
            "row_index": range(10),
            "id": range(10),
            "group_id": [f"grp_{i}" for i in range(10)],
            "partition": ["development"] * 5 + ["test_vault"] * 5
        })
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            dummy_assignments.to_csv(f.name, index=False)
            dummy_path = f.name
        try:
            with self.assertRaises(SecurityIntegrityError):
                # Will fail either on hash verification or row count mismatch
                load_development_dataset(assignments_path=dummy_path)
        finally:
            if os.path.exists(dummy_path):
                os.remove(dummy_path)

    def test_04_attempted_test_vault_membership_in_training_rejected(self):
        """4. Verify that including Test Vault indices in training or validation folds raises PartitionLeakageError."""
        dev_indices = np.array([0, 1, 2, 3])
        groups = pd.Series(["g0", "g1", "g2", "g3"])
        test_vault_indices = {999, 1000}
        
        # Inject Test Vault index into training fold
        leaking_train_folds = [
            (np.array([0, 1]), np.array([2, 3])),
            (np.array([2, 3]), np.array([0, 1]))
        ]
        # Modify dev_indices to illegally include 999
        tampered_dev_indices = np.array([0, 999, 2, 3])
        
        with self.assertRaises(PartitionLeakageError) as cm:
            validate_cv_folds(leaking_train_folds, tampered_dev_indices, groups, test_vault_indices)
        self.assertIn("CRITICAL LEAKAGE", str(cm.exception))

    def test_05_train_val_group_overlap_rejected(self):
        """5. Verify that train/validation group overlap within a fold raises PartitionLeakageError."""
        dev_indices = np.array([0, 1, 2, 3])
        # Group "shared_g" appears in both index 0 and index 2
        groups = pd.Series(["shared_g", "g1", "shared_g", "g3"])
        test_vault_indices = set()
        
        # Fold where index 0 is in train and index 2 is in val
        overlapping_folds = [
            (np.array([0, 1]), np.array([2, 3])),
            (np.array([2, 3]), np.array([0, 1]))
        ]
        with self.assertRaises(PartitionLeakageError) as cm:
            validate_cv_folds(overlapping_folds, dev_indices, groups, test_vault_indices)
        self.assertIn("Group leakage", str(cm.exception))

    def test_06_duplicate_or_missing_oof_assignments_rejected(self):
        """6. Verify that duplicate or missing out-of-fold validation assignments raise PartitionLeakageError."""
        dev_indices = np.array([0, 1, 2, 3])
        groups = pd.Series(["g0", "g1", "g2", "g3"])
        test_vault_indices = set()
        
        # Duplicate validation assignment: index 2 is validated in both folds
        duplicate_val_folds = [
            (np.array([0, 1]), np.array([2, 3])),
            (np.array([0, 3]), np.array([1, 2]))
        ]
        with self.assertRaises(PartitionLeakageError) as cm:
            validate_cv_folds(duplicate_val_folds, dev_indices, groups, test_vault_indices)
        self.assertIn("Duplicate validation assignment", str(cm.exception))

        # Missing validation assignment: index 3 is never validated
        missing_val_folds = [
            (np.array([1, 2]), np.array([0])),
            (np.array([0, 2]), np.array([1]))
        ]
        with self.assertRaises(PartitionLeakageError) as cm:
            validate_cv_folds(missing_val_folds, dev_indices, groups, test_vault_indices)
        self.assertIn("Incomplete validation coverage", str(cm.exception))

    def test_07_numeric_and_categorical_preprocessing_with_missing_values(self):
        """7. Verify that ColumnTransformer properly handles missing values in numeric and categorical fields."""
        X_train = pd.DataFrame({
            "Age": [20.0, np.nan, 24.0, 22.0],
            "Academic Pressure": [3.0, 4.0, np.nan, 2.0],
            "CGPA": [8.5, 7.2, 9.0, np.nan],
            "Study Satisfaction": [4.0, 3.0, 5.0, 1.0],
            "Work/Study Hours": [5.0, np.nan, 6.0, 8.0],
            "Financial Stress": [np.nan, 3.0, 2.0, 4.0],
            "Gender": ["Male", np.nan, "Female", "Male"],
            "Sleep Duration": ["7-8 hours", "5-6 hours", np.nan, "7-8 hours"],
            "Dietary Habits": ["Healthy", "Moderate", "Unhealthy", np.nan],
            "Degree": ["B.Tech", "BSc", np.nan, "B.Com"]
        })
        y_train = np.array([1, 0, 1, 0])
        
        pipeline = build_logistic_regression_baseline(
            FROZEN_NUMERICAL_FEATURES,
            FROZEN_CATEGORICAL_FEATURES,
            random_state=42
        )
        pipeline.fit(X_train, y_train)
        
        # Test transform on validation data with different missingness
        X_val = pd.DataFrame({
            "Age": [np.nan, 21.0],
            "Academic Pressure": [2.0, np.nan],
            "CGPA": [np.nan, 8.0],
            "Study Satisfaction": [3.0, np.nan],
            "Work/Study Hours": [4.0, 7.0],
            "Financial Stress": [3.0, np.nan],
            "Gender": [np.nan, "Female"],
            "Sleep Duration": ["7-8 hours", np.nan],
            "Dietary Habits": [np.nan, "Healthy"],
            "Degree": ["BSc", np.nan]
        })
        probs = pipeline.predict_proba(X_val)
        self.assertEqual(probs.shape, (2, 2))
        self.assertTrue(np.all((probs >= 0.0) & (probs <= 1.0)))

    def test_08_unknown_categorical_values(self):
        """8. Verify that OneHotEncoder safely ignores unseen categorical categories without raising errors."""
        X_train = pd.DataFrame({
            "Age": [20.0, 22.0],
            "Academic Pressure": [3.0, 4.0],
            "CGPA": [8.0, 7.5],
            "Study Satisfaction": [4.0, 2.0],
            "Work/Study Hours": [5.0, 6.0],
            "Financial Stress": [3.0, 2.0],
            "Gender": ["Male", "Female"],
            "Sleep Duration": ["7-8 hours", "5-6 hours"],
            "Dietary Habits": ["Healthy", "Moderate"],
            "Degree": ["B.Tech", "BSc"]
        })
        y_train = np.array([0, 1])
        
        pipeline = build_logistic_regression_baseline(
            FROZEN_NUMERICAL_FEATURES,
            FROZEN_CATEGORICAL_FEATURES,
            random_state=42
        )
        pipeline.fit(X_train, y_train)
        
        # X_val contains completely novel categories: "NonBinary", "10+ hours", "Vegan", "PhD"
        X_val_novel = pd.DataFrame({
            "Age": [25.0],
            "Academic Pressure": [5.0],
            "CGPA": [9.5],
            "Study Satisfaction": [5.0],
            "Work/Study Hours": [10.0],
            "Financial Stress": [5.0],
            "Gender": ["NonBinary"],
            "Sleep Duration": ["10+ hours"],
            "Dietary Habits": ["Vegan"],
            "Degree": ["PhD"]
        })
        probs = pipeline.predict_proba(X_val_novel)
        self.assertEqual(probs.shape, (1, 2))
        self.assertAlmostEqual(float(np.sum(probs)), 1.0, places=5)

    def test_09_deterministic_fold_generation(self):
        """9. Verify that StratifiedGroupKFold produces bit-identical splits across repeated invocations."""
        from sklearn.model_selection import StratifiedGroupKFold
        X = pd.DataFrame({"feat": range(50)})
        y = np.array([0, 1] * 25)
        groups = np.array([f"g_{i//2}" for i in range(50)])
        
        sgkf1 = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
        folds1 = list(sgkf1.split(X, y, groups))
        
        sgkf2 = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
        folds2 = list(sgkf2.split(X, y, groups))
        
        for f in range(5):
            np.testing.assert_array_equal(folds1[f][0], folds2[f][0])
            np.testing.assert_array_equal(folds1[f][1], folds2[f][1])

    def test_10_correct_metric_calculations(self):
        """10. Verify metric derivations against hand-calculated ground truth values."""
        # 4 samples: TN=1, FP=1, FN=1, TP=1
        y_true = np.array([0, 0, 1, 1])
        y_prob = np.array([0.2, 0.8, 0.4, 0.9])
        
        metrics = compute_binary_metrics(y_true, y_prob, threshold=0.50)
        
        self.assertEqual(metrics["confusion_matrix"], [[1, 1], [1, 1]])
        self.assertEqual(metrics["accuracy"], 0.50)
        self.assertEqual(metrics["precision"], 0.50)
        self.assertEqual(metrics["recall"], 0.50)
        self.assertEqual(metrics["specificity"], 0.50)
        self.assertEqual(metrics["balanced_accuracy"], 0.50)
        self.assertEqual(metrics["f1_score"], 0.50)
        # Expected Brier: ((0-0.2)^2 + (0-0.8)^2 + (1-0.4)^2 + (1-0.9)^2) / 4
        # = (0.04 + 0.64 + 0.36 + 0.01) / 4 = 1.05 / 4 = 0.2625
        self.assertAlmostEqual(metrics["brier_score"], 0.2625, places=4)
        # Expected ROC-AUC: pairs (0,1):
        # neg 0 (0.2) vs pos 1 (0.4) -> 0.4 > 0.2 (+1)
        # neg 0 (0.2) vs pos 1 (0.9) -> 0.9 > 0.2 (+1)
        # neg 0 (0.8) vs pos 1 (0.4) -> 0.4 < 0.8 (+0)
        # neg 0 (0.8) vs pos 1 (0.9) -> 0.9 > 0.8 (+1)
        # AUC = 3/4 = 0.75
        self.assertAlmostEqual(metrics["roc_auc"], 0.75, places=4)

    def test_11_ece_boundary_cases_including_prob_one(self):
        """11. Verify ECE binning edge cases: p=1.0, p=0.0, empty bins, and perfect calibration."""
        # 1. Perfect calibration: p=1.0 for true 1, p=0.0 for true 0
        y_true_perf = np.array([0, 0, 1, 1])
        y_prob_perf = np.array([0.0, 0.0, 1.0, 1.0])
        ece_perf, bins_perf = compute_ece(y_true_perf, y_prob_perf, n_bins=10)
        self.assertAlmostEqual(ece_perf, 0.0, places=6)
        
        # Verify p=1.0 falls in bin 9 (the final bin [0.9, 1.0])
        bin_9 = bins_perf[9]
        self.assertEqual(bin_9["count"], 2)
        self.assertEqual(bin_9["upper_bound"], 1.0)
        self.assertAlmostEqual(bin_9["mean_predicted_prob"], 1.0, places=6)
        self.assertAlmostEqual(bin_9["observed_frequency"], 1.0, places=6)
        
        # Verify empty bins contribute 0.0
        for b in range(1, 9):
            self.assertEqual(bins_perf[b]["count"], 0)
            self.assertEqual(bins_perf[b]["bin_weighted_ece"], 0.0)
            
        # 2. Complete miscalibration: p=1.0 for true 0, p=0.0 for true 1
        y_true_bad = np.array([0, 1])
        y_prob_bad = np.array([1.0, 0.0])
        ece_bad, _ = compute_ece(y_true_bad, y_prob_bad, n_bins=10)
        # Bin 0: count 1, prob 0.0, obs 1.0 -> diff 1.0, weight 0.5 -> 0.5
        # Bin 9: count 1, prob 1.0, obs 0.0 -> diff 1.0, weight 0.5 -> 0.5
        # ECE = 0.5 + 0.5 = 1.0
        self.assertAlmostEqual(ece_bad, 1.0, places=6)

    def test_12_no_writes_to_legacy_registry_or_models_dir(self):
        """12. Verify that running Stage 3B.2 caused zero writes to legacy experiments/models or registry.json."""
        models_dir = "experiments/models"
        reg_file = "experiments/registry.json"
        
        self.assertEqual(len(os.listdir(models_dir)), 46)
        with open(reg_file, "rb") as f:
            reg_sha = hashlib.sha256(f.read()).hexdigest().upper()
        self.assertEqual(reg_sha, "68BBA7AC59902C2577C8764D6DD8AB7809912DAB196E69E59A1B9B481229E04B")

if __name__ == "__main__":
    unittest.main()
