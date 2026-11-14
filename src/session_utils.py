"""
src/session_utils.py
Mindora – Session State Management & Data Minimization Utilities.

Centralizes session-associated state initialization, validation,
and comprehensive reset operations.
"""

from typing import Dict, Any, Set, List, Optional
import streamlit as st

# Explicit mapping of all user-specific data keys and their safe initial defaults
USER_SESSION_STATE_DEFAULTS: Dict[str, Any] = {
    "assessment_submitted": False,
    "latest_results": None,
    "completed_habits": set(),
    "session_progress": [],
    "daily_energy_checkin": None
}

# Framework/Navigation keys intentionally retained during data reset
FRAMEWORK_STATE_KEYS: List[str] = [
    "current_page"
]

def reset_user_session_state(state_dict: Optional[Any] = None, preserve_navigation: bool = True) -> Dict[str, Any]:
    """
    Clears all user-specific assessment, habit, progress milestones,
    daily energy check-in, and computed tri-engine result data from
    Streamlit session-associated server memory.
    
    Restores safe default values for all user keys.
    
    If preserve_navigation is True, framework routing state ('current_page')
    is intentionally retained so the student stays in their active view.
    If False, 'current_page' is restored to '🏠 Home / Dashboard'.
    
    Returns the dictionary of reset keys and restored safe defaults.
    """
    if state_dict is None:
        state_dict = st.session_state

    for key, default_val in USER_SESSION_STATE_DEFAULTS.items():
        if isinstance(default_val, set):
            state_dict[key] = set()
        elif isinstance(default_val, list):
            state_dict[key] = []
        else:
            state_dict[key] = default_val
            
    if not preserve_navigation and "current_page" in state_dict:
        state_dict["current_page"] = "🏠 Home / Dashboard"
        
    return USER_SESSION_STATE_DEFAULTS.copy()

def is_user_data_cleared(state_dict: Optional[Any] = None) -> bool:
    """
    Check if all user-specific session state keys are at their cleared default values.
    """
    if state_dict is None:
        state_dict = st.session_state

    if state_dict.get("assessment_submitted") is not False:
        return False
    if state_dict.get("latest_results") is not None:
        return False
    if len(state_dict.get("completed_habits") or set()) > 0:
        return False
    if len(state_dict.get("session_progress") or []) > 0:
        return False
    if state_dict.get("daily_energy_checkin") is not None:
        return False
    return True

def validate_and_sanitize_session_state(state_dict: Optional[Any] = None) -> bool:
    """
    Defensively validate and recover session state if keys contain corrupted,
    unexpected, or missing data structures.
    
    Returns True if session state was completely healthy, False if sanitization/recovery was needed.
    """
    if state_dict is None:
        state_dict = st.session_state

    healthy = True
    if not isinstance(state_dict.get("completed_habits"), set):
        state_dict["completed_habits"] = set()
        healthy = False
    if not isinstance(state_dict.get("session_progress"), list):
        state_dict["session_progress"] = []
        healthy = False
    if not isinstance(state_dict.get("assessment_submitted"), bool):
        state_dict["assessment_submitted"] = False
        healthy = False
    if not isinstance(state_dict.get("current_page"), str) or not state_dict.get("current_page"):
        state_dict["current_page"] = "🏠 Home / Dashboard"
        healthy = False
    return healthy
