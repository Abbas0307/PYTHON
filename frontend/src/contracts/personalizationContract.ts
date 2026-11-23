/**
 * src/contracts/personalizationContract.ts
 * Mindora 2.0 — Phase 5.11: Personalization & Adaptive Student Experience.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Personalization is 100% voluntary and driven solely by student-explicit choices.
 *   - Non-Diagnostic Boundary: Zero clinical depression scoring, zero anxiety/suicide inference.
 *   - Zero Clinical Data Inputs: Strictly barred from reading PHQ-9, Item 9, or ML predictions.
 *   - Mandatory Safety Protection: Emergency helplines and safety info CANNOT be hidden.
 *   - Volatile Reflection Guarantee: Private reflection texts are never persisted to disk or sent to network.
 */

// ==========================================
// 1. DASHBOARD CUSTOMIZATION & SECTIONS
// ==========================================
export type DashboardSectionId =
  | 'wellbeing_overview'
  | 'weekly_trends'
  | 'smart_action_planner'
  | 'wellness_studio'
  | 'adaptive_recommendations'
  | 'personal_goals'
  | 'daily_checkin'
  | 'weekly_summary'
  | 'activity_timeline'
  | 'privacy_center';

export interface DashboardSectionMetadata {
  id: DashboardSectionId;
  title: string;
  shortLabel: string;
  description: string;
  isMandatory: boolean; // Mandatory sections (e.g. Overview & Safety) cannot be disabled
  defaultVisible: boolean;
  category: 'core' | 'planning' | 'restorative' | 'reflection';
}

export const ALL_DASHBOARD_SECTIONS: DashboardSectionMetadata[] = [
  {
    id: 'wellbeing_overview',
    title: 'Student Wellbeing & Routine Intelligence',
    shortLabel: 'Overview',
    description: 'Explainable lifestyle balance, sleep duration, and study load metrics.',
    isMandatory: true,
    defaultVisible: true,
    category: 'core'
  },
  {
    id: 'daily_checkin',
    title: 'Daily Student Check-In',
    shortLabel: 'Daily Check-In',
    description: 'Brief optional reflection on daily rhythm, breaks, and energy.',
    isMandatory: false,
    defaultVisible: true,
    category: 'reflection'
  },
  {
    id: 'personal_goals',
    title: 'Personal Wellbeing Goals',
    shortLabel: 'Goals',
    description: 'Voluntary student-chosen focus areas with gentle milestone tracking.',
    isMandatory: false,
    defaultVisible: true,
    category: 'planning'
  },
  {
    id: 'adaptive_recommendations',
    title: 'Adaptive Practice Recommendations',
    shortLabel: 'Recommendations',
    description: 'Deterministic micro-habits tailored to your explicitly selected goals and pace.',
    isMandatory: false,
    defaultVisible: true,
    category: 'planning'
  },
  {
    id: 'smart_action_planner',
    title: 'Smart Action Planner',
    shortLabel: 'Action Planner',
    description: 'Structured daily steps and weekly task tracking for academic routines.',
    isMandatory: false,
    defaultVisible: true,
    category: 'planning'
  },
  {
    id: 'wellness_studio',
    title: 'Mindora Wellness Studio',
    shortLabel: 'Wellness Studio',
    description: 'Interactive breathing, grounding, timer, and muscle relaxation exercises.',
    isMandatory: false,
    defaultVisible: true,
    category: 'restorative'
  },
  {
    id: 'weekly_trends',
    title: 'Weekly Wellbeing Trends',
    shortLabel: 'Trends',
    description: 'Self-reported longitudinal patterns in sleep, pressure, energy, and routine.',
    isMandatory: false,
    defaultVisible: true,
    category: 'reflection'
  },
  {
    id: 'weekly_summary',
    title: 'Personalized Weekly Summary',
    shortLabel: 'Weekly Summary',
    description: 'Gentle factual recap of your completed actions and voluntary check-in activity.',
    isMandatory: false,
    defaultVisible: true,
    category: 'reflection'
  },
  {
    id: 'activity_timeline',
    title: 'My Activity Timeline',
    shortLabel: 'Activity Timeline',
    description: 'Unified chronological record of completed focus sessions, actions, and voluntary practices.',
    isMandatory: false,
    defaultVisible: true,
    category: 'reflection'
  },
  {
    id: 'privacy_center',
    title: 'Privacy & My Data',
    shortLabel: 'Privacy & Data',
    description: 'Centralized transparency control over what is stored, encryption status, and data deletion.',
    isMandatory: false,
    defaultVisible: true,
    category: 'core'
  }
];

export const DEFAULT_SECTION_ORDER: DashboardSectionId[] = [
  'wellbeing_overview',
  'daily_checkin',
  'personal_goals',
  'adaptive_recommendations',
  'smart_action_planner',
  'activity_timeline',
  'wellness_studio',
  'weekly_trends',
  'weekly_summary',
  'privacy_center'
];

