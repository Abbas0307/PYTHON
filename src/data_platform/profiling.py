"""
src/data_platform/profiling.py
Comprehensive local dataset profiling, type inference, leakage inspection,
and statistical summary generation.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from src.data_platform.schema import ColumnProfile, DatasetProfile, ColumnType

# Keywords commonly indicative of target leakage or sensitive clinical tokens
LEAKAGE_KEYWORDS = [
    "suicid", "depress", "diagno", "phq", "target", "label",
    "outcome", "clinical", "treatment", "disorder", "patient", "therapy"
]

IDENTIFIER_KEYWORDS = ["id", "uuid", "guid", "index", "roll", "registration", "student_id"]

def infer_column_type(series: pd.Series, col_name: str, total_rows: int) -> ColumnType:
    """Infer semantic column type based on pandas dtype, cardinality, and naming."""
    col_lower = col_name.lower().strip()
    non_null_count = series.count()
    unique_count = series.nunique(dropna=True)
    
    if unique_count <= 1 and non_null_count > 0:
        return ColumnType.CONSTANT
        
    # Check for identifiers (high cardinality unique tokens or identifier names)
    if any(k == col_lower or col_lower.endswith(f"_{k}") or col_lower.startswith(f"{k}_") for k in IDENTIFIER_KEYWORDS):
        if unique_count > 0.8 * total_rows:
            return ColumnType.IDENTIFIER
            
    if pd.api.types.is_numeric_dtype(series):
        # Numerical vs low-cardinality categorical
        if unique_count <= 5 and not pd.api.types.is_float_dtype(series):
            return ColumnType.CATEGORICAL
        return ColumnType.NUMERICAL
        
    if pd.api.types.is_datetime64_any_dtype(series):
        return ColumnType.DATETIME
        
    # Attempt datetime conversion sample check
    if series.dtype == object and unique_count > 10:
        sample = series.dropna().head(10)
        try:
            pd.to_datetime(sample, errors="raise")
            return ColumnType.DATETIME
        except Exception:
            pass
            
    return ColumnType.CATEGORICAL

def check_leakage_suspicions(col_name: str) -> Tuple[bool, Optional[str]]:
    """Detect whether a column name indicates direct diagnostic target leakage."""
    col_lower = col_name.lower().strip()
    for kw in LEAKAGE_KEYWORDS:
        if kw in col_lower:
            return True, f"Column name contains '{kw}' which may represent target leakage or post-outcome symptoms."
    return False, None


def profile_dataset(
    df: pd.DataFrame, 
    dataset_name: str = "dataset", 
    sha256_hash: str = ""
) -> DatasetProfile:
    """
    Generate an exhaustive profile of the tabular dataset.
    """
    total_rows = len(df)
    total_cols = len(df.columns)
    dup_rows = int(df.duplicated().sum())
    dup_pct = round((dup_rows / total_rows * 100), 2) if total_rows > 0 else 0.0
    mem_mb = round(float(df.memory_usage(deep=True).sum() / (1024 * 1024)), 2)
    
    column_profiles: Dict[str, ColumnProfile] = {}
    leakage_cols: List[str] = []
    constant_cols: List[str] = []
    identifier_cols: List[str] = []
    
    for col in df.columns:
        s = df[col]
        raw_dtype = str(s.dtype)
        null_count = int(s.isnull().sum())
        null_pct = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_cnt = int(s.nunique(dropna=True))
        
        c_type = infer_column_type(s, col, total_rows)
        is_const = (c_type == ColumnType.CONSTANT)
        is_ident = (c_type == ColumnType.IDENTIFIER)
        
        is_leak, leak_reason = check_leakage_suspicions(col)
        
        if is_leak:
            leakage_cols.append(col)
        if is_const:
            constant_cols.append(col)
        if is_ident:
            identifier_cols.append(col)
            
        stats: Dict[str, Any] = {}
        if c_type == ColumnType.NUMERICAL:
            clean_s = s.dropna()
            if not clean_s.empty:
                stats = {
                    "min": round(float(clean_s.min()), 4),
                    "max": round(float(clean_s.max()), 4),
                    "mean": round(float(clean_s.mean()), 4),
                    "median": round(float(clean_s.median()), 4),
                    "std": round(float(clean_s.std()), 4) if len(clean_s) > 1 else 0.0
                }
        elif c_type == ColumnType.CATEGORICAL:
            vc = s.value_counts(dropna=False).head(5).to_dict()
            # Convert non-string keys to strings for serializability
            stats = {
                "top_categories": {str(k): int(v) for k, v in vc.items()}
            }
            
        # Extract up to 5 non-null sample values safely
        sample_vals = [x if pd.notnull(x) else None for x in s.dropna().head(5).tolist()]
        
        column_profiles[col] = ColumnProfile(
            name=col,
            inferred_type=c_type,
            raw_dtype=raw_dtype,
            total_count=total_rows,
            null_count=null_count,
            null_percentage=null_pct,
            unique_count=unique_cnt,
            is_constant=is_const,
            is_potential_identifier=is_ident,
            is_potential_leakage=is_leak,
            leakage_reason=leak_reason,
            stats=stats,
            sample_values=sample_vals
        )
        
    return DatasetProfile(
        name=dataset_name,
        sha256_hash=sha256_hash,
        row_count=total_rows,
        column_count=total_cols,
        duplicate_row_count=dup_rows,
        duplicate_percentage=dup_pct,
        memory_usage_mb=mem_mb,
        columns=column_profiles,
        potential_leakage_columns=leakage_cols,
        constant_columns=constant_cols,
        identifier_columns=identifier_cols
    )
