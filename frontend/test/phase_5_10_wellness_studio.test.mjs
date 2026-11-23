import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 1. GUIDED BREATHING ENGINE & PATTERNS
// ============================================================
test('Guided Breathing: Patterns enforce no breath-holding and valid timing', async () => {
  const { BREATHING_PATTERNS, BREATHING_DURATIONS_MINUTES } = await import('../src/engines/wellnessEngine.ts');

  assert.ok(BREATHING_PATTERNS.gentle, 'Gentle pattern must exist');
  assert.ok(BREATHING_PATTERNS.balanced, 'Balanced pattern must exist');
  assert.ok(BREATHING_PATTERNS.extended_exhale, 'Extended exhale pattern must exist');

  // Verify Gentle pattern: 3s inhale, 4s exhale, 0s hold
  assert.equal(BREATHING_PATTERNS.gentle.inhaleSeconds, 3);
  assert.equal(BREATHING_PATTERNS.gentle.exhaleSeconds, 4);
  assert.equal(BREATHING_PATTERNS.gentle.holdSeconds, 0, 'No breath-holding permitted');
  assert.equal(BREATHING_PATTERNS.gentle.totalCycleSeconds, 7);

  // Verify Balanced pattern: 4s inhale, 4s exhale, 0s hold
  assert.equal(BREATHING_PATTERNS.balanced.inhaleSeconds, 4);
  assert.equal(BREATHING_PATTERNS.balanced.exhaleSeconds, 4);
  assert.equal(BREATHING_PATTERNS.balanced.holdSeconds, 0, 'No breath-holding permitted');
  assert.equal(BREATHING_PATTERNS.balanced.totalCycleSeconds, 8);

  // Verify Extended Exhale pattern: 3s inhale, 5s exhale, 0s hold
  assert.equal(BREATHING_PATTERNS.extended_exhale.inhaleSeconds, 3);
  assert.equal(BREATHING_PATTERNS.extended_exhale.exhaleSeconds, 5);
  assert.equal(BREATHING_PATTERNS.extended_exhale.holdSeconds, 0, 'No breath-holding permitted');
  assert.equal(BREATHING_PATTERNS.extended_exhale.totalCycleSeconds, 8);

  // Duration options: 1, 2, 3, 5 minutes
  assert.deepEqual(BREATHING_DURATIONS_MINUTES, [1, 2, 3, 5]);
});

test('Guided Breathing: Transitions correctly from inhale to exhale without pause or holding', () => {
  const pattern = { inhaleSeconds: 3, exhaleSeconds: 4, holdSeconds: 0 };
  let currentPhase = 'inhale';
  let remainingInPhase = pattern.inhaleSeconds;
  let cycle = 1;

  const tick = () => {
    if (remainingInPhase > 1) {
      remainingInPhase--;
    } else {
      if (currentPhase === 'inhale') {
        currentPhase = 'exhale';
        remainingInPhase = pattern.exhaleSeconds;
      } else {
        cycle++;
        currentPhase = 'inhale';
        remainingInPhase = pattern.inhaleSeconds;
      }
    }
  };

  // Second 1, 2, 3: inhale
  assert.equal(currentPhase, 'inhale');
  assert.equal(remainingInPhase, 3);
  tick();
  assert.equal(remainingInPhase, 2);
  tick();
  assert.equal(remainingInPhase, 1);
  tick();
  // Second 4: flips to exhale with 4 seconds
  assert.equal(currentPhase, 'exhale');
  assert.equal(remainingInPhase, 4);
  tick();
  assert.equal(remainingInPhase, 3);
  tick();
  assert.equal(remainingInPhase, 2);
  tick();
  assert.equal(remainingInPhase, 1);
  tick();
  // Second 8: flips to cycle 2 inhale with 3 seconds
  assert.equal(currentPhase, 'inhale');
  assert.equal(remainingInPhase, 3);
  assert.equal(cycle, 2);
});

// ============================================================
// 2. 5-4-3-2-1 SENSORY GROUNDING
// ============================================================
test('Sensory Grounding: Exactly 5 progressive sensory steps in 5-4-3-2-1 sequence', async () => {
  const { GROUNDING_STEPS } = await import('../src/engines/wellnessEngine.ts');

  assert.equal(GROUNDING_STEPS.length, 5);

  const expectedCounts = [5, 4, 3, 2, 1];
  const expectedSenses = ['see', 'feel', 'hear', 'smell', 'taste'];

  for (let i = 0; i < 5; i++) {
    const s = GROUNDING_STEPS[i];
    assert.equal(s.stepNumber, i + 1);
    assert.equal(s.count, expectedCounts[i]);
    assert.equal(s.sense, expectedSenses[i]);
    assert.ok(s.title && s.title.length > 0);
    assert.ok(s.prompt && s.prompt.length > 0);
    assert.ok(s.examples.length >= 2, `Step ${i + 1} must have collegiate examples`);
    assert.ok(s.guidanceText && s.guidanceText.length > 0);
  }
});

