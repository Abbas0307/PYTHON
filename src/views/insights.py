"""
src/views/insights.py
Mindora – Student Results & Wellness Insights View.
Displays the three segregated intelligence engines:
  - ENGINE 1: Calibrated ML Screening + SHAP Local Explainability
  - ENGINE 2: Digital Lifestyle & Circadian Rhythm Insights
  - ENGINE 3: Validated PHQ-9 Screener + Unconditional Item 9 Safety Override
"""

import html
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
                st.session_state.current_page = "📝 My Assessment"
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
            <div class="mindora-badge">Tri-Engine Intelligence Report</div>
            <h2 style="font-size: 2.2rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                Assessment Summary & Multi-Engine Insights
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
        country_options = ["India", "United States", "Canada", "United Kingdom", "Australia", "Other / International"]
        cur_country = st.session_state.get("selected_country", "India")
        if cur_country not in country_options:
            cur_country = "India"

        selected_country = st.selectbox(
            "🌐 View Emergency & Crisis Helplines For Your Country / Region:",
            country_options,
            index=country_options.index(cur_country),
            key="insights_crisis_country_selector"
        )
        st.session_state["selected_country"] = selected_country

        crisis = get_crisis_resources(country=selected_country)
        c_res = crisis.get("country_resource", {})
        
        # Format country-specific details
        c_name = html.escape(str(c_res.get("country", selected_country)))
        c_emerg_num = html.escape(str(c_res.get("emergency_services", "112")))
        c_emerg_name = html.escape(str(c_res.get("emergency_name", "Emergency Services")))
        c_emerg_instr = html.escape(str(c_res.get("emergency_instruction", "")))
        c_primary_svc = html.escape(str(c_res.get("primary_mental_health_service", "Tele-MANAS")))
        c_primary_num = html.escape(str(c_res.get("primary_mental_health_number", "14416")))
        c_primary_det = html.escape(str(c_res.get("mental_health_details", "")))
        c_sec_svc = html.escape(str(c_res.get("secondary_mental_health_service", "")))
        c_sec_num = html.escape(str(c_res.get("secondary_mental_health_number", "")))
        c_tert_svc = html.escape(str(c_res.get("tertiary_mental_health_service", "")))
        c_tert_num = html.escape(str(c_res.get("tertiary_mental_health_number", "")))
        c_warning = html.escape(str(c_res.get("accessibility_warning", "")))
        
        sec_li = f"<li><strong>{c_sec_svc}:</strong> Call <strong>{c_sec_num}</strong></li>" if c_sec_svc else ""
        tert_li = f"<li><strong>{c_tert_svc}:</strong> <strong>{c_tert_num}</strong></li>" if c_tert_svc else ""

        st.markdown(
            f"""
            <div style="background: #FEF2F2; border: 1px solid #FECACA; border-left: 6px solid #EF4444; border-radius: 14px; padding: 20px 24px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.08);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                    <span style="font-size: 1.6rem;">💜</span>
                    <h3 style="color: #991B1B; margin: 0; font-size: 1.25rem; font-weight: 700;">
                        Supportive Mental Health Guidance & Emergency Resources ({c_name})
                    </h3>
                </div>
                <p style="font-size: 0.93rem; color: #1E293B; line-height: 1.6; margin: 6px 0 16px 0;">
                    {crisis['emergency_alert']}
                </p>
                <div style="background: #FFFFFF; border-radius: 12px; padding: 18px; border: 1px solid #FCA5A5;">
                    <div style="margin-bottom: 14px; background: #FFF1F2; padding: 12px 14px; border-radius: 8px; border: 1px solid #FECDD3;">
                        <span style="background: #E11D48; color: #FFFFFF; font-weight: 700; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px;">
                            Immediate Life-Threatening Emergency Services
                        </span>
                        <div style="margin-top: 8px; font-size: 0.90rem; color: #881337; font-weight: 600;">
                            🚨 Call <strong>{c_emerg_num}</strong> ({c_emerg_name})
                        </div>
                        <p style="margin: 4px 0 0 0; font-size: 0.82rem; color: #9F1239; line-height: 1.45;">
                            {c_emerg_instr}
                        </p>
                    </div>

                    <div style="margin-bottom: 12px;">
                        <span style="background: #FEE2E2; color: #991B1B; font-weight: 700; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 6px;">
                            Dedicated Mental-Health Crisis & Support Helplines ({c_name})
                        </span>
                        <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 0.88rem; color: #334155; line-height: 1.75;">
                            <li><strong>{c_primary_svc}:</strong> <strong>{c_primary_num}</strong> — <span style="font-size: 0.82rem; color: #64748B;">{c_primary_det}</span></li>
                            {sec_li}
                            {tert_li}
                        </ul>
                    </div>
                    
                    <div style="border-top: 1px solid #FEE2E2; padding-top: 10px; margin-top: 10px;">
                        <p style="font-size: 0.81rem; color: #991B1B; font-weight: 600; margin: 0 0 4px 0;">
                            ⚠️ Important Resource & Accessibility Notice:
                        </p>
                        <p style="font-size: 0.80rem; color: #64748B; margin: 0; line-height: 1.5;">
                            {c_warning} Helplines in one country cannot be dialed from other nations (for example, US/Canada 988 or UK 111 cannot be dialed from India, and Tele-MANAS is only dialable within India). 
                            Never dial 988 or NHS 111 as a general emergency number.
                        </p>
                    </div>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )

    # ----------------------------------------------------------------------
    # SECTION 1: ENGINE 1 – EXPERIMENTAL SURVEY ASSOCIATION MODEL (PUBLIC ML)
    # ----------------------------------------------------------------------
    st.markdown(
        f"""
        <div style="margin-top: 10px; margin-bottom: 14px;">
            <h3 style="color: {PRIMARY_VIOLET}; margin-bottom: 2px;">
                1. Engine 1: Experimental Survey Association Model (Public ML)
            </h3>
            <p style="color: #64748B; font-size: 0.88rem; margin: 0;">
                Experimental estimation evaluating 10 academic workload, sleep duration, and demographic factors against historical student survey patterns. 
                Estimates statistical alignment with a self-reported survey label in research data; not a clinical depression assessment or medical diagnosis.
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
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <span style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-weight: 700;">
                                Experimental Survey Association
                            </span>
                            <h3 style="margin: 2px 0 0 0; color: #241A35; font-size: 1.25rem;">
                                {html.escape(str(ml_res.get('risk_tier', 'Analyzed')))}
                            </h3>
                        </div>
                        <span style="background: {ml_res.get('badge_bg', LAVENDER)}; color: {ml_res.get('badge_color', PRIMARY_VIOLET)}; font-weight: 800; font-size: 0.95rem; padding: 4px 12px; border-radius: 14px;">
                            Estimated Probability: {float(ml_res.get('percentage', 0.0)):.1f}%
                        </span>
                    </div>
                </div>
                <p style="font-size: 0.88rem; color: #475569; line-height: 1.5; margin-bottom: 14px;">
                    {html.escape(str(ml_res.get('summary', '')))}
                </p>
                <div style="font-size: 0.78rem; color: #475569; background: {LIGHT_SURFACE}; padding: 12px 14px; border-radius: 10px; line-height: 1.55;">
                    <strong style="color: #1E293B; display: block; margin-bottom: 2px;">What this percentage represents:</strong>
                    This output reflects an experimental model-estimated probability ({ml_res.get('percentage', 0.0)}%) of statistical association with self-reported survey labels in a historical student research dataset (5-fold cross-validated sigmoid calibration).<br>
                    <strong style="color: #991B1B; display: block; margin-top: 6px; margin-bottom: 2px;">What this does NOT represent:</strong>
                    This is <em>not</em> your personal mental-health score, <em>not</em> an objective measurement of your wellbeing level, and <em>not</em> a clinical diagnosis or medical screening result.
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
                xaxis_title = "Impact on Survey Pattern Alignment (SHAP Value)"
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

    # Tailored Contextual Wellness Suggestions
    st.markdown("##### 💡 Prioritised Contextual Recommendations:")
    st.caption("Actionable self-care suggestions tailored to your academic workload, sleep habits, and lifestyle context. Educational guidance only; not medical treatment.")
    
    dismissed = st.session_state.get("dismissed_recommendations", set())
    feedback = st.session_state.get("recommendation_feedback", {})
    active_recs = [r for r in recs if r.get("id") not in dismissed]
    
    if not active_recs:
        st.info("All recommendations for this session have been dismissed or addressed. You can reset or revisit the Wellness Planner.")
    else:
        top_recs = active_recs[:3]
        additional_recs = active_recs[3:]
        
        def render_rec_card(rec, idx, prefix="top"):
            rid = rec.get("id", f"rec_{idx}")
            priority_label = rec.get("priority", "Medium")
            p_color = "#DC2626" if priority_label == "High" else ("#6D43C6" if priority_label == "Medium" else "#10B981")
            p_bg = "#FEE2E2" if priority_label == "High" else ("#F1EBFF" if priority_label == "Medium" else "#ECFDF5")
            effort = rec.get("estimated_effort", "15 mins")
            is_helpful = feedback.get(rid) == "helpful"
            
            st.markdown(
                f"""
                <div class="mindora-card" style="margin-bottom: 14px; padding: 18px 22px; border-left: 5px solid {p_color};">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.35rem;">{rec.get('icon', '💡')}</span>
                            <div>
                                <strong style="color: {PRIMARY_VIOLET}; font-size: 1.02rem;">{html.escape(str(rec.get('title', '')))}</strong>
                                <div style="display: flex; gap: 8px; margin-top: 3px; flex-wrap: wrap;">
                                    <span style="font-size: 0.72rem; background: {LAVENDER}; color: {PRIMARY_VIOLET}; padding: 2px 8px; border-radius: 8px; font-weight: 600;">
                                        {html.escape(str(rec.get('category', 'Wellness')))}
                                    </span>
                                    <span style="font-size: 0.72rem; background: {p_bg}; color: {p_color}; padding: 2px 8px; border-radius: 8px; font-weight: 700;">
                                        {priority_label} Priority
                                    </span>
                                    <span style="font-size: 0.72rem; color: #64748B;">
                                        ⏱️ {html.escape(str(effort))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="background: {LIGHT_SURFACE}; border-radius: 8px; padding: 8px 12px; margin-bottom: 8px; font-size: 0.81rem; color: #475569;">
                        <strong>Why this was suggested:</strong> {html.escape(str(rec.get('reason', 'Based on your survey responses.')))}
                    </div>
                    <p style="font-size: 0.88rem; color: #334155; margin: 0 0 10px 0; line-height: 1.55;">
                        {html.escape(str(rec.get('action', '')))}
                    </p>
                </div>
                """,
                unsafe_allow_html=True
            )
            col_f1, col_f2, col_f3 = st.columns([1, 1, 3])
            with col_f1:
                btn_label = "❤️ Helpful" if is_helpful else "👍 Helpful"
                if st.button(btn_label, key=f"{prefix}_help_{rid}_{idx}", use_container_width=True):
                    if is_helpful:
                        feedback.pop(rid, None)
                    else:
                        feedback[rid] = "helpful"
                    st.session_state.recommendation_feedback = feedback
                    st.rerun()
            with col_f2:
                if st.button("✕ Dismiss", key=f"{prefix}_dsm_{rid}_{idx}", use_container_width=True):
                    dismissed.add(rid)
                    st.session_state.dismissed_recommendations = dismissed
                    st.rerun()
            st.markdown("<div style='margin-bottom: 8px;'></div>", unsafe_allow_html=True)

        for i, r in enumerate(top_recs):
            render_rec_card(r, i, prefix="top")
            
        if additional_recs:
            with st.expander(f"📋 View Additional Contextual Suggestions ({len(additional_recs)})", expanded=False):
                for j, r in enumerate(additional_recs):
                    render_rec_card(r, j, prefix="more")

    col_rec_action1, col_rec_action2 = st.columns([1, 1])
    with col_rec_action1:
        if st.button("🎯 Open Wellness Planner & Commit Habits", key="insights_add_to_planner_btn", use_container_width=True, type="primary"):
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
                        PHQ-9 Severity: {html.escape(str(phq9_res.get('severity', 'Analyzed')))}
                    </h4>
                </div>
                <span style="background: {phq9_res.get('badge_bg', LAVENDER)}; color: {phq9_res.get('badge_color', PRIMARY_VIOLET)}; font-weight: 800; font-size: 1.15rem; padding: 6px 14px; border-radius: 20px;">
                    Score: {phq9_res.get('score', 0)} / {phq9_res.get('max_score', 27)}
                </span>
            </div>
            <p style="font-size: 0.9rem; color: #475569; line-height: 1.55; margin-bottom: 12px;">
                {html.escape(str(phq9_res.get('description', '')))}
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
            st.session_state.current_page = "📝 My Assessment"
            st.rerun()
    with col_btn2:
        if st.button("📈 View My Session Progress", key="insights_progress_btn", use_container_width=True):
            st.session_state.current_page = "📈 My Progress"
            st.rerun()