export type ShortcutId =
  | 'quick_breathing'
  | 'quick_grounding'
  | 'quick_focus_timer'
  | 'quick_daily_checkin'
  | 'quick_action_plan'
  | 'quick_weekly_checkin'
  | 'quick_timeline'
  | 'quick_privacy'
  | 'quick_crisis';

export interface ShortcutMetadata {
  id: ShortcutId;
  label: string;
  description: string;
  targetSection: DashboardSectionId | 'crisis_modal';
  isSafetyShortcut?: boolean;
}

export const ALL_SHORTCUTS: ShortcutMetadata[] = [
  {
    id: 'quick_daily_checkin',
    label: 'Daily Check-In',
    description: 'Take 60 seconds to note how today felt',
    targetSection: 'daily_checkin'
  },
  {
    id: 'quick_breathing',
    label: '2-Min Breathing',
    description: 'Settle cognitive tension with gentle rhythmic breathing',
    targetSection: 'wellness_studio'
  },
  {
    id: 'quick_focus_timer',
    label: 'Focus Sprint',
    description: 'Start a 25m Pomodoro study sprint with gentle chime',
    targetSection: 'wellness_studio'
  },
  {
    id: 'quick_grounding',
    label: '5-4-3-2-1 Reset',
    description: '5 somatic sensory steps to break study tunnel vision',
    targetSection: 'wellness_studio'
  },
  {
    id: 'quick_action_plan',
    label: 'Today’s Plan',
    description: 'Review your personalized daily micro-steps',
    targetSection: 'smart_action_planner'
  },
  {
    id: 'quick_weekly_checkin',
    label: 'Weekly Trends',
    description: 'Log your 5-attribute routine snapshot',
    targetSection: 'weekly_trends'
  },
  {
    id: 'quick_timeline',
    label: 'Activity Timeline',
    description: 'View chronological record of practices and actions',
    targetSection: 'activity_timeline'
  },
  {
    id: 'quick_privacy',
    label: 'Privacy & Data',
    description: 'Review storage, encryption, and deletion controls',
    targetSection: 'privacy_center'
  },
  {
    id: 'quick_crisis',
    label: 'Immediate Support',
    description: 'Campus and national 24/7 emergency helplines',
    targetSection: 'crisis_modal',
    isSafetyShortcut: true
  }
];

// ==========================================
// 2. PERSONAL WELLBEING GOALS
// ==========================================
export type GoalCategory =
  | 'study_routine'
  | 'sleep_schedule'
  | 'study_breaks'
  | 'relaxation'
  | 'routine_balance'
  | 'personal_time';

export type GoalStatus = 'active' | 'paused' | 'completed';

export interface StudentGoal {
  id: string;
  title: string;
  category: GoalCategory;
  description: string;
  isCustom: boolean;
  status: GoalStatus;
  targetPerWeek: number;
  completedCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface PresetGoalTemplate {
  id: string;
  title: string;
  category: GoalCategory;
  description: string;
  recommendedWeeklyTarget: number;
}

export const PRESET_GOALS: PresetGoalTemplate[] = [
  {
    id: 'goal-improve-study-routine',
    title: 'Improve study routine',
    category: 'study_routine',
    description: 'Establish consistent start times and prioritize high-focus study blocks without late-night cramming.',
    recommendedWeeklyTarget: 4
  },
  {
    id: 'goal-consistent-sleep',
    title: 'Maintain a consistent sleep schedule',
    category: 'sleep_schedule',
    description: 'Target a regular sleep window to stabilize morning alertness and cognitive retention.',
    recommendedWeeklyTarget: 5
  },
  {
    id: 'goal-regular-breaks',
    title: 'Take regular study breaks',
    category: 'study_breaks',
    description: 'Step away from screens every 25–45 minutes to prevent visual and mental fatigue.',
    recommendedWeeklyTarget: 5
  },
  {
    id: 'goal-practice-relaxation',
    title: 'Practice relaxation activities',
    category: 'relaxation',
    description: 'Dedicate 5 to 10 minutes to breathing, progressive relaxation, or acoustic decompression.',
    recommendedWeeklyTarget: 3
  },
  {
    id: 'goal-routine-balance',
    title: 'Improve daily routine balance',
    category: 'routine_balance',
    description: 'Balance academic deadlines with nourishing meals, hydration, and physical movement.',
    recommendedWeeklyTarget: 4
  },
  {
    id: 'goal-personal-time',
    title: 'Make time for personal activities',
    category: 'personal_time',
    description: 'Protect guilt-free time for hobbies, friendships, or quiet solitude outside coursework.',
    recommendedWeeklyTarget: 2
  }
];

// ==========================================
// 3. ADAPTIVE RECOMMENDATION ENGINE
// ==========================================
export type RecommendationTarget =
  | 'wellness_studio'
  | 'action_planner'
  | 'study_break'
  | 'relaxation_activity';

export interface AdaptiveRecommendation {
  id: string;
  title: string;
  category: GoalCategory;
  targetType: RecommendationTarget;
  targetId?: string;
  actionRoute?: string;
  howToStart?: string;
  description: string;
  rationale: string;
  linkedGoalId?: string;
  estimatedMinutes: number;
  isDismissed: boolean;
  status?: 'pending' | 'accepted' | 'completed' | 'remind_later';
  userRating?: 'useful' | 'not_useful';
}

export interface RecommendationPreferences {
  preferredDurationMinutes: number; // e.g. 5, 15, 30
  favoriteCategories: GoalCategory[];
  dismissedRecommendationIds: string[];
  usefulRecommendationIds: string[];
  notUsefulRecommendationIds: string[];
}

// ==========================================
// 4. DAILY STUDENT CHECK-IN
// ==========================================
export type BreakExperience = 'yes' | 'somewhat' | 'no';

export interface DailyCheckInRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayRating?: number; // 1 to 5
  studyRoutineRating?: number; // 1 to 5
  energyRating?: number; // 1 to 5
  tookBreaks?: BreakExperience;
  tomorrowFocus?: string;
  privateReflection?: string; // TRANSIENT ONLY
  completedAt: string;
}

