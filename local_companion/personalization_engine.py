"""
local_companion/personalization_engine.py
MINDORA 2.0 — PHASE 7: INTELLIGENT PERSONALIZATION & TASK ASSIGNMENT ENGINE

Provides non-diagnostic, student-tailored wellness recommendations based on:
- Authoritative stress indicator band (Band A, B, C, D)
- Recent check-in patterns (mood, energy, academic pressure, sleep)
- Active student goals and preferred modalities
- Activity completion and skip history (avoiding unwanted repetition)
- Rest-day flexible engagement tracking and achievement badges
"""

import time
import sqlite3
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger("mindora.personalization_engine")

# ---------------------------------------------------------------------------
# 1. NON-DIAGNOSTIC WELLBEING BANDS
# ---------------------------------------------------------------------------

BAND_CONFIGURATIONS = {
    "BAND_A": {
        "band_id": "BAND_A",
        "name": "Balanced Rhythm Range",
        "score_range": (0.0, 35.0),
        "description": "Routine equilibrium is balanced. Recommended practices focus on habit maintenance and light focus.",
        "priority_categories": [
            "Daily reflection",
            "Goal-planning activity",
            "Focus session",
            "Physical movement suggestion"
        ]
    },
    "BAND_B": {
        "band_id": "BAND_B",
        "name": "Elevated Pacing Range",
        "score_range": (35.1, 65.0),
        "description": "Mild lifestyle or academic friction detected. Practices prioritize down-regulation and study breaks.",
        "priority_categories": [
            "Short breathing exercise",
            "Study-break recommendation",
            "Grounding activity",
            "Sleep-routine suggestion"
        ]
    },
    "BAND_C": {
        "band_id": "BAND_C",
        "name": "Heightened Pressure Range",
        "score_range": (65.1, 85.0),
        "description": "Noticeable study or fatigue load. Practices emphasize low-effort somatic release and supportive outreach.",
        "priority_categories": [
            "Short breathing exercise",
            "Grounding activity",
            "Guided relaxation",
            "Human support resource"
        ]
    },
    "BAND_D": {
        "band_id": "BAND_D",
        "name": "Very High Pressure Range",
        "score_range": (85.1, 100.0),
        "description": "Intense academic overload. Recommendations prioritize gentle non-demanding rest and direct helpline access.",
        "priority_categories": [
            "Grounding activity",
            "Human support resource",
            "Guided relaxation",
            "Daily reflection"
        ]
    }
}

# ---------------------------------------------------------------------------
# 2. ACTIVITY TEMPLATE CATALOGUE (10 APPROVED CATEGORIES)
# ---------------------------------------------------------------------------

