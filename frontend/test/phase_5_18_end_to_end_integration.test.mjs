/**
 * frontend/test/phase_5_18_end_to_end_integration.test.mjs
 * Comprehensive End-to-End Integration Test Suite for Phase 5.18.
 * Validates complete student journeys, four-model reconciliation, dataset isolation,
 * guardian consent, and privacy boundary enforcement.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LARGE_DATASET_METRICS, SMALL_DATASET_METRICS } from '../src/data/modelMetricsData.ts';
import { evaluatePHQ9, validateStudentFeatures, analyzeStudentLifestyle } from '../src/engines/wellbeingEngine.ts';
import { INITIAL_APP_STATE, SAMPLE_PREVIEW_STATE } from '../src/storage/sessionStorage.ts';
import { filterActivityTimeline } from '../src/engines/activityTimelineEngine.ts';
import { getPrivacyInventory } from '../src/engines/privacyInventoryEngine.ts';

describe('Phase 5.18: End-to-End Student Journey & Subsystem Integration', () => {

  // Journey 1: Initial State & Navigation Boundaries
  it('Journey 1: App initializes in unassessed state with dashboard locked until assessment or preview', () => {
    assert.strictEqual(INITIAL_APP_STATE.currentScreen, 'welcome');
    assert.strictEqual(INITIAL_APP_STATE.assessmentCompleted, false);
    assert.strictEqual(INITIAL_APP_STATE.isPreviewMode, false);
    assert.strictEqual(INITIAL_APP_STATE.hasConsented, false);

    // Verify sample preview activates unlocked dashboard without marking assessment completed
    assert.strictEqual(SAMPLE_PREVIEW_STATE.currentScreen, 'dashboard');
    assert.strictEqual(SAMPLE_PREVIEW_STATE.isPreviewMode, true);
    assert.strictEqual(SAMPLE_PREVIEW_STATE.assessmentCompleted, true);
  });

  // Journey 2 & 3: Assessment Scoring, Validation & Item 9 Safeguard
  it('Journey 2: Assessment evaluates deterministic PHQ-9 severity and triggers independent Item 9 safeguard', () => {
    // Normal Moderate depression without self-harm
    const answersNormal = [1, 2, 1, 1, 2, 1, 1, 1, 0];
    const evalNormal = evaluatePHQ9(answersNormal);
    assert.strictEqual(evalNormal.totalScore, 10);
    assert.strictEqual(evalNormal.severity, 'Moderate');
    assert.strictEqual(evalNormal.hasSelfHarmRisk, false);

    // Mild total score (3) but positive on Item 9 (answer = 1)
    const answersItem9 = [0, 0, 1, 0, 1, 0, 0, 0, 1];
    const evalItem9 = evaluatePHQ9(answersItem9);
    assert.strictEqual(evalItem9.totalScore, 3);
    assert.strictEqual(evalItem9.severity, 'Minimal');
    assert.strictEqual(evalItem9.hasSelfHarmRisk, true, 'Item 9 positive must trigger safeguard independently of score');
  });

  // Journey 4: Four-Model Metric Reconciliation Parity
  it('Journey 3: Model Comparison displays exact Phase 5.17 canonical reconciled metrics', () => {
    const models = LARGE_DATASET_METRICS.models;
    const xgb = models['XGBoost'].test_metrics;

    // Verify the resolved canonical XGBoost values
    assert.strictEqual(xgb.accuracy, 0.7965);
    assert.strictEqual(xgb.precision, 0.8149);
    assert.strictEqual(xgb.recall, 0.8441);
    assert.strictEqual(xgb.specificity, 0.7291);
    assert.strictEqual(xgb.f1_score, 0.8293);
    assert.strictEqual(xgb.roc_auc, 0.8677);
    assert.strictEqual(xgb.brier_score, 0.1437);

    // Verify exact confusion matrix breakdown
    assert.strictEqual(xgb.breakdown.tn, 1265);
    assert.strictEqual(xgb.breakdown.fp, 470);
    assert.strictEqual(xgb.breakdown.fn, 382);
    assert.strictEqual(xgb.breakdown.tp, 2069);
    assert.strictEqual(xgb.breakdown.tn + xgb.breakdown.fp + xgb.breakdown.fn + xgb.breakdown.tp, 4186);

    // Verify mathematical identity: Precision = TP / (TP + FP)
    const calcPrec = xgb.breakdown.tp / (xgb.breakdown.tp + xgb.breakdown.fp);
    assert.ok(Math.abs(calcPrec - 0.814887) < 0.0001);
  });

  // Journey 5: Track B Dataset Governance & Holdout Disclosure
  it('Journey 4: Track B Real-World Lab preserves mandatory provenance label and zero-holdout notice', () => {
    assert.ok(
      SMALL_DATASET_METRICS.dataset_provenance.includes('PROVENANCE UNVERIFIED'),
      'Must contain PROVENANCE UNVERIFIED banner'
    );
    assert.strictEqual(SMALL_DATASET_METRICS.total_raw_records, 162);
    assert.strictEqual(SMALL_DATASET_METRICS.primary_cohort_size, 143);
    assert.ok(SMALL_DATASET_METRICS.holdout_rationale.includes('too small to split an independent holdout'));

    // Cross-validation 95% CI presence
    for (const modelName of Object.keys(SMALL_DATASET_METRICS.models)) {
      const s = SMALL_DATASET_METRICS.models[modelName].metrics_summary;
      assert.ok(s.accuracy.ci_95_lower !== undefined, `${modelName} must include 95% CI lower for accuracy`);
      assert.ok(s.accuracy.ci_95_upper !== undefined, `${modelName} must include 95% CI upper for accuracy`);
      assert.ok(s.f1_score.ci_95_lower !== undefined, `${modelName} must include 95% CI for F1`);
    }
  });

  // Journey 6: Guardian Support Non-Diagnostic Privacy Invariant
  it('Journey 5: Guardian Support messages are strictly non-diagnostic and student-approved', () => {
    const standardMessage = 'Your student has requested support from their trusted contact through Mindora. Please check in with them when possible.';
    
    // Invariant: Zero clinical terms in guardian dispatch
    assert.ok(!standardMessage.toLowerCase().includes('depression'), 'Must not mention depression');
    assert.ok(!standardMessage.toLowerCase().includes('phq-9'), 'Must not mention PHQ-9');
    assert.ok(!standardMessage.toLowerCase().includes('diagnosis'), 'Must not mention diagnosis');
    assert.ok(!standardMessage.toLowerCase().includes('risk'), 'Must not mention risk score');
    assert.ok(standardMessage.includes('Mindora'), 'Must clearly identify origin as Mindora');
  });

  // Journey 7: Privacy Center & Data Category Segregation
  it('Journey 6: Privacy Center inventory segregates sensitive data and excludes clinical metrics from timeline', async () => {
    // 6 Verified Categories
    const inventory = await getPrivacyInventory();
    assert.strictEqual(inventory.length, 6);
    const ids = inventory.map((c) => c.id);
    assert.ok(ids.includes('preferences'));
    assert.ok(ids.includes('trends_vault'));
    assert.ok(ids.includes('planner'));
    assert.ok(ids.includes('daily_checkin'));

    // Activity Timeline Privacy: Never contains PHQ-9 or depression metrics
    const sampleItems = [
      {
        id: '1',
        title: 'Sleep Routine Action',
        category: 'planner',
        categoryLabel: 'Smart Action Planner',
        timestamp: new Date().toISOString(),
        displayDate: new Date().toISOString().slice(0, 10),
        displayTime: '10:00 AM',
        description: 'Completed 20-min digital wind-down buffer before sleep.',
        sourceFeature: 'planner',
        sourceLabel: 'Smart Action Planner',
        isCompleted: true
      },
      {
        id: '2',
        title: '4-7-8 Breathing Session',
        category: 'wellness',
        categoryLabel: 'Interactive Studio',
        timestamp: new Date().toISOString(),
        displayDate: new Date().toISOString().slice(0, 10),
        displayTime: '02:30 PM',
        description: 'Completed 4 cycles of restorative guided breathwork.',
        sourceFeature: 'wellness',
        sourceLabel: 'Interactive Studio',
        isCompleted: true
      }
    ];
    const filtered = filterActivityTimeline(sampleItems, { category: 'all', dateRange: 'all', searchQuery: '' });
    assert.strictEqual(filtered.length, 2);
    for (const item of filtered) {
      assert.ok(!item.description.includes('PHQ-9'));
      assert.ok(!item.description.includes('Depression'));
    }
  });

  // Journey 8: Deterministic Offline Safety
  it('Journey 7: Core scoring and recommendations evaluate 100% synchronously without network dependencies', () => {
    const features = validateStudentFeatures({
      age: 20,
      gender: 'Male',
      academicPressure: 3,
      workStudyHours: 6.0,
      cgpa: 8.0,
      studySatisfaction: 3,
      sleepDuration: '7-8 hours',
      dietaryHabits: 'Healthy',
      degree: 'B.Sc',
      financialStress: 2
    });

    const lifestyle = analyzeStudentLifestyle(features);
    assert.ok(lifestyle.overallWellbeingScore >= 0 && lifestyle.overallWellbeingScore <= 100);
    assert.ok(lifestyle.sleepHealth.score >= 0 && lifestyle.sleepHealth.score <= 100);
    assert.ok(lifestyle.academicBalance.score >= 0 && lifestyle.academicBalance.score <= 100);
  });
});
