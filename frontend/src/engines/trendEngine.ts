/**
 * src/engines/trendEngine.ts
 * Deterministic Weekly Wellbeing Trends & Gentle Insights Engine.
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 *   - 100% deterministic arithmetic (no ML model inference, no LLM calls).
 *   - Generates non-clinical, non-diagnostic observational reflections.
 *   - Does not combine metrics into a composite depression or clinical score.
 *   - Suppresses insights when insufficient historical check-ins exist (< 2 weeks).
 */

import type {
  WeeklyCheckIn,
  TrendMetricKey
} from '../contracts/trendsContract.ts';
import {
  TREND_METRICS
} from '../contracts/trendsContract.ts';

export interface MetricDelta {
  key: TrendMetricKey;
  label: string;
  currentValue: number;
  previousValue: number | null;
  delta: number | null; // currentValue - previousValue
  direction: 'improved' | 'declined' | 'steady' | 'none';
  summaryText: string;
}

export interface GentleInsight {
  id: string;
  category: 'Rest' | 'Academic' | 'Energy' | 'Routine' | 'General';
  relatedMetric: TrendMetricKey;
  observation: string;
  context: string;
}

export interface TrendSummary {
  totalCheckIns: number;
  earliestDate: string | null;
  latestDate: string | null;
  latestWeekIdentifier: string | null;
  metricAverages: Record<TrendMetricKey, number>;
  metricDeltas: Record<TrendMetricKey, MetricDelta>;
  insights: GentleInsight[];
}

/**
 * Sorts check-ins chronologically by date/timestamp.
 */
export function sortCheckInsChronologically(checkIns: WeeklyCheckIn[]): WeeklyCheckIn[] {
  return [...checkIns].sort((a, b) => {
    if (a.weekIdentifier !== b.weekIdentifier) {
      return a.weekIdentifier.localeCompare(b.weekIdentifier);
    }
    return a.timestamp - b.timestamp;
  });
}

/**
 * Computes single-step deltas between the latest check-in and immediately previous check-in.
 */
export function computeMetricDeltas(checkIns: WeeklyCheckIn[]): Record<TrendMetricKey, MetricDelta> {
  const sorted = sortCheckInsChronologically(checkIns);
  const n = sorted.length;
  const latest = n > 0 ? sorted[n - 1] : null;
  const previous = n > 1 ? sorted[n - 2] : null;

  const result: Partial<Record<TrendMetricKey, MetricDelta>> = {};

  for (const metric of TREND_METRICS) {
    const key = metric.key;
    if (!latest) {
      result[key] = {
        key,
        label: metric.label,
        currentValue: 0,
        previousValue: null,
        delta: null,
        direction: 'none',
        summaryText: 'No check-ins recorded yet.'
      };
      continue;
    }

    const currentVal = latest[key];
    const prevVal = previous ? previous[key] : null;
    const delta = prevVal !== null ? currentVal - prevVal : null;

    let direction: MetricDelta['direction'] = 'none';
    let summaryText = 'First recorded check-in.';

    if (delta !== null) {
      if (delta === 0) {
        direction = 'steady';
        summaryText = `Steady at rating ${currentVal}/5 compared to previous week.`;
      } else if (key === 'academicPressure') {
        // For pressure: lower delta means reduced pressure/strain
        direction = delta < 0 ? 'improved' : 'declined';
        summaryText = delta < 0
          ? `Reported academic pressure decreased by ${Math.abs(delta)} point${Math.abs(delta) > 1 ? 's' : ''}.`
          : `Reported academic pressure increased by ${delta} point${delta > 1 ? 's' : ''}.`;
      } else {
        // For sleep, study satisfaction, energy, routine: higher delta is improved
        direction = delta > 0 ? 'improved' : 'declined';
        summaryText = delta > 0
          ? `${metric.label} improved by +${delta} point${delta > 1 ? 's' : ''} compared to previous week.`
          : `${metric.label} rating was ${Math.abs(delta)} point${Math.abs(delta) > 1 ? 's' : ''} lower than previous week.`;
      }
    }

    result[key] = {
      key,
      label: metric.label,
      currentValue: currentVal,
      previousValue: prevVal,
      delta,
      direction,
      summaryText
    };
  }

  return result as Record<TrendMetricKey, MetricDelta>;
}

