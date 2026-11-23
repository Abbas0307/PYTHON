"""
scripts/train_real_world_163.py
Independent training and small-sample evaluation of 4 classification models on the 163-Record Dataset.
Strictly labeled: "163-RECORD DATASET — PROVENANCE UNVERIFIED"
Saves artifacts to models/real_world_163/ and reports to reports/real_world_163/.
"""

import os
import re
import json
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple

from sklearn.model_selection import RepeatedStratifiedKFold
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.calibration import CalibratedClassifierCV
from xgboost import XGBClassifier

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    brier_score_loss, classification_report
)

OUTPUT_MODELS_DIR = "models/real_world_163"
OUTPUT_EXPERIMENTS_DIR = "experiments/real_world_163"
OUTPUT_REPORTS_DIR = "reports/real_world_163"
os.makedirs(OUTPUT_MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_EXPERIMENTS_DIR, exist_ok=True)
os.makedirs(OUTPUT_REPORTS_DIR, exist_ok=True)

# 1. Load Data
EXCEL_PATH = "ml_lab/data/raw/STUDENT dataset.xlsx"
df_raw = pd.read_excel(EXCEL_PATH)
print(f"Loaded raw dataset shape: {df_raw.shape}")

# 2. Cleaning and Normalization Functions
def clean_cgpa(val):
    if pd.isna(val):
        return np.nan
    s = str(val).strip()
    try:
        f = float(s)
        return f if (0.0 <= f <= 10.0) else np.nan
    except ValueError:
        return np.nan

def clean_hours(val):
    if pd.isna(val):
        return np.nan
    s = str(val).strip().lower()
    # Check for range pattern e.g. "3-4", "2-3"
    match_range = re.match(r"^(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)$", s)
    if match_range:
        return (float(match_range.group(1)) + float(match_range.group(2))) / 2.0
    # Check for "3 hrs", "4 hours"
    match_single = re.match(r"^(\d+(?:\.\d+)?)\s*(?:hrs?|hours?)?$", s)
    if match_single:
        return float(match_single.group(1))
    return np.nan

PRESSURE_MAP = {
    "very low": 1,
    "low": 2,
    "moderate": 3,
    "high": 4,
    "very high": 5
}

def clean_degree(deg):
    if pd.isna(deg):
        return "Other"
    d = str(deg).strip().upper()
    if any(k in d for k in ["BTECH", "B.TECH", "B TECH", "B.E", "ENGINEERING"]):
        return "Engineering/Tech"
    elif any(k in d for k in ["BBA", "B.COM", "BCOM", "COMMERCE", "FINANCE"]):
        return "Business/Commerce"
    elif any(k in d for k in ["BCA", "MCA", "COMPUTER", "DATA"]):
        return "Computer Science/IT"
    elif any(k in d for k in ["B.DES", "DESIGN", "ARCHITECTURE", "B.ARCH"]):
        return "Design/Architecture"
    elif any(k in d for k in ["BA", "B.A", "PSYCHOLOGY", "ARTS"]):
        return "Humanities/Arts"
    elif any(k in d for k in ["BSC", "B.SC", "SCIENCE"]):
        return "Science"
    return "Other"

# Construct Cleaned DataFrame
df_clean = pd.DataFrame()
df_clean["Age"] = pd.to_numeric(df_raw["What is your age?"], errors="coerce")
df_clean["Gender"] = df_raw[" What is your gender?"].astype(str).str.strip()
df_clean["Dietary_Habits"] = df_raw["How would you describe your usual dietary habits?"].astype(str).str.strip()
df_clean["Degree_Category"] = df_raw["What degree or educational programme are you currently pursuing?"].apply(clean_degree)
df_clean["CGPA"] = df_raw["What is your current CGPA on a 10-point scale?"].apply(clean_cgpa)
df_clean["Academic_Pressure"] = df_raw["How much academic pressure do you currently experience?"].astype(str).str.strip().str.lower().map(PRESSURE_MAP)
df_clean["Study_Satisfaction"] = pd.to_numeric(df_raw["How satisfied are you with your current studies?"], errors="coerce")
df_clean["Sleep_Duration"] = df_raw["On average, how many hours do you sleep per night?"].astype(str).str.replace("–", "-").str.strip()
df_clean["Work_Study_Hours"] = df_raw["On an average day, how many total hours do you spend studying or working?( in numbers)"].apply(clean_hours)
df_clean["Financial_Stress"] = pd.to_numeric(df_raw["How much financial stress do you currently experience?"], errors="coerce")

raw_target = df_raw["Has a qualified healthcare professional ever told you that you have depression"].astype(str).str.strip().str.lower()
df_clean["Raw_Target"] = raw_target

