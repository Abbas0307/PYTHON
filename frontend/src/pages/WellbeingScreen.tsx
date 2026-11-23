import React from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { MotorcycleStressGauge } from '../components/dashboard/MotorcycleStressGauge';
import {
  Sparkles,
  TrendingUp,
  Activity,
  Heart,
  Moon,
  Clock,
  ShieldCheck,
  Info
} from 'lucide-react';
import { WeeklyTrendsSection } from '../components/trends/WeeklyTrendsSection';
import { StudentSurveyFeatures } from '../contracts/featureContract';
import { analyzeStudentLifestyle, PHQ9Result } from '../engines/wellbeingEngine';
import type { NavigationScreen } from '../storage/sessionStorage';

interface WellbeingScreenProps {
  features: StudentSurveyFeatures;
  phq9Result: PHQ9Result | null;
  isPreviewMode: boolean;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const WellbeingScreen: React.FC<WellbeingScreenProps> = ({
  features,
  phq9Result: _phq9Result,
  isPreviewMode,
  onNavigate,
  onOpenCrisis
}) => {
  const analysis = analyzeStudentLifestyle(features);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-violet-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Activity className="w-3.5 h-3.5" />}>
              Wellbeing Rhythm
            </Badge>
            <Badge variant="slate">Non-Clinical</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            My Wellbeing & Rhythm Insights
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Track your sleep cycles, study equilibrium, and daily vitality. Calculated deterministically in your private local browser memory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('daily_checkin')}
            icon={<TrendingUp className="w-3.5 h-3.5 text-violet-600" />}
          >
            Daily Check-in
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('assessment')}
            icon={<Sparkles className="w-3.5 h-3.5 text-violet-600" />}
          >
            Update Assessment
          </Button>
        </div>
      </div>

      {/* Non-Diagnostic Disclaimer */}
      <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <span className="font-bold block text-emerald-950">
            Educational Lifestyle Measurement
          </span>
          Mindora's wellbeing indicators reflect your personal rhythms (sleep duration, study pace, and nourishment). They are <strong>never</strong> a medical or clinical psychiatric diagnosis.
        </div>
      </div>

      {/* Hero: Motorcycle Analog Stress Gauge */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-mindora-darkText flex items-center gap-2">
              <span>Primary Stress Speedometer</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold">
                Live Instrument Dial
              </span>
            </h2>
            <p className="text-xs text-mindora-mutedText">
              Real-time collegiate indicator scaled from 0 (resting) to 100 (peak friction)
            </p>
          </div>
        </div>

        <MotorcycleStressGauge
          onNavigateToAssessment={() => onNavigate('assessment')}
        />
      </div>

      {/* Secondary Lifestyle Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Sleep Recovery */}
        <Card className="p-5 border border-indigo-100 hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-mindora-mutedText mb-2">
            <span>Sleep Recovery</span>
            <Moon className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-mindora-darkText">
            {features.sleepDuration}
          </div>
          <p className="mt-2 text-xs text-mindora-mutedText truncate">
            Reported nightly rest window
          </p>
        </Card>

        {/* Academic Pace */}
        <Card className="p-5 border border-sky-100 hover:border-sky-300 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-mindora-mutedText mb-2">
            <span>Academic Load</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-extrabold text-mindora-darkText">
            {features.workStudyHours}
            <span className="text-sm font-semibold text-mindora-mutedText"> hrs/day</span>
          </div>
          <p className="mt-2 text-xs text-mindora-mutedText truncate">
            {features.workStudyHours <= 7 ? 'Sustainable focus load' : 'High academic intensity'}
          </p>
        </Card>

        {/* Lifestyle Harmony */}
        <Card className="p-5 border border-pink-100 hover:border-pink-300 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-mindora-mutedText mb-2">
            <span>Lifestyle Friction</span>
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-3xl font-extrabold text-mindora-darkText">
            {Math.round(100 - analysis.overallWellbeingScore)}
            <span className="text-sm font-semibold text-mindora-mutedText"> friction</span>
          </div>
          <p className="mt-2 text-xs text-mindora-mutedText truncate">
            Deterministic lifestyle balance
          </p>
        </Card>
      </div>

      {/* Historical Wellbeing Trends Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-mindora-border shadow-soft">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-mindora-darkText">
              Longitudinal Wellbeing Trends
            </h2>
            <p className="text-xs text-mindora-mutedText mt-0.5">
              Secure weekly check-in records stored in your AES-256-GCM browser vault.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCrisis}
            icon={<Heart className="w-3.5 h-3.5 text-rose-500" />}
          >
            Crisis Helplines
          </Button>
        </div>

        {/* Reused Production Component: WeeklyTrendsSection */}
        <WeeklyTrendsSection isPreviewMode={isPreviewMode} />
      </div>

      {/* Indicator Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <Info className="w-4 h-4 text-violet-600" />
            <h3 className="font-bold text-sm text-mindora-darkText">
              How Wellbeing Scores are Calculated
            </h3>
          </div>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            Mindora combines your self-reported sleep quality, academic pacing, dietary regularity, and social support into a composite vitality metric. The calculation executes strictly offline in client-side code with zero telemetry.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2.5 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-mindora-darkText">
              Your Data Privacy Guarantee
            </h3>
          </div>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            All trend points are encrypted using PBKDF2 with 600,000 iterations and stored locally. No teachers, peers, or universities can ever view your daily or weekly entries.
          </p>
        </Card>
      </div>
    </div>
  );
};
