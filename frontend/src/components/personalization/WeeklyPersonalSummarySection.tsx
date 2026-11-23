import React from 'react';
import {
  FileText,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { Card } from '../common/Card';
import { computeWeeklyPersonalSummary } from '../../engines/personalSummaryEngine';
import { plannerStorage } from '../../storage/vault/plannerStorage';
import { wellnessStore } from '../../engines/wellnessEngine';
import { personalizationStorage } from '../../storage/personalizationStorage';

interface WeeklyPersonalSummarySectionProps {
  onRefresh?: () => void;
}

export const WeeklyPersonalSummarySection: React.FC<WeeklyPersonalSummarySectionProps> = ({ onRefresh }) => {
  const currentWeekId = `Week of ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const plannerHistory = plannerStorage.getCompletedHistory();
  const wellnessHistory = wellnessStore.getCompletedSessions();
  const checkInHistory = personalizationStorage.getCheckInHistory();
  const goals = personalizationStorage.getState().goals;

  const summary = computeWeeklyPersonalSummary({
    weekIdentifier: currentWeekId,
    completedPlannerActions: plannerHistory,
    completedWellnessSessions: wellnessHistory,
    dailyCheckIns: checkInHistory,
    goals
  });

  const handleClear = () => {
    if (window.confirm('Clear your in-memory weekly summary records? (Your saved goals and layout preferences will remain intact.)')) {
      plannerStorage.clearAllData();
      wellnessStore.clearSessionHistory();
      if (onRefresh) onRefresh();
    }
  };

  return (
    <Card className="p-5 sm:p-6 lg:p-7 border border-mindora-border/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Personalized Weekly Summary
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {summary.weekIdentifier}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Factual recap of voluntary collegiate activities and self-chosen goals. Free from diagnostic interpretations.
          </p>
        </div>

        {summary.hasActivity && (
          <button
            onClick={handleClear}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Clear Session Summary</span>
          </button>
        )}
      </div>

      {/* Factual Metrics 4-Col Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Planner Actions
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {summary.plannerActionsCompleted}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Completed micro-steps</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Restorative Sessions
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {summary.wellnessSessionsCompleted}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {summary.focusMinutesTotal} total active mins
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Daily Check-Ins
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {summary.checkInsCompletedCount}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">Logged reflections</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Active Goals
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {summary.activeGoalsCount}
          </span>
          <span className="text-[11px] text-slate-500 block mt-0.5">
            {summary.completedGoalsCount} completed
          </span>
        </div>
      </div>

      {/* Factual Observations */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
            Factual Summary Observations
          </span>
        </div>
        <ul className="text-xs text-indigo-900 space-y-1.5 pl-1">
          {summary.factualObservations.map((obs, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-indigo-400 font-bold shrink-0">•</span>
              <span>{obs}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Honest Non-Diagnostic Disclaimer */}
      <div className="text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" aria-hidden="true" />
        <span>
          <strong>Data Transparency Note:</strong> This summary reflects voluntary activities recorded in local browser memory during your active study sessions. It does not measure clinical psychological improvement, diagnose depression, or substitute for licensed clinical guidance.
        </span>
      </div>
    </Card>
  );
};
