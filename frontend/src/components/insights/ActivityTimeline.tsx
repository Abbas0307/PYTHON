import React, { useState } from 'react';
import {
  History,
  RotateCcw,
  Sparkles,
  CalendarCheck2
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { TimelineFilterOptions } from '../../contracts/activityTimelineContract';
import {
  clearEligibleTimelineData,
  filterActivityTimeline,
  getUnifiedActivityTimeline
} from '../../engines/activityTimelineEngine';
import { ActivityTimelineFilters } from './ActivityTimelineFilters';
import { ActivityTimelineItem } from './ActivityTimelineItem';

interface ActivityTimelineProps {
  onTimelineCleared?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ onTimelineCleared }) => {
  const [filters, setFilters] = useState<TimelineFilterOptions>({
    category: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const allEvents = getUnifiedActivityTimeline();
  const filteredEvents = filterActivityTimeline(allEvents, filters);

  const handleClear = () => {
    const res = clearEligibleTimelineData('all_timeline');
    setShowClearConfirm(false);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 4000);
    if (onTimelineCleared) onTimelineCleared();
  };

  return (
    <Card className="p-5 sm:p-6 lg:p-7 border border-mindora-border/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <History className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              My Activity Timeline
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {allEvents.length} Recorded
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Factual chronological overview of your voluntary practices, planner micro-steps, and check-in milestones.
          </p>
        </div>

        {allEvents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
            className="text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 self-end sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
            <span>Clear Eligible Activity</span>
          </Button>
        )}
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between"
        >
          <span>{statusMessage}</span>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold text-emerald-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation modal for clearing activity */}
      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs text-rose-950 space-y-3"
        >
          <div className="space-y-1">
            <span className="font-bold text-rose-900 block text-sm">
              Clear Eligible Activity Timeline Records?
            </span>
            <p className="leading-relaxed">
              This will clear completed Wellness Studio session counters and Smart Action Planner completed items.
              Your saved goals and encrypted Weekly Trends vault will remain completely intact.
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="bg-white text-rose-700 border-rose-300 hover:bg-rose-100 font-bold"
            >
              Yes, Clear Activity Records
            </Button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <ActivityTimelineFilters
        filters={filters}
        onFilterChange={setFilters}
        totalEventsCount={allEvents.length}
        filteredCount={filteredEvents.length}
      />

      {/* Timeline List */}
      {filteredEvents.length > 0 ? (
        <div className="pt-2 space-y-1">
          {filteredEvents.map((event) => (
            <ActivityTimelineItem key={event.id} event={event} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-10 text-center space-y-3 bg-slate-50/60 rounded-3xl border border-dashed border-slate-200 p-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <CalendarCheck2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              No Timeline Activities Found
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {allEvents.length === 0
                ? 'Your timeline is ready. As you complete focus sessions in the Wellness Studio, check off action steps in the planner, or log daily reflections, they will appear here chronologically.'
                : 'No activities match your current search or category filter. Try clearing filters to view all recorded actions.'}
            </p>
          </div>
          {allEvents.length === 0 && (
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <a
                href="#wellness_studio"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try a 2-Min Breathing Exercise</span>
              </a>
              <a
                href="#smart_action_planner"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors"
              >
                <span>View Today’s Action Plan</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Non-Diagnostic Disclaimer */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>
          🛡️ Mindora never equates completed action volume to psychiatric recovery or clinical severity.
        </span>
        <span className="font-semibold text-slate-500">
          Purely student-driven · 100% Client-Side
        </span>
      </div>
    </Card>
  );
};
