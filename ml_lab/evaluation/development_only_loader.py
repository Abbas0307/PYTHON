"""
ml_lab/evaluation/development_only_loader.py
Hardened Pre-Ingestion Test Vault Isolation Loader for Mindora 2.0.

Ensures that Test Vault records are NEVER materialized into memory, parsed into
feature/target data structures, or included in any DataFrame.

Guarantees:
  1. Cryptographic validation of Dataset A, Partition Manifest, and Partition Assignments.
  2. RFC 4180 logical record-aware streaming that distinguishes logical records from physical file lines.
  3. Pre-ingestion boundary enforcement: Test Vault characters are traversed only to locate
     record boundaries; individual Test Vault features, IDs, and labels are NEVER parsed
     by the CSV field parser, never converted to objects, and never added to memory structures.
  4. Preserves exact original row ordering and feature-to-label alignment.
  5. Enforces the frozen 10-feature schema and fail-closed security gates.
"""

import os
import csv
import hashlib
from typing import Tuple, List, Set, Dict, Any, Optional
import numpy as np
import pandas as pd

EXPECTED_DATASET_SHA256 = "A3E159E246789BE5A61DCC7B4290FBC238F0140F3D95727585AF50A61FD35404"
EXPECTED_MANIFEST_SHA256 = "A9D657522F53083CABD2EAF145D1FB8CF747D712362D4CD69EAFE88F40311070"
EXPECTED_ASSIGNMENTS_SHA256 = "91A63F906155F84646B296007D0934958FF0DAAE419461B9E8D6E3B0394802B1"

EXPECTED_TOTAL_ROWS = 27901
EXPECTED_DEV_ROWS = 23716
EXPECTED_TEST_VAULT_ROWS = 4185

FROZEN_NUMERICAL_FEATURES = [
    "Age", "Academic Pressure", "CGPA", "Study Satisfaction", "Work/Study Hours", "Financial Stress"
]
FROZEN_CATEGORICAL_FEATURES = [
    "Gender", "Sleep Duration", "Dietary Habits", "Degree"
]
FROZEN_ALL_FEATURES = FROZEN_NUMERICAL_FEATURES + FROZEN_CATEGORICAL_FEATURES
FROZEN_TARGET = "Depression"


class SecurityIntegrityError(Exception):
    """Raised when cryptographic digests, file row counts, or schema validation fail."""
    pass


class PartitionLeakageError(Exception):
    """Raised when partition boundaries, row assignments, or group structures are violated."""
    pass


class PreIngestionIsolationError(PartitionLeakageError):
    """Raised when Test Vault records are detected entering the field parser or memory buffer."""
    pass


def verify_file_hash(path: str, expected_sha: str) -> None:
    """Verify that a file exists and matches its expected SHA-256 digest."""
    if not os.path.exists(path):
        raise SecurityIntegrityError(f"Required file does not exist: {path}")
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    actual_sha = hasher.hexdigest().upper()
    if actual_sha != expected_sha.upper():
        raise SecurityIntegrityError(
            f"Cryptographic hash mismatch for {path}!\n"
            f"Expected: {expected_sha.upper()}\n"
            f"Actual:   {actual_sha}"
        )


