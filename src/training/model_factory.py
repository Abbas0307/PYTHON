"""
src/training/model_factory.py
Model factory supporting diverse tabular classification algorithms with
reproducible seeding and default hyperparameter templates.
"""

from typing import Dict, Any, Optional
from sklearn.base import BaseEstimator
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier

# Check optional XGBoost availability
XGBOOST_AVAILABLE = False
try:
    from xgboost import XGBClassifier
    XGBOOST_AVAILABLE = True
except ImportError:
    pass

def get_supported_models() -> Dict[str, Dict[str, Any]]:
    """Return dictionary of supported candidate algorithms with metadata."""
    models = {
        "Baseline (Majority Class)": {
            "family": "Baseline",
            "description": "Predicts the most frequent class. Essential reference benchmark.",
            "available": True,
            "default_params": {"strategy": "most_frequent"}
        },
        "Logistic Regression": {
            "family": "Linear",
            "description": "L2-regularized linear classifier with balanced class weighting.",
            "available": True,
            "default_params": {
                "C": 1.0,
                "max_iter": 1500,
                "class_weight": "balanced",
                "solver": "lbfgs"
            }
        },
        "Random Forest": {
            "family": "Ensemble Bagging",
            "description": "Bootstrap aggregated decision tree ensemble reducing variance.",
            "available": True,
            "default_params": {
                "n_estimators": 100,
                "max_depth": 10,
                "min_samples_split": 5,
                "class_weight": "balanced"
            }
        },
        "XGBoost Classifier": {
            "family": "Gradient Boosting",
            "description": "Extreme Gradient Boosting decision tree ensemble with shrinkage.",
            "available": XGBOOST_AVAILABLE,
            "default_params": {
                "n_estimators": 100,
                "max_depth": 5,
                "learning_rate": 0.08,
                "subsample": 0.85,
                "eval_metric": "logloss"
            }
        }
    }
    return models

def create_model(
    model_name: str, 
    hyperparams: Optional[Dict[str, Any]] = None, 
    random_seed: int = 42
) -> BaseEstimator:
    """
    Instantiate a configured Scikit-Learn or XGBoost classification model.
    """
    params = hyperparams.copy() if hyperparams else {}
    
    if model_name == "Baseline (Majority Class)":
        strat = params.get("strategy", "most_frequent")
        return DummyClassifier(strategy=strat)
        
    elif model_name == "Logistic Regression":
        c_val = float(params.get("C", 1.0))
        max_iter = int(params.get("max_iter", 1500))
        cw = params.get("class_weight", "balanced")
        solver = params.get("solver", "lbfgs")
        return LogisticRegression(
            C=c_val,
            max_iter=max_iter,
            class_weight=cw,
            solver=solver,
            random_state=random_seed
        )
        
    elif model_name == "Random Forest":
        n_est = int(params.get("n_estimators", 100))
        max_d = int(params.get("max_depth", 10)) if params.get("max_depth") else None
        min_split = int(params.get("min_samples_split", 5))
        cw = params.get("class_weight", "balanced")
        return RandomForestClassifier(
            n_estimators=n_est,
            max_depth=max_d,
            min_samples_split=min_split,
            class_weight=cw,
            random_state=random_seed,
            n_jobs=-1
        )
        
    elif model_name == "XGBoost Classifier":
        if not XGBOOST_AVAILABLE:
            raise ImportError("XGBoost is not installed or available in this runtime environment.")
        n_est = int(params.get("n_estimators", 100))
        max_d = int(params.get("max_depth", 5))
        lr = float(params.get("learning_rate", 0.08))
        sub = float(params.get("subsample", 0.85))
        return XGBClassifier(
            n_estimators=n_est,
            max_depth=max_d,
            learning_rate=lr,
            subsample=sub,
            random_state=random_seed,
            eval_metric="logloss"
        )
        
    else:
        raise ValueError(f"Unknown or unsupported model algorithm: '{model_name}'")