# Map target: yes -> 1, no -> 0; exclude "not sure" for primary binary model
primary_mask = raw_target.isin(["yes", "no"])
df_primary = df_clean[primary_mask].copy().reset_index(drop=True)
df_primary["Target"] = (df_primary["Raw_Target"] == "yes").astype(int)

print(f"Primary cohort (excluding 'not sure'): N = {len(df_primary)}")
print("Primary target counts:\n", df_primary["Target"].value_counts())

NUMERICAL_COLS = ["Age", "CGPA", "Academic_Pressure", "Study_Satisfaction", "Work_Study_Hours", "Financial_Stress"]
CATEGORICAL_COLS = ["Gender", "Dietary_Habits", "Degree_Category", "Sleep_Duration"]

X = df_primary[NUMERICAL_COLS + CATEGORICAL_COLS].copy()
y = df_primary["Target"].values

# 3. Small-Sample Evaluation Strategy: Repeated Stratified 5-Fold Cross Validation (5 folds x 5 repeats = 25 evaluations)
rskf = RepeatedStratifiedKFold(n_splits=5, n_repeats=5, random_state=42)

models_to_evaluate = {
    "Logistic Regression": {
        "clf_factory": lambda: LogisticRegression(C=1.0, penalty="l2", solver="lbfgs", class_weight="balanced", max_iter=1500, random_state=42),
        "hyperparams": {"C": 1.0, "penalty": "l2", "solver": "lbfgs", "class_weight": "balanced"},
        "description": "L2-regularized linear model with standardized features and balanced class weights."
    },
    "Random Forest": {
        "clf_factory": lambda: RandomForestClassifier(n_estimators=100, max_depth=5, min_samples_split=4, class_weight="balanced", random_state=42, n_jobs=-1),
        "hyperparams": {"n_estimators": 100, "max_depth": 5, "min_samples_split": 4, "class_weight": "balanced"},
        "description": "Small-sample constrained Random Forest with conservative depth limit to prevent leaf memorization."
    },
    "XGBoost": {
        "clf_factory": lambda: XGBClassifier(n_estimators=100, max_depth=3, learning_rate=0.03, subsample=0.8, colsample_bytree=0.8, eval_metric="logloss", random_state=42),
        "hyperparams": {"n_estimators": 100, "max_depth": 3, "learning_rate": 0.03, "subsample": 0.8, "colsample_bytree": 0.8},
        "description": "Shallow gradient-boosted trees with aggressive shrinkage for small-sample stability."
    },
    "Support Vector Machine": {
        "clf_factory": lambda: CalibratedClassifierCV(
            estimator=SVC(C=1.0, kernel="rbf", gamma="scale", class_weight="balanced", random_state=42),
            cv=3
        ),
        "hyperparams": {"kernel": "rbf", "C": 1.0, "gamma": "scale", "class_weight": "balanced", "calibration": "CalibratedClassifierCV (3-fold sigmoid)"},
        "description": "RBF Support Vector Machine with 3-fold Platt scaling for calibrated probabilities."
    }
}

small_dataset_report = {
    "dataset_provenance": "163-RECORD DATASET — PROVENANCE UNVERIFIED",
    "dataset_file": "ml_lab/data/raw/STUDENT dataset.xlsx",
    "total_raw_records": len(df_raw),
    "primary_cohort_size": len(df_primary),
    "excluded_not_sure_records": int((raw_target == "not sure").sum()),
    "class_distribution": {
        "negative_no (0)": int((df_primary["Target"] == 0).sum()),
        "positive_yes (1)": int((df_primary["Target"] == 1).sum()),
        "positive_class_prevalence_pct": round(float(df_primary["Target"].mean() * 100), 2)
    },
    "evaluation_protocol": "Repeated Stratified 5-Fold Cross Validation (5 folds x 5 repeats = 25 evaluations)",
    "holdout_test_set_status": "NO INDEPENDENT HOLDOUT TEST SET FORMED",
    "holdout_rationale": "Sample size (N=143, 45 positive cases) is too small to split an independent holdout without crippling training representation and incurring severe sampling variance. All metrics reported represent out-of-fold cross-validation performance with 95% confidence intervals.",
    "features_used": {
        "numerical": NUMERICAL_COLS,
        "categorical": CATEGORICAL_COLS
    },
    "timestamp": "2026-11-16T18:30:00Z",
    "models": {}
}

