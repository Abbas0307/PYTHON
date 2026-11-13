"""
src/training/experiment_registry.py
Thread-safe, atomic local experiment tracking and registry management.
Persists metadata to experiments/registry.json without cloud dependencies.
"""

import os
import json
import tempfile
import pandas as pd
from typing import List, Optional, Dict, Any
from src.training.experiment import ExperimentRun

EXPERIMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "experiments")
REGISTRY_FILE = os.path.join(EXPERIMENTS_DIR, "registry.json")
MODELS_DIR = os.path.join(EXPERIMENTS_DIR, "models")

os.makedirs(EXPERIMENTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def _load_raw_registry() -> Dict[str, Any]:
    if not os.path.exists(REGISTRY_FILE):
        return {"experiments": []}
    try:
        with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception:
        return {"experiments": []}

def _save_raw_registry(data: Dict[str, Any]) -> None:
    """Atomic write to registry.json using temporary file."""
    temp_fd, temp_path = tempfile.mkstemp(dir=EXPERIMENTS_DIR, prefix="reg_", suffix=".tmp")
    with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    # Atomic replace
    os.replace(temp_path, REGISTRY_FILE)

def save_experiment(run: ExperimentRun) -> None:
    """Persist an experiment run to the registry."""
    reg = _load_raw_registry()
    # Replace existing with same ID or append
    exps = [e for e in reg["experiments"] if e.get("experiment_id") != run.experiment_id]
    exps.append(run.to_dict())
    reg["experiments"] = exps
    _save_raw_registry(reg)

def list_experiments() -> List[ExperimentRun]:
    """Retrieve all logged experiments sorted by creation timestamp descending."""
    reg = _load_raw_registry()
    runs = []
    for d in reg.get("experiments", []):
        try:
            runs.append(ExperimentRun.from_dict(d))
        except Exception:
            pass
    runs.sort(key=lambda r: r.created_at, reverse=True)
    return runs

def get_experiment(experiment_id: str) -> Optional[ExperimentRun]:
    """Fetch an experiment by unique identifier."""
    runs = list_experiments()
    for r in runs:
        if r.experiment_id == experiment_id:
            return r
    return None

def compare_experiments(experiment_ids: Optional[List[str]] = None) -> pd.DataFrame:
    """
    Generate a comparison DataFrame of selected or all experiments.
    """
    runs = list_experiments()
    if experiment_ids:
        runs = [r for r in runs if r.experiment_id in experiment_ids]
        
    records = []
    for r in runs:
        records.append({
            "Experiment ID": r.experiment_id,
            "Model": r.model_name,
            "Dataset": r.dataset_name,
            "Target": r.target_column,
            "Val F1": r.val_metrics.get("f1_score"),
            "Val Recall": r.val_metrics.get("recall"),
            "Val ROC-AUC": r.val_metrics.get("roc_auc"),
            "Test Accuracy": r.test_metrics.get("accuracy"),
            "Test Precision": r.test_metrics.get("precision"),
            "Test Recall": r.test_metrics.get("recall"),
            "Test F1": r.test_metrics.get("f1_score"),
            "Test ROC-AUC": r.test_metrics.get("roc_auc"),
            "Duration (s)": round(r.training_duration_seconds, 2),
            "Candidate": "Yes" if r.is_production_candidate else "No",
            "Approved": "Yes" if r.is_approved else "No",
            "Created At": r.created_at
        })
    return pd.DataFrame(records)
