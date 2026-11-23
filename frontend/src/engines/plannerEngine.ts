/**
 * src/engines/plannerEngine.ts
 * Deterministic Smart Action Recommendation & Tracking Engine.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - 100% deterministic, explainable rule engine. Zero black-box ML or LLM in recommendation paths.
 *   - Transparent rationale provided for every recommended action.
 *   - Never infers a mental health diagnosis, clinical pathology, or disease state.
 *   - Never prescribes medication, supplements, or medical treatment.
 *   - Operates entirely offline in local client memory.
 */

import type {
  ActionCategory,
  DailyPlanItem,
  DailyProgressSummary,
  StudentGoalId,
  WeeklyPlannerSummary,
  CompletedActionRecord
} from '../contracts/plannerContract.ts';
import { STUDENT_GOALS } from '../contracts/plannerContract.ts';
import type { WeeklyCheckIn } from '../contracts/trendsContract.ts';
import { ACTION_LIBRARY } from './actionLibrary.ts';

export interface RecommendationEngineParams {
  latestCheckIn?: WeeklyCheckIn | null;
  selectedGoals?: StudentGoalId[];
  preferredDailyCount?: number;
  dismissedActionIds?: string[];
  existingPlanActionIds?: string[];
  personalizationEnabled?: boolean;
  currentDate?: string; // YYYY-MM-DD
}

/**
 * Returns a local calendar date string (YYYY-MM-DD) avoiding UTC skew.
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministic recommendation thresholds.
 */
export const THRESHOLDS = {
  LOW_SLEEP_QUALITY_MAX: 2,       // <= 2 triggers Sleep Routine / Relaxation rules
  HIGH_ACADEMIC_PRESSURE_MIN: 4,  // >= 4 triggers Time Management / Study Chunking rules
  LOW_STUDY_SATISFACTION_MAX: 2,  // <= 2 triggers Study & Focus / Admin Triage rules
  LOW_DAILY_ENERGY_MAX: 2,        // <= 2 triggers Daily Movement / Rest rules
  LOW_ROUTINE_BALANCE_MAX: 2      // <= 2 triggers Personal Routine / Buffer rules
};

/**
 * Generates deterministic daily action recommendations based on student reflections,
 * selected goals, and balanced routine baselines.
 */
