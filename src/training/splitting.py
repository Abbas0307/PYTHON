"""
src/training/splitting.py
Reproducible train/validation/test dataset splitting with stratification support
and zero cross-partition leakage.
"""

import pandas as pd
import numpy as np
from typing import Tuple
from sklearn.model_selection import train_test_split
from src.data_platform.schema import DatasetConfig, TaskType

def split_dataset(
    df: pd.DataFrame, 
    config: DatasetConfig
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
    """
    Split a DataFrame into reproducible Train (1 - test_ratio - val_ratio),
    Validation (val_ratio), and Held-Out Test (test_ratio) partitions.
    
    Returns:
        (X_train, X_val, X_test, y_train, y_val, y_test)
    """
    feature_cols = config.numerical_features + config.categorical_features
    target_col = config.target_column
    
    # Drop rows where target is NaN
    clean_df = df.dropna(subset=[target_col]).copy()
    
    X = clean_df[feature_cols].copy()
    y = clean_df[target_col].copy()
    
    test_size = config.test_split_ratio
    val_size = config.val_split_ratio
    seed = config.random_seed
    
    # Check if stratification is appropriate
    stratify_y = None
    if config.stratify and config.task_type in [TaskType.BINARY_CLASSIFICATION, TaskType.MULTICLASS_CLASSIFICATION]:
        stratify_y = y
        
    # First split: Hold out the Test partition
    try:
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=seed,
            stratify=stratify_y
        )
    except ValueError:
        # Fallback without stratification if a rare class has too few instances
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y,
            test_size=test_size,
            random_state=seed,
            stratify=None
        )
        
    # Second split: Separate Train and Validation partitions
    val_relative_size = val_size / (1.0 - test_size)
    stratify_val_y = None
    if config.stratify and config.task_type in [TaskType.BINARY_CLASSIFICATION, TaskType.MULTICLASS_CLASSIFICATION]:
        stratify_val_y = y_train_val
        
    try:
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val,
            test_size=val_relative_size,
            random_state=seed,
            stratify=stratify_val_y
        )
    except ValueError:
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val,
            test_size=val_relative_size,
            random_state=seed,
            stratify=None
        )
        
    # Verify zero index overlap across partitions
    train_idx = set(X_train.index)
    val_idx = set(X_val.index)
    test_idx = set(X_test.index)
    
    assert len(train_idx.intersection(val_idx)) == 0, "Train and Validation partitions overlap!"
    assert len(train_idx.intersection(test_idx)) == 0, "Train and Test partitions overlap!"
    assert len(val_idx.intersection(test_idx)) == 0, "Validation and Test partitions overlap!"
    
    return X_train, X_val, X_test, y_train, y_val, y_test
