"""
src/training/pipeline.py
Pipeline assembler for atomic artifact serialization and inference.
"""

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.base import BaseEstimator

def assemble_training_pipeline(
    preprocessor: ColumnTransformer,
    estimator: BaseEstimator
) -> Pipeline:
    """
    Wrap the fitted preprocessor and trained estimator into a single Scikit-Learn Pipeline.
    Ensures raw tabular records can be ingested directly during inference.
    """
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", estimator)
    ])
    return pipeline
