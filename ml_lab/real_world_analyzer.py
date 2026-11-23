"""
ml_lab/real_world_analyzer.py
MINDORA 2.0 — PHASE 8.5: REAL-WORLD DEPRESSION DATA ANALYZER SERVICE
Research module providing authoritative data loading, bivariate association statistics,
isolated ML model benchmarks, and interactive student profile comparisons
against the 163-record student research survey dataset.

MANDATORY GOVERNANCE NOTICE:
"163-RECORD MANUALLY COLLECTED STUDENT DATASET — PROVENANCE AND CONSENT UNVERIFIED. RESEARCH USE ONLY."
"""

import sys
import os

# Ensure project root is available in path
_project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from src.data_platform.real_world_analyzer import (
    RealWorldDepressionAnalyzer,
    get_real_world_analyzer,
    MANDATORY_GOVERNANCE_NOTICE,
    DATASET_CANDIDATE_PATHS
)

__all__ = [
    "RealWorldDepressionAnalyzer",
    "get_real_world_analyzer",
    "MANDATORY_GOVERNANCE_NOTICE",
    "DATASET_CANDIDATE_PATHS"
]
