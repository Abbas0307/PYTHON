/**
 * src/engines/personalSummaryEngine.ts
 * Mindora 2.0 — Personalized Weekly Activity Summary Engine.
 * 
 * STRICT PRIVACY & CLINICAL INVARIANTS:
 *   - Strictly Factual: Summarizes recorded voluntary collegiate activities.
 *   - Zero Clinical Claims: Never equates activity counts to mental health recovery or clinical improvement.
 *   - Zero Inferred Diagnoses: Never computes depression risk or psychological scores.
 *   - Zero Fabricated Data: Shows an honest empty state when no records exist.
 */

import type {
  DailyCheckInRecord,
  StudentGoal,
  WeeklyPersonalSummaryData
} from '../contracts/personalizationContract.ts';
import type { CompletedActionRecord } from '../contracts/plannerContract.ts';
import type { CompletedWellnessSession } from '../contracts/wellnessContract.ts';

export interface SummaryEngineInput {
  weekIdentifier: string;
  completedPlannerActions: CompletedActionRecord[];
  completedWellnessSessions: CompletedWellnessSession[];
  dailyCheckIns: DailyCheckInRecord[];
  goals: StudentGoal[];
}

/**
 * Computes a factual weekly activity summary from permitted voluntary student interactions.
 */
export function computeWeeklyPersonalSummary(
  input: SummaryEngineInput
): WeeklyPersonalSummaryData {
  const {
    weekIdentifier,
    completedPlannerActions,
    completedWellnessSessions,
    dailyCheckIns,
    goals
  } = input;

  const plannerCount = completedPlannerActions.length;
  const wellnessCount = completedWellnessSessions.length;
  const checkInCount = dailyCheckIns.length;
  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;
  const completedGoalsCount = goals.filter((g) => g.status === 'completed').length;

  // Approximate focus minutes from completed wellness sessions
  const focusMinutesTotal = completedWellnessSessions.reduce(
    (sum, s) => sum + (s.durationMinutes || 0),
    0
  );

  const hasActivity = plannerCount > 0 || wellnessCount > 0 || checkInCount > 0 || completedGoalsCount > 0;

  // Category frequency tally
  const categoryCounts: Record<string, number> = {};
  for (const a of completedPlannerActions) {
    categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
  }
  for (const s of completedWellnessSessions) {
    categoryCounts[s.experienceId] = (categoryCounts[s.experienceId] || 0) + 1;
  }

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // Factual, non-clinical observations
  const factualObservations: string[] = [];

  if (wellnessCount > 0) {
    factualObservations.push(
      `Completed ${wellnessCount} restorative practice ${wellnessCount === 1 ? 'session' : 'sessions'} (${focusMinutesTotal} total active minutes).`
    );
  }

  if (plannerCount > 0) {
    factualObservations.push(
      `Finished ${plannerCount} daily routine micro-${plannerCount === 1 ? 'step' : 'steps'} from your study plan.`
    );
  }

  if (checkInCount > 0) {
    factualObservations.push(
      `Recorded ${checkInCount} optional daily check-in ${checkInCount === 1 ? 'entry' : 'entries'} this week.`
    );
  }

  if (completedGoalsCount > 0) {
    factualObservations.push(
      `Reached completion on ${completedGoalsCount} personal wellbeing ${completedGoalsCount === 1 ? 'goal' : 'goals'}.`
    );
  }

  if (!hasActivity) {
    factualObservations.push(
      'No voluntary activities have been logged for this period yet. Your summary will update as you complete daily micro-steps or practice sessions.'
    );
  }

  return {
    weekIdentifier,
    plannerActionsCompleted: plannerCount,
    wellnessSessionsCompleted: wellnessCount,
    focusMinutesTotal,
    activeGoalsCount,
    completedGoalsCount,
    checkInsCompletedCount: checkInCount,
    topCategories,
    factualObservations,
    hasActivity
  };
}
