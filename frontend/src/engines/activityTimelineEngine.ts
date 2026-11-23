/**
 * src/engines/activityTimelineEngine.ts
 * Mindora 2.0 — Phase 5.12: Unified Student Activity Timeline Aggregator & Filter.
 * 
 * STRICT PRIVACY & CLINICAL INVARIANTS:
 *   - Strictly Factual & Non-Diagnostic: Aggregates genuine completed events without inference.
 *   - Zero Clinical Data Inclusion: Explicitly excludes PHQ-9 answers, Item 9 flags, depression risk,
 *     private reflections, raw personal notes, and ML outputs.
 *   - Zero Fabrication: Does not invent events; returns an honest empty state when no activity exists.
 *   - Anti-Gamification: Zero streaks, competitive scores, or normative judgments.
 */

import type {
  TimelineClearScope,
  TimelineEvent,
  TimelineFilterOptions
} from '../contracts/activityTimelineContract.ts';
import { TIMELINE_CATEGORY_METADATA } from '../contracts/activityTimelineContract.ts';
import { wellnessStore } from './wellnessEngine.ts';
import { plannerStorage } from '../storage/vault/plannerStorage.ts';
import { personalizationStorage } from '../storage/personalizationStorage.ts';
import { trendStorage } from '../storage/vault/trendStorage.ts';

/**
 * Normalizes and aggregates student activity records across all Mindora 2.0 voluntary modules.
 */
export function getUnifiedActivityTimeline(): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // 1. Completed Wellness Studio Sessions
  try {
    const wellnessSessions = wellnessStore.getCompletedSessions();
    for (const session of wellnessSessions) {
      const today = new Date().toISOString().slice(0, 10);
      events.push({
        id: session.id,
        title: session.title,
        category: 'wellness',
        categoryLabel: TIMELINE_CATEGORY_METADATA.wellness.label,
        timestamp: `${today}T${session.completedAt || '12:00:00'}`,
        displayDate: today,
        displayTime: session.completedAt || 'Session',
        description: `Completed ${session.durationMinutes}-minute restorative session in Wellness Studio.`,
        sourceFeature: 'wellness_studio',
        sourceLabel: 'Wellness Studio',
        durationMinutes: session.durationMinutes,
        isCompleted: true
      });
    }
  } catch {
    // Graceful fallback if module uninitialized
  }

  // 2. Completed Smart Action Planner Steps
  try {
    const completedActions = plannerStorage.getCompletedHistory();
    for (const action of completedActions) {
      const datePart = action.date || action.completedAt.slice(0, 10);
      const timePart = action.completedAt.includes('T')
        ? action.completedAt.slice(11, 16)
        : 'Recorded';
      events.push({
        id: action.id,
        title: action.actionTitle,
        category: 'planner',
        categoryLabel: TIMELINE_CATEGORY_METADATA.planner.label,
        timestamp: action.completedAt,
        displayDate: datePart,
        displayTime: timePart,
        description: `Completed collegiate micro-step in category: ${action.category}.`,
        sourceFeature: 'smart_action_planner',
        sourceLabel: 'Action Planner',
        durationMinutes: action.durationMinutes,
        isCompleted: true
      });
    }
  } catch {
    // Graceful fallback
  }

  // 3. Completed Personal Goals
  try {
    const completedGoals = personalizationStorage.getState().goals.filter(
      (g) => g.status === 'completed'
    );
    for (const goal of completedGoals) {
      const dateStr = goal.completedAt || goal.createdAt;
      events.push({
        id: `goal-${goal.id}`,
        title: goal.title,
        category: 'goals',
        categoryLabel: TIMELINE_CATEGORY_METADATA.goals.label,
        timestamp: `${dateStr}T23:59:59`,
        displayDate: dateStr,
        displayTime: 'Completed',
        description: `Reached self-selected weekly target for personal focus area (${goal.category.replace('_', ' ')}).`,
        sourceFeature: 'personal_goals',
        sourceLabel: 'Personal Goals',
        isCompleted: true
      });
    }
  } catch {
    // Graceful fallback
  }

  // 4. Daily Student Check-Ins (Factual ratings ONLY, strictly zero private reflections)
  try {
    const checkIns = personalizationStorage.getCheckInHistory();
    for (const chk of checkIns) {
      events.push({
        id: chk.id,
        title: `Daily Check-In (${chk.date})`,
        category: 'checkin',
        categoryLabel: TIMELINE_CATEGORY_METADATA.checkin.label,
        timestamp: `${chk.date}T${chk.completedAt || '12:00:00'}`,
        displayDate: chk.date,
        displayTime: chk.completedAt || 'Recorded',
        description: `Noted daily rhythm: day pace ${chk.dayRating || '—'}/5 · energy ${chk.energyRating || '—'}/5 · breaks: ${chk.tookBreaks || '—'}.`,
        sourceFeature: 'daily_checkin',
        sourceLabel: 'Daily Check-In',
        isCompleted: true
      });
    }
  } catch {
    // Graceful fallback
  }

  // 5. Weekly Trends Check-Ins (Metadata only)
  try {
    const weeklyTrends = trendStorage.getCheckIns();
    for (const trend of weeklyTrends) {
      const datePart = trend.date || new Date(trend.timestamp).toISOString().slice(0, 10);
      const isoTimestamp = trend.date ? `${trend.date}T12:00:00` : new Date(trend.timestamp).toISOString();
      events.push({
        id: trend.id,
        title: `Weekly Wellbeing Snapshot (${trend.weekIdentifier})`,
        category: 'trends',
        categoryLabel: TIMELINE_CATEGORY_METADATA.trends.label,
        timestamp: isoTimestamp,
        displayDate: datePart,
        displayTime: 'Weekly Log',
        description: `Logged 5-attribute longitudinal snapshot (Sleep ${trend.sleepQuality}/5 · Academic Pressure ${trend.academicPressure}/5).`,
        sourceFeature: 'weekly_trends',
        sourceLabel: 'Weekly Trends',
        isCompleted: true
      });
    }
  } catch {
    // Graceful fallback
  }

  // Sort chronologically descending (most recent first)
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return events;
}

