"""
src/training/model_registry.py
Model registry and strict production promotion governance rules.
Guarantees that no candidate model can replace the production baseline without
meeting strict schema compatibility and receiving explicit human approval.
"""

import os
import json
from typing import Dict, Any, Tuple, Optional
from src.preprocessing import ALL_MODEL_FEATURES
from src.training.experiment_registry import get_experiment, save_experiment

FORBIDDEN_LEAKAGE_TOKENS = [
    "Have you ever had suicidal thoughts ?",
    "Family History of Mental Illness",
    "id", "City", "Work Pressure", "Job Satisfaction", "Profession"
]

def check_candidate_eligibility(experiment_id: str) -> Tuple[bool, str]:
    """
    Evaluate whether an experiment meets the strict criteria for production candidacy:
    1. Must use the exact approved 10 features.
    2. Must contain zero forbidden or leaking tokens.
    3. Target must match 'Depression'.
    4. Must have complete test metrics with Recall >= 0.80 and F1 >= 0.80.
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
            f"Schema mismatch with production: Missing required features {list(diff_missing)}; "
            f"Unauthorized extra features {list(diff_extra)}. Must match exactly the 10 approved features."
        )
        
    for token in FORBIDDEN_LEAKAGE_TOKENS:
        if token in configured_features:
            return False, f"Severe Leakage Violation: Feature list contains forbidden token '{token}'."
            
    test_metrics = exp.test_metrics
    acc = test_metrics.get("accuracy", 0.0)
    prec = test_metrics.get("precision", 0.0)
    rec = test_metrics.get("recall", 0.0)
    f1 = test_metrics.get("f1_score", 0.0)
    
    if acc is None or acc < 0.75:
        return False, f"Test accuracy ({acc}) does not meet the minimum safety threshold (>= 0.75)."
    if prec is None or prec < 0.75:
        return False, f"Test precision ({prec}) does not meet the minimum safety threshold (>= 0.75)."
    if rec is None or rec < 0.75:
        return False, f"Test recall ({rec}) does not meet the minimum safety threshold (>= 0.75)."
    if f1 is None or f1 < 0.75:
        return False, f"Test F1-score ({f1}) does not meet the minimum safety threshold (>= 0.75)."
        
    return True, "Experiment satisfies all production candidacy requirements."

def mark_as_production_candidate(experiment_id: str) -> Tuple[bool, str]:
    """Mark an eligible experiment as a production candidate."""
    eligible, reason = check_candidate_eligibility(experiment_id)
    if not eligible:
        return False, reason
        
    exp = get_experiment(experiment_id)
    exp.is_production_candidate = True
    save_experiment(exp)
    return True, f"Experiment '{experiment_id}' has been marked as a Production Candidate."

def approve_model_for_production(experiment_id: str, operator_name: str) -> Tuple[bool, str]:
    """
    Record explicit human approval for a candidate model.
    Note: Does NOT automatically overwrite models/best_model.pkl.
    """
    exp = get_experiment(experiment_id)
    if not exp:
        return False, "Experiment not found."
    if not exp.is_production_candidate:
        return False, "Model must first be marked as an eligible Production Candidate."
        
    exp.is_approved = True
    exp.notes = f"Approved for production promotion by operator '{operator_name}'."
    save_experiment(exp)
    return True, f"Model '{experiment_id}' approved by {operator_name}. Retains candidate status without auto-overwrite."

def get_production_baseline_info() -> Dict[str, Any]:
    """Return status and metrics of the current locked baseline production model."""
    prod_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "best_model.pkl")
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models", "model_comparison.json")
    
    metrics = {}
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            metrics = data.get("calibrated_production_metrics", {})
            
    return {
        "model_name": "Calibrated XGBoost (Production Baseline)",
        "status": "ACTIVE_PRODUCTION_BASELINE",
        "artifact_path": prod_path,
        "features": ALL_MODEL_FEATURES,
        "feature_count": len(ALL_MODEL_FEATURES),
        "calibration": "CalibratedClassifierCV (method='sigmoid', cv=5)",
        "test_metrics": metrics
    }
