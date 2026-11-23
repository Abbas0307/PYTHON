"""
ml_lab/evaluation/metrics.py
Standardized evaluation metrics for binary classification and probabilistic calibration.
Implements exact 10-bin equal-width Expected Calibration Error (ECE) and full classification suite.
"""

import numpy as np
from typing import Dict, Any, Tuple, List, Optional
from sklearn.metrics import (
    roc_auc_score,
    brier_score_loss,
    log_loss,
    accuracy_score,
    balanced_accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)

def compute_ece(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    n_bins: int = 10
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Compute Expected Calibration Error (ECE) with equal-width probability bins.
    
    Formula:
        ECE = sum((n_m / N) * abs(mean_probability_m - observed_frequency_m))
        
    Bin boundaries:
        First (n_bins - 1) bins are left-closed, right-open: [lower, upper)
        Final bin is closed on both ends: [lower, upper] (includes 1.0)
        Empty bins (n_m == 0) contribute exactly 0.0 to ECE.
        
    Returns:
        (ece_score, bin_details)
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)
    
    N = len(y_true)
    if N == 0:
        return 0.0, []
        
    bin_edges = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    bin_details = []
    
    for m in range(n_bins):
        lower = bin_edges[m]
        upper = bin_edges[m + 1]
        
        # Final bin includes upper edge (1.0)
        if m == n_bins - 1:
            in_bin = (y_prob >= lower) & (y_prob <= upper)
        else:
            in_bin = (y_prob >= lower) & (y_prob < upper)
            
        n_m = int(np.sum(in_bin))
        if n_m > 0:
            mean_prob_m = float(np.mean(y_prob[in_bin]))
            obs_freq_m = float(np.mean(y_true[in_bin]))
            bin_abs_diff = abs(mean_prob_m - obs_freq_m)
            bin_weight = n_m / N
            bin_ece = bin_weight * bin_abs_diff
            ece += bin_ece
            
            bin_details.append({
                "bin_index": m,
                "lower_bound": round(float(lower), 4),
                "upper_bound": round(float(upper), 4),
                "count": n_m,
                "weight": round(float(bin_weight), 6),
                "mean_predicted_prob": round(mean_prob_m, 6),
                "observed_frequency": round(obs_freq_m, 6),
                "absolute_calibration_error": round(bin_abs_diff, 6),
                "bin_weighted_ece": round(float(bin_ece), 6)
            })
        else:
            bin_details.append({
                "bin_index": m,
                "lower_bound": round(float(lower), 4),
                "upper_bound": round(float(upper), 4),
                "count": 0,
                "weight": 0.0,
                "mean_predicted_prob": 0.0,
                "observed_frequency": 0.0,
                "absolute_calibration_error": 0.0,
                "bin_weighted_ece": 0.0
            })
            
    return float(ece), bin_details

def compute_binary_metrics(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.50
) -> Dict[str, Any]:
    """
    Calculate full suite of classification and calibration metrics.
    
    Metrics:
      - ROC-AUC (Primary)
      - Brier score
      - Expected Calibration Error (ECE, 10 bins)
      - Accuracy
      - Balanced Accuracy
      - Precision
      - Recall / Sensitivity
      - Specificity
      - F1 Score
      - Confusion Matrix [[TN, FP], [FN, TP]]
    """
    y_true = np.asarray(y_true).astype(int)
    y_prob = np.asarray(y_prob).astype(float)
    y_pred = (y_prob >= threshold).astype(int)
    
    total_samples = len(y_true)
    positive_samples = int(np.sum(y_true == 1))
    negative_samples = int(np.sum(y_true == 0))
    
    # 1. ROC-AUC (Undefined if only one class is present)
    unique_classes = np.unique(y_true)
    if len(unique_classes) >= 2:
        try:
            roc_auc = float(roc_auc_score(y_true, y_prob))
        except Exception:
            roc_auc = None
    else:
        roc_auc = None
        
    # 2. Brier Score & Log Loss (Clipped to [1e-15, 1 - 1e-15] to prevent infinite cross-entropy)
    brier = float(brier_score_loss(y_true, y_prob))
    clipped_prob = np.clip(y_prob, 1e-15, 1.0 - 1e-15)
    loss_log = float(log_loss(y_true, clipped_prob))
    
    # 3. Expected Calibration Error
    ece, bin_details = compute_ece(y_true, y_prob, n_bins=10)
    
    # 4. Confusion Matrix and Derived Quantities
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]
    
    acc = float(accuracy_score(y_true, y_pred))
    balanced_acc = float(balanced_accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    
    return {
        "total_samples": total_samples,
        "positive_samples": positive_samples,
        "negative_samples": negative_samples,
        "decision_threshold": threshold,
        "roc_auc": round(roc_auc, 6) if roc_auc is not None else None,
        "brier_score": round(brier, 6),
        "log_loss": round(loss_log, 6),
        "ece": round(ece, 6),
        "accuracy": round(acc, 6),
        "balanced_accuracy": round(balanced_acc, 6),
        "precision": round(prec, 6),
        "recall": round(rec, 6),
        "specificity": round(spec, 6),
        "f1_score": round(f1, 6),
        "confusion_matrix": [[tn, fp], [fn, tp]],
        "confusion_matrix_breakdown": {
            "tn": tn,
            "fp": fp,
            "fn": fn,
            "tp": tp
        },
        "ece_bin_details": bin_details
    }
