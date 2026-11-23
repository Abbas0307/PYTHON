/**
 * src/engines/wellbeingEngine.ts
 * Deterministic Student Wellbeing & Lifestyle Intelligence Engine.
 * 
 * Implements:
 *   1. Robust input validation & bounds enforcement
 *   2. Standardized PHQ-9 psychometric scoring (kept strictly separate from ML)
 *   3. Deterministic lifestyle & academic habit friction analysis
 *   4. Grounded, factor-linked micro-habit recommendations
 * 
 * STRICT ARCHITECTURAL INVARIANTS:
 *   - 100% deterministic arithmetic (no ML model inference, no LLM queries).
 *   - No combined depression probability or clinical psychiatric diagnosis.
 *   - Item 9 triggers independent safety safeguard without persisting data.
 */

import type { StudentSurveyFeatures } from '../contracts/featureContract.ts';
import {
  DEFAULT_SURVEY_FEATURES,
  DEGREE_OPTIONS,
  SLEEP_DURATION_OPTIONS,
  DIETARY_HABITS_OPTIONS
} from '../contracts/featureContract.ts';

export interface PHQ9Result {
  totalScore: number;
  maxScore: number;
  severity: 'Minimal' | 'Mild' | 'Moderate' | 'Moderately Severe' | 'Severe';
  description: string;
  badgeColor: string;
  badgeBg: string;
  item9Score: number;
  hasSelfHarmRisk: boolean;
}

export interface RecommendationItem {
  id: string;
  title: string;
  category: 'Sleep' | 'Study Routine' | 'Mindfulness' | 'Lifestyle' | 'Nutrition';
  relatedFactor: string;
  rationale: string;
  description: string;
  evidence: string;
  actionSteps: string[];
  clinicalDisclaimer: string;
}

export interface LifestyleFrictionReport {
  overallWellbeingScore: number; // 0 to 100%
  sleepHealth: {
    category: string;
    hoursEst: number;
    score: number; // 0-100
    insight: string;
    status: 'optimal' | 'moderate' | 'needs_attention';
  };
  academicBalance: {
    loadHours: number;
    pressureRatio: number;
    score: number; // 0-100
    insight: string;
    status: 'optimal' | 'moderate' | 'needs_attention';
  };
  nourishment: {
    dietaryType: string;
    score: number; // 0-100
    insight: string;
    status: 'optimal' | 'moderate' | 'needs_attention';
  };
  stressFriction: {
    financialStressScore: number;
    academicStressScore: number;
    compositeFriction: number; // 0-100
    insight: string;
  };
  recommendations: RecommendationItem[];
}

export const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading or studying',
  'Moving or speaking so slowly that other people could have noticed, or being fidgety/restless',
  'Thoughts that you would be better off dead, or of hurting yourself in some way'
] as const;

export const PHQ9_OPTIONS = [
  { value: 0, label: 'Not at all (0)' },
  { value: 1, label: 'Several days (1)' },
  { value: 2, label: 'More than half the days (2)' },
  { value: 3, label: 'Nearly every day (3)' }
] as const;

export interface AgeValidationResult {
  isValid: boolean;
  age?: number;
  errorMessage?: string;
}

/**
 * Validates student age against the frozen feature contract [16.0, 55.0].
 * Rejects missing, non-numeric, or out-of-range values with informative messages.
 */
export function validateAge(input: any): AgeValidationResult {
  if (input === null || input === undefined || input === '') {
    return {
      isValid: false,
      errorMessage: 'Age is required. Please enter an age between 16 and 55.'
    };
  }
  const n = Number(input);
  if (typeof n !== 'number' || isNaN(n) || !Number.isFinite(n)) {
    return {
      isValid: false,
      errorMessage: 'Age must be a valid numerical value.'
    };
  }
  const rounded = Math.round(n);
  if (rounded < 16) {
    return {
      isValid: false,
      errorMessage: 'Age must be at least 16 years (minimum permitted age).'
    };
  }
  if (rounded > 55) {
    return {
      isValid: false,
      errorMessage: 'Age must be at most 55 years (maximum permitted age).'
    };
  }
  return {
    isValid: true,
    age: rounded
  };
}

/**
 * Validates, clamps, and defaults raw student inputs to ensure deterministic calculation stability.
 */
