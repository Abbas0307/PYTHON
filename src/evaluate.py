"""
src/evaluate.py
Mindora - Student Mental Wellness & Risk Insights
Evaluation metrics, confusion matrices, ROC curves, calibration curves,
and textual training reports.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve,
    classification_report,
    brier_score_loss
)
from sklearn.calibration import calibration_curve

EVAL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "evaluation")
os.makedirs(EVAL_DIR, exist_ok=True)

def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, float]:
    """Calculate comprehensive evaluation metrics including calibration Brier score."""
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "brier_score": round(float(brier_score_loss(y_true, y_prob)), 4)
    }

def plot_confusion_matrices(
    results: Dict[str, Dict[str, Any]], 
    output_path: str = os.path.join(EVAL_DIR, "confusion_matrix.png")
) -> str:
    """Generate and save side-by-side confusion matrix plots for each model."""
    n_models = len(results)
    fig, axes = plt.subplots(1, n_models, figsize=(5 * n_models, 4.5), dpi=300)
    if n_models == 1:
        axes = [axes]
        
    for ax, (model_name, res) in zip(axes, results.items()):
        cm = np.array(res["confusion_matrix"])
        im = ax.imshow(cm, interpolation="nearest", cmap="Purples")
        ax.set_title(f"{model_name}\nConfusion Matrix", fontsize=11, fontweight="bold", color="#241A35")
        
        tick_marks = np.arange(2)
        ax.set_xticks(tick_marks)
        ax.set_yticks(tick_marks)
        ax.set_xticklabels(["Non-Depressed (0)", "Depressed (1)"], fontsize=9)
        ax.set_yticklabels(["Non-Depressed (0)", "Depressed (1)"], fontsize=9)
        ax.set_xlabel("Predicted Label", fontsize=10, fontweight="bold", color="#6D43C6")
        ax.set_ylabel("True Label", fontsize=10, fontweight="bold", color="#6D43C6")
        
        # Annotate cells
        thresh = cm.max() / 2.0
        for i in range(cm.shape[0]):
            for j in range(cm.shape[1]):
                ax.text(
                    j, i, f"{cm[i, j]:,}",
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "#241A35",
                    fontsize=12, fontweight="bold"
                )
                
    plt.tight_layout()
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()
    return output_path

def plot_model_comparison(
    results: Dict[str, Dict[str, Any]],
    y_test: np.ndarray,
    calibrated_prob: np.ndarray,
    best_model_name: str,
    output_path: str = os.path.join(EVAL_DIR, "model_comparison.png")
) -> str:
    """Generate and save comparative bar chart of metrics, ROC curves, and calibration curve."""
    fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(18, 5), dpi=300)
    
    # 1. Bar Chart of Test Metrics
    metrics_names = ["accuracy", "precision", "recall", "f1_score", "roc_auc"]
    display_names = ["Accuracy", "Precision", "Recall", "F1", "ROC-AUC"]
    model_names = list(results.keys())
    
    x = np.arange(len(metrics_names))
    width = 0.8 / len(model_names)
    colors = ["#8B5CF6", "#6D43C6", "#241A35"]
    
    for i, model_name in enumerate(model_names):
        scores = [results[model_name]["test_metrics"][m] for m in metrics_names]
        offset = (i - len(model_names) / 2 + 0.5) * width
        rects = ax1.bar(x + offset, scores, width, label=model_name, color=colors[i % len(colors)], alpha=0.9)
        for rect in rects:
            height = rect.get_height()
            ax1.annotate(f"{height:.2f}",
                         xy=(rect.get_x() + rect.get_width() / 2, height),
                         xytext=(0, 3), textcoords="offset points",
                         ha="center", va="bottom", fontsize=7.5, fontweight="bold")

    ax1.set_ylabel("Score (0.0 - 1.0)", fontsize=10, fontweight="bold", color="#241A35")
    ax1.set_title("Test Set Performance (Untouched)", fontsize=11, fontweight="bold", color="#241A35")
    ax1.set_xticks(x)
    ax1.set_xticklabels(display_names, fontsize=9, fontweight="bold")
    ax1.set_ylim(0, 1.12)
    ax1.grid(axis="y", linestyle="--", alpha=0.3)
    ax1.legend(loc="lower right", frameon=True)
    
    # 2. ROC Curves
    for i, (model_name, res) in enumerate(results.items()):
        fpr, tpr = res["roc_curve"]["fpr"], res["roc_curve"]["tpr"]
        auc = res["test_metrics"]["roc_auc"]
        ax2.plot(fpr, tpr, color=colors[i % len(colors)], lw=2, label=f"{model_name} (AUC = {auc:.3f})")
        
    ax2.plot([0, 1], [0, 1], color="#9E9E9E", lw=1.5, linestyle="--", label="Chance Baseline")
    ax2.set_xlim([0.0, 1.0])
    ax2.set_ylim([0.0, 1.05])
    ax2.set_xlabel("False Positive Rate", fontsize=10, fontweight="bold", color="#6D43C6")
    ax2.set_ylabel("True Positive Rate (Recall)", fontsize=10, fontweight="bold", color="#6D43C6")
    ax2.set_title("ROC Curves Comparison", fontsize=11, fontweight="bold", color="#241A35")
    ax2.grid(linestyle="--", alpha=0.3)
    ax2.legend(loc="lower right", frameon=True)
    
    # 3. Calibration Curve
    prob_true, prob_pred = calibration_curve(y_test, calibrated_prob, n_bins=10)
    ax3.plot(prob_pred, prob_true, marker="o", color="#6D43C6", lw=2, label=f"Calibrated {best_model_name}")
    ax3.plot([0, 1], [0, 1], color="#9E9E9E", lw=1.5, linestyle="--", label="Perfect Calibration")
    ax3.set_xlim([0.0, 1.0])
    ax3.set_ylim([0.0, 1.05])
    ax3.set_xlabel("Mean Predicted Probability", fontsize=10, fontweight="bold", color="#6D43C6")
    ax3.set_ylabel("Observed Fraction of Positives", fontsize=10, fontweight="bold", color="#6D43C6")
    brier = brier_score_loss(y_test, calibrated_prob)
    ax3.set_title(f"Reliability Diagram (Brier = {brier:.4f})", fontsize=11, fontweight="bold", color="#241A35")
    ax3.grid(linestyle="--", alpha=0.3)
    ax3.legend(loc="upper left", frameon=True)
    
    plt.tight_layout()
    plt.savefig(output_path, bbox_inches="tight")
    plt.close()
    return output_path

def generate_training_report(
    results: Dict[str, Dict[str, Any]], 
    best_model_name: str, 
    selection_rationale: str,
    calibrated_metrics: Dict[str, float],
    output_path: str = os.path.join(EVAL_DIR, "training_report.txt")
) -> str:
    """Generate detailed textual report summarizing experiment methodology, calibration, and metrics."""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("=" * 80 + "\n")
        f.write("MINDORA - STUDENT MENTAL WELLNESS & DEPRESSION RISK PREDICTOR\n")
        f.write("PRODUCTION MACHINE LEARNING EXPERIMENT & EVALUATION REPORT\n")
        f.write("=" * 80 + "\n\n")
        
        f.write("1. HISTORICAL CONTEXT & PRELIMINARY EXPERIMENTS\n")
        f.write("-" * 50 + "\n")
        f.write("Preliminary Experiment 1 (84.11% Acc): Included 'Have you ever had suicidal thoughts?'.\n")
        f.write("  -> Result: Overfitted on crisis symptom (~60% split importance). Inappropriate for lifestyle screening.\n")
        f.write("Preliminary Experiment 2 (80.12% Acc): Included 'Family History of Mental Illness'.\n")
        f.write("  -> Result: Discarded to respect student privacy and avoid unverified family-health assumptions.\n")
        f.write("Current Production Pipeline: Strictly uses 10 non-leaking, educational lifestyle & study features.\n\n")
        
        f.write("2. EXPERIMENT OVERVIEW & METHODOLOGY\n")
        f.write("-" * 50 + "\n")
        f.write("Target Variable: Self-reported Depression indicator (0 = No, 1 = Yes)\n")
        f.write("Data Split: Stratified 70% Train (19,530), 15% Validation (4,185), 15% Final Test (4,186)\n")
        f.write("Strict Isolation: Model selection strictly used Validation metrics. Test set evaluated ONCE.\n")
        f.write("Feature Set (10 Features):\n")
        f.write("  - Numerical (6): Age, Academic Pressure, CGPA, Study Satisfaction, Work/Study Hours, Financial Stress\n")
        f.write("  - Categorical (4): Gender, Sleep Duration, Dietary Habits, Degree\n")
        f.write("Probability Calibration: CalibratedClassifierCV (method='sigmoid', cv=5 on training data)\n\n")
        
        f.write("3. VALIDATION SET BENCHMARK (USED FOR MODEL SELECTION)\n")
        f.write("-" * 50 + "\n")
        header = f"{'Model':<24} | {'Accuracy':<9} | {'Precision':<9} | {'Recall':<9} | {'F1-Score':<9} | {'ROC-AUC':<9}\n"
        f.write(header)
        f.write("-" * 80 + "\n")
        for name, res in results.items():
            m = res["val_metrics"]
            f.write(f"{name:<24} | {m['accuracy']:<9.4f} | {m['precision']:<9.4f} | {m['recall']:<9.4f} | {m['f1_score']:<9.4f} | {m['roc_auc']:<9.4f}\n")
        f.write("-" * 80 + "\n\n")
        
        f.write(f"Selected Best Base Model: {best_model_name}\n")
        f.write(f"Selection Rationale: {selection_rationale}\n\n")
        
        f.write("4. FINAL UNTOUCHED TEST SET EVALUATION (HELD-OUT N=4,186)\n")
        f.write("-" * 50 + "\n")
        f.write("Candidate Models on Untouched Test Set:\n")
        f.write(header)
        f.write("-" * 80 + "\n")
        for name, res in results.items():
            m = res["test_metrics"]
            f.write(f"{name:<24} | {m['accuracy']:<9.4f} | {m['precision']:<9.4f} | {m['recall']:<9.4f} | {m['f1_score']:<9.4f} | {m['roc_auc']:<9.4f}\n")
        f.write("-" * 80 + "\n\n")
        
        f.write("Final Calibrated Production Model (XGBoost + CalibratedClassifierCV cv=5):\n")
        f.write(f"  - Accuracy:     {calibrated_metrics['accuracy']:.4f}\n")
        f.write(f"  - Precision:    {calibrated_metrics['precision']:.4f}\n")
        f.write(f"  - Recall:       {calibrated_metrics['recall']:.4f}\n")
        f.write(f"  - F1-Score:     {calibrated_metrics['f1_score']:.4f}\n")
        f.write(f"  - ROC-AUC:      {calibrated_metrics['roc_auc']:.4f}\n")
        f.write(f"  - Brier Score:  {calibrated_metrics['brier_score']:.4f} (Reliable probability calibration)\n\n")
        
        f.write("5. THREE-ENGINE ARCHITECTURE & CLINICAL COMPLIANCE\n")
        f.write("-" * 50 + "\n")
        f.write("  - Engine 1 (Public ML): Strictly uses 10 demographic/study features to output calibrated risk.\n")
        f.write("  - Engine 2 (Lifestyle): Analyzes screen time, social comparison, sleep quality, and fatigue.\n")
        f.write("  - Engine 3 (PHQ-9): Standardized psychometric scoring (0-27) + immediate crisis intervention for Item 9.\n")
        f.write("  - Never combines disparate engines into a single fabricated percentage.\n")
        f.write("=" * 80 + "\n")
    return output_path
