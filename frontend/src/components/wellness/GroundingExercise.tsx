import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, Hand, Volume2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { GROUNDING_STEPS, wellnessStore } from '../../engines/wellnessEngine.ts';
import { WellnessCompletionScreen } from './WellnessCompletionScreen';

interface GroundingExerciseProps {
  onBack: () => void;
  onComplete?: () => void;
}

export const GroundingExercise: React.FC<GroundingExerciseProps> = ({ onBack, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const step = GROUNDING_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < GROUNDING_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      wellnessStore.recordSession({
        experienceId: 'grounding',
        title: '5-4-3-2-1 Sensory Grounding',
        durationMinutes: 5
      });
      if (onComplete) onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleNoteChange = (text: string) => {
    setNotes((prev) => ({ ...prev, [currentStepIndex]: text }));
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setNotes({});
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <WellnessCompletionScreen
        activityTitle="5-4-3-2-1 Sensory Grounding"
        durationMinutes={5}
        message="By anchoring your 5 physical senses to your immediate environment, you pulled attention out of cognitive rumination back into the present moment."
        onReturnToStudio={onBack}
        onRepeat={handleRestart}
        secondaryActionText="Repeat Grounding"
      />
    );
  }

  // Sense icon picker
  const getSenseIcon = (sense: string) => {
    switch (sense) {
      case 'see':
        return <Eye className="w-5 h-5 text-violet-600" />;
      case 'feel':
        return <Hand className="w-5 h-5 text-indigo-600" />;
      case 'hear':
        return <Volume2 className="w-5 h-5 text-blue-600" />;
      case 'smell':
        return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'taste':
      default:
        return <CheckCircle2 className="w-5 h-5 text-purple-600" />;
    }
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
          <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Sensory Grounding
          </Badge>
          <Badge variant="slate">5-4-3-2-1 Technique</Badge>
        </div>
      </div>

      {/* Main Grounding Wizard Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft space-y-6">
        {/* Step Progress Pill Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Step {currentStepIndex + 1} of 5</span>
            <span>Anchor Sense: {step.sense.toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {GROUNDING_STEPS.map((s, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={s.stepNumber}
                  className={`h-2 rounded-full transition-all ${
                    isPast
                      ? 'bg-mindora-primary'
                      : isCurrent
                      ? 'bg-violet-400 ring-2 ring-violet-200'
                      : 'bg-slate-100'
                  }`}
                  aria-label={`Step ${idx + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
              {getSenseIcon(step.sense)}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-mindora-primary">
                Acknowledge {step.count} Sensory Item{step.count > 1 ? 's' : ''}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-sm sm:text-base font-semibold text-slate-700 leading-snug">
            {step.prompt}
          </p>

          <p className="text-xs text-mindora-mutedText leading-relaxed">
            {step.guidanceText}
          </p>

          {/* Illustrative Collegiate Examples */}
          <div className="p-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
              Helpful Everyday Examples:
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              {step.examples.map((ex, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-mindora-primary font-bold">•</span>
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Optional Private Text Note (Strictly In-Memory) */}
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="grounding-note-input"
              className="text-[11px] font-bold text-slate-600 flex items-center justify-between"
            >
              <span>Optional: Jot down what you notice</span>
              <span className="text-[10px] text-slate-400 font-normal italic">Private in-memory scratchpad</span>
            </label>
            <textarea
              id="grounding-note-input"
              value={notes[currentStepIndex] || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="e.g. sunlight on my notebook, wooden texture of desk..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-mindora-primary bg-white resize-none"
            />
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-slate-500 hover:text-slate-700"
            >
              Skip Step
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
              {currentStepIndex === GROUNDING_STEPS.length - 1 ? 'Finish Grounding' : 'Next Step'}
            </Button>
          </div>
        </div>

        {/* In-Memory Privacy Disclaimer */}
        <div className="p-3 bg-violet-50/60 border border-violet-100 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
          <span>Notes remain strictly in transient browser memory and are never saved or transmitted.</span>
        </div>
      </div>
    </div>
  );
};