def read_partition_membership(
    assignments_path: str,
    manifest_path: Optional[str] = None,
    expected_assignments_sha: Optional[str] = EXPECTED_ASSIGNMENTS_SHA256,
    expected_manifest_sha: Optional[str] = EXPECTED_MANIFEST_SHA256,
    expected_total_rows: int = EXPECTED_TOTAL_ROWS,
    expected_dev_rows: int = EXPECTED_DEV_ROWS,
    expected_test_vault_rows: int = EXPECTED_TEST_VAULT_ROWS
) -> Dict[str, Any]:
    """
    Read partition assignments and validate split membership metadata without accessing dataset rows.
    Fails closed if hashes, counts, or partition boundaries do not match expectations.
    """
    if expected_assignments_sha is not None:
        verify_file_hash(assignments_path, expected_assignments_sha)
    if manifest_path is not None and expected_manifest_sha is not None:
        verify_file_hash(manifest_path, expected_manifest_sha)

    assignments = pd.read_csv(assignments_path)
    if len(assignments) != expected_total_rows:
        raise SecurityIntegrityError(
            f"Partition assignments row count mismatch: got {len(assignments)}, expected {expected_total_rows}"
        )

    required_cols = {"row_index", "partition", "group_id"}
    missing_cols = required_cols - set(assignments.columns)
    if missing_cols:
        raise SecurityIntegrityError(f"Partition assignments missing required columns: {missing_cols}")

    # Check for missing or duplicate row_index positions
    row_indices = assignments["row_index"].values
    if len(np.unique(row_indices)) != expected_total_rows:
        raise SecurityIntegrityError(
            f"Partition assignments contain duplicate row indices: {len(assignments)} vs {len(np.unique(row_indices))} unique"
        )
    if np.min(row_indices) != 0 or np.max(row_indices) != (expected_total_rows - 1):
        raise SecurityIntegrityError(
            f"Partition row indices are non-contiguous or out of range: min={np.min(row_indices)}, max={np.max(row_indices)}"
        )

    dev_mask = assignments["partition"] == "development"
    test_mask = assignments["partition"] == "test_vault"

    dev_rows = assignments[dev_mask]
    test_rows = assignments[test_mask]

    if len(dev_rows) != expected_dev_rows:
        raise PartitionLeakageError(
            f"Development record count violation: got {len(dev_rows)}, expected {expected_dev_rows}"
        )
    if len(test_rows) != expected_test_vault_rows:
        raise PartitionLeakageError(
            f"Test Vault record count violation: got {len(test_rows)}, expected {expected_test_vault_rows}"
        )

    dev_row_indices = dev_rows["row_index"].values
    test_vault_indices = set(test_rows["row_index"].values)

    overlap = set(dev_row_indices) & test_vault_indices
    if overlap:
        raise PartitionLeakageError(f"Fatal partition collision: {len(overlap)} rows belong to both partitions!")

    return {
        "dev_row_indices": dev_row_indices,
        "dev_row_indices_set": set(dev_row_indices),
        "test_vault_indices": test_vault_indices,
        "dev_group_ids": dev_rows["group_id"].values,
        "dev_ids": dev_rows["id"].values if "id" in dev_rows.columns else None
    }


