import React from 'react';
import { Search } from 'lucide-react';
import type {
  TimelineCategoryFilter,
  TimelineDateFilter,
  TimelineFilterOptions
} from '../../contracts/activityTimelineContract';

interface ActivityTimelineFiltersProps {
  filters: TimelineFilterOptions;
  onFilterChange: (updated: TimelineFilterOptions) => void;
  totalEventsCount: number;
  filteredCount: number;
}

export const ActivityTimelineFilters: React.FC<ActivityTimelineFiltersProps> = ({
  filters,
  onFilterChange,
  totalEventsCount,
  filteredCount
}) => {
  const categoryOptions: { id: TimelineCategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Activities' },
    { id: 'wellness', label: 'Wellness Studio' },
    { id: 'planner', label: 'Action Planner' },
    { id: 'goals', label: 'Personal Goals' },
    { id: 'checkin', label: 'Daily Check-Ins' },
    { id: 'trends', label: 'Weekly Trends' }
  ];

  const dateOptions: { id: TimelineDateFilter; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'this_week', label: 'This Week' }
  ];

  return (
    <div className="space-y-3 p-3.5 sm:p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs">
      {/* Top search & summary counter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search activities or categories..."
            value={filters.searchQuery || ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                searchQuery: e.target.value
              })
            }
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <span className="text-[11px] font-semibold text-slate-500 self-end sm:self-auto">
          Showing <strong className="text-slate-800">{filteredCount}</strong> of {totalEventsCount} recorded actions
        </span>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Category:
        </span>
        {categoryOptions.map((opt) => {
          const isActive = filters.category === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange({ ...filters, category: opt.id })}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Date range filters */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
          Timeframe:
        </span>
        {dateOptions.map((opt) => {
          const isActive = filters.dateRange === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onFilterChange({ ...filters, dateRange: opt.id })}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-500 hover:bg-white hover:text-slate-800'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
