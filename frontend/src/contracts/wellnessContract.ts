/**
 * src/contracts/wellnessContract.ts
 * Mindora Wellness Studio — Core Contracts, Types & Schema.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - 100% Client-Side In-Memory Execution: Session data is NEVER written to localStorage,
 *     sessionStorage, IndexedDB, or external servers.
 *   - Non-Clinical & Non-Diagnostic: Does NOT assess, treat, or diagnose clinical conditions.
 *   - No Forced Actions: All breathing, grounding, timer, and muscle relaxation practices
 *     are completely optional with immediate stop controls.
 *   - Physical Limitations & Discomfort: PMR provides zero-movement alternatives; breathing
 *     strictly prohibits breath holding and advises immediate cessation if dizzy.
 *   - Zero Telemetry or Cloud Coupling: Purely offline functionality.
 */

export type WellnessExperienceId =
  | 'breathing'
  | 'grounding'
  | 'timer'
  | 'muscle_relaxation'
  | 'activities';

export type BreathingPatternId = 'gentle' | 'balanced' | 'extended_exhale';

export interface BreathingPattern {
  id: BreathingPatternId;
  name: string;
  description: string;
  inhaleSeconds: number;
  holdSeconds: number; // strictly 0 for standard safe patterns
  exhaleSeconds: number;
  totalCycleSeconds: number;
}

export type BreathingPhase = 'ready' | 'inhale' | 'hold' | 'exhale' | 'completed';

export interface BreathingSessionState {
  patternId: BreathingPatternId;
  targetDurationMinutes: number;
  secondsRemainingInPhase: number;
  currentPhase: BreathingPhase;
  currentCycle: number;
  totalElapsedSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

export interface GroundingStep {
  stepNumber: number; // 1 to 5
  count: number;      // 5, 4, 3, 2, 1
  sense: 'see' | 'feel' | 'hear' | 'smell' | 'taste';
  title: string;
  prompt: string;
  examples: string[];
  guidanceText: string;
}

export interface GroundingSessionState {
  currentStepIndex: number; // 0 to 4
  notes: Record<number, string>; // In-memory temporary notes only
  isCompleted: boolean;
  skippedSteps: number[];
}

export type TimerPresetId = '15_5' | '25_5' | '45_10' | 'custom';

export type TimerMode = 'focus' | 'break';

export interface TimerPreset {
  id: TimerPresetId;
  label: string;
  focusMinutes: number;
  breakMinutes: number;
  description: string;
}

export interface TimerSessionState {
  presetId: TimerPresetId;
  mode: TimerMode;
  totalSeconds: number;
  remainingSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  soundEnabled: boolean;
  completedCycles: number;
}

export interface MuscleGroup {
  id: string;
  name: string;
  order: number;
  focusArea: string;
  whyThisArea: string;
  gentleInstructions: string[];
  tensionDurationSeconds: number; // typically 4-5s gentle
  releaseDurationSeconds: number; // typically 7-10s rest
  noMovementAlternative: string;
  safetyNote: string;
}

export type RelaxationCategory =
  | 'Mindful Breaks'
  | 'Creative Activities'
  | 'Rest & Recovery'
  | 'Gentle Movement'
  | 'Outdoor Awareness'
  | 'Social Connection';

export type ActivityDifficulty = 'easy' | 'moderate';

export interface RelaxationActivity {
  id: string;
  title: string;
  description: string;
  category: RelaxationCategory;
  estimatedDuration: number; // in minutes (e.g. 5, 10, 15)
  difficulty: ActivityDifficulty;
  instructions: string[];
  safetyOrSuitabilityNote?: string;
  iconName: string;
}

export interface CompletedWellnessSession {
  id: string;
  experienceId: WellnessExperienceId;
  title: string;
  durationMinutes: number;
  completedAt: string; // ISO string for in-memory display
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
 * Validates that a wellness payload does not violate privacy boundaries.
 */
export function validateWellnessSafety(payload: any): { isValid: boolean; error?: string } {
  if (!payload || typeof payload !== 'object') {
    return { isValid: false, error: 'Payload must be an object.' };
  }

  for (const forbidden of FORBIDDEN_CLINICAL_PROPERTIES) {
    if (forbidden in payload) {
      return {
        isValid: false,
        error: `Security violation: Prohibited clinical field "${forbidden}" detected in Mindora Wellness Studio payload.`
      };
    }
  }

  return { isValid: true };
}
