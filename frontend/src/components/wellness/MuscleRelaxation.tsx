import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldAlert, Heart, Activity } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { PMR_MUSCLE_GROUPS, wellnessStore } from '../../engines/wellnessEngine.ts';
import { WellnessCompletionScreen } from './WellnessCompletionScreen';

interface MuscleRelaxationProps {
  onBack: () => void;
  onComplete?: () => void;
}

export const MuscleRelaxation: React.FC<MuscleRelaxationProps> = ({ onBack, onComplete }) => {
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0);
  const [useNoMovementMode, setUseNoMovementMode] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const group = PMR_MUSCLE_GROUPS[currentGroupIndex];

  const handleNext = () => {
    if (currentGroupIndex < PMR_MUSCLE_GROUPS.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      wellnessStore.recordSession({
        experienceId: 'muscle_relaxation',
        title: 'Progressive Muscle Relaxation (5 Groups)',
        durationMinutes: 7
      });
      if (onComplete) onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleRestart = () => {
    setCurrentGroupIndex(0);
    setUseNoMovementMode(false);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <WellnessCompletionScreen
        activityTitle="Progressive Muscle Relaxation"
        durationMinutes={7}
        message="Systematic physical release signals deep safety to your autonomic nervous system, clearing physical stress stored in collegiate postural muscles."
        onReturnToStudio={onBack}
        onRepeat={handleRestart}
        secondaryActionText="Repeat Relaxation"
      />
    );
  }

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
          <Badge variant="violet" icon={<Activity className="w-3.5 h-3.5" />}>
            Muscle Relaxation
          </Badge>
          <Badge variant="slate">Gentle Physical Decompression</Badge>
        </div>
      </div>

      {/* Main PMR Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft space-y-6">
        {/* Step Progress Pill Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Muscle Group {currentGroupIndex + 1} of 5</span>
            <span className="text-mindora-primary font-bold">{group.name}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {PMR_MUSCLE_GROUPS.map((g, idx) => {
              const isPast = idx < currentGroupIndex;
              const isCurrent = idx === currentGroupIndex;
              return (
                <div
                  key={g.id}
                  className={`h-2 rounded-full transition-all ${
                    isPast
                      ? 'bg-mindora-primary'
                      : isCurrent
                      ? 'bg-violet-400 ring-2 ring-violet-200'
                      : 'bg-slate-100'
                  }`}
                  aria-label={`Group ${idx + 1}: ${g.name}`}
                />
              );
            })}
          </div>
        </div>

        {/* Muscle Group Details */}
        <div className="space-y-4 pt-1">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mindora-primary">
              Focus Area: {group.focusArea}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
              {group.name}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Why students hold tension here:</strong> {group.whyThisArea}
            </p>
          </div>

          {/* Toggle for No-Movement Alternative Mode */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                No-Movement / Awareness Only Mode
              </span>
              <span className="text-[11px] text-slate-500">
                Prefer not to tense muscles? Relax purely through mindful body awareness.
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={useNoMovementMode}
              onClick={() => setUseNoMovementMode(!useNoMovementMode)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                useNoMovementMode ? 'bg-mindora-primary' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  useNoMovementMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Practice Instructions Card */}
          <div className="p-4 sm:p-5 rounded-2xl border space-y-3 bg-violet-50/40 border-violet-100">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-900 block">
              {useNoMovementMode ? 'Mindful Awareness Guidance:' : 'Gentle Tension & Release Guidance:'}
            </span>

            {useNoMovementMode ? (
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic bg-white/80 p-3.5 rounded-xl border border-violet-100">
                "{group.noMovementAlternative}"
              </p>
            ) : (
              <ul className="text-xs sm:text-sm text-slate-700 space-y-2">
                {group.gentleInstructions.map((inst, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-violet-200/80 text-violet-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{inst}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Group Safety Specifics */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <Heart className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />
            <span>{group.safetyNote}</span>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentGroupIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-slate-500 hover:text-slate-700"
            >
              Skip Group
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
            >
              Stop
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {currentGroupIndex === PMR_MUSCLE_GROUPS.length - 1 ? 'Finish Relaxation' : 'Next Group'}
            </Button>
          </div>
        </div>

        {/* Global Safety & Disclaimer */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-left text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Safety Invariant:</strong> Never tense muscles forcefully or hold painful positions. Skip any area that feels tender, injured, or uncomfortable. Progressive muscle relaxation is a self-care relaxation technique and not clinical physical therapy or psychiatric care.
          </div>
        </div>
      </div>
    </div>
  );
};
