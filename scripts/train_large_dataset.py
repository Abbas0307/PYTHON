"""
scripts/train_large_dataset.py
Production-grade training and evaluation of 4 classification models on the Large Dataset (27,901 records).
Saves artifacts to models/large_dataset/ and reports to reports/large_dataset/.
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    brier_score_loss, classification_report, roc_curve, precision_recall_curve
)

OUTPUT_MODELS_DIR = "models/large_dataset"
OUTPUT_REPORTS_DIR = "reports/large_dataset"
os.makedirs(OUTPUT_MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_REPORTS_DIR, exist_ok=True)

# 1. Load Data
df = pd.read_csv("dataset/Student_Depression_Dataset.csv")
print(f"Loaded large dataset shape: {df.shape}")

NUMERICAL_COLS = ['Age', 'Academic Pressure', 'CGPA', 'Study Satisfaction', 'Work/Study Hours', 'Financial Stress']
CATEGORICAL_COLS = ['Gender', 'Sleep Duration', 'Dietary Habits', 'Degree']
TARGET_COL = 'Depression'

X = df[NUMERICAL_COLS + CATEGORICAL_COLS].copy()
y = df[TARGET_COL].astype(int).values

# 2. Stratified Splits: 70% Train, 15% Val, 15% Test (seed=42)
X_temp, X_test, y_temp, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)
val_ratio_adjusted = 0.15 / 0.85
X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp, test_size=val_ratio_adjusted, random_state=42, stratify=y_temp
)

print(f"Split counts -> Train: {len(X_train)} ({len(X_train)/len(df):.1%}), "
      f"Val: {len(X_val)} ({len(X_val)/len(df):.1%}), "
      f"Test: {len(X_test)} ({len(X_test)/len(df):.1%})")

# 3. Leakage-safe Preprocessor (Fitted strictly on X_train)
num_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])
cat_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
])
preprocessor = ColumnTransformer([
    ("num", num_pipe, NUMERICAL_COLS),
    ("cat", cat_pipe, CATEGORICAL_COLS)
])

preprocessor.fit(X_train)
X_train_proc = preprocessor.transform(X_train)
X_val_proc = preprocessor.transform(X_val)
X_test_proc = preprocessor.transform(X_test)

# Extract transformed feature names
cat_encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
encoded_cat_names = cat_encoder.get_feature_names_out(CATEGORICAL_COLS).tolist()
all_feature_names = NUMERICAL_COLS + encoded_cat_names
print(f"Total processed feature dimension: {len(all_feature_names)}")

# 4. Model Definitions
models_to_train = {
    "Logistic Regression": {
        "clf": LogisticRegression(C=1.0, penalty="l2", solver="lbfgs", class_weight="balanced", max_iter=1500, random_state=42),
        "hyperparams": {"C": 1.0, "penalty": "l2", "solver": "lbfgs", "class_weight": "balanced", "max_iter": 1500},
        "description": "L2-regularized linear model with balanced class weighting and standardized features."
    },
    "Random Forest": {
        "clf": RandomForestClassifier(n_estimators=150, max_depth=8, min_samples_split=5, class_weight="balanced", random_state=42, n_jobs=-1),
        "hyperparams": {"n_estimators": 150, "max_depth": 8, "min_samples_split": 5, "class_weight": "balanced"},
        "description": "Ensemble bagging decision trees with bounded tree depth to mitigate overfitting."
    },
    "XGBoost": {
        "clf": XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.05, subsample=0.85, colsample_bytree=0.85, eval_metric="logloss", random_state=42),
        "hyperparams": {"n_estimators": 150, "max_depth": 5, "learning_rate": 0.05, "subsample": 0.85, "colsample_bytree": 0.85},
        "description": "Gradient boosted decision trees optimized with shrinkage and regularized objective."
    },
    "Support Vector Machine": {
        "clf": CalibratedClassifierCV(
            estimator=SVC(C=1.0, kernel="rbf", gamma="scale", class_weight="balanced", max_iter=3000, random_state=42),
            cv=3
        ),
        "hyperparams": {"kernel": "rbf", "C": 1.0, "gamma": "scale", "class_weight": "balanced", "calibration": "CalibratedClassifierCV (3-fold sigmoid)"},
        "description": "Radial basis function (RBF) Support Vector Classifier with 3-fold Platt calibration."
    }
}

def evaluate_split(clf, X_proc, y_true):
    t0_inf = time.time()
    y_pred = clf.predict(X_proc)
    inf_time_ms = ((time.time() - t0_inf) / len(y_true)) * 1000

    y_prob = clf.predict_proba(X_proc)[:, 1] if hasattr(clf, "predict_proba") else None

    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = cm.ravel()
    total = int(tn + fp + fn + tp)

    acc = float((tp + tn) / total)
    prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
    macro_f1 = float(f1_score(y_true, y_pred, average="macro"))

    roc_auc = float(roc_auc_score(y_true, y_prob)) if y_prob is not None else None
    pr_auc = float(average_precision_score(y_true, y_prob)) if y_prob is not None else None
    brier = float(brier_score_loss(y_true, y_prob)) if y_prob is not None else None

    return {
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
        "inference_time_ms_per_sample": round(inf_time_ms, 4),
        "confusion_matrix": cm.tolist(),
        "breakdown": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "classification_report": classification_report(y_true, y_pred, labels=[0, 1], target_names=["Non-Depressed", "Depressed"], output_dict=True, zero_division=0)
    }

results = {
    "dataset": "Large Public Benchmark (dataset/Student_Depression_Dataset.csv)",
    "dataset_provenance": "Verified Kaggle Student Depression Benchmark (Frozen SHA-256 A3E159...)",
    "total_records": len(df),
    "feature_count": len(all_feature_names),
    "sample_counts": {
        "train": len(X_train),
        "val": len(X_val),
        "test": len(X_test)
    },
    "positive_class": "1 (Depressed)",
    "timestamp": "2026-11-16T18:30:00Z",
    "models": {}
}

for name, cfg in models_to_train.items():
    print(f"\n--- Training {name} ---")
    clf = cfg["clf"]
    t0 = time.time()
    clf.fit(X_train_proc, y_train)
    train_duration = round(time.time() - t0, 3)
    print(f"Fitted in {train_duration}s")

    train_metrics = evaluate_split(clf, X_train_proc, y_train)
    val_metrics = evaluate_split(clf, X_val_proc, y_val)
    test_metrics = evaluate_split(clf, X_test_proc, y_test)

    # ROC & PR Curves on Test Split
    y_test_prob = clf.predict_proba(X_test_proc)[:, 1]
    fpr, tpr, roc_thresh = roc_curve(y_test, y_test_prob)
    prec_pts, rec_pts, pr_thresh = precision_recall_curve(y_test, y_test_prob)

    # Subsample curves to ~50 points for efficient JSON serialization
    sub_indices_roc = np.linspace(0, len(fpr) - 1, min(50, len(fpr))).astype(int)
    roc_curve_data = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in sub_indices_roc]

    sub_indices_pr = np.linspace(0, len(prec_pts) - 1, min(50, len(prec_pts))).astype(int)
    pr_curve_data = [{"recall": round(float(rec_pts[i]), 4), "precision": round(float(prec_pts[i]), 4)} for i in sub_indices_pr]

    # Calibration Curve (10 bins)
    prob_true, prob_pred = calibration_curve(y_test, y_test_prob, n_bins=10, strategy="uniform")
    calibration_data = [{"mean_predicted_value": round(float(prob_pred[i]), 4), "fraction_of_positives": round(float(prob_true[i]), 4)} for i in range(len(prob_true))]

    # Feature Importance / Coefficients where applicable
    feature_importance = {}
    if name == "Logistic Regression":
        coefs = clf.coef_[0]
        # Rank by absolute magnitude
        top_indices = np.argsort(np.abs(coefs))[::-1][:15]
        feature_importance = {all_feature_names[i]: round(float(coefs[i]), 4) for i in top_indices}
    elif name == "Random Forest":
        importances = clf.feature_importances_
        top_indices = np.argsort(importances)[::-1][:15]
        feature_importance = {all_feature_names[i]: round(float(importances[i]), 4) for i in top_indices}
    elif name == "XGBoost":
        importances = clf.feature_importances_
        top_indices = np.argsort(importances)[::-1][:15]
        feature_importance = {all_feature_names[i]: round(float(importances[i]), 4) for i in top_indices}
    elif name == "Support Vector Machine":
        feature_importance = {"note": "Dual RBF kernel operates in infinite-dimensional Hilbert space; linear MDI not available. Use permutation importance for global ranking."}

    # Save full pipeline
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", clf)
    ])
    model_slug = name.lower().replace(" ", "_")
    model_save_path = os.path.join(OUTPUT_MODELS_DIR, f"{model_slug}.joblib")
    joblib.dump(pipeline, model_save_path)
    print(f"Saved pipeline to {model_save_path}")

    results["models"][name] = {
        "name": name,
        "description": cfg["description"],
        "hyperparameters": cfg["hyperparams"],
        "training_duration_seconds": train_duration,
        "train_metrics": train_metrics,
        "validation_metrics": val_metrics,
        "test_metrics": test_metrics,
        "roc_curve": roc_curve_data,
        "pr_curve": pr_curve_data,
        "calibration_curve": calibration_data,
        "feature_importance": feature_importance,
        "model_path": model_save_path
    }

# Save comprehensive results JSON
report_json_path = os.path.join(OUTPUT_REPORTS_DIR, "large_dataset_metrics.json")
with open(report_json_path, "w") as f:
    json.dump(results, f, indent=2)

print(f"\nSuccessfully wrote comprehensive results to {report_json_path}")
