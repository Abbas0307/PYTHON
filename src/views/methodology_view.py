"""
src/views/methodology_view.py
Mindora – Scientific Methodology, Dataset Profiling & Model Benchmark View.
Presents empirical benchmarks, calibration audits, feature importance,
and medical limitation boundaries.
"""

import os
import json
import pandas as pd
import streamlit as st
import plotly.express as px
from PIL import Image

from src.ui_theme import (
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT,
    render_footer
)

def render_methodology():
    """Render scientific methodology, model evaluation, and dataset benchmarks."""
    st.markdown(
        f"""
        <div style="margin-bottom: 24px;">
            <div class="mindora-badge">Scientific Rigor & ML Benchmark</div>
            <h2 style="font-size: 2.2rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Dataset Insights & Model Performance
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Rigorous empirical evaluation on 27,901 student records across 10 clean non-leaking features. 
                Model selected strictly on validation data; historical test split evaluated under strict governance.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Load model comparison JSON
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    comp_path = os.path.join(base_dir, "models", "model_comparison.json")
    comp_data = None
    if os.path.exists(comp_path):
        with open(comp_path, "r", encoding="utf-8") as f:
            comp_data = json.load(f)
        
    cal_m = comp_data.get("calibrated_production_metrics", {}) if comp_data else {}
    
    # Top KPI Metrics Row
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.metric("Total Students Analyzed", "27,901", delta="Public Benchmark")
    with kpi2:
        st.metric("Selected Model", comp_data.get("best_model", "XGBoost") if comp_data else "XGBoost", delta="Validation Selected")
    with kpi3:
        best_auc = cal_m.get("roc_auc", 0.8676)
        st.metric("Test ROC-AUC", f"{best_auc:.4f}", delta="Held-out Test (N=4,186)")
    with kpi4:
        brier = cal_m.get("brier_score", 0.1448)
        st.metric("Calibration Brier Score", f"{brier:.4f}", delta="CalibratedClassifierCV (5-Fold)")
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Visualizations Tabs
    viz_tab1, viz_tab2, viz_tab3, viz_tab4 = st.tabs([
        "1. Validation Selection & Test Benchmark",
        "2. Clean Feature Importance",
        "3. Calibration Curve & Evaluation Plots",
        "4. Historical Experiments & Leakage Analysis"
    ])
    
    # TAB 1: Validation Selection & Test Benchmark
    with viz_tab1:
        st.markdown("#### 🔬 Model Benchmark across Train, Validation, and Held-Out Test Splits")
        if comp_data:
            model_metrics = []
            for m_name, m_info in comp_data.get("models", {}).items():
                vm = m_info["val_metrics"]
                tm = m_info["test_metrics"]
                model_metrics.append({
                    "Model": m_name,
                    "Val F1": vm["f1_score"],
                    "Val ROC-AUC": vm["roc_auc"],
                    "Val Recall": vm["recall"],
                    "Test Accuracy": tm["accuracy"],
                    "Test Recall": tm["recall"],
                    "Test F1-Score": tm["f1_score"],
                    "Test ROC-AUC": tm["roc_auc"],
                    "Test Brier": tm["brier_score"]
                })
            df_comp = pd.DataFrame(model_metrics)
            
            st.dataframe(
                df_comp.style.format({
                    "Val F1": "{:.4f}",
                    "Val ROC-AUC": "{:.4f}",
                    "Val Recall": "{:.4f}",
                    "Test Accuracy": "{:.4f}",
                    "Test Recall": "{:.4f}",
                    "Test F1-Score": "{:.4f}",
                    "Test ROC-AUC": "{:.4f}",
                    "Test Brier": "{:.4f}"
                }).highlight_max(axis=0, color="#E9D5FF"),
                use_container_width=True
            )
            
            st.markdown(
                f"""
                <div style="background: {LIGHT_SURFACE}; padding: 14px; border-radius: 12px; border-left: 4px solid {PRIMARY_VIOLET}; margin-top: 14px;">
                    <strong style="color: {PRIMARY_VIOLET};">Validation Selection Integrity:</strong>
                    <p style="font-size: 0.88rem; color: #475569; margin: 4px 0 0 0;">
                        {comp_data.get('selection_rationale', '')}
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )

    # TAB 2: Clean Feature Importance
    with viz_tab2:
        st.markdown("#### 🌲 Clean Feature Importance (XGBoost Split/Gini Importance)")
        st.caption("Suicidal ideation and family history have been completely removed. Feature importances reflect statistical associations only.")
        fi_path = os.path.join(base_dir, "models", "feature_importance.csv")
        if os.path.exists(fi_path):
            df_fi = pd.read_csv(fi_path).head(15)
            fig_fi = px.bar(
                df_fi,
                x="importance",
                y="feature",
                orientation="h",
                color="importance",
                color_continuous_scale=["#DDD6FE", "#8B5CF6", "#6D43C6"],
                title="Top 15 Most Influential Features (10 Clean Input Schema)"
            )
            fig_fi.update_layout(
                yaxis=dict(autorange="reversed"),
                plot_bgcolor="#FFFFFF",
                paper_bgcolor="#FFFFFF",
                font=dict(family="Plus Jakarta Sans, Inter, sans-serif")
            )
            st.plotly_chart(fig_fi, use_container_width=True)

    # TAB 3: Calibration Curve & Evaluation Plots
    with viz_tab3:
        st.markdown("#### 📈 Reliability Diagram & Evaluation Visual Artifacts")
        st.markdown(
            f"""
            <div style="background: {LIGHT_SURFACE}; padding: 14px 18px; border-radius: 12px; border-left: 4px solid {PRIMARY_VIOLET}; margin-bottom: 16px;">
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.92rem;">Calibration & Reliability Audit:</strong>
                <p style="font-size: 0.85rem; color: #475569; margin: 4px 0 0 0; line-height: 1.55;">
                    The uncalibrated base XGBoost achieved a Brier score of <strong>0.1441</strong>, while the calibrated pipeline 
                    achieved <strong>0.1448</strong> on the held-out test set ($N=4,186$). 
                    Sigmoid scaling smooths extreme risk outputs into reliable empirical percentiles.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        col_img1, col_img2 = st.columns(2)
        with col_img1:
            cm_img_path = os.path.join(base_dir, "evaluation", "confusion_matrix.png")
            if os.path.exists(cm_img_path):
                img = Image.open(cm_img_path)
                st.image(img, caption="Confusion Matrix on Held-Out Test Set (N=4,186)", use_container_width=True)
            else:
                st.info("Confusion matrix artifact not found.")
                
        with col_img2:
            comp_img_path = os.path.join(base_dir, "evaluation", "model_comparison.png")
            if os.path.exists(comp_img_path):
                img_comp = Image.open(comp_img_path)
                st.image(img_comp, caption="Multi-Model ROC-AUC & Precision-Recall Comparison", use_container_width=True)
            else:
                st.info("Model comparison artifact not found.")

    # TAB 4: Historical Experiments & Leakage Analysis
    with viz_tab4:
        st.markdown("#### 🛡️ Target Leakage Analysis & Exclusion Justification")
        st.markdown(
            f"""
            <div class="mindora-card" style="margin-bottom: 14px;">
                <strong style="color: #EF4444; font-size: 0.95rem;">Why Certain Features Were Strictly Excluded:</strong>
                <p style="font-size: 0.86rem; color: #475569; margin: 6px 0 10px 0; line-height: 1.55;">
                    Preliminary modeling experiments achieved artificially inflated accuracy by including circular target-leaking fields.
                    These were deliberately purged from production to maintain scientific validity:
                </p>
                <ul style="font-size: 0.84rem; color: #475569; line-height: 1.7; margin: 0; padding-left: 20px;">
                    <li><strong>Excluded: 'Have you ever had suicidal thoughts ?':</strong> Achieved 84.11% accuracy, but constituted clinical target leakage. Suicidal thoughts trigger crisis hotlines deterministically in Engine 3.</li>
                    <li><strong>Excluded: 'Family History of Mental Illness':</strong> Achieved 80.12% accuracy, but introduced sensitive medical history concerns.</li>
                    <li><strong>Excluded: 'City', 'Profession', 'id':</strong> High-cardinality spurious correlates that cause distribution overfitting.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Architecture & Limitations Overview
    st.markdown("### 🏛️ System Architecture & Medical Scope Boundaries")
    col_ab1, col_ab2 = st.columns(2)
    with col_ab1:
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">1. Three-Engine Architecture</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Mindora maintains strict scientific boundaries across three independent subsystems:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li><strong>Engine 1 (Public ML):</strong> Calibrated XGBoost classifier trained on 10 verified demographic, study, and sleep duration features from 27,901 student records.</li>
                    <li><strong>Engine 2 (Lifestyle Analytics):</strong> Descriptive screen time, social media habits, and sleep quality analysis for personalized self-care advice.</li>
                    <li><strong>Engine 3 (PHQ-9):</strong> Standardized clinical psychometrics (0–27 score) with unconditional crisis escalation for self-harm thoughts.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">3. Privacy Policy & Zero Retention</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Student confidentiality is guaranteed by design:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>No names, emails, student IDs, or contact information are collected.</li>
                    <li>No responses are written to databases, log files, or persistent storage.</li>
                    <li>All computation runs in ephemeral session memory and is destroyed upon tab closure.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )
    with col_ab2:
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">2. Machine Learning Methodology</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Engineered according to rigorous ML best practices:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li><strong>Stratified Split:</strong> 70% Train, 15% Validation, 15% Held-Out Test.</li>
                    <li><strong>Validation Selection:</strong> Model selection conducted strictly on validation metrics; held-out test set evaluated only once.</li>
                    <li><strong>Calibrated Probabilities:</strong> <code>CalibratedClassifierCV(method='sigmoid', cv=5)</code> ensures risk percentages reflect empirical probabilities ($Brier = 0.1448$).</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )
        st.markdown(
            f"""
            <div class="mindora-card">
                <h4 style="color: {PRIMARY_VIOLET}; margin-bottom: 8px;">4. Limitations & Medical Boundaries</h4>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.6; margin-bottom: 10px;">
                    Key technical and medical limitations:
                </p>
                <ul style="font-size: 0.85rem; color: #475569; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li><strong>Not a Diagnosis:</strong> Predictions represent statistical alignment with historical dataset labels, not a medical condition.</li>
                    <li><strong>Correlation $\neq$ Causation:</strong> High feature importance indicates correlation, not that a specific habit caused depression.</li>
                    <li><strong>Deterministic Safety:</strong> Crisis intervention never relies on model predictions; self-harm indicators trigger immediate emergency help.</li>
                </ul>
            </div>
            """,
            unsafe_allow_html=True
        )

    # Full Training Report Viewer
    with st.expander("📄 View Full Machine Learning Training & Evaluation Text Report"):
        rep_file = os.path.join(base_dir, "evaluation", "training_report.txt")
        if os.path.exists(rep_file):
            with open(rep_file, "r", encoding="utf-8") as f:
                st.code(f.read(), language="text")
        else:
            st.info("Report file not generated yet.")
