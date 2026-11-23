/**
 * src/storage/vault/plannerStorage.ts
 * In-Memory Privacy-First Storage Manager for Smart Action Planner.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Defaults strictly to in-memory transient state.
 *   - Plaintext action records are NEVER written to localStorage or sessionStorage.
 *   - Zero external transmission: purely client-side execution.
 *   - Preserves existing Weekly Trends encrypted local vault without altering its schema.
 */

import type {
  ActionStatus,
  CompletedActionRecord,
  DailyPlanItem,
  DailyPlanState,
  DailyProgressSummary,
  StudentGoalId,
  WeeklyPlannerSummary
} from '../../contracts/plannerContract.ts';
import {
  computeDailyProgress,
  computeWeeklySummary,
  generateDailyRecommendations,
  getISOWeekIdentifier,
  getLocalDateString
} from '../../engines/plannerEngine.ts';
import { ACTION_BY_ID } from '../../engines/actionLibrary.ts';
import { trendStorage } from './trendStorage.ts';

// Volatile in-memory state
let activePlanState: DailyPlanState | null = null;
let completedHistory: CompletedActionRecord[] = [];

/**
 * Helper to get today's date formatted as YYYY-MM-DD using local calendar date.
 */
function getTodayDateString(): string {
  return getLocalDateString();
}

