"""
src/views/wellness_planner.py
Mindora – Student Wellness Planner & Daily Action Center.
Implements the ACT phase of the student wellbeing journey.
Enables students to choose, schedule, and complete practical, non-clinical
wellbeing habits in ephemeral session storage.
"""

import html
import streamlit as st
from src.ui_theme import (
    PRIMARY_VIOLET,
    SECONDARY_VIOLET,
    LAVENDER,
    LIGHT_SURFACE,
    MAIN_TEXT
)

WELLNESS_DOMAINS = [
    {
        "domain": "Sleep Architecture & Circadian Health",
        "icon": "🌙",
        "habits": [
            {
                "id": "sleep_winddown",
                "title": "Establish a 45-Minute Screen-Free Wind-Down Buffer",
                "desc": "Blue light suppresses natural melatonin release. Put devices away 45 minutes before sleep and switch to reading, gentle stretching, or relaxing music."
            },
            {
                "id": "sleep_anchor",
                "title": "Anchor a Consistent Wake Time",
                "desc": "Waking up at the same hour each morning (within 30 minutes) reinforces circadian stability and daytime alertness."
            },
            {
                "id": "sleep_cool_dark",
                "title": "Create a Dark, Quiet & Cool Sleep Sanctuary",
                "desc": "Lower bedroom temperature and block ambient light to facilitate deeper slow-wave restorative sleep."
            }
        ]
    },
    {
        "domain": "Digital Wellness & Cognitive Focus",
        "icon": "📱",
        "habits": [
            {
                "id": "digital_pomodoro",
                "title": "25-Minute Phone-Free Pomodoro Study Block",
                "desc": "Place your phone in a bag or across the room. Study for 25 focused minutes, followed by a 5-minute cognitive rest."
            },
            {
                "id": "digital_curate",
                "title": "Mute or Unfollow Upward-Comparison Accounts",
                "desc": "Audit your social media feeds. Mute profiles or topics that trigger comparison, inadequacy, or anxiety."
            },
            {
                "id": "digital_notifications",
                "title": "Batch Social Notifications into Designated Windows",
                "desc": "Check social apps twice daily rather than interrupting study flows for every ding or ping."
            }
        ]
    },
    {
        "domain": "Academic Decompression & Workload",
        "icon": "📚",
        "habits": [
            {
                "id": "acad_micro_chunks",
                "title": "Deconstruct Large Coursework into Micro-Tasks",
                "desc": "Break daunting assignments into 3 bite-sized steps (e.g. outline first, draft next) to eliminate overwhelm."
            },
            {
                "id": "acad_office_hours",
                "title": "Utilize Peer Study Groups or Faculty Office Hours",
                "desc": "Clarify challenging concepts early with mentors or classmates rather than struggling in solitary isolation."
            },
            {
                "id": "acad_rest_break",
                "title": "Take Genuine Rest Breaks (Zero Coursework Reflection)",
                "desc": "Allow your brain to consolidate learning by stepping away from study materials during meal and rest times."
            }
        ]
    },
    {
        "domain": "Physical Movement & Outdoor Sunlight",
        "icon": "🏃",
        "habits": [
            {
                "id": "phys_sunlight_walk",
                "title": "20-Minute Morning Walk in Natural Sunlight",
                "desc": "Morning outdoor photons stimulate cortisol awakening response and synchronize evening melatonin onset."
            },
            {
                "id": "phys_desk_stretch",
                "title": "5-Minute Desk Decompression Stretches",
                "desc": "Release neck, shoulder, and spinal tension caused by prolonged laptop posture."
            },
            {
                "id": "phys_hydration",
                "title": "Stay Consciously Hydrated Throughout Study Sessions",
                "desc": "Even 2% dehydration impairs working memory and elevates subjective fatigue."
            }
        ]
    },
    {
        "domain": "Social Connection & Peer Support",
        "icon": "🤝",
        "habits": [
            {
                "id": "soc_peer_contact",
                "title": "Schedule a 15-Minute Coffee or Walk with a Classmate",
                "desc": "Brief, genuine peer interactions alleviate loneliness and provide mutual perspective during stressful terms."
            },
            {
                "id": "soc_campus_club",
                "title": "Explore a University Hobby or Interest Club",
                "desc": "Connecting with students outside your immediate academic discipline builds a broader campus support network."
            }
        ]
    }
]

