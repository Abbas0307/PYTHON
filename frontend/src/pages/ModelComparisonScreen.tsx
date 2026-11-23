import React, { useState } from 'react';
import { LARGE_DATASET_METRICS } from '../data/modelMetricsData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Scale, Award, Info } from 'lucide-react';

export const ModelComparisonScreen: React.FC = () => {
  const models = LARGE_DATASET_METRICS.models as Record<string, any>;
  const modelNames = Object.keys(models);

  type SelectionMetric = 'f1_score' | 'recall' | 'accuracy' | 'roc_auc' | 'brier_score';
  const [selectionMetric, setSelectionMetric] = useState<SelectionMetric>('f1_score');

  // Identify Best Model based on Validation Set (Methodological Rule: No selection on test set!)
  const bestModelKey = modelNames.reduce((best, curr) => {
    const valCurr = models[curr].validation_metrics[selectionMetric];
    const valBest = models[best].validation_metrics[selectionMetric];
    if (selectionMetric === 'brier_score') {
      return valCurr < valBest ? curr : best; // Lower Brier is better
    }
    return valCurr > valBest ? curr : best;
  }, modelNames[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-violet-200 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5" />
            <span>Four-Model Comparative Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Multi-Model Laboratory Benchmark
          </h1>
          <p className="mt-2 text-sm sm:text-base text-violet-100 leading-relaxed">
            Side-by-side evaluation of Logistic Regression, Random Forest, XGBoost, and Support Vector Machine on 27,901 student records. Model selection is governed strictly by validation performance, with independent test sets reserved exclusively for generalization verification.
          </p>
        </div>
      </div>

      {/* Model Selection by Metric Card */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl bg-gradient-to-br from-white to-violet-50/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">Validation-Governed Model Selection</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Select an optimization metric to inspect the recommended model. Mindora strictly evaluates selection on validation folds to prevent test-set data snooping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">Optimize By:</span>
            {(
              [
                ['f1_score', 'Validation F1 (Balanced)'],
                ['recall', 'Recall / Sensitivity (Min FN)'],
                ['roc_auc', 'ROC-AUC (Discrimination)'],
                ['accuracy', 'Overall Accuracy'],
                ['brier_score', 'Brier Score (Calibration)']
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectionMetric(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectionMetric === key
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Best Model Spotlight */}
        <div className="mt-6 p-4 rounded-xl bg-violet-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-violet-200 font-bold">
              Top-Ranked Model by {selectionMetric.replace('_', ' ').toUpperCase()} (Validation Set)
            </span>
            <div className="text-2xl font-black mt-0.5">{bestModelKey}</div>
            <p className="text-xs text-violet-100 mt-1 max-w-xl">
              Validation Score: <strong>{models[bestModelKey].validation_metrics[selectionMetric]}</strong> | Holdout Test Score: <strong>{models[bestModelKey].test_metrics[selectionMetric]}</strong>
            </p>
          </div>
          <div className="text-right sm:text-right shrink-0">
            <div className="text-xs text-violet-200 font-medium">Trade-off Balance</div>
            <div className="text-sm font-semibold text-white mt-0.5">
              Precision: {(models[bestModelKey].test_metrics.precision * 100).toFixed(1)}% | Recall: {(models[bestModelKey].test_metrics.recall * 100).toFixed(1)}%
            </div>
            <span className="inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded text-violet-100 mt-1">
              Test FN: {models[bestModelKey].test_metrics.breakdown.fn} / {models[bestModelKey].test_metrics.breakdown.tp + models[bestModelKey].test_metrics.breakdown.fn}
            </span>
          </div>
        </div>

        {/* Trade-off Explanation Banner */}
        <div className="mt-4 flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Clinical Safety & Trade-off Consideration:</strong> In student wellbeing and risk detection, <strong>Recall (Sensitivity)</strong> is prioritized over raw accuracy because a <strong>False Negative</strong> represents a distressed student who receives no proactive guidance. Conversely, maintaining acceptable <strong>Precision</strong> prevents alert fatigue. XGBoost achieves the highest harmonic balance (F1: 82.9%, ROC-AUC: 0.868) on the untouched holdout test partition.
          </div>
        </div>
      </Card>

      {/* Complete 11-Metric Comparison Table */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
        <h3 className="text-base font-bold text-gray-900 mb-2">Comprehensive 11-Metric Benchmark Table</h3>
        <p className="text-xs text-gray-500 mb-4">
          All metrics computed on the untouched holdout test partition ($N = 4,186$) after model selection on validation folds.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 font-semibold text-gray-500 uppercase bg-gray-50/70">
                <th className="py-2.5 px-3">Model Algorithm</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall (Sens)</th>
                <th className="py-2.5 px-3">Specificity</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">ROC-AUC</th>
                <th className="py-2.5 px-3">PR-AUC</th>
                <th className="py-2.5 px-3">Brier Score</th>
                <th className="py-2.5 px-3">Train Time</th>
                <th className="py-2.5 px-3">Inference / Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {modelNames.map((name) => {
                const m = models[name];
                const t = m.test_metrics;
                const isSelected = name === bestModelKey;
                return (
                  <tr key={name} className={`hover:bg-violet-50/40 ${isSelected ? 'bg-violet-50/60 font-semibold' : ''}`}>
                    <td className="py-3 px-3 font-sans font-bold text-gray-900 flex items-center gap-1.5">
                      {name}
                      {isSelected && <Badge variant="violet">Top Val</Badge>}
                    </td>
                    <td className="py-3 px-3">{(t.accuracy * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{(t.precision * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3 text-violet-700">{(t.recall * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{(t.specificity * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3 font-black text-violet-900">{(t.f1_score * 100).toFixed(2)}%</td>
                    <td className="py-3 px-3">{t.roc_auc.toFixed(3)}</td>
                    <td className="py-3 px-3">{t.pr_auc.toFixed(3)}</td>
                    <td className="py-3 px-3 text-emerald-700">{t.brier_score.toFixed(4)}</td>
                    <td className="py-3 px-3 text-gray-500 font-sans">{m.training_duration_seconds}s</td>
                    <td className="py-3 px-3 text-gray-500 font-sans">{t.inference_time_ms_per_sample} ms</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side-by-Side Confusion Matrices */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">Confusion Matrices Side-by-Side (Holdout Test Split)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {modelNames.map((name) => {
            const b = models[name].test_metrics.breakdown;
            return (
              <Card key={name} className="p-4 border border-gray-100 shadow-sm rounded-xl">
                <div className="font-bold text-sm text-gray-900 mb-2 truncate">{name}</div>
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="bg-emerald-50 border border-emerald-200 p-2 rounded">
                    <span className="text-[9px] text-emerald-700 uppercase font-bold block">TN</span>
                    <span className="font-bold text-emerald-900">{b.tn}</span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 p-2 rounded">
                    <span className="text-[9px] text-rose-700 uppercase font-bold block">FP</span>
                    <span className="font-bold text-rose-900">{b.fp}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-2 rounded">
                    <span className="text-[9px] text-amber-700 uppercase font-bold block">FN</span>
                    <span className="font-bold text-amber-900">{b.fn}</span>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 p-2 rounded">
                    <span className="text-[9px] text-violet-700 uppercase font-bold block">TP</span>
                    <span className="font-bold text-violet-900">{b.tp}</span>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                  <span>Accuracy: {(models[name].test_metrics.accuracy * 100).toFixed(1)}%</span>
                  <span>F1: {(models[name].test_metrics.f1_score * 100).toFixed(1)}%</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Comparative ROC & PR Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Model ROC Curves */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-1">Comparative ROC Curves Overlay</h3>
          <p className="text-xs text-gray-500 mb-4">Sensitivity vs 1 - Specificity across classification thresholds.</p>

          <div className="w-full h-52 bg-gray-50 border border-gray-200 rounded-xl relative p-3 flex flex-col justify-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* XGBoost (Violet) */}
              <polyline
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                points={models['XGBoost'].roc_curve.map((pt: any) => `${pt.fpr * 100},${100 - pt.tpr * 100}`).join(' ')}
              />
              {/* Logistic Regression (Indigo) */}
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                points={models['Logistic Regression'].roc_curve.map((pt: any) => `${pt.fpr * 100},${100 - pt.tpr * 100}`).join(' ')}
              />
              {/* Random Forest (Emerald) */}
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                points={models['Random Forest'].roc_curve.map((pt: any) => `${pt.fpr * 100},${100 - pt.tpr * 100}`).join(' ')}
              />
              {/* SVM (Amber) */}
              <polyline
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                points={models['Support Vector Machine'].roc_curve.map((pt: any) => `${pt.fpr * 100},${100 - pt.tpr * 100}`).join(' ')}
              />
            </svg>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-violet-700">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> XGBoost (0.868)
              </span>
              <span className="flex items-center gap-1 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> LogReg (0.866)
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> RandForest (0.860)
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> SVM (0.842)
              </span>
            </div>
          </div>
        </Card>

        {/* Multi-Model Calibration Comparison */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-1">Calibration Comparison</h3>
          <p className="text-xs text-gray-500 mb-4">Predicted risk probability vs observed proportion in 10 uniform bins.</p>

          <div className="w-full h-52 bg-gray-50 border border-gray-200 rounded-xl relative p-3 flex flex-col justify-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* XGBoost (Violet) */}
              <polyline
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                points={models['XGBoost'].calibration_curve.map((pt: any) => `${pt.mean_predicted_value * 100},${100 - pt.fraction_of_positives * 100}`).join(' ')}
              />
              {/* Logistic Regression (Indigo) */}
              <polyline
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2"
                points={models['Logistic Regression'].calibration_curve.map((pt: any) => `${pt.mean_predicted_value * 100},${100 - pt.fraction_of_positives * 100}`).join(' ')}
              />
              {/* Random Forest (Emerald) */}
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                points={models['Random Forest'].calibration_curve.map((pt: any) => `${pt.mean_predicted_value * 100},${100 - pt.fraction_of_positives * 100}`).join(' ')}
              />
              {/* SVM (Amber) */}
              <polyline
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                points={models['Support Vector Machine'].calibration_curve.map((pt: any) => `${pt.mean_predicted_value * 100},${100 - pt.fraction_of_positives * 100}`).join(' ')}
              />
            </svg>
            <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-semibold">
              <span className="flex items-center gap-1 text-violet-700">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-600" /> XGBoost (Brier: 0.1437)
              </span>
              <span className="flex items-center gap-1 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> LogReg (Brier: 0.1475)
              </span>
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> RandForest (Brier: 0.1620)
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> SVM (Brier: 0.1617)
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
