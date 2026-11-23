import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Shield
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface PersonalizedActivity {
  id: number;
  activity_key: string;
  name: string;
  category: string;
  reason: string;
  why_recommended?: string;
  duration_minutes: number;
  effort_level: string;
  action_route: string;
  status: 'recommended' | 'started' | 'completed' | 'skipped';
  band: string;
}

interface BandInfo {
  band_id: string;
  name: string;
  score_range: [number, number];
  description: string;
  priority_categories: string[];
}

interface EngagementMetrics {
  completed_activities_count: number;
  total_recommended_count: number;
  current_streak_days: number;
  rest_day_flexibility: string;
  badges: Array<{
    id: string;
    title: string;
    description: string;
    unlocked: boolean;
  }>;
}

interface PersonalizedActivitiesScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
}

export const PersonalizedActivitiesScreen: React.FC<PersonalizedActivitiesScreenProps> = ({
  onNavigate
}) => {
  const [band, setBand] = useState<BandInfo | null>(null);
  const [activities, setActivities] = useState<PersonalizedActivity[]>([]);
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const getAuthToken = () => {
    return (
      sessionStorage.getItem('mindora_auth_token') ||
      localStorage.getItem('mindora_auth_token') ||
      localStorage.getItem('session_token') ||
      localStorage.getItem('auth_token') ||
      'local_dev_session'
    );
  };

  const fetchRecommendations = async (forceRefresh = false) => {
    setIsLoading(true);
    try {
      const token = getAuthToken();
      const base = getApiBaseUrl();
      const url = forceRefresh
        ? `${base}/api/personalization/recommendations?force_refresh=true`
        : `${base}/api/personalization/recommendations`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setBand(json.data.band);
          setActivities(json.data.recommendations || []);
        }
      }

      // Fetch engagement metrics
      const engRes = await fetch(`${base}/api/personalization/engagement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (engRes.ok) {
        const engJson = await engRes.json();
        setMetrics(engJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();

    const handleSync = () => {
      fetchRecommendations(true);
    };

    window.addEventListener('mindora:assessment-submitted', handleSync);
    return () => {
      window.removeEventListener('mindora:assessment-submitted', handleSync);
    };
  }, []);

  const handleStatusChange = async (activityId: number, newStatus: 'started' | 'completed' | 'skipped') => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiBaseUrl()}/api/personalization/activity-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          activity_id: activityId,
          status: newStatus
        })
      });

      if (res.ok) {
        setActionSuccessMsg(
          newStatus === 'completed'
            ? 'Great job! Practice completed and logged toward your wellness milestone.'
            : newStatus === 'skipped'
            ? 'Activity skipped. We will adjust future suggestions to your pacing.'
            : 'Activity started! Take your time.'
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
        // Refresh local list
        fetchRecommendations();
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleStartRoute = (route: string) => {
    if (route === 'breathing') onNavigate('breathing');
    else if (route === 'grounding') onNavigate('grounding');
    else if (route === 'focus_timer') onNavigate('focus_timer');
    else if (route === 'daily_checkin') onNavigate('daily_checkin');
    else if (route === 'wellness_studio') onNavigate('wellness_studio');
    else onNavigate('wellness_studio');
  };

  const getBandBadgeColor = (bandId?: string) => {
    switch (bandId) {
      case 'BAND_A':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'BAND_B':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'BAND_C':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'BAND_D':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-brand-600" />
            Personalized Activities
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Intelligent, non-diagnostic task assignment aligned with your current academic rhythm.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchRecommendations(true)}
          disabled={isLoading}
          className="text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Request Fresh Suggestions
        </Button>
      </div>

      {actionSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Current Wellbeing Band Card */}
      {band && (
        <Card className="p-5 border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Active Indicator Band
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBandBadgeColor(
                    band.band_id
                  )}`}
                >
                  {band.name}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{band.description}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-850 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shrink-0">
              <Shield className="w-4 h-4 text-brand-600 shrink-0" />
              <span>Non-diagnostic wellness pacing. Never graded or evaluated.</span>
            </div>
          </div>
        </Card>
      )}

      {/* Top 3 Personalized Activity Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            Top Tailored Practices ({activities.length} of max 3 active)
          </h2>
          <span className="text-xs text-gray-400">Zero penalty for skipped activities</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-400">
            Personalizing wellness recommendations...
          </div>
        ) : activities.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              All caught up!
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              You have completed or reviewed all current suggestions. Click below whenever you'd like new practices.
            </p>
            <Button size="sm" onClick={() => fetchRecommendations(true)}>
              Generate New Recommendations
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {activities.map((act) => {
              const isCompleted = act.status === 'completed';

              return (
                <Card
                  key={act.id}
                  className={`p-5 flex flex-col justify-between border-gray-200 dark:border-gray-800 transition shadow-xs hover:shadow-md ${
                    isCompleted ? 'opacity-70 bg-gray-50 dark:bg-gray-900/60' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        {act.category}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                        {act.effort_level}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug">
                      {act.name}
                    </h3>

                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {act.why_recommended || act.reason}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 pt-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{act.duration_minutes} min duration</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-gray-100 dark:border-gray-800/80 mt-4 space-y-2">
                    {isCompleted ? (
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Completed
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          className="w-full text-xs font-semibold"
                          onClick={() => {
                            handleStatusChange(act.id, 'started');
                            handleStartRoute(act.action_route);
                          }}
                        >
                          Start Practice
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(act.id, 'completed')}
                            className="flex-1 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition text-center border border-emerald-200 dark:border-emerald-800/60"
                          >
                            Mark Done
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(act.id, 'skipped')}
                            className="flex-1 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-center"
                          >
                            Skip (No penalty)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Engagement & Achievement Badges Section */}
      {metrics && (
        <Card className="p-6 border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Wellness Journey & Engagement
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pacing and consistency with rest-day flexibility.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="text-gray-600 dark:text-gray-300">
                Completed: <strong className="text-emerald-600">{metrics.completed_activities_count}</strong>
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Streak: <strong className="text-brand-600">{metrics.current_streak_days} days</strong>
                <span className="text-[10px] text-gray-400 font-normal ml-1">(Rest protected)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.badges.map((b) => (
              <div
                key={b.id}
                className={`p-3.5 rounded-xl border text-center transition ${
                  b.unlocked
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-xs'
                    : 'bg-gray-50 dark:bg-gray-850 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    b.unlocked
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold leading-tight">{b.title}</h4>
                <p className="text-[10px] leading-tight mt-1 opacity-80">{b.description}</p>
                <span className="text-[9px] uppercase tracking-wider font-semibold block mt-1.5 text-amber-600 dark:text-amber-400">
                  {b.unlocked ? 'Unlocked' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
