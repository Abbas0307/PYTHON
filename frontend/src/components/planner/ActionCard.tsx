import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  SkipForward,
  Calendar,
  BookOpen,
  XCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import type { DailyPlanItem } from '../../contracts/plannerContract.ts';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface ActionCardProps {
  item: DailyPlanItem;
  onViewInstructions: (item: DailyPlanItem) => void;
  onMarkComplete: (actionId: string) => void;
  onSkip: (actionId: string) => void;
  onPostpone: (actionId: string) => void;
  onDismiss: (actionId: string) => void;
  onUndoStatus: (actionId: string) => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  item,
  onViewInstructions,
  onMarkComplete,
  onSkip,
  onPostpone,
  onDismiss,
  onUndoStatus
}) => {
  const [showRationale, setShowRationale] = useState<boolean>(false);
  const { action, status, priority, whySuggested } = item;

  const isCompleted = status === 'completed';
  const isSkipped = status === 'skipped';
  const isPostponed = status === 'postponed';

  // Category badge variant mapping
  const getCategoryVariant = (category: string): 'violet' | 'slate' | 'amber' | 'emerald' => {
    switch (category) {
      case 'Study & Focus':
        return 'violet';
      case 'Sleep Routine':
        return 'slate';
      case 'Daily Movement':
        return 'emerald';
      case 'Time Management':
        return 'amber';
      case 'Relaxation':
        return 'violet';
      default:
        return 'slate';
    }
  };

  return (
    <Card
      hoverable={!isCompleted && !isSkipped && !isPostponed}
      className={`flex flex-col justify-between space-y-4 border transition-all duration-200 ${
        isCompleted
          ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
          : isSkipped
          ? 'bg-slate-50/70 border-slate-200 opacity-70'
          : isPostponed
          ? 'bg-amber-50/40 border-amber-200 opacity-80'
          : 'bg-white border-mindora-border'
      }`}
    >
      <div className="space-y-3">
        {/* Top Badges & Priority */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={getCategoryVariant(action.category)}>
              {action.category}
            </Badge>
            <Badge variant="slate" className="text-[10px]">
              <Clock className="w-2.5 h-2.5 mr-1 inline" />
              {action.estimatedDuration}m
            </Badge>
            <Badge
              variant={priority === 'high' ? 'violet' : priority === 'medium' ? 'slate' : 'slate'}
              className="text-[10px] uppercase font-bold"
            >
              {priority} priority
            </Badge>
          </div>

          {!isCompleted && !isSkipped && !isPostponed && (
            <button
              onClick={() => onDismiss(action.id)}
              aria-label={`Dismiss recommendation ${action.title}`}
              title="Dismiss and suggest another action"
              className="p-1 text-slate-300 hover:text-slate-500 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3
            className={`font-bold text-sm sm:text-base leading-snug ${
              isCompleted
                ? 'text-emerald-950 line-through decoration-emerald-500/50'
                : 'text-mindora-darkText'
            }`}
          >
            {action.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {action.shortDescription}
          </p>
        </div>

        {/* Transparent Rationale Accordion */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowRationale(!showRationale)}
            aria-expanded={showRationale}
            className="text-[11px] font-semibold text-mindora-primary flex items-center gap-1 hover:underline"
          >
            <HelpCircle className="w-3 h-3" />
            <span>{showRationale ? 'Hide context' : 'Why this was suggested'}</span>
          </button>
          {showRationale && (
            <div className="mt-1.5 p-2.5 bg-mindora-surface/80 rounded-xl border border-mindora-border/60 text-[11px] text-slate-700 leading-snug animate-in fade-in duration-150">
              {whySuggested}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer & Buttons */}
      <div className="pt-2 border-t border-slate-100/80 space-y-2">
        {isCompleted ? (
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Completed today
            </span>
            <button
              type="button"
              onClick={() => onUndoStatus(action.id)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Undo
            </button>
          </div>
        ) : isSkipped ? (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 italic">
              Skipped for today
            </span>
            <button
              type="button"
              onClick={() => onUndoStatus(action.id)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 underline"
            >
              Restore
            </button>
          </div>
        ) : isPostponed ? (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 italic">
              Postponed
            </span>
            <button
              type="button"
              onClick={() => onUndoStatus(action.id)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 underline"
            >
              Restore
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onViewInstructions(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-mindora-primary bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Instructions
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSkip(action.id)}
                title="Skip this action today"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={`Skip ${action.title}`}
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onPostpone(action.id)}
                title="Postpone this action"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={`Postpone ${action.title}`}
              >
                <Calendar className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onMarkComplete(action.id)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-mindora-primary hover:bg-violet-700 rounded-xl shadow-2xs transition-all active:scale-95"
                aria-label={`Mark ${action.title} as completed`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