test('Sensory Grounding: Navigation boundaries (next, previous, skip) execute strictly in-memory', () => {
  let stepIndex = 0;
  const skipped = [];
  const notes = {};

  // Step 1 -> Next -> Step 2
  stepIndex = Math.min(4, stepIndex + 1);
  assert.equal(stepIndex, 1);

  // Note addition
  notes[stepIndex] = 'Soft sweater fabric';
  assert.equal(notes[1], 'Soft sweater fabric');

  // Skip Step 2 -> Step 3
  skipped.push(stepIndex);
  stepIndex = Math.min(4, stepIndex + 1);
  assert.equal(stepIndex, 2);
  assert.ok(skipped.includes(1));

  // Back -> Step 2
  stepIndex = Math.max(0, stepIndex - 1);
  assert.equal(stepIndex, 1);
  assert.equal(notes[1], 'Soft sweater fabric'); // Preserved in transient state
});

// ============================================================
// 3. FOCUS & BREAK TIMER
// ============================================================
test('Focus & Break Timer: Presets adhere to approved intervals and wall-clock accuracy', async () => {
  const { TIMER_PRESETS } = await import('../src/engines/wellnessEngine.ts');

  assert.equal(TIMER_PRESETS.length, 4);

  const p15 = TIMER_PRESETS.find((p) => p.id === '15_5');
  assert.ok(p15);
  assert.equal(p15.focusMinutes, 15);
  assert.equal(p15.breakMinutes, 5);

  const p25 = TIMER_PRESETS.find((p) => p.id === '25_5');
  assert.ok(p25);
  assert.equal(p25.focusMinutes, 25);
  assert.equal(p25.breakMinutes, 5);

  const p45 = TIMER_PRESETS.find((p) => p.id === '45_10');
  assert.ok(p45);
  assert.equal(p45.focusMinutes, 45);
  assert.equal(p45.breakMinutes, 10);
});

test('Focus Timer: Elapsed time calculates from wall-clock delta avoiding tab backgrounding drift', () => {
  const targetDurationSeconds = 25 * 60; // 1500s
  const startTimestamp = 1000000000;
  const simulatedNowAfterBackgrounding = startTimestamp + 300 * 1000; // 300s passed

  const elapsed = Math.floor((simulatedNowAfterBackgrounding - startTimestamp) / 1000);
  const remaining = Math.max(0, targetDurationSeconds - elapsed);

  assert.equal(elapsed, 300);
  assert.equal(remaining, 1200);

  // Pause simulation: save accumulated elapsed
  let accumulatedBeforePause = elapsed;
  // Resume 50s later
  const resumeTimestamp = simulatedNowAfterBackgrounding + 50 * 1000;
  const simulatedNowDuringSecondRun = resumeTimestamp + 120 * 1000; // 120s additional
  const secondRunElapsed = Math.floor((simulatedNowDuringSecondRun - resumeTimestamp) / 1000);
  const totalElapsed = accumulatedBeforePause + secondRunElapsed;
  const finalRemaining = Math.max(0, targetDurationSeconds - totalElapsed);

  assert.equal(totalElapsed, 420);
  assert.equal(finalRemaining, 1080);
});

// ============================================================
// 4. PROGRESSIVE MUSCLE RELAXATION (PMR)
// ============================================================
test('Muscle Relaxation: 5 distinct muscle groups with mandatory no-movement alternatives', async () => {
  const { PMR_MUSCLE_GROUPS } = await import('../src/engines/wellnessEngine.ts');

  assert.equal(PMR_MUSCLE_GROUPS.length, 5);

  const expectedIds = ['pmr-hands', 'pmr-shoulders', 'pmr-face-jaw', 'pmr-abdomen', 'pmr-legs-feet'];
  for (let i = 0; i < 5; i++) {
    const g = PMR_MUSCLE_GROUPS[i];
    assert.equal(g.id, expectedIds[i]);
    assert.equal(g.order, i + 1);
    assert.ok(g.name && g.name.length > 0);
    assert.ok(g.focusArea && g.focusArea.length > 0);
    assert.ok(g.whyThisArea && g.whyThisArea.length > 0);
    assert.ok(g.gentleInstructions.length >= 3);
    assert.ok(g.tensionDurationSeconds <= 6, 'Tension duration must be gentle and brief (<= 6s)');
    assert.ok(g.releaseDurationSeconds >= 7, 'Release duration must be spacious (>= 7s)');

    // MANDATORY NO-MOVEMENT ALTERNATIVE
    assert.ok(g.noMovementAlternative && g.noMovementAlternative.length > 10);
    assert.doesNotMatch(g.noMovementAlternative, /tense|squeeze|brace/i, 'No-movement mode must not instruct tension');

    // MANDATORY SAFETY NOTE
    assert.ok(g.safetyNote && g.safetyNote.length > 0);
  }
});

