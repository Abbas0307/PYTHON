"""
src/data_platform/dataset_loader.py
Safe local dataset ingestion with SHA-256 fingerprinting, encoding fallbacks,
file size limits, and robust error handling. Zero external network calls.
"""

import os
import hashlib
import io
import pandas as pd
from typing import Tuple, Union, BinaryIO

MAX_DATASET_SIZE_BYTES = 100 * 1024 * 1024 # 100 MB default safeguard
MAX_PERMITTED_COLUMNS = 500
MAX_PERMITTED_ROWS = 1_000_000

class DatasetIngestionError(Exception):
    """Raised when dataset ingestion fails due to format, encoding, or size issues."""
    pass

def compute_sha256(content: bytes) -> str:
    """Compute SHA-256 cryptographic hash of byte content for dataset provenance."""
    sha = hashlib.sha256()
    sha.update(content)
    return sha.hexdigest()

def load_local_csv(
    source: Union[str, BinaryIO, bytes],
    filename: str = "dataset.csv",
    max_size_bytes: int = MAX_DATASET_SIZE_BYTES
) -> Tuple[pd.DataFrame, str]:
    """
    Safely load a local CSV file into a pandas DataFrame.
    
    Parameters:
        source: File path (str), file-like buffer (BinaryIO), or raw bytes.
        filename: Optional name for reference in errors.
        max_size_bytes: Maximum allowed byte size.
        
    Returns:
        Tuple of (pd.DataFrame, sha256_hash_string)
    """
    # Sanitize filename to prevent path traversal in error messages or reports
    safe_filename = os.path.basename(str(filename or "dataset.csv"))
    if not safe_filename.lower().endswith(".csv"):
        raise DatasetIngestionError("Invalid file format: Only comma-separated values (.csv) files are permitted.")

    raw_bytes = None
    
    if isinstance(source, str):
        if not source.lower().endswith(".csv"):
            raise DatasetIngestionError("Invalid file extension: Only comma-separated values (.csv) files are permitted.")
        if not os.path.exists(source):
            raise DatasetIngestionError(f"Dataset file not found at path: {source}")
        file_size = os.path.getsize(source)
        if file_size > max_size_bytes:
            raise DatasetIngestionError(
                f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed limit "
                f"({max_size_bytes / (1024*1024):.1f} MB)."
            )
        if file_size == 0:
            raise DatasetIngestionError(f"Dataset file '{safe_filename}' is empty (0 bytes).")
            
        with open(source, "rb") as f:
            raw_bytes = f.read()
    elif isinstance(source, bytes):
        raw_bytes = source
        if len(raw_bytes) > max_size_bytes:
            raise DatasetIngestionError("In-memory dataset exceeds maximum allowed size.")
        if len(raw_bytes) == 0:
            raise DatasetIngestionError(f"Provided dataset buffer '{safe_filename}' is empty.")
    elif hasattr(source, "read"):
        raw_bytes = source.read()
        if len(raw_bytes) > max_size_bytes:
            raise DatasetIngestionError("Streamed dataset exceeds maximum allowed size.")
        if len(raw_bytes) == 0:
            raise DatasetIngestionError(f"Streamed dataset '{safe_filename}' is empty.")
    else:
        raise DatasetIngestionError(f"Unsupported dataset source type: {type(source)}")
        
    sha256_hash = compute_sha256(raw_bytes)
    
    # Attempt encodings in sequence: utf-8, utf-8-sig, latin1
    encodings_to_try = ["utf-8", "utf-8-sig", "latin1"]
    df = None
    last_error = None
    
    for enc in encodings_to_try:
        try:
            buffer = io.BytesIO(raw_bytes)
            df = pd.read_csv(buffer, encoding=enc)
            break
        except (UnicodeDecodeError, pd.errors.ParserError, pd.errors.EmptyDataError) as e:
            last_error = e
            continue
            
    if df is None:
        raise DatasetIngestionError(
            f"Failed to parse CSV '{filename}'. Ensure it is a valid delimiter-separated text file. "
            f"Last parser error: {str(last_error)}"
        )
        
    if df.empty:
        raise DatasetIngestionError(f"CSV file '{safe_filename}' contains no tabular records or rows.")
        
    if len(df.columns) > MAX_PERMITTED_COLUMNS:
        raise DatasetIngestionError(
            f"Dataset '{safe_filename}' exceeds maximum allowed column count ({len(df.columns)} > {MAX_PERMITTED_COLUMNS})."
        )
    if len(df) > MAX_PERMITTED_ROWS:
        raise DatasetIngestionError(
            f"Dataset '{safe_filename}' exceeds maximum allowed row count ({len(df):,} > {MAX_PERMITTED_ROWS:,})."
        )
        
    # Strip whitespace from column names to prevent subtle indexing bugs
    df.columns = [str(col).strip() for col in df.columns]
    
    return df, sha256_hash
