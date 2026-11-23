import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import {
  TREND_METRICS,
  WeeklyCheckIn,
  getISOWeekIdentifier,
  formatWeekLabel,
  TrendMetricKey
} from '../../contracts/trendsContract';
import { Button } from '../common/Button';

interface WeeklyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckIn: (checkIn: Partial<WeeklyCheckIn>) => Promise<void>;
  existingCheckIns: WeeklyCheckIn[];
}

export const WeeklyCheckInModal: React.FC<WeeklyCheckInModalProps> = ({
  isOpen,
  onClose,
  onSaveCheckIn,
  existingCheckIns
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const currentWeek = getISOWeekIdentifier(new Date(selectedDate || today));

  // Find if a check-in exists for this week
  const existingForWeek = existingCheckIns.find((c) => c.weekIdentifier === currentWeek);

  const [ratings, setRatings] = useState<Record<TrendMetricKey, number>>({
    sleepQuality: existingForWeek ? existingForWeek.sleepQuality : 3,
    academicPressure: existingForWeek ? existingForWeek.academicPressure : 3,
    studySatisfaction: existingForWeek ? existingForWeek.studySatisfaction : 3,
    dailyEnergy: existingForWeek ? existingForWeek.dailyEnergy : 3,
    routineBalance: existingForWeek ? existingForWeek.routineBalance : 3
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRatingChange = (key: TrendMetricKey, val: number) => {
    setRatings((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await onSaveCheckIn({
        weekIdentifier: currentWeek,
        date: selectedDate,
        sleepQuality: ratings.sleepQuality,
        academicPressure: ratings.academicPressure,
        studySatisfaction: ratings.studySatisfaction,
        dailyEnergy: ratings.dailyEnergy,
        routineBalance: ratings.routineBalance
      });
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save check-in.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-mindora-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-mindora-surface to-white border-b border-mindora-border flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-mindora-lavender text-mindora-primary flex items-center gap-1">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Optional Self-Reflection
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                Zero Transmission
              </span>
            </div>
            <h3 id="checkin-modal-title" className="text-lg sm:text-xl font-black text-mindora-darkText">
              Weekly Wellbeing Check-In
            </h3>
            <p className="text-xs text-mindora-mutedText">
              Reflect on your general academic and restorative pacing over the past 7 days.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close check-in modal"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-mindora-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Week & Date Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-mindora-surface/70 rounded-2xl border border-mindora-border/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-mindora-primary" aria-hidden="true" />
              <div>
                <span className="text-xs font-bold text-mindora-darkText block">
                  Check-In Target: {formatWeekLabel(currentWeek)}
                </span>
                <span className="text-[11px] text-slate-500">
                  One check-in per calendar week.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <label htmlFor="checkin-date" className="text-xs font-semibold text-slate-600 shrink-0">
                Date:
              </label>
              <input
                id="checkin-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Existing Check-In Notification if duplicate for week */}
          {existingForWeek && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Existing record found for {formatWeekLabel(currentWeek)}:</strong> Saving now will update your ratings for this week.
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* 5 Rating Fields */}
          <div className="space-y-5">
            {TREND_METRICS.map((metric) => {
              const currentVal = ratings[metric.key];
              const desc = metric.ratingDescriptions[currentVal];

              return (
                <fieldset
                  key={metric.key}
                  className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2.5 hover:border-mindora-primary/30 transition-colors"
                >
                  <legend className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs sm:text-sm font-bold text-mindora-darkText flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: metric.accentColor }}
                        aria-hidden="true"
                      />
                      {metric.label}
                    </span>
                    <span className="text-xs font-black px-2 py-0.5 rounded-md" style={{ backgroundColor: metric.bgLight, color: metric.accentColor }}>
                      Rating: {currentVal} / 5
                    </span>
                  </legend>

                  <p className="text-[11px] text-slate-500">
                    {metric.description}
                  </p>

                  {/* 1 to 5 Radio Buttons */}
                  <div
                    className="grid grid-cols-5 gap-1.5 sm:gap-2 pt-1"
                    role="radiogroup"
                    aria-label={`${metric.label} rating options 1 to 5`}
                  >
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = currentVal === val;

                      return (
                        <button
                          key={val}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`${metric.label} Level ${val}: ${metric.ratingDescriptions[val]}`}
                          onClick={() => handleRatingChange(metric.key, val)}
                          className={`py-2 px-1 rounded-xl text-xs font-black transition-all border text-center flex flex-col items-center justify-center gap-0.5 focus-visible:ring-2 focus-visible:ring-mindora-primary ${
                            isSelected
                              ? 'text-white border-transparent shadow-xs scale-102'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                          style={{
                            backgroundColor: isSelected ? metric.accentColor : undefined
                          }}
                        >
                          <span className="text-sm">{val}</span>
                          <span className="text-[9px] font-semibold opacity-90 truncate max-w-full px-0.5">
                            {val === 1 ? metric.minLabel.split(' ')[0] : val === 5 ? metric.maxLabel.split(' ')[0] : `Lvl ${val}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Rating Description */}
                  <div className="text-[11px] text-slate-600 font-medium bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {desc}
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="p-3 bg-mindora-surface rounded-xl border border-mindora-border/60 text-[11px] text-slate-500">
            <strong>Privacy Boundary:</strong> This check-in stays purely on your local device. It is never transmitted to any server, external AI, or cloud repository.
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              type="submit"
              disabled={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? 'Saving...' : existingForWeek ? 'Update Weekly Record' : 'Record Weekly Check-In'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