/**
 * Generates gentle, deterministic, non-diagnostic observations from historical check-ins.
 * 
 * Invariants:
 *   - Returns [] if fewer than 2 check-ins exist (requires history).
 *   - Avoids clinical language, predictions, diagnoses, or judgment.
 *   - Respects 3-week stability patterns when available.
 */
export function generateGentleInsights(checkIns: WeeklyCheckIn[]): GentleInsight[] {
  const sorted = sortCheckInsChronologically(checkIns);
  const n = sorted.length;

  // RULE: Suppress insights when insufficient history exists (< 2 check-ins)
  if (n < 2) {
    return [];
  }

  const latest = sorted[n - 1];
  const previous = sorted[n - 2];
  const threeWeeks = n >= 3 ? sorted.slice(n - 3) : null;

  const insights: GentleInsight[] = [];

  // Insight 1: Sleep Quality Check
  const sleepDelta = latest.sleepQuality - previous.sleepQuality;
  if (sleepDelta > 0) {
    insights.push({
      id: 'insight-sleep-improved',
      category: 'Rest',
      relatedMetric: 'sleepQuality',
      observation: 'Your sleep quality rating improved compared with last week.',
      context: `Current rating: ${latest.sleepQuality}/5 (was ${previous.sleepQuality}/5 last week). Consistent restorative rest supports daytime alertness.`
    });
  } else if (sleepDelta < 0) {
    insights.push({
      id: 'insight-sleep-declined',
      category: 'Rest',
      relatedMetric: 'sleepQuality',
      observation: 'Your sleep quality rating was lower this week compared with last week.',
      context: `Current rating: ${latest.sleepQuality}/5 (was ${previous.sleepQuality}/5 last week). A gentle evening wind-down routine can help restore sleep rhythm.`
    });
  } else if (threeWeeks && threeWeeks.every((w) => w.sleepQuality === latest.sleepQuality)) {
    insights.push({
      id: 'insight-sleep-steady',
      category: 'Rest',
      relatedMetric: 'sleepQuality',
      observation: 'Sleep quality has remained steady over your last three check-ins.',
      context: `Consistent rating of ${latest.sleepQuality}/5 over the past 3 weeks shows a stable rest routine.`
    });
  }

  // Insight 2: Academic Pressure Check
  const pressureDelta = latest.academicPressure - previous.academicPressure;
  if (threeWeeks && threeWeeks.every((w) => Math.abs(w.academicPressure - latest.academicPressure) <= 1)) {
    insights.push({
      id: 'insight-pressure-steady',
      category: 'Academic',
      relatedMetric: 'academicPressure',
      observation: 'Academic pressure has remained similar over your last three check-ins.',
      context: `Ratings have hovered around level ${latest.academicPressure}/5. Consistent pacing helps navigate sustained coursework.`
    });
  } else if (pressureDelta < 0) {
    insights.push({
      id: 'insight-pressure-decreased',
      category: 'Academic',
      relatedMetric: 'academicPressure',
      observation: 'Reported academic pressure decreased compared with your previous check-in.',
      context: `Down to ${latest.academicPressure}/5 from ${previous.academicPressure}/5. A lighter phase can be a good window for routine consolidation.`
    });
  } else if (pressureDelta > 0) {
    insights.push({
      id: 'insight-pressure-increased',
      category: 'Academic',
      relatedMetric: 'academicPressure',
      observation: 'Reported academic pressure increased this week.',
      context: `Rose to ${latest.academicPressure}/5 (was ${previous.academicPressure}/5). When coursework demands rise, preserving sleep and short pauses helps buffer fatigue.`
    });
  }

  // Insight 3: Study Satisfaction Check
  const studyDelta = latest.studySatisfaction - previous.studySatisfaction;
  if (studyDelta > 0) {
    insights.push({
      id: 'insight-study-improved',
      category: 'Academic',
      relatedMetric: 'studySatisfaction',
      observation: 'Your study satisfaction rating increased this week.',
      context: `Up to ${latest.studySatisfaction}/5 from ${previous.studySatisfaction}/5. Acknowledging small wins reinforces effective study habits.`
    });
  } else if (studyDelta < 0) {
    insights.push({
      id: 'insight-study-decreased',
      category: 'Academic',
      relatedMetric: 'studySatisfaction',
      observation: 'Your study satisfaction rating decreased this week.',
      context: `Current rating: ${latest.studySatisfaction}/5 (was ${previous.studySatisfaction}/5). Breaking complex assignments into smaller 25-minute milestones can restore momentum.`
    });
  }

  // Insight 4: Daily Energy Check
  const energyDelta = latest.dailyEnergy - previous.dailyEnergy;
  if (energyDelta > 0) {
    insights.push({
      id: 'insight-energy-improved',
      category: 'Energy',
      relatedMetric: 'dailyEnergy',
      observation: 'Your daily energy rating improved this week.',
      context: `Increased to ${latest.dailyEnergy}/5 from ${previous.dailyEnergy}/5. Sustained daytime energy often reflects good hydration, movement, and sleep.`
    });
  } else if (energyDelta < 0) {
    insights.push({
      id: 'insight-energy-decreased',
      category: 'Energy',
      relatedMetric: 'dailyEnergy',
      observation: 'Daily energy was rated lower this week.',
      context: `Current rating: ${latest.dailyEnergy}/5 (was ${previous.dailyEnergy}/5). Short restorative pauses between study sessions can help restore vitality.`
    });
  }

  // Insight 5: Routine Balance Check
  const routineDelta = latest.routineBalance - previous.routineBalance;
  if (routineDelta > 0) {
    insights.push({
      id: 'insight-routine-improved',
      category: 'Routine',
      relatedMetric: 'routineBalance',
      observation: 'Your routine balance rating improved this week.',
      context: `Rated at ${latest.routineBalance}/5 (up from ${previous.routineBalance}/5). Structured days make time for both productive work and intentional relaxation.`
    });
  } else if (routineDelta < 0) {
    insights.push({
      id: 'insight-routine-decreased',
      category: 'Routine',
      relatedMetric: 'routineBalance',
      observation: 'Routine balance rating was lower this week.',
      context: `Rated at ${latest.routineBalance}/5 (was ${previous.routineBalance}/5). Busy weeks often crowd out personal downtime; setting clear study cut-off times can help.`
    });
  }

  // Limit to top 3 most relevant insights to prevent cognitive overload
  return insights.slice(0, 3);
}