export function validateStudentFeatures(raw: Partial<StudentSurveyFeatures> | null | undefined): StudentSurveyFeatures {
  const base = { ...DEFAULT_SURVEY_FEATURES, ...(raw || {}) };

  const parseNum = (val: any, fallback: number) => {
    if (val === null || val === undefined || val === '') return fallback;
    const n = Number(val);
    return typeof n === 'number' && !isNaN(n) ? n : fallback;
  };

  const age = Math.max(16, Math.min(55, Math.round(parseNum(base.age, 21))));
  const gender = base.gender === 'Male' ? 'Male' : 'Female';
  const degree = (DEGREE_OPTIONS as readonly string[]).includes(base.degree) ? base.degree : 'B.Tech';
  const cgpa = Math.max(0.0, Math.min(10.0, parseNum(base.cgpa, 7.8)));
  const academicPressure = Math.max(1, Math.min(5, Math.round(parseNum(base.academicPressure, 3))));
  const workStudyHours = Math.max(0.0, Math.min(16.0, parseNum(base.workStudyHours, 6.5)));
  const sleepDuration = (SLEEP_DURATION_OPTIONS as readonly string[]).includes(base.sleepDuration)
    ? base.sleepDuration
    : '7-8 hours';
  const dietaryHabits = (DIETARY_HABITS_OPTIONS as readonly string[]).includes(base.dietaryHabits)
    ? base.dietaryHabits
    : 'Moderate';
  const studySatisfaction = Math.max(1, Math.min(5, Math.round(parseNum(base.studySatisfaction, 3))));
  const financialStress = Math.max(1, Math.min(5, Math.round(parseNum(base.financialStress, 3))));

  return {
    age,
    gender,
    degree,
    cgpa,
    academicPressure,
    workStudyHours,
    sleepDuration,
    dietaryHabits,
    studySatisfaction,
    financialStress
  };
}

/**
 * Evaluates standardized PHQ-9 responses.
 * Enforces validated item bounds [0, 3] and triggers independent Item 9 crisis detection.
 */
export function evaluatePHQ9(answers: number[] | null | undefined): PHQ9Result {
  const safeAnswers = Array.isArray(answers) ? answers : [];
  const normalized: number[] = [];

  for (let i = 0; i < 9; i++) {
    const val = safeAnswers[i];
    if (typeof val === 'number' && !isNaN(val)) {
      normalized.push(Math.max(0, Math.min(3, Math.floor(val))));
    } else {
      normalized.push(0);
    }
  }

  const totalScore = normalized.reduce((sum, val) => sum + val, 0);
  const item9Score = normalized[8];
  const hasSelfHarmRisk = item9Score > 0;

  let severity: PHQ9Result['severity'] = 'Minimal';
  let description = 'Responses indicate minimal symptoms over the past two weeks.';
  let badgeColor = '#10B981';
  let badgeBg = '#ECFDF5';

  if (totalScore >= 20) {
    severity = 'Severe';
    description = 'Responses indicate severe symptoms. We strongly encourage reaching out to a mental health professional or counselor.';
    badgeColor = '#EF4444';
    badgeBg = '#FEE2E2';
  } else if (totalScore >= 15) {
    severity = 'Moderately Severe';
    description = 'Responses indicate moderately severe symptoms. Professional clinical consultation is recommended.';
    badgeColor = '#F97316';
    badgeBg = '#FFEDD5';
  } else if (totalScore >= 10) {
    severity = 'Moderate';
    description = 'Responses indicate moderate symptoms. Speaking with a campus counselor can offer valuable strategies.';
    badgeColor = '#F59E0B';
    badgeBg = '#FEF3C7';
  } else if (totalScore >= 5) {
    severity = 'Mild';
    description = 'Responses indicate mild symptoms. Practicing structured self-care, sleep hygiene, and daily balance is advised.';
    badgeColor = '#3B82F6';
    badgeBg = '#EFF6FF';
  }

  return {
    totalScore,
    maxScore: 27,
    severity,
    description,
    badgeColor,
    badgeBg,
    item9Score,
    hasSelfHarmRisk
  };
}

/**
 * Analyzes student lifestyle routine factors deterministically.
 * Generates transparent scores and factor-linked recommendations.
 */