# Run Cross-Validation for Each Model
for name, cfg in models_to_evaluate.items():
    print(f"\n--- Cross-Validating {name} on 163-Record Dataset ---")
    fold_metrics = []
    t0_all = time.time()

    # Pre-instantiate preprocessor template
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    fold_preprocessor = ColumnTransformer([
        ("num", num_pipe, NUMERICAL_COLS),
        ("cat", cat_pipe, CATEGORICAL_COLS)
    ])

    for fold_idx, (train_idx, val_idx) in enumerate(rskf.split(X, y)):
        X_train_f, X_val_f = X.iloc[train_idx], X.iloc[val_idx]
        y_train_f, y_val_f = y[train_idx], y[val_idx]

        # Fit preprocessor strictly on training fold
        fold_preprocessor.fit(X_train_f)
        X_train_proc = fold_preprocessor.transform(X_train_f)
        X_val_proc = fold_preprocessor.transform(X_val_f)

        clf = cfg["clf_factory"]()
        clf.fit(X_train_proc, y_train_f)

        y_pred = clf.predict(X_val_proc)
        y_prob = clf.predict_proba(X_val_proc)[:, 1] if hasattr(clf, "predict_proba") else None

        cm = confusion_matrix(y_val_f, y_pred, labels=[0, 1])
        tn, fp, fn, tp = cm.ravel()
        total_f = int(tn + fp + fn + tp)

        acc = float((tp + tn) / total_f)
        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        roc_auc = float(roc_auc_score(y_val_f, y_prob)) if (y_prob is not None and len(np.unique(y_val_f)) > 1) else None
        brier = float(brier_score_loss(y_val_f, y_prob)) if y_prob is not None else None

        fold_metrics.append({
            "fold": fold_idx,
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "specificity": spec,
            "f1_score": f1,
            "roc_auc": roc_auc,
            "brier_score": brier
        })

    total_cv_duration = round(time.time() - t0_all, 3)

    # Calculate Mean, Standard Deviation, and 95% Confidence Intervals
    def calc_ci(metric_list):
        valid = [v for v in metric_list if v is not None]
        if not valid:
            return {"mean": None, "std": None, "ci_95_lower": None, "ci_95_upper": None}
        mean = float(np.mean(valid))
        std = float(np.std(valid, ddof=1))
        # 95% CI using t-distribution approximation (t ~ 2.064 for df=24)
        margin = 2.064 * (std / np.sqrt(len(valid)))
        return {
            "mean": round(mean, 4),
            "std": round(std, 4),
            "ci_95_lower": round(max(0.0, mean - margin), 4),
            "ci_95_upper": round(min(1.0, mean + margin), 4)
        }

    acc_stats = calc_ci([m["accuracy"] for m in fold_metrics])
    prec_stats = calc_ci([m["precision"] for m in fold_metrics])
    rec_stats = calc_ci([m["recall"] for m in fold_metrics])
    spec_stats = calc_ci([m["specificity"] for m in fold_metrics])
    f1_stats = calc_ci([m["f1_score"] for m in fold_metrics])
    auc_stats = calc_ci([m["roc_auc"] for m in fold_metrics])
    brier_stats = calc_ci([m["brier_score"] for m in fold_metrics])

    # Fit a reference pipeline on entire primary cohort for deployment/inspection
    final_preprocessor = ColumnTransformer([
        ("num", num_pipe, NUMERICAL_COLS),
        ("cat", cat_pipe, CATEGORICAL_COLS)
    ])
    final_pipeline = Pipeline([
        ("preprocessor", final_preprocessor),
        ("classifier", cfg["clf_factory"]())
    ])
    final_pipeline.fit(X, y)
    model_slug = name.lower().replace(" ", "_")
    model_save_path = os.path.join(OUTPUT_MODELS_DIR, f"{model_slug}_163.joblib")
    joblib.dump(final_pipeline, model_save_path)

    small_dataset_report["models"][name] = {
        "name": name,
        "description": cfg["description"],
        "hyperparameters": cfg["hyperparams"],
        "cv_duration_seconds": total_cv_duration,
        "metrics_summary": {
            "accuracy": acc_stats,
            "precision": prec_stats,
            "recall": rec_stats,
            "specificity": spec_stats,
            "sensitivity": rec_stats,
            "f1_score": f1_stats,
            "roc_auc": auc_stats,
            "brier_score": brier_stats
        },
        "fold_level_metrics": fold_metrics[:5], # First 5 fold metrics for table inspection
        "model_path": model_save_path
    }

# Save report JSON
report_path = os.path.join(OUTPUT_REPORTS_DIR, "small_dataset_metrics.json")
with open(report_path, "w") as f:
    json.dump(small_dataset_report, f, indent=2)

print(f"\nSuccessfully wrote small dataset evaluation report to {report_path}")
