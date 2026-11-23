import React from 'react';
import { LARGE_DATASET_METRICS } from '../data/modelMetricsData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Database, ShieldCheck } from 'lucide-react';

export const LargeDatasetScreen: React.FC = () => {
  const models = LARGE_DATASET_METRICS.models;
  const sampleCounts = LARGE_DATASET_METRICS.sample_counts;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-violet-200 text-xs font-semibold mb-3">
            <Database className="w-3.5 h-3.5" />
            <span>Track A — Benchmark Training Pipeline</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Large Dataset Experiments (27,901 Records)
          </h1>
          <p className="mt-2 text-sm sm:text-base text-violet-100 leading-relaxed">
            Rigorous three-way partition experiment pipeline: 70% Training ($N = 19,530$), 15% Validation ($N = 4,185$), and 15% Untouched Holdout Test ($N = 4,186$). Preprocessing transforms are fitted strictly on the training partition to eliminate data leakage.
          </p>
        </div>
      </div>

      {/* Verified Split Counts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-gray-100 shadow-sm rounded-xl">
          <span className="text-[10px] text-gray-500 uppercase font-bold block">Total Cohort</span>
          <div className="text-2xl font-black text-gray-900 mt-1">{LARGE_DATASET_METRICS.total_records.toLocaleString()}</div>
          <span className="text-xs text-gray-500 block mt-0.5">Kaggle Student Benchmark</span>
        </Card>

        <Card className="p-4 border border-gray-100 shadow-sm rounded-xl bg-violet-50/40 border-violet-100">
          <span className="text-[10px] text-violet-700 uppercase font-bold block">1. Training Split</span>
          <div className="text-2xl font-black text-violet-950 mt-1">{sampleCounts.train.toLocaleString()}</div>
          <span className="text-xs text-violet-600 block mt-0.5">70.0% (In-Fold Preprocessed)</span>
        </Card>

        <Card className="p-4 border border-gray-100 shadow-sm rounded-xl bg-amber-50/40 border-amber-100">
          <span className="text-[10px] text-amber-700 uppercase font-bold block">2. Validation Split</span>
          <div className="text-2xl font-black text-amber-950 mt-1">{sampleCounts.val.toLocaleString()}</div>
          <span className="text-xs text-amber-600 block mt-0.5">15.0% (Model Selection Only)</span>
        </Card>

        <Card className="p-4 border border-gray-100 shadow-sm rounded-xl bg-emerald-50/40 border-emerald-100">
          <span className="text-[10px] text-emerald-700 uppercase font-bold block">3. Holdout Test Split</span>
          <div className="text-2xl font-black text-emerald-950 mt-1">{sampleCounts.test.toLocaleString()}</div>
          <span className="text-xs text-emerald-600 block mt-0.5">15.0% (Untouched Evaluation)</span>
        </Card>
      </div>

      {/* Preprocessing Architecture */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
        <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Leakage-Safe Preprocessing Pipeline Specifications</span>
        </h3>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          Standardized scikit-learn <code>ColumnTransformer</code> guarantees that imputation parameters, feature scalers, and one-hot encoders are fitted exclusively on the training partition. Unseen validation and test instances are transformed using frozen training parameters.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="font-bold text-gray-900 block font-sans text-sm mb-1">Numerical Pipeline (6 Features)</span>
            <p className="text-gray-500 font-sans mb-2">Age, CGPA, Academic Pressure, Study Satisfaction, Work/Study Hours, Financial Stress</p>
            <ul className="space-y-1 text-gray-700 list-disc list-inside">
              <li><code>SimpleImputer(strategy='median')</code></li>
              <li><code>StandardScaler()</code> (mean=0, variance=1)</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <span className="font-bold text-gray-900 block font-sans text-sm mb-1">Categorical Pipeline (4 Features &rarr; 39 Encoded)</span>
            <p className="text-gray-500 font-sans mb-2">Gender, Sleep Duration, Dietary Habits, Degree</p>
            <ul className="space-y-1 text-gray-700 list-disc list-inside">
              <li><code>SimpleImputer(strategy='most_frequent')</code></li>
              <li><code>OneHotEncoder(handle_unknown='ignore')</code></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Four Models Detailed Results Table */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
        <h3 className="text-base font-bold text-gray-900 mb-3">Model Pipeline Results Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 font-semibold text-gray-500 uppercase bg-gray-50/70">
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Val Accuracy</th>
                <th className="py-2.5 px-3">Val F1-Score</th>
                <th className="py-2.5 px-3">Val ROC-AUC</th>
                <th className="py-2.5 px-3">Test Accuracy</th>
                <th className="py-2.5 px-3">Test F1-Score</th>
                <th className="py-2.5 px-3">Test ROC-AUC</th>
                <th className="py-2.5 px-3">Test Brier Score</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {Object.entries(models).map(([name, m]: [string, any]) => (
                <tr key={name} className="hover:bg-violet-50/30">
                  <td className="py-3 px-3 font-sans font-bold text-gray-900">{name}</td>
                  <td className="py-3 px-3">{(m.validation_metrics.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 font-bold text-violet-700">{(m.validation_metrics.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3">{m.validation_metrics.roc_auc.toFixed(3)}</td>
                  <td className="py-3 px-3 font-bold text-gray-900">{(m.test_metrics.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3 font-black text-violet-900">{(m.test_metrics.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-3 px-3">{m.test_metrics.roc_auc.toFixed(3)}</td>
                  <td className="py-3 px-3 text-emerald-700">{m.test_metrics.brier_score.toFixed(4)}</td>
                  <td className="py-3 px-3 font-sans">
                    <Badge variant="emerald">Verified</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
