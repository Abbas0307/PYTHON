import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  ShieldCheck,
  TrendingUp,
  Plus,
  Settings,
  History,
  Activity,
  Lightbulb,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  WeeklyCheckIn,
  TREND_METRICS,
  formatWeekLabel,
  TrendMetricKey,
  SAMPLE_PREVIEW_CHECKINS
} from '../../contracts/trendsContract';
import {
  calculateTrendSummary,
  sortCheckInsChronologically
} from '../../engines/trendEngine';
import { trendStorage, StorageStatus } from '../../storage/vault/trendStorage';
import { TrendChart } from './TrendChart';
import { WeeklyCheckInModal } from './WeeklyCheckInModal';
import { VaultSettingsModal } from './VaultSettingsModal';

interface WeeklyTrendsSectionProps {
  isPreviewMode?: boolean;
}

export const WeeklyTrendsSection: React.FC<WeeklyTrendsSectionProps> = ({
  isPreviewMode = false
}) => {
  const [checkIns, setCheckIns] = useState<WeeklyCheckIn[]>([]);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({
    mode: 'in-memory',
    isVaultLocked: false,
    hasPersistentRecord: false,
    recordCount: 0
  });

  const [activeMetricTab, setActiveMetricTab] = useState<TrendMetricKey | 'all'>('all');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    const init = async () => {
      if (isPreviewMode) {
        // In preview mode, load synthetic sample check-in history
        setCheckIns(SAMPLE_PREVIEW_CHECKINS);
        setStorageStatus({
          mode: 'in-memory',
          isVaultLocked: false,
          hasPersistentRecord: false,
          recordCount: SAMPLE_PREVIEW_CHECKINS.length
        });
      } else {
        const status = await trendStorage.getStatus();
        setStorageStatus(status);
        if (!status.isVaultLocked) {
          setCheckIns(trendStorage.getCheckIns());
        }
      }
    };
    init();
  }, [isPreviewMode]);

  const refreshStatusAndData = async () => {
    if (isPreviewMode) return;
    const status = await trendStorage.getStatus();
    setStorageStatus(status);
    if (!status.isVaultLocked) {
      setCheckIns(trendStorage.getCheckIns());
    } else {
      setCheckIns([]);
    }
  };

  const handleShowNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveCheckIn = async (partial: Partial<WeeklyCheckIn>) => {
    if (isPreviewMode) {
      // In preview mode, update local state
      const updated = [...checkIns];
      const existingIdx = updated.findIndex((c) => c.weekIdentifier === partial.weekIdentifier);
      const newCheckIn: WeeklyCheckIn = {
        id: partial.id || `preview-${partial.weekIdentifier}`,
        weekIdentifier: partial.weekIdentifier!,
        date: partial.date || new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        sleepQuality: partial.sleepQuality!,
        academicPressure: partial.academicPressure!,
        studySatisfaction: partial.studySatisfaction!,
        dailyEnergy: partial.dailyEnergy!,
        routineBalance: partial.routineBalance!
      };
      if (existingIdx >= 0) {
        updated[existingIdx] = newCheckIn;
      } else {
        updated.push(newCheckIn);
      }
      setCheckIns(updated);
      handleShowNotification('Preview weekly check-in recorded.');
      return;
    }

    const saved = await trendStorage.saveCheckIn(partial);
    await refreshStatusAndData();
    handleShowNotification(`Check-in for ${formatWeekLabel(saved.weekIdentifier)} recorded successfully.`);
  };

  const summary = calculateTrendSummary(checkIns);
  const sortedCheckIns = sortCheckInsChronologically(checkIns);
  const isEmpty = sortedCheckIns.length === 0;

  return (
    <section aria-labelledby="trends-section-title" className="space-y-5">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-fadeIn"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" aria-hidden="true" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white px-2 py-0.5 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Section Header Card */}
      <Card className="space-y-4 border-mindora-border/80">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-mindora-border/60 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="violet" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                Weekly Wellbeing Trends
              </Badge>
              <Badge variant="emerald" icon={<ShieldCheck className="w-3 h-3" />}>
                Client-Side Only
              </Badge>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Non-Diagnostic
              </span>
            </div>
            <h2 id="trends-section-title" className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
              Weekly Habit & Routine Changes Over Time
            </h2>
            <p className="text-xs text-mindora-mutedText">
              Complete an optional weekly check-in to track changes in sleep, study satisfaction, and routine rhythm across semester weeks.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setIsCheckInModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
              aria-label="Log new weekly check-in"
            >
              Log Weekly Check-In
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVaultModalOpen(true)}
              icon={<Settings className="w-3.5 h-3.5" />}
              aria-label="Manage vault and privacy storage"
            >
              Vault & Storage
            </Button>
          </div>
        </div>

        {/* Privacy & Governance Notice Banner */}
        <div className="bg-mindora-surface/70 border border-mindora-border/60 p-3 sm:p-3.5 rounded-2xl flex items-start gap-3 text-xs text-slate-600 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>Strict Privacy Guarantee:</strong> Weekly check-ins track strictly 5 general lifestyle indicators.
            <strong> PHQ-9 responses, Item 9 triggers, and depression predictions are NEVER stored</strong> in trend storage.
            Data remains exclusively on your device (in volatile session memory or your encrypted local vault) and is never transmitted across the network.
          </div>
        </div>

        {/* Empty State vs. Overview Stats */}
        {isEmpty ? (
          <div className="p-8 sm:p-10 text-center rounded-3xl bg-slate-50/70 border border-dashed border-slate-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 text-mindora-primary flex items-center justify-center mx-auto shadow-2xs">
              <Calendar className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-extrabold text-base text-slate-800">
                No Weekly Check-Ins Recorded Yet
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take 30 seconds once a week to rate your sleep, academic pressure, study satisfaction, energy, and routine.
                Mindora will generate private, visual trend reflections and gentle observational insights.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsCheckInModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Complete Your First Weekly Check-in
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats Bar: 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-mindora-surface/50 rounded-2xl border border-mindora-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Logged Weeks
                </span>
                <span className="text-2xl font-black text-mindora-primary mt-1 block">
                  {summary.totalCheckIns}
                </span>
                <span className="text-[10px] text-slate-500">
                  {summary.totalCheckIns === 1 ? '1 week recorded' : `${summary.totalCheckIns} weeks on record`}
                </span>
              </div>

              <div className="p-3.5 bg-mindora-surface/50 rounded-2xl border border-mindora-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Latest Check-In
                </span>
                <span className="text-sm font-extrabold text-slate-800 mt-1.5 block truncate">
                  {summary.latestWeekIdentifier ? formatWeekLabel(summary.latestWeekIdentifier) : 'None'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {summary.latestDate || 'N/A'}
                </span>
              </div>

              <div className="p-3.5 bg-mindora-surface/50 rounded-2xl border border-mindora-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Storage Status
                </span>
                <span className="text-xs font-extrabold text-slate-800 mt-1.5 flex items-center gap-1.5">
                  {storageStatus.mode === 'encrypted-vault' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-violet-600" />
                      <span>Encrypted Vault</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>In-Memory Session</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-500">
                  {storageStatus.mode === 'encrypted-vault' ? 'AES-256-GCM' : 'Cleared on tab close'}
                </span>
              </div>

              <div className="p-3.5 bg-mindora-surface/50 rounded-2xl border border-mindora-border/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Weekly Changes
                </span>
                <span className="text-xs font-extrabold text-slate-800 mt-1.5 block">
                  {summary.totalCheckIns < 2 ? (
                    <span className="text-slate-400">Baseline week</span>
                  ) : (
                    <span className="text-emerald-700">Reflections Active</span>
                  )}
                </span>
                <span className="text-[10px] text-slate-500">
                  {summary.totalCheckIns < 2 ? 'Need 2 check-ins for delta' : 'Compared to previous week'}
                </span>
              </div>
            </div>

            {/* Changes Compared with Previous Check-In (Recent Deltas Strip) */}
            {summary.totalCheckIns >= 2 && (
              <div className="p-4 bg-gradient-to-r from-violet-50/70 via-indigo-50/40 to-white rounded-2xl border border-violet-200/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-mindora-primary" />
                    Changes Compared to Previous Check-In ({summary.latestWeekIdentifier ? formatWeekLabel(summary.latestWeekIdentifier) : ''}):
                  </span>
                  <span className="text-[11px] text-slate-500">1 to 5 Scale</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                  {TREND_METRICS.map((m) => {
                    const delta = summary.metricDeltas[m.key];
                    const val = delta.currentValue;
                    const diff = delta.delta;

                    return (
                      <div key={m.key} className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 truncate block">
                          {m.shortLabel}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-base font-black text-slate-800">
                            {val}/5
                          </span>
                          {diff !== null && diff !== 0 && (
                            <span
                              className={`inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                (m.key === 'academicPressure' && diff < 0) || (m.key !== 'academicPressure' && diff > 0)
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {diff > 0 ? (
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                              )}
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          )}
                          {diff === 0 && (
                            <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              <Minus className="w-2.5 h-2.5 mr-0.5" /> 0
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Gentle Insights Callout (Rendered only when >= 2 check-ins exist) */}
            {summary.insights.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <h3 className="font-extrabold text-sm text-amber-950">
                    Gentle Trend Observations
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Non-Clinical Reflections
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {summary.insights.map((ins) => (
                    <div
                      key={ins.id}
                      className="bg-white p-3.5 rounded-xl border border-amber-200/60 shadow-2xs space-y-1.5"
                    >
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                        {ins.category}
                      </span>
                      <p className="font-bold text-xs text-slate-800 leading-snug">
                        {ins.observation}
                      </p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {ins.context}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  Observations are generated deterministically from rating deltas to encourage self-reflection. They do not constitute medical, clinical, or diagnostic advice.
                </div>
              </div>
            )}

            {/* Trend Visualizations: Filter Tabs & Charts */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-mindora-darkText">
                    Individual Trend Visualizations
                  </h3>
                  <p className="text-xs text-mindora-mutedText">
                    Changes across standard 1–5 ratings (consistent scale across all dimensions).
                  </p>
                </div>

                {/* Metric Selector Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveMetricTab('all')}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeMetricTab === 'all'
                        ? 'bg-white text-mindora-primary shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Charts (5)
                  </button>
                  {TREND_METRICS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setActiveMetricTab(m.key)}
                      className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                        activeMetricTab === m.key
                          ? 'bg-white text-mindora-primary shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {TREND_METRICS.filter((m) => activeMetricTab === 'all' || activeMetricTab === m.key).map((metric) => (
                  <TrendChart
                    key={metric.key}
                    metric={metric}
                    checkIns={sortedCheckIns}
                    delta={summary.metricDeltas[metric.key]}
                    average={summary.metricAverages[metric.key]}
                  />
                ))}
              </div>
            </div>

            {/* Weekly Chronological History Table */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-mindora-primary" aria-hidden="true" />
                  <h3 className="text-base font-extrabold text-mindora-darkText">
                    Recorded Weekly History
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  {sortedCheckIns.length} recorded week{sortedCheckIns.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-mindora-border/80 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-mindora-surface/80 border-b border-mindora-border/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Week</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Sleep (1–5)</th>
                      <th className="py-2.5 px-3 text-center">Pressure (1–5)</th>
                      <th className="py-2.5 px-3 text-center">Satisfaction (1–5)</th>
                      <th className="py-2.5 px-3 text-center">Energy (1–5)</th>
                      <th className="py-2.5 px-3 text-center">Routine (1–5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedCheckIns.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-3 font-extrabold text-slate-800">
                          {formatWeekLabel(row.weekIdentifier)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">
                          {row.date}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-violet-700">
                          {row.sleepQuality} / 5
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-indigo-700">
                          {row.academicPressure} / 5
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-blue-700">
                          {row.studySatisfaction} / 5
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-amber-700">
                          {row.dailyEnergy} / 5
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                          {row.routineBalance} / 5
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Check-In Modal */}
      <WeeklyCheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSaveCheckIn={handleSaveCheckIn}
        existingCheckIns={checkIns}
      />

      {/* Vault Settings Modal */}
      <VaultSettingsModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        status={storageStatus}
        onRefreshStatus={refreshStatusAndData}
        onNotification={handleShowNotification}
      />
    </section>
  );
};