def stream_development_records(
    dataset_path: str,
    dev_row_indices_set: Set[int],
    expected_total_rows: int = EXPECTED_TOTAL_ROWS,
    chunk_size: int = 65536
) -> Tuple[List[str], List[List[str]], Dict[str, Any]]:
    """
    RFC 4180 record-aware streaming reader.
    
    Distinguishes logical CSV records from physical file lines by maintaining
    an exact quote-state tracker across chunk boundaries.
    
    Hardened Boundary Isolation:
      - If logical record index is in `dev_row_indices_set`:
          Record characters are accumulated and submitted to `csv.reader` (the field parser).
      - If logical record index is NOT in `dev_row_indices_set` (Test Vault record):
          Record characters are traversed ONLY to identify logical record boundary.
          Characters are NEVER concatenated into a row string.
          Record is NEVER submitted to the CSV field parser.
          Field parser calls are strictly bypassed.
          Test Vault contents are NEVER materialized into memory.
          
    Returns:
      (header, dev_records, instrumentation_metrics)
    """
    dev_records: List[List[str]] = []
    field_parser_calls = 0
    skipped_parser_bypasses = 0
    total_records_seen = 0

    with open(dataset_path, "r", encoding="utf-8") as f:
        # 1. Read header line
        header_line = f.readline().rstrip("\r\n")
        header = next(csv.reader([header_line]))
        field_parser_calls += 1

        cur_chars: List[str] = []
        in_quote = False
        record_idx = 0

        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                # End of file reached
                if in_quote:
                    raise SecurityIntegrityError(
                        "Malformed CSV: Unclosed quotation mark at end of file."
                    )
                if record_idx in dev_row_indices_set and cur_chars:
                    rec_str = "".join(cur_chars).rstrip("\r\n")
                    if rec_str:
                        field_parser_calls += 1
                        row = next(csv.reader([rec_str]))
                        dev_records.append(row)
                        record_idx += 1
                elif cur_chars:
                    skipped_parser_bypasses += 1
                    record_idx += 1
                break

            for ch in chunk:
                if ch == '"':
                    in_quote = not in_quote
                    if record_idx in dev_row_indices_set:
                        cur_chars.append(ch)
                elif ch == '\n' and not in_quote:
                    # Logical record boundary reached
                    if record_idx in dev_row_indices_set:
                        rec_str = "".join(cur_chars).rstrip("\r\n")
                        field_parser_calls += 1
                        row = next(csv.reader([rec_str]))
                        dev_records.append(row)
                        cur_chars = []
                    else:
                        # Test Vault record: bypass field parser entirely
                        skipped_parser_bypasses += 1
                        # Do not keep any characters in memory
                    record_idx += 1
                else:
                    if record_idx in dev_row_indices_set:
                        cur_chars.append(ch)

        total_records_seen = record_idx

    expected_dev_count = len(dev_row_indices_set)
    expected_skipped_count = expected_total_rows - expected_dev_count

    if total_records_seen != expected_total_rows:
        raise SecurityIntegrityError(
            f"Dataset record count mismatch: read {total_records_seen} logical records, expected {expected_total_rows}"
        )
    if len(dev_records) != expected_dev_count:
        raise PartitionLeakageError(
            f"Development record extraction mismatch: extracted {len(dev_records)}, expected {expected_dev_count}"
        )
    if skipped_parser_bypasses != expected_skipped_count:
        raise PartitionLeakageError(
            f"Test Vault bypass count mismatch: bypassed {skipped_parser_bypasses}, expected {expected_skipped_count}"
        )
    if field_parser_calls != expected_dev_count + 1:
        raise PreIngestionIsolationError(
            f"Field parser call count violation: {field_parser_calls} calls, expected {expected_dev_count + 1} "
            f"(1 header + {expected_dev_count} dev rows). Possible leakage of Test Vault into field parser!"
        )

    instrumentation = {
        "total_records_seen": total_records_seen,
        "dev_records_parsed": len(dev_records),
        "test_vault_records_skipped": skipped_parser_bypasses,
        "field_parser_calls": field_parser_calls,
        "skipped_parser_bypasses": skipped_parser_bypasses,
        "header_columns_count": len(header)
    }

    return header, dev_records, instrumentation


