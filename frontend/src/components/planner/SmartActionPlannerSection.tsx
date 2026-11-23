import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Sliders,
  Download,
  Calendar,
  Layers,
  Award,
  AlertCircle,
  ShieldAlert,
  X
} from 'lucide-react';
import type {
  DailyPlanItem,
  DailyPlanState,
  DailyProgressSummary,
  StudentGoalId,
  WeeklyPlannerSummary
} from '../../contracts/plannerContract.ts';
import { STUDENT_GOALS } from '../../contracts/plannerContract.ts';
import { plannerStorage } from '../../storage/vault/plannerStorage.ts';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { ActionCard } from './ActionCard';
import { ActionInstructionsModal } from './ActionInstructionsModal';
import { GoalsModal } from './GoalsModal';

interface SmartActionPlannerSectionProps {
  isPreviewMode?: boolean;
}

export const SmartActionPlannerSection: React.FC<SmartActionPlannerSectionProps> = ({
  isPreviewMode = false
}) => {
  const [planState, setPlanState] = useState<DailyPlanState>(() => plannerStorage.getPlan());
  const [progress, setProgress] = useState<DailyProgressSummary>(() => plannerStorage.getProgress());
  const [weeklySummary, setWeeklySummary] = useState<WeeklyPlannerSummary>(() =>
    plannerStorage.getWeeklySummary()
  );

  const [selectedInstructionItem, setSelectedInstructionItem] = useState<DailyPlanItem | null>(null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Sync state after mutations
  const refreshState = () => {
    const updatedPlan = plannerStorage.getPlan();
    setPlanState(updatedPlan);
    setProgress(plannerStorage.getProgress());
    setWeeklySummary(plannerStorage.getWeeklySummary());
  };

  useEffect(() => {
    refreshState();
  }, []);

  useEffect(() => {
    if (!isExportModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportModalOpen(false);
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExportModalOpen]);

  const handleMarkComplete = (actionId: string) => {
    plannerStorage.updateActionStatus(actionId, 'completed');
    refreshState();
  };

  const handleSkip = (actionId: string) => {
    plannerStorage.updateActionStatus(actionId, 'skipped');
    refreshState();
  };

  const handlePostpone = (actionId: string) => {
    plannerStorage.updateActionStatus(actionId, 'postponed');
    refreshState();
  };

  const handleUndoStatus = (actionId: string) => {
    plannerStorage.updateActionStatus(actionId, 'pending');
    refreshState();
  };

  const handleDismiss = (actionId: string) => {
    plannerStorage.dismissAction(actionId);
    refreshState();
  };

  const handleSaveGoals = (goals: StudentGoalId[]) => {
    plannerStorage.setGoals(goals);
    refreshState();
  };

  const handleChangeDailyCount = (count: number) => {
    plannerStorage.setPreferredDailyCount(count);
    refreshState();
  };

  const handleTogglePersonalization = (enabled: boolean) => {
    plannerStorage.setPersonalizationEnabled(enabled);
    refreshState();
  };

  const handleResetPlan = () => {
    plannerStorage.resetPlan();
    refreshState();
  };

  const handleConfirmExport = () => {
    setIsExportModalOpen(false);
    const { filename, content, mimeType } = plannerStorage.exportData();
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('Action plan exported as plain-text JSON successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="space-y-6 pt-2">
      {/* Main Section Header Card */}
      <div className="bg-gradient-to-r from-violet-50/70 via-white to-purple-50/50 p-5 sm:p-6 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Smart Action Planner
            </Badge>
            <Badge variant="slate">Educational Productivity</Badge>
            <Badge variant="emerald">In-Memory Privacy</Badge>
            {isPreviewMode && <Badge variant="amber">Preview Mode</Badge>}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
            Daily Habits & Guided Micro-Steps
          </h2>
          <p className="text-xs sm:text-sm text-mindora-mutedText max-w-2xl leading-relaxed">
            Build sustainable collegiate study routines through small, bite-sized actions. Tailored to your pace with zero clinical scoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsGoalsModalOpen(true)}
            icon={<Sliders className="w-3.5 h-3.5" />}
            aria-label="Customize Goals and Planner Preferences"
          >
            Goals & Pace
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExportModalOpen(true)}
            icon={<Download className="w-3.5 h-3.5" />}
            aria-label="Export Action Plan as JSON"
          >
            Export Plan
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {exportNotice}
        </div>
      )}

      {/* Active Focus Goals Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1">
          Active Focus:
        </span>
        {planState.selectedGoals.map((goalId) => {
          const def = STUDENT_GOALS.find((g) => g.id === goalId);
          if (!def) return null;
          return (
            <span
              key={goalId}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-100/70 text-mindora-primary rounded-full font-bold text-xs"
            >
              <span>🎯</span>
              <span>{def.label}</span>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => setIsGoalsModalOpen(true)}
          className="text-xs font-semibold text-mindora-primary hover:underline ml-1"
        >
          Edit Goals
        </button>
      </div>

      {/* Daily Progress Cards Grid (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Progress Card 1: Completed / Total */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-mindora-mutedText">
            <span className="font-bold uppercase tracking-wider">Today's Progress</span>
            <CheckCircle2 className="w-4 h-4 text-mindora-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-mindora-darkText">
              {progress.completedCount}
            </span>
            <span className="text-sm font-bold text-mindora-mutedText">
              of {progress.totalRecommended} completed ({progress.completionPercentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.completionPercentage}%` }}
              role="progressbar"
              aria-valuenow={progress.completionPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Daily Actions Completion Rate"
            />
          </div>
        </Card>

        {/* Progress Card 2: Estimated Time Commitment */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-mindora-mutedText">
            <span className="font-bold uppercase tracking-wider">Estimated Time</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-900">
              {progress.totalEstimatedMinutes}
            </span>
            <span className="text-sm font-bold text-mindora-mutedText">
              minutes total ({progress.completedMinutes}m invested)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Bite-sized micro-steps designed to easily fit around lectures and study blocks.
          </p>
        </Card>

        {/* Progress Card 3: Remaining Balance */}
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-mindora-mutedText">
            <span className="font-bold uppercase tracking-wider">Remaining Actions</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900">
              {progress.remainingCount}
            </span>
            <span className="text-sm font-bold text-mindora-mutedText">
              pending actions for today
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            {progress.remainingCount === 0
              ? 'All suggested actions for today are complete!'
              : 'Complete or skip at your own comfortable pace.'}
          </p>
        </Card>
      </div>

      {/* Educational Non-Diagnostic Notice */}
      <div className="px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 flex items-center justify-between gap-3">
        <span className="leading-snug">
          💡 <strong>Self-Paced Habit Guidance:</strong> Completion percentages represent daily task tracking and do not indicate a medical or clinical assessment.
        </span>
        <span className="text-slate-400 shrink-0 font-medium hidden sm:inline">
          {planState.preferredDailyCount} actions/day target
        </span>
      </div>

      {/* Action Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-mindora-darkText flex items-center gap-2">
            <Calendar className="w-4 h-4 text-mindora-primary" />
            Today's Recommended Plan ({planState.items.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetPlan}
            className="text-xs text-slate-500"
          >
            Regenerate Plan
          </Button>
        </div>

        {planState.items.length === 0 ? (
          <Card className="p-8 text-center space-y-3 bg-slate-50/70 border-dashed border-2 border-slate-200">
            <div className="w-12 h-12 rounded-full bg-violet-100 text-mindora-primary flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base text-mindora-darkText">
              All Actions Completed or Dismissed
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You have completed or cleared all recommended actions for today. You can regenerate fresh actions or customize your focus goals anytime.
            </p>
            <Button variant="primary" size="sm" onClick={handleResetPlan}>
              Regenerate Plan
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {planState.items.map((item) => (
              <ActionCard
                key={item.actionId}
                item={item}
                onViewInstructions={(itm) => setSelectedInstructionItem(itm)}
                onMarkComplete={handleMarkComplete}
                onSkip={handleSkip}
                onPostpone={handlePostpone}
                onDismiss={handleDismiss}
                onUndoStatus={handleUndoStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Summary & Consistency Reflection Card */}
      <Card className="p-5 sm:p-6 bg-gradient-to-r from-slate-50 via-white to-violet-50/30 border border-mindora-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-mindora-primary" />
            <div>
              <h4 className="font-bold text-sm text-mindora-darkText">
                Weekly Reflection ({weeklySummary.weekIdentifier})
              </h4>
              <p className="text-[11px] text-mindora-mutedText">
                Longitudinal summary of completed routine actions
              </p>
            </div>
          </div>
          <Badge variant="violet" className="self-start sm:self-auto">
            {weeklySummary.weeklyConsistency}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Total Completed
            </span>
            <span className="text-xl font-black text-mindora-primary">
              {weeklySummary.totalActionsCompleted}
            </span>
            <span className="text-[11px] text-slate-500 block">actions finished this week</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Top Category
            </span>
            <span className="text-sm font-bold text-slate-800 block truncate">
              {weeklySummary.mostFrequentCategory}
            </span>
            <span className="text-[11px] text-slate-500 block">most active routine dimension</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-1 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Category Distribution
            </span>
            <div className="text-[11px] text-slate-600 space-y-0.5 truncate">
              {Object.entries(weeklySummary.categoryBreakdown)
                .filter(([_, count]) => count > 0)
                .map(([cat, count]) => (
                  <span key={cat} className="inline-block mr-2 font-medium">
                    {cat}: <strong>{count}</strong>
                  </span>
                ))}
              {weeklySummary.totalActionsCompleted === 0 && (
                <span className="italic text-slate-400">No actions logged yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-3 bg-violet-50/70 border border-violet-200/60 rounded-xl text-xs text-violet-950 font-medium leading-relaxed">
          💬 {weeklySummary.friendlyReflection}
        </div>
      </Card>

      {/* Action Instructions Modal */}
      <ActionInstructionsModal
        isOpen={selectedInstructionItem !== null}
        action={selectedInstructionItem?.action || null}
        isCompleted={selectedInstructionItem?.status === 'completed'}
        onClose={() => setSelectedInstructionItem(null)}
        onToggleComplete={() => {
          if (selectedInstructionItem) {
            if (selectedInstructionItem.status === 'completed') {
              handleUndoStatus(selectedInstructionItem.actionId);
            } else {
              handleMarkComplete(selectedInstructionItem.actionId);
            }
          }
        }}
      />

      {/* Goals & Preferences Modal */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        selectedGoals={planState.selectedGoals}
        preferredDailyCount={planState.preferredDailyCount}
        personalizationEnabled={planState.personalizationEnabled}
        onClose={() => setIsGoalsModalOpen(false)}
        onSaveGoals={handleSaveGoals}
        onChangeDailyCount={handleChangeDailyCount}
        onTogglePersonalization={handleTogglePersonalization}
        onResetPlan={handleResetPlan}
      />

      {/* Plaintext Export Disclosure Modal */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-export-title"
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-mindora-border overflow-hidden flex flex-col">
            <div className="p-5 sm:p-6 border-b border-mindora-border flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="amber" icon={<AlertCircle className="w-3 h-3" />}>
                    Plaintext Export Disclosure
                  </Badge>
                </div>
                <h3 id="modal-export-title" className="text-base sm:text-lg font-bold text-mindora-darkText">
                  Export Action Plan & History
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Close export modal"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                You are about to download a snapshot of your daily action plan and completed history.
              </p>
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 text-amber-950">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  Unencrypted JSON Format Notice
                </div>
                <p className="text-[11px] leading-relaxed">
                  The downloaded file is standard, <strong>unencrypted plain-text JSON</strong>. It is not protected by your encrypted vault passphrase. Please save it to a private folder on your trusted personal device and avoid storing it on shared public computers.
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-mindora-border bg-slate-50/50 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExportModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmExport}
                icon={<Download className="w-3.5 h-3.5" />}
              >
                Confirm & Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
