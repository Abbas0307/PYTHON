import React from 'react';
import { Clock, Play } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface WellnessActivityCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  durationLabel: string;
  icon: React.ReactNode;
  accentGradient?: string;
  onStart: () => void;
  ctaText?: string;
}

export const WellnessActivityCard: React.FC<WellnessActivityCardProps> = ({
  title,
  description,
  category,
  durationLabel,
  icon,
  accentGradient = 'from-violet-500 to-purple-600',
  onStart,
  ctaText = 'Start Activity'
}) => {
  return (
    <Card className="flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-200 border-mindora-border/80 group">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${accentGradient} text-white flex items-center justify-center shrink-0 shadow-xs shadow-violet-200 group-hover:scale-105 transition-transform`}>
            {icon}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="violet">{category}</Badge>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-mindora-darkText group-hover:text-mindora-primary transition-colors leading-snug">
            {title}
          </h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-mindora-primary" />
          {durationLabel}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onStart}
          icon={<Play className="w-3 h-3 fill-current text-mindora-primary" />}
          className="group-hover:border-mindora-primary group-hover:bg-violet-50/50"
        >
          {ctaText}
        </Button>
      </div>
    </Card>
  );
};
