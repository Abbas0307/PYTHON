import React from 'react';
import {
  Sparkles,
  BookOpen,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import type { TimelineEvent } from '../../contracts/activityTimelineContract';
import { Badge } from '../common/Badge';

interface ActivityTimelineItemProps {
  event: TimelineEvent;
}

export const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> = ({ event }) => {
  const getCategoryIcon = () => {
    switch (event.category) {
      case 'wellness':
        return <Sparkles className="w-4 h-4 text-violet-600" aria-hidden="true" />;
      case 'planner':
        return <BookOpen className="w-4 h-4 text-indigo-600" aria-hidden="true" />;
      case 'goals':
        return <Target className="w-4 h-4 text-emerald-600" aria-hidden="true" />;
      case 'checkin':
        return <Calendar className="w-4 h-4 text-amber-600" aria-hidden="true" />;
      case 'trends':
        return <TrendingUp className="w-4 h-4 text-slate-600" aria-hidden="true" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" aria-hidden="true" />;
    }
  };

  const getBadgeVariant = (): 'violet' | 'slate' | 'amber' | 'emerald' => {
    switch (event.category) {
      case 'wellness':
        return 'violet';
      case 'planner':
        return 'violet';
      case 'goals':
        return 'emerald';
      case 'checkin':
        return 'amber';
      case 'trends':
        return 'slate';
      default:
        return 'slate';
    }
  };

  return (
    <div className="relative pl-7 sm:pl-8 pb-5 last:pb-1 group">
      {/* Timeline vertical connector */}
      <div
        className="absolute left-3 sm:left-3.5 top-5 bottom-0 w-0.5 bg-slate-200 group-last:hidden"
        aria-hidden="true"
      />

      {/* Node bullet */}
      <div
        className="absolute left-1.5 sm:left-2 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-2xs group-hover:scale-110 transition-transform"
        aria-hidden="true"
      />

      {/* Event Card Content */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-indigo-200 hover:shadow-xs transition-all space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getBadgeVariant()} icon={getCategoryIcon()}>
              {event.categoryLabel}
            </Badge>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {event.sourceLabel}
            </span>

            {event.durationMinutes && (
              <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{event.durationMinutes} mins</span>
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-slate-400 self-start sm:self-auto">
            {event.displayDate} · {event.displayTime}
          </span>
        </div>

        <div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
            {event.title}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            {event.description}
          </p>
        </div>
      </div>
    </div>
  );
};
