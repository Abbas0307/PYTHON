"""
src/data_platform/validator.py
Strict dataset validation, task-compatibility verification, leakage detection,
and configuration consistency enforcement.
"""

import pandas as pd
import numpy as np
from typing import Optional, List
from src.data_platform.schema import DatasetConfig, DatasetValidationReport, ValidationIssue, TaskType

def validate_dataset_structure(df: pd.DataFrame) -> DatasetValidationReport:
    """
    Perform structural validation on an imported tabular dataset.
    """
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []
    
    if df.empty:
        errors.append(ValidationIssue("ERROR", "dataset", "Dataset contains 0 rows."))
        return DatasetValidationReport(is_valid=False, errors=errors, warnings=warnings)
        
    if len(df.columns) < 2:
        errors.append(ValidationIssue("ERROR", "columns", f"Dataset contains only {len(df.columns)} column. Tabular ML requires at least 2 columns."))
        
    # Check for columns with 100% missing values
    for col in df.columns:
        if df[col].isnull().all():
            errors.append(ValidationIssue("ERROR", col, f"Column '{col}' has 100% missing values."))
            
    # Check for duplicate rows
    dup_count = df.duplicated().sum()
    if dup_count > 0:
        warnings.append(ValidationIssue(
            "WARNING", "duplicates", 
            f"Dataset contains {dup_count:,} duplicate rows ({dup_count/len(df)*100:.2f}%). "
            f"Duplicates can cause data leakage across train/test splits if unhandled."
        ))
        
    # Check for constant columns
    for col in df.columns:
        if df[col].nunique(dropna=True) <= 1:
            warnings.append(ValidationIssue(
                "WARNING", col, 
                f"Column '{col}' is constant (has <= 1 unique value) and carries zero predictive variance."
            ))
            
    is_valid = len(errors) == 0
    return DatasetValidationReport(is_valid=is_valid, errors=errors, warnings=warnings)

def validate_training_configuration(df: pd.DataFrame, config: DatasetConfig) -> DatasetValidationReport:
    """
    Validate user training configuration prior to starting model training.
    """
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []
    
    # 1. Target column existence
    if not config.target_column:
        errors.append(ValidationIssue("ERROR", "target_column", "Target column must be explicitly specified."))
    elif config.target_column not in df.columns:
        errors.append(ValidationIssue("ERROR", "target_column", f"Target column '{config.target_column}' does not exist in dataset."))
    else:
        target_s = df[config.target_column].dropna()
        if target_s.empty:
            errors.append(ValidationIssue("ERROR", config.target_column, "Target column contains only null values."))
            
        unique_targets = target_s.nunique()
        
        # 2. Task-target compatibility
        if config.task_type == TaskType.BINARY_CLASSIFICATION:
            if unique_targets != 2:
                errors.append(ValidationIssue(
                    "ERROR", "task_type", 
                    f"Binary classification selected, but target '{config.target_column}' has {unique_targets} unique classes (expected exactly 2)."
                ))
            else:
                vc = target_s.value_counts()
                min_class_count = vc.min()
                if min_class_count < 10:
                    errors.append(ValidationIssue(
                        "ERROR", "class_imbalance", 
                        f"Minority class in target has only {min_class_count} samples. Minimum 10 samples required for reliable cross-validation."
                    ))
                elif min_class_count < 30:
                    warnings.append(ValidationIssue(
                        "WARNING", "class_imbalance", 
                        f"Minority class has only {min_class_count} samples. Severe class imbalance may distort precision/recall."
                    ))
        elif config.task_type == TaskType.MULTICLASS_CLASSIFICATION:
            if unique_targets < 3:
                errors.append(ValidationIssue(
                    "ERROR", "task_type", 
                    f"Multiclass classification selected, but target '{config.target_column}' has {unique_targets} unique classes (expected >= 3)."
                ))
        elif config.task_type == TaskType.REGRESSION:
            if not pd.api.types.is_numeric_dtype(target_s):
                errors.append(ValidationIssue(
                    "ERROR", "task_type", 
                    f"Regression task requires numeric target, but target '{config.target_column}' has dtype '{target_s.dtype}'."
                ))
                
    # 3. Feature validation
    all_features = config.numerical_features + config.categorical_features
    if len(all_features) == 0:
        errors.append(ValidationIssue("ERROR", "features", "At least one input feature must be configured for training."))
        
    if config.target_column in all_features:
        errors.append(ValidationIssue(
            "ERROR", "target_leakage", 
            f"Severe Error: Target column '{config.target_column}' is included in the feature list! This represents direct target leakage."
        ))
        
    for feat in all_features:
        if feat not in df.columns:
            errors.append(ValidationIssue("ERROR", feat, f"Configured feature '{feat}' is not present in dataset columns."))
            
    # Check overlap between features and excluded columns
    overlap = set(all_features).intersection(set(config.excluded_columns))
    if overlap:
        errors.append(ValidationIssue(
            "ERROR", "feature_overlap", 
            f"Columns configured as both features and excluded: {list(overlap)}"
        ))
        
    # Check split ratios
    total_split = config.test_split_ratio + config.val_split_ratio
    if total_split >= 0.70:
        errors.append(ValidationIssue(
            "ERROR", "split_ratio", 
            f"Combined test ({config.test_split_ratio:.2f}) and val ({config.val_split_ratio:.2f}) split ratio ({total_split:.2f}) exceeds 0.70. Training partition must be at least 30%."
        ))
    if config.test_split_ratio <= 0.05:
        warnings.append(ValidationIssue("WARNING", "test_split", "Test split ratio is <= 5%, which may result in an unreliably small test sample."))
        
    # 4. Correlation / direct leakage check
    if config.target_column in df.columns and pd.api.types.is_numeric_dtype(df[config.target_column]):
        for num_f in config.numerical_features:
            if num_f in df.columns and pd.api.types.is_numeric_dtype(df[num_f]):
                corr = df[num_f].corr(df[config.target_column])
                if pd.notnull(corr) and abs(corr) > 0.95:
                    warnings.append(ValidationIssue(
                        "WARNING", num_f, 
                        f"Feature '{num_f}' has an extreme correlation ({corr:.4f}) with the target. Verify whether this represents clinical or data leakage."
                    ))

    is_valid = len(errors) == 0
    return DatasetValidationReport(is_valid=is_valid, errors=errors, warnings=warnings)
