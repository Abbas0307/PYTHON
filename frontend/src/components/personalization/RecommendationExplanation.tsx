import React from 'react';
import {
  HelpCircle,
  X,
  Target,
  Sliders,
  ShieldCheck,
  EyeOff
} from 'lucide-react';
import type { AdaptiveRecommendation } from '../../contracts/personalizationContract';
import { Button } from '../common/Button';

interface RecommendationExplanationProps {
  recommendation: AdaptiveRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onOpenGoals?: () => void;
  onDismissRecommendation?: (id: string) => void;
}

export const RecommendationExplanation: React.FC<RecommendationExplanationProps> = ({
  recommendation,
  isOpen,
  onClose,
  onOpenGoals,
  onDismissRecommendation
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rec-explanation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-mindora-border/80 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-200" aria-hidden="true" />
              <h3 id="rec-explanation-title" className="text-base sm:text-lg font-bold">
                Why am I seeing this suggestion?
              </h3>
            </div>
            <p className="text-xs text-violet-100/90 leading-relaxed">
              Transparent, deterministic rationale behind this micro-habit recommendation.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close explanation dialog"
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm max-h-[70vh] overflow-y-auto">
          {/* Item Title & Category */}
          <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 block">
              Suggested Micro-Habit
            </span>
            <h4 className="font-bold text-slate-900 text-sm">{recommendation.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{recommendation.description}</p>
          </div>

          {/* 1. Transparent Influencing Factor */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>1. Influencing Focus Goal</span>
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
              {recommendation.rationale}
            </div>
          </div>

          {/* 2. Duration Match */}
          <div className="space-y-2">
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>2. Pacing & Time Commitment</span>
            </span>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed">
              Estimated duration: <strong>{recommendation.estimatedMinutes} minutes</strong>. Matched against your preferred collegiate session window.
            </div>
          </div>

          {/* 3. Non-Diagnostic Invariant Notice */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>How Deterministic Suggestions Work</span>
            </div>
            <p className="leading-relaxed">
              Mindora generates suggestions using deterministic, rule-based matching in your local browser memory.
              It <strong>never</strong> uses psychometric screening answers (PHQ-9), clinical depression scores,
              or AI behavioral profiling to suggest habits.
            </p>
          </div>

          {/* Actions to alter inputs */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {onOpenGoals && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenGoals();
                }}
                className="text-xs font-bold text-violet-700 hover:text-violet-900 py-1.5 px-2 hover:bg-violet-50 rounded-xl transition-colors text-left sm:text-center"
              >
                Change Personal Goals & Preferences →
              </button>
            )}

            {onDismissRecommendation && (
              <button
                type="button"
                onClick={() => {
                  onDismissRecommendation(recommendation.id);
                  onClose();
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 py-1.5 px-2 rounded-xl transition-colors flex items-center justify-center gap-1 hover:bg-slate-100"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Dismiss This Habit</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Understood
          </Button>
        </div>
      </div>
    </div>
  );
};