export const plannerStorage = {
  /**
   * Returns the current active plan state for today.
   * If not yet initialized for today, generates initial daily recommendations.
   */
  getPlan(dateOverride?: string): DailyPlanState {
    const today = dateOverride || (activePlanState ? activePlanState.date : getTodayDateString());

    if (!activePlanState || activePlanState.date !== today) {
      // Fetch latest check-in from Weekly Trends (in-memory) if available
      const checkIns = trendStorage.getCheckIns();
      const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;

      const initialGoals: StudentGoalId[] = activePlanState?.selectedGoals || [
        'improve_study_consistency',
        'take_regular_breaks'
      ];
      const preferredCount = activePlanState?.preferredDailyCount || 3;
      const personalization = activePlanState?.personalizationEnabled ?? true;
      const dismissed = activePlanState?.dismissedActionIds || [];

      const recommendedItems = generateDailyRecommendations({
        latestCheckIn,
        selectedGoals: initialGoals,
        preferredDailyCount: preferredCount,
        dismissedActionIds: dismissed,
        personalizationEnabled: personalization,
        currentDate: today
      });

      activePlanState = {
        date: today,
        items: recommendedItems,
        preferredDailyCount: preferredCount,
        personalizationEnabled: personalization,
        selectedGoals: initialGoals,
        dismissedActionIds: dismissed
      };
    }

    return {
      ...activePlanState,
      items: [...activePlanState.items]
    };
  },

  /**
   * Updates the status of an action in today's plan.
   * When marked completed, appends to completed history.
   */
  updateActionStatus(actionId: string, status: ActionStatus): DailyPlanItem | null {
    const plan = this.getPlan();
    const itemIndex = plan.items.findIndex((i: DailyPlanItem) => i.actionId === actionId);

    if (itemIndex === -1) {
      return null;
    }

    const item = plan.items[itemIndex];
    const prevStatus = item.status;
    item.status = status;

    const nowIso = new Date().toISOString();
    const today = plan.date;
    const weekId = getISOWeekIdentifier(today);

    if (status === 'completed') {
      item.completedAt = nowIso;

      // Add to completed history if not already present
      const alreadyLogged = completedHistory.some(
        (h) => h.actionId === actionId && h.date === today
      );
      if (!alreadyLogged) {
        completedHistory.push({
          id: `hist-${actionId}-${Date.now()}`,
          actionId: item.actionId,
          actionTitle: item.action.title,
          category: item.action.category,
          date: today,
          weekIdentifier: weekId,
          completedAt: nowIso,
          durationMinutes: item.action.estimatedDuration
        });
      }
    } else {
      delete item.completedAt;
      // If was previously completed, remove from history
      if (prevStatus === 'completed') {
        completedHistory = completedHistory.filter(
          (h) => !(h.actionId === actionId && h.date === today)
        );
      }
    }

    activePlanState = { ...plan };
    return item;
  },

  /**
   * Dismisses an action from today's plan and replaces it with another candidate if available.
   */
  dismissAction(actionId: string): void {
    const plan = this.getPlan();
    const dismissed = [...new Set([...plan.dismissedActionIds, actionId])];

    // Remove dismissed action from current plan items
    const remainingItems = plan.items.filter((i: DailyPlanItem) => i.actionId !== actionId);

    // Fetch candidate replacements to maintain preferred count
    const checkIns = trendStorage.getCheckIns();
    const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;

    const existingIds = remainingItems.map((i: DailyPlanItem) => i.actionId);
    const needed = Math.max(0, plan.preferredDailyCount - remainingItems.length);

    if (needed > 0) {
      const replacements = generateDailyRecommendations({
        latestCheckIn,
        selectedGoals: plan.selectedGoals,
        preferredDailyCount: needed,
        dismissedActionIds: dismissed,
        existingPlanActionIds: existingIds,
        personalizationEnabled: plan.personalizationEnabled,
        currentDate: plan.date
      });
      remainingItems.push(...replacements);
    }

    activePlanState = {
      ...plan,
      items: remainingItems.slice(0, plan.preferredDailyCount),
      dismissedActionIds: dismissed
    };
  },

  /**
   * Adds an action directly from the library to today's plan.
   */
  addActionToPlan(actionId: string): DailyPlanItem | null {
    const action = ACTION_BY_ID.get(actionId);
    if (!action) return null;

    const plan = this.getPlan();
    if (plan.items.some((i: DailyPlanItem) => i.actionId === actionId)) {
      return null; // Already present
    }

    const newItem: DailyPlanItem = {
      actionId: action.id,
      action,
      status: 'pending',
      priority: 'medium',
      whySuggested: 'Added directly by you to your daily plan.',
      dateAdded: plan.date
    };

    plan.items.push(newItem);
    activePlanState = { ...plan };
    return newItem;
  },

  /**
   * Sets student selected goals and regenerates uncompleted plan items.
   */
  setGoals(goals: StudentGoalId[]): void {
    const plan = this.getPlan();
    const updatedGoals = [...goals];

    // Preserve completed items, regenerate pending/skipped/postponed
    const completedItems = plan.items.filter((i: DailyPlanItem) => i.status === 'completed');
    const existingCompletedIds = completedItems.map((i: DailyPlanItem) => i.actionId);
    const neededCount = Math.max(0, plan.preferredDailyCount - completedItems.length);

    const checkIns = trendStorage.getCheckIns();
    const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;

    const newRecommendations = neededCount > 0 ? generateDailyRecommendations({
      latestCheckIn,
      selectedGoals: updatedGoals,
      preferredDailyCount: neededCount,
      dismissedActionIds: plan.dismissedActionIds,
      existingPlanActionIds: existingCompletedIds,
      personalizationEnabled: plan.personalizationEnabled,
      currentDate: plan.date
    }) : [];

    activePlanState = {
      ...plan,
      selectedGoals: updatedGoals,
      items: [...completedItems, ...newRecommendations].slice(0, plan.preferredDailyCount)
    };
  },

  /**
   * Updates preferred daily action count.
   */
  setPreferredDailyCount(count: number): void {
    const clamped = Math.max(2, Math.min(5, count));
    const plan = this.getPlan();

    if (clamped === plan.preferredDailyCount) return;

    if (clamped < plan.items.length) {
      // Trim pending items from end if count reduced
      const completed = plan.items.filter((i: DailyPlanItem) => i.status === 'completed');
      const pending = plan.items.filter((i: DailyPlanItem) => i.status !== 'completed');
      const keepPendingCount = Math.max(0, clamped - completed.length);
      activePlanState = {
        ...plan,
        preferredDailyCount: clamped,
        items: [...completed, ...pending.slice(0, keepPendingCount)].slice(0, clamped)
      };
    } else {
      // Add more items if count increased
      const needed = Math.max(0, clamped - plan.items.length);
      const checkIns = trendStorage.getCheckIns();
      const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;
      const existingIds = plan.items.map((i: DailyPlanItem) => i.actionId);

      const additions = needed > 0 ? generateDailyRecommendations({
        latestCheckIn,
        selectedGoals: plan.selectedGoals,
        preferredDailyCount: needed,
        dismissedActionIds: plan.dismissedActionIds,
        existingPlanActionIds: existingIds,
        personalizationEnabled: plan.personalizationEnabled,
        currentDate: plan.date
      }) : [];

      activePlanState = {
        ...plan,
        preferredDailyCount: clamped,
        items: [...plan.items, ...additions].slice(0, clamped)
      };
    }
  },

  /**
   * Toggles personalization based on Weekly Wellbeing Trends reflections.
   */
  setPersonalizationEnabled(enabled: boolean): void {
    const plan = this.getPlan();
    activePlanState = {
      ...plan,
      personalizationEnabled: enabled
    };
    // Re-generate pending items
    this.regeneratePendingItems();
  },

  /**
   * Regenerates pending items while keeping completed items intact.
   */
  regeneratePendingItems(): void {
    const plan = this.getPlan();
    const completedItems = plan.items.filter((i: DailyPlanItem) => i.status === 'completed');
    const existingCompletedIds = completedItems.map((i: DailyPlanItem) => i.actionId);
    const neededCount = Math.max(0, plan.preferredDailyCount - completedItems.length);

    const checkIns = trendStorage.getCheckIns();
    const latestCheckIn = checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;

    const newRecommendations = neededCount > 0 ? generateDailyRecommendations({
      latestCheckIn,
      selectedGoals: plan.selectedGoals,
      preferredDailyCount: neededCount,
      dismissedActionIds: plan.dismissedActionIds,
      existingPlanActionIds: existingCompletedIds,
      personalizationEnabled: plan.personalizationEnabled,
      currentDate: plan.date
    }) : [];

    activePlanState = {
      ...plan,
      items: [...completedItems, ...newRecommendations].slice(0, plan.preferredDailyCount)
    };
  },

  /**
   * Resets today's plan completely.
   */
  resetPlan(): void {
    const plan = this.getPlan();
    activePlanState = null;
    this.getPlan(plan.date);
  },

  /**
   * Returns current daily progress.
   */
  getProgress(): DailyProgressSummary {
    const plan = this.getPlan();
    return computeDailyProgress(plan.items, plan.date);
  },

  /**
   * Returns current weekly summary.
   */
  getWeeklySummary(): WeeklyPlannerSummary {
    const today = getTodayDateString();
    const currentWeek = getISOWeekIdentifier(today);
    return computeWeeklySummary(completedHistory, currentWeek);
  },

  /**
   * Returns full completed history.
   */
  getCompletedHistory(): CompletedActionRecord[] {
    return [...completedHistory];
  },

  /**
   * Injects mock or preview completed history (useful for tests and synthetic preview).
   */
  setCompletedHistory(records: CompletedActionRecord[]): void {
    completedHistory = [...records];
  },

  /**
   * Wipes all in-memory planner state.
   */
  clearAllData(): void {
    activePlanState = null;
    completedHistory = [];
  },

  /**
   * Exports planner history and plan to portable JSON file.
   */
  exportData(): { filename: string; content: string; mimeType: string } {
    const today = getTodayDateString();
    const data = {
      exportedAt: new Date().toISOString(),
      plan: this.getPlan(),
      progress: this.getProgress(),
      weeklySummary: this.getWeeklySummary(),
      history: completedHistory
    };

    return {
      filename: `mindora_action_planner_${today}.json`,
      content: JSON.stringify(data, null, 2),
      mimeType: 'application/json'
    };
  }
};
