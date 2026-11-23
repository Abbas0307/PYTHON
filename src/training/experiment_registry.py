"""
src/training/experiment_registry.py
Thread-safe, atomic local experiment tracking and registry management.
Persists metadata to experiments/registry.json without cloud dependencies.
"""

import os
import json
import tempfile
import contextlib
import shutil
import pandas as pd
from typing import List, Optional, Dict, Any, Generator, Tuple
from src.training.experiment import ExperimentRun

EXPERIMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "experiments")
REGISTRY_FILE = os.path.join(EXPERIMENTS_DIR, "registry.json")
MODELS_DIR = os.path.join(EXPERIMENTS_DIR, "models")

# Thread/process local active path overrides for isolated testing
_ACTIVE_REGISTRY_FILE: Optional[str] = None
_ACTIVE_MODELS_DIR: Optional[str] = None

os.makedirs(EXPERIMENTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def get_registry_file() -> str:
    """Return the active registry file path (honoring test isolation context if set)."""
    return _ACTIVE_REGISTRY_FILE or REGISTRY_FILE

def get_models_dir() -> str:
    """Return the active models directory path (honoring test isolation context if set)."""
    return _ACTIVE_MODELS_DIR or MODELS_DIR

@contextlib.contextmanager
def isolated_experiment_context(
    base_dir: Optional[str] = None,
    seed_with_existing: bool = True
) -> Generator[Tuple[str, str], None, None]:
    """
    Context manager that temporarily isolates experiment tracking.
    Redirects model artifact saving and registry tracking to a temporary directory.
    Cleans up all temporary files automatically upon context exit.

    Yields:
        (isolated_models_dir, isolated_registry_file)
    """
    global _ACTIVE_REGISTRY_FILE, _ACTIVE_MODELS_DIR
    temp_dir = tempfile.mkdtemp(prefix="mindora_test_exp_", dir=base_dir)
    isolated_models = os.path.join(temp_dir, "models")
    os.makedirs(isolated_models, exist_ok=True)
    isolated_reg = os.path.join(temp_dir, "registry.json")

    if seed_with_existing and os.path.exists(REGISTRY_FILE):
        try:
            shutil.copy2(REGISTRY_FILE, isolated_reg)
        except Exception:
            with open(isolated_reg, "w", encoding="utf-8") as f:
                json.dump({"experiments": []}, f)
    else:
        with open(isolated_reg, "w", encoding="utf-8") as f:
            json.dump({"experiments": []}, f)

    prev_reg = _ACTIVE_REGISTRY_FILE
    prev_models = _ACTIVE_MODELS_DIR
    _ACTIVE_REGISTRY_FILE = isolated_reg
    _ACTIVE_MODELS_DIR = isolated_models
    try:
        yield (isolated_models, isolated_reg)
    finally:
        _ACTIVE_REGISTRY_FILE = prev_reg
        _ACTIVE_MODELS_DIR = prev_models
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass

def _load_raw_registry(registry_file: Optional[str] = None) -> Dict[str, Any]:
    target_file = registry_file or get_registry_file()
    if not os.path.exists(target_file):
        return {"experiments": []}
    try:
        with open(target_file, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except Exception:
        return {"experiments": []}

def _save_raw_registry(data: Dict[str, Any], registry_file: Optional[str] = None) -> None:
    """Atomic write to registry.json using temporary file."""
    target_file = registry_file or get_registry_file()
    target_dir = os.path.dirname(target_file)
    os.makedirs(target_dir, exist_ok=True)
    temp_fd, temp_path = tempfile.mkstemp(dir=target_dir, prefix="reg_", suffix=".tmp")
    with os.fdopen(temp_fd, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)
    # Atomic replace
    os.replace(temp_path, target_file)

def save_experiment(run: ExperimentRun, registry_file: Optional[str] = None) -> None:
    """Persist an experiment run to the registry (supporting dependency injection)."""
    reg = _load_raw_registry(registry_file=registry_file)
    # Replace existing with same ID or append
    exps = [e for e in reg["experiments"] if e.get("experiment_id") != run.experiment_id]
    exps.append(run.to_dict())
    reg["experiments"] = exps
    _save_raw_registry(reg, registry_file=registry_file)

def list_experiments(registry_file: Optional[str] = None) -> List[ExperimentRun]:
    """Retrieve all logged experiments sorted by creation timestamp descending."""
    reg = _load_raw_registry(registry_file=registry_file)
    runs = []
    for d in reg.get("experiments", []):
        try:
            runs.append(ExperimentRun.from_dict(d))
        except Exception:
            pass
    runs.sort(key=lambda r: r.created_at, reverse=True)
    return runs

def get_experiment(experiment_id: str, registry_file: Optional[str] = None) -> Optional[ExperimentRun]:
    """Fetch an experiment by unique identifier."""
    runs = list_experiments(registry_file=registry_file)
    for r in runs:
        if r.experiment_id == experiment_id:
            return r
    return None

def compare_experiments(
    experiment_ids: Optional[List[str]] = None,
    registry_file: Optional[str] = None
) -> pd.DataFrame:
    """
    Generate a comparison DataFrame of selected or all experiments.
    """
    runs = list_experiments(registry_file=registry_file)
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
