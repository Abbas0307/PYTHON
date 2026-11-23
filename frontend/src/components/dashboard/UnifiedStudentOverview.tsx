import React from 'react';
import {
  Sparkles,
  Target,
  BookOpen,
  Shield,
  LifeBuoy,
  Layers
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface UnifiedStudentOverviewProps {
  wellbeingScore: number;
  activeGoalsCount: number;
  completedPlannerCount: number;
  completedWellnessCount: number;
  onOpenCrisis: () => void;
  onCustomizeLayout: () => void;
}

export const UnifiedStudentOverview: React.FC<UnifiedStudentOverviewProps> = ({
  wellbeingScore,
  activeGoalsCount,
  completedPlannerCount,
  completedWellnessCount,
  onOpenCrisis,
  onCustomizeLayout
}) => {
  const jumpLinks = [
    { href: '#daily_checkin', label: 'Check-In', icon: '☀️' },
    { href: '#personal_goals', label: 'Goals', icon: '🎯' },
    { href: '#adaptive_recommendations', label: 'Suggestions', icon: '✨' },
    { href: '#smart_action_planner', label: 'Action Plan', icon: '📋' },
    { href: '#activity_timeline', label: 'Timeline', icon: '🕒' },
    { href: '#wellness_studio', label: 'Wellness Studio', icon: '🌿' },
    { href: '#weekly_trends', label: 'Trends', icon: '📈' },
    { href: '#privacy_center', label: 'Privacy & Data', icon: '🛡️' }
  ];

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-violet-50/80 via-white to-indigo-50/60 border border-mindora-border shadow-soft space-y-4">
      {/* Top row: Status summary + Quick controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Connected Student Experience
          </Badge>
          <span className="text-xs text-slate-500 hidden md:inline">
            All tools operate 100% locally in private client memory
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={onCustomizeLayout}
            className="text-xs font-bold text-violet-700 hover:text-violet-900 bg-white hover:bg-violet-50 border border-violet-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Customize View</span>
          </button>

          <button
            onClick={onOpenCrisis}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>24/7 Helplines</span>
          </button>
        </div>
      </div>

      {/* 4 Connected Quick Glance Pillars */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-100 text-violet-700 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
              Lifestyle Balance
            </span>
            <span className="text-base font-extrabold text-violet-700">{wellbeingScore}%</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
              Active Goals
            </span>
            <span className="text-base font-extrabold text-emerald-800">{activeGoalsCount} Focus Areas</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
              Planner Micro-Steps
            </span>
            <span className="text-base font-extrabold text-indigo-800">{completedPlannerCount} Completed</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-100 text-teal-700 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-slate-400 block truncate">
              Restorative Practices
            </span>
            <span className="text-base font-extrabold text-teal-800">{completedWellnessCount} Sessions</span>
          </div>
        </div>
      </div>

      {/* Quick Jump Bar */}
      <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1 hidden sm:inline">
          Jump to:
        </span>
        {jumpLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-slate-700 border border-slate-200/80 hover:border-violet-300 font-semibold text-[11px] shrink-0 transition-all shadow-2xs hover:text-violet-700 flex items-center gap-1"
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
