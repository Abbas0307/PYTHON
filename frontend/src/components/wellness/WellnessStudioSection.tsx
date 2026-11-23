import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Wind,
  Layers,
  Clock,
  Activity,
  BookOpen,
  CheckCircle2,
  Heart,
  RotateCcw
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { WellnessActivityCard } from './WellnessActivityCard';
import { BreathingExercise } from './BreathingExercise';
import { GroundingExercise } from './GroundingExercise';
import { FocusTimer } from './FocusTimer';
import { MuscleRelaxation } from './MuscleRelaxation';
import { RelaxationLibrary } from './RelaxationLibrary';
import { wellnessStore } from '../../engines/wellnessEngine.ts';
import type { CompletedWellnessSession, WellnessExperienceId } from '../../contracts/wellnessContract.ts';

interface WellnessStudioSectionProps {
  isPreviewMode?: boolean;
}

type StudioView = 'home' | WellnessExperienceId;

export const WellnessStudioSection: React.FC<WellnessStudioSectionProps> = ({
  isPreviewMode = false
}) => {
  const [activeView, setActiveView] = useState<StudioView>('home');
  const [recentSessions, setRecentSessions] = useState<CompletedWellnessSession[]>([]);

  const refreshSessions = () => {
    setRecentSessions(wellnessStore.getCompletedSessions());
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  const handleSessionCompleted = () => {
    refreshSessions();
  };

  // 1. GUIDED BREATHING VIEW
  if (activeView === 'breathing') {
    return (
      <BreathingExercise
        onBack={() => setActiveView('home')}
        onComplete={handleSessionCompleted}
      />
    );
  }

  // 2. SENSORY GROUNDING VIEW
  if (activeView === 'grounding') {
    return (
      <GroundingExercise
        onBack={() => setActiveView('home')}
        onComplete={handleSessionCompleted}
      />
    );
  }

  // 3. FOCUS TIMER VIEW
  if (activeView === 'timer') {
    return (
      <FocusTimer
        onBack={() => setActiveView('home')}
        onComplete={handleSessionCompleted}
      />
    );
  }

  // 4. PROGRESSIVE MUSCLE RELAXATION VIEW
  if (activeView === 'muscle_relaxation') {
    return (
      <MuscleRelaxation
        onBack={() => setActiveView('home')}
        onComplete={handleSessionCompleted}
      />
    );
  }

  // 5. RELAXATION LIBRARY VIEW
  if (activeView === 'activities') {
    return (
      <RelaxationLibrary
        onBack={() => setActiveView('home')}
        onComplete={handleSessionCompleted}
      />
    );
  }

  // HOME STUDIO OVERVIEW
  const totalCompletedMinutes = recentSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-6 pt-2">
      {/* Studio Header Card */}
      <div className="bg-gradient-to-r from-violet-50/80 via-white to-purple-50/60 p-5 sm:p-7 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Mindora Wellness Studio
            </Badge>
            <Badge variant="slate">Restorative Micro-Practices</Badge>
            <Badge variant="emerald">100% In-Memory Privacy</Badge>
            {isPreviewMode && <Badge variant="amber">Preview Studio</Badge>}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
            Restorative Breathing, Grounding & Pacing
          </h2>
          <p className="text-xs sm:text-sm text-mindora-mutedText max-w-2xl leading-relaxed">
            Take a voluntary pause from rigorous coursework. Choose a gentle 3 to 15-minute practice to calm physiological stress, anchor your attention, and restore mental clarity.
          </p>
        </div>

        {/* Quick session summary stats */}
        <div className="flex items-center gap-3 shrink-0 p-3 bg-white/90 border border-violet-100 rounded-2xl">
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Session Practices
            </span>
            <span className="text-lg font-black text-mindora-primary">
              {recentSessions.length}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Minutes Restored
            </span>
            <span className="text-lg font-black text-emerald-600">
              {totalCompletedMinutes}m
            </span>
          </div>
        </div>
      </div>

      {/* 5 Core Experience Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Experience 1: Guided Breathing */}
        <WellnessActivityCard
          id="card-breathing"
          title="Guided Breathing Studio"
          description="Interactive visual breathing circle supporting gentle, balanced, and extended-exhale rhythms with zero breath holding."
          category="Breathing & Autonomic Reset"
          durationLabel="1–5 mins"
          icon={<Wind className="w-5 h-5 text-white" />}
          accentGradient="from-violet-500 to-indigo-600"
          onStart={() => setActiveView('breathing')}
          ctaText="Open Studio"
        />

        {/* Experience 2: Sensory Grounding */}
        <WellnessActivityCard
          id="card-grounding"
          title="5-4-3-2-1 Sensory Grounding"
          description="A structured step-by-step sensory exercise guiding attention outward through your 5 senses to interrupt rumination."
          category="Sensory Anchoring"
          durationLabel="5 mins"
          icon={<Layers className="w-5 h-5 text-white" />}
          accentGradient="from-indigo-500 to-blue-600"
          onStart={() => setActiveView('grounding')}
          ctaText="Begin Grounding"
        />

        {/* Experience 3: Focus & Break Timer */}
        <WellnessActivityCard
          id="card-timer"
          title="Focus & Restorative Timer"
          description="Ergonomic Pomodoro study intervals with circular countdown, accurate wall-clock timers, and optional gentle chime."
          category="Academic Pacing"
          durationLabel="15–45 mins"
          icon={<Clock className="w-5 h-5 text-white" />}
          accentGradient="from-blue-500 to-teal-600"
          onStart={() => setActiveView('timer')}
          ctaText="Set Timer"
        />

        {/* Experience 4: Progressive Muscle Relaxation */}
        <WellnessActivityCard
          id="card-pmr"
          title="Progressive Muscle Relaxation"
          description="5 gentle muscle groups targeting typing and screen posture tension, with universal no-movement awareness alternatives."
          category="Physical Decompression"
          durationLabel="7 mins"
          icon={<Activity className="w-5 h-5 text-white" />}
          accentGradient="from-purple-500 to-pink-600"
          onStart={() => setActiveView('muscle_relaxation')}
          ctaText="Start PMR"
        />

        {/* Experience 5: Relaxation Activities Library */}
        <WellnessActivityCard
          id="card-library"
          title="Relaxation Activity Library"
          description="Browse 18 curated micro-practices across Mindful Breaks, Creative Activities, Gentle Movement, and Social Connection."
          category="Activity Catalog"
          durationLabel="5–15 mins"
          icon={<BookOpen className="w-5 h-5 text-white" />}
          accentGradient="from-teal-500 to-emerald-600"
          onStart={() => setActiveView('activities')}
          ctaText="Explore Library"
        />
      </div>

      {/* In-Memory Session Activity History & Friendly Reflection */}
      {recentSessions.length > 0 ? (
        <Card className="p-4 sm:p-5 border-violet-100 bg-violet-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-mindora-darkText">
                Current Session Wellness Log
              </h3>
            </div>
            <button
              onClick={() => {
                wellnessStore.clearSessionHistory();
                refreshSessions();
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Clear Log
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {recentSessions.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-violet-200/70 rounded-full text-xs font-semibold text-slate-700 shadow-2xs"
              >
                <Sparkles className="w-3 h-3 text-mindora-primary" />
                <span>{s.title}</span>
                <span className="text-[10px] text-slate-400">({s.completedAt})</span>
              </span>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
            💬 Dedicated micro-rest moments buffer cognitive stamina. All session records are stored in private volatile browser memory and evaporate when you close this tab.
          </p>
        </Card>
      ) : (
        <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100/60 text-mindora-primary flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-mindora-darkText block">
                No Wellness Practices Logged in This Session Yet
              </span>
              <span className="text-[11px] text-mindora-mutedText">
                Choose any practice above whenever you feel mental congestion or study fatigue.
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Volatile Session Memory
          </span>
        </div>
      )}
    </div>
  );
};
