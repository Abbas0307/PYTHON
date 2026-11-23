import React from 'react';
import { Sparkles, CheckCircle2, RotateCcw, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface WellnessCompletionScreenProps {
  activityTitle: string;
  durationMinutes: number;
  message?: string;
  onReturnToStudio: () => void;
  onRepeat?: () => void;
  secondaryActionText?: string;
}

export const WellnessCompletionScreen: React.FC<WellnessCompletionScreenProps> = ({
  activityTitle,
  durationMinutes,
  message = 'Every micro-moment you dedicate to your wellbeing restores mental balance.',
  onReturnToStudio,
  onRepeat,
  secondaryActionText = 'Repeat Practice'
}) => {
  return (
    <div
      role="region"
      aria-label="Activity Completed"
      className="bg-gradient-to-b from-violet-50/80 via-white to-purple-50/40 p-6 sm:p-10 rounded-3xl border border-mindora-border shadow-soft text-center max-w-xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-violet-500 to-purple-600 text-white rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-violet-200">
        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-center gap-2">
          <Badge variant="violet" icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}>
            Activity Finished
          </Badge>
          <Badge variant="slate">{durationMinutes} min session</Badge>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
          Well Done Taking Time For Yourself
        </h3>
        <p className="text-xs sm:text-sm text-mindora-mutedText max-w-md mx-auto leading-relaxed">
          You completed <strong className="text-mindora-primary font-bold">{activityTitle}</strong>. {message}
        </p>
      </div>

      <div className="p-3.5 bg-white/90 border border-violet-100 rounded-2xl text-xs text-slate-600 flex items-center justify-center gap-2">
        <Heart className="w-4 h-4 text-violet-500 shrink-0" />
        <span>This practice was recorded in volatile session memory. Zero cloud tracking.</span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          variant="primary"
          onClick={onReturnToStudio}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Return to Wellness Studio
        </Button>
        {onRepeat && (
          <Button
            variant="outline"
            onClick={onRepeat}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            {secondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
};
