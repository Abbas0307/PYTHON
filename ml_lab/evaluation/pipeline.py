"""
ml_lab/evaluation/pipeline.py
Model construction pipelines for Stage 3B.2 baselines:
  - Baseline A: DummyClassifier(strategy='prior')
  - Baseline B: Preprocessed Logistic Regression with ColumnTransformer
"""

from typing import List, Optional
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False

def build_dummy_baseline(strategy: str = "prior") -> DummyClassifier:
    """
    Construct a Baseline A DummyClassifier using class prior probabilities.
    Probability predictions match the training fold's positive class prevalence.
    """
    return DummyClassifier(strategy=strategy)

def build_logistic_regression_baseline(
    numerical_features: List[str],
    categorical_features: List[str],
    random_state: int = 42,
    max_iter: int = 1000,
    C: float = 1.0,
    solver: str = "lbfgs"
) -> Pipeline:
    """
    Construct a Baseline B Logistic Regression pipeline with strict inside-fold preprocessing:
      - Numeric: Median imputation followed by StandardScaler.
      - Categorical: Most-frequent imputation followed by OneHotEncoder with safe unknown category handling.
      - Classifier: Standard L2-penalized LogisticRegression.
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer([
        ("num", num_pipeline, numerical_features),
        ("cat", cat_pipeline, categorical_features)
    ])
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", LogisticRegression(
            random_state=random_state,
            max_iter=max_iter,
            C=C,
            solver=solver
        ))
    ])
    
    return pipeline


def build_random_forest_pipeline(
    numerical_features: List[str],
    categorical_features: List[str],
    random_state: int = 42,
    n_estimators: int = 100,
    max_depth: Optional[int] = 10,
    min_samples_split: int = 5,
    min_samples_leaf: int = 2,
    max_features: str = "sqrt",
    n_jobs: int = -1
) -> Pipeline:
    """
    Construct a Random Forest pipeline with strict inside-fold preprocessing:
      - Numeric: Median imputation followed by StandardScaler.
      - Categorical: Most-frequent imputation followed by OneHotEncoder with safe unknown category handling.
      - Classifier: Scikit-learn RandomForestClassifier with depth/split controls.
    """
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer([
        ("num", num_pipeline, numerical_features),
        ("cat", cat_pipeline, categorical_features)
    ])
    
    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            max_features=max_features,
            bootstrap=True,
            random_state=random_state,
            n_jobs=n_jobs,
            class_weight=None
        ))
    ])


def build_xgboost_pipeline(
    numerical_features: List[str],
    categorical_features: List[str],
    random_state: int = 42,
    n_estimators: int = 100,
    max_depth: int = 5,
    learning_rate: float = 0.08,
    subsample: float = 0.85,
    colsample_bytree: float = 0.85,
    reg_lambda: float = 1.0,
    n_jobs: int = -1
) -> Pipeline:
    """
    Construct an XGBoost pipeline with strict inside-fold preprocessing:
      - Numeric: Median imputation followed by StandardScaler.
      - Categorical: Most-frequent imputation followed by OneHotEncoder with safe unknown category handling.
      - Classifier: XGBoost XGBClassifier with tree_method='hist' and logloss objective.
    """
    if not XGBOOST_AVAILABLE:
        raise RuntimeError("xgboost is not installed in the current environment.")
        
    num_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    cat_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer([
        ("num", num_pipeline, numerical_features),
        ("cat", cat_pipeline, categorical_features)
    ])
    
    return Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            reg_lambda=reg_lambda,
            objective="binary:logistic",
            eval_metric="logloss",
            tree_method="hist",
            random_state=random_state,
            n_jobs=n_jobs
        ))
    ])
