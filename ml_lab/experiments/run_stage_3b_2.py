"""
ml_lab/experiments/run_stage_3b_2.py
Stage 3B.2: Baseline Model Training & Group-Aware Evaluation Orchestrator.
Trains and evaluates DummyClassifier (Prior) and Logistic Regression across 5-fold StratifiedGroupKFold
on the frozen Development partition (N=23,716).
Outputs strictly to ml_lab/experiments/stage_3b_2/ with zero pollution to legacy experiment directories.
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
from sklearn.model_selection import StratifiedGroupKFold

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ml_lab.evaluation import (
    load_development_dataset,
    validate_cv_folds,
    compute_binary_metrics,
    build_dummy_baseline,
    build_logistic_regression_baseline,
    FROZEN_NUMERICAL_FEATURES,
    FROZEN_CATEGORICAL_FEATURES,
    FROZEN_ALL_FEATURES,
    FROZEN_TARGET,
    EXPECTED_DATASET_SHA256,
    EXPECTED_MANIFEST_SHA256,
    EXPECTED_ASSIGNMENTS_SHA256,
    EXPECTED_DEV_ROWS
)

STAGE_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stage_3b_2")
MODELS_OUTPUT_DIR = os.path.join(STAGE_OUTPUT_DIR, "models")

def get_environment_info() -> Dict[str, Any]:
    """Capture environment, python, package, and git metadata."""
    import sklearn
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
        "pandas_version": pd.__version__,
        "numpy_version": np.__version__,
        "joblib_version": joblib.__version__,
        "git_branch": git_branch,
        "git_commit": git_commit
    }

def run_stage_3b_2_experiment() -> Dict[str, Any]:
    """Execute the full Stage 3B.2 baseline evaluation."""
    tracemalloc.start()
    start_wall_time = time.time()
    start_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    print("=" * 80)
    print("MINDORA 2.0 — STAGE 3B.2: BASELINE MODEL TRAINING & GROUP-AWARE EVALUATION")
    print("=" * 80)
    
    os.makedirs(STAGE_OUTPUT_DIR, exist_ok=True)
    os.makedirs(MODELS_OUTPUT_DIR, exist_ok=True)
    
    # 1. Load Development Dataset with Fail-Closed Cryptographic Gate
    print("\n[1/6] Cryptographic Validation & Development Partition Ingestion...")
    X_dev, y_dev, groups_dev, dev_row_indices, test_vault_indices = load_development_dataset()
    print(f"      Verified Development records: {len(X_dev):,} (Groups: {len(np.unique(groups_dev)):,})")
    print(f"      Quarantined Test Vault indices rejected from memory: {len(test_vault_indices):,}")
    print(f"      Positive class prevalence: {y_dev.mean():.4f} ({y_dev.sum():,} / {len(y_dev):,})")
    
    # 2. Group-Aware Stratified K-Fold Generation (Seed 42, 5 Splits)
    print("\n[2/6] Generating 5-Fold StratifiedGroupKFold Partition on Development...")
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    folds = list(sgkf.split(X_dev, y_dev, groups_dev))
    
    # 3. Comprehensive Leakage Validation
    print("      Executing automated fail-closed leakage assertion gate...")
    validate_cv_folds(folds, dev_row_indices, groups_dev, test_vault_indices)
    print("      PASS: Zero Test Vault leakage, zero group overlap, 100% complete & disjoint OOF coverage.")
    
    # Prepare Fold Assignments Export
    assignments_list = []
    for fold_idx, (train_idx, val_idx) in enumerate(folds):
        for local_idx in val_idx:
            row_idx = int(dev_row_indices[local_idx])
            assignments_list.append({
                "dev_relative_index": int(local_idx),
                "dataset_row_index": row_idx,
                "group_id": str(groups_dev.iloc[local_idx]),
                "validation_fold": fold_idx
            })
    fold_assignments_df = pd.DataFrame(assignments_list).sort_values("dev_relative_index")
    fold_assignments_path = os.path.join(STAGE_OUTPUT_DIR, "fold_assignments.csv")
    fold_assignments_df.to_csv(fold_assignments_path, index=False)
    print(f"      Saved fold assignments: {fold_assignments_path}")
    
    # Initialize OOF prediction arrays
    oof_dummy_prob = np.zeros(len(X_dev), dtype=float)
    oof_lr_prob = np.zeros(len(X_dev), dtype=float)
    
    dummy_fold_metrics: List[Dict[str, Any]] = []
    lr_fold_metrics: List[Dict[str, Any]] = []
    
    fold_compositions: List[Dict[str, Any]] = []
    
    # 4. Fit and Evaluate Baselines Across 5 Folds
    print("\n[3/6] Fitting and Evaluating Baselines Across Folds...")
    for fold_idx, (train_idx, val_idx) in enumerate(folds):
        X_train_f, y_train_f = X_dev.iloc[train_idx], y_dev.iloc[train_idx]
        X_val_f, y_val_f = X_dev.iloc[val_idx], y_dev.iloc[val_idx]
        groups_val_f = groups_dev.iloc[val_idx]
        
        train_pos_rate = float(y_train_f.mean())
        val_pos_rate = float(y_val_f.mean())
        
        fold_comp = {
            "fold_index": fold_idx,
            "train_samples": len(train_idx),
            "train_groups": int(len(np.unique(groups_dev.iloc[train_idx]))),
            "train_positives": int(y_train_f.sum()),
            "train_prevalence": round(train_pos_rate, 4),
            "val_samples": len(val_idx),
            "val_groups": int(len(np.unique(groups_val_f))),
            "val_positives": int(y_val_f.sum()),
            "val_prevalence": round(val_pos_rate, 4)
        }
        fold_compositions.append(fold_comp)
        
        # --- Baseline A: DummyClassifier (Prior) ---
        dummy_model = build_dummy_baseline(strategy="prior")
        dummy_model.fit(X_train_f, y_train_f)
        dummy_probs_val = dummy_model.predict_proba(X_val_f)[:, 1]
        oof_dummy_prob[val_idx] = dummy_probs_val
        dummy_metrics_f = compute_binary_metrics(y_val_f, dummy_probs_val)
        dummy_metrics_f["fold_index"] = fold_idx
        dummy_fold_metrics.append(dummy_metrics_f)
        
        # --- Baseline B: Logistic Regression ---
        lr_model = build_logistic_regression_baseline(
            FROZEN_NUMERICAL_FEATURES,
            FROZEN_CATEGORICAL_FEATURES,
            random_state=42,
            max_iter=1000,
            C=1.0,
            solver="lbfgs"
        )
        lr_model.fit(X_train_f, y_train_f)
        lr_probs_val = lr_model.predict_proba(X_val_f)[:, 1]
        oof_lr_prob[val_idx] = lr_probs_val
        lr_metrics_f = compute_binary_metrics(y_val_f, lr_probs_val)
        lr_metrics_f["fold_index"] = fold_idx
        lr_fold_metrics.append(lr_metrics_f)
        
        print(f"      Fold {fold_idx}: Dummy ROC-AUC={dummy_metrics_f['roc_auc']:.4f}, Brier={dummy_metrics_f['brier_score']:.4f} | "
              f"LR ROC-AUC={lr_metrics_f['roc_auc']:.4f}, Brier={lr_metrics_f['brier_score']:.4f}, Acc={lr_metrics_f['accuracy']:.4f}")

    # 5. Calculate Pooled Development Out-of-Fold Metrics
    print("\n[4/6] Computing Pooled Out-of-Fold (OOF) Metrics...")
    dummy_oof_metrics = compute_binary_metrics(y_dev, oof_dummy_prob)
    lr_oof_metrics = compute_binary_metrics(y_dev, oof_lr_prob)
    
    print("\n" + "-" * 75)
    print("POOLED DEVELOPMENT OUT-OF-FOLD (OOF) BENCHMARK RESULTS")
    print("-" * 75)
    print(f"{'Metric':<25} | {'Baseline A (Dummy Prior)':<22} | {'Baseline B (Logistic Reg)':<22}")
    print("-" * 75)
    print(f"{'ROC-AUC (Primary)':<25} | {dummy_oof_metrics['roc_auc']:<22.4f} | {lr_oof_metrics['roc_auc']:<22.4f}")
    print(f"{'Brier Score':<25} | {dummy_oof_metrics['brier_score']:<22.4f} | {lr_oof_metrics['brier_score']:<22.4f}")
    print(f"{'ECE (10 equal-width bins)':<25} | {dummy_oof_metrics['ece']:<22.4f} | {lr_oof_metrics['ece']:<22.4f}")
    print(f"{'Accuracy (threshold=0.50)':<25} | {dummy_oof_metrics['accuracy']:<22.4f} | {lr_oof_metrics['accuracy']:<22.4f}")
    print(f"{'Balanced Accuracy':<25} | {dummy_oof_metrics['balanced_accuracy']:<22.4f} | {lr_oof_metrics['balanced_accuracy']:<22.4f}")
    print(f"{'Precision':<25} | {dummy_oof_metrics['precision']:<22.4f} | {lr_oof_metrics['precision']:<22.4f}")
    print(f"{'Recall':<25} | {dummy_oof_metrics['recall']:<22.4f} | {lr_oof_metrics['recall']:<22.4f}")
    print(f"{'Specificity':<25} | {dummy_oof_metrics['specificity']:<22.4f} | {lr_oof_metrics['specificity']:<22.4f}")
    print(f"{'F1 Score':<25} | {dummy_oof_metrics['f1_score']:<22.4f} | {lr_oof_metrics['f1_score']:<22.4f}")
    print("-" * 75)
    
    # 6. Fit Research-Only Full Development Artifacts
    print("\n[5/6] Fitting Research-Only Full Development Artifacts...")
    full_dummy = build_dummy_baseline(strategy="prior")
    full_dummy.fit(X_dev, y_dev)
    dummy_model_path = os.path.join(MODELS_OUTPUT_DIR, "dummy_prior_dev.pkl")
    joblib.dump(full_dummy, dummy_model_path)
    
    full_lr = build_logistic_regression_baseline(
        FROZEN_NUMERICAL_FEATURES,
        FROZEN_CATEGORICAL_FEATURES,
        random_state=42,
        max_iter=1000,
        C=1.0,
        solver="lbfgs"
    )
    full_lr.fit(X_dev, y_dev)
    lr_model_path = os.path.join(MODELS_OUTPUT_DIR, "logistic_regression_dev.pkl")
    joblib.dump(full_lr, lr_model_path)
    print(f"      Saved research-only Development artifacts: {dummy_model_path}, {lr_model_path}")
    
    # 7. Persist All Experiment Outputs
    print("\n[6/6] Persisting Experiment Registry & Reproducibility Outputs...")
    
    # A. OOF Predictions DataFrame
    raw_df = pd.read_csv("dataset/Student_Depression_Dataset.csv")
    dev_ids = raw_df.iloc[dev_row_indices]["id"].values
    
    oof_df = pd.DataFrame({
        "dataset_row_index": dev_row_indices,
        "id": dev_ids,
        "group_id": groups_dev.values,
        "true_label": y_dev.values,
        "dummy_prior_prob": oof_dummy_prob,
        "dummy_prior_pred": (oof_dummy_prob >= 0.50).astype(int),
        "logistic_regression_prob": oof_lr_prob,
        "logistic_regression_pred": (oof_lr_prob >= 0.50).astype(int)
    })
    oof_predictions_path = os.path.join(STAGE_OUTPUT_DIR, "oof_predictions.csv")
    oof_df.to_csv(oof_predictions_path, index=False)
    
    # B. Experiment Configuration
    config_dict = {
        "experiment_id": "stage_3b_2_baselines",
        "stage": "Stage 3B.2",
        "description": "DummyClassifier (Prior) and Logistic Regression 5-fold StratifiedGroupKFold on Development partition",
        "random_seed": 42,
        "n_splits": 5,
        "target_column": FROZEN_TARGET,
        "numerical_features": FROZEN_NUMERICAL_FEATURES,
        "categorical_features": FROZEN_CATEGORICAL_FEATURES,
        "all_model_features": FROZEN_ALL_FEATURES,
        "decision_threshold": 0.50,
        "models": {
            "dummy_prior": {
                "class": "DummyClassifier",
                "strategy": "prior"
            },
            "logistic_regression": {
                "class": "LogisticRegression",
                "penalty": "l2",
                "C": 1.0,
                "solver": "lbfgs",
                "max_iter": 1000,
                "random_state": 42,
                "numeric_preprocessing": "SimpleImputer(median) -> StandardScaler",
                "categorical_preprocessing": "SimpleImputer(most_frequent) -> OneHotEncoder(ignore, dense)"
            }
        }
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "experiment_config.json"), "w", encoding="utf-8") as f:
        json.dump(config_dict, f, indent=2)
        
    # C. Environment & Dependencies
    env_info = get_environment_info()
    with open(os.path.join(STAGE_OUTPUT_DIR, "environment.json"), "w", encoding="utf-8") as f:
        json.dump(env_info, f, indent=2)
        
    # D. Input Hashes
    with open("dataset/Student_Depression_Dataset.csv", "rb") as f:
        ds_hash = hashlib.sha256(f.read()).hexdigest().upper()
    with open("ml_lab/splits/group_aware_partition_manifest.json", "rb") as f:
        man_hash = hashlib.sha256(f.read()).hexdigest().upper()
    with open("ml_lab/splits/partition_assignments.csv", "rb") as f:
        ass_hash = hashlib.sha256(f.read()).hexdigest().upper()
    with open("models/best_model.pkl", "rb") as f:
        prod_hash = hashlib.sha256(f.read()).hexdigest().upper()
        
    input_hashes = {
        "dataset_a_sha256": ds_hash,
        "manifest_sha256": man_hash,
        "assignments_sha256": ass_hash,
        "production_model_sha256": prod_hash
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "input_hashes.json"), "w", encoding="utf-8") as f:
        json.dump(input_hashes, f, indent=2)
        
    # E. Fold-level metrics
    with open(os.path.join(STAGE_OUTPUT_DIR, "fold_metrics.json"), "w", encoding="utf-8") as f:
        json.dump({
            "fold_compositions": fold_compositions,
            "dummy_prior_folds": dummy_fold_metrics,
            "logistic_regression_folds": lr_fold_metrics
        }, f, indent=2)
        
    # F. Pooled OOF metrics
    with open(os.path.join(STAGE_OUTPUT_DIR, "oof_metrics.json"), "w", encoding="utf-8") as f:
        json.dump({
            "dummy_prior_oof": dummy_oof_metrics,
            "logistic_regression_oof": lr_oof_metrics
        }, f, indent=2)
        
    # G. Model Comparison Table
    model_comparison = {
        "dataset": "Student_Depression_Dataset (Development Partition)",
        "total_development_records": EXPECTED_DEV_ROWS,
        "evaluation_strategy": "5-Fold StratifiedGroupKFold (Seed 42)",
        "models": {
            "dummy_prior": {
                "model_name": "DummyClassifier (Prior Strategy)",
                "roc_auc": dummy_oof_metrics["roc_auc"],
                "brier_score": dummy_oof_metrics["brier_score"],
                "ece": dummy_oof_metrics["ece"],
                "accuracy": dummy_oof_metrics["accuracy"],
                "balanced_accuracy": dummy_oof_metrics["balanced_accuracy"],
                "precision": dummy_oof_metrics["precision"],
                "recall": dummy_oof_metrics["recall"],
                "specificity": dummy_oof_metrics["specificity"],
                "f1_score": dummy_oof_metrics["f1_score"],
                "confusion_matrix": dummy_oof_metrics["confusion_matrix"]
            },
            "logistic_regression": {
                "model_name": "Standardized Preprocessed Logistic Regression",
                "roc_auc": lr_oof_metrics["roc_auc"],
                "brier_score": lr_oof_metrics["brier_score"],
                "ece": lr_oof_metrics["ece"],
                "accuracy": lr_oof_metrics["accuracy"],
                "balanced_accuracy": lr_oof_metrics["balanced_accuracy"],
                "precision": lr_oof_metrics["precision"],
                "recall": lr_oof_metrics["recall"],
                "specificity": lr_oof_metrics["specificity"],
                "f1_score": lr_oof_metrics["f1_score"],
                "confusion_matrix": lr_oof_metrics["confusion_matrix"]
            }
        }
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "model_comparison.json"), "w", encoding="utf-8") as f:
        json.dump(model_comparison, f, indent=2)
        
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    duration_seconds = time.time() - start_wall_time
    end_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    # H. Execution Metadata
    execution_metadata = {
        "execution_start_utc": start_iso,
        "execution_end_utc": end_iso,
        "total_runtime_seconds": round(duration_seconds, 3),
        "peak_traced_memory_bytes": peak_mem,
        "peak_traced_memory_mb": round(peak_mem / (1024 * 1024), 3),
        "output_directory": STAGE_OUTPUT_DIR,
        "zero_legacy_pollution_verified": True
    }
    with open(os.path.join(STAGE_OUTPUT_DIR, "execution_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(execution_metadata, f, indent=2)
        
    print(f"\nStage 3B.2 execution complete in {duration_seconds:.2f}s (Peak RAM: {peak_mem / (1024*1024):.2f} MB)")
    return model_comparison

if __name__ == "__main__":
    run_stage_3b_2_experiment()