/**
 * Calculates a complete summary of historical trends.
 */
export function calculateTrendSummary(checkIns: WeeklyCheckIn[]): TrendSummary {
  const sorted = sortCheckInsChronologically(checkIns);
  const n = sorted.length;

  const metricKeys: TrendMetricKey[] = ['sleepQuality', 'academicPressure', 'studySatisfaction', 'dailyEnergy', 'routineBalance'];
  const sums: Record<TrendMetricKey, number> = {
    sleepQuality: 0,
    academicPressure: 0,
    studySatisfaction: 0,
    dailyEnergy: 0,
    routineBalance: 0
  };

  for (const c of sorted) {
    for (const key of metricKeys) {
      sums[key] += c[key];
    }
  }

  const metricAverages: Record<TrendMetricKey, number> = {
    sleepQuality: n > 0 ? Number((sums.sleepQuality / n).toFixed(1)) : 0,
    academicPressure: n > 0 ? Number((sums.academicPressure / n).toFixed(1)) : 0,
    studySatisfaction: n > 0 ? Number((sums.studySatisfaction / n).toFixed(1)) : 0,
    dailyEnergy: n > 0 ? Number((sums.dailyEnergy / n).toFixed(1)) : 0,
    routineBalance: n > 0 ? Number((sums.routineBalance / n).toFixed(1)) : 0
  };

  const metricDeltas = computeMetricDeltas(sorted);
  const insights = generateGentleInsights(sorted);

  return {
    totalCheckIns: n,
    earliestDate: n > 0 ? sorted[0].date : null,
    latestDate: n > 0 ? sorted[n - 1].date : null,
    latestWeekIdentifier: n > 0 ? sorted[n - 1].weekIdentifier : null,
    metricAverages,
    metricDeltas,
    insights
  };
}
