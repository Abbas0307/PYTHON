import React, { useState } from 'react';
import {
  Target,
  Plus,
  Pause,
  Play,
  Trash2,
  Edit2,
  Check,
  X,
  Smile
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  GoalCategory,
  PRESET_GOALS,
  StudentGoal
} from '../../contracts/personalizationContract';
import { personalizationStorage } from '../../storage/personalizationStorage';

interface PersonalGoalsSectionProps {
  onGoalsUpdated?: () => void;
}

export const PersonalGoalsSection: React.FC<PersonalGoalsSectionProps> = ({ onGoalsUpdated }) => {
  const [goals, setGoals] = useState<StudentGoal[]>(personalizationStorage.getState().goals);
  const [isAddingGoal, setIsAddingGoal] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<GoalCategory>('study_routine');
  const [customTarget, setCustomTarget] = useState<number>(3);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  const refreshGoals = () => {
    const updated = personalizationStorage.getState().goals;
    setGoals(updated);
    if (onGoalsUpdated) onGoalsUpdated();
  };

  const handleTogglePreset = (presetId: string) => {
    const preset = PRESET_GOALS.find((p) => p.id === presetId);
    if (!preset) return;

    const existing = goals.find((g) => g.id === presetId);
    if (existing) {
      personalizationStorage.removeGoal(presetId);
    } else {
      const newGoal: StudentGoal = {
        id: preset.id,
        title: preset.title,
        category: preset.category,
        description: preset.description,
        isCustom: false,
        status: 'active',
        targetPerWeek: preset.recommendedWeeklyTarget,
        completedCount: 0,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      personalizationStorage.saveGoal(newGoal);
    }
    refreshGoals();
  };

  const handleAddCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    const newGoal: StudentGoal = {
      id: `custom-goal-${Date.now()}`,
      title: customTitle.trim(),
      category: customCategory,
      description: 'Student-defined personal wellbeing intention.',
      isCustom: true,
      status: 'active',
      targetPerWeek: Math.max(1, Math.min(7, customTarget)),
      completedCount: 0,
      createdAt: new Date().toISOString().slice(0, 10)
    };

    personalizationStorage.saveGoal(newGoal);
    setCustomTitle('');
    setIsAddingGoal(false);
    refreshGoals();
  };

  const handleToggleStatus = (goal: StudentGoal) => {
    const nextStatus = goal.status === 'active' ? 'paused' : 'active';
    personalizationStorage.saveGoal({
      ...goal,
      status: nextStatus
    });
    refreshGoals();
  };

  const handleCompleteGoal = (goal: StudentGoal) => {
    const nextStatus = goal.status === 'completed' ? 'active' : 'completed';
    personalizationStorage.saveGoal({
      ...goal,
      status: nextStatus,
      completedAt: nextStatus === 'completed' ? new Date().toISOString().slice(0, 10) : undefined
    });
    refreshGoals();
  };

  const handleRemoveGoal = (goalId: string) => {
    personalizationStorage.removeGoal(goalId);
    refreshGoals();
  };

  const handleSaveEdit = (goal: StudentGoal) => {
    if (!editingTitle.trim()) return;
    personalizationStorage.saveGoal({
      ...goal,
      title: editingTitle.trim()
    });
    setEditingGoalId(null);
    refreshGoals();
  };

  const activeCount = goals.filter((g) => g.status === 'active').length;
  const completedCount = goals.filter((g) => g.status === 'completed').length;

  return (
    <Card className="p-5 sm:p-6 lg:p-7 space-y-6 border border-mindora-border/80 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
              <Target className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Personal Wellbeing Goals
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              {activeCount} Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Set voluntary personal focus areas. Goals are self-selected and never derived from clinical assessments.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingGoal((prev) => !prev)}
            className="text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-1" aria-hidden="true" />
            <span>{isAddingGoal ? 'Cancel' : 'Add Custom Goal'}</span>
          </Button>
        </div>
      </div>

      {/* Progress Glance without competitive gamification */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Focus Areas
          </span>
          <span className="text-xl font-extrabold text-slate-800">{activeCount}</span>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Completed Goals
          </span>
          <span className="text-xl font-extrabold text-emerald-800">{completedCount}</span>
        </div>
        <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-violet-50/70 border border-violet-200/80 flex items-center gap-2.5">
          <Smile className="w-7 h-7 text-violet-600 shrink-0" aria-hidden="true" />
          <p className="text-[11px] text-violet-900 leading-snug">
            Take things one gentle step at a time. No streaks or artificial pressure.
          </p>
        </div>
      </div>

      {/* Add Custom Goal Inline Form */}
      {isAddingGoal && (
        <form
          onSubmit={handleAddCustomGoal}
          className="p-4 rounded-2xl bg-violet-50/50 border border-violet-200 space-y-3"
        >
          <span className="text-xs font-bold text-violet-900 block">Create Custom Goal</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="e.g. Spend 15 minutes reading non-academic books"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                maxLength={80}
                required
                className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as GoalCategory)}
                className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500"
              >
                <option value="study_routine">Study Routine</option>
                <option value="sleep_schedule">Sleep Schedule</option>
                <option value="study_breaks">Study Breaks</option>
                <option value="relaxation">Relaxation</option>
                <option value="routine_balance">Routine Balance</option>
                <option value="personal_time">Personal Time</option>
              </select>
            </div>
            <div>
              <select
                value={customTarget}
                onChange={(e) => setCustomTarget(Number(e.target.value))}
                aria-label="Target days per week"
                className="w-full text-xs sm:text-sm p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <option key={num} value={num}>
                    {num} days / week
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingGoal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Goal
            </Button>
          </div>
        </form>
      )}

      {/* Active Goals List */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Your Selected Goals
        </span>

        {goals.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
            <p className="text-xs sm:text-sm">No personal goals selected yet.</p>
            <p className="text-xs text-slate-400">
              Select one or more curated intentions below or add your own custom intention.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {goals.map((goal) => {
              const isCompleted = goal.status === 'completed';
              const isPaused = goal.status === 'paused';

              return (
                <div
                  key={goal.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-600'
                      : isPaused
                      ? 'bg-slate-50/80 border-slate-200 opacity-70'
                      : 'bg-white border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <button
                      onClick={() => handleCompleteGoal(goal)}
                      aria-label={isCompleted ? `Mark ${goal.title} active` : `Mark ${goal.title} completed`}
                      className={`p-1.5 rounded-full transition-colors mt-0.5 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </button>

                    <div className="min-w-0">
                      {editingGoalId === goal.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="text-xs p-1.5 border rounded-lg focus:ring-2 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => handleSaveEdit(goal)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingGoalId(null)}
                            className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm font-bold ${
                              isCompleted ? 'line-through text-slate-500' : 'text-slate-800'
                            }`}
                          >
                            {goal.title}
                          </span>
                          {isPaused && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                              Paused
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              Completed
                            </span>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-500 line-clamp-1">{goal.description}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => {
                        setEditingGoalId(goal.id);
                        setEditingTitle(goal.title);
                      }}
                      aria-label={`Edit ${goal.title}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(goal)}
                      aria-label={isPaused ? `Resume ${goal.title}` : `Pause ${goal.title}`}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                      {isPaused ? (
                        <Play className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                    </button>

                    <button
                      onClick={() => handleRemoveGoal(goal.id)}
                      aria-label={`Delete ${goal.title}`}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preset Curated Intentions */}
      <div className="pt-3 border-t border-slate-100 space-y-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Explore Curated Intentions
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PRESET_GOALS.map((preset) => {
            const isSelected = goals.some((g) => g.id === preset.id);

            return (
              <button
                key={preset.id}
                onClick={() => handleTogglePreset(preset.id)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-violet-50/70 border-violet-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 leading-snug">
                    {preset.title}
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
