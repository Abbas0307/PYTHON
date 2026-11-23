"""
ml_lab/experiments/run_stage_3b_4.py
Stage 3B.4: Group-Aware Probabilistic Calibration Research Orchestrator.
Evaluates:
  Base Models:
    1. Logistic Regression
    2. Random Forest
    3. XGBoost
  Calibration Regimes:
    1. Uncalibrated
    2. Sigmoid (Platt Scaling)
    3. Isotonic Regression (PAVA)
  Architectures:
    - Architecture A: Primary Research Benchmark (Inner 5-fold ensemble averaging)
    - Architecture B: Secondary Research Comparator (Pooled inner-OOF single calibrator + full outer model)

Mandatory Safeguards:
  - Dataset A Development partition only (N=23,716).
  - Frozen outer 5-fold StratifiedGroupKFold reused from Stage 3B.2/3B.3.
  - Test Vault (N=4,185) remains UNTOUCHED during this experiment.
  - Zero access to Dataset B.
  - Zero modification to production baseline model.
  - Predeclared decision threshold tau = 0.50 (no optimization).
  - Exact integer confusion matrix reporting for pooled OOF and all 5 folds.
  - Sample standard deviation (ddof=1) for fold variability.
  - Complete isotonic empirical diagnostics (tie rate, plateau length, delta ROC-AUC).
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
from typing import Dict, Any, List, Tuple
from scipy.stats import ks_2samp
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.calibration import _SigmoidCalibration
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import log_loss

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

STAGE_OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stage_3b_4")
MODELS_OUTPUT_DIR = os.path.join(STAGE_OUTPUT_DIR, "models")
HISTORICAL_FOLDS_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "stage_3b_2", "fold_assignments.csv"
)
SPEC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stage_3b_4_calibration_spec.json")


def get_environment_info() -> Dict[str, Any]:
    """Capture environment, python, package, and git metadata."""
    import sklearn
    import xgboost
    import scipy
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
        "scipy_version": scipy.__version__,
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


def compute_isotonic_diagnostics(
    raw_probs: np.ndarray,
    cal_probs: np.ndarray,
    n_cal_samples: int,
    pos_cal_samples: int,
    neg_cal_samples: int,
    raw_auc: float,
    cal_auc: float
) -> Dict[str, Any]:
    """Compute comprehensive empirical diagnostics for isotonic regression."""
    unique_raw = len(np.unique(raw_probs))
    unique_cal, counts = np.unique(cal_probs, return_counts=True)
    n_unique_cal = len(unique_cal)
    
    # Tie rate: percentage of samples that share a calibrated score with at least one other sample
    tied_samples_count = int(np.sum(counts[counts > 1]))
    tie_rate = float(tied_samples_count / len(cal_probs)) if len(cal_probs) > 0 else 0.0
    max_plateau = int(np.max(counts)) if len(counts) > 0 else 0
    
    delta_auc = float(cal_auc - raw_auc) if (raw_auc is not None and cal_auc is not None) else 0.0
    
    return {
        "calibration_sample_size": int(n_cal_samples),
        "calibration_class_counts": {
            "positive": int(pos_cal_samples),
            "negative": int(neg_cal_samples)
        },
        "unique_raw_scores_count": int(unique_raw),
        "unique_calibrated_scores_count": int(n_unique_cal),
        "tied_samples_count": tied_samples_count,
        "probability_tie_rate": round(tie_rate, 6),
        "maximum_plateau_length": max_plateau,
        "delta_roc_auc_vs_uncalibrated": round(delta_auc, 6)
    }


def run_stage_3b_4() -> None:
    print("=" * 80)
    print("MINDORA 2.0 — STAGE 3B.4 CALIBRATION RESEARCH EXECUTION")
    print("=" * 80)
    
    start_time_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    t_global_start = time.perf_counter()
    os.makedirs(MODELS_OUTPUT_DIR, exist_ok=True)
    
    # 1. Ingestion via hardened Development-only loader
    print("\n[1/7] Loading Development Partition via Hardened Pre-Ingestion Loader...")
    X_dev, y_dev, groups_dev, dev_row_indices, test_vault_indices = load_development_dataset()
    
    assert len(X_dev) == EXPECTED_DEV_ROWS, f"Expected {EXPECTED_DEV_ROWS}, got {len(X_dev)}"
    assert len(y_dev) == EXPECTED_DEV_ROWS
    assert len(groups_dev) == EXPECTED_DEV_ROWS
    assert len(test_vault_indices) == 4185
    
    pos_count = int(y_dev.sum())
    neg_count = len(y_dev) - pos_count
    assert pos_count == 13885, f"Expected 13885 positive, got {pos_count}"
    assert neg_count == 9831, f"Expected 9831 negative, got {neg_count}"
    print(f"      Verified Development records: {len(X_dev):,}")
    print(f"      Target distribution: {pos_count:,} positive ({pos_count/len(y_dev):.4%}), {neg_count:,} negative")
    print(f"      Unique groups: {groups_dev.nunique():,}")
    print(f"      Test Vault status: UNTOUCHED DURING THIS EXPERIMENT (4,185 rows unread)")
    
    # 2. Reusing exact frozen outer folds from Stage 3B.2/3B.3
    print("\n[2/7] Loading & Verifying Reused Outer Cross-Validation Folds...")
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
        print(f"      Outer Fold {k}: Train={len(train_idx):,} rows, Val={len(val_idx):,} rows")
        
    validate_cv_folds(folds, dev_row_indices, groups_dev, test_vault_indices)
    print("      PASSED: Zero Test Vault leakage & zero train/val group overlap verified across all folds.")

    # 3. Model Pipeline Builders Setup
    model_builders = {
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

    cal_methods = ["uncalibrated", "sigmoid", "isotonic"]
    architectures = ["arch_a", "arch_b"]

    # Initialize prediction matrices: pipeline_key -> array of size len(X_dev)
    all_pipeline_keys = [
        f"{arch}_{m_key}_{cal}"
        for arch in architectures
        for m_key in model_builders
        for cal in cal_methods
    ]

    oof_predictions = {pkey: np.zeros(len(X_dev), dtype=float) for pkey in all_pipeline_keys}
    fold_metrics_records = {pkey: [] for pkey in all_pipeline_keys}
    timing_records = {pkey: [] for pkey in all_pipeline_keys}
    isotonic_diag_records = {
        pkey: [] for pkey in all_pipeline_keys if "isotonic" in pkey
    }
    
    # Distribution shift records for Architecture B
    arch_b_dist_shift_records = {m_key: [] for m_key in model_builders}

    # Storage for fold-fitted artifacts
    fold_artifacts = []

    # 4. Cross-Validation Execution Loop
    print("\n[3/7] Executing Nested Group-Aware Cross-Validation (90 Model Fits Across 5 Folds)...")
    
    for fold_idx, (train_idx, val_idx) in enumerate(folds):
        print(f"\n========================================================")
        print(f"=== OUTER FOLD {fold_idx + 1}/{n_splits} (Train={len(train_idx):,}, Val={len(val_idx):,}) ===")
        print(f"========================================================")
        
        X_train_df = X_dev.iloc[train_idx].copy()
        y_train_s = y_dev.iloc[train_idx].copy()
        groups_train_s = groups_dev.iloc[train_idx].copy()
        
        X_val_df = X_dev.iloc[val_idx].copy()
        y_val_arr = y_dev.iloc[val_idx].values
        
        # Build 5 inner group-aware splits on outer train partition
        inner_sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42 + fold_idx)
        inner_splits = list(inner_sgkf.split(X_train_df, y_train_s, groups_train_s))
        assert len(inner_splits) == 5
        
        # Verify zero inner group leakage
        for in_tr_i, in_val_i in inner_splits:
            tr_g = set(groups_train_s.iloc[in_tr_i])
            val_g = set(groups_train_s.iloc[in_val_i])
            assert len(tr_g.intersection(val_g)) == 0, f"Inner group leakage in fold {fold_idx}!"

        fold_models_dict = {
            "fold": fold_idx,
            "architecture_a": {},
            "architecture_b": {}
        }

        for m_key, m_info in model_builders.items():
            print(f"\n  >>> Model: {m_info['name']} <<<")
            
            # -----------------------------------------------------------------
            # ARCHITECTURE A: 5 Inner Models + 5 Calibrator Pairs
            # -----------------------------------------------------------------
            print(f"    [Arch A] Fitting 5 Inner Base Models & Inner Calibrators...")
            tracemalloc.start()
            t0_arch_a = time.perf_counter()
            
            inner_models = []
            inner_sigs = []
            inner_isos = []
            inner_oof_probs = np.zeros(len(X_train_df), dtype=float)
            inner_cal_sizes = []
            
            for inner_j, (in_tr_idx, in_val_idx) in enumerate(inner_splits):
                X_in_tr = X_train_df.iloc[in_tr_idx]
                y_in_tr = y_train_s.iloc[in_tr_idx].values
                X_in_val = X_train_df.iloc[in_val_idx]
                y_in_val = y_train_s.iloc[in_val_idx].values
                
                # Fit inner base model
                m_inner = m_info["builder"]()
                m_inner.fit(X_in_tr, y_in_tr)
                
                # Predict on inner held-out fold
                p_in_val = m_inner.predict_proba(X_in_val)[:, 1]
                inner_oof_probs[in_val_idx] = p_in_val
                
                # Fit inner calibrators
                sig_inner = _SigmoidCalibration().fit(p_in_val, y_in_val)
                iso_inner = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0).fit(p_in_val, y_in_val)
                
                inner_models.append(m_inner)
                inner_sigs.append(sig_inner)
                inner_isos.append(iso_inner)
                
                inner_cal_sizes.append({
                    "inner_fold": inner_j,
                    "n_cal": len(y_in_val),
                    "pos": int(np.sum(y_in_val == 1)),
                    "neg": int(np.sum(y_in_val == 0))
                })
                
            t1_arch_a_train = time.perf_counter()
            _, peak_arch_a_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            
            # Predict on Outer Validation Set (N ~ 4,743)
            t0_arch_a_infer = time.perf_counter()
            # 5 forward passes
            inner_raw_val_probs = [m.predict_proba(X_val_df)[:, 1] for m in inner_models]
            
            # Uncalibrated: average of inner raw probabilities
            p_val_a_uncal = np.mean(inner_raw_val_probs, axis=0)
            
            # Sigmoid: average of 5 Sigmoid calibrated predictions
            p_val_a_sig = np.mean(
                [inner_sigs[j].predict(inner_raw_val_probs[j]) for j in range(5)],
                axis=0
            )
            
            # Isotonic: average of 5 Isotonic calibrated predictions
            p_val_a_iso = np.mean(
                [inner_isos[j].predict(inner_raw_val_probs[j]) for j in range(5)],
                axis=0
            )
            t1_arch_a_infer = time.perf_counter()
            
            arch_a_train_time = t1_arch_a_train - t0_arch_a
            arch_a_infer_time = t1_arch_a_infer - t0_arch_a_infer
            arch_a_mem_mb = peak_arch_a_mem / (1024 * 1024)

            # -----------------------------------------------------------------
            # ARCHITECTURE B: Pooled Inner-OOF Calibrator + Full Outer Model
            # -----------------------------------------------------------------
            print(f"    [Arch B] Fitting Pooled Calibrator & Full Outer Base Model...")
            tracemalloc.start()
            t0_arch_b = time.perf_counter()
            
            # Full outer base model on 100% outer train (N=18,973)
            m_full = m_info["builder"]()
            m_full.fit(X_train_df, y_train_s.values)
            
            # Single calibrators fitted on pooled inner OOF (18,973 instances)
            sig_pool = _SigmoidCalibration().fit(inner_oof_probs, y_train_s.values)
            iso_pool = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0).fit(inner_oof_probs, y_train_s.values)
            
            t1_arch_b_train = time.perf_counter()
            _, peak_arch_b_mem = tracemalloc.get_traced_memory()
            tracemalloc.stop()
            
            # Inference on Outer Validation Set
            t0_arch_b_infer = time.perf_counter()
            p_val_full_raw = m_full.predict_proba(X_val_df)[:, 1]
            p_val_b_uncal = p_val_full_raw
            p_val_b_sig = sig_pool.predict(p_val_full_raw)
            p_val_b_iso = iso_pool.predict(p_val_full_raw)
            t1_arch_b_infer = time.perf_counter()
            
            arch_b_train_time = t1_arch_b_train - t0_arch_b
            arch_b_infer_time = t1_arch_b_infer - t0_arch_b_infer
            arch_b_mem_mb = peak_arch_b_mem / (1024 * 1024)
            
            # Score-distribution shift analysis between inner OOF (N=15,178 models) and full outer train scores
            p_train_full_raw = m_full.predict_proba(X_train_df)[:, 1]
            ks_stat, ks_pval = ks_2samp(inner_oof_probs, p_train_full_raw)
            
            dist_shift_info = {
                "fold": fold_idx,
                "inner_oof_mean": float(np.mean(inner_oof_probs)),
                "inner_oof_std": float(np.std(inner_oof_probs, ddof=1)),
                "inner_oof_q10": float(np.percentile(inner_oof_probs, 10)),
                "inner_oof_q50": float(np.median(inner_oof_probs)),
                "inner_oof_q90": float(np.percentile(inner_oof_probs, 90)),
                "full_train_mean": float(np.mean(p_train_full_raw)),
                "full_train_std": float(np.std(p_train_full_raw, ddof=1)),
                "full_train_q10": float(np.percentile(p_train_full_raw, 10)),
                "full_train_q50": float(np.median(p_train_full_raw)),
                "full_train_q90": float(np.percentile(p_train_full_raw, 90)),
                "ks_statistic": float(ks_stat),
                "ks_pvalue": float(ks_pval)
            }
            arch_b_dist_shift_records[m_key].append(dist_shift_info)

            # Store fold models
            fold_models_dict["architecture_a"][m_key] = {
                "inner_models": inner_models,
                "inner_sigmoids": inner_sigs,
                "inner_isotonics": inner_isos,
                "inner_cal_sizes": inner_cal_sizes
            }
            fold_models_dict["architecture_b"][m_key] = {
                "full_model": m_full,
                "sigmoid_calibrator": sig_pool,
                "isotonic_calibrator": iso_pool,
                "cal_sample_size": len(y_train_s)
            }

            # Predictions mapping for fold
            pred_map = {
                f"arch_a_{m_key}_uncalibrated": (p_val_a_uncal, arch_a_train_time, arch_a_infer_time, arch_a_mem_mb),
                f"arch_a_{m_key}_sigmoid": (p_val_a_sig, arch_a_train_time, arch_a_infer_time, arch_a_mem_mb),
                f"arch_a_{m_key}_isotonic": (p_val_a_iso, arch_a_train_time, arch_a_infer_time, arch_a_mem_mb),
                f"arch_b_{m_key}_uncalibrated": (p_val_b_uncal, arch_b_train_time, arch_b_infer_time, arch_b_mem_mb),
                f"arch_b_{m_key}_sigmoid": (p_val_b_sig, arch_b_train_time, arch_b_infer_time, arch_b_mem_mb),
                f"arch_b_{m_key}_isotonic": (p_val_b_iso, arch_b_train_time, arch_b_infer_time, arch_b_mem_mb),
            }

            for pkey, (probs_val, t_train, t_infer, mem_mb) in pred_map.items():
                oof_predictions[pkey][val_idx] = probs_val
                
                # Compute fold metrics
                m_fold = compute_binary_metrics(y_val_arr, probs_val, threshold=0.50)
                
                fold_metrics_records[pkey].append({
                    "fold": fold_idx,
                    "n_val": len(val_idx),
                    "metrics": m_fold
                })
                timing_records[pkey].append({
                    "fold": fold_idx,
                    "train_duration_seconds": t_train,
                    "infer_duration_seconds": t_infer,
                    "peak_train_memory_mb": mem_mb
                })
                
                # If isotonic, record empirical diagnostics
                if "isotonic" in pkey:
                    if "arch_a" in pkey:
                        n_cal_s = int(np.mean([ics["n_cal"] for ics in inner_cal_sizes]))
                        pos_cal_s = int(np.mean([ics["pos"] for ics in inner_cal_sizes]))
                        neg_cal_s = int(np.mean([ics["neg"] for ics in inner_cal_sizes]))
                        raw_probs_ref = p_val_a_uncal
                        raw_auc_ref = compute_binary_metrics(y_val_arr, raw_probs_ref, threshold=0.50)["roc_auc"]
                    else:
                        n_cal_s = len(y_train_s)
                        pos_cal_s = int(np.sum(y_train_s == 1))
                        neg_cal_s = int(np.sum(y_train_s == 0))
                        raw_probs_ref = p_val_b_uncal
                        raw_auc_ref = compute_binary_metrics(y_val_arr, raw_probs_ref, threshold=0.50)["roc_auc"]
                        
                    iso_diag = compute_isotonic_diagnostics(
                        raw_probs=raw_probs_ref,
                        cal_probs=probs_val,
                        n_cal_samples=n_cal_s,
                        pos_cal_samples=pos_cal_s,
                        neg_cal_samples=neg_cal_s,
                        raw_auc=raw_auc_ref,
                        cal_auc=m_fold["roc_auc"]
                    )
                    iso_diag["fold"] = fold_idx
                    isotonic_diag_records[pkey].append(iso_diag)

            print(f"      Arch A [Uncal]: ROC-AUC={fold_metrics_records[f'arch_a_{m_key}_uncalibrated'][-1]['metrics']['roc_auc']:.4f}, "
                  f"Brier={fold_metrics_records[f'arch_a_{m_key}_uncalibrated'][-1]['metrics']['brier_score']:.4f}, "
                  f"ECE={fold_metrics_records[f'arch_a_{m_key}_uncalibrated'][-1]['metrics']['ece']:.4f}")
            print(f"      Arch A [Sig]:   ROC-AUC={fold_metrics_records[f'arch_a_{m_key}_sigmoid'][-1]['metrics']['roc_auc']:.4f}, "
                  f"Brier={fold_metrics_records[f'arch_a_{m_key}_sigmoid'][-1]['metrics']['brier_score']:.4f}, "
                  f"ECE={fold_metrics_records[f'arch_a_{m_key}_sigmoid'][-1]['metrics']['ece']:.4f}")
            print(f"      Arch A [Iso]:   ROC-AUC={fold_metrics_records[f'arch_a_{m_key}_isotonic'][-1]['metrics']['roc_auc']:.4f}, "
                  f"Brier={fold_metrics_records[f'arch_a_{m_key}_isotonic'][-1]['metrics']['brier_score']:.4f}, "
                  f"ECE={fold_metrics_records[f'arch_a_{m_key}_isotonic'][-1]['metrics']['ece']:.4f}")
            print(f"      Arch B [Sig]:   ROC-AUC={fold_metrics_records[f'arch_b_{m_key}_sigmoid'][-1]['metrics']['roc_auc']:.4f}, "
                  f"Brier={fold_metrics_records[f'arch_b_{m_key}_sigmoid'][-1]['metrics']['brier_score']:.4f}, "
                  f"ECE={fold_metrics_records[f'arch_b_{m_key}_sigmoid'][-1]['metrics']['ece']:.4f}")
            print(f"      Arch B [Iso]:   ROC-AUC={fold_metrics_records[f'arch_b_{m_key}_isotonic'][-1]['metrics']['roc_auc']:.4f}, "
                  f"Brier={fold_metrics_records[f'arch_b_{m_key}_isotonic'][-1]['metrics']['brier_score']:.4f}, "
                  f"ECE={fold_metrics_records[f'arch_b_{m_key}_isotonic'][-1]['metrics']['ece']:.4f}")

        # Save fold models artifact to disk
        fold_artifact_path = os.path.join(MODELS_OUTPUT_DIR, f"calibration_models_fold_{fold_idx}.joblib")
        joblib.dump(fold_models_dict, fold_artifact_path, compress=3)
        fold_artifacts.append(fold_artifact_path)
        print(f"    Saved fold {fold_idx} model artifact: {fold_artifact_path}")

    # 5. Compute Pooled Out-of-Fold (OOF) Metrics & Fold Distributions (ddof=1)
    print("\n[4/7] Computing Pooled Out-of-Fold Metrics & Fold-Level Variances (ddof=1)...")
    
    pipeline_summaries = {}
    
    for pkey in all_pipeline_keys:
        probs = oof_predictions[pkey]
        pooled_m = compute_binary_metrics(y_dev.values, probs, threshold=0.50)
        
        # Aggregate fold metrics with ddof=1
        f_aucs = [fm["metrics"]["roc_auc"] for fm in fold_metrics_records[pkey]]
        f_briers = [fm["metrics"]["brier_score"] for fm in fold_metrics_records[pkey]]
        f_lls = [fm["metrics"]["log_loss"] for fm in fold_metrics_records[pkey]]
        f_eces = [fm["metrics"]["ece"] for fm in fold_metrics_records[pkey]]
        f_accs = [fm["metrics"]["accuracy"] for fm in fold_metrics_records[pkey]]
        f_bal_accs = [fm["metrics"]["balanced_accuracy"] for fm in fold_metrics_records[pkey]]
        f_precs = [fm["metrics"]["precision"] for fm in fold_metrics_records[pkey]]
        f_recs = [fm["metrics"]["recall"] for fm in fold_metrics_records[pkey]]
        f_specs = [fm["metrics"]["specificity"] for fm in fold_metrics_records[pkey]]
        f_f1s = [fm["metrics"]["f1_score"] for fm in fold_metrics_records[pkey]]
        
        f_train_times = [t["train_duration_seconds"] for t in timing_records[pkey]]
        f_infer_times = [t["infer_duration_seconds"] for t in timing_records[pkey]]
        f_peak_mems = [t["peak_train_memory_mb"] for t in timing_records[pkey]]
        
        fold_summary = {
            "roc_auc": {"mean": round(float(np.mean(f_aucs)), 6), "std": round(float(np.std(f_aucs, ddof=1)), 6)},
            "brier_score": {"mean": round(float(np.mean(f_briers)), 6), "std": round(float(np.std(f_briers, ddof=1)), 6)},
            "log_loss": {"mean": round(float(np.mean(f_lls)), 6), "std": round(float(np.std(f_lls, ddof=1)), 6)},
            "ece": {"mean": round(float(np.mean(f_eces)), 6), "std": round(float(np.std(f_eces, ddof=1)), 6)},
            "accuracy": {"mean": round(float(np.mean(f_accs)), 6), "std": round(float(np.std(f_accs, ddof=1)), 6)},
            "balanced_accuracy": {"mean": round(float(np.mean(f_bal_accs)), 6), "std": round(float(np.std(f_bal_accs, ddof=1)), 6)},
            "precision": {"mean": round(float(np.mean(f_precs)), 6), "std": round(float(np.std(f_precs, ddof=1)), 6)},
            "recall": {"mean": round(float(np.mean(f_recs)), 6), "std": round(float(np.std(f_recs, ddof=1)), 6)},
            "specificity": {"mean": round(float(np.mean(f_specs)), 6), "std": round(float(np.std(f_specs, ddof=1)), 6)},
            "f1_score": {"mean": round(float(np.mean(f_f1s)), 6), "std": round(float(np.std(f_f1s, ddof=1)), 6)},
            "train_duration_seconds": {"mean": round(float(np.mean(f_train_times)), 4), "std": round(float(np.std(f_train_times, ddof=1)), 4), "total": round(float(np.sum(f_train_times)), 4)},
            "infer_duration_seconds": {"mean": round(float(np.mean(f_infer_times)), 4), "std": round(float(np.std(f_infer_times, ddof=1)), 4), "total": round(float(np.sum(f_infer_times)), 4)},
            "peak_train_memory_mb": {"mean": round(float(np.mean(f_peak_mems)), 2), "max": round(float(np.max(f_peak_mems)), 2)}
        }
        
        # Individual outer fold confusion matrices
        fold_cms = [
            {
                "fold": fm["fold"],
                "n_samples": fm["n_val"],
                "confusion_matrix": fm["metrics"]["confusion_matrix"],
                "breakdown": fm["metrics"]["confusion_matrix_breakdown"]
            }
            for fm in fold_metrics_records[pkey]
        ]
        
        # Summary object
        summary_obj = {
            "pipeline_key": pkey,
            "pooled_oof_metrics": pooled_m,
            "fold_summary_ddof1": fold_summary,
            "individual_fold_confusion_matrices": fold_cms,
            "individual_fold_metrics": [
                {
                    "fold": fm["fold"],
                    "metrics": {k: v for k, v in fm["metrics"].items() if k not in ["confusion_matrix", "confusion_matrix_breakdown", "ece_bin_details"]}
                }
                for fm in fold_metrics_records[pkey]
            ]
        }
        
        # Add isotonic diagnostics if applicable
        if pkey in isotonic_diag_records:
            diag_list = isotonic_diag_records[pkey]
            pooled_raw_key = pkey.replace("_isotonic", "_uncalibrated")
            pooled_raw_auc = compute_binary_metrics(y_dev.values, oof_predictions[pooled_raw_key], threshold=0.50)["roc_auc"]
            
            pooled_iso_diag = compute_isotonic_diagnostics(
                raw_probs=oof_predictions[pooled_raw_key],
                cal_probs=oof_predictions[pkey],
                n_cal_samples=int(np.mean([d["calibration_sample_size"] for d in diag_list])),
                pos_cal_samples=int(np.mean([d["calibration_class_counts"]["positive"] for d in diag_list])),
                neg_cal_samples=int(np.mean([d["calibration_class_counts"]["negative"] for d in diag_list])),
                raw_auc=pooled_raw_auc,
                cal_auc=pooled_m["roc_auc"]
            )
            
            summary_obj["isotonic_diagnostics"] = {
                "pooled": pooled_iso_diag,
                "fold_mean_ddof1": {
                    "unique_raw_scores_count": {
                        "mean": round(float(np.mean([d["unique_raw_scores_count"] for d in diag_list])), 2),
                        "std": round(float(np.std([d["unique_raw_scores_count"] for d in diag_list], ddof=1)), 2)
                    },
                    "unique_calibrated_scores_count": {
                        "mean": round(float(np.mean([d["unique_calibrated_scores_count"] for d in diag_list])), 2),
                        "std": round(float(np.std([d["unique_calibrated_scores_count"] for d in diag_list], ddof=1)), 2)
                    },
                    "probability_tie_rate": {
                        "mean": round(float(np.mean([d["probability_tie_rate"] for d in diag_list])), 6),
                        "std": round(float(np.std([d["probability_tie_rate"] for d in diag_list], ddof=1)), 6)
                    },
                    "maximum_plateau_length": {
                        "mean": round(float(np.mean([d["maximum_plateau_length"] for d in diag_list])), 2),
                        "std": round(float(np.std([d["maximum_plateau_length"] for d in diag_list], ddof=1)), 2)
                    },
                    "delta_roc_auc_vs_uncalibrated": {
                        "mean": round(float(np.mean([d["delta_roc_auc_vs_uncalibrated"] for d in diag_list])), 6),
                        "std": round(float(np.std([d["delta_roc_auc_vs_uncalibrated"] for d in diag_list], ddof=1)), 6)
                    }
                },
                "fold_records": diag_list
            }
            
        pipeline_summaries[pkey] = summary_obj

    # 6. Fit & Save Development-Only Reference Research Models
    print("\n[5/7] Serializing Full Development Reference Models...")
    dev_ref_artifacts = {}
    
    # Inner splits for full Development set to build reference Arch A
    dev_inner_sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    dev_inner_splits = list(dev_inner_sgkf.split(X_dev, y_dev, groups_dev))
    
    for m_key, m_info in model_builders.items():
        ref_model_path = os.path.join(MODELS_OUTPUT_DIR, f"{m_key}_dev_reference.joblib")
        
        # Fit 5 sub-models + calibrators for Arch A reference
        arch_a_ref_models = []
        arch_a_ref_sigs = []
        arch_a_ref_isos = []
        dev_inner_oof = np.zeros(len(X_dev), dtype=float)
        
        for d_tr_idx, d_val_idx in dev_inner_splits:
            m_sub = m_info["builder"]()
            m_sub.fit(X_dev.iloc[d_tr_idx], y_dev.iloc[d_tr_idx].values)
            p_sub_val = m_sub.predict_proba(X_dev.iloc[d_val_idx])[:, 1]
            dev_inner_oof[d_val_idx] = p_sub_val
            
            s_sub = _SigmoidCalibration().fit(p_sub_val, y_dev.iloc[d_val_idx].values)
            i_sub = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0).fit(p_sub_val, y_dev.iloc[d_val_idx].values)
            
            arch_a_ref_models.append(m_sub)
            arch_a_ref_sigs.append(s_sub)
            arch_a_ref_isos.append(i_sub)
            
        # Fit Arch B reference: full model + single pooled calibrators
        m_dev_full = m_info["builder"]()
        m_dev_full.fit(X_dev, y_dev.values)
        sig_dev_pool = _SigmoidCalibration().fit(dev_inner_oof, y_dev.values)
        iso_dev_pool = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0).fit(dev_inner_oof, y_dev.values)
        
        ref_obj = {
            "model_key": m_key,
            "architecture_a": {
                "inner_models": arch_a_ref_models,
                "inner_sigmoids": arch_a_ref_sigs,
                "inner_isotonics": arch_a_ref_isos
            },
            "architecture_b": {
                "full_model": m_dev_full,
                "sigmoid_calibrator": sig_dev_pool,
                "isotonic_calibrator": iso_dev_pool
            }
        }
        joblib.dump(ref_obj, ref_model_path, compress=3)
        dev_ref_artifacts[m_key] = ref_model_path
        print(f"      Saved development reference artifact: {ref_model_path}")

    # 7. Persist OOF Predictions, Metrics JSON, and Artifact Inventory
    print("\n[6/7] Persisting Predictions, Comprehensive Metrics JSON & Integrity Manifest...")
    
    # A. OOF Predictions DataFrame
    oof_dict = {
        "dataset_row_index": dev_row_indices,
        "group_id": groups_dev.values,
        "validation_fold": fold_df["validation_fold"].values,
        "true_label": y_dev.values
    }
    for pkey in all_pipeline_keys:
        oof_dict[f"{pkey}_prob"] = oof_predictions[pkey]
        oof_dict[f"{pkey}_pred"] = (oof_predictions[pkey] >= 0.50).astype(int)
        
    oof_predictions_df = pd.DataFrame(oof_dict)
    oof_predictions_path = os.path.join(STAGE_OUTPUT_DIR, "oof_predictions.csv")
    oof_predictions_df.to_csv(oof_predictions_path, index=False)
    print(f"      Saved OOF predictions: {oof_predictions_path} ({len(oof_predictions_df):,} rows)")

    # B. Score-distribution shift summary for Architecture B
    arch_b_shift_summary = {}
    for m_key, shift_list in arch_b_dist_shift_records.items():
        arch_b_shift_summary[m_key] = {
            "ks_statistic": {
                "mean": round(float(np.mean([s["ks_statistic"] for s in shift_list])), 6),
                "std": round(float(np.std([s["ks_statistic"] for s in shift_list], ddof=1)), 6)
            },
            "ks_pvalue": {
                "mean": round(float(np.mean([s["ks_pvalue"] for s in shift_list])), 6),
                "min": round(float(np.min([s["ks_pvalue"] for s in shift_list])), 6)
            },
            "fold_records": shift_list
        }

    # C. Comprehensive Metrics JSON
    end_time_utc = datetime.datetime.now(datetime.timezone.utc).isoformat()
    t_global_total = time.perf_counter() - t_global_start
    
    metrics_payload = {
        "experiment_id": "stage_3b_4_probabilistic_calibration",
        "stage": "Stage 3B.4",
        "spec_version": "1.3.0",
        "execution_timestamps": {
            "start_time_utc": start_time_utc,
            "end_time_utc": end_time_utc,
            "total_execution_wall_seconds": round(t_global_total, 3)
        },
        "environment": get_environment_info(),
        "dataset_governance": {
            "name": "Student_Depression_Dataset.csv",
            "sha256": EXPECTED_DATASET_SHA256,
            "manifest_sha256": EXPECTED_MANIFEST_SHA256,
            "assignments_sha256": EXPECTED_ASSIGNMENTS_SHA256,
            "partition": "Development",
            "total_rows": EXPECTED_DEV_ROWS,
            "positive_rows": pos_count,
            "negative_rows": neg_count,
            "features": FROZEN_ALL_FEATURES,
            "target": FROZEN_TARGET,
            "test_vault_status": "UNTOUCHED_DURING_THIS_EXPERIMENT",
            "test_vault_rows": 4185,
            "dataset_b_access": "ZERO_ACCESS_UNTOUCHED"
        },
        "threshold_policy": {
            "primary_decision_threshold": 0.50,
            "optimization_status": "STRICTLY_PROHIBITED",
            "probability_metrics_decoupled": True
        },
        "confusion_matrix_policy": {
            "pooled_matrix": "Integer count [[TN, FP], [FN, TP]]",
            "individual_fold_matrices": "Exact integer counts for all 5 folds",
            "mean_std_matrix_substituted": False
        },
        "dispersion_measure": "Sample standard deviation (ddof=1)",
        "architecture_roles": {
            "architecture_a": "Primary Research Benchmark (Inner Ensemble Averaging)",
            "architecture_b": "Secondary Research Comparator (Pooled Inner OOF + Full Model)",
            "production_status": "NOT_PRODUCTION_READY"
        },
        "score_distribution_shift_arch_b": arch_b_shift_summary,
        "pipelines": pipeline_summaries
    }

    metrics_json_path = os.path.join(STAGE_OUTPUT_DIR, "stage_3b_4_metrics.json")
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"      Saved comprehensive metrics JSON: {metrics_json_path}")

    # D. Cryptographic Artifact Manifest
    print("\n[7/7] Generating Cryptographic SHA-256 Manifest...")
    manifest_records = []
    
    # Collect all generated artifacts in STAGE_OUTPUT_DIR
    for root, _, files in os.walk(STAGE_OUTPUT_DIR):
        for fname in sorted(files):
            fpath = os.path.join(root, fname)
            relpath = os.path.relpath(fpath, STAGE_OUTPUT_DIR)
            sha = compute_sha256(fpath)
            fsize = os.path.getsize(fpath)
            manifest_records.append({
                "relative_path": relpath.replace("\\", "/"),
                "sha256": sha,
                "bytes": fsize,
                "created_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })

    manifest_json_path = os.path.join(STAGE_OUTPUT_DIR, "artifact_manifest.json")
    with open(manifest_json_path, "w", encoding="utf-8") as f:
        json.dump({
            "stage": "Stage 3B.4",
            "spec_version": "1.3.0",
            "generated_at_utc": end_time_utc,
            "artifact_count": len(manifest_records),
            "artifacts": manifest_records
        }, f, indent=2)
    print(f"      Saved artifact manifest: {manifest_json_path} ({len(manifest_records)} artifacts)")

    print("\n" + "=" * 80)
    print(f"STAGE 3B.4 CALIBRATION EXECUTION COMPLETED SUCCESSFULLY IN {t_global_total:.2f}s!")
    print("=" * 80)


if __name__ == "__main__":
    run_stage_3b_4()
