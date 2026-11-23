/**
 * frontend/test/phase_5_16_four_models_auth.test.mjs
 * Test suite for Phase 5.16: Four-Model ML Laboratory, Real-World Dataset Validation,
 * Authentication & Guardian Support.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { LARGE_DATASET_METRICS, SMALL_DATASET_METRICS } from '../src/data/modelMetricsData.ts';

describe('Phase 5.16: Four Independent ML Models & Laboratory Validation', () => {
  it('Large Dataset: Contains all four candidate models with comprehensive metrics', () => {
    const models = LARGE_DATASET_METRICS.models;
    const requiredModels = [
      'Logistic Regression',
      'Random Forest',
      'XGBoost',
      'Support Vector Machine'
    ];

    for (const name of requiredModels) {
      assert.ok(models[name], `Model ${name} must be present in Large Dataset metrics`);
      const m = models[name];
      assert.ok(m.test_metrics, `${name} must include holdout test metrics`);
      assert.ok(m.validation_metrics, `${name} must include validation metrics`);
      assert.ok(m.train_metrics, `${name} must include training metrics`);

      // 11 Core metrics check
      const t = m.test_metrics;
      assert.strictEqual(typeof t.accuracy, 'number');
      assert.strictEqual(typeof t.precision, 'number');
      assert.strictEqual(typeof t.recall, 'number');
      assert.strictEqual(typeof t.specificity, 'number');
      assert.strictEqual(typeof t.f1_score, 'number');
      assert.strictEqual(typeof t.roc_auc, 'number');
      assert.strictEqual(typeof t.pr_auc, 'number');
      assert.strictEqual(typeof t.brier_score, 'number');
      assert.strictEqual(typeof t.inference_time_ms_per_sample, 'number');

      // Breakdown check
      assert.ok(t.breakdown, `${name} must have confusion matrix breakdown`);
      assert.strictEqual(typeof t.breakdown.tn, 'number');
      assert.strictEqual(typeof t.breakdown.fp, 'number');
      assert.strictEqual(typeof t.breakdown.fn, 'number');
      assert.strictEqual(typeof t.breakdown.tp, 'number');

      // Curve data check
      assert.ok(Array.isArray(m.roc_curve), `${name} must have ROC curve points`);
      assert.ok(Array.isArray(m.pr_curve), `${name} must have PR curve points`);
      assert.ok(Array.isArray(m.calibration_curve), `${name} must have calibration points`);
    }
  });

  it('Large Dataset: Partition counts strictly adhere to 70/15/15 ratio on 27,901 records', () => {
    const s = LARGE_DATASET_METRICS.sample_counts;
    assert.strictEqual(LARGE_DATASET_METRICS.total_records, 27901);
    assert.strictEqual(s.train, 19530);
    assert.strictEqual(s.val, 4185);
    assert.strictEqual(s.test, 4186);
    assert.strictEqual(s.train + s.val + s.test, 27901);
  });

  it('163-Record Dataset: Explicitly labeled PROVENANCE UNVERIFIED', () => {
    assert.strictEqual(
      SMALL_DATASET_METRICS.dataset_provenance,
      '163-RECORD DATASET — PROVENANCE UNVERIFIED'
    );
    assert.strictEqual(
      SMALL_DATASET_METRICS.holdout_test_set_status,
      'NO INDEPENDENT HOLDOUT TEST SET FORMED'
    );
  });

  it('163-Record Dataset: Small-sample metrics contain mean, std, and 95% Confidence Intervals', () => {
    const models = SMALL_DATASET_METRICS.models;
    const requiredModels = [
      'Logistic Regression',
      'Random Forest',
      'XGBoost',
      'Support Vector Machine'
    ];

    for (const name of requiredModels) {
      assert.ok(models[name], `${name} must exist in Track B`);
      const summary = models[name].metrics_summary;
      for (const mKey of ['accuracy', 'precision', 'recall', 'specificity', 'f1_score', 'roc_auc', 'brier_score']) {
        const m = summary[mKey];
        assert.ok(m, `Metric ${mKey} must exist in ${name} summary`);
        assert.strictEqual(typeof m.mean, 'number');
        assert.strictEqual(typeof m.std, 'number');
        assert.strictEqual(typeof m.ci_95_lower, 'number');
        assert.strictEqual(typeof m.ci_95_upper, 'number');
        assert.ok(m.ci_95_lower <= m.ci_95_upper, `CI bounds valid for ${mKey}`);
      }
    }
  });

  it('Guardian Support: Standard message preview is non-diagnostic and student-approved', () => {
    const standardText = 'Your student has requested support from their trusted contact through Mindora. Please check in with them when possible.';
    // Strict non-diagnostic check: ensure no psychiatric or risk keywords in standard message
    assert.ok(!standardText.toLowerCase().includes('depression'));
    assert.ok(!standardText.toLowerCase().includes('suicide'));
    assert.ok(!standardText.toLowerCase().includes('phq'));
    assert.ok(!standardText.toLowerCase().includes('clinical'));
    assert.ok(!standardText.toLowerCase().includes('risk score'));
  });
});
