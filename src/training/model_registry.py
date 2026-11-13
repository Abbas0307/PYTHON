"""
src/training/model_registry.py
Model registry and strict MLOps governance rules for Mindora.

Model Lifecycle States:
  1. EXPERIMENTAL_MODEL: Initial training run logged in the registry.
  2. VALIDATION_SELECTED_CANDIDATE: Selected based strictly on validation partition metrics and schema compatibility.
  3. TEST_EVALUATED_CANDIDATE: Evaluated on an isolated out-of-sample held-out test partition (seed 42, N=4,186).
     Note: This constitutes internal holdout evaluation, NOT independent external validation.
  4. APPROVED_TECHNICAL_ARTIFACT: Formally signed off by human operator with provenance metadata.
  5. PRODUCTION_DEPLOYMENT: Currently serving production model (models/best_model.pkl).

Governance Notes:
  - Technical candidate criteria are engineering verification benchmarks, NOT clinical diagnostic certifications.
  - Mindora models are experimental tabular classifiers predicting a self-reported survey label, not clinical diagnostic instruments.
  - True independent external validation requires data from an external student cohort, which remains unavailable.
"""

import os
import json
from enum import Enum
from typing import Dict, Any, Tuple, Optional
from src.preprocessing import ALL_MODEL_FEATURES
from src.training.experiment_registry import get_experiment, save_experiment

class ModelLifecycleState(str, Enum):
    EXPERIMENTAL_MODEL = "EXPERIMENTAL_MODEL"
    VALIDATION_SELECTED_CANDIDATE = "VALIDATION_SELECTED_CANDIDATE"
    INDEPENDENTLY_EVALUATED_CANDIDATE = "INDEPENDENTLY_EVALUATED_CANDIDATE"
    APPROVED_TECHNICAL_ARTIFACT = "APPROVED_TECHNICAL_ARTIFACT"
    PRODUCTION_DEPLOYMENT = "PRODUCTION_DEPLOYMENT"

FORBIDDEN_LEAKAGE_TOKENS = [
    "Have you ever had suicidal thoughts ?",
    "Family History of Mental Illness",
    "id", "City", "Work Pressure", "Job Satisfaction", "Profession"
]

def check_validation_candidacy_eligibility(experiment_id: str) -> Tuple[bool, str]:
    """
    Evaluate whether an experiment qualifies as a VALIDATION_SELECTED_CANDIDATE.
    
    CRITICAL GOVERNANCE PRINCIPLE:
    Candidate selection must be evaluated strictly using TRAINING and VALIDATION data.
    The final test set must NEVER be used for model selection or candidate gating.
    
    Technical Eligibility Criteria:
      1. Must use the exact approved 10 features (demographic and study lifestyle).
      2. Must contain zero forbidden or target-leaking tokens.
      3. Target column must match production target 'Depression'.
      4. Validation Recall >= 0.75 (sensitivity threshold to reduce false negatives in screening).
      5. Validation F1-Score >= 0.75 (balanced harmonic performance on validation set).
    """
    exp = get_experiment(experiment_id)
    if not exp:
        return False, f"Experiment '{experiment_id}' does not exist in registry."
        
    if exp.status != "COMPLETED":
        return False, f"Experiment status is '{exp.status}' (must be COMPLETED)."
        
    if exp.target_column != "Depression":
        return False, f"Target column is '{exp.target_column}' (must match production target 'Depression')."
        
    configured_features = set(exp.numerical_features + exp.categorical_features)
    approved_set = set(ALL_MODEL_FEATURES)
    
    if configured_features != approved_set:
        diff_missing = approved_set - configured_features
        diff_extra = configured_features - approved_set
        return False, (
            f"Schema mismatch: Missing required features {list(diff_missing)}; "
            f"Unauthorized extra features {list(diff_extra)}. Must match exactly the 10 approved features."
        )
        
    for token in FORBIDDEN_LEAKAGE_TOKENS:
        if token in configured_features:
            return False, f"Target Leakage Violation: Feature list contains forbidden token '{token}'."
            
    # VALIDATION-BASED SELECTION (Strictly isolated from test set)
    val_metrics = exp.val_metrics
    val_rec = val_metrics.get("recall", 0.0)
    val_f1 = val_metrics.get("f1_score", 0.0)
    val_acc = val_metrics.get("accuracy", 0.0)
    
    if val_acc is None or val_acc < 0.75:
        return False, f"Validation accuracy ({val_acc}) does not meet the technical verification threshold (>= 0.75)."
    if val_rec is None or val_rec < 0.75:
        return False, f"Validation recall ({val_rec}) does not meet the technical verification threshold (>= 0.75)."
    if val_f1 is None or val_f1 < 0.75:
        return False, f"Validation F1-score ({val_f1}) does not meet the technical verification threshold (>= 0.75)."
        
    return True, "Experiment satisfies all validation-based candidate selection requirements."

def promote_to_validation_candidate(experiment_id: str) -> Tuple[bool, str]:
    """Promote an eligible experiment to VALIDATION_SELECTED_CANDIDATE."""
    eligible, reason = check_validation_candidacy_eligibility(experiment_id)
    if not eligible:
        return False, reason
        
    exp = get_experiment(experiment_id)
    exp.is_production_candidate = True
    exp.notes = f"Promoted to {ModelLifecycleState.VALIDATION_SELECTED_CANDIDATE.value} via validation metrics."
    save_experiment(exp)
    return True, f"Experiment '{experiment_id}' promoted to {ModelLifecycleState.VALIDATION_SELECTED_CANDIDATE.value}."

def approve_model_artifact(experiment_id: str, operator_name: str) -> Tuple[bool, str]:
    """
    Record explicit human approval for an independently evaluated candidate.
    Changes lifecycle state to APPROVED_TECHNICAL_ARTIFACT.
    Guarantees models/best_model.pkl is NOT automatically overwritten.
    """
    exp = get_experiment(experiment_id)
    if not exp:
        return False, "Experiment not found."
    if not exp.is_production_candidate:
        return False, "Model must first be a validation-selected candidate."
        
    exp.is_approved = True
    exp.notes = f"Status: {ModelLifecycleState.APPROVED_TECHNICAL_ARTIFACT.value}. Approved by operator '{operator_name}'."
    save_experiment(exp)
    return True, (
        f"Model '{experiment_id}' approved by {operator_name} as {ModelLifecycleState.APPROVED_TECHNICAL_ARTIFACT.value}. "
        f"Production baseline remains protected and will not be overwritten automatically."
    )

def get_production_baseline_info() -> Dict[str, Any]:
    """Return status and metadata of the currently locked active production baseline."""
    prod_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "best_model.pkl")
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "model_comparison.json")
    
    metrics = {}
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            metrics = data.get("calibrated_production_metrics", {})
            
    return {
        "model_name": "Calibrated XGBoost (Production Baseline)",
        "lifecycle_state": ModelLifecycleState.PRODUCTION_DEPLOYMENT.value,
        "artifact_path": prod_path,
        "features": ALL_MODEL_FEATURES,
        "feature_count": len(ALL_MODEL_FEATURES),
        "calibration": "CalibratedClassifierCV (method='sigmoid', cv=5)",
        "test_metrics": metrics
    }
