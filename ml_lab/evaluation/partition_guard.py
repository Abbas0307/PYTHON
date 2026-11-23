"""
ml_lab/evaluation/partition_guard.py
Automated fail-closed security and boundary enforcement for Development partition.
Prevents any access, inclusion, or evaluation on Test Vault records.
"""

import os
import hashlib
import pandas as pd
import numpy as np
from typing import Tuple, List, Set, Dict, Any, Optional

EXPECTED_DATASET_SHA256 = "A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404"
EXPECTED_MANIFEST_SHA256 = "A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070"
EXPECTED_ASSIGNMENTS_SHA256 = "91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1"

FROZEN_NUMERICAL_FEATURES = [
    "Age", "Academic Pressure", "CGPA", "Study Satisfaction", "Work/Study Hours", "Financial Stress"
]
FROZEN_CATEGORICAL_FEATURES = [
    "Gender", "Sleep Duration", "Dietary Habits", "Degree"
]
FROZEN_ALL_FEATURES = FROZEN_NUMERICAL_FEATURES + FROZEN_CATEGORICAL_FEATURES
FROZEN_TARGET = "Depression"

EXPECTED_TOTAL_ROWS = 27901
EXPECTED_DEV_ROWS = 23716
EXPECTED_TEST_VAULT_ROWS = 4185

class SecurityIntegrityError(Exception):
    """Raised when cryptographic hashes or partition integrity checks fail."""
    pass

class PartitionLeakageError(Exception):
    """Raised when Test Vault rows, group overlap, or split violations are detected."""
    pass

def verify_file_hash(path: str, expected_sha: str) -> None:
    """Verify that a file exists and matches its expected SHA-256 digest."""
    if not os.path.exists(path):
        raise SecurityIntegrityError(f"Required file does not exist: {path}")
    with open(path, "rb") as f:
        actual_sha = hashlib.sha256(f.read()).hexdigest().upper()
    if actual_sha != expected_sha.upper():
        raise SecurityIntegrityError(
            f"Cryptographic hash mismatch for {path}!\n"
            f"Expected: {expected_sha.upper()}\n"
            f"Actual:   {actual_sha}"
        )

def load_development_dataset(
    dataset_path: str = "dataset/Student_Depression_Dataset.csv",
    assignments_path: str = "ml_lab/splits/partition_assignments.csv",
    manifest_path: str = "ml_lab/splits/group_aware_partition_manifest.json"
) -> Tuple[pd.DataFrame, pd.Series, pd.Series, np.ndarray, Set[int]]:
    """
    Cryptographically verify inputs and load strictly the Development partition.
    Rejects and excludes any Test Vault records from memory.
    
    Returns:
        (X_dev, y_dev, groups_dev, dev_row_indices, test_vault_row_indices)
    """
    # 1. Cryptographic validation of all input assets
    verify_file_hash(dataset_path, EXPECTED_DATASET_SHA256)
    verify_file_hash(assignments_path, EXPECTED_ASSIGNMENTS_SHA256)
    verify_file_hash(manifest_path, EXPECTED_MANIFEST_SHA256)
    
    # 2. Read partition assignments
    assignments = pd.read_csv(assignments_path)
    if len(assignments) != EXPECTED_TOTAL_ROWS:
        raise SecurityIntegrityError(
            f"Partition assignments row count mismatch: got {len(assignments)}, expected {EXPECTED_TOTAL_ROWS}"
        )
    
    # Identify Development and Test Vault indices
    dev_mask = (assignments["partition"] == "development")
    test_mask = (assignments["partition"] == "test_vault")
    
    dev_rows = assignments[dev_mask]
    test_rows = assignments[test_mask]
    
    if len(dev_rows) != EXPECTED_DEV_ROWS:
        raise PartitionLeakageError(
            f"Development record count violation: got {len(dev_rows)}, expected {EXPECTED_DEV_ROWS}"
        )
    if len(test_rows) != EXPECTED_TEST_VAULT_ROWS:
        raise PartitionLeakageError(
            f"Test Vault record count violation: got {len(test_rows)}, expected {EXPECTED_TEST_VAULT_ROWS}"
        )
        
    dev_row_indices = dev_rows["row_index"].values
    test_vault_indices = set(test_rows["row_index"].values)
    
    # Verify no index overlap
    overlap = set(dev_row_indices) & test_vault_indices
    if overlap:
        raise PartitionLeakageError(f"Fatal partition collision: {len(overlap)} rows belong to both partitions!")
        
    # 3. Stream and extract strictly Development partition without materializing Test Vault rows
    from ml_lab.evaluation.development_only_loader import stream_development_records
    
    header, dev_records, _ = stream_development_records(
        dataset_path=dataset_path,
        dev_row_indices_set=set(dev_row_indices),
        expected_total_rows=EXPECTED_TOTAL_ROWS
    )
    
    dev_df = pd.DataFrame(dev_records, columns=header, index=dev_row_indices)
    
    # Verify feature contract
    missing_features = [col for col in FROZEN_ALL_FEATURES if col not in dev_df.columns]
    if missing_features:
        raise SecurityIntegrityError(f"Dataset missing required model features: {missing_features}")
    if FROZEN_TARGET not in dev_df.columns:
        raise SecurityIntegrityError(f"Dataset missing target variable '{FROZEN_TARGET}'")
        
    for col in FROZEN_NUMERICAL_FEATURES:
        dev_df[col] = pd.to_numeric(dev_df[col], errors="coerce")
    for col in FROZEN_CATEGORICAL_FEATURES:
        dev_df[col] = dev_df[col].replace("", np.nan)
        
    X_dev = dev_df[FROZEN_ALL_FEATURES].copy()
    y_dev = dev_df[FROZEN_TARGET].astype(int).copy()
    groups_dev = dev_rows["group_id"].values
    
    return X_dev, y_dev, pd.Series(groups_dev, index=dev_df.index), dev_row_indices, test_vault_indices

