"""
src/data_platform/__init__.py
Mindora Local Data Platform package.
"""

from src.data_platform.schema import (
    ColumnType,
    TaskType,
    ColumnProfile,
    DatasetProfile,
    DatasetConfig,
    ValidationIssue,
    DatasetValidationReport
)
from src.data_platform.dataset_loader import load_local_csv, DatasetIngestionError
from src.data_platform.profiling import profile_dataset
from src.data_platform.validator import validate_dataset_structure, validate_training_configuration

__all__ = [
    "ColumnType",
    "TaskType",
    "ColumnProfile",
    "DatasetProfile",
    "DatasetConfig",
    "ValidationIssue",
    "DatasetValidationReport",
    "load_local_csv",
    "DatasetIngestionError",
    "profile_dataset",
    "validate_dataset_structure",
    "validate_training_configuration"
]
