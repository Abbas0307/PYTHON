import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, ArrowLeft, Clock, Coffee, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  TIMER_PRESETS,
  playGentleChime,
  wellnessStore
} from '../../engines/wellnessEngine.ts';
import type { TimerMode, TimerPresetId } from '../../contracts/wellnessContract.ts';

interface FocusTimerProps {
  onBack: () => void;
  onComplete?: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ onBack, onComplete }) => {
  const [presetId, setPresetId] = useState<TimerPresetId>('25_5');
  const [mode, setMode] = useState<TimerMode>('focus');

  // Custom durations (in minutes)
  const [customFocusMin, setCustomFocusMin] = useState<number>(20);
  const [customBreakMin, setCustomBreakMin] = useState<number>(5);

  const selectedPreset = TIMER_PRESETS.find((p) => p.id === presetId)!;
  const currentTotalSeconds =
    presetId === 'custom'
      ? (mode === 'focus' ? customFocusMin : customBreakMin) * 60
      : (mode === 'focus' ? selectedPreset.focusMinutes : selectedPreset.breakMinutes) * 60;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(currentTotalSeconds);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [completionNotice, setCompletionNotice] = useState<string | null>(null);

  // Accurate time calculation refs
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimestampRef = useRef<number>(0);
  const targetDurationSecondsRef = useRef<number>(currentTotalSeconds);
  const accumulatedElapsedBeforePauseRef = useRef<number>(0);

  // Sync remaining seconds if preset or mode changes while inactive
  useEffect(() => {
    if (!isActive) {
      setRemainingSeconds(currentTotalSeconds);
      targetDurationSecondsRef.current = currentTotalSeconds;
      accumulatedElapsedBeforePauseRef.current = 0;
    }
  }, [presetId, mode, currentTotalSeconds, isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const clearTimerInterval = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimerTicker = () => {
    clearTimerInterval();
    startTimestampRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const currentSessionElapsed = Math.floor((now - startTimestampRef.current) / 1000);
      const totalElapsed = accumulatedElapsedBeforePauseRef.current + currentSessionElapsed;
      const secondsLeft = Math.max(0, targetDurationSecondsRef.current - totalElapsed);

      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0) {
        // Timer completed!
        clearTimerInterval();
        setIsActive(false);
        setIsPaused(false);
        accumulatedElapsedBeforePauseRef.current = 0;

        if (soundEnabled) {
          playGentleChime();
        }

        const completedDurationMin = Math.round(targetDurationSecondsRef.current / 60);

        if (mode === 'focus') {
          setCompletedCycles((c) => c + 1);
          setCompletionNotice(
            `Great work! Focus session completed (${completedDurationMin} min). Take a moment to stretch, breathe, or switch to your recovery break.`
          );
          wellnessStore.recordSession({
            experienceId: 'timer',
            title: `Focus Session (${completedDurationMin} min)`,
            durationMinutes: completedDurationMin
          });
          // Auto-prompt to break mode without auto-running
          setMode('break');
        } else {
          setCompletionNotice(
            `Break finished (${completedDurationMin} min). Re-anchor yourself whenever you are ready for your next study block.`
          );
          wellnessStore.recordSession({
            experienceId: 'timer',
            title: `Restorative Break (${completedDurationMin} min)`,
            durationMinutes: completedDurationMin
          });
          setMode('focus');
        }

        if (onComplete) onComplete();
      }
    }, 250); // Tick frequently to keep UI crisp and handle background tab wakeups accurately
  };

  const handleStart = () => {
    setCompletionNotice(null);
    targetDurationSecondsRef.current = currentTotalSeconds;
    accumulatedElapsedBeforePauseRef.current = 0;
    setIsActive(true);
    setIsPaused(false);
    startTimerTicker();
  };

  const handlePause = () => {
    clearTimerInterval();
    const now = Date.now();
    const currentSessionElapsed = Math.floor((now - startTimestampRef.current) / 1000);
    accumulatedElapsedBeforePauseRef.current += currentSessionElapsed;
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    startTimerTicker();
  };

  const handleReset = () => {
    clearTimerInterval();
    setIsActive(false);
    setIsPaused(false);
    accumulatedElapsedBeforePauseRef.current = 0;
    setRemainingSeconds(currentTotalSeconds);
    targetDurationSecondsRef.current = currentTotalSeconds;
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    clearTimerInterval();
    setIsActive(false);
    setIsPaused(false);
    accumulatedElapsedBeforePauseRef.current = 0;
    setMode(newMode);
  };

  // Circular SVG Progress calculation
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = currentTotalSeconds > 0 ? (currentTotalSeconds - remainingSeconds) / currentTotalSeconds : 0;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const themeColors =
    mode === 'focus'
      ? {
          stroke: 'stroke-violet-600',
          text: 'text-violet-700',
          bg: 'bg-violet-50/70',
          badge: 'violet' as const
        }
      : {
          stroke: 'stroke-emerald-600',
          text: 'text-emerald-700',
          bg: 'bg-emerald-50/70',
          badge: 'emerald' as const
        };

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
          <Badge variant={themeColors.badge} icon={<Clock className="w-3.5 h-3.5" />}>
            {mode === 'focus' ? 'Focus Interval' : 'Restorative Break'}
          </Badge>
          <Badge variant="slate">Accurate Timer</Badge>
        </div>
      </div>

      {/* Main Timer Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft space-y-6 text-center">
        {/* Mode Switcher Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleSwitchMode('focus')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                mode === 'focus'
                  ? 'bg-white text-violet-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Focus Mode
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode('break')}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                mode === 'break'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              Break Mode
            </button>
          </div>
        </div>

        {/* Completion Notice Toast */}
        {completionNotice && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl text-xs font-semibold flex items-start gap-2.5 text-left animate-in fade-in duration-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{completionNotice}</div>
            <button
              onClick={() => setCompletionNotice(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Presets Grid (Active when timer is not running) */}
        {!isActive && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto">
              {TIMER_PRESETS.map((preset) => {
                const isSelected = presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPresetId(preset.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-violet-50/80 border-violet-400 ring-2 ring-violet-200'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold text-mindora-darkText leading-tight">
                      {preset.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom duration inputs */}
            {presetId === 'custom' && (
              <div className="pt-2 flex items-center justify-center gap-4 text-xs font-medium text-slate-600">
                <label className="flex items-center gap-1.5">
                  <span>Focus (mins):</span>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={customFocusMin}
                    onChange={(e) => setCustomFocusMin(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 p-1.5 border border-slate-200 rounded-lg text-center font-bold"
                  />
                </label>
                <label className="flex items-center gap-1.5">
                  <span>Break (mins):</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={customBreakMin}
                    onChange={(e) => setCustomBreakMin(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 p-1.5 border border-slate-200 rounded-lg text-center font-bold"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {/* Circular Countdown Progress */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
              {/* Background track circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="10"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                className={`${themeColors.stroke} transition-all duration-300 motion-reduce:transition-none`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Digital Time Inside Circle */}
            <div className="absolute flex flex-col items-center">
              <span className={`text-4xl sm:text-5xl font-black ${themeColors.text} tracking-tight font-mono`}>
                {formattedTime}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                {isPaused ? 'Paused' : isActive ? (mode === 'focus' ? 'Studying' : 'Resting') : 'Ready'}
              </span>
            </div>
          </div>

          {/* Session Progress Stats */}
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-2">
            <span>Completed Blocks: <strong className="text-mindora-primary">{completedCycles}</strong></span>
            <span>•</span>
            <span>{selectedPreset.description}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {!isActive ? (
            <Button
              variant="primary"
              size="lg"
              onClick={handleStart}
              icon={<Play className="w-4 h-4 fill-current" />}
            >
              Start {mode === 'focus' ? 'Focus Session' : 'Break'}
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
                onClick={handleReset}
                icon={<RotateCcw className="w-4 h-4" />}
                className="text-slate-600 hover:text-slate-800"
              >
                Reset
              </Button>
            </>
          )}

          {/* Sound Toggle (Disabled by default) */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            aria-pressed={soundEnabled}
            aria-label={`Toggle completion sound: currently ${soundEnabled ? 'enabled' : 'disabled'}`}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled
                ? 'bg-violet-50 text-violet-700 border-violet-300'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime On' : 'Silent'}</span>
          </button>
        </div>

        {/* Gentle Ergonomic Advice */}
        <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
          Take breaks when your body requests them. You are never obligated to continue studying after a timer ends.
        </p>
      </div>
    </div>
  );
};
