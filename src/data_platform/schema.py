"""
src/data_platform/schema.py
Data structures and schema definitions for Mindora's local data ingestion and profiling platform.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Any, Optional

class ColumnType(str, Enum):
    NUMERICAL = "numerical"
    CATEGORICAL = "categorical"
    DATETIME = "datetime"
    IDENTIFIER = "identifier"
    CONSTANT = "constant"
    UNKNOWN = "unknown"

class TaskType(str, Enum):
    BINARY_CLASSIFICATION = "binary_classification"
    MULTICLASS_CLASSIFICATION = "multiclass_classification"
    REGRESSION = "regression"

@dataclass
class ColumnProfile:
    name: str
    inferred_type: ColumnType
    raw_dtype: str
    total_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    is_constant: bool = False
    is_potential_identifier: bool = False
    is_potential_leakage: bool = False
    leakage_reason: Optional[str] = None
    stats: Dict[str, Any] = field(default_factory=dict)
    sample_values: List[Any] = field(default_factory=list)

@dataclass
class DatasetProfile:
    name: str
    sha256_hash: str
    row_count: int
    column_count: int
    duplicate_row_count: int
    duplicate_percentage: float
    memory_usage_mb: float
    columns: Dict[str, ColumnProfile]
    potential_leakage_columns: List[str] = field(default_factory=list)
    constant_columns: List[str] = field(default_factory=list)
    identifier_columns: List[str] = field(default_factory=list)

@dataclass
class DatasetConfig:
    target_column: str
    task_type: TaskType
    numerical_features: List[str]
    categorical_features: List[str]
    excluded_columns: List[str]
    test_split_ratio: float = 0.15
    val_split_ratio: float = 0.15
    stratify: bool = True
    random_seed: int = 42

@dataclass
class ValidationIssue:
    severity: str # "ERROR" or "WARNING"
    field: str
    message: str

@dataclass
class DatasetValidationReport:
    is_valid: bool
    errors: List[ValidationIssue] = field(default_factory=list)
    warnings: List[ValidationIssue] = field(default_factory=list)
