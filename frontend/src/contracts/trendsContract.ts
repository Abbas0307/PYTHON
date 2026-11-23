/**
 * src/contracts/trendsContract.ts
 * Weekly Wellbeing Trends Contract & Non-Diagnostic Check-In Schema.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Tracks ONLY 5 independent, general lifestyle indicators (1–5 scale).
 *   - NEVER accepts, derives, or persists PHQ-9 answers, Item 9 responses,
 *     depression risk scores, or psychiatric clinical predictions.
 *   - Zero external transmission: purely client-side.
 */

export interface WeeklyCheckIn {
  id: string; // e.g. "checkin-2026-W46"
  weekIdentifier: string; // ISO week string: "YYYY-Www" (e.g. "2026-W46")
  date: string; // ISO date string: "YYYY-MM-DD"
  timestamp: number; // Unix epoch ms
  sleepQuality: number; // 1 to 5
  academicPressure: number; // 1 to 5
  studySatisfaction: number; // 1 to 5
  dailyEnergy: number; // 1 to 5
  routineBalance: number; // 1 to 5
}

export type TrendMetricKey = 'sleepQuality' | 'academicPressure' | 'studySatisfaction' | 'dailyEnergy' | 'routineBalance';

export interface MetricDefinition {
  key: TrendMetricKey;
  label: string;
  shortLabel: string;
  category: 'Rest' | 'Academic' | 'Energy' | 'Routine';
  description: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  ratingDescriptions: Record<number, string>;
  accentColor: string;
  bgLight: string;
}

export const TREND_METRICS: MetricDefinition[] = [
  {
    key: 'sleepQuality',
    label: 'Sleep Quality',
    shortLabel: 'Sleep',
    category: 'Rest',
    description: 'Subjective feeling of restfulness and sleep restorative quality upon waking.',
    min: 1,
    max: 5,
    minLabel: 'Very Poor',
    maxLabel: 'Restful & Restorative',
    ratingDescriptions: {
      1: 'Very Poor — Restless, severely disrupted rest',
      2: 'Poor — Frequent waking, unrefreshing sleep',
      3: 'Moderate — Fair sleep, adequate daytime functioning',
      4: 'Good — Mostly uninterrupted and restful',
      5: 'Optimal — Deep, restorative and rejuvenating'
    },
    accentColor: '#7C3AED', // Violet
    bgLight: '#F5F3FF'
  },
  {
    key: 'academicPressure',
    label: 'Academic Pressure',
    shortLabel: 'Pressure',
    category: 'Academic',
    description: 'Perceived intensity of deadlines, exams, and academic expectations this week.',
    min: 1,
    max: 5,
    minLabel: 'Very Low',
    maxLabel: 'Extremely High',
    ratingDescriptions: {
      1: 'Very Low — Minimal coursework tension or deadlines',
      2: 'Mild — Manageable tasks with light pacing',
      3: 'Moderate — Standard collegiate workload',
      4: 'Elevated — Intense deadlines requiring extra focus',
      5: 'Very High — Heavy concurrent academic demands'
    },
    accentColor: '#4F46E5', // Indigo
    bgLight: '#EEF2FF'
  },
  {
    key: 'studySatisfaction',
    label: 'Study Satisfaction',
    shortLabel: 'Satisfaction',
    category: 'Academic',
    description: 'Sense of progress, engagement, and fulfillment in your learning activities.',
    min: 1,
    max: 5,
    minLabel: 'Very Dissatisfied',
    maxLabel: 'Highly Satisfied',
    ratingDescriptions: {
      1: 'Very Dissatisfied — Feeling stuck or disengaged',
      2: 'Somewhat Dissatisfied — Struggling to maintain momentum',
      3: 'Neutral — Steady routine without major highs or lows',
      4: 'Satisfied — Solid learning progress and engagement',
      5: 'Highly Satisfied — Deeply engaged and productive'
    },
    accentColor: '#2563EB', // Blue
    bgLight: '#EFF6FF'
  },
  {
    key: 'dailyEnergy',
    label: 'Daily Energy',
    shortLabel: 'Energy',
    category: 'Energy',
    description: 'General physical and mental vitality throughout daytime hours.',
    min: 1,
    max: 5,
    minLabel: 'Exhausted',
    maxLabel: 'Vibrant & Energized',
    ratingDescriptions: {
      1: 'Exhausted — Depleted, constant afternoon fatigue',
      2: 'Low — Sluggish, requiring frequent effort to stay focused',
      3: 'Moderate — Sufficient energy for daily tasks',
      4: 'Good — Consistent stamina across classes and study',
      5: 'High — Vibrant, sustained focus and alertness'
    },
    accentColor: '#D97706', // Amber
    bgLight: '#FFFBEB'
  },
  {
    key: 'routineBalance',
    label: 'Routine Balance',
    shortLabel: 'Routine',
    category: 'Routine',
    description: 'Harmony between study time, meals, personal recreation, and daily rhythm.',
    min: 1,
    max: 5,
    minLabel: 'Chaotic',
    maxLabel: 'Harmonious & Structured',
    ratingDescriptions: {
      1: 'Chaotic — Unpredictable hours, irregular meals',
      2: 'Fragmented — Difficult to find personal downtime',
      3: 'Moderate — Basic routine with occasional disruptions',
      4: 'Well-Structured — Clear study blocks and regular pauses',
      5: 'Harmonious — Balanced lifestyle pacing and rest'
    },
    accentColor: '#059669', // Emerald
    bgLight: '#ECFDF5'
  }
];

