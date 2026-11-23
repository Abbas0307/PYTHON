/**
 * src/storage/personalizationStorage.ts
 * Mindora 2.0 — Privacy-First Personalization Storage Manager.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Local-Only Operation: Zero remote network transmission.
 *   - Category Isolation: Non-sensitive UI preferences (section order, theme contrast, font size)
 *     are persisted locally; sensitive private reflections are STRICTLY kept in volatile memory.
 *   - Zero Clinical Leakage: Never stores assessment data, PHQ-9, Item 9, or diagnostic predictions.
 *   - Complete Erasure Control: One-click reset purges all personalization data.
 */

import type {
  DailyCheckInRecord,
  DashboardSectionId,
  PersonalizationState,
  ShortcutId,
  StudentGoal
} from '../contracts/personalizationContract.ts';
import {
  DEFAULT_PERSONALIZATION_STATE,
  DEFAULT_SECTION_ORDER
} from '../contracts/personalizationContract.ts';

const PREFS_STORAGE_KEY = 'mindora_personalization_prefs';

// In-memory active state
let currentState: PersonalizationState = { ...DEFAULT_PERSONALIZATION_STATE };
let checkInHistory: DailyCheckInRecord[] = [];

/**
 * Loads saved non-sensitive preferences from local storage if available.
 */
function loadPersistedPreferences(): Partial<PersonalizationState> | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persists non-sensitive UI configuration to local storage.
 * Explicitly strips out private reflection text.
 */
function persistPreferences(state: PersonalizationState): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const safePayload = {
      visibleSections: state.visibleSections,
      sectionOrder: state.sectionOrder,
      preferredShortcuts: state.preferredShortcuts,
      recommendationPreferences: state.recommendationPreferences,
      accessibility: state.accessibility,
      // Persist goals (non-clinical titles/categories only)
      goals: state.goals.map((g) => ({
        ...g
      }))
    };
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(safePayload));
  } catch {
    // Gracefully handle quota or disabled localStorage
  }
}

// Initialize on module load
const initialSaved = loadPersistedPreferences();
if (initialSaved) {
  currentState = {
    ...DEFAULT_PERSONALIZATION_STATE,
    ...initialSaved,
    // Ensure mandatory sections are always present
    visibleSections: Array.from(new Set([...(initialSaved.visibleSections || DEFAULT_SECTION_ORDER), 'wellbeing_overview'])),
    dailyCheckIn: null // Always start daily check-in fresh in volatile memory
  };
}

export const personalizationStorage = {
  /**
   * Retrieves the current personalization state.
   */
  getState(): PersonalizationState {
    return { ...currentState };
  },

  /**
   * Updates dashboard section visibility.
   * Enforces that mandatory sections (e.g. 'wellbeing_overview') cannot be disabled.
   */
  setVisibleSections(sections: DashboardSectionId[]): void {
    const safeSections = Array.from(new Set([...sections, 'wellbeing_overview' as DashboardSectionId]));
    currentState = {
      ...currentState,
      visibleSections: safeSections
    };
    persistPreferences(currentState);
  },

  /**
   * Updates dashboard section ordering.
   */
  setSectionOrder(order: DashboardSectionId[]): void {
    currentState = {
      ...currentState,
      sectionOrder: order
    };
    persistPreferences(currentState);
  },

  /**
   * Updates preferred shortcuts.
   */
  setPreferredShortcuts(shortcuts: ShortcutId[]): void {
    currentState = {
      ...currentState,
      preferredShortcuts: shortcuts
    };
    persistPreferences(currentState);
  },

  /**
   * Adds or updates a student goal.
   */
  saveGoal(goal: StudentGoal): void {
    const existingIdx = currentState.goals.findIndex((g) => g.id === goal.id);
    let updatedGoals: StudentGoal[];
    if (existingIdx >= 0) {
      updatedGoals = [...currentState.goals];
      updatedGoals[existingIdx] = goal;
    } else {
      updatedGoals = [...currentState.goals, goal];
    }
    currentState = {
      ...currentState,
      goals: updatedGoals
    };
    persistPreferences(currentState);
  },

  /**
   * Removes a student goal by ID.
   */
  removeGoal(goalId: string): void {
    currentState = {
      ...currentState,
      goals: currentState.goals.filter((g) => g.id !== goalId)
    };
    persistPreferences(currentState);
  },

  /**
   * Records today's voluntary check-in.
   * Kept in transient memory for this session; privateReflection is never persisted.
   */
  recordDailyCheckIn(record: DailyCheckInRecord): void {
    currentState = {
      ...currentState,
      dailyCheckIn: record
    };
    // Append to in-memory history if not duplicate date
    const existingIdx = checkInHistory.findIndex((h) => h.date === record.date);
    if (existingIdx >= 0) {
      checkInHistory[existingIdx] = record;
    } else {
      checkInHistory.push(record);
    }
  },

  /**
   * Returns in-memory check-in history.
   */
  getCheckInHistory(): DailyCheckInRecord[] {
    return [...checkInHistory];
  },

  /**
   * Updates recommendation preferences (duration, dismissed, feedback).
   */
  updateRecommendationPreferences(
    updater: (prev: PersonalizationState['recommendationPreferences']) => PersonalizationState['recommendationPreferences']
  ): void {
    currentState = {
      ...currentState,
      recommendationPreferences: updater(currentState.recommendationPreferences)
    };
    persistPreferences(currentState);
  },

  /**
   * Updates accessibility and display preferences.
   */
  updateAccessibility(
    updater: (prev: PersonalizationState['accessibility']) => PersonalizationState['accessibility']
  ): void {
    currentState = {
      ...currentState,
      accessibility: updater(currentState.accessibility)
    };
    persistPreferences(currentState);
  },

  /**
   * Restores default dashboard layout and section order.
   */
  restoreDefaultLayout(): void {
    currentState = {
      ...currentState,
      visibleSections: [...DEFAULT_SECTION_ORDER],
      sectionOrder: [...DEFAULT_SECTION_ORDER]
    };
    persistPreferences(currentState);
  },

  /**
   * Completely purges all stored preferences and resets in-memory state.
   */
  resetAllPersonalization(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(PREFS_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
    currentState = { ...DEFAULT_PERSONALIZATION_STATE };
    checkInHistory = [];
  }
};