/**
 * Filters the activity timeline according to user preferences.
 */
export function filterActivityTimeline(
  events: TimelineEvent[],
  filters: TimelineFilterOptions
): TimelineEvent[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return events.filter((ev) => {
    // Category Filter
    if (filters.category !== 'all' && ev.category !== filters.category) {
      return false;
    }

    // Date Range Filter
    if (filters.dateRange === 'today') {
      if (ev.displayDate !== todayStr) return false;
    } else if (filters.dateRange === 'this_week') {
      if (ev.displayDate < oneWeekAgo) return false;
    }

    // Search Query Filter
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      const match =
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.sourceLabel.toLowerCase().includes(q) ||
        ev.categoryLabel.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Safely clears eligible timeline records within the requested scope.
 * Never touches the encrypted Weekly Trends vault or unrelated browser data.
 */
export function clearEligibleTimelineData(scope: TimelineClearScope): {
  success: boolean;
  clearedScope: TimelineClearScope;
  message: string;
} {
  if (scope === 'wellness') {
    wellnessStore.clearSessionHistory();
    return {
      success: true,
      clearedScope: 'wellness',
      message: 'Volatile Wellness Studio session history cleared.'
    };
  }

  if (scope === 'planner') {
    plannerStorage.clearAllData();
    return {
      success: true,
      clearedScope: 'planner',
      message: 'Smart Action Planner completed history cleared.'
    };
  }

  // 'all_timeline'
  wellnessStore.clearSessionHistory();
  plannerStorage.clearAllData();
  return {
    success: true,
    clearedScope: 'all_timeline',
    message: 'Eligible timeline activity records (wellness sessions and planner steps) cleared.'
  };
}
