"""
src/training/preprocessing.py
Preprocessing pipeline builder using ColumnTransformer.
Ensures imputers and encoders are fitted strictly on training data to prevent leakage.
"""

from typing import List
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer

def build_tabular_preprocessor(
    numerical_features: List[str],
    categorical_features: List[str],
    scale_numeric: bool = True
) -> ColumnTransformer:
    """
    Construct an isolated ColumnTransformer for tabular preprocessing.
    
    Numerical pipeline:
        - Median imputation for missing values
        - Optional StandardScaler (default True)
        
    Categorical pipeline:
        - Most frequent imputation for missing values
        - OneHotEncoder with handle_unknown='ignore'
    """
    transformers = []
    
    if numerical_features:
        num_steps = [("imputer", SimpleImputer(strategy="median"))]
        if scale_numeric:
            num_steps.append(("scaler", StandardScaler()))
        num_pipe = Pipeline(num_steps)
        transformers.append(("num", num_pipe, numerical_features))
        
    if categorical_features:
        cat_pipe = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])
        transformers.append(("cat", cat_pipe, categorical_features))
        
    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    return preprocessor

def get_transformed_feature_names(
    preprocessor: ColumnTransformer,
    numerical_features: List[str],
    categorical_features: List[str]
) -> List[str]:
    """Retrieve output feature names after preprocessor has been fitted on training data."""
    feature_names = []
    
    if numerical_features:
        feature_names.extend(numerical_features)
        
    if categorical_features:
        try:
            encoder = preprocessor.named_transformers_["cat"].named_steps["encoder"]
            cat_encoded = encoder.get_feature_names_out(categorical_features).tolist()
            feature_names.extend(cat_encoded)
        except Exception:
            feature_names.extend(categorical_features)
            
    return feature_names
