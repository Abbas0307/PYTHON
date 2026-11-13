"""
src/train.py
Mindora - Student Mental Wellness & Risk Insights
End-to-end model training, validation-based selection, probability calibration (CalibratedClassifierCV),
and artifact generation across 10 clean public features.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import confusion_matrix, roc_curve, classification_report

from src.data_loader import load_raw_data
from src.preprocessing import (
    get_train_val_test_data, 
    create_preprocessor, 
    get_feature_names,
    ALL_MODEL_FEATURES
)
from src.evaluate import (
    compute_metrics, 
    plot_confusion_matrices, 
    plot_model_comparison, 
    generate_training_report
)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_evaluate_pipeline() -> Dict[str, Any]:
    """
    Train and compare Logistic Regression, Random Forest, and XGBoost using validation set.
    Calibrates probabilities with cross-validation on training data.
    Evaluates on untouched held-out test set once.
    """
    print("=" * 70)
    print("MINDORA: Training Clean Model Pipeline (10 Non-Leaking Features)")
    print("=" * 70)
    
    # 1. Load data
    df = load_raw_data()
    print(f"Loaded raw dataset with {df.shape[0]} records.")
    print(f"Features utilized ({len(ALL_MODEL_FEATURES)}): {ALL_MODEL_FEATURES}")
    
    # 2. Stratified train/val/test split (70% / 15% / 15%)
    X_train, X_val, X_test, y_train, y_val, y_test = get_train_val_test_data(
        df, test_size=0.15, val_size=0.15, random_state=42
    )
    print(f"Train split:      {len(X_train)} samples")
    print(f"Validation split: {len(X_val)} samples")
    print(f"Final Test split: {len(X_test)} samples")
    print(f"Class ratio (Train positive): {y_train.mean():.4f}")
    
    # 3. Fit preprocessing strictly on training data
    preprocessor = create_preprocessor()
    print("Fitting ColumnTransformer strictly on X_train...")
    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)
    
    feature_names = get_feature_names(preprocessor)
    print(f"Transformed feature space dimensionality: {len(feature_names)}")
    
    # 4. Define candidate base models
    candidates = {
        "Logistic Regression": LogisticRegression(
            max_iter=1500,
            class_weight="balanced",
            C=1.0,
            solver="lbfgs",
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            eval_metric="logloss"
        )
    }
    
    val_results = {}
    fitted_candidates = {}
    
    # 5. Train each candidate on training set and evaluate on VALIDATION set
    print("\n--- Training Candidates and Evaluating on Validation Set ---")
    for name, model in candidates.items():
        model.fit(X_train_trans, y_train)
        fitted_candidates[name] = model
        
        val_preds = model.predict(X_val_trans)
        val_probs = model.predict_proba(X_val_trans)[:, 1]
        val_m = compute_metrics(y_val, val_preds, val_probs)
        val_results[name] = val_m
        print(f"[{name}] Validation Metrics: Acc={val_m['accuracy']:.4f}, Recall={val_m['recall']:.4f}, "
              f"F1={val_m['f1_score']:.4f}, ROC-AUC={val_m['roc_auc']:.4f}, Brier={val_m['brier_score']:.4f}")
        
    # 6. Select Best Base Model based STRICTLY on VALIDATION METRICS
    # In mental health screening, sensitivity (recall) and balanced F1/AUC are critical
    best_model_name = max(
        candidates.keys(),
        key=lambda k: val_results[k]["f1_score"] * 0.5 + val_results[k]["roc_auc"] * 0.5
    )
    best_estimator = fitted_candidates[best_model_name]
    best_val_m = val_results[best_model_name]
    
    selection_rationale = (
        f"{best_model_name} demonstrated the superior balance on the independent validation set with "
        f"F1-Score of {best_val_m['f1_score']:.4f}, Recall of {best_val_m['recall']:.4f}, and "
        f"ROC-AUC of {best_val_m['roc_auc']:.4f}. Selected strictly using validation data without test-set access."
    )
    print("\n" + "=" * 70)
    print(f"SELECTED BEST BASE MODEL: {best_model_name}")
    print(f"Selection Rationale: {selection_rationale}")
    print("=" * 70)
    
    # 7. Probability Calibration via Cross-Validation on Training Data
    print(f"\nCalibrating {best_model_name} with CalibratedClassifierCV (method='sigmoid', cv=5 on training data)...")
    calibrated_model = CalibratedClassifierCV(estimator=best_estimator, method="sigmoid", cv=5)
    calibrated_model.fit(X_train_trans, y_train)
    
    # 8. Evaluate on Untouched Final Test Set (Single Evaluation)
    print("\n--- Evaluating Models on Untouched Held-Out Test Set (N=4,186) ---")
    test_results = {}
    for name, model in fitted_candidates.items():
        test_preds = model.predict(X_test_trans)
        test_probs = model.predict_proba(X_test_trans)[:, 1]
        test_m = compute_metrics(y_test, test_preds, test_probs)
        
        cm = confusion_matrix(y_test, test_preds)
        fpr, tpr, _ = roc_curve(y_test, test_probs)
        clf_rep = classification_report(y_test, test_preds, target_names=["Non-Depressed", "Depressed"])
        
        test_results[name] = {
            "val_metrics": val_results[name],
            "test_metrics": test_m,
            "confusion_matrix": cm.tolist(),
            "roc_curve": {"fpr": fpr.tolist(), "tpr": tpr.tolist()},
            "classification_report": clf_rep
        }
        print(f"[{name}] Test Set: Acc={test_m['accuracy']:.4f}, Recall={test_m['recall']:.4f}, "
              f"F1={test_m['f1_score']:.4f}, ROC-AUC={test_m['roc_auc']:.4f}, Brier={test_m['brier_score']:.4f}")
        
    # Evaluate the Final Calibrated Production Model on Test Set
    cal_test_preds = calibrated_model.predict(X_test_trans)
    cal_test_probs = calibrated_model.predict_proba(X_test_trans)[:, 1]
    cal_test_metrics = compute_metrics(y_test, cal_test_preds, cal_test_probs)
    print(f"\n[Final Calibrated Production Model] Test Set Metrics:")
    print(f"Accuracy:    {cal_test_metrics['accuracy']:.4f}")
    print(f"Precision:   {cal_test_metrics['precision']:.4f}")
    print(f"Recall:      {cal_test_metrics['recall']:.4f}")
    print(f"F1-Score:    {cal_test_metrics['f1_score']:.4f}")
    print(f"ROC-AUC:     {cal_test_metrics['roc_auc']:.4f}")
    print(f"Brier Score: {cal_test_metrics['brier_score']:.4f} (Calibrated)")
    
    # 9. Assemble Full Pipeline and Persist Artifacts
    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", calibrated_model)
    ])
    # Attach fitted base estimator for SHAP TreeExplainer compatibility
    full_pipeline.base_estimator_ = best_estimator
    
    best_model_path = os.path.join(MODELS_DIR, "best_model.pkl")
    joblib.dump(full_pipeline, best_model_path)
    print(f"\nSaved calibrated pipeline to {best_model_path}")
    
    # 10. Extract Feature Importance from underlying base estimator
    if hasattr(best_estimator, "feature_importances_"):
        raw_importances = best_estimator.feature_importances_
    elif hasattr(best_estimator, "coef_"):
        raw_importances = np.abs(best_estimator.coef_[0])
    else:
        raw_importances = np.ones(len(feature_names))
        
    feat_df = pd.DataFrame({
        "feature": feature_names,
        "importance": raw_importances
    }).sort_values(by="importance", ascending=False).reset_index(drop=True)
    
    feat_imp_path = os.path.join(MODELS_DIR, "feature_importance.csv")
    feat_df.to_csv(feat_imp_path, index=False)
    print(f"Saved feature importance table to {feat_imp_path}")
    
    # 11. Save model comparison JSON
    comparison_data = {
        "preliminary_experiments_note": (
            "Preliminary experiment 1 achieved 84.11% accuracy by including 'Have you ever had suicidal thoughts?'. "
            "Preliminary experiment 2 achieved 80.12% accuracy by including 'Family History of Mental Illness'. "
            "Both were discarded to prevent clinical target leakage and respect student privacy. "
            "Current model uses strictly 10 non-leaking educational lifestyle and study features."
        ),
        "best_model": best_model_name,
        "selection_rationale": selection_rationale,
        "calibrated_production_metrics": cal_test_metrics,
        "models": {
            name: {
                "val_metrics": res["val_metrics"],
                "test_metrics": res["test_metrics"],
                "confusion_matrix": res["confusion_matrix"]
            }
            for name, res in test_results.items()
        }
    }
    comparison_path = os.path.join(MODELS_DIR, "model_comparison.json")
    with open(comparison_path, "w", encoding="utf-8") as f:
        json.dump(comparison_data, f, indent=4)
    print(f"Saved comparison data to {comparison_path}")
    
    # 12. Generate Evaluation Artifacts
    cm_path = plot_confusion_matrices(test_results)
    mc_path = plot_model_comparison(test_results, y_test.values, cal_test_probs, best_model_name)
    rep_path = generate_training_report(test_results, best_model_name, selection_rationale, cal_test_metrics)
    print(f"Generated confusion matrix plot: {cm_path}")
    print(f"Generated comparison plot: {mc_path}")
    print(f"Generated training report: {rep_path}")
    
    return comparison_data

if __name__ == "__main__":
    train_and_evaluate_pipeline()