// ==========================================
// 5. PERSONALIZED WEEKLY SUMMARY
// ==========================================
export interface WeeklyPersonalSummaryData {
  weekIdentifier: string; // e.g. "2026-W47"
  plannerActionsCompleted: number;
  wellnessSessionsCompleted: number;
  focusMinutesTotal: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  checkInsCompletedCount: number;
  topCategories: string[];
  factualObservations: string[];
  hasActivity: boolean;
}

// ==========================================
// 6. ACCESSIBILITY & DISPLAY PREFERENCES
// ==========================================
export type FontSizeOption = 'standard' | 'large' | 'extra_large';
export type ReducedMotionOption = 'system' | 'reduced' | 'standard';
export type ContrastOption = 'standard' | 'high_contrast';
export type LayoutDensity = 'compact' | 'standard' | 'spacious';

export interface AccessibilityPreferences {
  fontSize: FontSizeOption;
  reducedMotion: ReducedMotionOption;
  highContrast: ContrastOption;
  soundEnabled: boolean;
  density: LayoutDensity;
  language: 'en';
}

export const VERIFIED_LANGUAGES = [
  {
    code: 'en' as const,
    name: 'English',
    nativeName: 'English (US / UK / Global)',
    isComplete: true,
    verificationDate: '2026-11-16'
  }
];

// ==========================================
// 7. COMPLETE PERSONALIZATION STATE
// ==========================================
export interface PersonalizationState {
  visibleSections: DashboardSectionId[];
  sectionOrder: DashboardSectionId[];
  preferredShortcuts: ShortcutId[];
  goals: StudentGoal[];
  dailyCheckIn: DailyCheckInRecord | null;
  recommendationPreferences: RecommendationPreferences;
  accessibility: AccessibilityPreferences;
}

export const DEFAULT_PERSONALIZATION_STATE: PersonalizationState = {
  visibleSections: [...DEFAULT_SECTION_ORDER],
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  preferredShortcuts: [
    'quick_daily_checkin',
    'quick_breathing',
    'quick_focus_timer',
    'quick_action_plan',
    'quick_crisis'
  ],
  goals: [
    {
      id: 'goal-improve-study-routine',
      title: 'Improve study routine',
      category: 'study_routine',
      description: 'Establish consistent start times and prioritize high-focus study blocks without late-night cramming.',
      isCustom: false,
      status: 'active',
      targetPerWeek: 4,
      completedCount: 0,
      createdAt: '2026-11-16'
    },
    {
      id: 'goal-regular-breaks',
      title: 'Take regular study breaks',
      category: 'study_breaks',
      description: 'Step away from screens every 25–45 minutes to prevent visual and mental fatigue.',
      isCustom: false,
      status: 'active',
      targetPerWeek: 5,
      completedCount: 0,
      createdAt: '2026-11-16'
    }
  ],
  dailyCheckIn: null,
  recommendationPreferences: {
    preferredDurationMinutes: 15,
    favoriteCategories: ['study_routine', 'study_breaks', 'relaxation'],
    dismissedRecommendationIds: [],
    usefulRecommendationIds: [],
    notUsefulRecommendationIds: []
  },
  accessibility: {
    fontSize: 'standard',
    reducedMotion: 'system',
    highContrast: 'standard',
    soundEnabled: false,
    density: 'standard',
    language: 'en'
  }
};
