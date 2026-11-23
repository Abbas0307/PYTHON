import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  HeartPulse,
  Wind,
  Compass,
  Timer,
  Zap,
  BookOpen,
  CheckCircle2,
  Clock,
  Play
} from 'lucide-react';
import { BreathingExercise } from '../components/wellness/BreathingExercise';
import { GroundingExercise } from '../components/wellness/GroundingExercise';
import { FocusTimer } from '../components/wellness/FocusTimer';
import { MuscleRelaxation } from '../components/wellness/MuscleRelaxation';
import { RelaxationLibrary } from '../components/wellness/RelaxationLibrary';
import { wellnessStore } from '../engines/wellnessEngine';
import type { NavigationScreen } from '../storage/sessionStorage';
import type { CompletedWellnessSession } from '../contracts/wellnessContract';

interface WellnessStudioScreenProps {
  initialActivity?: 'breathing' | 'grounding' | 'focus_timer' | 'muscle_relaxation' | 'studio';
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const WellnessStudioScreen: React.FC<WellnessStudioScreenProps> = ({
  initialActivity = 'studio',
  onNavigate,
  onOpenCrisis: _onOpenCrisis
}) => {
  const [activeActivity, setActiveActivity] = useState<string>(
    initialActivity === 'studio' ? 'hub' : initialActivity
  );
  const [recentSessions, setRecentSessions] = useState<CompletedWellnessSession[]>([]);

  useEffect(() => {
    if (initialActivity && initialActivity !== 'studio') {
      setActiveActivity(initialActivity);
    }
  }, [initialActivity]);

  useEffect(() => {
    setRecentSessions(wellnessStore.getCompletedSessions());
  }, []);

  const handleSessionDone = () => {
    setRecentSessions(wellnessStore.getCompletedSessions());
  };

  const handleBackToHub = () => {
    setActiveActivity('hub');
    onNavigate('wellness_studio');
  };

  // Render individual focused experience
  if (activeActivity === 'breathing') {
    return (
      <div className="max-w-4xl mx-auto py-2">
        <BreathingExercise onBack={handleBackToHub} onComplete={handleSessionDone} />
      </div>
    );
  }

  if (activeActivity === 'grounding') {
    return (
      <div className="max-w-4xl mx-auto py-2">
        <GroundingExercise onBack={handleBackToHub} onComplete={handleSessionDone} />
      </div>
    );
  }

  if (activeActivity === 'focus_timer') {
    return (
      <div className="max-w-4xl mx-auto py-2">
        <FocusTimer onBack={handleBackToHub} onComplete={handleSessionDone} />
      </div>
    );
  }

  if (activeActivity === 'muscle_relaxation') {
    return (
      <div className="max-w-4xl mx-auto py-2">
        <MuscleRelaxation onBack={handleBackToHub} onComplete={handleSessionDone} />
      </div>
    );
  }

  if (activeActivity === 'library') {
    return (
      <div className="max-w-5xl mx-auto py-2">
        <RelaxationLibrary onBack={handleBackToHub} />
      </div>
    );
  }

  // Central Activity Hub View
  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-pink-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<HeartPulse className="w-3.5 h-3.5" />}>
              Wellness Studio Hub
            </Badge>
            <Badge variant="slate">Evidence-Based</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Mindora Wellness Studio
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Choose a focused practice. Each activity opens its own dedicated, calm experience with no distractions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveActivity('library')}
            icon={<BookOpen className="w-3.5 h-3.5 text-violet-600" />}
          >
            Relaxation Library
          </Button>
        </div>
      </div>

      {/* Primary 4 Activity Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* 1. Guided Breathing */}
        <Card className="p-6 sm:p-7 border border-violet-100 hover:border-violet-300 hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 mb-4">
              <Wind className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-lg font-bold text-mindora-darkText">
                Guided Breathing Exercises
              </h2>
              <Badge variant="violet">2-5 mins</Badge>
            </div>
            <p className="text-xs sm:text-sm text-mindora-mutedText leading-relaxed">
              Box breathing and gentle rhythm cycles designed to down-regulate nervous system arousal before tests or after intense study.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Box & Gentle Pacing</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveActivity('breathing')}
              icon={<Play className="w-3.5 h-3.5" />}
            >
              Start Breathing
            </Button>
          </div>
        </Card>

        {/* 2. Sensory Grounding 5-4-3-2-1 */}
        <Card className="p-6 sm:p-7 border border-emerald-100 hover:border-emerald-300 hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-lg font-bold text-mindora-darkText">
                Sensory Grounding (5-4-3-2-1)
              </h2>
              <Badge variant="emerald">Mindfulness</Badge>
            </div>
            <p className="text-xs sm:text-sm text-mindora-mutedText leading-relaxed">
              Anchor your sensory attention in the present physical space to interrupt racing thoughts and acute anxiety spikes.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">5 Physical Senses</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveActivity('grounding')}
              icon={<Play className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Start Grounding
            </Button>
          </div>
        </Card>

        {/* 3. Focus & Break Timer */}
        <Card className="p-6 sm:p-7 border border-indigo-100 hover:border-indigo-300 hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-4">
              <Timer className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-lg font-bold text-mindora-darkText">
                Focus & Restorative Break Timer
              </h2>
              <Badge variant="slate">Pomodoro</Badge>
            </div>
            <p className="text-xs sm:text-sm text-mindora-mutedText leading-relaxed">
              Collegiate interval timer (25/5 or 50/10) with automatic rest cues to prevent burnout during long assignments.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Deep Work Pacing</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveActivity('focus_timer')}
              icon={<Play className="w-3.5 h-3.5" />}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Open Timer
            </Button>
          </div>
        </Card>

        {/* 4. Progressive Muscle Relaxation */}
        <Card className="p-6 sm:p-7 border border-pink-100 hover:border-pink-300 hover:shadow-card transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-700 mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-lg font-bold text-mindora-darkText">
                Progressive Muscle Relaxation (PMR)
              </h2>
              <Badge variant="rose">Somatic Rest</Badge>
            </div>
            <p className="text-xs sm:text-sm text-mindora-mutedText leading-relaxed">
              Step-by-step physical tension release for shoulders, neck, and hands tired from keyboard and desk study.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">5 Muscle Groups</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setActiveActivity('muscle_relaxation')}
              icon={<Play className="w-3.5 h-3.5" />}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Start PMR
            </Button>
          </div>
        </Card>
      </div>

      {/* Recent Studio Activity */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-600" />
            Recent Studio Sessions
          </h2>
          <span className="text-xs text-mindora-mutedText font-semibold">
            {recentSessions.length} sessions logged
          </span>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-mindora-mutedText">
            No studio sessions completed yet today. Pick any activity above to start!
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentSessions.slice(0, 4).map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-mindora-darkText capitalize">
                    {s.experienceId.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400">({s.durationMinutes} mins)</span>
                </div>
                <span className="text-slate-500 font-mono text-[11px]">
                  {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
