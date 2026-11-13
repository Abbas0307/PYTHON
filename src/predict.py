"""
src/predict.py
Mindora - Student Mental Wellness & Risk Insights
Engine 1: Public Dataset ML Inference, Calibrated Probability Calculation,
Risk Categorization, and SHAP Local Explainability across 10 clean features.
"""

import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import shap

from src.preprocessing import get_feature_names, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, ALL_MODEL_FEATURES

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "best_model.pkl")

# Cached model and explainer instances
_CACHED_PIPELINE = None
_CACHED_EXPLAINER = None

def get_pipeline():
    """Load and cache the trained end-to-end pipeline."""
    global _CACHED_PIPELINE
    if _CACHED_PIPELINE is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run src/train.py first.")
        _CACHED_PIPELINE = joblib.load(MODEL_PATH)
    return _CACHED_PIPELINE

def get_tree_explainer(base_estimator):
    """Load and cache the TreeExplainer for the underlying tree model."""
    global _CACHED_EXPLAINER
    if _CACHED_EXPLAINER is None:
        _CACHED_EXPLAINER = shap.TreeExplainer(base_estimator)
    return _CACHED_EXPLAINER

def determine_risk_tier(probability: float) -> Dict[str, str]:
    """
    Map screening probability to calibrated risk tier with guidance.
    """
    if probability < 0.35:
        return {
            "tier": "Low Screening Indicator",
            "badge_color": "#10B981", # Emerald Green
            "badge_bg": "#ECFDF5",
            "summary": "Current questionnaire patterns show low alignment with elevated depression screening indicators in the student benchmark.",
            "status": "Healthy / Low Risk"
        }
    elif probability < 0.65:
        return {
            "tier": "Moderate Screening Indicator",
            "badge_color": "#F59E0B", # Amber
            "badge_bg": "#FEF3C7",
            "summary": "Notable academic workload, sleep patterns, or study stress that correlate with emerging emotional fatigue.",
            "status": "Moderate Risk / Monitor Habits"
        }
    else:
        return {
            "tier": "Elevated Screening Indicator",
            "badge_color": "#EF4444", # Rose/Red
            "badge_bg": "#FEE2E2",
            "summary": "Significant combination of academic pressure, sleep deprivation, and dietary patterns associated with elevated depressive symptoms.",
            "status": "Elevated Risk / Consider Guidance"
        }

