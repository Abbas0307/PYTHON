"""
ml_lab/experiments/run_stage_3b_3.py
Stage 3B.3: Supervised Model Comparison Orchestrator.
Evaluates:
  1. Logistic Regression (Stage 3B.2 baseline reference)
  2. Random Forest Classifier
  3. XGBoost Classifier

Protocol:
  - 5-fold StratifiedGroupKFold on Development partition (N=23,716, 23,715 groups).
  - Identical outer fold assignments reused from Stage 3B.2.
  - Hardened pre-ingestion streaming isolation via development_only_loader.py.
  - Zero access or evaluation on the Test Vault (N=4,185).
  - Outputs strictly to ml_lab/experiments/stage_3b_3/.
"""

import os
import sys
import json
import time
import datetime
import hashlib
import tracemalloc
import subprocess
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml_lab.evaluation import (
    load_development_dataset,
    validate_cv_folds,
    compute_binary_metrics,
    build_logistic_regression_baseline,
    build_random_forest_pipeline,
    build_xgboost_pipeline,
    FROZEN_NUMERICAL_FEATURES,
    FROZEN_CATEGORICAL_FEATURES,
    FROZEN_ALL_FEATURES,
    FROZEN_TARGET,
    EXPECTED_DATASET_SHA256,
    EXPECTED_MANIFEST_SHA256,
    EXPECTED_ASSIGNMENTS_SHA256,
    EXPECTED_DEV_ROWS
)

STAGE_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stage_3b_3")
MODELS_OUTPUT_DIR = os.path.join(STAGE_OUTPUT_DIR, "models")
HISTORICAL_FOLDS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "stage_3b_2", "fold_assignments.csv"
)


def get_environment_info() -> Dict[str, Any]:
    """Capture environment, python, package, and git metadata."""
    import sklearn
    import xgboost
    import platform
    
    try:
        git_branch = subprocess.check_output(["git", "branch", "--show-current"], text=True).strip()
    except Exception:
        git_branch = "unknown"
        
    try:
        git_commit = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        git_commit = "unknown"
        
    return {
        "python_version": sys.version,
        "platform": platform.platform(),
        "processor": platform.processor(),
        "cpu_count": os.cpu_count(),
        "scikit_learn_version": sklearn.__version__,
        "xgboost_version": xgboost.__version__,
        "pandas_version": pd.__version__,
        "numpy_version": np.__version__,
        "joblib_version": joblib.__version__,
        "git_branch": git_branch,
        "git_commit": git_commit
    }


