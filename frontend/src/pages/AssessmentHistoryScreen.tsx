import React, { useState, useEffect } from 'react';
import { History, ClipboardList, Shield, ArrowRight, Calendar, Activity, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface AssessmentHistoryScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  assessmentCompleted: boolean;
}

interface StoredAssessment {
  id: number;
  assessment_date: string;
  submission_timestamp: string;
  stress_score: number;
  interpretation: string;
  status_tier: string;
  phq9_score?: number;
  phq9_severity?: string;
  survey_features?: Record<string, any>;
  assessment_source: string;
  completion_status: string;
  idempotency_key?: string;
}

export const AssessmentHistoryScreen: React.FC<AssessmentHistoryScreenProps> = ({
  onNavigate,
  assessmentCompleted: _completedProp
}) => {
  const [assessments, setAssessments] = useState<StoredAssessment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('mindora_auth_token') ||
                    localStorage.getItem('mindora_auth_token') ||
                    localStorage.getItem('session_token') || '';

      const res = await fetch(`${getApiBaseUrl()}/api/student/assessments/history?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json = await res.json();
      if (json.status === 'success' && Array.isArray(json.data)) {
        setAssessments(json.data);
      } else {
        setAssessments([]);
      }
    } catch (err: any) {
      console.error('Failed to load assessment history:', err);
      setError('Unable to load assessment history from server.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();

    const handleSync = () => {
      fetchHistory(false);
    };

    window.addEventListener('mindora:assessment-submitted', handleSync);
    return () => {
      window.removeEventListener('mindora:assessment-submitted', handleSync);
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchHistory(false);
  };

  const getTierBadge = (tier: string, score: number) => {
    const t = (tier || '').toLowerCase();
    if (t === 'critical' || score >= 90) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        dot: 'bg-rose-500'
      };
    }
    if (t === 'elevated' || score >= 70) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
        dot: 'bg-amber-500'
      };
    }
    if (t === 'moderate' || score >= 40) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500'
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      dot: 'bg-emerald-500'
    };
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            Assessment History
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Authoritative, immutable chronological log of your daily student wellbeing assessments.
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
            Refresh Log
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

      {/* Non-Diagnostic Disclaimer */}
      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
        <Shield className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          <strong>Authoritative & Immutable Records:</strong> Each daily assessment is sealed upon submission. Past records are permanently preserved to track authentic trends and progress.
        </span>
      </div>

      {/* Records Table / List */}
      <Card className="p-0 overflow-hidden border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-500" />
            Recorded Wellbeing Assessments ({assessments.length})
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">Synchronized via Central Pipeline</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin text-brand-500" />
            Loading verified assessment records...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
            {error}
          </div>
        ) : assessments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Activity className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">
              No Assessments Recorded Yet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Complete your first daily assessment to establish your baseline stress gauge, personalized recommendations, and weekly analytics.
            </p>
            <Button
              size="sm"
              onClick={() => onNavigate('assessment')}
              className="mt-2 text-xs"
            >
              <ClipboardList className="w-4 h-4 mr-1.5" />
              Take First Assessment
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {assessments.map((rec) => {
              const badge = getTierBadge(rec.status_tier, rec.stress_score);
              const displayDate = rec.assessment_date
                ? new Date(rec.assessment_date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : rec.submission_timestamp
                ? new Date(rec.submission_timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recorded Check-in';

              const features = rec.survey_features || {};

              return (
                <div
                  key={rec.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/80 dark:hover:bg-gray-850/60 transition"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {displayDate}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        <span>{rec.interpretation || rec.status_tier} ({rec.stress_score}%)</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Authoritative
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {rec.phq9_score !== undefined && rec.phq9_score !== null && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium">
                          PHQ-9: {rec.phq9_score}/27 ({rec.phq9_severity || 'Evaluated'})
                        </span>
                      )}
                      {features.sleep_hours !== undefined && (
                        <span>Sleep: <strong className="text-gray-700 dark:text-gray-300">{features.sleep_hours}h</strong></span>
                      )}
                      {features.study_hours !== undefined && (
                        <span>• Study: <strong className="text-gray-700 dark:text-gray-300">{features.study_hours}h</strong></span>
                      )}
                      {features.physical_activity !== undefined && (
                        <span>• Activity: <strong className="text-gray-700 dark:text-gray-300">{features.physical_activity}m</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate('weekly_insights')}
                      className="text-xs"
                    >
                      View Weekly Insights
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