def validate_cv_folds(
    folds: List[Tuple[np.ndarray, np.ndarray]],
    dev_row_indices: np.ndarray,
    groups_dev: pd.Series,
    test_vault_indices: Set[int]
) -> None:
    """
    Enforce group-aware cross-validation integrity:
      1. Zero Test Vault indices anywhere in training or validation folds.
      2. Zero overlap between train and validation within each fold.
      3. Zero group overlap between train and validation within each fold.
      4. Complete and disjoint outer-fold validation coverage of the Development partition.
    """
    total_dev = len(dev_row_indices)
    seen_val_indices: Set[int] = set()
    
    for fold_idx, (train_idx, val_idx) in enumerate(folds):
        # Convert fold relative positions to actual row_indices
        train_rows = dev_row_indices[train_idx]
        val_rows = dev_row_indices[val_idx]
        
        # 1. Test Vault leakage check
        vault_in_train = set(train_rows) & test_vault_indices
        if vault_in_train:
            raise PartitionLeakageError(
                f"Fold {fold_idx}: CRITICAL LEAKAGE! {len(vault_in_train)} Test Vault rows found in training fold!"
            )
        vault_in_val = set(val_rows) & test_vault_indices
        if vault_in_val:
            raise PartitionLeakageError(
                f"Fold {fold_idx}: CRITICAL LEAKAGE! {len(vault_in_val)} Test Vault rows found in validation fold!"
            )
            
        # 2. Train/val index disjointness check
        row_overlap = set(train_rows) & set(val_rows)
        if row_overlap:
            raise PartitionLeakageError(
                f"Fold {fold_idx}: Row overlap between training and validation: {len(row_overlap)} rows!"
            )
            
        # 3. Group overlap check
        train_groups = set(groups_dev.iloc[train_idx])
        val_groups = set(groups_dev.iloc[val_idx])
        group_overlap = train_groups & val_groups
        if group_overlap:
            raise PartitionLeakageError(
                f"Fold {fold_idx}: Group leakage! {len(group_overlap)} groups exist in both train and val!"
            )
            
        # 4. Disjoint validation tracking
        for r in val_rows:
            if r in seen_val_indices:
                raise PartitionLeakageError(
                    f"Fold {fold_idx}: Duplicate validation assignment for row_index {r}!"
                )
            seen_val_indices.add(r)
            
    # Complete coverage check
    if len(seen_val_indices) != total_dev:
        missing = total_dev - len(seen_val_indices)
        raise PartitionLeakageError(
            f"Incomplete validation coverage: {missing} Development rows were never validated!"
        )
