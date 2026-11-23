import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Target,
  Plus,
  CheckCircle2,
  Sparkles,
  Trash2,
  Flame,
  ArrowRight
} from 'lucide-react';
import { SmartActionPlannerSection } from '../components/planner/SmartActionPlannerSection';
import { personalizationStorage } from '../storage/personalizationStorage';
import type { NavigationScreen } from '../storage/sessionStorage';
import type { StudentGoal, GoalCategory } from '../contracts/personalizationContract';

interface GoalsScreenProps {
  isPreviewMode: boolean;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const GoalsScreen: React.FC<GoalsScreenProps> = ({
  isPreviewMode,
  onNavigate,
  onOpenCrisis: _onOpenCrisis
}) => {
  const [personalState, setPersonalState] = useState(() => personalizationStorage.getState());
  const [isAddingGoal, setIsAddingGoal] = useState<boolean>(false);
  const [newGoalTitle, setNewGoalTitle] = useState<string>('');
  const [newGoalCategory, setNewGoalCategory] = useState<GoalCategory>('study_routine');
  const [newGoalTarget, setNewGoalTarget] = useState<number>(3);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const goals = personalState.goals;
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: StudentGoal = {
      id: `goal-${Date.now()}`,
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      description: 'Personal habit target',
      isCustom: true,
      status: 'active',
      targetPerWeek: newGoalTarget,
      completedCount: 0,
      createdAt: new Date().toISOString()
    };

    personalizationStorage.saveGoal(newGoal);
    setPersonalState(personalizationStorage.getState());
    setNewGoalTitle('');
    setIsAddingGoal(false);
  };

  const handleToggleGoalStatus = (goalId: string, currentStatus: string) => {
    const targetGoal = goals.find((g) => g.id === goalId);
    if (targetGoal) {
      const updated: StudentGoal = {
        ...targetGoal,
        status: currentStatus === 'active' ? 'completed' : 'active',
        completedAt: currentStatus === 'active' ? new Date().toISOString() : undefined
      };
      personalizationStorage.saveGoal(updated);
      setPersonalState(personalizationStorage.getState());
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    personalizationStorage.removeGoal(goalId);
    setPersonalState(personalizationStorage.getState());
  };

  const filteredGoals = goals.filter((g) => {
    if (activeFilter === 'active') return g.status === 'active';
    if (activeFilter === 'completed') return g.status === 'completed';
    if (activeFilter === 'all') return true;
    return g.category === activeFilter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-indigo-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Target className="w-3.5 h-3.5" />}>
              Adaptive Habit Growth
            </Badge>
            <Badge variant="slate">Gentle Pacing</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            My Wellbeing & Study Goals
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1">
            Build sustainable, low-friction habits that preserve your energy and academic focus.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddingGoal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Create New Goal
        </Button>
      </div>

      {/* Goal Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-mindora-mutedText uppercase tracking-wider block">
              Active Goals
            </span>
            <span className="text-2xl font-extrabold text-mindora-darkText mt-1 block">
              {activeGoals.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700">
            <Target className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-mindora-mutedText uppercase tracking-wider block">
              Completed Milestones
            </span>
            <span className="text-2xl font-extrabold text-mindora-darkText mt-1 block">
              {completedGoals.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-mindora-mutedText uppercase tracking-wider block">
              Current Consistency
            </span>
            <span className="text-2xl font-extrabold text-mindora-darkText mt-1 block flex items-center gap-1.5">
              <Flame className="w-5 h-5 text-amber-500 inline" />
              {activeGoals.length > 0 ? 'Consistent' : 'Starting Out'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Add Goal Form Modal / Card */}
      {isAddingGoal && (
        <Card className="p-6 sm:p-8 border-2 border-violet-400 bg-violet-50/20 shadow-md">
          <h2 className="text-lg font-bold text-mindora-darkText mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            Set a Sustainable Wellness Goal
          </h2>
          <form onSubmit={handleAddGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                Goal Title
              </label>
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="e.g., Take a 10-minute fresh air break after 2 study hours"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-200 text-xs sm:text-sm text-mindora-darkText"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                  Category
                </label>
                <select
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-200 text-xs text-mindora-darkText bg-white"
                >
                  <option value="study_routine">Academic & Study Rhythm</option>
                  <option value="sleep_schedule">Sleep Hygiene Schedule</option>
                  <option value="study_breaks">Focus & Rest Breaks</option>
                  <option value="relaxation">Relaxation & Decompression</option>
                  <option value="routine_balance">Daily Routine Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                  Target Frequency (Days / Week)
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-200 text-xs text-mindora-darkText bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsAddingGoal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                icon={<Plus className="w-4 h-4" />}
              >
                Add Goal
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {['all', 'active', 'completed', 'academic', 'wellbeing', 'sleep'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
              activeFilter === tab
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'all' ? 'All Goals' : tab}
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <Card className="p-8 text-center text-xs text-mindora-mutedText">
            No goals found under "{activeFilter}". Create a gentle goal above to start!
          </Card>
        ) : (
          filteredGoals.map((g) => {
            const isCompleted = g.status === 'completed';
            return (
              <Card
                key={g.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isCompleted ? 'bg-slate-50/80 border-slate-200' : 'hover:border-violet-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={() => handleToggleGoalStatus(g.id, g.status)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 hover:border-violet-600'
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-bold truncate ${
                        isCompleted ? 'line-through text-slate-400' : 'text-mindora-darkText'
                      }`}
                    >
                      {g.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                        {g.category}
                      </span>
                      <span className="text-xs text-mindora-mutedText">
                        Target: {g.targetPerWeek} days/week
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleGoalStatus(g.id, g.status)}
                    className="text-xs font-semibold text-violet-600 hover:text-violet-800 px-2.5 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                  >
                    {isCompleted ? 'Mark Active' : 'Mark Done'}
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Smart Action Planner Integration */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-mindora-border shadow-soft">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-mindora-darkText flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-600" />
              Smart Action Micro-Planner
            </h2>
            <p className="text-xs text-mindora-mutedText mt-0.5">
              Curated evidence-backed actions designed specifically for collegiate academic pacing.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('wellness_studio')}
            icon={<ArrowRight className="w-3.5 h-3.5 text-violet-600" />}
          >
            Explore Wellness Studio
          </Button>
        </div>

        {/* SmartActionPlannerSection */}
        <SmartActionPlannerSection isPreviewMode={isPreviewMode} />
      </div>
    </div>
  );
};
