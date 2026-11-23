import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  History,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { ActivityTimeline } from '../components/insights/ActivityTimeline';
import { clearEligibleTimelineData } from '../engines/activityTimelineEngine';
import type { NavigationScreen } from '../storage/sessionStorage';

interface ActivityHistoryScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const ActivityHistoryScreen: React.FC<ActivityHistoryScreenProps> = ({
  onNavigate: _onNavigate
}) => {
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [confirmClearOpen, setConfirmClearOpen] = useState<boolean>(false);
  const [clearedMessage, setClearedMessage] = useState<string | null>(null);

  const handleClearHistory = () => {
    clearEligibleTimelineData('all_timeline');
    setConfirmClearOpen(false);
    setClearedMessage('Activity timeline has been cleanly erased from local client memory.');
    setRefreshKey((k) => k + 1);
    setTimeout(() => setClearedMessage(null), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-slate-50 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<History className="w-3.5 h-3.5" />}>
              Audit Record
            </Badge>
            <Badge variant="slate">Client Local</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Activity & Session History
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            A chronological timeline of your completed wellness practices, daily check-ins, micro-actions, and reflective assessments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClearOpen(true)}
            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
            className="text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Clear History
          </Button>
        </div>
      </div>

      {/* Cleared Notification */}
      {clearedMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{clearedMessage}</span>
        </div>
      )}

      {/* Clear Confirmation Modal / Banner */}
      {confirmClearOpen && (
        <Card className="p-6 border-2 border-rose-300 bg-rose-50/40">
          <h3 className="text-sm font-bold text-rose-950 mb-1">
            Confirm Selective Activity Erasure
          </h3>
          <p className="text-xs text-rose-800 leading-relaxed mb-4">
            This will permanently remove your session logs, completed exercise records, and daily check-ins from local storage. Your baseline account profile and guardian settings will remain intact.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClearOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleClearHistory}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Permanently Clear
            </Button>
          </div>
        </Card>
      )}

      {/* Activity Timeline Integration */}
      <Card key={refreshKey} className="p-6 sm:p-8">
        <ActivityTimeline />
      </Card>
    </div>
  );
};
