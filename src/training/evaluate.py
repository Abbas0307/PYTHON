"""
src/training/evaluate.py
Standardized evaluation metrics for binary classification experiments:
Accuracy, Precision, Recall, Specificity, F1-Score, ROC-AUC, and Brier Score.
Enforces explicit class ordering: labels=[0, 1] -> [[TN, FP], [FN, TP]].
"""

import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    brier_score_loss,
    classification_report
)

# Documented Class Order:
# Index 0: Negative Class (0 - Non-Depressed)
# Index 1: Positive Class (1 - Depressed)
CLASS_LABELS = [0, 1]

def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Calculate comprehensive evaluation metrics for binary classification with
    strict mathematical consistency and documented class ordering.
    
    Confusion Matrix Layout:
        [[True Negatives (TN),  False Positives (FP)],
         [False Negatives (FN), True Positives (TP)]]
    """
    y_true_arr = np.asarray(y_true).astype(int)
    y_pred_arr = np.asarray(y_pred).astype(int)
    
    # 1. Confusion Matrix with explicit labels [0, 1]
    cm = confusion_matrix(y_true_arr, y_pred_arr, labels=CLASS_LABELS)
    tn, fp, fn, tp = cm.ravel()
    total = int(tn + fp + fn + tp)
    
    # 2. Mathematical recalculation with zero-division safeguards
    acc = float((tp + tn) / total) if total > 0 else 0.0
    prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
    
    # 3. Probability-based metrics (ROC-AUC & Brier score)
    roc_auc = None
    brier = None
    
    if y_prob is not None:
        try:
            y_prob_arr = np.asarray(y_prob)
            if len(y_prob_arr.shape) == 2 and y_prob_arr.shape[1] > 1:
                prob_pos = y_prob_arr[:, 1]
            else:
                prob_pos = y_prob_arr
                
            roc_auc = float(roc_auc_score(y_true_arr, prob_pos))
            brier = float(brier_score_loss(y_true_arr, prob_pos))
        except Exception:
            pass
            
    clf_dict = classification_report(
        y_true_arr, y_pred_arr,
        labels=CLASS_LABELS,
        target_names=["Non-Depressed (0)", "Depressed (1)"],
        output_dict=True,
        zero_division=0
    )
    
    metrics = {
        "total_samples": total,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "specificity": round(spec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "brier_score": round(brier, 4) if brier is not None else None,
        "confusion_matrix": cm.tolist(),
        "confusion_matrix_breakdown": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        },
        "classification_report": clf_dict
    }
    
    # Verify mathematical consistency
    is_consistent, reason = verify_metric_consistency(metrics)
    if not is_consistent:
        raise ValueError(f"Metric calculation inconsistency detected: {reason}")
        
    return metrics

def verify_metric_consistency(metrics: Dict[str, Any]) -> Tuple[bool, str]:
    """
    Verify that reported metrics are mathematically consistent with the confusion matrix elements.
    """
    cm = metrics.get("confusion_matrix")
    if not cm or len(cm) != 2 or len(cm[0]) != 2:
        return False, "Confusion matrix must be 2x2 list."
        
    tn = cm[0][0]
    fp = cm[0][1]
    fn = cm[1][0]
    tp = cm[1][1]
    total = tn + fp + fn + tp
    
    if total != metrics.get("total_samples", total):
        return False, f"Confusion matrix sum ({total}) does not match total_samples ({metrics.get('total_samples')})."
        
    expected_acc = round(float((tp + tn) / total), 4) if total > 0 else 0.0
    if abs(expected_acc - metrics["accuracy"]) > 0.001:
        return False, f"Accuracy mismatch: expected {expected_acc}, got {metrics['accuracy']}"
        
    expected_prec = round(float(tp / (tp + fp)), 4) if (tp + fp) > 0 else 0.0
    if abs(expected_prec - metrics["precision"]) > 0.001:
        return False, f"Precision mismatch: expected {expected_prec}, got {metrics['precision']}"
        
    expected_rec = round(float(tp / (tp + fn)), 4) if (tp + fn) > 0 else 0.0
    if abs(expected_rec - metrics["recall"]) > 0.001:
        return False, f"Recall mismatch: expected {expected_rec}, got {metrics['recall']}"
        
    expected_spec = round(float(tn / (tn + fp)), 4) if (tn + fp) > 0 else 0.0
    if abs(expected_spec - metrics["specificity"]) > 0.001:
        return False, f"Specificity mismatch: expected {expected_spec}, got {metrics['specificity']}"
        
    p = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    r = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    expected_f1 = round(float(2 * p * r / (p + r)), 4) if (p + r) > 0 else 0.0
    if abs(expected_f1 - metrics["f1_score"]) > 0.001:
        return False, f"F1 mismatch: expected {expected_f1}, got {metrics['f1_score']}"
        
    return True, "Metrics are mathematically consistent with confusion matrix."

def format_metrics_summary(metrics: Dict[str, Any]) -> str:
    """Format key metrics as a clean, readable text block."""
    cm = metrics.get("confusion_matrix", [[0, 0], [0, 0]])
    lines = [
        f"Total Evaluation Samples: {metrics.get('total_samples', 0):,}",
        f"Accuracy:    {metrics['accuracy']:.4f}  ({metrics['accuracy']*100:.2f}%)",
        f"Precision:   {metrics['precision']:.4f}  ({metrics['precision']*100:.2f}%)",
        f"Recall:      {metrics['recall']:.4f}  ({metrics['recall']*100:.2f}%)",
        f"Specificity: {metrics['specificity']:.4f}  ({metrics['specificity']*100:.2f}%)",
        f"F1-Score:    {metrics['f1_score']:.4f}",
        f"Confusion Matrix: [[TN={cm[0][0]}, FP={cm[0][1]}], [FN={cm[1][0]}, TP={cm[1][1]}]]"
    ]
    if metrics.get("roc_auc") is not None:
        lines.append(f"ROC-AUC:     {metrics['roc_auc']:.4f}")
    if metrics.get("brier_score") is not None:
        lines.append(f"Brier Score: {metrics['brier_score']:.4f}")
    return "\n".join(lines)
