import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ArrowLeft, Wind, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  BREATHING_PATTERNS,
  BREATHING_DURATIONS_MINUTES,
  wellnessStore
} from '../../engines/wellnessEngine.ts';
import type { BreathingPatternId, BreathingPhase } from '../../contracts/wellnessContract.ts';
import { WellnessCompletionScreen } from './WellnessCompletionScreen';

interface BreathingExerciseProps {
  onBack: () => void;
  onComplete?: () => void;
}

export const BreathingExercise: React.FC<BreathingExerciseProps> = ({ onBack, onComplete }) => {
  const [patternId, setPatternId] = useState<BreathingPatternId>('gentle');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(2);

  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const [phase, setPhase] = useState<BreathingPhase>('ready');
  const [secondsRemainingInPhase, setSecondsRemainingInPhase] = useState<number>(0);
  const [currentCycle, setCurrentCycle] = useState<number>(0);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0);

  const pattern = BREATHING_PATTERNS[patternId];
  const totalTargetSeconds = targetDurationMinutes * 60;

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop & cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    setIsCompleted(false);
    setPhase('inhale');
    setSecondsRemainingInPhase(pattern.inhaleSeconds);
    setCurrentCycle(1);
    setTotalElapsedSeconds(0);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setIsPaused(false);
    setPhase('ready');
    setSecondsRemainingInPhase(0);
    setTotalElapsedSeconds(0);
  };

  // Main tick loop
  useEffect(() => {
    if (!isActive || isPaused || isCompleted) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalElapsedSeconds((prevElapsed) => {
        const nextElapsed = prevElapsed + 1;
        if (nextElapsed >= totalTargetSeconds) {
          // Complete session
          setIsActive(false);
          setIsCompleted(true);
          setPhase('completed');
          wellnessStore.recordSession({
            experienceId: 'breathing',
            title: `Guided Breathing: ${pattern.name}`,
            durationMinutes: targetDurationMinutes
          });
          if (onComplete) onComplete();
          return totalTargetSeconds;
        }
        return nextElapsed;
      });

      setSecondsRemainingInPhase((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Transition phase
        if (phase === 'inhale') {
          setPhase('exhale');
          return pattern.exhaleSeconds;
        } else {
          // From exhale -> new inhale cycle
          setCurrentCycle((c) => c + 1);
          setPhase('inhale');
          return pattern.inhaleSeconds;
        }
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isPaused, isCompleted, phase, pattern, totalTargetSeconds, targetDurationMinutes, onComplete]);

  // Circle scaling calculations based on phase and remaining seconds
  let scaleClass = 'scale-100';
  let phaseText = 'Ready to begin';
  let phaseColor = 'text-slate-600';
  let ringColor = 'border-violet-200 bg-violet-50/50';

  if (isActive && !isPaused) {
    if (phase === 'inhale') {
      scaleClass = 'scale-125 transition-transform duration-1000 ease-out';
      phaseText = 'Inhale gently through your nose...';
      phaseColor = 'text-violet-700';
      ringColor = 'border-violet-400 bg-violet-100/70 shadow-lg shadow-violet-200';
    } else if (phase === 'exhale') {
      scaleClass = 'scale-90 transition-transform duration-1000 ease-in';
      phaseText = 'Exhale softly through your mouth...';
      phaseColor = 'text-emerald-700';
      ringColor = 'border-emerald-300 bg-emerald-50/70 shadow-md shadow-emerald-100';
    }
  }

  if (isCompleted) {
    return (
      <WellnessCompletionScreen
        activityTitle={`Guided Breathing (${pattern.name})`}
        durationMinutes={targetDurationMinutes}
        message="Mindful breathing restores autonomic balance and calms physical stress indicators."
        onReturnToStudio={onBack}
        onRepeat={handleStart}
        secondaryActionText="Breathe Again"
      />
    );
  }

  const progressPercent = Math.min(100, Math.round((totalElapsedSeconds / totalTargetSeconds) * 100));

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Wellness Studio
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="violet" icon={<Wind className="w-3.5 h-3.5" />}>
            Guided Breathing
          </Badge>
          <Badge variant="slate">Offline Studio</Badge>
        </div>
      </div>

      {/* Main Interactive Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft space-y-6 text-center">
        {/* Title & Pattern Selector */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
            Rhythmic Breathing & Autonomic Reset
          </h2>
          <p className="text-xs sm:text-sm text-mindora-mutedText max-w-md mx-auto">
            Choose a non-straining pace to calm your heart rate and ground your collegiate routine.
          </p>

          {/* Configuration when not running */}
          {!isActive && (
            <div className="pt-3 space-y-4 max-w-lg mx-auto">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-mindora-primary uppercase tracking-wider">
                  Select Breathing Pattern
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(Object.keys(BREATHING_PATTERNS) as BreathingPatternId[]).map((pId) => {
                    const pat = BREATHING_PATTERNS[pId];
                    const isSelected = patternId === pId;
                    return (
                      <button
                        key={pId}
                        type="button"
                        onClick={() => setPatternId(pId)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-violet-50/90 border-violet-400 ring-2 ring-violet-200'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-mindora-darkText">
                          {pId === 'gentle' ? 'Gentle (3s/4s)' : pId === 'balanced' ? 'Balanced (4s/4s)' : 'Long Exhale (3s/5s)'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          {pat.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Duration Selector */}
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-mindora-primary uppercase tracking-wider">
                  Session Duration
                </label>
                <div className="flex gap-2">
                  {BREATHING_DURATIONS_MINUTES.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTargetDurationMinutes(mins)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        targetDurationMinutes === mins
                          ? 'bg-mindora-primary text-white border-mindora-primary shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Animated Breathing Circle Display */}
        <div className="py-6 sm:py-10 flex flex-col items-center justify-center">
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-700 motion-reduce:transform-none ${ringColor} ${
              isActive && !isPaused ? scaleClass : ''
            }`}
          >
            <div className={`text-2xl sm:text-4xl font-black ${phaseColor} tracking-tight`}>
              {isActive ? secondsRemainingInPhase : pattern.inhaleSeconds}
            </div>
            <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${phaseColor}`}>
              {isActive ? phase : 'Ready'}
            </div>
          </div>

          {/* Phase Guidance Instruction */}
          <div className="mt-5 space-y-1">
            <div className={`text-sm sm:text-base font-bold ${phaseColor}`}>
              {isPaused ? 'Paused — take a natural breath' : phaseText}
            </div>
            {isActive && (
              <div className="text-xs text-slate-500">
                Cycle {currentCycle} • {Math.floor(totalElapsedSeconds / 60)}:
                {String(totalElapsedSeconds % 60).padStart(2, '0')} / {targetDurationMinutes}:00
              </div>
            )}
          </div>

          {/* Overall Progress Bar */}
          {isActive && (
            <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
              <div
                className="bg-mindora-primary h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Breathing session progress"
              />
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {!isActive ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Start Breathing Practice
            </Button>
          ) : (
            <>
              {isPaused ? (
                <Button
                  variant="primary"
                  onClick={handleResume}
                  icon={<Play className="w-4 h-4 fill-current" />}
                >
                  Resume
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handlePause}
                  icon={<Pause className="w-4 h-4" />}
                >
                  Pause
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleStop}
                icon={<Square className="w-4 h-4" />}
                className="text-slate-600 hover:text-red-700 hover:bg-red-50"
              >
                Stop Exercise
              </Button>
            </>
          )}
        </div>

        {/* Safety & Responsible Guidance Note */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-left text-xs text-amber-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Safety Guidance:</strong> If you feel uncomfortable, dizzy, or short of breath, stop the exercise and return to your normal breathing. Breathing practices are educational relaxation aids and not medical treatments for clinical anxiety, panic disorders, or respiratory illness.
          </div>
        </div>
      </div>
    </div>
  );
};
