"""
src/training/experiment.py
Data structures representing an executed machine learning experiment.
"""

from dataclasses import dataclass, asdict
from typing import Dict, List, Any, Optional

@dataclass
class ExperimentRun:
    experiment_id: str
    dataset_name: str
    dataset_fingerprint: str
    total_rows: int
    total_cols: int
    target_column: str
    task_type: str
    numerical_features: List[str]
    categorical_features: List[str]
    excluded_columns: List[str]
    model_name: str
    hyperparameters: Dict[str, Any]
    random_seed: int
    split_ratios: Dict[str, float]
    train_metrics: Dict[str, Any]
    val_metrics: Dict[str, Any]
    test_metrics: Dict[str, Any]
    training_duration_seconds: float
    created_at: str
    artifact_path: str
    is_production_candidate: bool = False
    is_approved: bool = False
    status: str = "COMPLETED"
    notes: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
        
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ExperimentRun":
        return cls(**data)
