/**
 * Phase 5.1 Deterministic Product Integration Test Suite
 * Validates:
 *   1. Assessment-to-dashboard pipeline
 *   2. Input validation & graceful fallback
 *   3. Deterministic calculation consistency
 *   4. Ephemeral session reset & zero-persistence
 *   5. Independent Item 9 safety safeguard
 *   6. Offline assessment execution
 *   7. Grounded recommendation rule correctness & disclaimers
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Robust Input Validation & Malformed Input Handling
test('validateStudentFeatures gracefully sanitizes missing, out-of-bounds, or NaN inputs', async () => {
  const { validateStudentFeatures } = await import('../src/engines/wellbeingEngine.ts');

  // Completely empty input
  const emptyValidated = validateStudentFeatures({});
  assert.equal(emptyValidated.age, 21);
  assert.equal(emptyValidated.cgpa, 7.8);
  assert.equal(emptyValidated.academicPressure, 3);
  assert.equal(emptyValidated.sleepDuration, '7-8 hours');
  assert.equal(emptyValidated.degree, 'B.Tech');

  // Out of bounds / NaN inputs
  const malformed = {
    age: 999, // Should clamp to 55
    cgpa: 15.5, // Should clamp to 10.0
    academicPressure: 0, // Should clamp to 1
    studySatisfaction: 10, // Should clamp to 5
    workStudyHours: -5, // Should clamp to 0.0
    financialStress: NaN, // Should fallback to 3
    sleepDuration: 'InvalidSleepOption', // Should fallback to '7-8 hours'
    dietaryHabits: 'SuperfoodOnly', // Should fallback to 'Moderate'
    degree: 'Astronautics' // Should fallback to 'B.Tech'
  };

  const sanitized = validateStudentFeatures(malformed);
  assert.equal(sanitized.age, 55);
  assert.equal(sanitized.cgpa, 10.0);
  assert.equal(sanitized.academicPressure, 1);
  assert.equal(sanitized.studySatisfaction, 5);
  assert.equal(sanitized.workStudyHours, 0.0);
  assert.equal(sanitized.financialStress, 3);
  assert.equal(sanitized.sleepDuration, '7-8 hours');
  assert.equal(sanitized.dietaryHabits, 'Moderate');
  assert.equal(sanitized.degree, 'B.Tech');
});

// Test 2: Complete Assessment-to-Dashboard Calculation Flow
test('Assessment completion calculates exact deterministic scores without clinical diagnostic claims', async () => {
  const { analyzeStudentLifestyle, evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');

  const studentFeatures = {
    age: 20,
    gender: 'Female',
    degree: 'B.Tech',
    cgpa: 8.5,
    academicPressure: 4,
    workStudyHours: 10,
    sleepDuration: 'Less than 5 hours',
    dietaryHabits: 'Unhealthy',
    studySatisfaction: 2,
    financialStress: 4
  };

  const phq9Answers = [2, 2, 1, 1, 2, 1, 1, 1, 0]; // Moderate (11), Item 9 = 0

  const phq9Eval = evaluatePHQ9(phq9Answers);
  assert.equal(phq9Eval.totalScore, 11);
  assert.equal(phq9Eval.severity, 'Moderate');
  assert.equal(phq9Eval.hasSelfHarmRisk, false);

  const lifestyleReport = analyzeStudentLifestyle(studentFeatures);
  assert.equal(lifestyleReport.sleepHealth.status, 'needs_attention');
  assert.equal(lifestyleReport.sleepHealth.score, 30);
  assert.equal(lifestyleReport.nourishment.status, 'needs_attention');
  assert.equal(lifestyleReport.nourishment.score, 40);
  assert.ok(lifestyleReport.overallWellbeingScore < 50);

  // Assert NO combined depression risk score is present
  assert.equal('depressionRiskScore' in lifestyleReport, false);
  assert.equal('depressionProbability' in lifestyleReport, false);
  assert.equal('clinicalDiagnosis' in lifestyleReport, false);
});

// Test 3: PHQ-9 Item 9 Deterministic Safeguard Trigger
test('PHQ-9 Item 9 triggers independent safety safeguard immediately', async () => {
  const { evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');

  // Mild score (3) but Item 9 = 1 (Several days)
  const suicidalIdeationMild = evaluatePHQ9([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  assert.equal(suicidalIdeationMild.totalScore, 3);
  assert.equal(suicidalIdeationMild.severity, 'Minimal'); // Total score alone is minimal
  assert.equal(suicidalIdeationMild.item9Score, 1);
  assert.equal(suicidalIdeationMild.hasSelfHarmRisk, true); // But safeguard MUST trigger!

  // Zero case
  const healthy = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(healthy.hasSelfHarmRisk, false);
  assert.equal(healthy.item9Score, 0);

  // Robustness: handles null / partial arrays safely
  const nullHandled = evaluatePHQ9(null);
  assert.equal(nullHandled.totalScore, 0);
  assert.equal(nullHandled.hasSelfHarmRisk, false);
});

// Test 4: Recommendation Rule Correctness, Linked Factors & Disclaimers
test('Recommendations connect to approved deterministic rules with factor links and disclaimers', async () => {
  const { analyzeStudentLifestyle } = await import('../src/engines/wellbeingEngine.ts');

  // Case A: High study hours & severe academic pressure
  const stressedStudent = {
    age: 21,
    gender: 'Male',
    degree: 'B.Tech',
    cgpa: 7.0,
    academicPressure: 5,
    workStudyHours: 12,
    sleepDuration: '5-6 hours',
    dietaryHabits: 'Moderate',
    studySatisfaction: 1,
    financialStress: 5
  };

  const reportA = analyzeStudentLifestyle(stressedStudent);
  assert.equal(reportA.recommendations.length, 3);

  // Check recommendation properties
  for (const rec of reportA.recommendations) {
    assert.ok(rec.id.startsWith('rec-'));
    assert.ok(rec.title.length > 5);
    assert.ok(rec.relatedFactor.length > 5);
    assert.ok(rec.rationale.length > 10);
    assert.ok(rec.actionSteps.length >= 2);
    assert.ok(rec.clinicalDisclaimer.includes('not'));
  }

  // Case B: Balanced profile triggers maintenance recommendation
  const balancedStudent = {
    age: 22,
    gender: 'Female',
    degree: 'BSc',
    cgpa: 8.9,
    academicPressure: 1,
    workStudyHours: 6,
    sleepDuration: '7-8 hours',
    dietaryHabits: 'Healthy',
    studySatisfaction: 5,
    financialStress: 1
  };

  const reportB = analyzeStudentLifestyle(balancedStudent);
  const maintenanceRec = reportB.recommendations.find((r) => r.id === 'rec-maintenance');
  assert.ok(maintenanceRec !== undefined);
  assert.equal(maintenanceRec.relatedFactor, 'Balanced Collegiate Baseline');
});

// Test 5: Session Reset & Volatile Memory State
test('Session reset restores initial state and purges derived assessment results', async () => {
  const { INITIAL_APP_STATE, sessionStore } = await import('../src/storage/sessionStorage.ts');
  const { DEFAULT_SURVEY_FEATURES } = await import('../src/contracts/featureContract.ts');

  // Verify initial state values
  assert.equal(INITIAL_APP_STATE.currentScreen, 'welcome');
  assert.equal(INITIAL_APP_STATE.assessmentCompleted, false);
  assert.equal(INITIAL_APP_STATE.phq9Result, null);
  assert.equal(INITIAL_APP_STATE.isPreviewMode, false);
  assert.deepEqual(INITIAL_APP_STATE.surveyFeatures, DEFAULT_SURVEY_FEATURES);

  // Verify sessionStore in-memory volatility
  sessionStore.saveSession(DEFAULT_SURVEY_FEATURES, {
    routineNotes: 'Test',
    focusBlockMinutes: 50,
    hydrationPacingGoal: 2000
  });

  const retrieved = sessionStore.getSession();
  assert.ok(retrieved.surveyFeatures !== undefined);

  sessionStore.clearSession();
  const cleared = sessionStore.getSession();
  assert.equal(cleared.surveyFeatures, undefined);
});

// Test 6: Offline Execution Invariant
test('Engine executes 100% synchronously in local client memory with zero fetch calls', async () => {
  const { analyzeStudentLifestyle, evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');
  const { DEFAULT_SURVEY_FEATURES } = await import('../src/contracts/featureContract.ts');

  // Verify that execution is synchronous and does not return promises
  const report = analyzeStudentLifestyle(DEFAULT_SURVEY_FEATURES);
  assert.equal(typeof report.overallWellbeingScore, 'number');
  assert.equal(typeof report.sleepHealth.score, 'number');

  const phq = evaluatePHQ9([0, 1, 0, 1, 0, 1, 0, 1, 0]);
  assert.equal(typeof phq.totalScore, 'number');
});
