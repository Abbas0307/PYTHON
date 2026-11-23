import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Zap,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { WeeklyTrendsSection } from '../components/trends/WeeklyTrendsSection';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface WeeklyInsightsScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  isPreviewMode?: boolean;
}

interface DailyBreakdownItem {
  date: string;
  day_name: string;
  has_assessment: boolean;
  stress_score: number | null;
  interpretation: string | null;
  status_tier: string | null;
  phq9_score: number | null;
}

interface WeeklyAnalyticsData {
  week_start: string;
  week_end: string;
  weekly_average: number | null;
  highest_score: number | null;
  lowest_score: number | null;
  logged_days_count: number;
  total_days: number;
  consistency_percentage: number;
  change_vs_previous_week: number | null;
  trend_direction: string;
  daily_breakdown: DailyBreakdownItem[];
}

export const WeeklyInsightsScreen: React.FC<WeeklyInsightsScreenProps> = ({
  onNavigate,
  isPreviewMode = false
}) => {
  const [analytics, setAnalytics] = useState<WeeklyAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeeklyAnalytics = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('mindora_auth_token') ||
                    localStorage.getItem('mindora_auth_token') ||
                    localStorage.getItem('session_token') || '';

      const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
      const res = await fetch(`${getApiBaseUrl()}/api/student/analytics/weekly?timezone=${encodeURIComponent(clientTz)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const json = await res.json();
      if (json.status === 'success' && json.data) {
        const d = json.data;
        const normalized: WeeklyAnalyticsData = {
          week_start: d.week_start || d.start_date || '',
          week_end: d.week_end || d.end_date || '',
          weekly_average: d.weekly_average !== undefined ? d.weekly_average : null,
          highest_score: d.highest_score !== undefined ? d.highest_score : null,
          lowest_score: d.lowest_score !== undefined ? d.lowest_score : null,
          logged_days_count: d.logged_days_count !== undefined ? d.logged_days_count : (d.assessments_count || 0),
          total_days: d.total_days || 7,
          consistency_percentage: d.consistency_percentage !== undefined ? d.consistency_percentage : 0,
          change_vs_previous_week: d.change_vs_previous_week !== undefined ? d.change_vs_previous_week : (d.change_from_previous_week !== undefined ? d.change_from_previous_week : null),
          trend_direction: d.trend_direction || 'stable',
          daily_breakdown: (d.daily_breakdown || d.daily_records || []).map((r: any) => ({
            date: r.date || '',
            day_name: r.day_name || r.day || '',
            has_assessment: Boolean(r.has_assessment),
            stress_score: r.stress_score !== undefined && r.stress_score !== null ? Number(r.stress_score) : null,
            interpretation: r.interpretation || null,
            status_tier: r.status_tier || null,
            phq9_score: r.phq9_score !== undefined ? r.phq9_score : null
          }))
        };
        setAnalytics(normalized);
      }
    } catch (err: any) {
      console.error('Failed to load weekly analytics:', err);
      setError('Unable to synchronize weekly analytics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeeklyAnalytics();

    const handleSync = () => {
      fetchWeeklyAnalytics(false);
    };

    window.addEventListener('mindora:assessment-submitted', handleSync);
    window.addEventListener('mindora:stress-updated', handleSync);

    return () => {
      window.removeEventListener('mindora:assessment-submitted', handleSync);
      window.removeEventListener('mindora:stress-updated', handleSync);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchWeeklyAnalytics(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Error alert if any */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            Weekly Insights & Trends
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Authoritative 7-day academic stress breakdown and wellbeing trajectory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Analytics
          </Button>
          <Button
            size="sm"
            onClick={() => onNavigate('assessment')}
            className="text-xs"
          >
            <ClipboardList className="w-4 h-4 mr-1.5" />
            Take Daily Assessment
          </Button>
        </div>
      </div>

      {/* Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Card 1: Weekly Average */}
        <Card className="p-4 border-gray-200 dark:border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Weekly Average</span>
            <TrendingUp className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {isLoading
              ? '...'
              : analytics?.weekly_average !== null && analytics?.weekly_average !== undefined
              ? `${analytics.weekly_average.toFixed(1)}%`
              : '—'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {analytics?.weekly_average !== null && analytics?.weekly_average !== undefined
              ? 'Average of recorded days'
              : 'No assessments logged this week'}
          </p>
        </Card>

        {/* Card 2: Highest & Lowest Stress Range */}
        <Card className="p-4 border-gray-200 dark:border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Weekly Range</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {isLoading
              ? '...'
              : analytics?.highest_score !== null && analytics?.highest_score !== undefined
              ? `${analytics.lowest_score}% – ${analytics.highest_score}%`
              : '—'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {analytics?.highest_score !== null ? 'Min and max stress levels' : 'Awaiting daily logs'}
          </p>
        </Card>

        {/* Card 3: Consistency */}
        <Card className="p-4 border-gray-200 dark:border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Rhythm Consistency</span>
            <Calendar className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {isLoading
              ? '...'
              : `${analytics?.logged_days_count || 0} / 7`}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {analytics?.consistency_percentage
              ? `${analytics.consistency_percentage.toFixed(0)}% completion rate`
              : '0% completion rate'}
          </p>
        </Card>

        {/* Card 4: Change vs Previous Week */}
        <Card className="p-4 border-gray-200 dark:border-gray-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Week-over-Week</span>
            {analytics?.change_vs_previous_week !== null && analytics?.change_vs_previous_week !== undefined ? (
              analytics.change_vs_previous_week < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
              ) : analytics.change_vs_previous_week > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-amber-500" />
              ) : (
                <Minus className="w-4 h-4 text-gray-400" />
              )
            ) : (
              <Shield className="w-4 h-4 text-blue-500" />
            )}
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {isLoading
              ? '...'
              : analytics?.change_vs_previous_week !== null && analytics?.change_vs_previous_week !== undefined
              ? `${analytics.change_vs_previous_week < 0 ? '↓ ' : '↑ '}${Math.abs(analytics.change_vs_previous_week).toFixed(1)}%`
              : 'Baseline'}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {analytics?.change_vs_previous_week !== null && analytics?.change_vs_previous_week !== undefined
              ? analytics.change_vs_previous_week < 0
                ? 'Stress decreased vs last week'
                : 'Stress increased vs last week'
              : 'Initial week benchmark'}
          </p>
        </Card>
      </div>

      {/* 7-DAY DAILY BREAKDOWN CARD */}
      <Card className="p-5 sm:p-6 border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              7-Day Daily Assessment Breakdown (Monday – Sunday)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Current Week: {analytics?.week_start || '—'} to {analytics?.week_end || '—'} • Unlogged days are never treated as 0
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Logged Day
            </span>
            <span className="flex items-center gap-1.5 text-gray-400">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" /> Unlogged
            </span>
          </div>
        </div>

        {/* 7-Day Columns */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4">
          {(analytics?.daily_breakdown || [
            { day_name: 'Mon', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null },
            { day_name: 'Tue', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null },
            { day_name: 'Wed', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null },
            { day_name: 'Thu', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null },
            { day_name: 'Fri', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null },
            { day_name: 'Sat', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null },
            { day_name: 'Sun', date: '', has_assessment: false, stress_score: null, interpretation: null, status_tier: null, phq9_score: null }
          ]).map((day, idx) => {
            const hasData = day.has_assessment && day.stress_score !== null;
            return (
              <div
                key={day.date || idx}
                className={`p-3 rounded-xl border flex flex-col items-center justify-between min-h-[170px] transition-all ${
                  hasData
                    ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800/80 shadow-xs'
                    : 'bg-gray-50/40 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800 opacity-70'
                }`}
              >
                {/* Day Header */}
                <div className="text-center">
                  <p className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                    {day.day_name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {day.date ? day.date.slice(5) : ''}
                  </p>
                </div>

                {/* Score or Not Logged */}
                <div className="my-auto text-center w-full">
                  {hasData ? (
                    <div className="space-y-1">
                      <div className="text-lg sm:text-xl font-black text-brand-600 dark:text-brand-400">
                        {day.stress_score}%
                      </div>
                      <div className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 truncate">
                        {day.status_tier || 'Recorded'}
                      </div>
                      {day.phq9_score !== null && (
                        <div className="text-[9px] text-gray-500">
                          PHQ: {day.phq9_score}/27
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-3">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 block">
                        Not Logged
                      </span>
                      <span className="text-[10px] text-gray-300 dark:text-gray-700 block mt-0.5">
                        No data
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Indicator Dot / Bar */}
                <div className="w-full pt-1 border-t border-gray-100 dark:border-gray-800 text-center">
                  {hasData ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Logged
                    </span>
                  ) : (
                    <span className="text-[9px] text-gray-400 dark:text-gray-600">
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Production Reused Weekly Trends Component */}
      <div className="bg-white dark:bg-gray-850 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs">
        <WeeklyTrendsSection isPreviewMode={isPreviewMode} />
      </div>
    </div>
  );
};
