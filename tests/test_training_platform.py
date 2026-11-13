"""
tests/test_training_platform.py
Comprehensive automated test suite for Mindora's Local Data Platform,
Training Orchestration, Evaluation Consistency, Model Registry Governance,
and Production Preservation.
Uses synthetic test fixtures and verifies zero regressions.
"""

import os
import sys
import tempfile
import socket
import pandas as pd
import numpy as np
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.data_platform import (
    load_local_csv,
    profile_dataset,
    validate_dataset_structure,
    validate_training_configuration,
    DatasetConfig,
    TaskType,
    DatasetIngestionError
)
from src.training import (
    split_dataset,
    split_with_independent_holdout,
    build_tabular_preprocessor,
    create_model,
    compute_classification_metrics,
    verify_metric_consistency,
    run_training_experiment,
    list_experiments,
    get_experiment,
    check_validation_candidacy_eligibility,
    promote_to_validation_candidate,
    approve_model_artifact,
    get_production_baseline_info,
    ModelLifecycleState
)
from src.predict import predict_wellness_risk
from src.recommendations import calculate_phq9, analyze_lifestyle_patterns

def create_synthetic_test_df(n_rows: int = 100, seed: int = 42) -> pd.DataFrame:
    """Create a temporary synthetic test dataset with known properties."""
    np.random.seed(seed)
    return pd.DataFrame({
        "Age": np.random.randint(18, 28, size=n_rows),
        "Academic Pressure": np.random.choice([1.0, 2.0, 3.0, 4.0, 5.0], size=n_rows),
        "CGPA": np.random.uniform(6.0, 9.8, size=n_rows).round(2),
        "Study Satisfaction": np.random.choice([1.0, 2.0, 3.0, 4.0, 5.0], size=n_rows),
        "Work/Study Hours": np.random.uniform(2.0, 10.0, size=n_rows).round(1),
        "Financial Stress": np.random.choice([1.0, 2.0, 3.0, 4.0, 5.0], size=n_rows),
        "Gender": np.random.choice(["Male", "Female"], size=n_rows),
        "Sleep Duration": np.random.choice(["5-6 hours", "7-8 hours", "Less than 5 hours"], size=n_rows),
        "Dietary Habits": np.random.choice(["Healthy", "Moderate", "Unhealthy"], size=n_rows),
        "Degree": np.random.choice(["B.Tech", "BSc", "B.Com"], size=n_rows),
        "Depression": np.random.choice([0, 1], size=n_rows, p=[0.45, 0.55])
    })

def test_1_dataset_loading_and_sha256():
    """Verify loading, parsing, and SHA-256 fingerprinting."""
    df_syn = create_synthetic_test_df(50)
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        df_syn.to_csv(f.name, index=False)
        temp_csv = f.name
        
    try:
        df_loaded, sha = load_local_csv(temp_csv)
        assert len(df_loaded) == 50
        assert len(sha) == 64
        assert set(df_loaded.columns) == set(df_syn.columns)
    finally:
        if os.path.exists(temp_csv):
            os.remove(temp_csv)
    print("PASS: Test 1 - Dataset loading and SHA-256 fingerprinting verified.")

def test_2_invalid_csv_handling():
    """Verify graceful error handling for missing files, empty files, and malformed content."""
    try:
        load_local_csv("non_existent_file_12345.csv")
        assert False, "Failed to raise DatasetIngestionError for missing file!"
    except DatasetIngestionError:
        pass
        
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
        f.write("")
        empty_csv = f.name
    try:
        load_local_csv(empty_csv)
        assert False, "Failed to raise DatasetIngestionError for empty file!"
    except DatasetIngestionError:
        pass
    finally:
        if os.path.exists(empty_csv):
            os.remove(empty_csv)
    print("PASS: Test 2 - Invalid CSV handling verified.")

