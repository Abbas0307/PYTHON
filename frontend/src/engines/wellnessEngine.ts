/**
 * src/engines/wellnessEngine.ts
 * Mindora Wellness Studio — Interactive Engines, Data Models & Volatile Store.
 * 
 * STRICT PRIVACY & SAFETY INVARIANTS:
 *   - 100% Client-Side In-Memory Execution: Session records exist exclusively in volatile memory.
 *   - Zero External Network Traffic: All logic, timer routines, and audio chimes run offline.
 *   - Non-Diagnostic & Non-Prescriptive: Gentle collegiate wellness tools with zero clinical scoring.
 *   - Universal No-Movement Alternatives: Physical exercises include complete no-movement options.
 */

import type {
  BreathingPattern,
  BreathingPatternId,
  CompletedWellnessSession,
  GroundingStep,
  MuscleGroup,
  TimerPreset,
  WellnessExperienceId
} from '../contracts/wellnessContract.ts';

// ==========================================
// 1. GUIDED BREATHING PATTERNS
// ==========================================
export const BREATHING_PATTERNS: Record<BreathingPatternId, BreathingPattern> = {
  gentle: {
    id: 'gentle',
    name: 'Gentle Breathing (3s / 4s)',
    description: 'A smooth, relaxed rhythm to ease cognitive tension without any breath holding.',
    inhaleSeconds: 3,
    holdSeconds: 0,
    exhaleSeconds: 4,
    totalCycleSeconds: 7
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced Coherence (4s / 4s)',
    description: 'Equal inhalation and exhalation to foster mental equilibrium and steady focus.',
    inhaleSeconds: 4,
    holdSeconds: 0,
    exhaleSeconds: 4,
    totalCycleSeconds: 8
  },
  extended_exhale: {
    id: 'extended_exhale',
    name: 'Extended Exhale (3s / 5s)',
    description: 'A slightly longer exhalation that naturally engages parasympathetic relaxation.',
    inhaleSeconds: 3,
    holdSeconds: 0,
    exhaleSeconds: 5,
    totalCycleSeconds: 8
  }
};

export const BREATHING_DURATIONS_MINUTES = [1, 2, 3, 5];

// ==========================================
// 2. 5-4-3-2-1 SENSORY GROUNDING STEPS
// ==========================================
export const GROUNDING_STEPS: GroundingStep[] = [
  {
    stepNumber: 1,
    count: 5,
    sense: 'see',
    title: '5 Things You Can See',
    prompt: 'Look around your immediate space and notice 5 distinct visual details.',
    examples: [
      'The texture of wood on your desk',
      'A pattern of sunlight or shadow on the wall',
      'A pen, mug, or water bottle',
      'The edge of a notebook or book cover',
      'A plant leaf or small architectural detail'
    ],
    guidanceText: 'Notice colors, shapes, shadows, and reflections without analyzing them.'
  },
  {
    stepNumber: 2,
    count: 4,
    sense: 'feel',
    title: '4 Things You Can Feel',
    prompt: 'Bring attention to your physical contact points and identify 4 tactile sensations.',
    examples: [
      'The solid floor beneath the soles of your feet',
      'The supportive surface of your chair against your back',
      'The soft texture of your clothing against your arms',
      'The cool or warm temperature of the air on your skin'
    ],
    guidanceText: 'Tune into physical gravity and support holding you right now.'
  },
  {
    stepNumber: 3,
    count: 3,
    sense: 'hear',
    title: '3 Things You Can Hear',
    prompt: 'Listen closely for 3 separate sounds in your environment, near or far.',
    examples: [
      'Distant traffic or footsteps in the corridor',
      'The faint hum of a computer fan or air vent',
      'The quiet rhythm of your own natural breathing'
    ],
    guidanceText: 'Listen as if hearing an acoustic soundscape, letting each sound pass.'
  },
  {
    stepNumber: 4,
    count: 2,
    sense: 'smell',
    title: '2 Things You Can Smell',
    prompt: 'Gently notice 2 scents around you, or recall 2 comforting familiar aromas.',
    examples: [
      'The clean, crisp scent of fresh paper or books',
      'A faint aroma of coffee, tea, or fresh outdoor air'
    ],
    guidanceText: 'If no strong aroma is present, breathe in clean air or recall a favorite calming scent.'
  },
  {
    stepNumber: 5,
    count: 1,
    sense: 'taste',
    title: '1 Thing You Can Taste',
    prompt: 'Notice 1 taste in your mouth, or take a sip of fresh water.',
    examples: [
      'The clean, neutral taste of a fresh sip of water',
      'A lingering hint of tea, mint, or your morning beverage'
    ],
    guidanceText: 'Swallow gently and notice the calm presence of your body in this moment.'
  }
];

