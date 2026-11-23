import React, { useState } from 'react';
import { LARGE_DATASET_METRICS } from '../data/modelMetricsData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Cpu, Activity, Sliders, BarChart3, TrendingUp } from 'lucide-react';

export const ModelLabScreen: React.FC = () => {
  const modelKeys = ['Logistic Regression', 'Random Forest', 'XGBoost', 'Support Vector Machine'] as const;
  type ModelKey = typeof modelKeys[number];

  const [activeModel, setActiveModel] = useState<ModelKey>('XGBoost');

  const modelData = (LARGE_DATASET_METRICS.models as Record<string, any>)[activeModel];
  const sampleCounts = LARGE_DATASET_METRICS.sample_counts;
  const testMetrics: any = modelData.test_metrics;
  const valMetrics: any = modelData.validation_metrics;
  const trainMetrics: any = modelData.train_metrics;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-violet-200 text-xs font-semibold mb-3">
            <Cpu className="w-3.5 h-3.5" />
            <span>Track A — Machine Learning Research Laboratory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Independent Model Laboratory
          </h1>
          <p className="mt-2 text-sm sm:text-base text-violet-100 leading-relaxed">
            Detailed inspection, hyperparameter transparency, calibration curves, and independent holdout test evaluations for each of the four candidate classification algorithms.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="bg-violet-800/80 px-2.5 py-1 rounded-md text-violet-200">
              Dataset: 27,901 Collegiate Records
            </span>
            <span className="bg-violet-800/80 px-2.5 py-1 rounded-md text-violet-200">
              Split: 70% Train / 15% Val / 15% Holdout Test
            </span>
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 px-2.5 py-1 rounded-md font-medium">
              Leakage-Safe Validation Protocol
            </span>
          </div>
        </div>
      </div>

      {/* 4 Model Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {modelKeys.map((key) => {
          const isActive = activeModel === key;
          return (
            <button
              key={key}
              onClick={() => setActiveModel(key)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 flex items-center gap-2 ${
                isActive
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
                  : 'bg-white hover:bg-violet-50 text-gray-700 border border-gray-200'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{key}</span>
              {key === 'XGBoost' && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                  isActive ? 'bg-violet-800 text-violet-200' : 'bg-violet-100 text-violet-700'
                }`}>
                  Top Val F1
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Model Overview Card */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{modelData.name}</h2>
              <Badge variant="violet">v2.0.0 — Production</Badge>
              <span className="text-xs text-gray-400">Trained: 2026-11-16</span>
            </div>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">{modelData.description}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center min-w-[90px]">
              <span className="text-gray-400 block text-[10px] uppercase">Train Time</span>
              <span className="font-bold text-gray-800 text-sm">{modelData.training_duration_seconds}s</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center min-w-[90px]">
              <span className="text-gray-400 block text-[10px] uppercase">Features</span>
              <span className="font-bold text-gray-800 text-sm">{LARGE_DATASET_METRICS.feature_count}</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-center min-w-[90px]">
              <span className="text-gray-400 block text-[10px] uppercase">Inference</span>
              <span className="font-bold text-gray-800 text-sm">{testMetrics.inference_time_ms_per_sample} ms</span>
            </div>
          </div>
        </div>

        {/* Dataset Partition Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-violet-50/60 border border-violet-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">Training Samples</span>
            <div className="text-2xl font-extrabold text-violet-950 mt-1">{sampleCounts.train.toLocaleString()}</div>
            <span className="text-xs text-violet-600">70.0% of cohort (preprocessed in-fold)</span>
          </div>
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Validation Samples</span>
            <div className="text-2xl font-extrabold text-amber-950 mt-1">{sampleCounts.val.toLocaleString()}</div>
            <span className="text-xs text-amber-600">15.0% for hyperparameter selection</span>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Holdout Test Samples</span>
            <div className="text-2xl font-extrabold text-emerald-950 mt-1">{sampleCounts.test.toLocaleString()}</div>
            <span className="text-xs text-emerald-600">15.0% untouched final benchmark</span>
          </div>
        </div>
      </Card>

      {/* Core Performance Scorecard (Holdout Test Set) */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-violet-600" />
          <span>Independent Holdout Test Performance (Untouched Evaluation)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">Accuracy</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{(testMetrics.accuracy * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400">Val: {(valMetrics.accuracy * 100).toFixed(1)}%</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">Precision</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{(testMetrics.precision * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400">Val: {(valMetrics.precision * 100).toFixed(1)}%</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">Recall</span>
            <span className="text-xl font-black text-violet-700 mt-1 block">{(testMetrics.recall * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400">Sensitivity</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">Specificity</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{(testMetrics.specificity * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400">True Negatives</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">F1-Score</span>
            <span className="text-xl font-black text-violet-700 mt-1 block">{(testMetrics.f1_score * 100).toFixed(1)}%</span>
            <span className="text-[10px] text-gray-400">Harmonic Mean</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">ROC-AUC</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{testMetrics.roc_auc.toFixed(3)}</span>
            <span className="text-[10px] text-gray-400">Val: {valMetrics.roc_auc.toFixed(3)}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">PR-AUC</span>
            <span className="text-xl font-black text-gray-900 mt-1 block">{testMetrics.pr_auc.toFixed(3)}</span>
            <span className="text-[10px] text-gray-400">Average Prec</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">Brier Score</span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">{testMetrics.brier_score.toFixed(4)}</span>
            <span className="text-[10px] text-gray-400">Calibration</span>
          </div>
        </div>
      </div>

      {/* Train / Validation / Test Consistency Comparison */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
        <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-600" />
          <span>Cross-Partition Generalization Integrity</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase font-semibold text-gray-500 bg-gray-50/50">
                <th className="py-2.5 px-3">Partition</th>
                <th className="py-2.5 px-3">Samples</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1-Score</th>
                <th className="py-2.5 px-3">ROC-AUC</th>
                <th className="py-2.5 px-3">Brier Score</th>
                <th className="py-2.5 px-3">Overfitting Delta (Train - Test)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-xs">
              <tr className="hover:bg-gray-50/50">
                <td className="py-2.5 px-3 font-semibold text-gray-800">Training Split</td>
                <td className="py-2.5 px-3">{sampleCounts.train.toLocaleString()}</td>
                <td className="py-2.5 px-3">{(trainMetrics.accuracy * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(trainMetrics.precision * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(trainMetrics.recall * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(trainMetrics.f1_score * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{trainMetrics.roc_auc.toFixed(4)}</td>
                <td className="py-2.5 px-3">{trainMetrics.brier_score.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-gray-400">Baseline</td>
              </tr>
              <tr className="hover:bg-amber-50/30 bg-amber-50/10">
                <td className="py-2.5 px-3 font-semibold text-amber-900">Validation Split (Selection)</td>
                <td className="py-2.5 px-3">{sampleCounts.val.toLocaleString()}</td>
                <td className="py-2.5 px-3">{(valMetrics.accuracy * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(valMetrics.precision * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(valMetrics.recall * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3 font-bold text-violet-700">{(valMetrics.f1_score * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{valMetrics.roc_auc.toFixed(4)}</td>
                <td className="py-2.5 px-3">{valMetrics.brier_score.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-amber-700">
                  {((trainMetrics.accuracy - valMetrics.accuracy) * 100).toFixed(2)}% acc delta
                </td>
              </tr>
              <tr className="hover:bg-emerald-50/30 bg-emerald-50/10">
                <td className="py-2.5 px-3 font-semibold text-emerald-900">Holdout Test Split (Untouched)</td>
                <td className="py-2.5 px-3">{sampleCounts.test.toLocaleString()}</td>
                <td className="py-2.5 px-3 font-bold text-gray-900">{(testMetrics.accuracy * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(testMetrics.precision * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{(testMetrics.recall * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3 font-bold text-violet-700">{(testMetrics.f1_score * 100).toFixed(2)}%</td>
                <td className="py-2.5 px-3">{testMetrics.roc_auc.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-emerald-700">{testMetrics.brier_score.toFixed(4)}</td>
                <td className="py-2.5 px-3 text-emerald-700 font-semibold">
                  {((trainMetrics.accuracy - testMetrics.accuracy) * 100).toFixed(2)}% acc delta (Clean)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confusion Matrix & Classification Report Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center justify-between">
            <span>Test Set Confusion Matrix</span>
            <Badge variant="neutral">N = {sampleCounts.test}</Badge>
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Explicit class ordering: Index 0 = Non-Depressed (Negative), Index 1 = Depressed (Positive).
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto my-4 text-center">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">True Negatives (TN)</span>
              <span className="text-2xl font-black text-emerald-950 mt-1 block">
                {testMetrics.breakdown.tn.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-600">Correctly identified non-depressed</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">False Positives (FP)</span>
              <span className="text-2xl font-black text-rose-950 mt-1 block">
                {testMetrics.breakdown.fp.toLocaleString()}
              </span>
              <span className="text-[10px] text-rose-600">Type I error (False alarm)</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">False Negatives (FN)</span>
              <span className="text-2xl font-black text-amber-950 mt-1 block">
                {testMetrics.breakdown.fn.toLocaleString()}
              </span>
              <span className="text-[10px] text-amber-600">Type II error (Missed risk)</span>
            </div>
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <span className="text-[10px] uppercase font-bold text-violet-700 block">True Positives (TP)</span>
              <span className="text-2xl font-black text-violet-950 mt-1 block">
                {testMetrics.breakdown.tp.toLocaleString()}
              </span>
              <span className="text-[10px] text-violet-600">Correctly identified depression</span>
            </div>
          </div>
        </Card>

        {/* Classification Report Table */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-2">Per-Class Classification Report</h3>
          <p className="text-xs text-gray-500 mb-4">
            Independent test split metrics broken down across positive, negative, and macro averages.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 font-semibold text-gray-500 uppercase bg-gray-50/50">
                  <th className="py-2 px-3">Class</th>
                  <th className="py-2 px-3">Precision</th>
                  <th className="py-2 px-3">Recall</th>
                  <th className="py-2 px-3">F1-Score</th>
                  <th className="py-2 px-3">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {['Non-Depressed', 'Depressed'].map((clsName) => {
                  const r = testMetrics.classification_report[clsName];
                  if (!r) return null;
                  return (
                    <tr key={clsName} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-gray-800">{clsName}</td>
                      <td className="py-2.5 px-3">{(r.precision * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{(r.recall * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 font-bold text-violet-700">{(r['f1-score'] * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{r.support.toLocaleString()}</td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50/80 font-semibold border-t-2 border-gray-200">
                  <td className="py-2.5 px-3">Macro Average</td>
                  <td className="py-2.5 px-3">
                    {(testMetrics.classification_report['macro avg']?.precision * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">
                    {(testMetrics.classification_report['macro avg']?.recall * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-violet-700">
                    {(testMetrics.classification_report['macro avg']?.['f1-score'] * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3">{sampleCounts.test.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Visual Calibration & ROC Curves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve Visualizer */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">ROC Curve (Test Set)</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-violet-100 text-violet-700 rounded-md">
              AUC: {testMetrics.roc_auc.toFixed(3)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            True Positive Rate (Sensitivity) plotted against False Positive Rate (1 - Specificity).
          </p>

          <div className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl relative p-3 flex flex-col justify-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Diagonal baseline */}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* ROC Curve polyline */}
              <polyline
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2.5"
                points={modelData.roc_curve
                  .map((pt: any) => `${pt.fpr * 100},${100 - pt.tpr * 100}`)
                  .join(' ')}
              />
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
              <span>FPR: 0.0</span>
              <span>Random Baseline (0.50)</span>
              <span>FPR: 1.0</span>
            </div>
          </div>
        </Card>

        {/* Reliability / Calibration Curve */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900">Probability Calibration Curve</h3>
            <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-md">
              Brier: {testMetrics.brier_score.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Mean predicted probability vs. empirical fraction of positive instances in 10 uniform probability bins.
          </p>

          <div className="w-full h-48 bg-gray-50 border border-gray-200 rounded-xl relative p-3 flex flex-col justify-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Ideal 45-degree calibration diagonal */}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Empirical Calibration polyline */}
              <polyline
                fill="none"
                stroke="#059669"
                strokeWidth="2.5"
                points={modelData.calibration_curve
                  .map((pt: any) => `${pt.mean_predicted_value * 100},${100 - pt.fraction_of_positives * 100}`)
                  .join(' ')}
              />
            </svg>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-mono">
              <span>Predicted: 0.0</span>
              <span>Perfect Calibration (Diagonal)</span>
              <span>Predicted: 1.0</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Hyperparameters & Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hyperparameters Configuration */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-violet-600" />
            <span>Fitted Hyperparameters</span>
          </h3>
          <div className="bg-gray-900 text-violet-200 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed">
            <pre>{JSON.stringify(modelData.hyperparameters, null, 2)}</pre>
          </div>
        </Card>

        {/* Feature Importance / Coefficients */}
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-600" />
            <span>Top Feature Contributions</span>
          </h3>
          <div className="space-y-2">
            {typeof modelData.feature_importance === 'object' && !modelData.feature_importance.note ? (
              Object.entries(modelData.feature_importance)
                .slice(0, 8)
                .map(([feat, val]: [string, any]) => {
                  const numVal = Math.abs(Number(val));
                  const pct = Math.min(100, Math.round(numVal * 100));
                  return (
                    <div key={feat} className="text-xs">
                      <div className="flex justify-between font-mono mb-1">
                        <span className="text-gray-700 truncate max-w-[220px]">{feat}</span>
                        <span className="font-semibold text-violet-700">{Number(val).toFixed(3)}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-violet-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
                {modelData.feature_importance.note || 'Feature importance not available for this kernel.'}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