export function generateDailyRecommendations(params: RecommendationEngineParams): DailyPlanItem[] {
  const {
    latestCheckIn = null,
    selectedGoals = [],
    preferredDailyCount = 3,
    dismissedActionIds = [],
    existingPlanActionIds = [],
    personalizationEnabled = true,
    currentDate = getLocalDateString()
  } = params;

  // Allow count to be 0 or 1 when fulfilling partial replacement slots
  const count = Math.max(0, Math.min(5, preferredDailyCount));
  if (count === 0) {
    return [];
  }

  const dismissedSet = new Set(dismissedActionIds);
  const existingSet = new Set(existingPlanActionIds);

  // Filter available candidate actions from library
  const availableActions = ACTION_LIBRARY.filter(
    (action) => !dismissedSet.has(action.id) && !existingSet.has(action.id)
  );

  const matchedItems: DailyPlanItem[] = [];
  const addedActionIds = new Set<string>();

  // 1. REFLECTION-DRIVEN RULES (Active if personalization enabled & check-in present)
  if (personalizationEnabled && latestCheckIn) {
    // Rule A: Low Sleep Quality (<= 2)
    if (latestCheckIn.sleepQuality <= THRESHOLDS.LOW_SLEEP_QUALITY_MAX) {
      const sleepAction = availableActions.find(
        (a) => a.category === 'Sleep Routine' && !addedActionIds.has(a.id)
      );
      if (sleepAction) {
        matchedItems.push({
          actionId: sleepAction.id,
          action: sleepAction,
          status: 'pending',
          priority: 'high',
          whySuggested: `Suggested because your latest sleep quality reflection was in the lower range (${latestCheckIn.sleepQuality}/5).`,
          dateAdded: currentDate
        });
        addedActionIds.add(sleepAction.id);
      }
    }

    // Rule B: High Academic Pressure (>= 4)
    if (latestCheckIn.academicPressure >= THRESHOLDS.HIGH_ACADEMIC_PRESSURE_MIN) {
      const pressureAction = availableActions.find(
        (a) =>
          (a.category === 'Time Management' || a.category === 'Study & Focus') &&
          !addedActionIds.has(a.id)
      );
      if (pressureAction) {
        matchedItems.push({
          actionId: pressureAction.id,
          action: pressureAction,
          status: 'pending',
          priority: 'high',
          whySuggested: `Suggested because your latest academic pressure reflection indicated elevated deadlines (${latestCheckIn.academicPressure}/5).`,
          dateAdded: currentDate
        });
        addedActionIds.add(pressureAction.id);
      }
    }

    // Rule C: Low Study Satisfaction (<= 2)
    if (latestCheckIn.studySatisfaction <= THRESHOLDS.LOW_STUDY_SATISFACTION_MAX) {
      const studyAction = availableActions.find(
        (a) => a.category === 'Study & Focus' && !addedActionIds.has(a.id)
      );
      if (studyAction) {
        matchedItems.push({
          actionId: studyAction.id,
          action: studyAction,
          status: 'pending',
          priority: 'medium',
          whySuggested: `Suggested because your study satisfaction reflection showed friction in learning momentum (${latestCheckIn.studySatisfaction}/5).`,
          dateAdded: currentDate
        });
        addedActionIds.add(studyAction.id);
      }
    }

    // Rule D: Low Daily Energy (<= 2)
    if (latestCheckIn.dailyEnergy <= THRESHOLDS.LOW_DAILY_ENERGY_MAX) {
      const energyAction = availableActions.find(
        (a) => (a.category === 'Daily Movement' || a.category === 'Relaxation') && !addedActionIds.has(a.id)
      );
      if (energyAction) {
        matchedItems.push({
          actionId: energyAction.id,
          action: energyAction,
          status: 'pending',
          priority: 'high',
          whySuggested: `Suggested because your daily energy reflection was low (${latestCheckIn.dailyEnergy}/5). Gentle movement or rest helps recharge.`,
          dateAdded: currentDate
        });
        addedActionIds.add(energyAction.id);
      }
    }

    // Rule E: Low Routine Balance (<= 2)
    if (latestCheckIn.routineBalance <= THRESHOLDS.LOW_ROUTINE_BALANCE_MAX) {
      const routineAction = availableActions.find(
        (a) => (a.category === 'Personal Routine' || a.category === 'Time Management') && !addedActionIds.has(a.id)
      );
      if (routineAction) {
        matchedItems.push({
          actionId: routineAction.id,
          action: routineAction,
          status: 'pending',
          priority: 'medium',
          whySuggested: `Suggested because your routine balance reflection showed scheduling congestion (${latestCheckIn.routineBalance}/5).`,
          dateAdded: currentDate
        });
        addedActionIds.add(routineAction.id);
      }
    }
  }

  // 2. STUDENT-SELECTED GOALS RULES
  if (selectedGoals.length > 0) {
    for (const goalId of selectedGoals) {
      if (matchedItems.length >= count) break;

      const goalDef = STUDENT_GOALS.find((g) => g.id === goalId);
      if (!goalDef) continue;

      const goalAction = availableActions.find(
        (a) => a.category === goalDef.targetCategory && !addedActionIds.has(a.id)
      );

      if (goalAction) {
        matchedItems.push({
          actionId: goalAction.id,
          action: goalAction,
          status: 'pending',
          priority: matchedItems.length === 0 ? 'high' : 'medium',
          whySuggested: `Suggested to advance your personal goal: "${goalDef.label}".`,
          dateAdded: currentDate
        });
        addedActionIds.add(goalAction.id);
      }
    }
  }

  // 3. BALANCED DEFAULT FALLBACK (Ensures non-empty, diversified plan even with 0 check-ins and 0 goals)
  const categoryRotation: ActionCategory[] = [
    'Study & Focus',
    'Daily Movement',
    'Personal Routine',
    'Relaxation',
    'Time Management',
    'Sleep Routine'
  ];

  for (const cat of categoryRotation) {
    if (matchedItems.length >= count) break;

    const fallbackAction = availableActions.find(
      (a) => a.category === cat && !addedActionIds.has(a.id)
    );

    if (fallbackAction) {
      matchedItems.push({
        actionId: fallbackAction.id,
        action: fallbackAction,
        status: 'pending',
        priority: 'low',
        whySuggested: 'Suggested as a foundational habit to support daily collegiate routine balance.',
        dateAdded: currentDate
      });
      addedActionIds.add(fallbackAction.id);
    }
  }

  // Slice strictly to preferred daily action count
  return matchedItems.slice(0, count);
}

