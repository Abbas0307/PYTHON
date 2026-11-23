import React from 'react';
import { LARGE_DATASET_METRICS } from '../data/modelMetricsData';
import { Card } from '../components/common/Card';
import { Sparkles, BarChart2 } from 'lucide-react';

export const ExplainabilityScreen: React.FC = () => {
  const xgbImportance = LARGE_DATASET_METRICS.models['XGBoost'].feature_importance;
  const rfImportance = LARGE_DATASET_METRICS.models['Random Forest'].feature_importance;

  const featureImpactTable = [
    {
      feature: 'Academic Pressure',
      type: 'Ordinal (1-5)',
      direction: 'Positive Correlation (Elevated Risk)',
      description: 'Strongest single predictor. High perceived study friction strongly elevates model output probability.'
    },
    {
      feature: 'Study Satisfaction',
      type: 'Ordinal (1-5)',
      direction: 'Negative Correlation (Protective Factor)',
      description: 'Higher satisfaction with courses and academic progress serves as a significant protective buffer.'
    },
    {
      feature: 'Work/Study Hours',
      type: 'Continuous (Hours)',
      direction: 'Non-linear (Excessive > 9 hrs increases risk)',
      description: 'Sustained daily commitment exceeding 9-10 hours correlates with elevated exhaustion and cognitive fatigue.'
    },
    {
      feature: 'Financial Stress',
      type: 'Ordinal (1-5)',
      direction: 'Positive Correlation (Elevated Risk)',
      description: 'Living cost, tuition, and resource constraints compound daily academic friction.'
    },
    {
      feature: 'Sleep Duration',
      type: 'Categorical',
      direction: 'Non-linear (< 5 hours highest risk)',
      description: 'Chronic sleep restriction severely amplifies cognitive strain across collegiate cohorts.'
    },
    {
      feature: 'Current CGPA',
      type: 'Continuous (0-10)',
      direction: 'Mild Negative Correlation',
      description: 'Academic attainment correlates modestly with student equilibrium when pressure is normalized.'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-violet-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explainable AI &amp; Feature Attribution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Model Explainability &amp; Feature Dynamics
          </h1>
          <p className="mt-2 text-sm sm:text-base text-violet-100 leading-relaxed">
            Transparent attribution analysis explaining how collegiate lifestyle factors, study burdens, and sleep routines influence risk estimations across tree ensembles and linear baselines.
          </p>
        </div>
      </div>

      {/* Feature Attribution Drivers Table */}
      <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
        <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-violet-600" />
          <span>Core Feature Drivers &amp; Directional Impacts</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Synthesized from Gradient Boosted tree gains, Random Forest MDI, and standardized logistic coefficients.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 font-semibold text-gray-500 uppercase bg-gray-50/70">
                <th className="py-2.5 px-3">Predictor Feature</th>
                <th className="py-2.5 px-3">Measurement Scale</th>
                <th className="py-2.5 px-3">Directional Attribution</th>
                <th className="py-2.5 px-3">Collegiate Context &amp; Behavioral Meaning</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {featureImpactTable.map((row) => (
                <tr key={row.feature} className="hover:bg-violet-50/20">
                  <td className="py-3 px-3 font-bold text-gray-900 font-mono">{row.feature}</td>
                  <td className="py-3 px-3 text-gray-500">{row.type}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.direction.includes('Elevated')
                          ? 'bg-rose-100 text-rose-800'
                          : row.direction.includes('Protective')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.direction}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-600 leading-relaxed max-w-md">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Side-by-Side Tree Ensemble Feature Weights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-1">XGBoost Gain Attribution</h3>
          <p className="text-xs text-gray-500 mb-4">Top 8 splits ranked by mean objective improvement (Gain).</p>
          <div className="space-y-2">
            {Object.entries(xgbImportance).slice(0, 8).map(([feat, val]: [string, any]) => {
              const numVal = Math.abs(Number(val));
              const pct = Math.min(100, Math.round(numVal * 250));
              return (
                <div key={feat} className="text-xs">
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-gray-700 truncate max-w-[240px]">{feat}</span>
                    <span className="font-bold text-violet-700">{Number(val).toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-violet-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
          <h3 className="text-base font-bold text-gray-900 mb-1">Random Forest Impurity Reduction (MDI)</h3>
          <p className="text-xs text-gray-500 mb-4">Top 8 features ranked by total Gini impurity reduction.</p>
          <div className="space-y-2">
            {Object.entries(rfImportance).slice(0, 8).map(([feat, val]: [string, any]) => {
              const numVal = Math.abs(Number(val));
              const pct = Math.min(100, Math.round(numVal * 250));
              return (
                <div key={feat} className="text-xs">
                  <div className="flex justify-between font-mono mb-1">
                    <span className="text-gray-700 truncate max-w-[240px]">{feat}</span>
                    <span className="font-bold text-indigo-700">{Number(val).toFixed(4)}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};