def render_wellness_planner():
    """Render the student wellness planner and interactive habit checklist."""
    # Initialize session state for habits
    if "completed_habits" not in st.session_state:
        st.session_state.completed_habits = set()
    if "daily_energy_checkin" not in st.session_state:
        st.session_state.daily_energy_checkin = "😐 Steady"

    st.markdown(
        f"""
        <div style="margin-bottom: 20px;">
            <div class="mindora-badge">Action & Habit Building</div>
            <h2 style="font-size: 2.1rem; margin: 4px 0 8px 0; color: {PRIMARY_VIOLET};">
                🎯 Student Wellness Planner
            </h2>
            <p style="color: #64748B; font-size: 0.95rem; margin: 0;">
                Turn personal insights into sustainable everyday micro-habits. Choose 2 to 3 focus areas to commit to during this session.
            </p>
        </div>
        """,
        unsafe_allow_html=True
    )

    # Habit Progress Bar
    total_habits = sum(len(d["habits"]) for d in WELLNESS_DOMAINS)
    completed_count = len(st.session_state.completed_habits)
    progress_pct = min(1.0, completed_count / 5.0)  # Aim for up to 5 habits/day

    col_prog1, col_prog2 = st.columns([2, 1])
    with col_prog1:
        st.markdown(
            f"""
            <div style="background: {LIGHT_SURFACE}; border-radius: 14px; padding: 14px 18px; border: 1px solid rgba(139, 92, 246, 0.16); margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 700; color: {PRIMARY_VIOLET}; font-size: 0.9rem;">
                        Today's Habit Commitment (Active Session)
                    </span>
                    <span style="font-size: 0.85rem; font-weight: 800; color: {PRIMARY_VIOLET};">
                        {completed_count} Completed
                    </span>
                </div>
            </div>
            """,
            unsafe_allow_html=True
        )
        st.progress(progress_pct)
        if completed_count > 0:
            st.caption(f"✨ Excellent progress! You have completed {completed_count} wellbeing habits in this session.")
        else:
            st.caption("Select small habits below to commit to during this session's study and rest periods. Note: Habit selections reside in temporary server session memory and reset when your session ends.")

    with col_prog2:
        st.markdown(
            f"""
            <div style="background: #FFFFFF; border-radius: 14px; padding: 14px 18px; border: 1px solid rgba(139, 92, 246, 0.16); margin-bottom: 20px;">
                <span style="font-size: 0.78rem; color: #64748B; display: block; font-weight: 600;">Energy Check-in</span>
                <strong style="color: {PRIMARY_VIOLET}; font-size: 1.05rem;">{html.escape(str(st.session_state.daily_energy_checkin))}</strong>
            </div>
            """,
            unsafe_allow_html=True
        )

    # Daily Energy & Mood Reflection
    with st.expander("⚡ How is your energy and mood feeling today?", expanded=False):
        energy_option = st.radio(
            "Select your current energy level:",
            ["😴 Exhausted / Overwhelmed", "🥱 Low Energy", "😐 Steady / Balanced", "😊 Good Energy", "⚡ Energized & Focused"],
            index=2,
            horizontal=True
        )
        if energy_option != st.session_state.daily_energy_checkin:
            st.session_state.daily_energy_checkin = energy_option

    has_results = st.session_state.get("assessment_submitted", False) and st.session_state.get("latest_results") is not None
    dismissed = st.session_state.get("dismissed_recommendations", set())
    feedback = st.session_state.get("recommendation_feedback", {})

    if has_results:
        recs = st.session_state.latest_results.get("recommendations", [])
        active_recs = [r for r in recs if r.get("id") not in dismissed]
        
        st.markdown("### 🎯 Your Personalised Action Recommendations")
        st.caption("Derived from your recent assessment. Check off completed habits, or dismiss items that don't fit your daily schedule.")
        
        if not active_recs:
            st.info("You have addressed or dismissed all contextual suggestions for this session.")
        else:
            for idx, rec in enumerate(active_recs):
                r_id = rec.get("id", f"rec_{idx}")
                is_done = r_id in st.session_state.completed_habits
                col_c1, col_c2, col_c3 = st.columns([0.08, 0.77, 0.15])
                with col_c1:
                    checked = st.checkbox(
                        label=rec.get("title", "Habit"),
                        value=is_done,
                        key=f"plan_chk_{r_id}",
                        label_visibility="collapsed"
                    )
                    if checked and not is_done:
                        st.session_state.completed_habits.add(r_id)
                        st.rerun()
                    elif not checked and is_done:
                        st.session_state.completed_habits.remove(r_id)
                        st.rerun()
                with col_c2:
                    p_label = rec.get("priority", "Medium")
                    p_color = "#DC2626" if p_label == "High" else ("#6D43C6" if p_label == "Medium" else "#10B981")
                    st.markdown(
                        f"""
                        <div style="background: {'#FAF5FF' if is_done else '#FFFFFF'}; border: 1px solid {'rgba(139, 92, 246, 0.35)' if is_done else 'rgba(139, 92, 246, 0.12)'}; border-left: 4px solid {p_color}; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                                <span style="font-size: 1.1rem;">{rec.get('icon', '💡')}</span>
                                <strong style="color: {PRIMARY_VIOLET if is_done else MAIN_TEXT}; font-size: 0.95rem;">
                                    {'✓ ' if is_done else ''}{html.escape(str(rec.get('title', '')))}
                                </strong>
                                <span style="font-size: 0.72rem; color: #64748B;">({rec.get('estimated_effort', '15 mins')})</span>
                            </div>
                            <p style="font-size: 0.83rem; color: #475569; margin: 2px 0 0 0; line-height: 1.45;">
                                {html.escape(str(rec.get('action', '')))}
                            </p>
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
                with col_c3:
                    if st.button("✕ Dismiss", key=f"plan_dsm_{r_id}_{idx}", use_container_width=True):
                        dismissed.add(r_id)
                        st.session_state.dismissed_recommendations = dismissed
                        st.rerun()

        if dismissed:
            with st.expander(f"👁️ Show Dismissed Recommendations ({len(dismissed)})", expanded=False):
                st.caption("Dismissed items are excluded from active suggestions for this session only.")
                if st.button("Restore All Dismissed Suggestions", key="plan_restore_dsm_btn"):
                    st.session_state.dismissed_recommendations = set()
                    st.rerun()

        st.markdown("---")
    else:
        st.markdown(
            f"""
            <div style="background: {LIGHT_SURFACE}; border: 1px solid rgba(139, 92, 246, 0.16); border-radius: 12px; padding: 14px 18px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <span style="font-size: 1.15rem;">🎯</span>
                    <strong style="color: {PRIMARY_VIOLET}; font-size: 0.92rem;">Unlock Contextual Action Recommendations</strong>
                </div>
                <p style="font-size: 0.83rem; color: #475569; margin: 0; line-height: 1.45;">
                    Complete your 3-minute assessment to unlock prioritised micro-habits tailored to your academic pressure, sleep duration, and digital habits. In the meantime, explore our foundational wellness domains below.
                </p>
            </div>
            """,
            unsafe_allow_html=True
        )

    st.markdown("### 📋 Choose Your Daily Wellbeing Habits")

    for domain_info in WELLNESS_DOMAINS:
        domain_name = domain_info["domain"]
        domain_icon = domain_info["icon"]
        
        st.markdown(
            f"""
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 16px; margin-bottom: 8px;">
                <span style="font-size: 1.25rem;">{domain_icon}</span>
                <h4 style="margin: 0; color: {PRIMARY_VIOLET}; font-size: 1.1rem;">{domain_name}</h4>
            </div>
            """,
            unsafe_allow_html=True
        )

        for habit in domain_info["habits"]:
            h_id = habit["id"]
            is_checked = h_id in st.session_state.completed_habits
            
            col_check, col_desc = st.columns([0.08, 0.92])
            with col_check:
                checked = st.checkbox(
                    label=habit["title"],
                    value=is_checked,
                    key=f"habit_chk_{h_id}",
                    label_visibility="collapsed"
                )
                if checked and not is_checked:
                    st.session_state.completed_habits.add(h_id)
                    st.rerun()
                elif not checked and is_checked:
                    st.session_state.completed_habits.remove(h_id)
                    st.rerun()
            with col_desc:
                st.markdown(
                    f"""
                    <div style="background: {'#FAF5FF' if is_checked else '#FFFFFF'}; border: 1px solid {'rgba(139, 92, 246, 0.35)' if is_checked else 'rgba(139, 92, 246, 0.12)'}; border-radius: 12px; padding: 12px 16px; margin-bottom: 8px;">
                        <strong style="color: {PRIMARY_VIOLET if is_checked else MAIN_TEXT}; font-size: 0.92rem;">
                            {'✓ ' if is_checked else ''}{habit['title']}
                        </strong>
                        <p style="font-size: 0.83rem; color: #64748B; margin: 4px 0 0 0; line-height: 1.45;">
                            {habit['desc']}
                        </p>
                    </div>
                    """,
                    unsafe_allow_html=True
                )

    st.markdown("<br>", unsafe_allow_html=True)
    col_nav1, col_nav2 = st.columns(2)
    with col_nav1:
        if st.button("📈 View My Progress Summary", key="planner_to_progress_btn", use_container_width=True, type="primary"):
            st.session_state.current_page = "📈 My Progress"
            st.rerun()
    with col_nav2:
        if st.button("📊 Review My Insights", key="planner_to_insights_btn", use_container_width=True):
            st.session_state.current_page = "📊 My Insights"
            st.rerun()
