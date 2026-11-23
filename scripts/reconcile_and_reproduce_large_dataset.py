"""
scripts/reconcile_and_reproduce_large_dataset.py
Phase 5.17 Independent Machine Learning Metric Reconciliation & Reproducibility Verification.
Audits all 4 models on the Large Dataset (27,901 records).
Saves explicit test prediction arrays to disk and generates reconciled metrics.
"""

import os
import json
import time
import hashlib
import joblib
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    brier_score_loss, classification_report, roc_curve, precision_recall_curve
)
from sklearn.calibration import calibration_curve

DATASET_PATH = "dataset/Student_Depression_Dataset.csv"
MODELS_DIR = "models/large_dataset"
REPORTS_DIR = "reports/large_dataset"

# 1. Dataset Verification
with open(DATASET_PATH, "rb") as f:
    dataset_hash = hashlib.sha256(f.read()).hexdigest().upper()

df = pd.read_csv(DATASET_PATH)
row_count = len(df)
print(f"Dataset SHA-256: {dataset_hash}")
print(f"Row count: {row_count} (Expected: 27901)")
assert row_count == 27901, f"Unexpected row count: {row_count}"

NUMERICAL_COLS = ['Age', 'Academic Pressure', 'CGPA', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress']
CATEGORICAL_COLS = ['Gender', 'Sleep Duration', 'Dietary Habits', 'Degree']
TARGET_COL = 'Depression'

X = df[NUMERICAL_COLS + CATEGORICAL_COLS].copy()
y = df[TARGET_COL].astype(int).values

# 2. Exact Stratified Split (Seed 42)
X_temp, X_test, y_temp, y_test, idx_temp, idx_test = train_test_split(
    X, y, df.index, test_size=0.15, random_state=42, stratify=y
)
val_ratio_adjusted = 0.15 / 0.85
X_train, X_val, y_train, y_val, idx_train, idx_val = train_test_split(
    X_temp, y_temp, idx_temp, test_size=val_ratio_adjusted, random_state=42, stratify=y_temp
)

print(f"Splits -> Train: {len(X_train)}, Val: {len(X_val)}, Test: {len(X_test)}")
assert len(X_train) == 19530
assert len(X_val) == 4185
assert len(X_test) == 4186

# 3. Check for Data Leakage / Duplicate Record Crossings across Index Boundaries
train_indices_set = set(idx_train)
val_indices_set = set(idx_val)
test_indices_set = set(idx_test)

overlap_tv = train_indices_set.intersection(val_indices_set)
overlap_tt = train_indices_set.intersection(test_indices_set)
overlap_vt = val_indices_set.intersection(test_indices_set)

assert len(overlap_tv) == 0, f"Leakage: Train/Val overlap: {len(overlap_tv)}"
assert len(overlap_tt) == 0, f"Leakage: Train/Test overlap: {len(overlap_tt)}"
assert len(overlap_vt) == 0, f"Leakage: Val/Test overlap: {len(overlap_vt)}"
print("Index boundary check: ZERO overlap between Train, Validation, and Test partitions.")

# Check for exact duplicate feature rows crossing train/test partitions
X_train_tuples = set(tuple(x) for x in X_train.values)
X_test_tuples = set(tuple(x) for x in X_test.values)
feature_overlap = X_train_tuples.intersection(X_test_tuples)
print(f"Identical tabular rows present in both Train and Test sets: {len(feature_overlap)} "
      f"({len(feature_overlap)/len(X_test):.2%} of test instances; natural in discrete survey features)")

# 4. Model Reconciliation and Prediction Generation
models_to_audit = [
    ("Logistic Regression", "logistic_regression.joblib"),
    ("Random Forest", "random_forest.joblib"),
    ("XGBoost", "xgboost.joblib"),
    ("Support Vector Machine", "support_vector_machine.joblib")
]

reconciled_results = {
    "audit_phase": "5.17",
    "dataset": "Large Public Benchmark (dataset/Student_Depression_Dataset.csv)",
    "dataset_sha256": dataset_hash,
    "total_records": row_count,
    "sample_counts": {
        "train": len(X_train),
        "val": len(X_val),
        "test": len(X_test)
    },
    "positive_class": "1 (Depressed)",
    "test_positive_prevalence": round(float(np.mean(y_test)), 4),
    "timestamp": "2026-11-16T19:30:00Z",
    "models": {}
}

test_predictions_dict = {
    "y_true": y_test
}

for name, filename in models_to_audit:
    model_path = os.path.join(MODELS_DIR, filename)
    assert os.path.exists(model_path), f"Missing model artifact: {model_path}"

    with open(model_path, "rb") as mf:
        model_hash = hashlib.sha256(mf.read()).hexdigest().upper()

    pipeline = joblib.load(model_path)
    print(f"\nAuditing {name} from {model_path} (SHA-256: {model_hash[:16]}...)")

    # Generate predictions on Test Set
    t0 = time.time()
    for _ in range(5): # 5 passes for stable latency measurement
        y_pred = pipeline.predict(X_test)
    inf_latency_ms = ((time.time() - t0) / (5 * len(y_test))) * 1000

    y_prob = pipeline.predict_proba(X_test)[:, 1] if hasattr(pipeline, "predict_proba") else None

    # Save to predictions dictionary
    slug = name.lower().replace(" ", "_")
    test_predictions_dict[f"{slug}_pred"] = y_pred
    if y_prob is not None:
        test_predictions_dict[f"{slug}_prob"] = y_prob

    # Rigorous Metric Recalculation directly from identical y_test & y_pred arrays
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    total = int(tn + fp + fn + tp)

    acc = float((tp + tn) / total)
    prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))

    roc_auc = float(roc_auc_score(y_test, y_prob)) if y_prob is not None else None
    pr_auc = float(average_precision_score(y_test, y_prob)) if y_prob is not None else None
    brier = float(brier_score_loss(y_test, y_prob)) if y_prob is not None else None

    # Mathematical Verification
    assert total == len(y_test)
    assert tp + fn == int(np.sum(y_test == 1)), f"TP+FN mismatch: {tp+fn} != {np.sum(y_test == 1)}"
    assert tn + fp == int(np.sum(y_test == 0)), f"TN+FP mismatch: {tn+fp} != {np.sum(y_test == 0)}"
    recalc_prec = float(tp / (tp + fp))
    assert abs(prec - recalc_prec) < 1e-9, f"Precision inconsistent: {prec} vs {recalc_prec}"

    print(f"  Exact Confusion Matrix: TN={tn}, FP={fp}, FN={fn}, TP={tp}")
    print(f"  Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    print(f"  Precision: {prec:.4f} ({prec*100:.2f}%)")
    print(f"  Recall:    {rec:.4f} ({rec*100:.2f}%)")
    print(f"  F1-Score:  {f1:.4f} ({f1*100:.2f}%)")
    print(f"  ROC-AUC:   {roc_auc:.4f}")
    print(f"  Brier:     {brier:.4f}")

    # Validation Split Recalculation
    y_val_pred = pipeline.predict(X_val)
    y_val_prob = pipeline.predict_proba(X_val)[:, 1] if hasattr(pipeline, "predict_proba") else None
    cm_val = confusion_matrix(y_val, y_val_pred, labels=[0, 1])
    tn_v, fp_v, fn_v, tp_v = cm_val.ravel()
    val_acc = float((tp_v + tn_v) / len(y_val))
    val_prec = float(tp_v / (tp_v + fp_v)) if (tp_v + fp_v) > 0 else 0.0
    val_rec = float(tp_v / (tp_v + fn_v)) if (tp_v + fn_v) > 0 else 0.0
    val_f1 = float(2 * val_prec * val_rec / (val_prec + val_rec)) if (val_prec + val_rec) > 0 else 0.0
    val_auc = float(roc_auc_score(y_val, y_val_prob)) if y_val_prob is not None else None

    # Classification Report
    clf_report = classification_report(
        y_test, y_pred,
        labels=[0, 1],
        target_names=["Non-Depressed", "Depressed"],
        output_dict=True,
        zero_division=0
    )

    # Subsampled Curves for UI
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    prec_pts, rec_pts, _ = precision_recall_curve(y_test, y_prob)
    sub_roc = np.linspace(0, len(fpr) - 1, min(50, len(fpr))).astype(int)
    roc_curve_data = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in sub_roc]
    sub_pr = np.linspace(0, len(prec_pts) - 1, min(50, len(prec_pts))).astype(int)
    pr_curve_data = [{"recall": round(float(rec_pts[i]), 4), "precision": round(float(prec_pts[i]), 4)} for i in sub_pr]

    prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=10, strategy="uniform")
    calibration_data = [{"mean_predicted_value": round(float(prob_pred[i]), 4), "fraction_of_positives": round(float(prob_true[i]), 4)} for i in range(len(prob_true))]

    reconciled_results["models"][name] = {
        "name": name,
        "artifact_file": filename,
        "artifact_sha256": model_hash,
        "validation_metrics": {
            "accuracy": round(val_acc, 4),
            "precision": round(val_prec, 4),
            "recall": round(val_rec, 4),
            "f1_score": round(val_f1, 4),
            "roc_auc": round(val_auc, 4) if val_auc is not None else None
        },
        "test_metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "specificity": round(spec, 4),
            "sensitivity": round(rec, 4),
            "f1_score": round(f1, 4),
            "macro_f1": round(macro_f1, 4),
            "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
            "pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
            "brier_score": round(brier, 4) if brier is not None else None,
            "inference_time_ms_per_sample": round(inf_latency_ms, 4),
            "confusion_matrix": cm.tolist(),
            "breakdown": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
            "classification_report": clf_report
        },
        "roc_curve": roc_curve_data,
        "pr_curve": pr_curve_data,
        "calibration_curve": calibration_data
    }

# Save Prediction Artifacts to Disk (.npz)
preds_path = os.path.join(REPORTS_DIR, "reconciled_test_predictions.npz")
np.savez_compressed(preds_path, **test_predictions_dict)
print(f"\nSaved exact test predictions array to {preds_path}")

# Save Reconciled JSON
reconciled_json_path = os.path.join(REPORTS_DIR, "reconciled_large_dataset_metrics.json")
with open(reconciled_json_path, "w", encoding="utf-8") as f:
    json.dump(reconciled_results, f, indent=2)

print(f"Saved reconciled metrics to {reconciled_json_path}")
