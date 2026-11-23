"""
ml_lab/evaluation/__init__.py
Standardized, secure, reproducible evaluation package for Mindora Offline Intelligence Platform.
Enforces Development partition isolation, group-aware cross validation, and standardized metrics.
"""

from ml_lab.evaluation.partition_guard import (
    EXPECTED_DATASET_SHA256,
    EXPECTED_MANIFEST_SHA256,
    EXPECTED_ASSIGNMENTS_SHA256,
    FROZEN_NUMERICAL_FEATURES,
    FROZEN_CATEGORICAL_FEATURES,
    FROZEN_ALL_FEATURES,
    FROZEN_TARGET,
    EXPECTED_TOTAL_ROWS,
    EXPECTED_DEV_ROWS,
    EXPECTED_TEST_VAULT_ROWS,
    SecurityIntegrityError,
    PartitionLeakageError,
    verify_file_hash,
    load_development_dataset,
    validate_cv_folds
)
from ml_lab.evaluation.metrics import (
    compute_ece,
    compute_binary_metrics
)
from ml_lab.evaluation.pipeline import (
    build_dummy_baseline,
    build_logistic_regression_baseline,
    build_random_forest_pipeline,
    build_xgboost_pipeline
)
from ml_lab.evaluation.development_only_loader import (
    stream_development_records,
    read_partition_membership,
    load_development_only_dataset,
    load_development_dataframe_with_metadata,
    PreIngestionIsolationError
)

__all__ = [
    "EXPECTED_DATASET_SHA256",
    "EXPECTED_MANIFEST_SHA256",
    "EXPECTED_ASSIGNMENTS_SHA256",
    "FROZEN_NUMERICAL_FEATURES",
    "FROZEN_CATEGORICAL_FEATURES",
    "FROZEN_ALL_FEATURES",
    "FROZEN_TARGET",
    "EXPECTED_TOTAL_ROWS",
    "EXPECTED_DEV_ROWS",
    "EXPECTED_TEST_VAULT_ROWS",
    "SecurityIntegrityError",
    "PartitionLeakageError",
    "PreIngestionIsolationError",
    "verify_file_hash",
    "load_development_dataset",
    "load_development_only_dataset",
    "load_development_dataframe_with_metadata",
    "stream_development_records",
    "read_partition_membership",
    "validate_cv_folds",
    "compute_ece",
    "compute_binary_metrics",
    "build_dummy_baseline",
    "build_logistic_regression_baseline",
    "build_random_forest_pipeline",
    "build_xgboost_pipeline"
]
