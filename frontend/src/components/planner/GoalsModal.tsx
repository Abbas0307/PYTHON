import React, { useEffect, useState } from 'react';
import { X, Check, Sliders, Target, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { StudentGoalId } from '../../contracts/plannerContract.ts';
import { STUDENT_GOALS } from '../../contracts/plannerContract.ts';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface GoalsModalProps {
  isOpen: boolean;
  selectedGoals: StudentGoalId[];
  preferredDailyCount: number;
  personalizationEnabled: boolean;
  onClose: () => void;
  onSaveGoals: (goals: StudentGoalId[]) => void;
  onChangeDailyCount: (count: number) => void;
  onTogglePersonalization: (enabled: boolean) => void;
  onResetPlan: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({
  isOpen,
  selectedGoals,
  preferredDailyCount,
  personalizationEnabled,
  onClose,
  onSaveGoals,
  onChangeDailyCount,
  onTogglePersonalization,
  onResetPlan
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showResetConfirm) {
          setShowResetConfirm(false);
        } else {
          onClose();
        }
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showResetConfirm]);

  if (!isOpen) return null;

  const toggleGoal = (goalId: StudentGoalId) => {
    if (selectedGoals.includes(goalId)) {
      // Don't allow removing all goals if desired, or allow down to 0
      onSaveGoals(selectedGoals.filter((g) => g !== goalId));
    } else {
      onSaveGoals([...selectedGoals, goalId]);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-goals-title"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-mindora-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-mindora-border flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="violet" icon={<Target className="w-3 h-3" />}>
                Student Control
              </Badge>
              <Badge variant="slate">Settings</Badge>
            </div>
            <h2 id="modal-goals-title" className="text-lg sm:text-xl font-bold text-mindora-darkText">
              Planner Goals & Preferences
            </h2>
            <p className="text-xs text-mindora-mutedText">
              Customize your focus areas and pace. You remain completely in control of your daily plan.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close goals settings"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Focus Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-mindora-primary">
                Select Your Personal Focus Goals
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {selectedGoals.length} selected
              </span>
            </div>
            <div className="space-y-2">
              {STUDENT_GOALS.map((goal) => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-violet-50/80 border-violet-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected ? 'bg-mindora-primary text-white' : 'border border-slate-300 bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-mindora-darkText leading-snug">
                        {goal.label}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {goal.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Preferred Daily Count */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-mindora-primary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                Target Daily Actions
              </label>
              <span className="text-xs font-bold text-mindora-darkText">
                {preferredDailyCount} actions per day
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Select how many actions you would like recommended each day to keep tasks achievable without overwhelm.
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[2, 3, 4, 5].map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => onChangeDailyCount(cnt)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    preferredDailyCount === cnt
                      ? 'bg-mindora-primary text-white border-mindora-primary shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cnt} Actions
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Personalization Toggle */}
          <div className="space-y-2.5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold text-mindora-darkText block">
                  Trends Reflection Personalization
                </label>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  When enabled, recommendations use your optional Weekly Wellbeing reflections (e.g. sleep or pressure) in local memory.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={personalizationEnabled}
                onClick={() => onTogglePersonalization(!personalizationEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-mindora-primary ${
                  personalizationEnabled ? 'bg-mindora-primary' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    personalizationEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 4: Privacy & Reset */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              In-Memory Privacy Guarantee
            </div>
            <p className="text-[11px] leading-relaxed">
              Planner preferences and task records are kept solely in private browser memory for this session. They are never sent to external servers or logged in persistent storage.
            </p>
            {showResetConfirm ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 mt-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Confirm Plan Reset
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  This will clear today's active recommendations and task progress, generating a fresh set of actions based on your current settings. Completed history from previous days remains intact.
                </p>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResetConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      setShowResetConfirm(false);
                      onResetPlan();
                      onClose();
                    }}
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                  >
                    Confirm Reset
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset Today's Plan
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-mindora-border bg-slate-50/50 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
