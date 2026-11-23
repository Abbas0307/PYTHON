"""
src/training/train.py
Orchestrator for local model training, split isolation, validation selection,
held-out testing, and atomic artifact persistence.
"""

import os
import time
import datetime
import joblib
import pandas as pd
from typing import Dict, Any, Optional

from src.data_platform.schema import DatasetConfig
from src.data_platform.validator import validate_training_configuration
from src.training.splitting import split_dataset
from src.training.preprocessing import build_tabular_preprocessor
from src.training.model_factory import create_model
from src.training.evaluate import compute_classification_metrics
from src.training.pipeline import assemble_training_pipeline
from src.training.experiment import ExperimentRun
from src.training.experiment_registry import save_experiment, MODELS_DIR, get_models_dir

def run_training_experiment(
    df: pd.DataFrame,
    config: DatasetConfig,
    model_name: str,
    hyperparams: Optional[Dict[str, Any]] = None,
    dataset_name: str = "dataset",
    dataset_fingerprint: str = "",
    models_dir: Optional[str] = None,
    registry_file: Optional[str] = None
) -> ExperimentRun:
    """
    Execute an isolated training experiment and log all artifacts to the local registry.
    """
    # 1. Pre-training validation
    report = validate_training_configuration(df, config)
    if not report.is_valid:
        error_msgs = "; ".join([e.message for e in report.errors])
        raise ValueError(f"Training configuration invalid: {error_msgs}")
        
    start_time = time.time()
    ts_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    model_slug = model_name.lower().replace(" ", "_").replace("(", "").replace(")", "")[:10]
    exp_id = f"exp_{ts_str}_{model_slug}"
    
    # 2. Split dataset reproducibly
    X_train, X_val, X_test, y_train, y_val, y_test = split_dataset(df, config)
    
    # 3. Fit preprocessing strictly on training data
    preprocessor = build_tabular_preprocessor(
        config.numerical_features,
        config.categorical_features,
        scale_numeric=True
    )
    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)
    
    # 4. Instantiate and fit model
    estimator = create_model(model_name, hyperparams, random_seed=config.random_seed)
    estimator.fit(X_train_trans, y_train)
    
    # 5. Evaluate on Train partition
    train_preds = estimator.predict(X_train_trans)
    train_probs = estimator.predict_proba(X_train_trans) if hasattr(estimator, "predict_proba") else None
    train_metrics = compute_classification_metrics(y_train, train_preds, train_probs)
    
    # 6. Evaluate on Validation partition (Used for model selection)
    val_preds = estimator.predict(X_val_trans)
    val_probs = estimator.predict_proba(X_val_trans) if hasattr(estimator, "predict_proba") else None
    val_metrics = compute_classification_metrics(y_val, val_preds, val_probs)
    
    # 7. Evaluate on Held-Out Test partition (Evaluated strictly once)
    test_preds = estimator.predict(X_test_trans)
    test_probs = estimator.predict_proba(X_test_trans) if hasattr(estimator, "predict_proba") else None
    test_metrics = compute_classification_metrics(y_test, test_preds, test_probs)
    
    duration = time.time() - start_time
    
    # 8. Assemble full pipeline and save artifact locally
    full_pipeline = assemble_training_pipeline(preprocessor, estimator)
    target_models_dir = models_dir or get_models_dir()
    os.makedirs(target_models_dir, exist_ok=True)
    artifact_path = os.path.join(target_models_dir, f"{exp_id}.pkl")
    joblib.dump(full_pipeline, artifact_path)
    
    # 9. Create and persist experiment run
    run = ExperimentRun(
        experiment_id=exp_id,
        dataset_name=dataset_name,
        dataset_fingerprint=dataset_fingerprint,
        total_rows=len(df),
        total_cols=len(df.columns),
        target_column=config.target_column,
        task_type=config.task_type.value,
        numerical_features=config.numerical_features,
        categorical_features=config.categorical_features,
        excluded_columns=config.excluded_columns,
        model_name=model_name,
        hyperparameters=hyperparams if hyperparams else {},
        random_seed=config.random_seed,
        split_ratios={
            "train": round(1.0 - config.test_split_ratio - config.val_split_ratio, 2),
            "val": config.val_split_ratio,
            "test": config.test_split_ratio
        },
        train_metrics=train_metrics,
        val_metrics=val_metrics,
        test_metrics=test_metrics,
        training_duration_seconds=duration,
        created_at=datetime.datetime.now().isoformat(),
        artifact_path=artifact_path,
        status="COMPLETED"
    )
    
    save_experiment(run, registry_file=registry_file)
    return run
