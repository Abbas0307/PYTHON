import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  ThumbsUp,
  ThumbsDown,
  SlidersHorizontal,
  HelpCircle,
  Play,
  CheckCircle2,
  Bell,
  X
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  AdaptiveRecommendation,
  GoalCategory
} from '../../contracts/personalizationContract';
import { generateAdaptiveRecommendations } from '../../engines/adaptiveRecommendationEngine';
import { personalizationStorage } from '../../storage/personalizationStorage';
import { RecommendationExplanation } from './RecommendationExplanation';

interface AdaptiveRecommendationSectionProps {
  onSelectAction?: (targetType: string, targetId?: string) => void;
  onOpenGoals?: () => void;
  onNavigate?: (screen: any) => void;
}

export const AdaptiveRecommendationSection: React.FC<AdaptiveRecommendationSectionProps> = ({
  onSelectAction,
  onOpenGoals,
  onNavigate
}) => {
  const [state, setState] = useState(personalizationStorage.getState());
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [explainingRec, setExplainingRec] = useState<AdaptiveRecommendation | null>(null);

  // Recommendation action states
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

  const recommendations = generateAdaptiveRecommendations({
    goals: state.goals,
    preferences: state.recommendationPreferences,
    limit: 3
  });

  const handleDismiss = (id: string) => {
    personalizationStorage.updateRecommendationPreferences((prev) => ({
      ...prev,
      dismissedRecommendationIds: [...(prev.dismissedRecommendationIds || []), id]
    }));
    setState(personalizationStorage.getState());
  };

  const handleAccept = (rec: AdaptiveRecommendation) => {
    setAcceptedIds((prev) => new Set(prev).add(rec.id));
    if (onNavigate && rec.actionRoute) {
      onNavigate(rec.actionRoute);
    } else if (onSelectAction) {
      onSelectAction(rec.targetType, rec.targetId);
    }
  };

  const handleMarkCompleted = (id: string) => {
    setCompletedIds((prev) => new Set(prev).add(id));
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleRemindLater = (id: string) => {
    setRemindedIds((prev) => new Set(prev).add(id));
  };

  const handleRate = (id: string, rating: 'useful' | 'not_useful') => {
    personalizationStorage.updateRecommendationPreferences((prev) => {
      const useful = new Set(prev.usefulRecommendationIds || []);
      const notUseful = new Set(prev.notUsefulRecommendationIds || []);
      if (rating === 'useful') {
        useful.add(id);
        notUseful.delete(id);
      } else {
        notUseful.add(id);
        useful.delete(id);
      }
      return {
        ...prev,
        usefulRecommendationIds: Array.from(useful),
        notUsefulRecommendationIds: Array.from(notUseful)
      };
    });
    setState(personalizationStorage.getState());
  };

  const handleDurationChange = (minutes: number) => {
    personalizationStorage.updateRecommendationPreferences((prev) => ({
      ...prev,
      preferredDurationMinutes: minutes
    }));
    setState(personalizationStorage.getState());
  };

  const handleCategoryToggle = (category: GoalCategory) => {
    personalizationStorage.updateRecommendationPreferences((prev) => {
      const current = prev.favoriteCategories || [];
      const updated = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return {
        ...prev,
        favoriteCategories: updated
      };
    });
    setState(personalizationStorage.getState());
  };

  return (
    <Card className="p-5 sm:p-6 lg:p-7 border border-mindora-border/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Adaptive Practice Recommendations
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
              Deterministic Rules
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Tailored to your explicitly selected goals, routine pacing, and academic friction. Free from clinical diagnostic claims.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsConfiguring((prev) => !prev)}
          className="text-xs font-bold self-end sm:self-auto"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
          <span>{isConfiguring ? 'Close Preferences' : 'Pace & Focus'}</span>
        </Button>
      </div>

      {/* Preferences Drawer */}
      {isConfiguring && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Preferred Practice Duration
            </span>
            <div className="flex gap-2">
              {[5, 15, 25, 45].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleDurationChange(mins)}
                  className={`py-1.5 px-3 rounded-xl font-bold border transition-all ${
                    state.recommendationPreferences.preferredDurationMinutes === mins
                      ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Focus Domains
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'study_routine', label: 'Study Routine' },
                { id: 'sleep_schedule', label: 'Sleep Schedule' },
                { id: 'study_breaks', label: 'Study Breaks' },
                { id: 'relaxation', label: 'Relaxation' },
                { id: 'routine_balance', label: 'Routine Balance' },
                { id: 'personal_time', label: 'Personal Time' }
              ].map((domain) => {
                const isSelected = state.recommendationPreferences.favoriteCategories.includes(
                  domain.id as GoalCategory
                );
                return (
                  <button
                    key={domain.id}
                    onClick={() => handleCategoryToggle(domain.id as GoalCategory)}
                    className={`py-1 px-3 rounded-full font-medium border text-xs transition-all ${
                      isSelected
                        ? 'bg-violet-100 border-violet-300 text-violet-800 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {domain.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Cards Grid */}
      {recommendations.length === 0 ? (
        <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
          <p className="text-xs sm:text-sm">No new recommendations for your current filter.</p>
          <p className="text-xs text-slate-400">
            You've addressed or dismissed all active suggestions. You can adjust your focus domains or reset dismissed items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {recommendations.map((rec) => {
            const isUseful = rec.userRating === 'useful';
            const isNotUseful = rec.userRating === 'not_useful';
            const isCompleted = completedIds.has(rec.id);
            const isAccepted = acceptedIds.has(rec.id);
            const isReminded = remindedIds.has(rec.id);

            return (
              <div
                key={rec.id}
                className={`p-4 rounded-2xl bg-white border shadow-2xs hover:border-violet-300 transition-all flex flex-col justify-between gap-3 ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : isAccepted
                    ? 'border-violet-400 bg-violet-50/30'
                    : 'border-slate-200/90'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Category & Duration */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
                      {rec.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{rec.estimatedMinutes}m</span>
                    </div>
                  </div>

                  {/* Title & Status Badges */}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      {rec.title}
                    </h3>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed today
                      </span>
                    )}
                    {isReminded && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-1">
                        <Bell className="w-3 h-3" />
                        Deferred for later
                      </span>
                    )}
                  </div>

                  {/* Why Suggested Rationale */}
                  <div className="p-2.5 rounded-xl bg-violet-50/70 border border-violet-100 text-[11px] text-violet-950 leading-relaxed">
                    <strong>Why useful:</strong> {rec.rationale}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {rec.description}
                  </p>

                  {/* How To Start */}
                  {rec.howToStart && (
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-600 leading-tight">
                      <strong>How to start:</strong> {rec.howToStart}
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons (Accept, Complete, Remind, Dismiss) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isCompleted ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAccept(rec)}
                          className="flex-1 py-1.5 px-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>{isAccepted ? 'Continue' : 'Start'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(rec.id)}
                          className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-bold transition flex items-center gap-1"
                          title="Mark as completed"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Done</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemindLater(rec.id)}
                          className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] transition flex items-center gap-1"
                          title="Remind me later"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Later</span>
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-1 text-xs font-bold text-emerald-700">
                        Practice completed! Great job taking time for yourself.
                      </div>
                    )}
                  </div>

                  {/* Secondary Footer: Explanation link, Dismiss, Feedback ratings */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRate(rec.id, 'useful')}
                        aria-label="Mark recommendation helpful"
                        className={`p-1 rounded-lg transition-colors ${
                          isUseful
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-50'
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRate(rec.id, 'not_useful')}
                        aria-label="Mark recommendation not helpful"
                        className={`p-1 rounded-lg transition-colors ${
                          isNotUseful
                            ? 'bg-rose-100 text-rose-700'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-slate-50'
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExplainingRec(rec)}
                        className="text-[10px] font-bold text-violet-700 hover:text-violet-900 flex items-center gap-0.5 hover:underline"
                      >
                        <HelpCircle className="w-3 h-3" />
                        <span>Why this?</span>
                      </button>

                      <button
                        onClick={() => handleDismiss(rec.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"
                        title="Dismiss recommendation"
                      >
                        <X className="w-3 h-3" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transparency Explanation Modal */}
      {explainingRec && (
        <RecommendationExplanation
          recommendation={explainingRec}
          isOpen={!!explainingRec}
          onClose={() => setExplainingRec(null)}
          onOpenGoals={onOpenGoals}
          onDismissRecommendation={handleDismiss}
        />
      )}
    </Card>
  );
};