/**
 * Computes deterministic daily progress statistics.
 */
export function computeDailyProgress(items: DailyPlanItem[], date?: string): DailyProgressSummary {
  const currentDate = date || getLocalDateString();
  const total = items.length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const skipped = items.filter((i) => i.status === 'skipped').length;
  const postponed = items.filter((i) => i.status === 'postponed').length;
  const remaining = items.filter((i) => i.status === 'pending').length;

  const totalMinutes = items.reduce((sum, item) => sum + (item.action.estimatedDuration || 0), 0);
  const completedMinutes = items
    .filter((i) => i.status === 'completed')
    .reduce((sum, item) => sum + (item.action.estimatedDuration || 0), 0);

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    date: currentDate,
    totalRecommended: total,
    completedCount: completed,
    skippedCount: skipped,
    postponedCount: postponed,
    remainingCount: remaining,
    completionPercentage: percentage,
    totalEstimatedMinutes: totalMinutes,
    completedMinutes: completedMinutes
  };
}

/**
 * Computes deterministic weekly progress summary from completed action records.
 */
export function computeWeeklySummary(
  history: CompletedActionRecord[],
  targetWeek?: string
): WeeklyPlannerSummary {
  const currentWeek = targetWeek || getISOWeekIdentifier(getLocalDateString());

  // Filter history strictly for the target week
  const weekRecords = history.filter((h) => h.weekIdentifier === currentWeek);

  const totalCompleted = weekRecords.length;

  const breakdown: Record<ActionCategory, number> = {
    'Study & Focus': 0,
    'Sleep Routine': 0,
    'Relaxation': 0,
    'Daily Movement': 0,
    'Personal Routine': 0,
    'Time Management': 0
  };

  for (const rec of weekRecords) {
    if (rec.category in breakdown) {
      breakdown[rec.category]++;
    }
  }

  // Determine most frequent category
  let mostFrequentCategory: ActionCategory | 'None' = 'None';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(breakdown) as [ActionCategory, number][]) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCategory = cat;
    }
  }

  // Consistency tier
  let consistency: WeeklyPlannerSummary['weeklyConsistency'] = 'Getting Started';
  if (totalCompleted >= 10) {
    consistency = 'High Consistency';
  } else if (totalCompleted >= 6) {
    consistency = 'Steady Pace';
  } else if (totalCompleted >= 3) {
    consistency = 'Building Momentum';
  } else {
    consistency = 'Getting Started';
  }

  // Friendly reflection (non-clinical!)
  let reflection = 'Every small habit completed supports your daily academic balance.';
  if (totalCompleted === 0) {
    reflection = 'No habits completed yet this week. Choose 1 small 5-minute action whenever you are ready.';
  } else if (mostFrequentCategory !== 'None') {
    reflection = `You completed ${totalCompleted} action${totalCompleted > 1 ? 's' : ''} this week, with strong focus on ${mostFrequentCategory}. Small, consistent actions build sustainable study routines.`;
  }

  return {
    weekIdentifier: currentWeek,
    totalActionsCompleted: totalCompleted,
    mostFrequentCategory,
    categoryBreakdown: breakdown,
    weeklyConsistency: consistency,
    friendlyReflection: reflection
  };
}

/**
 * Helper to compute ISO week identifier (YYYY-Www).
 */
export function getISOWeekIdentifier(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