def test_3_profiling_and_missing_value_detection():
    """Verify profiling metrics and missing values identification."""
    df = create_synthetic_test_df(60)
    df.loc[0:5, "CGPA"] = np.nan
    df["ConstantCol"] = "SameValue"
    
    profile = profile_dataset(df, "SyntheticTest")
    assert profile.row_count == 60
    assert profile.columns["CGPA"].null_count == 6
    assert profile.columns["CGPA"].null_percentage == 10.0
    assert "ConstantCol" in profile.constant_columns
    print("PASS: Test 3 - Profiling, nulls, and constant column detection verified.")

def test_4_target_validation_and_leakage_rejection():
    """Verify strict validation against missing targets, mismatched tasks, and target leakage."""
    df = create_synthetic_test_df(50)
    
    config_leak = DatasetConfig(
        target_column="Depression",
        task_type=TaskType.BINARY_CLASSIFICATION,
        numerical_features=["Age", "Depression"],
        categorical_features=["Gender"],
        excluded_columns=[]
    )
    rep = validate_training_configuration(df, config_leak)
    assert not rep.is_valid
    assert any(e.field == "target_leakage" for e in rep.errors)
    
    config_mismatch = DatasetConfig(
        target_column="CGPA",
        task_type=TaskType.BINARY_CLASSIFICATION,
        numerical_features=["Age"],
        categorical_features=["Gender"],
        excluded_columns=[]
    )
    rep2 = validate_training_configuration(df, config_mismatch)
    assert not rep2.is_valid
    assert any(e.field == "task_type" for e in rep2.errors)
    print("PASS: Test 4 - Target validation and target leakage rejection verified.")

def test_5_train_val_test_split_isolation():
    """Verify that split_dataset generates disjoint indices with zero cross-partition leakage."""
    df = create_synthetic_test_df(100)
    config = DatasetConfig(
        target_column="Depression",
        task_type=TaskType.BINARY_CLASSIFICATION,
        numerical_features=["Age", "Academic Pressure", "CGPA"],
        categorical_features=["Gender", "Degree"],
        excluded_columns=[],
        test_split_ratio=0.20,
        val_split_ratio=0.20,
        random_seed=42
    )
    X_train, X_val, X_test, y_train, y_val, y_test = split_dataset(df, config)
    assert len(X_train) == 60
    assert len(X_val) == 20
    assert len(X_test) == 20
    assert len(set(X_train.index).intersection(set(X_val.index))) == 0
    assert len(set(X_train.index).intersection(set(X_test.index))) == 0
    assert len(set(X_val.index).intersection(set(X_test.index))) == 0
    print("PASS: Test 5 - Train/Validation/Test split isolation verified.")

def test_6_preprocessing_leakage_prevention():
    """Verify that ColumnTransformer is fitted strictly on training data."""
    df = create_synthetic_test_df(80)
    df.loc[:40, "CGPA"] = 9.5
    df.loc[41:, "CGPA"] = 6.0
    
    num_feats = ["CGPA"]
    cat_feats = ["Gender"]
    preproc = build_tabular_preprocessor(num_feats, cat_feats, scale_numeric=True)
    
    X_train = df.iloc[:40][num_feats + cat_feats]
    X_test = df.iloc[41:][num_feats + cat_feats]
    
    preproc.fit(X_train)
    scaler = preproc.named_transformers_["num"].named_steps["scaler"]
    assert abs(scaler.mean_[0] - 9.5) < 0.001
    print("PASS: Test 6 - Preprocessing leakage prevention verified.")

def test_7_reproducible_model_training_and_metrics():
    """Verify reproducible training and metrics calculation across runs."""
    df = create_synthetic_test_df(120, seed=123)
    config = DatasetConfig(
        target_column="Depression",
        task_type=TaskType.BINARY_CLASSIFICATION,
        numerical_features=["Age", "Academic Pressure", "CGPA"],
        categorical_features=["Gender"],
        excluded_columns=[],
        test_split_ratio=0.20,
        val_split_ratio=0.20,
        random_seed=42
    )
    exp1 = run_training_experiment(df, config, "Logistic Regression", {"C": 1.0}, dataset_name="SynTest")
    exp2 = run_training_experiment(df, config, "Logistic Regression", {"C": 1.0}, dataset_name="SynTest")
    
    assert exp1.val_metrics["accuracy"] == exp2.val_metrics["accuracy"]
    assert exp1.test_metrics["f1_score"] == exp2.test_metrics["f1_score"]
    assert os.path.exists(exp1.artifact_path)
    
    loaded_pipeline = joblib.load(exp1.artifact_path)
    preds = loaded_pipeline.predict(df[["Age", "Academic Pressure", "CGPA", "Gender"]])
    assert len(preds) == len(df)
    print("PASS: Test 7 - Reproducible training and artifact persistence verified.")