def load_development_dataset(
    dataset_path: str = "dataset/Student_Depression_Dataset.csv",
    assignments_path: str = "ml_lab/splits/partition_assignments.csv",
    manifest_path: str = "ml_lab/splits/group_aware_partition_manifest.json",
    verify_hashes: bool = True,
    expected_total_rows: int = EXPECTED_TOTAL_ROWS,
    expected_dev_rows: int = EXPECTED_DEV_ROWS,
    expected_test_vault_rows: int = EXPECTED_TEST_VAULT_ROWS
) -> Tuple[pd.DataFrame, pd.Series, pd.Series, np.ndarray, Set[int]]:
    """
    Cryptographically verify inputs and load strictly the Development partition
    using pre-ingestion record-aware streaming.
    
    Guarantees:
      - Test Vault records are NEVER materialized in DataFrame or parsed into fields.
      - Zero Test Vault leakage.
      - Bit-exact feature and target alignment.
      
    Returns:
        (X_dev, y_dev, groups_dev, dev_row_indices, test_vault_row_indices)
    """
    if verify_hashes:
        verify_file_hash(dataset_path, EXPECTED_DATASET_SHA256)
        verify_file_hash(assignments_path, EXPECTED_ASSIGNMENTS_SHA256)
        verify_file_hash(manifest_path, EXPECTED_MANIFEST_SHA256)

    # 1. Read partition metadata only
    membership = read_partition_membership(
        assignments_path=assignments_path,
        manifest_path=manifest_path,
        expected_assignments_sha=EXPECTED_ASSIGNMENTS_SHA256 if verify_hashes else None,
        expected_manifest_sha=EXPECTED_MANIFEST_SHA256 if verify_hashes else None,
        expected_total_rows=expected_total_rows,
        expected_dev_rows=expected_dev_rows,
        expected_test_vault_rows=expected_test_vault_rows
    )

    dev_row_indices = membership["dev_row_indices"]
    dev_row_indices_set = membership["dev_row_indices_set"]
    test_vault_indices = membership["test_vault_indices"]
    dev_group_ids = membership["dev_group_ids"]

    # 2. Stream Development records strictly
    header, dev_records, _ = stream_development_records(
        dataset_path=dataset_path,
        dev_row_indices_set=dev_row_indices_set,
        expected_total_rows=expected_total_rows
    )

    # 3. Build Development-only DataFrame
    dev_df = pd.DataFrame(dev_records, columns=header, index=dev_row_indices)

    # 4. Verify feature and target schema contract
    missing_features = [col for col in FROZEN_ALL_FEATURES if col not in dev_df.columns]
    if missing_features:
        raise SecurityIntegrityError(f"Dataset missing required model features: {missing_features}")
    if FROZEN_TARGET not in dev_df.columns:
        raise SecurityIntegrityError(f"Dataset missing target variable '{FROZEN_TARGET}'")

    # 5. Type coercion for features and target
    for col in FROZEN_NUMERICAL_FEATURES:
        dev_df[col] = pd.to_numeric(dev_df[col], errors="coerce")
    for col in FROZEN_CATEGORICAL_FEATURES:
        dev_df[col] = dev_df[col].replace("", np.nan)

    X_dev = dev_df[FROZEN_ALL_FEATURES].copy()
    y_dev = dev_df[FROZEN_TARGET].astype(int).copy()
    groups_dev = pd.Series(dev_group_ids, index=dev_df.index)

    return X_dev, y_dev, groups_dev, dev_row_indices, test_vault_indices


# Alias for explicit naming
load_development_only_dataset = load_development_dataset


def load_development_dataframe_with_metadata(
    dataset_path: str = "dataset/Student_Depression_Dataset.csv",
    assignments_path: str = "ml_lab/splits/partition_assignments.csv",
    manifest_path: str = "ml_lab/splits/group_aware_partition_manifest.json",
    verify_hashes: bool = True
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Load Development-only full DataFrame (including all survey columns) along with
    streaming instrumentation audit metrics.
    """
    if verify_hashes:
        verify_file_hash(dataset_path, EXPECTED_DATASET_SHA256)
        verify_file_hash(assignments_path, EXPECTED_ASSIGNMENTS_SHA256)
        verify_file_hash(manifest_path, EXPECTED_MANIFEST_SHA256)

    membership = read_partition_membership(
        assignments_path=assignments_path,
        manifest_path=manifest_path,
        expected_assignments_sha=EXPECTED_ASSIGNMENTS_SHA256 if verify_hashes else None,
        expected_manifest_sha=EXPECTED_MANIFEST_SHA256 if verify_hashes else None
    )

    header, dev_records, instrumentation = stream_development_records(
        dataset_path=dataset_path,
        dev_row_indices_set=membership["dev_row_indices_set"],
        expected_total_rows=EXPECTED_TOTAL_ROWS
    )

    dev_df = pd.DataFrame(dev_records, columns=header, index=membership["dev_row_indices"])
    dev_df["group_id"] = membership["dev_group_ids"]

    for col in FROZEN_NUMERICAL_FEATURES:
        if col in dev_df.columns:
            dev_df[col] = pd.to_numeric(dev_df[col], errors="coerce")
    for col in FROZEN_CATEGORICAL_FEATURES:
        if col in dev_df.columns:
            dev_df[col] = dev_df[col].replace("", np.nan)
    if FROZEN_TARGET in dev_df.columns:
        dev_df[FROZEN_TARGET] = dev_df[FROZEN_TARGET].astype(int)

    return dev_df, instrumentation