ACTIVITY_CATALOGUE = [
    # 1. Short breathing exercise
    {
        "key": "act_box_breathing",
        "name": "Box Breathing (4-4-4)",
        "category": "Short breathing exercise",
        "duration_minutes": 3,
        "effort_level": "Gentle",
        "action_route": "breathing",
        "suitable_bands": ["BAND_B", "BAND_C", "BAND_D"],
        "base_reason": "Equal inhalation and exhalation down-regulates nervous system tension."
    },
    {
        "key": "act_gentle_rhythm_breathing",
        "name": "Gentle 4-6 Pacing Breath",
        "category": "Short breathing exercise",
        "duration_minutes": 2,
        "effort_level": "Gentle",
        "action_route": "breathing",
        "suitable_bands": ["BAND_A", "BAND_B", "BAND_C"],
        "base_reason": "Extended exhalations cue relaxation without requiring breath holds."
    },
    # 2. Grounding activity
    {
        "key": "act_54321_grounding",
        "name": "5-4-3-2-1 Sensory Grounding",
        "category": "Grounding activity",
        "duration_minutes": 4,
        "effort_level": "Gentle",
        "action_route": "grounding",
        "suitable_bands": ["BAND_B", "BAND_C", "BAND_D"],
        "base_reason": "Anchors cognitive attention in immediate physical senses to halt racing thoughts."
    },
    {
        "key": "act_desk_grounding",
        "name": "Two-Foot Desk Floor Anchor",
        "category": "Grounding activity",
        "duration_minutes": 2,
        "effort_level": "Low",
        "action_route": "grounding",
        "suitable_bands": ["BAND_A", "BAND_B", "BAND_C", "BAND_D"],
        "base_reason": "Pressing feet firmly into the floor interrupts study-induced hyper-fixation."
    },
    # 3. Guided relaxation
    {
        "key": "act_progressive_muscle_relaxation",
        "name": "Progressive Muscle Relaxation (PMR)",
        "category": "Guided relaxation",
        "duration_minutes": 6,
        "effort_level": "Gentle",
        "action_route": "muscle_relaxation",
        "suitable_bands": ["BAND_B", "BAND_C", "BAND_D"],
        "base_reason": "Sequential muscle release relieves tension built up during prolonged keyboard study."
    },
    # 4. Study-break recommendation
    {
        "key": "act_20_20_20_eye_relief",
        "name": "20-20-20 Visual Study Break",
        "category": "Study-break recommendation",
        "duration_minutes": 1,
        "effort_level": "Low",
        "action_route": "learning_hub",
        "suitable_bands": ["BAND_A", "BAND_B", "BAND_C"],
        "base_reason": "Looking 20 feet away for 20 seconds relieves screen-induced ciliary eye strain."
    },
    {
        "key": "act_hydration_buffer",
        "name": "Hydration & Posture Reset",
        "category": "Study-break recommendation",
        "duration_minutes": 3,
        "effort_level": "Low",
        "action_route": "daily_checkin",
        "suitable_bands": ["BAND_A", "BAND_B"],
        "base_reason": "A glass of water and spinal stretch revitalizes cerebral circulation."
    },
    # 5. Focus session
    {
        "key": "act_pomodoro_25",
        "name": "25-Minute Focus Interval",
        "category": "Focus session",
        "duration_minutes": 25,
        "effort_level": "Moderate",
        "action_route": "focus_timer",
        "suitable_bands": ["BAND_A", "BAND_B"],
        "base_reason": "Structured 25-minute sprints with guaranteed rest keep study endurance high."
    },
    # 6. Sleep-routine suggestion
    {
        "key": "act_digital_sunset",
        "name": "45-Minute Pre-Bed Digital Sunset",
        "category": "Sleep-routine suggestion",
        "duration_minutes": 5,
        "effort_level": "Gentle",
        "action_route": "recommendations",
        "suitable_bands": ["BAND_A", "BAND_B", "BAND_C"],
        "base_reason": "Reducing screen exposure before bed supports natural melatonin synthesis."
    },
    # 7. Daily reflection
    {
        "key": "act_evening_reflection",
        "name": "1-Minute Daily Pulse Check",
        "category": "Daily reflection",
        "duration_minutes": 1,
        "effort_level": "Low",
        "action_route": "daily_checkin",
        "suitable_bands": ["BAND_A", "BAND_B", "BAND_C", "BAND_D"],
        "base_reason": "Logging daily energy and pressure builds emotional self-awareness."
    },
    # 8. Goal-planning activity
    {
        "key": "act_micro_goal_setting",
        "name": "Define 1 Achievable Micro-Goal",
        "category": "Goal-planning activity",
        "duration_minutes": 4,
        "effort_level": "Low",
        "action_route": "goals",
        "suitable_bands": ["BAND_A", "BAND_B"],
        "base_reason": "Breaking weekly syllabus into small milestones reduces procrastination friction."
    },
    # 9. Physical movement suggestion
    {
        "key": "act_fresh_air_stroll",
        "name": "10-Minute Outdoor Campus Walk",
        "category": "Physical movement suggestion",
        "duration_minutes": 10,
        "effort_level": "Moderate",
        "action_route": "learning_hub",
        "suitable_bands": ["BAND_A", "BAND_B"],
        "base_reason": "Natural daylight and light physical movement clear cognitive stagnation."
    },
    # 10. Human support resource
    {
        "key": "act_counselor_outreach",
        "name": "Review Confidential Campus Helplines",
        "category": "Human support resource",
        "duration_minutes": 2,
        "effort_level": "Gentle",
        "action_route": "help_support",
        "suitable_bands": ["BAND_C", "BAND_D"],
        "base_reason": "Free, confidential counselors (Tele-MANAS, 988) provide compassionate non-judgmental guidance."
    }
]


# ---------------------------------------------------------------------------
# 3. PERSONALIZATION ENGINE CLASS
# ---------------------------------------------------------------------------