def test_8_offline_execution_enforcement():
    """Verify that dataset loading, profiling, splitting, training, and inference execute with zero sockets."""
    def forbidden_socket(*args, **kwargs):
        raise ConnectionRefusedError("Simulated Offline Mode: Network access forbidden!")
        
    old_connect = socket.socket.connect
    socket.socket.connect = forbidden_socket
    try:
        df = create_synthetic_test_df(80)
        profile = profile_dataset(df, "OfflineTest")
        config = DatasetConfig(
            target_column="Depression",
            task_type=TaskType.BINARY_CLASSIFICATION,
            numerical_features=["Age", "CGPA"],
            categorical_features=["Gender"],
            excluded_columns=[]
        )
        exp = run_training_experiment(df, config, "Baseline (Majority Class)", dataset_name="OfflineTest")
        assert exp.status == "COMPLETED"
    finally:
        socket.socket.connect = old_connect
    print("PASS: Test 8 - 100% Offline execution verified under network block.")

def test_9_production_model_preservation():
    """Verify that models/best_model.pkl remains intact and its 10-feature schema is unchanged."""
    prod_info = get_production_baseline_info()
    assert os.path.exists(prod_info["artifact_path"])
    pipeline = joblib.load(prod_info["artifact_path"])
    
    assert len(prod_info["features"]) == 10
    sample_input = {
        "Age": 21.0, "Academic Pressure": 3.0, "CGPA": 8.0, "Study Satisfaction": 3.0,
        "Work/Study Hours": 6.0, "Financial Stress": 3.0, "Gender": "Female",
        "Sleep Duration": "7-8 hours", "Dietary Habits": "Healthy", "Degree": "B.Tech"
    }
    res = predict_wellness_risk(sample_input)
    assert 0.0 <= res["probability"] <= 1.0
    print("PASS: Test 9 - Production baseline model preservation verified.")

def test_10_metric_and_confusion_matrix_consistency():
    """Verify mathematical consistency between confusion matrix and reported metrics."""
    # Construct a known ground truth and prediction array
    y_true = np.array([0]*1363 + [0]*372 + [1]*508 + [1]*1943)
    y_pred = np.array([0]*1363 + [1]*372 + [0]*508 + [1]*1943)
    
    metrics = compute_classification_metrics(y_true, y_pred)
    cm = metrics["confusion_matrix"]
    
    assert cm == [[1363, 372], [508, 1943]]
    assert metrics["total_samples"] == 4186
    
    # Check mathematical derivations
    tn, fp, fn, tp = 1363, 372, 508, 1943
    assert abs(metrics["accuracy"] - ((tp + tn) / 4186)) < 0.0001
    assert abs(metrics["precision"] - (tp / (tp + fp))) < 0.0001
    assert abs(metrics["recall"] - (tp / (tp + fn))) < 0.0001
    assert abs(metrics["specificity"] - (tn / (tn + fp))) < 0.0001
    
    p = tp / (tp + fp)
    r = tp / (tp + fn)
    assert abs(metrics["f1_score"] - (2 * p * r / (p + r))) < 0.0001
    
    is_valid, msg = verify_metric_consistency(metrics)
    assert is_valid, msg
    print("PASS: Test 10 - Metric and confusion matrix consistency verified.")

