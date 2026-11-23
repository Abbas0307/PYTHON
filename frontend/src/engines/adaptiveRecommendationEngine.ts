/**
 * src/engines/adaptiveRecommendationEngine.ts
 * Mindora 2.0 — Deterministic Adaptive Recommendation Engine.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - Strictly Deterministic: Simple rule-based mapping with transparent reasoning.
 *   - Zero Clinical Data Inputs: Strictly prohibited from reading PHQ-9, Item 9, or ML models.
 *   - Zero Reinforcement Learning / External AI: Purely client-side offline execution.
 *   - Explanations Guaranteed: Every single recommendation specifies why it was suggested.
 */

import type {
  AdaptiveRecommendation,
  GoalCategory,
  RecommendationPreferences,
  StudentGoal
} from '../contracts/personalizationContract.ts';

interface CandidateRecommendation {
  id: string;
  title: string;
  category: GoalCategory;
  targetType: 'wellness_studio' | 'action_planner' | 'study_break' | 'relaxation_activity';
  targetId: string;
  actionRoute: string;
  howToStart: string;
  description: string;
  baseRationale: string;
  estimatedMinutes: number;
}

/**
 * Curated candidate pool of deterministic micro-interventions.
 */
const CANDIDATE_RECOMMENDATIONS: CandidateRecommendation[] = [
  {
    id: 'rec-pomodoro-focus',
    title: '25-Minute Focused Study Sprint',
    category: 'study_routine',
    targetType: 'wellness_studio',
    targetId: 'focus-timer',
    actionRoute: 'focus_timer',
    howToStart: 'Click Start below to launch the 25-minute Pomodoro timer in the Wellness Studio with automatic chime.',
    description: 'Set a 25-minute quiet focus block followed by an automatic 5-minute restorative break.',
    baseRationale: 'Supports your goal to improve study consistency by providing structured, manageable work intervals.',
    estimatedMinutes: 25
  },
  {
    id: 'rec-task-breakdown',
    title: '3-Step Assignment Breakdown',
    category: 'study_routine',
    targetType: 'action_planner',
    targetId: 'act-task-breakdown',
    actionRoute: 'goals',
    howToStart: 'Open Personal Goals to chunk a heavy assignment into 3 single-hour milestones.',
    description: 'Split a large upcoming deadline into 3 small, bite-sized tasks to relieve cognitive freeze.',
    baseRationale: 'Specifically addresses academic workload pressure by replacing open-ended stress with clear, sequential steps.',
    estimatedMinutes: 10
  },
  {
    id: 'rec-priority-triage',
    title: 'Top-3 Academic Priorities Triage',
    category: 'study_routine',
    targetType: 'action_planner',
    targetId: 'act-study-triage',
    actionRoute: 'goals',
    howToStart: 'Select exactly 3 core deliverables for today and defer secondary tasks until tomorrow.',
    description: 'Select exactly 3 core deliverables for today and defer secondary tasks until tomorrow.',
    baseRationale: 'Aligned with your study routine goal to reduce cognitive overload during busy academic periods.',
    estimatedMinutes: 10
  },
  {
    id: 'rec-breathing-reset',
    title: 'Balanced Breathing Reset (4s / 4s)',
    category: 'relaxation',
    targetType: 'wellness_studio',
    targetId: 'breathing',
    actionRoute: 'breathing',
    howToStart: 'Click Start to open the guided Box Breathing visualization in the Wellness Studio.',
    description: 'Engage 2 to 3 minutes of equal-cadence breathing without any breath holding.',
    baseRationale: 'Matches your relaxation practice goal to calm autonomic tension between intensive classes.',
    estimatedMinutes: 3
  },
  {
    id: 'rec-sensory-grounding',
    title: '5-4-3-2-1 Sensory Grounding Walkthrough',
    category: 'study_breaks',
    targetType: 'wellness_studio',
    targetId: 'grounding',
    actionRoute: 'wellness_studio',
    howToStart: 'Open the Wellness Studio and step through 5 visual, tactile, and auditory awareness steps.',
    description: 'A 5-step sensory reset (See, Feel, Hear, Smell, Taste) to break screen tunnel vision.',
    baseRationale: 'Fulfills your study-breaks goal by grounding attention back into physical space.',
    estimatedMinutes: 5
  },
  {
    id: 'rec-nsdr-recovery',
    title: 'Non-Sleep Deep Rest (NSDR) Recovery',
    category: 'sleep_schedule',
    targetType: 'relaxation_activity',
    targetId: 'rel-nsdr',
    actionRoute: 'relaxation_exercises',
    howToStart: 'Lie back or sit comfortably for 10 minutes to accelerate nervous system recovery.',
    description: 'Lie flat or sit reclined for 10 minutes to rapidly restore mental clarity after fragmented sleep.',
    baseRationale: 'Supports your sleep consistency goal by accelerating nervous system restoration without napping too late.',
    estimatedMinutes: 10
  },
  {
    id: 'rec-sleep-wind-down',
    title: '20-Minute Evening Wind-Down Routine',
    category: 'sleep_schedule',
    targetType: 'relaxation_activity',
    targetId: 'rel-sleep-winddown',
    actionRoute: 'ambient_music',
    howToStart: 'Put screens on night mode, play ambient rain or lo-fi soundscapes, and disconnect 20m before bed.',
    description: 'A gentle non-screen transition routine to lower core body temperature and cue sleep onset.',
    baseRationale: 'Helps maintain consistent circadian rhythms during demanding study weeks.',
    estimatedMinutes: 20
  },
  {
    id: 'rec-window-gaze',
    title: 'Window Horizon Gaze & Optic Reset',
    category: 'study_breaks',
    targetType: 'relaxation_activity',
    targetId: 'rel-window-gaze',
    actionRoute: 'wellness_studio',
    howToStart: 'Step to the nearest window and focus your vision on the horizon for 3 minutes.',
    description: 'Gaze at the furthest visible point outside for 3 minutes to relax ciliary eye muscles.',
    baseRationale: 'Directly reinforces regular study breaks by relaxing eye strain from prolonged laptop reading.',
    estimatedMinutes: 3
  },
  {
    id: 'rec-desk-decompression',
    title: 'Desk Spine Decompression & Neck Softening',
    category: 'routine_balance',
    targetType: 'relaxation_activity',
    targetId: 'rel-desk-stretch',
    actionRoute: 'wellness_studio',
    howToStart: 'Perform 5 slow shoulder rolls and gentle thoracic twists right from your study chair.',
    description: 'Gentle spinal twists, thoracic extension, and shoulder rolls from your desk chair.',
    baseRationale: 'Matches your daily routine balance goal to relieve musculoskeletal stiffness from prolonged library chairs.',
    estimatedMinutes: 5
  },
  {
    id: 'rec-tea-meditation',
    title: 'Mindful 3-Minute Warm Tea Break',
    category: 'relaxation',
    targetType: 'relaxation_activity',
    targetId: 'rel-tea-meditation',
    actionRoute: 'wellness_studio',
    howToStart: 'Step away from all devices and enjoy a warm drink with deliberate sensory presence.',
    description: 'Step away from all devices and focus on the warmth, aroma, and taste of a warm beverage.',
    baseRationale: 'Aligned with your relaxation practice goal to create restorative pauses in your day.',
    estimatedMinutes: 5
  },
  {
    id: 'rec-pmr-shoulders',
    title: 'Shoulders & Neck Progressive Release',
    category: 'relaxation',
    targetType: 'wellness_studio',
    targetId: 'pmr',
    actionRoute: 'wellness_studio',
    howToStart: 'Follow the progressive muscle release prompt in the Wellness Studio.',
    description: 'Gently notice and soften accumulated tension in trapezius muscles with optional no-movement awareness.',
    baseRationale: 'Supports relaxation practice by releasing physical tension points caused by study stress.',
    estimatedMinutes: 5
  },
  {
    id: 'rec-music-immersion',
    title: 'Sensory Music Immersion',
    category: 'personal_time',
    targetType: 'relaxation_activity',
    targetId: 'rel-music-immersion',
    actionRoute: 'ambient_music',
    howToStart: 'Click to open Ambient Music and choose a calming soundscape for an uninterrupted audio pause.',
    description: 'Listen to a favorite uplifting or ambient track with closed eyes and zero multitask distractions.',
    baseRationale: 'Fulfills your personal activities goal by protecting an intentional musical pause in your routine.',
    estimatedMinutes: 4
  },
  {
    id: 'rec-brain-dump',
    title: 'Stream-of-Consciousness Brain Dump',
    category: 'personal_time',
    targetType: 'relaxation_activity',
    targetId: 'rel-brain-dump',
    actionRoute: 'personal_journal',
    howToStart: 'Open your private encrypted Personal Journal and write out thoughts without formatting or self-editing.',
    description: 'Spend 5 minutes freely writing raw unfiltered thoughts into your private journal, then close it.',
    baseRationale: 'Supports your personal time goal by clearing persistent mental clutter outside of coursework.',
    estimatedMinutes: 5
  }
];

