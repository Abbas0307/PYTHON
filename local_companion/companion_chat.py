"""
local_companion/companion_chat.py
MINDORA 2.0 — PHASE 7: MINDORA AI COMPANION CHAT SERVICE

Provides conversational empathetic student wellness support:
- Chat history persistence per authenticated student in SQLite
- Deterministic crisis and non-diagnostic safety interceptors
- Student-controlled context injection (wellbeing band, goals, completed activities)
- Local LLM inference with intelligent collegiate empathy fallback (never fails offline)
- Clear conversation history capability
"""

import os
import sqlite3
import time
from typing import List, Dict, Any, Optional

from .config import CONFIG
from .model_runtime.safety_guard import SafetyGuard
from .model_runtime.qwen_client import QwenCompanionClient

DB_PATH = CONFIG.db_path

SAFETY_GUARD = SafetyGuard()
QWEN_CLIENT = QwenCompanionClient(
    base_url=CONFIG.ollama_base_url,
    model_name=CONFIG.model_name
)


class CompanionChatManager:
    """Manages chat persistence and conversational AI companion interactions."""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Initializes companion_chat_history table."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS companion_chat_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    context_data TEXT,
                    source TEXT DEFAULT 'companion'
                );
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_chat_history_user_ts
                ON companion_chat_history(user_id, timestamp);
            """)
            conn.commit()

    def get_history(self, user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves chronological chat history for the student."""
        with self._get_connection() as conn:
            rows = conn.execute("""
                SELECT id, user_id, role, content, timestamp, context_data, source
                FROM companion_chat_history
                WHERE user_id = ?
                ORDER BY id ASC
                LIMIT ?
            """, (user_id, limit)).fetchall()

            history = []
            for r in rows:
                history.append({
                    "id": r["id"],
                    "user_id": r["user_id"],
                    "role": r["role"],
                    "content": r["content"],
                    "timestamp": r["timestamp"],
                    "context_data": r["context_data"],
                    "source": r["source"]
                })
            return history

    def save_message(
        self,
        user_id: int,
        role: str,
        content: str,
        context_data: Optional[str] = None,
        source: str = "companion"
    ) -> int:
        """Saves a single message to history."""
        now_iso = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        with self._get_connection() as conn:
            cursor = conn.execute("""
                INSERT INTO companion_chat_history (user_id, role, content, timestamp, context_data, source)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, role, content, now_iso, context_data, source))
            conn.commit()
            return cursor.lastrowid

    def clear_history(self, user_id: int) -> bool:
        """Clears all conversation history for the student."""
        with self._get_connection() as conn:
            conn.execute("""
                DELETE FROM companion_chat_history
                WHERE user_id = ?
            """, (user_id,))
            conn.commit()
            return True

    def get_context_disclosure(self) -> Dict[str, Any]:
        """Provides transparency on data sharing boundaries."""
        return {
            "title": "Student Privacy & Context Boundaries",
            "student_approved_context_items": [
                "Current wellness indicator band (e.g. Balanced, Elevated, Heightened)",
                "Active student self-care goals and study targets",
                "Titles of recently completed wellness practices",
                "Preferred study break rhythm"
            ],
            "strictly_excluded_data": [
                "Private personal journal entries and reflection notes (always encrypted at rest)",
                "Guardian contact details (email addresses and phone numbers)",
                "Clinical psychometric assessment raw numbers or PHQ-9 items",
                "Student account passwords or authentication tokens"
            ],
            "non_diagnostic_declaration": (
                "Mindora AI Companion is an educational wellness assistant designed to encourage "
                "healthy daily habits, mindful pacing, and study routines. It is not a therapist, "
                "physician, or diagnostic instrument."
            )
        }

    def generate_collegiate_response(self, query: str, context_hint: Optional[str] = None) -> str:
        """
        Intelligent, collegiate empathy response fallback when local Ollama is offline or unavailable.
        Provides structured, practical, and warm guidance tailored to students.
        """
        q_lower = query.lower()

        # 1. Exam and Academic Stress
        if any(term in q_lower for term in ["exam", "test", "study", "deadline", "academic", "syllabus", "marks", "grades", "studying"]):
            return (
                "Academic pressure can feel intense, especially when deadlines or exams approach. Here is a grounded approach to regain calm and momentum:\n\n"
                "1. **Chunk Your Syllabus:** Break what you need to study into 25-minute Pomodoro focus blocks with 5-minute pauses. A focused 25 minutes is far more effective than hours of anxious staring.\n"
                "2. **Separate Prep from Worry:** Write down the 2 most important topics you can realistically review today. Focus solely on the first one.\n"
                "3. **Physical Reset:** Before diving in, take 3 slow diaphragmatic breaths (inhale for 4 seconds, exhale for 6). This signals your nervous system that you are safe to focus.\n\n"
                "You are capable of working through this one step at a time. Would you like to set a 25-minute focus timer together or try a quick breathing reset first?"
            )

        # 2. Sleep and Fatigue
        if any(term in q_lower for term in ["sleep", "tired", "insomnia", "exhausted", "fatigue", "awake", "rest", "night"]):
            return (
                "Rest is the foundation of cognitive clarity and emotional resilience. When sleep is disrupted, everything feels heavier.\n\n"
                "Here are gentle, evidence-based practices for restorative sleep:\n"
                "• **The 30-Minute Screen Wind-Down:** Dim bright blue screens 30 minutes before bed. Blue light suppresses melatonin, tricking your brain into staying in active study mode.\n"
                "• **Brain Dump Technique:** If thoughts about tomorrow or tasks are racing, write them down on a scrap paper. Once on paper, your mind knows they won't be forgotten.\n"
                "• **Box Breathing in Bed:** Inhale for 4 seconds, hold for 4, exhale for 4, pause for 4. Repeat 4 cycles to lower your heart rate.\n\n"
                "Would you like to explore our Sleep Routine suggestion or try the Grounding Exercise?"
            )

        # 3. Anxiety, Overwhelm, and Nervousness
        if any(term in q_lower for term in ["anxious", "anxiety", "nervous", "panic", "overwhelm", "stressed", "stress", "scared", "worry"]):
            return (
                "I hear you. When anxiety builds up, it's completely natural for your chest to feel tight or your thoughts to race. You don't have to fix everything right this second.\n\n"
                "Let's ground your attention right here in the present moment:\n"
                "• **5-4-3-2-1 Sensory Reset:** Notice 5 things you can see around you, 4 you can touch, 3 sounds you can hear, 2 scents, and 1 slow breath.\n"
                "• **Feet on the Floor:** Press both soles firmly against the ground. Feel the solid surface supporting you.\n"
                "• **Prolonged Exhale:** Inhale gently through your nose for 4 seconds, and exhale slowly through slightly parted lips for 7 seconds.\n\n"
                "Remember: Thoughts are not facts. You are safe in this moment. Would you like to open the Mindora Breathing Exercise together?"
            )

        # 4. Motivation and Procrastination
        if any(term in q_lower for term in ["procrastinat", "lazy", "focus", "distract", "motivat", "start", "stuck", "bored"]):
            return (
                "Procrastination is rarely about laziness—it's usually an emotional response to feeling overwhelmed, uncertain, or perfectionistic about a task.\n\n"
                "Here is the **2-Minute Starter Rule**:\n"
                "• Give yourself permission to work on the task for just **2 minutes**. Open the document, write one sentence, or read one page.\n"
                "• If you want to stop after 2 minutes, you may. But 80% of the time, overcoming the friction of starting is all you need.\n"
                "• Remove micro-barriers: Clear your desk of clutter, put your phone in another room or on Do Not Disturb, and keep a water bottle nearby.\n\n"
                "What is one tiny task you can do right now in 2 minutes?"
            )

        # 5. Daily Reflection, Feelings, and Mood
        if any(term in q_lower for term in ["feel", "sad", "down", "lonely", "today", "mood", "check in", "hello", "hi", "hey"]):
            greeting = "Hello! I'm your Mindora AI Companion. " if any(term in q_lower for term in ["hello", "hi", "hey"]) else ""
            context_note = f"\n\n(Current context note: {context_hint})" if context_hint else ""
            return (
                f"{greeting}I'm glad you reached out today. How are you taking care of yourself right now?\n\n"
                "Whether you're looking for a quick study break, a guided breathing practice, or just a space to organize your thoughts, I'm here to support your student journey.\n\n"
                "Some ways we can collaborate right now:\n"
                "• 🧘 Try a 3-minute Box Breathing exercise\n"
                "• 🎯 Review your active self-care goals\n"
                "• ⏱️ Start a 25-minute Pomodoro focus block\n"
                "• 📝 Write a reflection in your personal space\n\n"
                "What would feel most helpful for you at this moment?{context_note}"
            )

        # 6. General Supportive Response
        return (
            "Thank you for sharing that with me. As a student, balancing academics, personal life, and wellbeing is a continuous learning process.\n\n"
            "Key pillars to keep in mind:\n"
            "• **Pace over Perfection:** Small, sustainable daily efforts compound into great achievements without burning you out.\n"
            "• **Listen to Your Body:** If your eyes are straining or your concentration is waning, a 5-minute movement or hydration break is productive, not wasteful.\n"
            "• **Reach Out:** Remember that you don't have to carry everything alone—campus peers, counselors, and faculty are valuable allies.\n\n"
            "Is there a specific wellness practice, study technique, or goal you'd like to explore today?"
        )

    def process_chat(
        self,
        user_id: int,
        query: str,
        country: str = "India",
        include_context: bool = True,
        context_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processes student input through safety guardrails, context injection, and model generation.
        Saves exchange to database history.
        """
        # Step 1: Deterministic Crisis Check (< 2ms)
        crisis_result = SAFETY_GUARD.check_crisis(query, country=country)
        if crisis_result:
            msg = crisis_result["message"]
            self.save_message(user_id, "user", query, source="user")
            self.save_message(user_id, "assistant", msg, source="safety_guard_crisis")
            return {
                "role": "assistant",
                "content": msg,
                "is_crisis": True,
                "is_diagnostic": False,
                "source": "safety_guard_crisis",
                "contacts": crisis_result.get("contacts")
            }

        # Step 2: Deterministic Diagnostic Check (< 2ms)
        diag_result = SAFETY_GUARD.check_diagnostic(query)
        if diag_result:
            msg = diag_result["message"]
            self.save_message(user_id, "user", query, source="user")
            self.save_message(user_id, "assistant", msg, source="safety_guard_diagnostic")
            return {
                "role": "assistant",
                "content": msg,
                "is_crisis": False,
                "is_diagnostic": True,
                "source": "safety_guard_diagnostic"
            }

        # Step 3: Context Assembly (if approved by student)
        context_hint = None
        if include_context and context_data:
            band_name = context_data.get("band_name", "")
            active_goals = context_data.get("goals", [])
            completed_acts = context_data.get("completed_activities", [])
            parts = []
            if band_name:
                parts.append(f"Student Wellbeing Band: {band_name}")
            if active_goals:
                parts.append(f"Active Goals: {', '.join(active_goals[:3])}")
            if completed_acts:
                parts.append(f"Recent Completed: {', '.join(completed_acts[:2])}")
            if parts:
                context_hint = "; ".join(parts)

        # Step 4: Model Invocation (Ollama Qwen if available, else collegiate fallback)
        response_content = None
        source = "collegiate_fallback"

        ollama_ok, model_ok, _ = QWEN_CLIENT.is_available()
        if ollama_ok and model_ok:
            try:
                system_prompt = (
                    "You are Mindora AI Companion, an empathetic, supportive, and knowledgeable student wellness assistant. "
                    "Your role is to guide students with academic pressure, stress management, sleep routines, study habits, and mindfulness. "
                    "Maintain an encouraging, practical, and collegiate tone. Keep advice actionable and concise. "
                    "Never provide medical diagnoses or prescribe medications. If the user expresses extreme distress, advise connecting with human support."
                )
                if context_hint:
                    system_prompt += f"\nStudent Context (for tailored advice): {context_hint}"

                llm_response = QWEN_CLIENT.generate(
                    prompt=query,
                    system_prompt=system_prompt,
                    temperature=0.7,
                    max_tokens=350
                )
                if llm_response and len(llm_response.strip()) > 20:
                    response_content = llm_response.strip()
                    source = "local_qwen"
            except Exception:
                response_content = None

        if not response_content:
            response_content = self.generate_collegiate_response(query, context_hint=context_hint)
            source = "collegiate_fallback"

        # Step 5: Save exchange to database
        self.save_message(user_id, "user", query, source="user")
        self.save_message(user_id, "assistant", response_content, context_data=context_hint, source=source)

        return {
            "role": "assistant",
            "content": response_content,
            "is_crisis": False,
            "is_diagnostic": False,
            "source": source,
            "context_included": bool(context_hint)
        }


COMPANION_CHAT_MANAGER = CompanionChatManager()
