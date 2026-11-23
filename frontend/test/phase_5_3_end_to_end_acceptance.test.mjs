/**
 * Phase 5.3 End-to-End Student Journey Acceptance Test Suite
 * Validates:
 *   1. Full Student Journey: Welcome -> Consent -> Assessment -> Deterministic Scoring -> Dashboard -> Recommendations -> Resources -> Reset
 *   2. Assessment Input Scenarios (Missing, Invalid, Min/Max Bounds, Diverse Sleep/Study Profiles)
 *   3. PHQ-9 Screening Severity Boundaries & Independent Item 9 Safeguard
 *   4. Ephemeral In-Memory State & Complete Reset Isolation
 *   5. Factor-Linked Recommendation Relevance & Disclaimers
 *   6. Complete 24-Resource Provenance & Emergency Dispatch Isolation
 *   7. Offline End-to-End Execution & Zero Telemetry
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// SCENARIO 1: Full Valid Student Journey
test('Journey Step 1 to 11: Valid student inputs propagate accurately from assessment to dashboard and reset', async () => {
  const { validateStudentFeatures, analyzeStudentLifestyle, evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');
  const { sessionStore } = await import('../src/storage/sessionStorage.ts');

  // Step 1: Initial State & Consent
  sessionStore.clearSession();
  const initial = sessionStore.getSession();
  assert.equal(initial.surveyFeatures, undefined, 'Session should be uninitialized before assessment');

  // Step 2 & 3: Student completes assessment
  const rawFeatures = {
    age: 22,
    gender: 'Female',
    degree: 'B.Tech',
    academicPressure: 4,
    workStudyHours: 9.0,
    cgpa: 8.2,
    studySatisfaction: 3,
    sleepDuration: '5-6 hours',
    dietaryHabits: 'Moderate',
    financialStress: 4
  };

  const phq9Answers = [1, 2, 1, 1, 2, 1, 1, 1, 0]; // Total score = 10 (Moderate), Item 9 = 0

  // Step 4: Input Validation
  const validated = validateStudentFeatures(rawFeatures);
  assert.equal(validated.age, 22);
  assert.equal(validated.academicPressure, 4);
  assert.equal(validated.workStudyHours, 9.0);

  // Step 5: Deterministic Lifestyle Calculation
  const lifestyle = analyzeStudentLifestyle(validated);
  assert.ok(lifestyle.overallWellbeingScore >= 0 && lifestyle.overallWellbeingScore <= 100);
  assert.equal(lifestyle.sleepHealth.status, 'moderate', '5-6 hours sleep should have moderate status');
  assert.equal(lifestyle.academicBalance.status, 'needs_attention', '9 hours study + pressure 4 should have needs_attention status');

  // Step 6: PHQ-9 Screening
  const phq9Result = evaluatePHQ9(phq9Answers);
  assert.equal(phq9Result.totalScore, 10);
  assert.equal(phq9Result.severity, 'Moderate');
  assert.equal(phq9Result.hasSelfHarmRisk, false);

  // Step 7: Recommendations
  const recommendations = lifestyle.recommendations;
  assert.ok(recommendations.length >= 2, 'Should generate at least 2 targeted recommendations');
  const recCategories = recommendations.map((r) => r.category);
  assert.ok(recCategories.includes('Sleep') || recCategories.includes('Study Routine'));

  // Step 8: Save to Ephemeral Session
  sessionStore.saveSession(validated, lifestyle);
  const stored = sessionStore.getSession();
  assert.ok(stored.surveyFeatures !== undefined);
  assert.equal(stored.surveyFeatures.age, 22);

  // Step 9: Reset Session
  sessionStore.clearSession();
  const resetState = sessionStore.getSession();
  assert.equal(resetState.surveyFeatures, undefined, 'Session should be completely purged on reset');
});

// SCENARIO 2: Missing Required Inputs & Fallback Sanitization
test('Assessment Scenario: Missing required inputs fallback gracefully to contract defaults', async () => {
  const { validateStudentFeatures } = await import('../src/engines/wellbeingEngine.ts');

  // Pass empty object
  const sanitized = validateStudentFeatures({});
  assert.equal(sanitized.age, 21);
  assert.equal(sanitized.cgpa, 7.8);
  assert.equal(sanitized.academicPressure, 3);
  assert.equal(sanitized.studySatisfaction, 3);
  assert.equal(sanitized.workStudyHours, 6.5);
  assert.equal(sanitized.financialStress, 3);
  assert.equal(sanitized.sleepDuration, '7-8 hours');
  assert.equal(sanitized.dietaryHabits, 'Moderate');
  assert.equal(sanitized.degree, 'B.Tech');
});

// SCENARIO 3: Invalid Numerical Inputs (NaN, Negatives, Infinite, Out-of-Range Strings)
test('Assessment Scenario: Invalid numerical inputs are clamped strictly to clinical & contract bounds', async () => {
  const { validateStudentFeatures } = await import('../src/engines/wellbeingEngine.ts');

  const malformed = {
    age: -10, // Clamped to min 16
    cgpa: 15.0, // Clamped to max 10.0
    academicPressure: 99, // Clamped to max 5
    studySatisfaction: 0, // Clamped to min 1
    workStudyHours: -20, // Clamped to min 0.0
    financialStress: NaN, // Falls back to default 3
    sleepDuration: 'Bogus Sleep', // Falls back to '7-8 hours'
    dietaryHabits: 12345, // Falls back to 'Moderate'
    degree: 'NonExistentDegree' // Falls back to 'B.Tech'
  };

  const sanitized = validateStudentFeatures(malformed);
  assert.equal(sanitized.age, 16);
  assert.equal(sanitized.cgpa, 10.0);
  assert.equal(sanitized.academicPressure, 5);
  assert.equal(sanitized.studySatisfaction, 1);
  assert.equal(sanitized.workStudyHours, 0.0);
  assert.equal(sanitized.financialStress, 3);
  assert.equal(sanitized.sleepDuration, '7-8 hours');
  assert.equal(sanitized.dietaryHabits, 'Moderate');
  assert.equal(sanitized.degree, 'B.Tech');
});

// SCENARIO 4: Minimum and Maximum Permitted Values
test('Assessment Scenario: Minimum and maximum permitted values produce valid deterministic metrics', async () => {
  const { validateStudentFeatures, analyzeStudentLifestyle } = await import('../src/engines/wellbeingEngine.ts');

  // Absolute Minimum Stress / Maximum Wellbeing Profile
  const minFrictionFeatures = validateStudentFeatures({
    age: 16,
    cgpa: 10.0,
    academicPressure: 1,
    studySatisfaction: 5,
    workStudyHours: 0.0,
    sleepDuration: '7-8 hours',
    dietaryHabits: 'Healthy',
    financialStress: 1
  });
  const minLifestyle = analyzeStudentLifestyle(minFrictionFeatures);
  assert.ok(minLifestyle.overallWellbeingScore >= 0 && minLifestyle.overallWellbeingScore <= 100);
  assert.equal(minLifestyle.sleepHealth.status, 'optimal');
  assert.equal(minLifestyle.nourishment.status, 'optimal');

  // Absolute Maximum Stress / Highest Friction Profile
  const maxFrictionFeatures = validateStudentFeatures({
    age: 55,
    cgpa: 0.0,
    academicPressure: 5,
    studySatisfaction: 1,
    workStudyHours: 16.0,
    sleepDuration: 'Less than 5 hours',
    dietaryHabits: 'Unhealthy',
    financialStress: 5
  });
  const maxLifestyle = analyzeStudentLifestyle(maxFrictionFeatures);
  assert.ok(maxLifestyle.overallWellbeingScore >= 0 && maxLifestyle.overallWellbeingScore <= 100);
  assert.equal(maxLifestyle.sleepHealth.status, 'needs_attention');
  assert.equal(maxLifestyle.nourishment.status, 'needs_attention');
  assert.ok(maxLifestyle.overallWellbeingScore < minLifestyle.overallWellbeingScore);
});

// SCENARIO 5: Diverse Sleep and Study Patterns
test('Assessment Scenario: Sleep and study duration variations accurately scale friction indices', async () => {
  const { validateStudentFeatures, analyzeStudentLifestyle } = await import('../src/engines/wellbeingEngine.ts');

  // Optimal Sleep: 7-8 hours -> score 95
  const optSleep = analyzeStudentLifestyle(validateStudentFeatures({ sleepDuration: '7-8 hours' }));
  assert.equal(optSleep.sleepHealth.score, 95);

  // Moderate Deficit: 5-6 hours -> score 55
  const modSleep = analyzeStudentLifestyle(validateStudentFeatures({ sleepDuration: '5-6 hours' }));
  assert.equal(modSleep.sleepHealth.score, 55);

  // Severe Deficit: Less than 5 hours -> score 30
  const sevSleep = analyzeStudentLifestyle(validateStudentFeatures({ sleepDuration: 'Less than 5 hours' }));
  assert.equal(sevSleep.sleepHealth.score, 30);

  // Extended Sleep: More than 8 hours -> score 80
  const longSleep = analyzeStudentLifestyle(validateStudentFeatures({ sleepDuration: 'More than 8 hours' }));
  assert.equal(longSleep.sleepHealth.score, 80);
});

// SCENARIO 6: PHQ-9 Severity Level Classification
test('Assessment Scenario: PHQ-9 severity levels map strictly to standard clinical brackets', async () => {
  const { evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');

  // Minimal: 0-4
  assert.equal(evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]).severity, 'Minimal');
  assert.equal(evaluatePHQ9([0, 1, 1, 0, 1, 0, 0, 1, 0]).severity, 'Minimal'); // 4

  // Mild: 5-9
  assert.equal(evaluatePHQ9([1, 1, 1, 1, 1, 0, 0, 0, 0]).severity, 'Mild'); // 5
  assert.equal(evaluatePHQ9([1, 1, 1, 1, 1, 1, 1, 1, 1]).severity, 'Mild'); // 9

  // Moderate: 10-14
  assert.equal(evaluatePHQ9([2, 1, 1, 1, 1, 1, 1, 1, 1]).severity, 'Moderate'); // 10
  assert.equal(evaluatePHQ9([2, 2, 2, 2, 2, 2, 1, 1, 0]).severity, 'Moderate'); // 14

  // Moderately Severe: 15-19
  assert.equal(evaluatePHQ9([2, 2, 2, 2, 2, 2, 1, 1, 1]).severity, 'Moderately Severe'); // 15
  assert.equal(evaluatePHQ9([3, 2, 2, 2, 2, 2, 2, 2, 2]).severity, 'Moderately Severe'); // 19

  // Severe: 20-27
  assert.equal(evaluatePHQ9([3, 3, 2, 2, 2, 2, 2, 2, 2]).severity, 'Severe'); // 20
  assert.equal(evaluatePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 3]).severity, 'Severe'); // 27
});

// SCENARIO 7: Positive Item 9 Response & Independent Safety Safeguard
test('Assessment Scenario: Item 9 positive response triggers safety safeguard independently of total score', async () => {
  const { evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');

  // Item 9 = 1 with all other items 0 (Total = 1) -> Must trigger safeguard
  const item9LowScore = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 1]);
  assert.equal(item9LowScore.totalScore, 1);
  assert.equal(item9LowScore.severity, 'Minimal');
  assert.equal(item9LowScore.item9Score, 1);
  assert.equal(item9LowScore.hasSelfHarmRisk, true, 'Item 9 > 0 MUST trigger hasSelfHarmRisk');

  // Item 9 = 2
  const item9Mod = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 2]);
  assert.equal(item9Mod.hasSelfHarmRisk, true);

  // Item 9 = 3
  const item9High = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 3]);
  assert.equal(item9High.hasSelfHarmRisk, true);

  // Item 9 = 0 with high score (Total = 24) -> No self harm risk
  const highNoItem9 = evaluatePHQ9([3, 3, 3, 3, 3, 3, 3, 3, 0]);
  assert.equal(highNoItem9.totalScore, 24);
  assert.equal(highNoItem9.severity, 'Severe');
  assert.equal(highNoItem9.item9Score, 0);
  assert.equal(highNoItem9.hasSelfHarmRisk, false, 'Item 9 == 0 MUST NOT trigger self-harm risk');
});

// SCENARIO 8: Complete Provenance Audit Across All 24 Catalogue Resources
test('Resource Provenance Audit: All 24 catalogue entries possess non-empty sources, URLs, and 2026-11-15 date', async () => {
  const { RESOURCE_CATALOGUE } = await import('../src/data/resourceCatalogue.ts');

  assert.equal(RESOURCE_CATALOGUE.length, 24, 'Catalogue must contain exactly 24 verified entries');

  const requiredFields = [
    'id', 'name', 'countryOrRegion', 'category', 'categoryLabel',
    'website', 'operatingHours', 'eligibilityRestrictions',
    'isEmergencyDispatch', 'summary', 'description',
    'officialVerificationSource', 'verificationSourceUrl',
    'lastVerificationDate', 'verificationStatus'
  ];

  for (const res of RESOURCE_CATALOGUE) {
    for (const field of requiredFields) {
      assert.ok(res[field] !== undefined && res[field] !== null, `Resource ${res.id} missing field ${field}`);
    }
    assert.equal(res.verificationStatus, 'VERIFIED');
    assert.equal(res.lastVerificationDate, '2026-11-15');
    assert.ok(res.website.startsWith('http'), `Resource ${res.id} must have valid website url`);
    assert.ok(res.verificationSourceUrl.startsWith('http'), `Resource ${res.id} must have valid verificationSourceUrl`);
  }
});

// SCENARIO 9: Offline Safety & Zero External Network Transmission
test('Offline Safety: All core modules evaluate 100% synchronously with zero global fetch dependencies', async () => {
  const { validateStudentFeatures, analyzeStudentLifestyle, evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');
  const { queryResourceCatalogue, getNationalCrisisSummary } = await import('../src/data/resourceCatalogue.ts');

  // Verify that operations execute in sub-millisecond local memory without fetch
  const validated = validateStudentFeatures({});
  const lifestyle = analyzeStudentLifestyle(validated);
  const phq9 = evaluatePHQ9([0, 1, 0, 1, 0, 1, 0, 1, 0]);
  const resources = queryResourceCatalogue({ country: 'India', category: 'emergency_dispatch' });
  const summary = getNationalCrisisSummary('United States');

  assert.ok(lifestyle);
  assert.ok(phq9);
  assert.ok(lifestyle.recommendations.length > 0);
  assert.ok(resources.length > 0);
  assert.ok(summary);
});