export interface CheckInValidationResult {
  isValid: boolean;
  sanitized?: WeeklyCheckIn;
  errors: string[];
}

/**
 * Calculates the standard ISO 8601 week identifier: "YYYY-Www".
 */
export function getISOWeekIdentifier(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to getISOWeekIdentifier');
  }
  // Target Thursday in current week to decide year
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
  const year = new Date(firstThursday).getUTCFullYear();
  const paddedWeek = weekNum < 10 ? `0${weekNum}` : `${weekNum}`;
  return `${year}-W${paddedWeek}`;
}

/**
 * Formats an ISO week identifier into an accessible human-readable label.
 * Example: "2026-W46" -> "Week 46, 2026"
 */
export function formatWeekLabel(weekIdentifier: string): string {
  const match = weekIdentifier.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekIdentifier;
  const [, year, week] = match;
  return `Week ${parseInt(week, 10)}, ${year}`;
}

/**
 * Strict Input Validation for Weekly Check-Ins.
 * 
 * Enforces:
 *   1. All 5 metrics are integers within [1, 5].
 *   2. Valid date string and valid ISO week format.
 *   3. ABSOLUTE PROHIBITION of sensitive fields (PHQ-9, Item 9, diagnosis, predictions).
 */
export function validateWeeklyCheckInInput(input: any): CheckInValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Check-in payload must be a non-null object.'] };
  }

  // PRIVACY GUARANTEE: Reject if any sensitive or prohibited clinical fields are attached
  const prohibitedKeys = [
    'phq9', 'phq9Answers', 'phq9Result', 'item9', 'item9Score', 'hasSelfHarmRisk',
    'depression', 'depression_prob', 'diagnosis', 'prediction', 'risk_tier', 'shap'
  ];
  for (const key of prohibitedKeys) {
    if (key in input) {
      errors.push(`Security violation: Prohibited field "${key}" detected. Weekly trends must not contain clinical or assessment data.`);
    }
  }

  // Validate the 5 metrics
  const metricKeys: TrendMetricKey[] = ['sleepQuality', 'academicPressure', 'studySatisfaction', 'dailyEnergy', 'routineBalance'];
  const sanitizedMetrics: Partial<Record<TrendMetricKey, number>> = {};

  for (const key of metricKeys) {
    const val = input[key];
    if (val === undefined || val === null || val === '') {
      errors.push(`Missing rating for ${key}. Rating between 1 and 5 is required.`);
      continue;
    }
    const num = Number(val);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      errors.push(`${key} must be an integer between 1 and 5 (received: ${val}).`);
    } else {
      sanitizedMetrics[key] = num;
    }
  }

  // Validate date & timestamp
  let parsedDate: Date;
  if (input.date) {
    parsedDate = new Date(input.date);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid date format.');
    }
  } else {
    parsedDate = new Date();
  }

  let weekIdentifier = input.weekIdentifier;
  if (!weekIdentifier && !isNaN(parsedDate.getTime())) {
    weekIdentifier = getISOWeekIdentifier(parsedDate);
  } else if (weekIdentifier && !/^\d{4}-W\d{2}$/.test(weekIdentifier)) {
    errors.push(`Invalid weekIdentifier format "${weekIdentifier}". Expected format: YYYY-Www.`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const dateString = parsedDate.toISOString().split('T')[0];
  const sanitized: WeeklyCheckIn = {
    id: input.id || `checkin-${weekIdentifier}`,
    weekIdentifier,
    date: dateString,
    timestamp: parsedDate.getTime(),
    sleepQuality: sanitizedMetrics.sleepQuality!,
    academicPressure: sanitizedMetrics.academicPressure!,
    studySatisfaction: sanitizedMetrics.studySatisfaction!,
    dailyEnergy: sanitizedMetrics.dailyEnergy!,
    routineBalance: sanitizedMetrics.routineBalance!
  };

  return {
    isValid: true,
    sanitized,
    errors: []
  };
}

/**
 * Synthetic Sample Check-Ins for Educational Preview Mode.
 * Clearly labeled as PREVIEW DATA (never claimed to be actual student results).
 */
export const SAMPLE_PREVIEW_CHECKINS: WeeklyCheckIn[] = [
  {
    id: 'checkin-2026-W43',
    weekIdentifier: '2026-W43',
    date: '2026-10-26',
    timestamp: 1793059200000,
    sleepQuality: 3,
    academicPressure: 4,
    studySatisfaction: 3,
    dailyEnergy: 2,
    routineBalance: 3
  },
  {
    id: 'checkin-2026-W44',
    weekIdentifier: '2026-W44',
    date: '2026-11-02',
    timestamp: 1793664000000,
    sleepQuality: 3,
    academicPressure: 4,
    studySatisfaction: 3,
    dailyEnergy: 3,
    routineBalance: 3
  },
  {
    id: 'checkin-2026-W45',
    weekIdentifier: '2026-W45',
    date: '2026-11-09',
    timestamp: 1794268800000,
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 4,
    dailyEnergy: 3,
    routineBalance: 4
  },
  {
    id: 'checkin-2026-W46',
    weekIdentifier: '2026-W46',
    date: '2026-11-16',
    timestamp: 1794873600000,
    sleepQuality: 4,
    academicPressure: 3,
    studySatisfaction: 4,
    dailyEnergy: 4,
    routineBalance: 4
  }
];

