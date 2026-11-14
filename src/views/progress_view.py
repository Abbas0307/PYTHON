"""
src/views/progress_view.py
Mindora – Student Wellbeing Progress & Session Milestone Tracker.
Implements the IMPROVE phase of the student wellbeing journey.
Visualizes ephemeral session milestones, habit streaks, and reflection history.
"""

import html
import streamlit as st
from src.ui_theme import (
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT,
    render_empty_state
)

def render_progress_view():
    """Render the student session progress and milestone tracker."""
    st.markdown(
        f"""
        <div style="margin-bottom: 20px;">
            <div class="mindora-badge">Continuous Improvement</div>
            <h2 style="font-size: 2.1rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                📈 My Progress & Session Milestones
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Track your active session reflections, completed wellbeing habits, and self-care commitments.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    # Privacy and Data Retention Notice
    st.markdown(
        f"""
        <div style="background: {LAVENDER}; border-radius: 14px; padding: 14px 18px; border: 1px solid rgba(139, 92, 246, 0.2); margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 1.1rem;">🔒</span>
                <strong style="color: {PRIMARY_VIOLET}; font-size: 0.88rem;">Server Session In-Memory Processing Guarantee</strong>
            </div>
            <p style="font-size: 0.82rem; color: #475569; margin: 0; line-height: 1.45;">
                All milestones, assessment summaries, and habit check-ins displayed here reside in Streamlit session-associated server memory during your active interaction. 
                Application-code inspection confirmed no persistent writes to disk or databases in the core modules. When you click 'Clear Server Session Data' or the server restarts, all user-specific session data is cleared.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    has_assessment = st.session_state.get("assessment_submitted", False) and st.session_state.get("latest_results") is not None
    completed_habits = st.session_state.get("completed_habits", set())
    energy_checkin = st.session_state.get("daily_energy_checkin", "😐 Steady")
    session_history = st.session_state.get("session_progress", [])

    # Overview Metrics Row
    m1, m2, m3 = st.columns(3)
    with m1:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 4px 14px rgba(109, 67, 198, 0.04); text-align: center;">
                <span style="font-size: 0.78rem; color: #64748B; text-transform: uppercase; font-weight: 700;">Assessment Status</span>
                <h3 style="margin: 6px 0 2px 0; color: {'#10B981' if has_assessment else '#F59E0B'}; font-size: 1.25rem;">
                    {'✓ Completed' if has_assessment else '⏳ Pending'}
                </h3>
                <span style="font-size: 0.75rem; color: #94A3B8;">{f'{len(session_history)} run(s) this session' if session_history else 'No runs yet'}</span>
            </div>
            """,
            unsafe_allow_html=True
        )
    with m2:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 4px 14px rgba(109, 67, 198, 0.04); text-align: center;">
                <span style="font-size: 0.78rem; color: #64748B; text-transform: uppercase; font-weight: 700;">Habits Completed</span>
                <h3 style="margin: 6px 0 2px 0; color: {PRIMARY_VIOLET}; font-size: 1.25rem;">
                    {len(completed_habits)} Active
                </h3>
                <span style="font-size: 0.75rem; color: #94A3B8;">Tracked in Wellness Planner</span>
            </div>
            """,
            unsafe_allow_html=True
        )
    with m3:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 14px; padding: 16px; border: 1px solid rgba(139, 92, 246, 0.16); box-shadow: 0 4px 14px rgba(109, 67, 198, 0.04); text-align: center;">
                <span style="font-size: 0.78rem; color: #64748B; text-transform: uppercase; font-weight: 700;">Session Energy</span>
                <h3 style="margin: 6px 0 2px 0; color: {PRIMARY_VIOLET}; font-size: 1.15rem;">
                    {html.escape(str(energy_checkin))}
                </h3>
                <span style="font-size: 0.75rem; color: #94A3B8;">Self-Reported State</span>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # 1. Assessment History
    st.markdown("### 📋 Session Assessment Milestones")
    if not has_assessment:
        st.markdown(
            render_empty_state(
                icon="📝",
                title="No Assessment Completed Yet",
                description="Complete the 3 to 5 minute student assessment to record your baseline pattern indicators and discover tailored recommendations.",
                hint="Click below to open the assessment."
            ),
            unsafe_allow_html=True
        )
        col_st1, col_st2, col_st3 = st.columns([1, 2, 1])
        with col_st2:
            if st.button("🚀 Start My Assessment", key="prog_start_btn", use_container_width=True, type="primary"):
                st.session_state.current_page = "📝 My Assessment"
                st.rerun()
    else:
        for idx, entry in enumerate(reversed(session_history)):
            st.markdown(
                f"""
                <div style="background: #FFFFFF; border-radius: 14px; padding: 16px 20px; border: 1px solid rgba(139, 92, 246, 0.16); margin-bottom: 12px; box-shadow: 0 4px 12px rgba(109, 67, 198, 0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="color: {PRIMARY_VIOLET}; font-size: 0.95rem;">
                            Assessment #{len(session_history) - idx} • {html.escape(str(entry.get('timestamp', 'Current Session')))}
                        </strong>
                        <span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 12px;">
                            {html.escape(str(entry.get('risk_tier', 'Analyzed')))}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; font-size: 0.82rem; color: #475569;">
                        <div>• Experimental ML Indicator: <strong>{float(entry.get('risk_percentage', 0.0)):.1f}%</strong></div>
                        <div>• PHQ-9 Screener: <strong>{int(entry.get('phq9_score', 0))}/27 ({html.escape(str(entry.get('phq9_severity', '')))})</strong></div>
                        <div>• Lifestyle Rhythm: <strong>{int(entry.get('rhythm_score', 0))}/10</strong></div>
                        <div>• Digital Friction: <strong>{int(entry.get('digital_friction', 0))}/10</strong></div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )

    st.markdown("<br>", unsafe_allow_html=True)

    # 2. Habit Tracker Status
    st.markdown("### 🎯 Active Wellness Habits Committed Today")
    if not completed_habits:
        st.markdown(
            render_empty_state(
                icon="🌱",
                title="No Habits Checked Yet",
                description="The Wellness Planner offers science-backed micro-habits for sleep hygiene, digital boundaries, and study rhythm.",
                hint="Open the Wellness Planner to pick 2-3 focus habits."
            ),
            unsafe_allow_html=True
        )
        col_h1, col_h2, col_h3 = st.columns([1, 2, 1])
        with col_h2:
            if st.button("🎯 Open Wellness Planner", key="prog_open_planner_btn", use_container_width=True, type="primary"):
                st.session_state.current_page = "🎯 Wellness Planner"
                st.rerun()
    else:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 14px; padding: 18px 22px; border: 1px solid rgba(139, 92, 246, 0.16); margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 1.0rem;">
                        You have checked off {len(completed_habits)} habit(s) in this session:
                    </strong>
                    <span style="font-size: 0.8rem; color: #10B981; font-weight: 700;">✓ Active Today</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            """,
            unsafe_allow_html=True
        )
        for h_id in completed_habits:
            clean_name = html.escape(str(h_id).replace("_", " ").title())
            st.markdown(
                f"""<span style="background: {LAVENDER}; color: {PRIMARY_VIOLET}; padding: 6px 14px; border-radius: 20px; font-size: 0.82rem; font-weight: 600;">✓ {clean_name}</span>""",
                unsafe_allow_html=True
            )
        st.markdown("</div></div>", unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)

    # Reset Session Data Option
    with st.expander("🗑️ Session Controls: Clear Server Session Data", expanded=False):
        st.caption("Clears all user-specific assessment responses, habit progress, milestones, and energy check-in data from active server session memory. Framework navigation state is preserved.")
        if st.button("Clear All Session Data Now", key="prog_clear_session_btn", type="secondary"):
            from src.session_utils import reset_user_session_state
            reset_user_session_state(preserve_navigation=True)
            st.success("All user-specific session data cleared successfully.")
            st.rerun()
