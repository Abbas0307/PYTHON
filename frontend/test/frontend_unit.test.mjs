import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Test 1: Feature Contract
test('Feature contract contains strictly 10 approved features', async () => {
  const { APPROVED_FEATURE_COUNT, DEFAULT_SURVEY_FEATURES, DEGREE_OPTIONS, SLEEP_DURATION_OPTIONS } = await import('../src/contracts/featureContract.ts');
  assert.equal(APPROVED_FEATURE_COUNT, 10);
  assert.equal(Object.keys(DEFAULT_SURVEY_FEATURES).length, 10);
  assert.ok(DEGREE_OPTIONS.length > 20);
  assert.ok(SLEEP_DURATION_OPTIONS.includes('7-8 hours'));
  assert.ok(SLEEP_DURATION_OPTIONS.includes('Less than 5 hours'));
});

// Test 2: Privacy Policy Classifications
test('Privacy Policy correctly segregates Category A sensitive data', async () => {
  const { CATEGORY_A_FIELDS, CATEGORY_B_FIELDS } = await import('../src/contracts/privacyPolicy.ts');
  assert.ok(CATEGORY_A_FIELDS.includes('phq9_answers'));
  assert.ok(CATEGORY_A_FIELDS.includes('phq9_item_9'));
  assert.ok(CATEGORY_A_FIELDS.includes('has_self_harm_risk'));
  assert.equal(CATEGORY_A_FIELDS.length, 7);
  assert.equal(CATEGORY_B_FIELDS.length, 10);
});

// Test 3: PHQ-9 Evaluation & Item 9 Safeguard
test('PHQ-9 evaluation calculates exact severity and triggers Item 9 safeguard', async () => {
  const { evaluatePHQ9 } = await import('../src/engines/wellbeingEngine.ts');
  
  // Minimal case
  const minimal = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.equal(minimal.totalScore, 0);
  assert.equal(minimal.severity, 'Minimal');
  assert.equal(minimal.hasSelfHarmRisk, false);
  
  // Moderate case
  const moderate = evaluatePHQ9([1, 2, 1, 2, 1, 2, 1, 1, 0]);
  assert.equal(moderate.totalScore, 11);
  assert.equal(moderate.severity, 'Moderate');
  assert.equal(moderate.hasSelfHarmRisk, false);
  
  // Item 9 positive risk trigger (even with low total score)
  const item9Risk = evaluatePHQ9([0, 0, 0, 0, 0, 0, 0, 0, 1]);
  assert.equal(item9Risk.totalScore, 1);
  assert.equal(item9Risk.item9Score, 1);
  assert.equal(item9Risk.hasSelfHarmRisk, true);
});

// Test 4: Deterministic Lifestyle Analysis
test('Lifestyle engine analyzes sleep, study hours and nourishment friction', async () => {
  const { analyzeStudentLifestyle } = await import('../src/engines/wellbeingEngine.ts');
  const { DEFAULT_SURVEY_FEATURES } = await import('../src/contracts/featureContract.ts');
  
  const report = analyzeStudentLifestyle(DEFAULT_SURVEY_FEATURES);
  assert.ok(report.overallWellbeingScore >= 0 && report.overallWellbeingScore <= 100);
  assert.equal(report.sleepHealth.status, 'optimal');
  assert.equal(report.recommendations.length, 3);
  
  // Sleep deficit case
  const deficitReport = analyzeStudentLifestyle({
    ...DEFAULT_SURVEY_FEATURES,
    sleepDuration: 'Less than 5 hours'
  });
  assert.equal(deficitReport.sleepHealth.status, 'needs_attention');
  assert.ok(deficitReport.sleepHealth.score < 50);
});

