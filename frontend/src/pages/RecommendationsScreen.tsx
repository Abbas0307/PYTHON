import React from 'react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Compass,
  Sparkles,
  Clock,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { AdaptiveRecommendationSection } from '../components/personalization/AdaptiveRecommendationSection';
import { WeeklyPersonalSummarySection } from '../components/personalization/WeeklyPersonalSummarySection';
import { StudentSurveyFeatures } from '../contracts/featureContract';
import type { NavigationScreen } from '../storage/sessionStorage';

interface RecommendationsScreenProps {
  features: StudentSurveyFeatures;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({
  features: _features,
  onNavigate,
  onOpenCrisis
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-indigo-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Compass className="w-3.5 h-3.5" />}>
              Adaptive Suggestions
            </Badge>
            <Badge variant="slate">Educational Pacing</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Personalized Wellbeing Recommendations
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Deterministic lifestyle suggestions tailored to your study load, sleep duration, and active goals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('wellness_studio')}
            icon={<ArrowRight className="w-3.5 h-3.5 text-violet-600" />}
          >
            Practice in Studio
          </Button>
        </div>
      </div>

      {/* Distinction Advisory Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 text-emerald-950 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold block text-emerald-950">
            Educational Self-Care Tools — Not Clinical Treatment
          </span>
          These suggestions are algorithmic lifestyle aids designed to support collegiate time-management and restorative routines. If you are experiencing distress, reach out to your campus health counselor or emergency helplines.
        </div>
      </div>

      {/* Adaptive Recommendation Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-mindora-border shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-mindora-darkText flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Curated Study & Sleep Routines
          </h2>
          <span className="text-xs text-mindora-mutedText">
            Updated from your active habit checklist
          </span>
        </div>

        <AdaptiveRecommendationSection />
      </div>

      {/* Weekly Summary & Reflection */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-mindora-border shadow-soft space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-mindora-darkText flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-600" />
            Weekly Habit Trajectory
          </h2>
        </div>

        <WeeklyPersonalSummarySection />
      </div>

      {/* Crisis Support Footer */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-mindora-mutedText">
          Need immediate emotional support? Trained crisis counselors are available 24 hours a day.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCrisis}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0"
        >
          View 24/7 Helplines
        </Button>
      </div>
    </div>
  );
};
