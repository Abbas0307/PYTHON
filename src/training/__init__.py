"""
src/training/__init__.py
Mindora Local AI/ML Training Platform package.
"""

from src.training.splitting import split_dataset
from src.training.preprocessing import build_tabular_preprocessor, get_transformed_feature_names
from src.training.model_factory import get_supported_models, create_model
from src.training.evaluate import compute_classification_metrics, format_metrics_summary
from src.training.pipeline import assemble_training_pipeline
from src.training.experiment import ExperimentRun
from src.training.experiment_registry import (
    save_experiment,
    list_experiments,
    get_experiment,
    compare_experiments,
    EXPERIMENTS_DIR,
    MODELS_DIR
)
from src.training.model_registry import (
    check_candidate_eligibility,
    mark_as_production_candidate,
    approve_model_for_production,
    get_production_baseline_info
)
from src.training.train import run_training_experiment

__all__ = [
    "split_dataset",
    "build_tabular_preprocessor",
    "get_transformed_feature_names",
    "get_supported_models",
    "create_model",
    "compute_classification_metrics",
    "format_metrics_summary",
    "assemble_training_pipeline",
    "ExperimentRun",
    "save_experiment",
    "list_experiments",
    "get_experiment",
    "compare_experiments",
    "check_candidate_eligibility",
    "mark_as_production_candidate",
    "approve_model_for_production",
    "get_production_baseline_info",
    "run_training_experiment",
    "EXPERIMENTS_DIR",
    "MODELS_DIR"
]
