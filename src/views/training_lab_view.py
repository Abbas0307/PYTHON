"""
src/views/training_lab_view.py
Internal ML Training Laboratory and Model Governance Console for Mindora.
Provides dataset ingestion, automated profiling, feature/target configuration,
isolated local training, evaluation benchmarking, experiment registry, and promotion checks.
"""

import os
import html
import json
import pandas as pd
import streamlit as st
import plotly.express as px

from src.data_platform import (
    load_local_csv,
    profile_dataset,
    validate_dataset_structure,
    validate_training_configuration,
    DatasetConfig,
    TaskType,
    DatasetIngestionError,
    MAX_UPLOAD_SIZE_BYTES
)
from src.training import (
    get_supported_models,
    run_training_experiment,
    list_experiments,
    get_experiment,
    compare_experiments,
    ModelLifecycleState,
    check_validation_candidacy_eligibility,
    promote_to_validation_candidate,
    approve_model_artifact,
    get_production_baseline_info
)
from src.ui_theme import PRIMARY_VIOLET, SECONDARY_VIOLET, LAVENDER, LIGHT_SURFACE, MAIN_TEXT

DEFAULT_CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dataset", "Student_Depression_Dataset.csv")

def render_training_lab():
    """Render the internal AI/ML training platform console."""
    st.markdown(
        f"""
        <div style="margin-bottom: 22px;">
            <div class="mindora-badge" style="background: {LAVENDER}; color: {PRIMARY_VIOLET};">
                Internal Research & MLOps Console
            </div>
            <h2 style="font-size: 2.1rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Local AI/ML Training Platform & Model Registry
            </h2>
            <p style="color: #64748B; font-size: 0.94rem; margin: 0; max-width: 860px; line-height: 1.55;">
                Fully offline-capable tabular machine learning environment. Ingest local datasets, inspect schema integrity,
                configure isolated train/val/test splits, benchmark candidate algorithms, and govern model promotions
                without affecting the locked production baseline.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # Notice Banner regarding Production Isolation
    st.markdown(
        f"""
        <div style="background: #F8F7FC; border-left: 4px solid {PRIMARY_VIOLET}; padding: 12px 18px; border-radius: 10px; margin-bottom: 22px;">
            <strong style="color: {PRIMARY_VIOLET}; font-size: 0.92rem;">🔒 Production Model Isolation Protocol:</strong>
            <p style="font-size: 0.85rem; color: #475569; margin: 4px 0 0 0; line-height: 1.5;">
                The student-facing production model (<code>models/best_model.pkl</code>) is protected against automatic overwrite.
                All models trained in this console are logged as independent experiments in <code>experiments/</code>.
                Promotion to production requires passing the 10-feature schema audit and explicit operator sign-off.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # 5 Major Lab Tabs
    tab_ingest, tab_train, tab_eval, tab_history, tab_registry = st.tabs([
        "1. Dataset Ingestion & Profiling",
        "2. Feature & Training Config",
        "3. Model Comparison & Metrics",
        "4. Experiment History",
        "5. Model Registry & Promotion"
    ])
    
    # State management for dataset
    if "lab_df" not in st.session_state:
        st.session_state.lab_df = None
        st.session_state.lab_sha = ""
        st.session_state.lab_name = ""
        st.session_state.lab_profile = None

    # =========================================================================
    # TAB 1: DATASET INGESTION & PROFILING
    # =========================================================================
    with tab_ingest:
        st.markdown("#### 📂 Local Dataset Ingestion")
        st.caption("Import CSV files directly from the local computer with automated SHA-256 cryptographic provenance.")
        
        col_in1, col_in2 = st.columns([1.2, 1])
        with col_in1:
            data_source_opt = st.radio(
                "Choose Dataset Source:",
                ["Benchmark Dataset (Default)", "Local File Path", "Upload Local CSV"],
                horizontal=True
            )
            
            target_path = DEFAULT_CSV_PATH
            if data_source_opt == "Local File Path":
                target_path = st.text_input("Enter absolute local CSV path:", value=DEFAULT_CSV_PATH)
            elif data_source_opt == "Upload Local CSV":
                uploaded_file = st.file_uploader(f"Upload local CSV file (max {MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB):", type=["csv"])
                if uploaded_file is not None:
                    target_path = uploaded_file
                    
            if st.button("📥 Load & Profile Dataset", use_container_width=True):
                try:
                    with st.spinner("Ingesting and computing SHA-256 fingerprint..."):
                        if isinstance(target_path, str):
                            df, sha = load_local_csv(target_path, filename=os.path.basename(target_path))
                            name = os.path.basename(target_path)
                        else:
                            df, sha = load_local_csv(target_path, filename=target_path.name, max_size_bytes=MAX_UPLOAD_SIZE_BYTES)
                            name = target_path.name
                            
                        prof = profile_dataset(df, dataset_name=name, sha256_hash=sha)
                        st.session_state.lab_df = df
                        st.session_state.lab_sha = sha
                        st.session_state.lab_name = name
                        st.session_state.lab_profile = prof
                        st.success(f"Successfully loaded '{name}' ({len(df):,} rows, {len(df.columns)} columns)!")
                except Exception as e:
                    st.error(f"Dataset Ingestion Failed: {str(e)}")

        with col_in2:
            if st.session_state.lab_profile is not None:
                p = st.session_state.lab_profile
                st.markdown(
                    f"""
                    <div class="mindora-card" style="padding: 16px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: {PRIMARY_VIOLET}; text-transform: uppercase;">
                            Dataset Provenance & Integrity
                        </span>
                        <h4 style="margin: 4px 0 10px 0; color: #241A35;">{html.escape(p.name)}</h4>
                        <div style="font-size: 0.84rem; color: #475569; line-height: 1.7;">
                            • <strong>Total Records:</strong> {p.row_count:,}<br>
                            • <strong>Total Features:</strong> {p.column_count}<br>
                            • <strong>Duplicates:</strong> {p.duplicate_row_count} ({p.duplicate_percentage}%)<br>
                            • <strong>Memory Footprint:</strong> {p.memory_usage_mb} MB<br>
                            • <strong>SHA-256:</strong> <code style="font-size: 0.75rem;">{p.sha256_hash[:24]}...</code>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
            else:
                st.info("Load a dataset to view automated provenance details.")

        if st.session_state.lab_profile is not None:
            p = st.session_state.lab_profile
            st.markdown("---")
            st.markdown("#### 🔍 Automated Column Profiling & Integrity Report")
            
            # Warning Callouts for Constant and Leakage Columns
            if p.potential_leakage_columns or p.constant_columns:
                col_w1, col_w2 = st.columns(2)
                with col_w1:
                    if p.potential_leakage_columns:
                        st.warning(f"⚠️ Potential Target Leakage Columns Detected: {p.potential_leakage_columns}")
                with col_w2:
                    if p.constant_columns:
                        st.info(f"ℹ️ Constant Columns (Zero Variance): {p.constant_columns}")
                        
            # Column profiles summary table
            col_summary = []
            for col_name, cp in p.columns.items():
                col_summary.append({
                    "Column Name": col_name,
                    "Inferred Type": cp.inferred_type.value,
                    "Raw Dtype": cp.raw_dtype,
                    "Unique Count": cp.unique_count,
                    "Null Count": cp.null_count,
                    "Null %": f"{cp.null_percentage}%",
                    "Constant?": "Yes" if cp.is_constant else "No",
                    "Potential Leakage?": "Yes" if cp.is_potential_leakage else "No",
                    "Sample Values": str(cp.sample_values[:3])
                })
            st.dataframe(pd.DataFrame(col_summary), use_container_width=True)
            
            with st.expander("👁️ View First 5 Raw Dataset Rows"):
                st.dataframe(st.session_state.lab_df.head(5), use_container_width=True)

    # =========================================================================
    # TAB 2: FEATURE & TRAINING CONFIGURATION
    # =========================================================================
    with tab_train:
        st.markdown("#### ⚙️ Feature & Training Pipeline Configuration")
        if st.session_state.lab_df is None:
            st.warning("Please import a dataset in Tab 1 before configuring training.")
        else:
            df = st.session_state.lab_df
            all_cols = list(df.columns)
            
            # Target Column Selection
            col_t1, col_t2 = st.columns(2)
            with col_t1:
                default_target_idx = all_cols.index("Depression") if "Depression" in all_cols else 0
                target_col = st.selectbox("Select Target Column:", all_cols, index=default_target_idx)
                
            with col_t2:
                task_type_str = st.selectbox(
                    "Select Prediction Task Type:",
                    ["Binary Classification", "Multiclass Classification", "Regression"],
                    index=0
                )
                task_enum = {
                    "Binary Classification": TaskType.BINARY_CLASSIFICATION,
                    "Multiclass Classification": TaskType.MULTICLASS_CLASSIFICATION,
                    "Regression": TaskType.REGRESSION
                }[task_type_str]
                
            available_features = [c for c in all_cols if c != target_col]
            
            # Default auto-selections if benchmark dataset
            default_num = [c for c in ["Age", "Academic Pressure", "CGPA", "Study Satisfaction", "Work/Study Hours", "Financial Stress"] if c in available_features]
            default_cat = [c for c in ["Gender", "Sleep Duration", "Dietary Habits", "Degree"] if c in available_features]
            default_excl = [c for c in ["id", "City", "Profession", "Work Pressure", "Job Satisfaction", "Family History of Mental Illness", "Have you ever had suicidal thoughts ?"] if c in available_features]
            
            col_f1, col_f2 = st.columns(2)
            with col_f1:
                num_feats = st.multiselect("Numerical Features (StandardScaler + Median Impute):", available_features, default=default_num)
            with col_f2:
                cat_feats = st.multiselect("Categorical Features (OneHotEncoder + Mode Impute):", available_features, default=default_cat)
                
            # Excluded features
            excluded = [c for c in available_features if c not in num_feats and c not in cat_feats]
            st.caption(f"Currently Excluded Columns ({len(excluded)}): {excluded}")
            
            st.markdown("##### 🧪 Split & Validation Strategy")
            col_s1, col_s2, col_s3 = st.columns(3)
            with col_s1:
                test_ratio = st.slider("Held-Out Test Split Ratio:", min_value=0.10, max_value=0.30, value=0.15, step=0.05)
            with col_s2:
                val_ratio = st.slider("Validation Split Ratio:", min_value=0.10, max_value=0.30, value=0.15, step=0.05)
            with col_s3:
                random_seed = st.number_input("Random Seed (Reproducibility):", value=42, step=1)
                
            st.markdown("##### 🤖 Algorithm Selection & Training Execution")
            supported_models = get_supported_models()
            model_options = [m for m, meta in supported_models.items() if meta["available"]]
            selected_model_name = st.selectbox("Select Candidate Algorithm:", model_options, index=1 if len(model_options) > 1 else 0)
            
            st.info(f"**Model Description:** {supported_models[selected_model_name]['description']}")
            
            # Form submission
            if st.button("🚀 Start Isolated Model Training", use_container_width=True):
                config = DatasetConfig(
                    target_column=target_col,
                    task_type=task_enum,
                    numerical_features=num_feats,
                    categorical_features=cat_feats,
                    excluded_columns=excluded,
                    test_split_ratio=test_ratio,
                    val_split_ratio=val_ratio,
                    stratify=True,
                    random_seed=int(random_seed)
                )
                
                # Pre-validation
                val_report = validate_training_configuration(df, config)
                if not val_report.is_valid:
                    st.error("Validation Error: Please resolve the following configuration issues:")
                    for err in val_report.errors:
                        st.error(f"• [{err.field}] {err.message}")
                else:
                    try:
                        with st.spinner(f"Training '{selected_model_name}' on training partition with validation benchmark..."):
                            exp = run_training_experiment(
                                df=df,
                                config=config,
                                model_name=selected_model_name,
                                dataset_name=st.session_state.lab_name,
                                dataset_fingerprint=st.session_state.lab_sha
                            )
                            st.success(f"Experiment '{exp.experiment_id}' completed successfully in {exp.training_duration_seconds:.2f} seconds!")
                            st.rerun()
                    except Exception as e:
                        st.error(f"Training failed: {str(e)}")

    # =========================================================================
    # TAB 3: MODEL COMPARISON & METRICS
    # =========================================================================
    with tab_eval:
        st.markdown("#### 📊 Candidate Models vs. Validation Benchmark")
        df_comp = compare_experiments()
        
        if df_comp.empty:
            st.info("No training experiments recorded yet. Train a model in Tab 2 to populate metrics.")
        else:
            st.dataframe(
                df_comp.style.format({
                    "Val F1": "{:.4f}",
                    "Val Recall": "{:.4f}",
                    "Val ROC-AUC": "{:.4f}",
                    "Test Accuracy": "{:.4f}",
                    "Test Precision": "{:.4f}",
                    "Test Recall": "{:.4f}",
                    "Test F1": "{:.4f}",
                    "Test ROC-AUC": "{:.4f}"
                }).highlight_max(axis=0, subset=["Val F1", "Val Recall", "Test F1", "Test Accuracy"], color="#E9D5FF"),
                use_container_width=True
            )
            
            # Select individual experiment for deep dive
            all_exp_ids = df_comp["Experiment ID"].tolist()
            chosen_exp_id = st.selectbox("Inspect Detailed Evaluation Report for Experiment:", all_exp_ids)
            
            if chosen_exp_id:
                exp_detail = get_experiment(chosen_exp_id)
                if exp_detail:
                    tm = exp_detail.test_metrics
                    st.markdown(f"##### Detailed Metrics for `{exp_detail.experiment_id}` ({exp_detail.model_name})")
                    
                    k1, k2, k3, k4, k5 = st.columns(5)
                    k1.metric("Accuracy", f"{tm.get('accuracy', 0):.4f}")
                    k2.metric("Precision", f"{tm.get('precision', 0):.4f}")
                    k3.metric("Recall", f"{tm.get('recall', 0):.4f}")
                    k4.metric("Specificity", f"{tm.get('specificity', 0):.4f}")
                    k5.metric("F1-Score", f"{tm.get('f1_score', 0):.4f}")
                    
                    col_cm, col_clf = st.columns([1, 1.3])
                    with col_cm:
                        st.markdown("**Test Set Confusion Matrix:**")
                        cm = tm.get("confusion_matrix", [])
                        if cm:
                            df_cm = pd.DataFrame(
                                cm,
                                index=["Actual: Non-Depressed (0)", "Actual: Depressed (1)"],
                                columns=["Pred: Non-Depressed (0)", "Pred: Depressed (1)"]
                            )
                            st.table(df_cm)
                    with col_clf:
                        st.markdown("**Classification Report Details:**")
                        st.json(tm.get("classification_report", {}))

    # =========================================================================
    # TAB 4: EXPERIMENT HISTORY
    # =========================================================================
    with tab_history:
        st.markdown("#### 📜 Local Experiment Audit Log")
        experiments = list_experiments()
        st.caption(f"Total Logged Experiments: {len(experiments)} (Stored locally in experiments/registry.json)")
        
        for exp in experiments:
            with st.expander(f"🔬 {exp.experiment_id} — {exp.model_name} (Created: {exp.created_at[:19]})"):
                st.markdown(f"**Dataset:** `{exp.dataset_name}` | **Rows:** {exp.total_rows:,} | **Target:** `{exp.target_column}`")
                st.markdown(f"**Duration:** {exp.training_duration_seconds:.2f}s | **Random Seed:** {exp.random_seed} | **Status:** `{exp.status}`")
                st.markdown(f"**Configured Numerical Features ({len(exp.numerical_features)}):** {exp.numerical_features}")
                st.markdown(f"**Configured Categorical Features ({len(exp.categorical_features)}):** {exp.categorical_features}")
                st.markdown(f"**Artifact Location:** `{exp.artifact_path}`")
                
                c_m1, c_m2, c_m3 = st.columns(3)
                c_m1.markdown(f"**Val F1:** {exp.val_metrics.get('f1_score', 0):.4f}")
                c_m2.markdown(f"**Test Accuracy:** {exp.test_metrics.get('accuracy', 0):.4f}")
                c_m3.markdown(f"**Test Recall:** {exp.test_metrics.get('recall', 0):.4f}")

    # =========================================================================
    # TAB 5: MODEL REGISTRY & PROMOTION GOVERNANCE
    # =========================================================================
    with tab_registry:
        st.markdown("#### 🛡️ Model Registry & Production Governance")
        st.caption("Inspect production baseline status and evaluate experimental models against strict candidacy requirements.")
        
        # Production Baseline Status Card
        base_info = get_production_baseline_info()
        st.markdown(
            f"""
            <div class="mindora-card" style="border-top: 4px solid #10B981; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-size: 0.78rem; font-weight: 700; color: #10B981; text-transform: uppercase;">
                            Active Production Baseline (Locked)
                        </span>
                        <h4 style="margin: 2px 0 0 0; color: #241A35;">{base_info['model_name']}</h4>
                    </div>
                    <span style="background: #ECFDF5; color: #10B981; font-weight: 800; font-size: 0.85rem; padding: 4px 12px; border-radius: 12px;">
                        STATUS: ACTIVE LOCKED
                    </span>
                </div>
                <p style="font-size: 0.86rem; color: #475569; margin: 8px 0 10px 0;">
                    Trained strictly on 10 verified non-leaking features. Probabilities calibrated via 5-fold cross-validation.
                </p>
                <div style="font-size: 0.82rem; color: #64748B; background: {LIGHT_SURFACE}; padding: 10px 14px; border-radius: 8px;">
                    <strong>Location:</strong> <code>{base_info['artifact_path']}</code><br>
                    <strong>Features ({base_info['feature_count']}):</strong> {base_info['features']}
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # Candidate Evaluation Form
        st.markdown("##### Evaluate Experiment for Production Candidacy")
        exp_list = list_experiments()
        if not exp_list:
            st.info("Train at least one model to evaluate candidacy.")
        else:
            exp_choices = [e.experiment_id for e in exp_list]
            cand_id = st.selectbox("Select Experiment ID:", exp_choices, key="cand_sel")
            
            eligible, reason = check_validation_candidacy_eligibility(cand_id)
            if eligible:
                st.success(f"✅ Validation-Based Candidacy Audit Passed: {reason}")
                col_c1, col_c2 = st.columns(2)
                with col_c1:
                    if st.button("🏷️ Promote to Validation Candidate", use_container_width=True):
                        ok, msg = promote_to_validation_candidate(cand_id)
                        if ok:
                            st.success(msg)
                            st.rerun()
                        else:
                            st.error(msg)
                with col_c2:
                    op_name = st.text_input("Operator Name for Sign-Off:", value="Lead MLOps Architect")
                    if st.button("✍️ Approve Technical Artifact", use_container_width=True):
                        ok, msg = approve_model_artifact(cand_id, op_name)
                        if ok:
                            st.success(msg)
                            st.rerun()
                        else:
                            st.error(msg)
            else:
                st.error(f"❌ Candidacy Audit Rejected: {reason}")
                st.caption(
                    "Governance Rule: Model selection and candidate qualification are evaluated strictly on validation metrics "
                    "(Val Recall >= 0.75, Val F1 >= 0.75), exact 10-feature schema match, and zero leaking tokens."
                )