export interface RecommendationEngineInput {
  goals: StudentGoal[];
  preferences: RecommendationPreferences;
  limit?: number;
}

/**
 * Deterministically generates prioritized recommendations matching the student's active goals,
 * preferred duration, and explicit category preferences.
 */
export function generateAdaptiveRecommendations(
  input: RecommendationEngineInput
): AdaptiveRecommendation[] {
  const { goals, preferences, limit = 4 } = input;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const dismissedSet = new Set(preferences.dismissedRecommendationIds || []);
  const usefulSet = new Set(preferences.usefulRecommendationIds || []);
  const notUsefulSet = new Set(preferences.notUsefulRecommendationIds || []);

  // Filter candidates: exclude dismissed
  const availableCandidates = CANDIDATE_RECOMMENDATIONS.filter(
    (c) => !dismissedSet.has(c.id)
  );

  // Score deterministically
  const scored = availableCandidates.map((c) => {
    let score = 0;
    let rationale = c.baseRationale;

    // Check if matching an active student-selected goal
    const matchingGoal = activeGoals.find((g) => g.category === c.category);
    if (matchingGoal) {
      score += 40;
      rationale = `Aligned with your active goal "${matchingGoal.title}": ${c.baseRationale}`;
    }

    // Check if in preferred categories
    if (preferences.favoriteCategories.includes(c.category)) {
      score += 20;
    }

    // Check duration proximity (within 10 minutes of preferred duration)
    const durationDiff = Math.abs(c.estimatedMinutes - preferences.preferredDurationMinutes);
    if (durationDiff <= 5) {
      score += 20;
    } else if (durationDiff <= 15) {
      score += 10;
    }

    // Feedback modifier
    if (usefulSet.has(c.id)) {
      score += 15;
    } else if (notUsefulSet.has(c.id)) {
      score -= 25;
    }

    const rec: AdaptiveRecommendation = {
      id: c.id,
      title: c.title,
      category: c.category,
      targetType: c.targetType,
      targetId: c.targetId,
      actionRoute: c.actionRoute,
      howToStart: c.howToStart,
      description: c.description,
      rationale,
      linkedGoalId: matchingGoal?.id,
      estimatedMinutes: c.estimatedMinutes,
      isDismissed: false,
      status: 'pending',
      userRating: usefulSet.has(c.id) ? 'useful' : notUsefulSet.has(c.id) ? 'not_useful' : undefined
    };

    return { rec, score };
  });

  // Sort by score descending, tie-break by ID for determinism
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.rec.id.localeCompare(b.rec.id);
  });

  return scored.slice(0, limit).map((s) => s.rec);
}
