"""
src/data_loader.py
Mindora - Student Mental Wellness & Risk Insights
Data loading, inspection, and exploratory data analysis utilities.
"""

import os
import pandas as pd
from typing import Dict, Any, Tuple

DEFAULT_DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dataset", "Student_Depression_Dataset.csv")

def load_raw_data(filepath: str = DEFAULT_DATASET_PATH) -> pd.DataFrame:
    """Load raw dataset from CSV file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    df = pd.read_csv(filepath)
    return df

def analyze_dataset_integrity(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Inspect raw dataset for shape, types, missing values, duplicates,
    class distribution, and potential data leakage.
    """
    total_rows, total_cols = df.shape
    duplicates = int(df.duplicated().sum())
    missing = df.isnull().sum().to_dict()
    missing_cols = {col: count for col, count in missing.items() if count > 0}
    
    target_col = "Depression"
    if target_col in df.columns:
        class_dist = df[target_col].value_counts().to_dict()
        class_dist_pct = df[target_col].value_counts(normalize=True).round(4).to_dict()
    else:
        class_dist, class_dist_pct = {}, {}
        
    leakage_analysis = {
        "id": "Identifier token with no semantic meaning. Dropped to prevent spurious memorization.",
        "Work Pressure": f"99.99% zeros ({(df['Work Pressure'] == 0).sum() if 'Work Pressure' in df.columns else 0}/{total_rows}). Irrelevant for student population.",
        "Job Satisfaction": f"99.97% zeros ({(df['Job Satisfaction'] == 0).sum() if 'Job Satisfaction' in df.columns else 0}/{total_rows}). Irrelevant for student population.",
        "Profession": f"Over 99.8% 'Student' ({(df['Profession'] == 'Student').sum() if 'Profession' in df.columns else 0}/{total_rows}). Negligible variance.",
        "City": "52 high-cardinality discrete locations. Dropped to avoid regional overfitting.",
        "Have you ever had suicidal thoughts ?": (
            "Severe clinical crisis symptom that strongly correlates with self-reported depression (79% positive rate). "
            "Included with clinical oversight; in deployment, suicidal thoughts trigger immediate crisis intervention independent of ML."
        )
    }

    return {
        "total_rows": total_rows,
        "total_cols": total_cols,
        "columns": list(df.columns),
        "duplicates": duplicates,
        "missing_cols": missing_cols,
        "class_distribution": class_dist,
        "class_distribution_pct": class_dist_pct,
        "leakage_analysis": leakage_analysis,
    }

if __name__ == "__main__":
    df = load_raw_data()
    analysis = analyze_dataset_integrity(df)
    print("Dataset Summary:")
    print(f"- Rows: {analysis['total_rows']}, Cols: {analysis['total_cols']}")
    print(f"- Duplicates: {analysis['duplicates']}")
    print(f"- Missing: {analysis['missing_cols']}")
    print(f"- Class Distribution: {analysis['class_distribution']}")