// ==========================================
// 3. FOCUS & BREAK TIMER PRESETS
// ==========================================
export const TIMER_PRESETS: TimerPreset[] = [
  {
    id: '15_5',
    label: '15m Focus / 5m Break',
    focusMinutes: 15,
    breakMinutes: 5,
    description: 'Quick micro-sprint for reviewing notes or reading a chapter.'
  },
  {
    id: '25_5',
    label: '25m Focus / 5m Break',
    focusMinutes: 25,
    breakMinutes: 5,
    description: 'Classic Pomodoro pace to maintain flow without cognitive fatigue.'
  },
  {
    id: '45_10',
    label: '45m Focus / 10m Break',
    focusMinutes: 45,
    breakMinutes: 10,
    description: 'Deeper study block suited for problem sets, coding, or writing essays.'
  },
  {
    id: 'custom',
    label: 'Custom Pace',
    focusMinutes: 20,
    breakMinutes: 5,
    description: 'Customize focus and recovery intervals to match your personal rhythm.'
  }
];

/**
 * Gentle offline chime synthesizer using the Web Audio API.
 * Never loads external audio files or sends network telemetry.
 */
export function playGentleChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle warm chime frequency (528 Hz - Solfeggio / pleasant harmonic)
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.8);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Gracefully ignore audio synthesis errors in non-interactive/headless environments
  }
}

