import React from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  BarChart2,
  ShieldCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  BrainCircuit,
  ArrowRight
} from 'lucide-react';
import { LARGE_DATASET_METRICS } from '../data/modelMetricsData';
import type { NavigationScreen } from '../storage/sessionStorage';

interface RiskInsightsScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const RiskInsightsScreen: React.FC<RiskInsightsScreenProps> = ({
  onNavigate,
  onOpenCrisis
}) => {
  const xgbImportance = LARGE_DATASET_METRICS.models['XGBoost'].feature_importance;

  const featureImpactTable = [
    {
      feature: 'Academic Pressure',
      type: 'Ordinal (1-5)',
      impact: 'High',
      direction: 'Positive Correlation (Elevated Risk)',
      description: 'Strongest single predictor in model benchmarks. Perceived exam and course friction significantly elevates stress indicators.'
    },
    {
      feature: 'Study Satisfaction',
      type: 'Ordinal (1-5)',
      impact: 'High (Protective)',
      direction: 'Negative Correlation (Protective Buffer)',
      description: 'High satisfaction with course subjects and daily progress acts as a resilient buffer against cognitive fatigue.'
    },
    {
      feature: 'Work/Study Hours',
      type: 'Continuous (Hours)',
      impact: 'Moderate',
      direction: 'Non-linear (> 9 hrs increases strain)',
      description: 'Sustained daily study exceeding 9 hours compounds mental fatigue without incremental memory retention.'
    },
    {
      feature: 'Financial Stress',
      type: 'Ordinal (1-5)',
      impact: 'Moderate',
      direction: 'Positive Correlation (Elevated Risk)',
      description: 'Living costs, tuition, and resource availability compound perceived academic difficulty.'
    },
    {
      feature: 'Sleep Duration',
      type: 'Categorical',
      impact: 'High (Protective)',
      direction: 'Non-linear (< 5 hrs highest risk)',
      description: 'Chronic sleep deprivation below 6 hours severely impedes emotional regulation and executive focus.'
    },
    {
      feature: 'Current CGPA',
      type: 'Continuous (0-10)',
      impact: 'Low',
      direction: 'Mild Negative Correlation',
      description: 'Grade point attainment is moderately protective when academic pacing is maintained in healthy bounds.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-indigo-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<BrainCircuit className="w-3.5 h-3.5" />}>
              Explainable AI (XAI)
            </Badge>
            <Badge variant="slate">Transparent Factors</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Risk Factor Insights & Explainability
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Understand how lifestyle factors, study hours, and sleep routines influence risk classifications in our machine learning platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('recommendations')}
            icon={<ArrowRight className="w-3.5 h-3.5 text-violet-600" />}
          >
            View Recommendations
          </Button>
        </div>
      </div>

      {/* Non-Diagnostic Warning Banner */}
      <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-amber-900 shadow-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold block text-amber-950">
            Educational Observational Aid — Not a Clinical Diagnosis
          </span>
          These insights explain statistical weights from research models trained on collegiate student cohorts. They highlight potential areas of lifestyle friction and should never be construed as medical diagnosis or psychotherapy advice.
        </div>
      </div>

      {/* Primary Contributing Factors Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="p-6 border-l-4 border-l-rose-500">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Top Elevating Factor
          </div>
          <h3 className="text-lg font-extrabold text-mindora-darkText">
            Academic Pressure
          </h3>
          <p className="text-xs text-mindora-mutedText mt-2 leading-relaxed">
            Perceived study overload contributes over <strong>28%</strong> of the variance in benchmark models. High continuous pressure correlates strongly with cognitive exhaustion.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-mindora-mutedText">Recommended action:</span>
            <button
              onClick={() => onNavigate('wellness_studio')}
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              Focus & Break Timer →
            </button>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            Top Protective Factor
          </div>
          <h3 className="text-lg font-extrabold text-mindora-darkText">
            Study Satisfaction
          </h3>
          <p className="text-xs text-mindora-mutedText mt-2 leading-relaxed">
            Students satisfied with their learning pace experience a <strong>32% reduction</strong> in elevated stress states. Enjoying course materials buffers against fatigue.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-mindora-mutedText">Recommended action:</span>
            <button
              onClick={() => onNavigate('goals')}
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              Set Micro-Goals →
            </button>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-indigo-500">
          <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Restorative Anchor
          </div>
          <h3 className="text-lg font-extrabold text-mindora-darkText">
            Sleep Hygiene
          </h3>
          <p className="text-xs text-mindora-mutedText mt-2 leading-relaxed">
            Sleeping 7 to 8 hours daily serves as the critical biological stabilizer. Sub-5 hour sleep patterns dramatically amplify negative reactions to academic stress.
          </p>
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-mindora-mutedText">Recommended action:</span>
            <button
              onClick={() => onNavigate('daily_checkin')}
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              Log Sleep Quality →
            </button>
          </div>
        </Card>
      </div>

      {/* Feature Importance Bar Chart */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-mindora-darkText flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-violet-600" />
              Machine Learning Feature Importance (XGBoost 27.9k Baseline)
            </h2>
            <p className="text-xs text-mindora-mutedText mt-0.5">
              Normalized relative feature contributions calculated across the independent test partition.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(xgbImportance)
            .sort(([, a], [, b]) => b - a)
            .map(([feature, weight]) => {
              const percentage = Math.round(weight * 100);
              return (
                <div key={feature} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-mindora-darkText">{feature}</span>
                    <span className="font-mono text-mindora-mutedText">{percentage}% relative weight</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage * 3.5}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Detailed Factor Breakdown Table */}
      <Card className="p-6 sm:p-8 overflow-hidden">
        <h2 className="text-lg font-bold text-mindora-darkText mb-4">
          Student Risk & Protective Factor Analysis
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                <th className="pb-3 font-bold">Factor</th>
                <th className="pb-3 font-bold">Metric Type</th>
                <th className="pb-3 font-bold">Model Impact</th>
                <th className="pb-3 font-bold">Scientific Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {featureImpactTable.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 font-bold text-mindora-darkText">{row.feature}</td>
                  <td className="py-3.5 text-mindora-mutedText">{row.type}</td>
                  <td className="py-3.5">
                    <span className="font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                      {row.impact}
                    </span>
                  </td>
                  <td className="py-3.5 text-mindora-mutedText max-w-md">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer Support Prompt */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-mindora-mutedText">
          Feeling overwhelmed by academic deadlines? Free confidential student counselors are available 24/7.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCrisis}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0"
        >
          Access Helplines
        </Button>
      </div>
    </div>
  );
};
