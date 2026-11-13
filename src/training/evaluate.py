"""
src/training/evaluate.py
Standardized evaluation metrics for classification experiments:
Accuracy, Precision, Recall, Specificity, F1-Score, ROC-AUC, and Brier Score.
"""

import numpy as np
from typing import Dict, Any, List, Optional
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

def compute_classification_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_prob: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Calculate comprehensive evaluation metrics for binary classification.
    """
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    
    cm = confusion_matrix(y_true, y_pred)
    
    # Specificity: TN / (TN + FP)
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
        spec = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    else:
        spec = 0.0
        
    roc_auc = None
    brier = None
    
    if y_prob is not None:
        try:
            # Handle 1D or 2D probability outputs
            if len(y_prob.shape) == 2 and y_prob.shape[1] > 1:
                prob_pos = y_prob[:, 1]
            else:
                prob_pos = y_prob
                
            roc_auc = float(roc_auc_score(y_true, prob_pos))
            brier = float(brier_score_loss(y_true, prob_pos))
        except Exception:
            pass
            
    clf_dict = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
    
    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "specificity": round(spec, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
        "brier_score": round(brier, 4) if brier is not None else None,
        "confusion_matrix": cm.tolist(),
        "classification_report": clf_dict
    }

def format_metrics_summary(metrics: Dict[str, Any]) -> str:
    """Format key metrics as a clean, readable text block."""
    lines = [
        f"Accuracy:    {metrics['accuracy']:.4f}  ({metrics['accuracy']*100:.2f}%)",
        f"Precision:   {metrics['precision']:.4f}  ({metrics['precision']*100:.2f}%)",
        f"Recall:      {metrics['recall']:.4f}  ({metrics['recall']*100:.2f}%)",
        f"Specificity: {metrics['specificity']:.4f}  ({metrics['specificity']*100:.2f}%)",
        f"F1-Score:    {metrics['f1_score']:.4f}",
    ]
    if metrics.get("roc_auc") is not None:
        lines.append(f"ROC-AUC:     {metrics['roc_auc']:.4f}")
    if metrics.get("brier_score") is not None:
        lines.append(f"Brier Score: {metrics['brier_score']:.4f}")
    return "\n".join(lines)
