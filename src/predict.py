"""
src/predict.py
Mindora - Student Mental Wellness & Risk Insights
Engine 1: Public Dataset ML Inference, Calibrated Probability Calculation,
Risk Categorization, and SHAP Local Explainability across 10 clean features.
"""

import os
import hashlib
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional
import shap

from src.preprocessing import get_feature_names, NUMERICAL_FEATURES, CATEGORICAL_FEATURES, ALL_MODEL_FEATURES

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "best_model.pkl")
EXPECTED_PRODUCTION_MODEL_SHA256 = "e182e9e779a4f89e4883eb13c9bab3df19eebc7165d4b0a44319f737361342ec"

# Cached model and explainer instances
_CACHED_PIPELINE = None
_CACHED_EXPLAINER = None

def compute_file_sha256(filepath: str) -> str:
    """Compute SHA-256 cryptographic hash of a local file."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest().lower()

def verify_model_integrity(filepath: str = MODEL_PATH, expected_sha: str = EXPECTED_PRODUCTION_MODEL_SHA256) -> bool:
    """
    Verify model artifact cryptographic integrity to prevent deserialization
    of tampered, corrupted, or malicious pickle files (CWE-502 Mitigation).
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Model file not found at {filepath}.")
    computed_sha = compute_file_sha256(filepath)
    if computed_sha != expected_sha.lower():
        raise ValueError(
            f"Model artifact integrity check failed. Expected SHA-256 {expected_sha[:16]}..., "
            f"got {computed_sha[:16]}... Refusing to deserialize untrusted or tampered pickle file."
        )
    return True

def get_pipeline(verify_integrity: bool = True):
    """Load and cache the trained end-to-end pipeline with integrity verification."""
    global _CACHED_PIPELINE
    if _CACHED_PIPELINE is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Run src/train.py first.")
        if verify_integrity:
            verify_model_integrity(MODEL_PATH)
        _CACHED_PIPELINE = joblib.load(MODEL_PATH)
    return _CACHED_PIPELINE

def get_tree_explainer(base_estimator):
    """Load and cache the TreeExplainer for the underlying tree model."""
    global _CACHED_EXPLAINER
    if _CACHED_EXPLAINER is None:
        _CACHED_EXPLAINER = shap.TreeExplainer(base_estimator)
    return _CACHED_EXPLAINER

REQUIRED_ML_FEATURES = [
    "Age", "Academic Pressure", "CGPA", "Study Satisfaction", 
    "Work/Study Hours", "Financial Stress", "Gender", 
    "Sleep Duration", "Dietary Habits", "Degree"
]

def validate_ml_inputs(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate that input contains all 10 approved features with valid ranges.
    Prevents silent conversion of empty, missing, or corrupt inputs into plausible predictions.
    """
    if not isinstance(input_data, dict):
        raise ValueError(f"Expected dictionary of features, received {type(input_data).__name__}")
    
    missing = [f for f in REQUIRED_ML_FEATURES if f not in input_data or input_data[f] is None]
    if missing:
        raise ValueError(f"Missing required ML feature(s): {', '.join(missing)}")
    
    # Validate numeric types and ranges
    try:
        age = float(input_data["Age"])
        if not (15.0 <= age <= 100.0):
            raise ValueError(f"Age must be between 15 and 100 (got {age})")
            
        acad_pressure = float(input_data["Academic Pressure"])
        if not (1.0 <= acad_pressure <= 5.0):
            raise ValueError(f"Academic Pressure must be between 1.0 and 5.0 (got {acad_pressure})")
            
        cgpa = float(input_data["CGPA"])
        if not (0.0 <= cgpa <= 10.0):
            raise ValueError(f"CGPA must be between 0.0 and 10.0 (got {cgpa})")
            
        study_sat = float(input_data["Study Satisfaction"])
        if not (1.0 <= study_sat <= 5.0):
            raise ValueError(f"Study Satisfaction must be between 1.0 and 5.0 (got {study_sat})")
            
        work_hours = float(input_data["Work/Study Hours"])
        if not (0.0 <= work_hours <= 24.0):
            raise ValueError(f"Work/Study Hours must be between 0.0 and 24.0 (got {work_hours})")
            
        fin_stress = float(input_data["Financial Stress"])
        if not (1.0 <= fin_stress <= 5.0):
            raise ValueError(f"Financial Stress must be between 1.0 and 5.0 (got {fin_stress})")
            
    except (TypeError, ValueError) as e:
        if "must be between" in str(e):
            raise
        raise ValueError(f"Invalid numeric value in assessment features: {str(e)}")
        
    # Validate categorical types
    gender = str(input_data["Gender"]).strip()
    if not gender:
        raise ValueError("Gender cannot be empty")
    if len(gender) > 100:
        raise ValueError("Gender exceeds maximum permitted length (100 characters)")
        
    sleep_dur = str(input_data["Sleep Duration"]).strip()
    if not sleep_dur:
        raise ValueError("Sleep Duration cannot be empty")
    if len(sleep_dur) > 100:
        raise ValueError("Sleep Duration exceeds maximum permitted length (100 characters)")
        
    diet = str(input_data["Dietary Habits"]).strip()
    if not diet:
        raise ValueError("Dietary Habits cannot be empty")
    if len(diet) > 100:
        raise ValueError("Dietary Habits exceeds maximum permitted length (100 characters)")
        
    degree = str(input_data["Degree"]).strip()
    if not degree:
        raise ValueError("Degree program cannot be empty")
    if len(degree) > 100:
        raise ValueError("Degree program exceeds maximum permitted length (100 characters)")
        
    return {
        "Age": age,
        "Academic Pressure": acad_pressure,
        "CGPA": cgpa,
        "Study Satisfaction": study_sat,
        "Work/Study Hours": work_hours,
        "Financial Stress": fin_stress,
        "Gender": gender,
        "Sleep Duration": sleep_dur,
        "Dietary Habits": diet,
        "Degree": degree
    }

def determine_risk_tier(probability: float) -> Dict[str, str]:
    """
    Map screening probability to calibrated statistical survey indicator with guidance.
    """
    if probability < 0.35:
        return {
            "tier": "Low Statistical Alignment",
            "badge_color": "#10B981", # Emerald Green
            "badge_bg": "#ECFDF5",
            "summary": "Current questionnaire patterns show low statistical association with elevated distress indicators in the historical student survey benchmark.",
            "status": "Low Survey Alignment"
        }
    elif probability < 0.65:
        return {
            "tier": "Moderate Statistical Alignment",
            "badge_color": "#F59E0B", # Amber
            "badge_bg": "#FEF3C7",
            "summary": "Notable academic workload, sleep patterns, or study stress that statistically correlate with self-reported emotional fatigue in student survey data.",
            "status": "Moderate Survey Alignment"
        }
    else:
        return {
            "tier": "Elevated Statistical Alignment",
            "badge_color": "#EF4444", # Rose/Red
            "badge_bg": "#FEE2E2",
            "summary": "Academic pressure, sleep deprivation, and study patterns associate with elevated distress in the survey dataset. This is an experimental statistical association, not a medical or clinical diagnosis.",
            "status": "Elevated Survey Alignment"
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
        
    # Validate and construct single-row DataFrame with strict 10-feature schema matching
    row_dict = validate_ml_inputs(input_data)
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
                "impact": "Increases Survey Alignment" if s_val > 0 else "Decreases Survey Alignment",
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
