"""
src/views/insights.py
Mindora – Student Results & Wellness Insights View.
Displays the three segregated intelligence engines:
  - ENGINE 1: Calibrated ML Screening + SHAP Local Explainability
  - ENGINE 2: Digital Lifestyle & Circadian Rhythm Insights
  - ENGINE 3: Validated PHQ-9 Screener + Unconditional Item 9 Safety Override
"""

import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

from src.recommendations import get_crisis_resources
from src.ui_theme import (
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT,
    render_empty_state,
    render_safety_disclaimer_card
)

def render_insights():
    """Render the student results and tri-engine insights view."""
    if not st.session_state.get("assessment_submitted", False) or st.session_state.get("latest_results") is None:
        st.markdown(
            f"""
            <div style="margin-bottom: 20px;">
                <div class="mindora-badge">Tri-Engine Screening Report</div>
                <h2 style="font-size: 2.1rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                    Personal Wellness Insights
                </h2>
                <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                    Your multi-engine insights will appear here once you complete an assessment.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )
        st.markdown(
            render_empty_state(
                icon="📊",
                title="No Assessment Completed in this Session",
                description="Complete our 3 to 5 minute questionnaire to generate explainable ML indicators, digital lifestyle analytics, and psychometric screening results.",
                hint="Your responses are held strictly in server process memory for your active session and never written to disk or databases."
            ),
            unsafe_allow_html=True
        )
        col_c1, col_c2, col_c3 = st.columns([1, 2, 1])
        with col_c2:
            if st.button("🚀 Start My Assessment Now", key="empty_insights_start_btn", use_container_width=True, type="primary"):
                st.session_state.current_page = "📝 Student Assessment"
                st.rerun()
        return

    # Results exist in current session
    results = st.session_state.latest_results
    ml_res = results.get("engine_1_ml", {})
    life_res = results.get("engine_2_lifestyle", {})
    phq9_res = results.get("engine_3_phq9", {})
    recs = results.get("recommendations", [])
    
    st.markdown(
        f"""
        <div style="margin-bottom: 24px;">
            <div class="mindora-badge">Tri-Engine Screening Report</div>
            <h2 style="font-size: 2.2rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Screening Summary & Multi-Engine Insights
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Results from the three independent engines: Public ML Model, Digital Lifestyle Patterns, and Validated PHQ-9.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    # 1. IMMEDIATE CRISIS SUPPORT OVERRIDE (Item 9 check)
    if phq9_res.get("has_self_harm_risk", False):
        crisis = get_crisis_resources()
        st.markdown(
            f"""
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-left: 6px solid #EF4444; border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.08);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 1.6rem;">💜</span>
                    <h3 style="color: #991B1B; margin: 0; font-size: 1.25rem; font-weight: 700;">
                        Supportive Mental Health Guidance & 24/7 Helplines
                    </h3>
                </div>
                <p style="font-size: 0.93rem; color: #1E293B; line-height: 1.6; margin: 6px 0 16px 0;">
                    {crisis['emergency_alert']}
                </p>
                <div style="background: #FFFFFF; border-radius: 12px; padding: 18px; border: 1px solid #FCA5A5;">
                    <div style="margin-bottom: 12px;">
                        <span style="background: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px;">
                            Primary National Resources (India)
                        </span>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.88rem; color: #334155; line-height: 1.75;">
                            <li><strong>Tele-MANAS:</strong> Call <strong>14416</strong> or <strong>1800-89-14416</strong> (24/7 Toll-Free, Govt. of India MoHFW DGHS)</li>
                            <li><strong>KIRAN Helpline:</strong> Call <strong>1800-599-0019</strong> (24/7 Toll-Free, Dept. of Empowerment of Persons with Disabilities)</li>
                            <li><strong>Vandrevala Foundation:</strong> Call <strong>+91 9999 666 555</strong> (24/7 Free Mental Health Counseling)</li>
                        </ul>
                    </div>
                    <div style="border-top: 1px solid #FEE2E2; padding-top: 10px; margin-top: 10px;">
                        <span style="background: #F1F5F9; color: #475569; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px;">
                            International Resources (Country-Specific)
                        </span>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.86rem; color: #475569; line-height: 1.7;">
                            <li><strong>USA & Canada:</strong> Call or Text <strong>988</strong> (Suicide & Crisis Lifeline)</li>
                            <li><strong>United Kingdom:</strong> Call <strong>111</strong> (NHS 24/7 Mental Health Services) or <strong>116 123</strong> (Samaritans)</li>
                            <li><strong>Australia:</strong> Call <strong>13 11 14</strong> (Lifeline)</li>
                            <li><strong>Global Directory:</strong> Visit <a href="https://findahelpline.com" target="_blank" style="color: #6D43C6; font-weight: 600;">findahelpline.com</a> for local crisis contacts in over 130 countries.</li>
                        </ul>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    # ----------------------------------------------------------------------
    # SECTION 1: ENGINE 1 – PUBLIC DATASET ML ESTIMATE
    # ----------------------------------------------------------------------
    st.markdown(
        f"""
        <div style="margin-top: 10px; margin-bottom: 14px;">
            <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                1. Engine 1: Public Dataset ML Screening Estimate
            </h3>
            <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                Experimental estimation evaluated strictly against 10 demographic, study, and sleep duration features from 27,901 student records. 
                Uses a calibrated XGBoost pipeline ($Brier = 0.1448$).
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    col_ml1, col_ml2 = st.columns([1, 1.4])
    with col_ml1:
        st.markdown(
            f"""
            <div class="mindora-card" style="border-top: 5px solid {ml_res.get('badge_color', PRIMARY_VIOLET)}; height: 100%;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                            ML Screening Status
                        </span>
                        <h3 style="margin: 2px 0 0 0; color: #241A35; font-size: 1.35rem;">
                            {ml_res.get('risk_tier', 'Analyzed')}
                        </h3>
                    </div>
                    <span style="background: {ml_res.get('badge_bg', LAVENDER)}; color: {ml_res.get('badge_color', PRIMARY_VIOLET)}; font-weight: 800; font-size: 1.15rem; padding: 6px 14px; border-radius: 20px;">
                        {ml_res.get('percentage', 0.0)}%
                    </span>
                </div>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin-bottom: 16px;">
                    {ml_res.get('summary', '')}
                </p>
                <div style="font-size: 0.78rem; color: #64748B; background: {LIGHT_SURFACE}; padding: 10px 14px; border-radius: 10px; line-height: 1.5;">
                    <strong>Calibration Method:</strong> Sigmoid cross-validation on training split (5-fold).<br>
                    <strong>Note:</strong> Statistical indicator only; not an individual clinical prognosis.
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        
    with col_ml2:
        is_local = ml_res.get("is_local_explanation", True)
        contributions = ml_res.get("feature_contributions", [])
        
        if is_local:
            badge_html = '<div class="mindora-badge">Local SHAP Explainability</div>'
            title_text = "Primary Contributing Factors for Your Profile (SHAP)"
            method_desc = "Method: <code>SHAP TreeExplainer (Individual Attribution)</code>"
            fallback_notice = ""
        else:
            badge_html = '<span style="background: #FEF3C7; color: #92400E; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 10px;">Global Importance Fallback</span>'
            title_text = "Global Model Feature Importances (Dataset Level)"
            method_desc = "Method: <code>XGBoost Feature Importance (Global Fallback)</code>"
            fallback_notice = (
                '<div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 8px 12px; border-radius: 6px; font-size: 0.8rem; color: #92400E; margin-bottom: 10px; line-height: 1.45;">'
                '<strong>Notice:</strong> Individual SHAP attribution was temporarily unavailable. '
                'Displaying overall dataset-level feature importances. These reflect general model weighting across all training data, not your individual profile.'
                '</div>'
            )
            
        st.markdown(
            f"""
            <div class="mindora-card" style="height: 100%;">
                {badge_html}
                <h4 style="margin: 2px 0 6px 0; color: {PRIMARY_VIOLET}; font-size: 1.05rem;">
                    {title_text}
                </h4>
                <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 8px;">
                    {method_desc}
                </p>
                {fallback_notice}
            """,
            unsafe_allow_html=True
        )
        
        if contributions:
            fig_shap = go.Figure()
            feats = [c["feature"] for c in reversed(contributions)]
            if is_local:
                vals = [c.get("shap_value", 0.0) or 0.0 for c in reversed(contributions)]
                colors = ["#EF4444" if v > 0 else "#10B981" for v in vals]
                xaxis_title = "Impact on Screening Risk (SHAP Value)"
                hover_tmpl = "<b>%{y}</b><br>SHAP Contribution: %{x:+.4f}<extra></extra>"
            else:
                vals = [c.get("global_importance", 0.0) or 0.0 for c in reversed(contributions)]
                colors = [PRIMARY_VIOLET for _ in vals]
                xaxis_title = "Global Feature Importance (Gini Weight)"
                hover_tmpl = "<b>%{y}</b><br>Global Weight: %{x:.4f}<extra></extra>"
            
            fig_shap.add_trace(go.Bar(
                y=feats,
                x=vals,
                orientation='h',
                marker=dict(color=colors, line=dict(color='rgba(0,0,0,0.05)', width=1)),
                hovertemplate=hover_tmpl
            ))
            fig_shap.update_layout(
                margin=dict(l=10, r=20, t=10, b=10),
                height=220,
                xaxis_title=xaxis_title,
                xaxis=dict(zeroline=True, zerolinecolor="#94A3B8"),
                font=dict(family="Plus Jakarta Sans, Inter, sans-serif", size=11),
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)"
            )
            st.plotly_chart(fig_shap, use_container_width=True)
        else:
            st.info("Feature contributions could not be calculated.")
            
        st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # ----------------------------------------------------------------------
    # SECTION 2: ENGINE 2 – DIGITAL LIFESTYLE & CIRCADIAN RHYTHMS
    # ----------------------------------------------------------------------
    st.markdown(
        f"""
        <div style="margin-top: 10px; margin-bottom: 14px;">
            <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                2. Engine 2: Digital Lifestyle & Daily Habits Analytics
            </h3>
            <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                Descriptive evaluation of your technology use, sleep hygiene, and daily rhythm consistency. 
                Produces actionable lifestyle indices with <strong>zero depression probability claims</strong>.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    col_l1, col_l2 = st.columns(2)
    with col_l1:
        st.markdown(
            f"""
            <div class="mindora-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 1.05rem;">Digital Friction Index</strong>
                    <span style="font-size: 1.15rem; font-weight: 800; color: #EF4444;">
                        {life_res.get('digital_friction', 0)} / 10
                    </span>
                </div>
                <p style="font-size: 0.86rem; color: #64748B; margin-bottom: 8px;">
                    Combines high phone screen time, late-night phone browsing, and frequent social comparison.
                </p>
                <div style="background: {LIGHT_SURFACE}; padding: 12px; border-radius: 10px; font-size: 0.84rem; color: #334155; line-height: 1.55;">
                    <strong>Observation:</strong> {life_res.get('key_lifestyle_observations', [''])[0]}<br>
                    <strong>Sleep Interference:</strong> {life_res.get('key_lifestyle_observations', ['', ''])[1]}
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        
    with col_l2:
        st.markdown(
            f"""
            <div class="mindora-card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 1.05rem;">Lifestyle Rhythm Balance</strong>
                    <span style="font-size: 1.15rem; font-weight: 800; color: #10B981;">
                        {life_res.get('rhythm_score', 0)} / 10
                    </span>
                </div>
                <p style="font-size: 0.86rem; color: #64748B; margin-bottom: 8px;">
                    Reflects sleep restoration, outdoor sunlight exposure, and academic-rest balance.
                </p>
                <div style="background: {LIGHT_SURFACE}; padding: 12px; border-radius: 10px; font-size: 0.84rem; color: #334155; line-height: 1.55;">
                    <strong>Observation:</strong> {life_res.get('key_lifestyle_observations', ['', '', '', 'Balanced circadian rhythm'])[3]}<br>
                    <strong>Study/Rest Balance:</strong> Highlights healthy boundaries between coursework and personal time.
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    # Tailored Educational Wellness Suggestions
    st.markdown("##### 💡 Actionable Self-Care Recommendations:")
    for rec in recs:
        st.markdown(
            f"""
            <div class="mindora-card" style="margin-bottom: 12px; padding: 16px 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                    <span style="font-size: 1.25rem;">{rec['icon']}</span>
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">{rec['title']}</strong>
                    <span style="font-size: 0.72rem; background: {LAVENDER}; color: {PRIMARY_VIOLET}; padding: 2px 8px; border-radius: 10px; font-weight: 600;">
                        {rec['category']}
                    </span>
                </div>
                <p style="font-size: 0.86rem; color: #475569; margin: 0; line-height: 1.5;">
                    {rec['action']}
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

    col_rec_action1, col_rec_action2 = st.columns([1, 1])
    with col_rec_action1:
        if st.button("🎯 Add Habits to My Wellness Planner", key="insights_add_to_planner_btn", use_container_width=True, type="primary"):
            st.session_state.current_page = "🎯 Wellness Planner"
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    # ----------------------------------------------------------------------
    # SECTION 3: ENGINE 3 – INDEPENDENT VALIDATED PHQ-9 SCREENING
    # ----------------------------------------------------------------------
    st.markdown(
        f"""
        <div style="margin-top: 10px; margin-bottom: 14px;">
            <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                3. Engine 3: Independent Standardized PHQ-9 Screening
            </h3>
            <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                Standardized clinical 9-item psychometric assessment. Kept <strong>completely separate</strong> from the ML model.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown(
        f"""
        <div class="mindora-card" style="border-top: 5px solid {phq9_res.get('badge_color', PRIMARY_VIOLET)};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                    <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                        Clinical Standard
                    </span>
                    <h4 style="margin: 2px 0 0 0; color: #241A35; font-size: 1.3rem;">
                        PHQ-9 Severity: {phq9_res.get('severity', 'Analyzed')}
                    </h4>
                </div>
                <span style="background: {phq9_res.get('badge_bg', LAVENDER)}; color: {phq9_res.get('badge_color', PRIMARY_VIOLET)}; font-weight: 800; font-size: 1.15rem; padding: 6px 14px; border-radius: 20px;">
                    Score: {phq9_res.get('score', 0)} / {phq9_res.get('max_score', 27)}
                </span>
            </div>
            <p style="font-size: 0.9rem; color: #475569; line-height: 1.55; margin-bottom: 12px;">
                {phq9_res.get('description', '')}
            </p>
            <div style="font-size: 0.8rem; color: #64748B; background: {LIGHT_SURFACE}; padding: 10px 14px; border-radius: 10px; line-height: 1.5;">
                <strong>Clinical Context:</strong> The Patient Health Questionnaire (PHQ-9) is a validated diagnostic aid used globally in primary and university care. 
                Scores &ge; 10 represent a clinical threshold where speaking with a licensed campus therapist is strongly encouraged.
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

    # Action Buttons
    col_btn1, col_btn2 = st.columns(2)
    with col_btn1:
        if st.button("🔄 Retake Assessment", key="insights_retake_btn", use_container_width=True):
            st.session_state.current_page = "📝 Student Assessment"
            st.rerun()
    with col_btn2:
        if st.button("📈 View My Session Progress", key="insights_progress_btn", use_container_width=True):
            st.session_state.current_page = "📈 My Progress"
            st.rerun()