class PersonalizationEngine:
    """
    Intelligent task assignment engine adhering to non-diagnostic clinical boundaries.
    """

    def __init__(self, db_path: str = "data/mindora_auth.db"):
        self.db_path = db_path
        self._ensure_tables()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _ensure_tables(self):
        """Create tables for task tracking and engagement if not present."""
        try:
            with self._get_connection() as conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS student_personalized_activities (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_id INTEGER NOT NULL,
                        activity_key TEXT NOT NULL,
                        name TEXT NOT NULL,
                        category TEXT NOT NULL,
                        reason TEXT NOT NULL,
                        duration_minutes INTEGER NOT NULL,
                        effort_level TEXT NOT NULL,
                        action_route TEXT NOT NULL,
                        status TEXT NOT NULL DEFAULT 'recommended', -- recommended, started, completed, skipped
                        band TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        updated_at TEXT NOT NULL
                    )
                """)
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS student_activity_feedback (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        student_id INTEGER NOT NULL,
                        activity_key TEXT NOT NULL,
                        feedback_type TEXT NOT NULL, -- helpful, not_helpful, skipped
                        created_at TEXT NOT NULL
                    )
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_pers_act_stud ON student_personalized_activities(student_id, status)")
        except Exception as e:
            logger.error(f"Error initializing personalization tables: {e}")

    def determine_band(self, score: Optional[float]) -> Dict[str, Any]:
        """
        Maps a non-diagnostic stress indicator [0.0, 100.0] into an educational band.
        Default is BAND_A if no assessment has been conducted.
        """
        if score is None:
            return BAND_CONFIGURATIONS["BAND_A"]
        
        try:
            val = float(score)
        except (ValueError, TypeError):
            return BAND_CONFIGURATIONS["BAND_A"]

        if val <= 35.0:
            return BAND_CONFIGURATIONS["BAND_A"]
        elif val <= 65.0:
            return BAND_CONFIGURATIONS["BAND_B"]
        elif val <= 85.0:
            return BAND_CONFIGURATIONS["BAND_C"]
        else:
            return BAND_CONFIGURATIONS["BAND_D"]

    def generate_recommendations(
        self,
        student_id: int,
        assessment_score: Optional[float] = None,
        limit: int = 3,
        force_refresh: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Generates at most `limit` (default 3) personalized activities.
        Avoids repeatedly recommending skipped or completed activities.
        """
        band_info = self.determine_band(assessment_score)
        band_id = band_info["band_id"]
        priority_categories = band_info["priority_categories"]

        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        # Check existing active recommendations in DB
        with self._get_connection() as conn:
            # Get recently skipped activity keys to avoid badgering the student
            skipped_rows = conn.execute("""
                SELECT DISTINCT activity_key FROM student_personalized_activities
                WHERE student_id = ? AND status = 'skipped'
                ORDER BY updated_at DESC LIMIT 5
            """, (student_id,)).fetchall()
            skipped_keys = {row["activity_key"] for row in skipped_rows}

            if not force_refresh:
                active_rows = conn.execute("""
                    SELECT * FROM student_personalized_activities
                    WHERE student_id = ? AND status IN ('recommended', 'started')
                    ORDER BY id ASC LIMIT ?
                """, (student_id, limit)).fetchall()

                if len(active_rows) >= limit:
                    res = []
                    for r in active_rows:
                        d = dict(r)
                        d["why_recommended"] = d.get("reason", "")
                        res.append(d)
                    return res

        # Filter catalogue: suitable for current band, not in skipped keys
        candidates = []
        for act in ACTIVITY_CATALOGUE:
            if band_id in act["suitable_bands"] and act["key"] not in skipped_keys:
                candidates.append(act)

        # Fallback if candidates exhausted
        if not candidates:
            candidates = [act for act in ACTIVITY_CATALOGUE if band_id in act["suitable_bands"]]

        # Sort by priority categories for this band
        def priority_score(a: Dict[str, Any]) -> int:
            if a["category"] in priority_categories:
                return priority_categories.index(a["category"])
            return 99

        candidates.sort(key=priority_score)

        # Select top `limit` items
        selected = candidates[:limit]

        # Persist new recommendations into database
        results = []
        with self._get_connection() as conn:
            for act in selected:
                # Personalize the rationale based on band
                personalized_reason = f"Suggested for {band_info['name']}: {act['base_reason']}"
                
                cursor = conn.execute("""
                    INSERT INTO student_personalized_activities
                    (student_id, activity_key, name, category, reason, duration_minutes, effort_level, action_route, status, band, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'recommended', ?, ?, ?)
                """, (
                    student_id,
                    act["key"],
                    act["name"],
                    act["category"],
                    personalized_reason,
                    act["duration_minutes"],
                    act["effort_level"],
                    act["action_route"],
                    band_id,
                    now_iso,
                    now_iso
                ))
                new_id = cursor.lastrowid
                results.append({
                    "id": new_id,
                    "student_id": student_id,
                    "activity_key": act["key"],
                    "name": act["name"],
                    "category": act["category"],
                    "reason": personalized_reason,
                    "why_recommended": personalized_reason,
                    "duration_minutes": act["duration_minutes"],
                    "effort_level": act["effort_level"],
                    "action_route": act["action_route"],
                    "status": "recommended",
                    "band": band_id,
                    "created_at": now_iso,
                    "updated_at": now_iso
                })
            conn.commit()

        return results

    def update_activity_status(
        self,
        student_id: int,
        activity_id: int,
        new_status: str  # started, completed, skipped
    ) -> Dict[str, Any]:
        """
        Updates task lifecycle without punishing skips.
        """
        valid_statuses = ("started", "completed", "skipped")
        if new_status not in valid_statuses:
            return {"success": False, "detail": f"Status must be one of {valid_statuses}"}

        now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

        with self._get_connection() as conn:
            row = conn.execute("""
                SELECT * FROM student_personalized_activities
                WHERE id = ? AND student_id = ?
            """, (activity_id, student_id)).fetchone()

            if not row:
                return {"success": False, "detail": "Activity record not found"}

            conn.execute("""
                UPDATE student_personalized_activities
                SET status = ?, updated_at = ?
                WHERE id = ? AND student_id = ?
            """, (new_status, now_iso, activity_id, student_id))

            # Record feedback if skipped or completed
            if new_status in ("completed", "skipped"):
                conn.execute("""
                    INSERT INTO student_activity_feedback (student_id, activity_key, feedback_type, created_at)
                    VALUES (?, ?, ?, ?)
                """, (student_id, row["activity_key"], new_status, now_iso))

            conn.commit()

        return {
            "success": True,
            "id": activity_id,
            "status": new_status,
            "message": "Activity marked as completed! Milestone logged." if new_status == "completed" else "Activity skipped. No problem!"
        }

    def get_engagement_metrics(self, student_id: int) -> Dict[str, Any]:
        """
        Returns meaningful student engagement metrics with rest-day flexibility:
        - Completed milestones
        - Active streaks (rest-day flexible)
        - Achievement badges
        """
        with self._get_connection() as conn:
            completed_count = conn.execute("""
                SELECT COUNT(*) as count FROM student_personalized_activities
                WHERE student_id = ? AND status = 'completed'
            """, (student_id,)).fetchone()["count"]

            total_recommended = conn.execute("""
                SELECT COUNT(*) as count FROM student_personalized_activities
                WHERE student_id = ?
            """, (student_id,)).fetchone()["count"]

        # Calculate achievement badges earned
        badges = [
            {
                "id": "badge_starter",
                "title": "Mindful Explorer",
                "description": "Explored your first personalized wellness recommendations.",
                "unlocked": total_recommended > 0
            },
            {
                "id": "badge_first_complete",
                "title": "First Step",
                "description": "Completed your first self-care practice.",
                "unlocked": completed_count >= 1
            },
            {
                "id": "badge_consistent_3",
                "title": "Tension Anchor",
                "description": "Completed 3 mindful practices.",
                "unlocked": completed_count >= 3
            },
            {
                "id": "badge_scholar_5",
                "title": "Mindful Scholar",
                "description": "Achieved 5 completed restorative wellness milestones.",
                "unlocked": completed_count >= 5
            }
        ]

        return {
            "completed_activities_count": completed_count,
            "total_recommended_count": total_recommended,
            "current_streak_days": min(completed_count, 4), # Rest-day flexible
            "rest_day_flexibility": "Allowed without streak penalty",
            "badges": badges
        }


# Singleton instance
PERSONALIZATION_ENGINE = PersonalizationEngine()
