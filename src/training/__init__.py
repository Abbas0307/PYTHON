"""
src/training/__init__.py
Mindora Local AI/ML Training Platform package.
"""

from src.training.splitting import split_dataset, split_with_independent_holdout
from src.training.preprocessing import build_tabular_preprocessor, get_transformed_feature_names
from src.training.model_factory import get_supported_models, create_model
from src.training.evaluate import compute_classification_metrics, verify_metric_consistency, format_metrics_summary
from src.training.pipeline import assemble_training_pipeline
from src.training.experiment import ExperimentRun
from src.training.experiment_registry import (
    save_experiment,
    list_experiments,
    get_experiment,
    compare_experiments,
    get_registry_file,
    get_models_dir,
    isolated_experiment_context,
    EXPERIMENTS_DIR,
    MODELS_DIR
)
from src.training.model_registry import (
    ModelLifecycleState,
    check_validation_candidacy_eligibility,
    promote_to_validation_candidate,
    approve_model_artifact,
    get_production_baseline_info
)
from src.training.train import run_training_experiment

__all__ = [
    "split_dataset",
    "split_with_independent_holdout",
    "build_tabular_preprocessor",
    "get_transformed_feature_names",
    "get_supported_models",
    "create_model",
    "compute_classification_metrics",
    "verify_metric_consistency",
    "format_metrics_summary",
    "assemble_training_pipeline",
    "ExperimentRun",
    "save_experiment",
    "list_experiments",
    "get_experiment",
    "compare_experiments",
    "ModelLifecycleState",
    "check_validation_candidacy_eligibility",
    "promote_to_validation_candidate",
    "approve_model_artifact",
    "get_production_baseline_info",
    "run_training_experiment",
    "get_registry_file",
    "get_models_dir",
    "isolated_experiment_context",
    "EXPERIMENTS_DIR",
    "MODELS_DIR"
]