// Test 5: Authoritative Crisis Directory
test('Crisis directory maintains exact national and regional pathways', async () => {
  const { NATIONAL_CRISIS_DIRECTORY } = await import('../src/engines/crisisDirectory.ts');
  
  // India
  assert.equal(NATIONAL_CRISIS_DIRECTORY['India'].emergencyNumber, '112');
  assert.ok(NATIONAL_CRISIS_DIRECTORY['India'].primaryMentalHealthNumber.includes('14416'));
  
  // US
  assert.equal(NATIONAL_CRISIS_DIRECTORY['United States'].emergencyNumber, '911');
  assert.ok(NATIONAL_CRISIS_DIRECTORY['United States'].primaryMentalHealthNumber.includes('988'));
  
  // UK
  assert.equal(NATIONAL_CRISIS_DIRECTORY['United Kingdom'].emergencyNumber, '999');
  assert.ok(NATIONAL_CRISIS_DIRECTORY['United Kingdom'].regionalNotice.includes('Northern Ireland'));
  assert.ok(NATIONAL_CRISIS_DIRECTORY['United Kingdom'].regionalNotice.includes('Lifeline NI'));
});

// Test 6: PWA Service Worker Safe Offline Shell Policy
test('Service worker strictly caches only static assets and excludes dynamic data', () => {
  const swPath = path.resolve('public/sw.js');
  assert.ok(fs.existsSync(swPath), 'sw.js must exist in public directory');
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert.ok(swContent.includes("request.method !== 'GET'"), 'SW must reject non-GET caching');
  assert.ok(swContent.includes('STATIC_APP_SHELL_ASSETS'), 'SW must define static app shell assets');
  assert.ok(!swContent.includes('phq9'), 'SW must never reference phq9');
  assert.ok(!swContent.includes('localStorage'), 'SW must never access storage');
});

// Test 7: Preview State vs Personal Reflection State Separation
test('Preview mode state is cleanly separated from unassessed default state', async () => {
  const { INITIAL_APP_STATE, SAMPLE_PREVIEW_STATE } = await import('../src/storage/sessionStorage.ts');
  assert.equal(INITIAL_APP_STATE.isPreviewMode, false);
  assert.equal(INITIAL_APP_STATE.assessmentCompleted, false);
  assert.equal(INITIAL_APP_STATE.phq9Result, null);
  
  assert.equal(SAMPLE_PREVIEW_STATE.isPreviewMode, true);
  assert.equal(SAMPLE_PREVIEW_STATE.assessmentCompleted, true);
  assert.ok(SAMPLE_PREVIEW_STATE.phq9Result !== null);
  assert.equal(SAMPLE_PREVIEW_STATE.phq9Result.totalScore, 4);
});

// Test 8: Deterministic Metric Bounds & Calculations
test('Deterministic calculations enforce exact mathematical bounds [0, 100]', async () => {
  const { analyzeStudentLifestyle } = await import('../src/engines/wellbeingEngine.ts');
  const { DEFAULT_SURVEY_FEATURES } = await import('../src/contracts/featureContract.ts');
  
  // Extreme stress case
  const extremeFeatures = {
    ...DEFAULT_SURVEY_FEATURES,
    academicPressure: 5,
    studySatisfaction: 1,
    workStudyHours: 16,
    financialStress: 5,
    sleepDuration: 'Less than 5 hours',
    dietaryHabits: 'Unhealthy'
  };
  const extremeReport = analyzeStudentLifestyle(extremeFeatures);
  assert.ok(extremeReport.overallWellbeingScore >= 0 && extremeReport.overallWellbeingScore <= 100);
  assert.ok(extremeReport.stressFriction.compositeFriction > 70);
  
  // Optimal case
  const optimalFeatures = {
    ...DEFAULT_SURVEY_FEATURES,
    academicPressure: 1,
    studySatisfaction: 5,
    workStudyHours: 6,
    financialStress: 1,
    sleepDuration: '7-8 hours',
    dietaryHabits: 'Healthy'
  };
  const optimalReport = analyzeStudentLifestyle(optimalFeatures);
  assert.ok(optimalReport.overallWellbeingScore >= 80);
  assert.ok(optimalReport.stressFriction.compositeFriction < 30);
});