def predict_wellness_risk(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    ENGINE 1 – PUBLIC DATASET ML:
    Strictly uses the 10 compatible public dataset features.
    Produces an experimental estimate of the dataset's self-reported label.
    Never uses PHQ-9 responses or digital/social-media questions.
    """
    pipeline = get_pipeline()
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]
    
    # Retrieve underlying base estimator for SHAP explainability
    if hasattr(pipeline, "base_estimator_"):
        base_estimator = pipeline.base_estimator_
    elif hasattr(classifier, "calibrated_classifiers_") and len(classifier.calibrated_classifiers_) > 0:
        base_estimator = classifier.calibrated_classifiers_[0].estimator
    else:
        base_estimator = classifier
        
    # Construct single-row DataFrame with strict 10-feature schema matching
    row_dict = {
        "Age": float(input_data.get("Age", 21.0)),
        "Academic Pressure": float(input_data.get("Academic Pressure", 3.0)),
        "CGPA": float(input_data.get("CGPA", 7.5)),
        "Study Satisfaction": float(input_data.get("Study Satisfaction", 3.0)),
        "Work/Study Hours": float(input_data.get("Work/Study Hours", 6.0)),
        "Financial Stress": float(input_data.get("Financial Stress", 3.0)),
        "Gender": str(input_data.get("Gender", "Female")).strip(),
        "Sleep Duration": str(input_data.get("Sleep Duration", "7-8 hours")).strip(),
        "Dietary Habits": str(input_data.get("Dietary Habits", "Moderate")).strip(),
        "Degree": str(input_data.get("Degree", "B.Tech")).strip()
    }
    
    df_input = pd.DataFrame([row_dict])
    
    # 1. Prediction & Calibrated Probability
    prob = float(pipeline.predict_proba(df_input)[0, 1])
    pred_class = int(prob >= 0.5)
    risk_info = determine_risk_tier(prob)
    
    # 2. Local Explainability (SHAP on underlying base tree model)
    feature_contributions = []
    explainability_method = "SHAP TreeExplainer (Calibrated Base Estimator)"
    is_local_explanation = True
    explanation_type = "Individual SHAP Factor Attribution (Local)"
    explanation_error = None
    
    try:
        X_trans = preprocessor.transform(df_input)
        feature_names = get_feature_names(preprocessor)
        explainer = get_tree_explainer(base_estimator)
        shap_values = explainer.shap_values(X_trans)
        
        # Extract 1D array of values
        if isinstance(shap_values, list):
            sv = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 2:
            sv = shap_values[0]
        else:
            sv = shap_values
            
        contributions = []
        for feat_name, s_val in zip(feature_names, sv):
            # Clean up display name
            display_name = feat_name
            if feat_name.startswith("Sleep Duration_"):
                display_name = f"Sleep Pattern: {feat_name.split('_')[-1]}"
            elif feat_name.startswith("Dietary Habits_"):
                display_name = f"Dietary Habit: {feat_name.split('_')[-1]}"
            elif feat_name.startswith("Degree_"):
                display_name = f"Degree Track: {feat_name.split('_')[-1]}"
            elif feat_name.startswith("Gender_"):
                display_name = f"Gender: {feat_name.split('_')[-1]}"
                
            contributions.append({
                "feature": display_name,
                "raw_feature": feat_name,
                "shap_value": float(s_val),
                "global_importance": None,
                "impact": "Increases Risk" if s_val > 0 else "Decreases Risk",
                "magnitude": abs(float(s_val))
            })
            
        # Sort by absolute impact and return top factors
        contributions.sort(key=lambda x: x["magnitude"], reverse=True)
        feature_contributions = contributions[:6]
        
    except Exception as e:
        is_local_explanation = False
        explainability_method = "Global Feature Importance (Dataset Level - Not Individualized)"
        explanation_type = "Global Model Feature Weights (Dataset Level)"
        explanation_error = f"{type(e).__name__}: {str(e)}"
        
        fi_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "feature_importance.csv")
        if os.path.exists(fi_path):
            fi_df = pd.read_csv(fi_path)
            for _, row in fi_df.head(6).iterrows():
                feature_contributions.append({
                    "feature": row["feature"],
                    "raw_feature": row["feature"],
                    "shap_value": None,
                    "global_importance": float(row["importance"]),
                    "impact": "Statistical Dataset Correlate",
                    "magnitude": float(row["importance"])
                })
                
    return {
        "probability": round(prob, 4),
        "percentage": round(prob * 100, 1),
        "predicted_class": pred_class,
        "risk_tier": risk_info["tier"],
        "badge_color": risk_info["badge_color"],
        "badge_bg": risk_info["badge_bg"],
        "summary": risk_info["summary"],
        "status": risk_info["status"],
        "feature_contributions": feature_contributions,
        "explainability_method": explainability_method,
        "is_local_explanation": is_local_explanation,
        "explanation_type": explanation_type,
        "explanation_error": explanation_error,
        "input_features": row_dict
    }

if __name__ == "__main__":
    sample = {
        "Age": 21,
        "Academic Pressure": 4.0,
        "CGPA": 8.0,
        "Study Satisfaction": 2.0,
        "Work/Study Hours": 8.0,
        "Financial Stress": 3.0,
        "Gender": "Male",
        "Sleep Duration": "Less than 5 hours",
        "Dietary Habits": "Unhealthy",
        "Degree": "B.Tech"
    }
    result = predict_wellness_risk(sample)
    print("Inference Test Result (Clean 10-Feature Schema):")
    print(f"Risk Tier: {result['risk_tier']} ({result['percentage']}%)")
    print(f"Method: {result['explainability_method']}")
    print("Top Contributions:")
    for fc in result["feature_contributions"]:
        print(f" - {fc['feature']}: {fc['shap_value']:+.4f} ({fc['impact']})")