def compute_sha256(file_path: str) -> str:
    """Compute SHA-256 digest of a local file."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest().upper()


def run_stage_3b_3() -> None:
    print("=" * 80)
    print("MINDORA 2.0 — STAGE 3B.3 MODEL COMPARISON EXECUTION")
    print("=" * 80)
    
    start_time_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    t_global_start = time.perf_counter()
    os.makedirs(MODELS_OUTPUT_DIR, exist_ok=True)
    
    # 1. Ingestion via hardened Development-only loader
    print("\n[1/6] Loading Development Partition via Hardened Pre-Ingestion Loader...")
    X_dev, y_dev, groups_dev, dev_row_indices, test_vault_indices = load_development_dataset()
    
    assert len(X_dev) == EXPECTED_DEV_ROWS, f"Expected {EXPECTED_DEV_ROWS}, got {len(X_dev)}"
    assert len(y_dev) == EXPECTED_DEV_ROWS
    assert len(groups_dev) == EXPECTED_DEV_ROWS
    assert len(test_vault_indices) == 4185
    
    pos_count = int(y_dev.sum())
    neg_count = len(y_dev) - pos_count
    print(f"      Verified Development records: {len(X_dev):,}")
    print(f"      Target distribution: {pos_count:,} positive ({pos_count/len(y_dev):.4%}), {neg_count:,} negative")
    print(f"      Unique groups: {groups_dev.nunique():,}")
    
    # 2. Reusing exact frozen outer folds from Stage 3B.2
    print("\n[2/6] Loading & Verifying Reused Outer Cross-Validation Folds...")
    assert os.path.exists(HISTORICAL_FOLDS_PATH), f"Missing Stage 3B.2 fold assignments: {HISTORICAL_FOLDS_PATH}"
    fold_df = pd.read_csv(HISTORICAL_FOLDS_PATH)
    
    assert len(fold_df) == EXPECTED_DEV_ROWS
    assert (fold_df["dataset_row_index"].values == dev_row_indices).all()
    assert (fold_df["group_id"].values == groups_dev.values).all()
    
    n_splits = 5
    folds = []
    for k in range(n_splits):
        val_mask = (fold_df["validation_fold"] == k)
        val_idx = np.where(val_mask)[0]
        train_idx = np.where(~val_mask)[0]
        folds.append((train_idx, val_idx))
        print(f"      Fold {k}: Train={len(train_idx):,} rows, Val={len(val_idx):,} rows")
        
    # Validate group disjointness & zero test vault leakage
    validate_cv_folds(folds, dev_row_indices, groups_dev, test_vault_indices)
    print("      PASSED: Zero Test Vault leakage & zero train/val group overlap verified across all folds.")

    # 3. Model Pipeline Builders Setup
    models_to_evaluate = {
        "logistic_regression": {
            "name": "Logistic Regression",
            "family": "Linear Baseline (L2 Regularized)",
            "builder": lambda: build_logistic_regression_baseline(
                FROZEN_NUMERICAL_FEATURES,
                FROZEN_CATEGORICAL_FEATURES,
                random_state=42,
                max_iter=1000,
                C=1.0,
                solver="lbfgs"
            )
        },
        "random_forest": {
            "name": "Random Forest",
            "family": "Ensemble Bagging (100 Trees)",
            "builder": lambda: build_random_forest_pipeline(
                FROZEN_NUMERICAL_FEATURES,
                FROZEN_CATEGORICAL_FEATURES,
                random_state=42,
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features="sqrt",
                n_jobs=-1
            )
        },
        "xgboost": {
            "name": "XGBoost",
            "family": "Gradient Boosting (100 Trees, Shrinkage=0.08)",
            "builder": lambda: build_xgboost_pipeline(
                FROZEN_NUMERICAL_FEATURES,
                FROZEN_CATEGORICAL_FEATURES,
                random_state=42,
                n_estimators=100,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.85,
                colsample_bytree=0.85,
                reg_lambda=1.0,
                n_jobs=-1
            )
        }
    }

    oof_predictions = {
        m_key: np.zeros(len(X_dev), dtype=float) for m_key in models_to_evaluate
    }
    fold_metrics_records = {
        m_key: [] for m_key in models_to_evaluate
    }
    timing_memory_records = {
        m_key: [] for m_key in models_to_evaluate
    }

    # 4. Cross-Validation Loop
    print("\n[3/6] Executing 5-Fold Group-Aware Cross-Validation Across 3 Models...")
    
    for fold_idx, (train_idx, val_idx) in enumerate(folds):
        print(f"\n--- FOLD {fold_idx + 1}/{n_splits} ---")
        X_train_df = X_dev.iloc[train_idx]
        y_train_arr = y_dev.iloc[train_idx].values
        X_val_df = X_dev.iloc[val_idx]
        y_val_arr = y_dev.iloc[val_idx].values
        
        for m_key, m_info in models_to_evaluate.items():
            print(f"  Training {m_info['name']}...")
            pipe = m_info["builder"]()
            
            # Start memory trace & wall-clock timing
            tracemalloc.start()
            t0_train = time.perf_counter()
            pipe.fit(X_train_df, y_train_arr)
            t1_train = time.perf_counter()
            _, peak_train_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            
            # Inference timing
            t0_infer = time.perf_counter()
            val_probs = pipe.predict_proba(X_val_df)[:, 1]
            t1_infer = time.perf_counter()
            
            train_duration = t1_train - t0_train
            infer_duration = t1_infer - t0_infer
            peak_train_mem_mb = peak_train_mem / (1024 * 1024)
            
            # Store OOF predictions
            oof_predictions[m_key][val_idx] = val_probs
            
            # Compute fold metrics
            metrics = compute_binary_metrics(y_val_arr, val_probs, threshold=0.50)
            
            fold_metrics_records[m_key].append({
                "fold": fold_idx,
                "n_train": len(train_idx),
                "n_val": len(val_idx),
                "metrics": metrics,
                "timing": {
                    "train_duration_seconds": train_duration,
                    "infer_duration_seconds": infer_duration,
                    "peak_train_memory_mb": peak_train_mem_mb
                }
            })
            timing_memory_records[m_key].append({
                "fold": fold_idx,
                "train_duration_seconds": train_duration,
                "infer_duration_seconds": infer_duration,
                "peak_train_memory_mb": peak_train_mem_mb
            })
            
            print(f"    Fold {fold_idx} {m_info['name']}: ROC-AUC={metrics['roc_auc']:.4f}, "
                  f"Brier={metrics['brier_score']:.4f}, ECE={metrics['ece']:.4f}, "
                  f"Acc={metrics['accuracy']:.4f}, TrainTime={train_duration:.3f}s")

    # 5. Compute Pooled Out-of-Fold (OOF) Metrics & Fold Aggregations
    print("\n[4/6] Computing Pooled Out-of-Fold Metrics & Fold-Level Variances...")
    
    oof_metrics_summary = {}
    model_comparison_table = []
    
    for m_key, m_info in models_to_evaluate.items():
        probs = oof_predictions[m_key]
        pooled_m = compute_binary_metrics(y_dev.values, probs, threshold=0.50)
        
        # Aggregate fold metrics (mean and std)
        fold_aucs = [fm["metrics"]["roc_auc"] for fm in fold_metrics_records[m_key]]
        fold_briers = [fm["metrics"]["brier_score"] for fm in fold_metrics_records[m_key]]
        fold_eces = [fm["metrics"]["ece"] for fm in fold_metrics_records[m_key]]
        fold_accs = [fm["metrics"]["accuracy"] for fm in fold_metrics_records[m_key]]
        fold_bal_accs = [fm["metrics"]["balanced_accuracy"] for fm in fold_metrics_records[m_key]]
        fold_precs = [fm["metrics"]["precision"] for fm in fold_metrics_records[m_key]]
        fold_recs = [fm["metrics"]["recall"] for fm in fold_metrics_records[m_key]]
        fold_specs = [fm["metrics"]["specificity"] for fm in fold_metrics_records[m_key]]
        fold_f1s = [fm["metrics"]["f1_score"] for fm in fold_metrics_records[m_key]]
        fold_train_times = [t["train_duration_seconds"] for t in timing_memory_records[m_key]]
        fold_infer_times = [t["infer_duration_seconds"] for t in timing_memory_records[m_key]]
        fold_peak_mems = [t["peak_train_memory_mb"] for t in timing_memory_records[m_key]]
        
        fold_summary = {
            "roc_auc": {"mean": float(np.mean(fold_aucs)), "std": float(np.std(fold_aucs))},
            "brier_score": {"mean": float(np.mean(fold_briers)), "std": float(np.std(fold_briers))},
            "ece": {"mean": float(np.mean(fold_eces)), "std": float(np.std(fold_eces))},
            "accuracy": {"mean": float(np.mean(fold_accs)), "std": float(np.std(fold_accs))},
            "balanced_accuracy": {"mean": float(np.mean(fold_bal_accs)), "std": float(np.std(fold_bal_accs))},
            "precision": {"mean": float(np.mean(fold_precs)), "std": float(np.std(fold_precs))},
            "recall": {"mean": float(np.mean(fold_recs)), "std": float(np.std(fold_recs))},
            "specificity": {"mean": float(np.mean(fold_specs)), "std": float(np.std(fold_specs))},
            "f1_score": {"mean": float(np.mean(fold_f1s)), "std": float(np.std(fold_f1s))},
            "train_duration_seconds": {"mean": float(np.mean(fold_train_times)), "std": float(np.std(fold_train_times)), "total": float(np.sum(fold_train_times))},
            "infer_duration_seconds": {"mean": float(np.mean(fold_infer_times)), "std": float(np.std(fold_infer_times)), "total": float(np.sum(fold_infer_times))},
            "peak_train_memory_mb": {"mean": float(np.mean(fold_peak_mems)), "max": float(np.max(fold_peak_mems))}
        }
        
        oof_metrics_summary[m_key] = {
            "name": m_info["name"],
            "family": m_info["family"],
            "pooled_oof_metrics": pooled_m,
            "fold_summary": fold_summary
        }
        
        model_comparison_table.append({
            "model_key": m_key,
            "name": m_info["name"],
            "family": m_info["family"],
            "roc_auc_pooled": round(pooled_m["roc_auc"], 4),
            "roc_auc_cv": f"{fold_summary['roc_auc']['mean']:.4f} ± {fold_summary['roc_auc']['std']:.4f}",
            "brier_score_pooled": round(pooled_m["brier_score"], 4),
            "brier_score_cv": f"{fold_summary['brier_score']['mean']:.4f} ± {fold_summary['brier_score']['std']:.4f}",
            "ece_pooled": round(pooled_m["ece"], 4),
            "ece_cv": f"{fold_summary['ece']['mean']:.4f} ± {fold_summary['ece']['std']:.4f}",
            "accuracy_pooled": round(pooled_m["accuracy"], 4),
            "balanced_accuracy_pooled": round(pooled_m["balanced_accuracy"], 4),
            "precision_pooled": round(pooled_m["precision"], 4),
            "recall_pooled": round(pooled_m["recall"], 4),
            "specificity_pooled": round(pooled_m["specificity"], 4),
            "f1_score_pooled": round(pooled_m["f1_score"], 4),
            "total_train_time_sec": round(fold_summary["train_duration_seconds"]["total"], 3),
            "total_infer_time_sec": round(fold_summary["infer_duration_seconds"]["total"], 3),
            "peak_memory_mb": round(fold_summary["peak_train_memory_mb"]["max"], 2)
        })
        
        print(f"\n=== {m_info['name'].upper()} POOLED OUT-OF-FOLD RESULTS ===")
        print(f"  ROC-AUC:           {pooled_m['roc_auc']:.4f} (CV: {fold_summary['roc_auc']['mean']:.4f} ± {fold_summary['roc_auc']['std']:.4f})")
        print(f"  Brier Score:       {pooled_m['brier_score']:.4f} (CV: {fold_summary['brier_score']['mean']:.4f} ± {fold_summary['brier_score']['std']:.4f})")
        print(f"  ECE (10 Bins):     {pooled_m['ece']:.4f} (CV: {fold_summary['ece']['mean']:.4f} ± {fold_summary['ece']['std']:.4f})")
        print(f"  Accuracy:          {pooled_m['accuracy']:.4f}")
        print(f"  Balanced Accuracy: {pooled_m['balanced_accuracy']:.4f}")
        print(f"  Precision:         {pooled_m['precision']:.4f}")
        print(f"  Recall (Sens):     {pooled_m['recall']:.4f}")
        print(f"  Specificity:       {pooled_m['specificity']:.4f}")
        print(f"  F1 Score:          {pooled_m['f1_score']:.4f}")
        print(f"  Confusion Matrix:  {pooled_m['confusion_matrix']}")
        print(f"  Total Train Time:  {fold_summary['train_duration_seconds']['total']:.3f}s")

    # 6. Fit & Save Development-Only Reference Model Artifacts
    print("\n[5/6] Fitting & Serializing Full Development Reference Models...")
    
    for m_key, m_info in models_to_evaluate.items():
        model_artifact_path = os.path.join(MODELS_OUTPUT_DIR, f"{m_key}_dev.pkl")
        full_pipe = m_info["builder"]()
        full_pipe.fit(X_dev, y_dev.values)
        joblib.dump(full_pipe, model_artifact_path)
        print(f"      Saved research reference artifact: {model_artifact_path}")

    # 7. Persist All Experiment Outputs
    print("\n[6/6] Persisting Experiment Registry & Reproducibility Artifacts...")
    
    # A. OOF Predictions DataFrame
    oof_df = pd.DataFrame({
        "dataset_row_index": dev_row_indices,
        "group_id": groups_dev.values,
        "true_label": y_dev.values,
        "logistic_regression_prob": oof_predictions["logistic_regression"],
        "logistic_regression_pred": (oof_predictions["logistic_regression"] >= 0.50).astype(int),
        "random_forest_prob": oof_predictions["random_forest"],
        "random_forest_pred": (oof_predictions["random_forest"] >= 0.50).astype(int),
        "xgboost_prob": oof_predictions["xgboost"],
        "xgboost_pred": (oof_predictions["xgboost"] >= 0.50).astype(int)
    })
    oof_predictions_path = os.path.join(STAGE_OUTPUT_DIR, "oof_predictions.csv")
    oof_df.to_csv(oof_predictions_path, index=False)
    
    # B. Experiment Configuration
    config_dict = {
        "experiment_id": "stage_3b_3_model_comparison",
        "stage": "Stage 3B.3",
        "description": "5-fold StratifiedGroupKFold comparison of Logistic Regression, Random Forest, and XGBoost on Development partition",
        "random_seed": 42,
        "n_splits": 5,
        "target_column": FROZEN_TARGET,
        "numerical_features": FROZEN_NUMERICAL_FEATURES,
        "categorical_features": FROZEN_CATEGORICAL_FEATURES,
        "all_model_features": FROZEN_ALL_FEATURES,
        "decision_threshold": 0.50,
        "models": {
            "logistic_regression": {
                "class": "LogisticRegression",
                "penalty": "l2",
                "C": 1.0,
                "solver": "lbfgs",
                "max_iter": 1000,
                "random_state": 42
            },
            "random_forest": {
                "class": "RandomForestClassifier",
                "n_estimators": 100,
                "max_depth": 10,
                "min_samples_split": 5,
                "min_samples_leaf": 2,
                "max_features": "sqrt",
                "bootstrap": True,
                "random_state": 42
            },
            "xgboost": {
                "class": "XGBClassifier",
                "n_estimators": 100,
                "max_depth": 5,
                "learning_rate": 0.08,
                "subsample": 0.85,
                "colsample_bytree": 0.85,
                "reg_lambda": 1.0,
                "tree_method": "hist",
                "objective": "binary:logistic",
                "eval_metric": "logloss",
                "random_state": 42
            }
        }
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "experiment_config.json"), "w") as f:
        json.dump(config_dict, f, indent=2)

    # C. Fold Assignments Copy
    fold_df.to_csv(os.path.join(STAGE_OUTPUT_DIR, "fold_assignments.csv"), index=False)

    # D. Fold Metrics
    with open(os.path.join(STAGE_OUTPUT_DIR, "fold_metrics.json"), "w") as f:
        json.dump(fold_metrics_records, f, indent=2)

    # E. Pooled OOF Metrics Summary
    with open(os.path.join(STAGE_OUTPUT_DIR, "oof_metrics.json"), "w") as f:
        json.dump(oof_metrics_summary, f, indent=2)

    # F. Model Comparison Table
    with open(os.path.join(STAGE_OUTPUT_DIR, "model_comparison.json"), "w") as f:
        json.dump(model_comparison_table, f, indent=2)

    # G. Input Asset Hashes
    input_hashes = {
        "dataset_a_sha256": EXPECTED_DATASET_SHA256,
        "partition_manifest_sha256": EXPECTED_MANIFEST_SHA256,
        "partition_assignments_sha256": EXPECTED_ASSIGNMENTS_SHA256,
        "historical_folds_sha256": compute_sha256(HISTORICAL_FOLDS_PATH)
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "input_hashes.json"), "w") as f:
        json.dump(input_hashes, f, indent=2)

    # H. Environment Info
    env_info = get_environment_info()
    with open(os.path.join(STAGE_OUTPUT_DIR, "environment.json"), "w") as f:
        json.dump(env_info, f, indent=2)

    # I. Execution Metadata
    t_global_end = time.perf_counter()
    exec_meta = {
        "stage": "Stage 3B.3",
        "start_time_utc": start_time_utc,
        "end_time_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "wall_clock_runtime_seconds": t_global_end - t_global_start,
        "status": "COMPLETED_SUCCESSFULLY"
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "execution_metadata.json"), "w") as f:
        json.dump(exec_meta, f, indent=2)

    print(f"\nExecution finished in {t_global_end - t_global_start:.2f} seconds.")
    print(f"All outputs saved under: {STAGE_OUTPUT_DIR}")
    print("=" * 80)


if __name__ == "__main__":
    run_stage_3b_3()