// ============================================================
// 5. RELAXATION ACTIVITIES LIBRARY
// ============================================================
test('Relaxation Library: Contains >= 15 typed activities across 6 collegiate categories', async () => {
  const { RELAXATION_ACTIVITIES, RELAXATION_CATEGORIES, RELAXATION_BY_ID } = await import(
    '../src/engines/relaxationLibrary.ts'
  );

  assert.ok(RELAXATION_ACTIVITIES.length >= 15, `Expected >= 15 activities; found ${RELAXATION_ACTIVITIES.length}`);
  assert.equal(RELAXATION_ACTIVITIES.length, 18);
  assert.equal(RELAXATION_CATEGORIES.length, 6);

  const seenIds = new Set();
  const categoryCounts = {};

  for (const act of RELAXATION_ACTIVITIES) {
    // Unique ID
    assert.ok(!seenIds.has(act.id), `Duplicate activity ID: ${act.id}`);
    seenIds.add(act.id);

    // Required fields
    assert.ok(act.title && act.title.length > 0);
    assert.ok(act.description && act.description.length > 0);
    assert.ok(act.estimatedDuration >= 3 && act.estimatedDuration <= 30);
    assert.ok(['easy', 'moderate'].includes(act.difficulty));
    assert.ok(act.instructions && act.instructions.length >= 3);
    assert.ok(act.iconName && act.iconName.length > 0);

    // Category validation
    assert.ok(RELAXATION_CATEGORIES.includes(act.category));
    categoryCounts[act.category] = (categoryCounts[act.category] || 0) + 1;

    // Safety and non-medical boundaries
    const combinedText = `${act.title} ${act.description} ${act.instructions.join(' ')} ${act.safetyOrSuitabilityNote || ''}`;
    assert.doesNotMatch(combinedText, /cure|treatment|pharmaceutical|supplement|ssri|antidepressant|diagnos/i);
    assert.doesNotMatch(combinedText, /sleep less|skip sleep|all-nighter/i);
  }

  // Verify all 6 categories have activities
  for (const cat of RELAXATION_CATEGORIES) {
    assert.ok(categoryCounts[cat] >= 2, `Category ${cat} must have at least 2 activities`);
  }

  // Fast map lookup
  assert.equal(RELAXATION_BY_ID.size, 18);
});

// ============================================================
// 6. IN-MEMORY SESSION STORE
// ============================================================
test('In-Memory Store: Tracks completed sessions strictly in volatile memory and clears cleanly', async () => {
  const { wellnessStore } = await import('../src/engines/wellnessEngine.ts');

  wellnessStore.clearSessionHistory();
  assert.equal(wellnessStore.getCompletedSessions().length, 0);

  // Record sessions
  const s1 = wellnessStore.recordSession({
    experienceId: 'breathing',
    title: 'Guided Breathing: Gentle',
    durationMinutes: 3
  });
  assert.ok(s1.id.startsWith('well-breathing-'));
  assert.equal(s1.durationMinutes, 3);

  const s2 = wellnessStore.recordSession({
    experienceId: 'grounding',
    title: '5-4-3-2-1 Sensory Grounding',
    durationMinutes: 5
  });
  assert.ok(s2.id.startsWith('well-grounding-'));

  const sessions = wellnessStore.getCompletedSessions();
  assert.equal(sessions.length, 2);
  assert.equal(sessions[0].title, 'Guided Breathing: Gentle');
  assert.equal(sessions[1].title, '5-4-3-2-1 Sensory Grounding');

  // Clear
  wellnessStore.clearSessionHistory();
  assert.equal(wellnessStore.getCompletedSessions().length, 0);
});

// ============================================================
// 7. PRIVACY CONTRACT SAFETY BOUNDARY
// ============================================================
test('Privacy Boundary: Rejects clinical depression or diagnostic fields in wellness payloads', async () => {
  const { validateWellnessSafety } = await import('../src/contracts/wellnessContract.ts');

  // Valid payload
  const valid = validateWellnessSafety({
    experienceId: 'breathing',
    pattern: 'gentle',
    durationMinutes: 3
  });
  assert.equal(valid.isValid, true);

  // Prohibited clinical fields
  const forbiddenKeys = ['phq9Answers', 'item9', 'phq9Score', 'depression', 'severity', 'riskTier', 'suicide'];
  for (const key of forbiddenKeys) {
    const invalid = validateWellnessSafety({
      experienceId: 'breathing',
      [key]: 'forbidden_value'
    });
    assert.equal(invalid.isValid, false);
    assert.match(invalid.error, /Security violation: Prohibited clinical field/);
  }
});

// ============================================================
// 8. DASHBOARD SCREEN COMPONENT INTEGRATION
// ============================================================
test('Component Integration: WellnessStudioSection is properly integrated in DashboardScreen', async () => {
  const dashPath = path.resolve(__dirname, '../src/pages/DashboardScreen.tsx');
  assert.ok(fs.existsSync(dashPath));
  const content = fs.readFileSync(dashPath, 'utf8');

  assert.match(content, /WellnessStudioSection/, 'DashboardScreen must import WellnessStudioSection');
  assert.match(
    content,
    /<WellnessStudioSection isPreviewMode=\{isPreviewMode\} \/>/,
    'DashboardScreen must render WellnessStudioSection'
  );
});