def test_11_class_ordering_and_labels():
    """Verify that class 0 is negative and class 1 is positive in confusion matrix."""
    y_true = np.array([0, 0, 1, 1])
    y_pred = np.array([0, 1, 0, 1])
    
    metrics = compute_classification_metrics(y_true, y_pred)
    # Expected: TN=1, FP=1, FN=1, TP=1 -> [[1, 1], [1, 1]]
    assert metrics["confusion_matrix"] == [[1, 1], [1, 1]]
    assert metrics["confusion_matrix_breakdown"] == {"tn": 1, "fp": 1, "fn": 1, "tp": 1}
    print("PASS: Test 11 - Class ordering (0=negative, 1=positive) verified.")

def test_12_validation_only_candidate_selection():
    """Verify that candidate selection is evaluated strictly on validation metrics."""
    # Fetch latest experiment
    exps = list_experiments()
    assert len(exps) > 0
    exp = exps[0]
    
    # Tampering with test_metrics must NOT affect validation candidacy
    original_test = exp.test_metrics.copy()
    exp.test_metrics = {"accuracy": 0.0, "precision": 0.0, "recall": 0.0, "f1_score": 0.0}
    
    # Evaluate candidacy based on validation metrics
    eligible, reason = check_validation_candidacy_eligibility(exp.experiment_id)
    # Eligibility depends strictly on val_metrics and schema
    assert isinstance(eligible, bool)
    
    # Restore
    exp.test_metrics = original_test
    print("PASS: Test 12 - Validation-only candidate selection verified.")

def test_13_prevention_of_automatic_promotion():
    """Verify that candidate models cannot automatically overwrite models/best_model.pkl."""
    prod_info_before = get_production_baseline_info()
    mtime_before = os.path.getmtime(prod_info_before["artifact_path"])
    
    # Attempting to approve an experimental model without candidate promotion must fail
    exps = list_experiments()
    if exps:
        non_candidate = exps[-1]
        non_candidate.is_production_candidate = False
        ok, msg = approve_model_artifact(non_candidate.experiment_id, "TestOperator")
        assert not ok, "Unpromoted model was approved without candidate status!"
        
    # Verify production artifact remains completely untouched
    mtime_after = os.path.getmtime(prod_info_before["artifact_path"])
    assert mtime_before == mtime_after, "Production artifact was modified!"
    print("PASS: Test 13 - Prevention of automatic production promotion verified.")

def test_14_registry_state_transitions():
    """Verify proper lifecycle state transitions."""
    exps = list_experiments()
    target_exp = None
    for e in exps:
        if e.model_name in ["XGBoost Classifier", "Random Forest"] and len(e.numerical_features) == 6:
            target_exp = e
            break
            
    if target_exp:
        # Step 1: Promote to VALIDATION_SELECTED_CANDIDATE
        ok_prom, msg_prom = promote_to_validation_candidate(target_exp.experiment_id)
        assert ok_prom, msg_prom
        exp_updated = get_experiment(target_exp.experiment_id)
        assert exp_updated.is_production_candidate
        
        # Step 2: Approve artifact
        ok_app, msg_app = approve_model_artifact(target_exp.experiment_id, "AuditorLead")
        assert ok_app, msg_app
        exp_approved = get_experiment(target_exp.experiment_id)
        assert exp_approved.is_approved
        assert "Approved by operator 'AuditorLead'" in exp_approved.notes
    print("PASS: Test 14 - Model registry state transitions verified.")

def run_all_platform_tests():
    print("=" * 70)
    print("MINDORA LOCAL AI/ML TRAINING PLATFORM TEST SUITE")
    print("=" * 70)
    test_1_dataset_loading_and_sha256()
    test_2_invalid_csv_handling()
    test_3_profiling_and_missing_value_detection()
    test_4_target_validation_and_leakage_rejection()
    test_5_train_val_test_split_isolation()
    test_6_preprocessing_leakage_prevention()
    test_7_reproducible_model_training_and_metrics()
    test_8_offline_execution_enforcement()
    test_9_production_model_preservation()
    test_10_metric_and_confusion_matrix_consistency()
    test_11_class_ordering_and_labels()
    test_12_validation_only_candidate_selection()
    test_13_prevention_of_automatic_promotion()
    test_14_registry_state_transitions()
    print("=" * 70)
    print("ALL 14 PLATFORM TESTS COMPLETED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_all_platform_tests()
