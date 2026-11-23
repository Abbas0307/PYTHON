/**
 * src/contracts/activityTimelineContract.ts
 * Mindora 2.0 — Phase 5.12: Unified Student Activity Timeline Contracts.
 * 
 * STRICT PRIVACY & CLINICAL INVARIANTS:
 *   - Strictly Voluntary & Factual: Records only student-initiated collegiate actions.
 *   - Non-Diagnostic Boundary: Zero clinical depression scoring, zero psychometrics.
 *   - Excludes Sensitive Inputs: Strictly no PHQ-9 answers, Item 9 triggers, depression risk,
 *     private reflection notes, raw personal thoughts, or ML predictions.
 *   - Anti-Gamification: Zero streaks, badges, points, or competitive leaderboards.
 *   - Provenance Tracking: Every event identifies its genuine source module.
 */

export type TimelineSourceFeature =
  | 'wellness_studio'
  | 'smart_action_planner'
  | 'personal_goals'
  | 'daily_checkin'
  | 'weekly_trends';

export type TimelineCategory =
  | 'wellness'
  | 'planner'
  | 'goals'
  | 'checkin'
  | 'trends';

export interface TimelineEvent {
  id: string;
  title: string;
  category: TimelineCategory;
  categoryLabel: string;
  timestamp: string; // ISO 8601 or formatted date/time for sorting
  displayTime: string;
  displayDate: string;
  description: string;
  sourceFeature: TimelineSourceFeature;
  sourceLabel: string;
  durationMinutes?: number;
  isCompleted: boolean;
}

export type TimelineCategoryFilter = 'all' | TimelineCategory;
export type TimelineDateFilter = 'all' | 'today' | 'this_week';

export interface TimelineFilterOptions {
  category: TimelineCategoryFilter;
  dateRange: TimelineDateFilter;
  searchQuery?: string;
}

export type TimelineClearScope = 'all_timeline' | 'wellness' | 'planner';

export const TIMELINE_CATEGORY_METADATA: Record<
  TimelineCategory,
  { label: string; color: string; badgeVariant: 'violet' | 'slate' | 'amber' | 'emerald' | 'indigo' }
> = {
  wellness: {
    label: 'Wellness Practice',
    color: 'violet',
    badgeVariant: 'violet'
  },
  planner: {
    label: 'Study Action',
    color: 'indigo',
    badgeVariant: 'indigo'
  },
  goals: {
    label: 'Personal Goal',
    color: 'emerald',
    badgeVariant: 'emerald'
  },
  checkin: {
    label: 'Daily Check-In',
    color: 'amber',
    badgeVariant: 'amber'
  },
  trends: {
    label: 'Weekly Trends',
    color: 'slate',
    badgeVariant: 'slate'
  }
};