// ==========================================
// 4. PROGRESSIVE MUSCLE RELAXATION (PMR) GROUPS
// ==========================================
export const PMR_MUSCLE_GROUPS: MuscleGroup[] = [
  {
    id: 'pmr-hands',
    name: 'Hands & Forearms',
    order: 1,
    focusArea: 'Fingers, palms, and wrists',
    whyThisArea: 'Typing on keyboards and clutching phones creates persistent forearm isometric tension.',
    gentleInstructions: [
      'Rest both hands in your lap or on your desk.',
      'Gently make soft fists with both hands. Squeeze only with about 30% of your maximum effort — never hard.',
      'Hold this gentle tension for 4 to 5 seconds, noticing how it feels.',
      'Open your fingers slowly and completely relax your hands.',
      'Notice the warm, tingling sensation of blood flow and muscular ease for 8 to 10 seconds.'
    ],
    tensionDurationSeconds: 5,
    releaseDurationSeconds: 8,
    noMovementAlternative: 'Keep your hands flat in your lap. Simply bring warm attention to your fingers and allow them to feel heavy, limp, and supported.',
    safetyNote: 'Do not squeeze forcefully. Skip tension if you have arthritis, sprains, or carpal tunnel discomfort.'
  },
  {
    id: 'pmr-shoulders',
    name: 'Shoulders & Neck',
    order: 2,
    focusArea: 'Trapezius, shoulder blades, and cervical spine',
    whyThisArea: 'Students unconsciously elevate and hunch shoulders when reading screens or studying under deadlines.',
    gentleInstructions: [
      'Sit with your spine comfortably upright.',
      'Gently draw your shoulders upward toward your ears (about 30–40% effort).',
      'Hold this mild posture for 4 to 5 seconds, breathing naturally without holding your breath.',
      'Let your shoulders drop down completely and exhale softly.',
      'Feel the heavy, pleasant sensation of release as space opens between your ears and shoulders for 10 seconds.'
    ],
    tensionDurationSeconds: 5,
    releaseDurationSeconds: 10,
    noMovementAlternative: 'Do not raise your shoulders. Instead, imagine a warm, gentle weight resting on each shoulder, allowing gravity to soften and lower them naturally.',
    safetyNote: 'Never strain the neck muscles or throw your head back. Keep all movement mild and comfortable.'
  },
  {
    id: 'pmr-face-jaw',
    name: 'Face & Jaw',
    order: 3,
    focusArea: 'Forehead, brow, temples, and jaw joint',
    whyThisArea: 'Mental concentration often leads to brow furrowing, jaw clenching, and subconscious facial strain.',
    gentleInstructions: [
      'Gently crinkle your forehead and squint your eyes softly, like looking into bright sunlight.',
      'Slightly clench your teeth together without pressing hard, holding for 4 seconds.',
      'Release completely: let your brow smooth out, unclench your teeth, and let your jaw drop open slightly.',
      'Allow your tongue to rest loosely in the floor of your mouth.',
      'Notice the relief across your cheeks, temples, and forehead for 10 seconds.'
    ],
    safetyNote: 'If you experience TMJ (temporomandibular joint) pain or dental sensitivity, use the no-movement alternative.',
    tensionDurationSeconds: 4,
    releaseDurationSeconds: 10,
    noMovementAlternative: 'Keep your face completely still. Exhale through parted lips and mentally suggest: "My jaw is loose, my forehead is smooth and cool."'
  },
  {
    id: 'pmr-abdomen',
    name: 'Abdomen & Core',
    order: 4,
    focusArea: 'Diaphragm, stomach, and lower back',
    whyThisArea: 'Academic stress often causes shallow chest breathing and a tight, contracted abdomen.',
    gentleInstructions: [
      'Place one hand gently on your belly over your navel.',
      'Gently tighten your abdominal muscles as if bracing for a light nudge for 4 seconds.',
      'Release the muscles completely.',
      'Take a slow, deep breath into your hand, feeling your belly expand naturally like a gentle balloon.',
      'Exhale slowly, feeling your lower back and core soften into your chair for 10 seconds.'
    ],
    tensionDurationSeconds: 4,
    releaseDurationSeconds: 10,
    noMovementAlternative: 'Skip muscular bracing. Simply place your hand on your belly and observe the gentle rise and fall of your abdomen with each breath.',
    safetyNote: 'Do not contract if you have digestive cramps, abdominal pain, or recent surgical procedures.'
  },
  {
    id: 'pmr-legs-feet',
    name: 'Legs & Feet',
    order: 5,
    focusArea: 'Thighs, calves, ankles, and toes',
    whyThisArea: 'Prolonged sitting in library chairs restricts circulation in the lower extremities.',
    gentleInstructions: [
      'Keep your feet flat on the floor.',
      'Gently press your toes downward into your shoes or curl them softly for 4 seconds.',
      'Feel the mild contraction in your calves and arches.',
      'Release all effort, uncurling toes and letting your feet rest heavily on the floor.',
      'Feel the grounding sensation of solid earth supporting the entire weight of your legs for 10 seconds.'
    ],
    tensionDurationSeconds: 4,
    releaseDurationSeconds: 10,
    noMovementAlternative: 'Keep your feet still. Notice the texture of your socks and the firm, unmoving stability of the floor beneath you.',
    safetyNote: 'Do not point toes aggressively to prevent calf cramps. Release immediately if a cramp begins.'
  }
];

// ==========================================
// 5. VOLATILE IN-MEMORY SESSION STORE
// ==========================================
let completedSessions: CompletedWellnessSession[] = [];

export const wellnessStore = {
  /**
   * Returns all completed wellness sessions recorded in volatile memory.
   */
  getCompletedSessions(): CompletedWellnessSession[] {
    return [...completedSessions];
  },

  /**
   * Records a completed wellness session in volatile memory.
   */
  recordSession(session: {
    experienceId: WellnessExperienceId;
    title: string;
    durationMinutes: number;
  }): CompletedWellnessSession {
    const newRecord: CompletedWellnessSession = {
      id: `well-${session.experienceId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      experienceId: session.experienceId,
      title: session.title,
      durationMinutes: session.durationMinutes,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    completedSessions.push(newRecord);
    return newRecord;
  },

  /**
   * Clears volatile in-memory wellness session history.
   */
  clearSessionHistory(): void {
    completedSessions = [];
  }
};
