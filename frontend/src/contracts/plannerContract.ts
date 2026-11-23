/**
 * src/contracts/plannerContract.ts
 * Smart Action Planner Contract & Schema.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - The Smart Action Planner is an educational productivity and daily routine tool.
 *   - It NEVER predicts, diagnoses, or scores depression, anxiety, or clinical risk.
 *   - It NEVER accesses, receives, derives, or persists PHQ-9 responses or Item 9 data.
 *   - It NEVER prescribes medication, supplements, or clinical therapies.
 *   - It NEVER recommends reducing sleep to increase academic productivity.
 *   - In-memory execution: zero external network transmission or cloud tracking.
 */

export type ActionCategory =
  | 'Study & Focus'
  | 'Sleep Routine'
  | 'Relaxation'
  | 'Daily Movement'
  | 'Personal Routine'
  | 'Time Management';

export type ActionDifficulty = 'easy' | 'moderate';

export type ActionPriority = 'high' | 'medium' | 'low';

export type ActionStatus = 'pending' | 'completed' | 'skipped' | 'postponed';

export type StudentGoalId =
  | 'improve_study_consistency'
  | 'maintain_sleep_routine'
  | 'take_regular_breaks'
  | 'improve_time_management'
  | 'build_balanced_routine';

export interface StudentGoalDefinition {
  id: StudentGoalId;
  label: string;
  description: string;
  targetCategory: ActionCategory;
  iconName: string;
}

export const STUDENT_GOALS: StudentGoalDefinition[] = [
  {
    id: 'improve_study_consistency',
    label: 'Improve study consistency',
    description: 'Build steady, sustainable study blocks without last-minute cramming.',
    targetCategory: 'Study & Focus',
    iconName: 'BookOpen'
  },
  {
    id: 'maintain_sleep_routine',
    label: 'Maintain a regular sleep routine',
    description: 'Protect bedtime and wake-up regularity for better natural rest.',
    targetCategory: 'Sleep Routine',
    iconName: 'Moon'
  },
  {
    id: 'take_regular_breaks',
    label: 'Take regular breaks',
    description: 'Incorporate short restorative respites to prevent cognitive fatigue.',
    targetCategory: 'Relaxation',
    iconName: 'Coffee'
  },
  {
    id: 'improve_time_management',
    label: 'Improve time management',
    description: 'Break assignments into bite-sized tasks and schedule realistic study hours.',
    targetCategory: 'Time Management',
    iconName: 'Clock'
  },
  {
    id: 'build_balanced_routine',
    label: 'Build a balanced daily routine',
    description: 'Balance academic deadlines with physical movement, meals, and rest.',
    targetCategory: 'Personal Routine',
    iconName: 'Smile'
  }
];

export type ActionTriggerRule =
  | 'LOW_SLEEP_QUALITY'
  | 'HIGH_ACADEMIC_PRESSURE'
  | 'LOW_STUDY_SATISFACTION'
  | 'LOW_DAILY_ENERGY'
  | 'LOW_ROUTINE_BALANCE'
  | 'GOAL_STUDY_CONSISTENCY'
  | 'GOAL_SLEEP_ROUTINE'
  | 'GOAL_TAKE_BREAKS'
  | 'GOAL_TIME_MANAGEMENT'
  | 'GOAL_BALANCED_ROUTINE'
  | 'GENERAL_WELLBEING';

export interface PlannerAction {
  id: string;
  title: string;
  shortDescription: string;
  category: ActionCategory;
  estimatedDuration: number; // in minutes (e.g. 5, 10, 15, 20, 25)
  difficulty: ActionDifficulty;
  triggerRule: ActionTriggerRule;
  instructions: string[]; // step-by-step practical steps
  safetyOrSuitabilityNote?: string;
  rationaleTemplate: string;
}

export interface DailyPlanItem {
  actionId: string;
  action: PlannerAction;
  status: ActionStatus;
  priority: ActionPriority;
  whySuggested: string;
  dateAdded: string; // ISO date string (YYYY-MM-DD)
  completedAt?: string; // ISO timestamp
}

export interface DailyPlanState {
  date: string; // ISO date string (YYYY-MM-DD)
  items: DailyPlanItem[];
  preferredDailyCount: number; // 2 to 5 (default 3)
  personalizationEnabled: boolean; // default true
  selectedGoals: StudentGoalId[];
  dismissedActionIds: string[];
}

export interface DailyProgressSummary {
  date: string;
  totalRecommended: number;
  completedCount: number;
  skippedCount: number;
  postponedCount: number;
  remainingCount: number;
  completionPercentage: number; // 0 to 100
  totalEstimatedMinutes: number;
  completedMinutes: number;
}

export interface CompletedActionRecord {
  id: string; // unique record ID
  actionId: string;
  actionTitle: string;
  category: ActionCategory;
  date: string; // YYYY-MM-DD
  weekIdentifier: string; // YYYY-Www
  completedAt: string; // ISO timestamp
  durationMinutes: number;
}

export interface WeeklyPlannerSummary {
  weekIdentifier: string;
  totalActionsCompleted: number;
  mostFrequentCategory: ActionCategory | 'None';
  categoryBreakdown: Record<ActionCategory, number>;
  weeklyConsistency: 'Building Momentum' | 'Steady Pace' | 'High Consistency' | 'Getting Started';
  friendlyReflection: string;
}

/**
 * Forbidden clinical & diagnostic properties.
 */
const FORBIDDEN_CLINICAL_PROPERTIES = [
  'phq9Answers',
  'item9',
  'phq9Score',
  'depression',
  'severity',
  'riskTier',
  'clinicalScore',
  'suicide',
  'crisisTriggered'
];

/**
 * Validates that an action payload does not violate privacy boundaries.
 */
export function validatePlannerInputSafety(payload: any): { isValid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be an object.' };
  }

  for (const forbidden of FORBIDDEN_CLINICAL_PROPERTIES) {
    if (forbidden in payload) {
      return {
        isValid: false,
        error: `Security violation: Prohibited clinical field "${forbidden}" detected in Smart Action Planner payload.`
      };
    }
  }

  return { isValid: true };
}