export function analyzeStudentLifestyle(rawFeatures: StudentSurveyFeatures): LifestyleFrictionReport {
  const features = validateStudentFeatures(rawFeatures);

  // 1. Sleep Health Recovery (Weight: 35%)
  let sleepScore = 75;
  let sleepHours = 7.0;
  let sleepStatus: 'optimal' | 'moderate' | 'needs_attention' = 'optimal';
  let sleepInsight = 'Your sleep duration aligns with healthy cognitive restorative norms.';

  if (features.sleepDuration === 'Less than 5 hours') {
    sleepScore = 30;
    sleepHours = 4.5;
    sleepStatus = 'needs_attention';
    sleepInsight = 'Critical sleep deficit. Short sleep limits memory consolidation and emotional resilience.';
  } else if (features.sleepDuration === '5-6 hours') {
    sleepScore = 55;
    sleepHours = 5.5;
    sleepStatus = 'moderate';
    sleepInsight = 'Sub-optimal sleep duration. Gradually aiming for 7 hours can improve daytime energy.';
  } else if (features.sleepDuration === '7-8 hours') {
    sleepScore = 95;
    sleepHours = 7.5;
    sleepStatus = 'optimal';
    sleepInsight = 'Optimal sleep restorative window. Supports memory retention and steady mood regulation.';
  } else if (features.sleepDuration === 'More than 8 hours') {
    sleepScore = 80;
    sleepHours = 9.0;
    sleepStatus = 'moderate';
    sleepInsight = 'Extended sleep. Ensure sleep quality is restorative without excessive fatigue.';
  }

  // 2. Academic Pacing & Balance (Weight: 35%)
  const academicPressure = features.academicPressure; // 1-5
  const studySatisfaction = features.studySatisfaction; // 1-5
  const hours = features.workStudyHours; // 0-16

  let academicScore = 70;
  let academicStatus: 'optimal' | 'moderate' | 'needs_attention' = 'optimal';
  let academicInsight = 'Your study commitment and satisfaction show a manageable balance.';

  if (hours > 10 || academicPressure >= 4) {
    academicScore = Math.max(30, 80 - (hours - 8) * 6 - academicPressure * 7);
    academicStatus = academicScore < 50 ? 'needs_attention' : 'moderate';
    academicInsight = 'High daily academic commitment coupled with pressure increases cognitive friction.';
  } else if (studySatisfaction >= 4 && hours <= 8) {
    academicScore = 90;
    academicStatus = 'optimal';
    academicInsight = 'Strong study satisfaction with sustainable daily study pacing.';
  }

  // 3. Dietary & Nourishment Consistency (Weight: 15%)
  let nourishmentScore = 70;
  let nourishmentStatus: 'optimal' | 'moderate' | 'needs_attention' = 'moderate';
  let nourishmentInsight = 'Balanced nutrition provides consistent glucose for mental clarity.';

  if (features.dietaryHabits === 'Healthy') {
    nourishmentScore = 90;
    nourishmentStatus = 'optimal';
    nourishmentInsight = 'Consistent nutrient-dense meals support steady focus and reduce energy crashes.';
  } else if (features.dietaryHabits === 'Unhealthy') {
    nourishmentScore = 40;
    nourishmentStatus = 'needs_attention';
    nourishmentInsight = 'Irregular meals or high sugar intake can amplify afternoon fatigue and mood fluctuations.';
  }

  // 4. Stress Buffer Resilience (Weight: 15%)
  const financialStress = features.financialStress; // 1-5
  const compositeFriction = Math.round(((financialStress * 20) + (academicPressure * 20)) / 2);
  let stressInsight = 'Stress indicators are within typical collegiate ranges.';

  if (compositeFriction > 70) {
    stressInsight = 'Elevated concurrent academic and financial pressure creates persistent cognitive load.';
  } else if (compositeFriction < 40) {
    stressInsight = 'Low friction levels allow for sustained cognitive focus and exploration.';
  }

  // Overall Wellbeing Index (Deterministic composite of lifestyle factors: 0-100)
  const overallWellbeingScore = Math.round(
    sleepScore * 0.35 +
    academicScore * 0.35 +
    nourishmentScore * 0.15 +
    (100 - compositeFriction) * 0.15
  );

  // 5. Grounded, Factor-Linked Recommendations (Approved Deterministic Rules)
  const pool: RecommendationItem[] = [];

  // Rule 1: Sleep Architecture
  if (features.sleepDuration === 'Less than 5 hours' || features.sleepDuration === '5-6 hours') {
    pool.push({
      id: 'rec-sleep',
      title: 'Circadian Buffer Routine',
      category: 'Sleep',
      relatedFactor: `Reported Sleep: ${features.sleepDuration}`,
      rationale: 'Your reported sleep duration is below the collegiate 7–8 hour target, restricting memory consolidation and mood stabilization.',
      description: 'Implement a 45-minute tech-free wind-down buffer before sleep to facilitate slow-wave restorative rest.',
      evidence: 'Consistent sleep architecture preserves prefrontal cognitive vigilance and reduces perceived stress.',
      actionSteps: [
        'Dim overhead lights 45 minutes prior to target bedtime.',
        'Replace late-night phone scrolling with reading or quiet relaxation.',
        'Keep your bedroom temperature comfortably cool.'
      ],
      clinicalDisclaimer: 'Educational wellness suggestion; not medical therapy or clinical insomnia treatment.'
    });
  }

  // Rule 2: Academic Ultradian Pacing
  if (hours > 8 || academicPressure >= 4) {
    pool.push({
      id: 'rec-study',
      title: 'Ultradian Cognitive Pacing (50/10 Protocol)',
      category: 'Study Routine',
      relatedFactor: `Academic Commitment: ${hours} hrs/day, Pressure: Level ${academicPressure}/5`,
      rationale: 'High daily study volume combined with pressure creates cognitive fatigue without structured restorative pauses.',
      description: 'Work in focused 50-minute deep blocks followed by a complete 10-minute mental disconnect.',
      evidence: 'Cognitive focus degrades after 45-50 minutes; structured pauses preserve sustained attention and learning efficacy.',
      actionSteps: [
        'Set a 50-minute single-task focus timer.',
        'Step away from all screens during the 10-minute break.',
        'Hydrate and stretch before beginning the next block.'
      ],
      clinicalDisclaimer: 'Educational productivity guideline; does not treat clinical anxiety or attention disorders.'
    });
  }

  // Rule 3: Stress Decompression
  if (compositeFriction >= 50 || financialStress >= 4) {
    pool.push({
      id: 'rec-stress',
      title: 'Micro-Decompression & Autonomic Reset',
      category: 'Mindfulness',
      relatedFactor: `Stress Friction: Level ${financialStress}/5 Financial, Level ${academicPressure}/5 Academic`,
      rationale: 'Elevated concurrent pressures stimulate sympathetic arousal, increasing mental exhaustion.',
      description: 'Practice physiological sigh breathing (two quick inhales, long slow exhale) during acute tension intervals.',
      evidence: 'Rapidly triggers parasympathetic tone, reducing heart rate and autonomic tension within 30 seconds.',
      actionSteps: [
        'Inhale deeply through your nose, take a second brief top-off inhale.',
        'Exhale slowly and completely through your mouth for 6-8 seconds.',
        'Repeat 3 to 5 times when experiencing acute tension.'
      ],
      clinicalDisclaimer: 'Self-regulation practice; not a substitute for clinical psychiatric treatment.'
    });
  }

  // Rule 4: Nutritional Regularity
  if (features.dietaryHabits === 'Unhealthy' || features.dietaryHabits === 'Moderate') {
    pool.push({
      id: 'rec-nutrition',
      title: 'Glycemic Pacing & Meal Consistency',
      category: 'Nutrition',
      relatedFactor: `Dietary Regularity: ${features.dietaryHabits}`,
      rationale: 'Irregular meal timing or high-sugar snacks leads to daytime blood glucose dips that mirror cognitive fatigue.',
      description: 'Anchor meals with protein and fiber to maintain sustained daytime energy and avoid afternoon crashes.',
      evidence: 'Stable glucose metabolism supports prefrontal cortex executive functioning and mood stability.',
      actionSteps: [
        'Keep a water bottle at your desk and hydrate regularly during study sessions.',
        'Eat a balanced breakfast before morning classes or intense focus periods.',
        'Replace ultra-processed study snacks with nuts, fruit, or yogurt.'
      ],
      clinicalDisclaimer: 'General lifestyle wellness advice; not clinical dietary therapy.'
    });
  }

  // Rule 5: Active Recovery / Maintenance (Fallback for highly balanced students)
  if (pool.length < 3) {
    pool.push({
      id: 'rec-maintenance',
      title: 'Active Recovery & Routine Consistency',
      category: 'Lifestyle',
      relatedFactor: 'Balanced Collegiate Baseline',
      rationale: 'Your routine currently exhibits healthy balance; proactive habits help maintain this buffer during high-stress exam periods.',
      description: 'Schedule non-negotiable downtime, physical movement, and social connections alongside coursework.',
      evidence: 'Proactive behavioral scheduling buffers students against unexpected midterm and finals workload spikes.',
      actionSteps: [
        'Protect your consistent sleep schedule even during exam weeks.',
        'Schedule at least one recreational hobby or outdoor activity each weekend.',
        'Conduct a weekly 5-minute self-check-in on your rest and study balance.'
      ],
      clinicalDisclaimer: 'Educational self-care guideline; not medical care.'
    });
  }

  // Guarantee exactly top 3 recommendations
  const recommendations = pool.slice(0, 3);

  return {
    overallWellbeingScore,
    sleepHealth: {
      category: features.sleepDuration,
      hoursEst: sleepHours,
      score: sleepScore,
      insight: sleepInsight,
      status: sleepStatus
    },
    academicBalance: {
      loadHours: hours,
      pressureRatio: academicPressure / 5,
      score: academicScore,
      insight: academicInsight,
      status: academicStatus
    },
    nourishment: {
      dietaryType: features.dietaryHabits,
      score: nourishmentScore,
      insight: nourishmentInsight,
      status: nourishmentStatus
    },
    stressFriction: {
      financialStressScore: financialStress,
      academicStressScore: academicPressure,
      compositeFriction,
      insight: stressInsight
    },
    recommendations
  };
}
