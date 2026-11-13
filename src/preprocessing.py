"""
src/preprocessing.py
Mindora - Student Mental Wellness & Risk Insights
Feature engineering, cleaning, imputation, and column transformation pipelines.
Uses strictly 10 validated public dataset features (6 numerical, 4 categorical).
Excludes suicidal ideation, family history, and uninformative/leaking columns.
"""

import pandas as pd
import numpy as np
from typing import Tuple, List, Dict
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

# Strictly verified public dataset feature schema
NUMERICAL_FEATURES = [
    "Age",
    "Academic Pressure",
    "CGPA",
    "Study Satisfaction",
    "Work/Study Hours",
    "Financial Stress"
]

CATEGORICAL_FEATURES = [
    "Gender",
    "Sleep Duration",
    "Dietary Habits",
    "Degree"
]

ALL_MODEL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COLUMN = "Depression"

DROPPED_COLUMNS = [
    "id",
    "Work Pressure",
    "Job Satisfaction",
    "Profession",
    "City",
    "Have you ever had suicidal thoughts ?",
    "Family History of Mental Illness"
]

def clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove identifiers, clinical crisis symptoms, family history, and constant columns.
    Ensures that only the 10 approved features and target remain.
    """
    cleaned = df.copy()
    
    # Drop irrelevant, sensitive, and leaking columns
    for col in DROPPED_COLUMNS:
        if col in cleaned.columns:
            cleaned.drop(columns=[col], inplace=True)
            
    # Remove rows where target is missing if target exists
    if TARGET_COLUMN in cleaned.columns:
        cleaned = cleaned.dropna(subset=[TARGET_COLUMN])
        cleaned[TARGET_COLUMN] = cleaned[TARGET_COLUMN].astype(int)
        
    # Standardize string representations
    for col in CATEGORICAL_FEATURES:
        if col in cleaned.columns:
            cleaned[col] = cleaned[col].astype(str).str.strip()
            
    # Clean numerical ranges (clip academic pressure to 1-5, study satisfaction to 1-5)
    if "Academic Pressure" in cleaned.columns:
        cleaned["Academic Pressure"] = cleaned["Academic Pressure"].clip(lower=1.0, upper=5.0)
    if "Study Satisfaction" in cleaned.columns:
        cleaned["Study Satisfaction"] = cleaned["Study Satisfaction"].clip(lower=1.0, upper=5.0)
    if "Financial Stress" in cleaned.columns:
        cleaned["Financial Stress"] = cleaned["Financial Stress"].clip(lower=1.0, upper=5.0)
        
    return cleaned

def create_preprocessor() -> ColumnTransformer:
    """
    Create a robust Scikit-learn ColumnTransformer for numerical and categorical features.
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, NUMERICAL_FEATURES),
            ("cat", cat_pipeline, CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor

def get_train_val_test_data(
    df: pd.DataFrame, 
    test_size: float = 0.15, 
    val_size: float = 0.15, 
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series, pd.Series]:
    """
    Split cleaned data into Stratified Train (70%), Validation (15%), and Test (15%) sets.
    Preserves class balance with a consistent random state to eliminate leakage.
    """
    cleaned = clean_dataframe(df)
    X = cleaned[ALL_MODEL_FEATURES]
    y = cleaned[TARGET_COLUMN]
    
    # First split into train_val (85%) and test (15%)
    X_train_val, X_test, y_train_val, y_test = train_test_split(
        X, y, 
        test_size=test_size, 
        random_state=random_state, 
        stratify=y
    )
    
    # Second split train_val into train (70% of total) and validation (15% of total)
    val_relative_size = val_size / (1.0 - test_size)
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_val, y_train_val, 
        test_size=val_relative_size, 
        random_state=random_state, 
        stratify=y_train_val
    )
    
    return X_train, X_val, X_test, y_train, y_val, y_test

def get_feature_names(fitted_preprocessor: ColumnTransformer) -> List[str]:
    """
    Extract transformed feature names from the fitted ColumnTransformer.
    """
    feature_names = list(NUMERICAL_FEATURES)
    cat_encoder = fitted_preprocessor.named_transformers_["cat"].named_steps["encoder"]
    cat_ohe_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    return feature_names + cat_ohe_names
