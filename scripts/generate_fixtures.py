"""
scripts/generate_fixtures.py
Generates gold-standard reference benchmark test fixtures for Mindora 2.0.
Computes ground-truth probabilities from models/best_model.pkl.
"""

import os
import json
import joblib
import pandas as pd

MODEL_PATH = "models/best_model.pkl"
FIXTURES_PATH = "shared/fixtures/benchmark_cases.json"

pipeline = joblib.load(MODEL_PATH)

fixtures = [
    {
        "id": "case_01_baseline_student",
        "description": "Standard moderate student input",
        "inputs": {
            "Age": 21.0,
            "Academic Pressure": 3.0,
            "CGPA": 8.0,
            "Study Satisfaction": 3.0,
            "Work/Study Hours": 6.0,
            "Financial Stress": 2.0,
            "Gender": "Male",
            "Sleep Duration": "7-8 hours",
            "Dietary Habits": "Moderate",
            "Degree": "B.Tech"
        }
    },
    {
        "id": "case_02_low_stress_student",
        "description": "Low stress, high satisfaction, healthy habits",
        "inputs": {
            "Age": 20.0,
            "Academic Pressure": 1.0,
            "CGPA": 9.2,
            "Study Satisfaction": 5.0,
            "Work/Study Hours": 4.0,
            "Financial Stress": 1.0,
            "Gender": "Female",
            "Sleep Duration": "7-8 hours",
            "Dietary Habits": "Healthy",
            "Degree": "BSc"
        }
    },
    {
        "id": "case_03_elevated_pressure_student",
        "description": "Extreme workload, financial strain, poor sleep",
        "inputs": {
            "Age": 24.0,
            "Academic Pressure": 5.0,
            "CGPA": 6.5,
            "Study Satisfaction": 1.0,
            "Work/Study Hours": 12.0,
            "Financial Stress": 5.0,
            "Gender": "Male",
            "Sleep Duration": "Less than 5 hours",
            "Dietary Habits": "Unhealthy",
            "Degree": "M.Tech"
        }
    },
    {
        "id": "case_04_unseen_category_student",
        "description": "Unseen degree and category to test handle_unknown ignore",
        "inputs": {
            "Age": 22.0,
            "Academic Pressure": 3.0,
            "CGPA": 7.5,
            "Study Satisfaction": 3.0,
            "Work/Study Hours": 6.0,
            "Financial Stress": 3.0,
            "Gender": "Female",
            "Sleep Duration": "Others",
            "Dietary Habits": "Others",
            "Degree": "UnknownDegreeXYZ"
        }
    }
]

for item in fixtures:
    df_row = pd.DataFrame([item["inputs"]])
    prob = float(pipeline.predict_proba(df_row)[0, 1])
    pred_class = int(prob >= 0.5)
    item["expected_output"] = {
        "probability": round(prob, 6),
        "predicted_class": pred_class
    }
    print(f"{item['id']}: Probability = {prob:.4f}, Class = {pred_class}")

os.makedirs(os.path.dirname(FIXTURES_PATH), exist_ok=True)
with open(FIXTURES_PATH, "w", encoding="utf-8") as f:
    json.dump({"schema_version": "1.0.0", "cases": fixtures}, f, indent=2)

print(f"Saved {FIXTURES_PATH} with reference probabilities.")
