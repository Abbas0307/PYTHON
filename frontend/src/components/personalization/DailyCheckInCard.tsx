import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  Coffee,
  BatteryCharging,
  BookOpen,
  EyeOff
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  BreakExperience,
  DailyCheckInRecord
} from '../../contracts/personalizationContract';
import { personalizationStorage } from '../../storage/personalizationStorage';

interface DailyCheckInCardProps {
  onCheckInCompleted?: () => void;
}

export const DailyCheckInCard: React.FC<DailyCheckInCardProps> = ({ onCheckInCompleted }) => {
  const todayDate = new Date().toISOString().slice(0, 10);
  const existingCheckIn = personalizationStorage.getState().dailyCheckIn;
  const isCheckedInToday = existingCheckIn && existingCheckIn.date === todayDate;

  const [isEditing, setIsEditing] = useState<boolean>(!isCheckedInToday);
  const [dayRating, setDayRating] = useState<number>(existingCheckIn?.dayRating || 3);
  const [studyRoutineRating, setStudyRoutineRating] = useState<number>(existingCheckIn?.studyRoutineRating || 3);
  const [energyRating, setEnergyRating] = useState<number>(existingCheckIn?.energyRating || 3);
  const [tookBreaks, setTookBreaks] = useState<BreakExperience>(existingCheckIn?.tookBreaks || 'somewhat');
  const [tomorrowFocus, setTomorrowFocus] = useState<string>(existingCheckIn?.tomorrowFocus || '');
  const [privateReflection, setPrivateReflection] = useState<string>(existingCheckIn?.privateReflection || '');
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const record: DailyCheckInRecord = {
      id: `checkin-${todayDate}-${Date.now()}`,
      date: todayDate,
      dayRating,
      studyRoutineRating,
      energyRating,
      tookBreaks,
      tomorrowFocus: tomorrowFocus.trim() || undefined,
      privateReflection: privateReflection.trim() || undefined,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    personalizationStorage.recordDailyCheckIn(record);
    setIsEditing(false);
    setIsSkipped(false);
    if (onCheckInCompleted) onCheckInCompleted();
  };

  const handleSkip = () => {
    setIsSkipped(true);
    setIsEditing(false);
  };

  if (isSkipped) {
    return (
      <Card className="p-4 sm:p-5 border border-slate-200 bg-slate-50/70 text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-400" aria-hidden="true" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold block text-slate-700">Daily check-in skipped for today.</span>
            You can always return whenever you'd like a brief reflection pause.
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setIsSkipped(false); setIsEditing(true); }}>
          Open Check-In
        </Button>
      </Card>
    );
  }

  if (isCheckedInToday && !isEditing) {
    return (
      <Card className="p-5 sm:p-6 border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-teal-50/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-800">
                  Daily Check-In Recorded
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {existingCheckIn.completedAt}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Day pace: {existingCheckIn.dayRating}/5 · Energy: {existingCheckIn.energyRating}/5 · Breaks: {existingCheckIn.tookBreaks}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="text-xs font-bold self-end sm:self-auto">
            Update Check-In
          </Button>
        </div>

        {existingCheckIn.tomorrowFocus && (
          <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 text-xs text-slate-700">
            <strong>Tomorrow's Focus:</strong> {existingCheckIn.tomorrowFocus}
          </div>
        )}
      </Card>
    );
  }

  const dayLabels = ['Rough', 'Challenging', 'Okay', 'Good', 'Great'];

  return (
    <Card className="p-5 sm:p-6 lg:p-7 border border-mindora-border/80 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Daily Student Check-In
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Optional · 60 seconds
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Take a brief pause to acknowledge your day. Completely voluntary and non-diagnostic.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="text-xs font-semibold text-slate-400 hover:text-slate-600 self-end sm:self-auto py-1 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          Skip for Today
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating 1: Day Overall */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>How was your day overall?</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setDayRating(val)}
                className={`py-2 px-1 rounded-xl text-center text-xs font-bold border transition-all ${
                  dayRating === val
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="block text-sm">{val}</span>
                <span className="text-[10px] hidden sm:block font-normal opacity-90">
                  {dayLabels[val - 1]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Rating 2: Study Routine & Energy (2-col grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-violet-500" />
              <span>Study Routine Pace (1–5)</span>
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setStudyRoutineRating(val)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    studyRoutineRating === val
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
              <span>Daily Energy Level (1–5)</span>
            </label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => setEnergyRating(val)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    energyRating === val
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Question 3: Breaks Taken */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-emerald-500" />
            <span>Did you take enough restful study breaks today?</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'yes', label: 'Yes, regular breaks' },
              { id: 'somewhat', label: 'Somewhat' },
              { id: 'no', label: 'Not enough' }
            ].map((opt) => (
              <button
                type="button"
                key={opt.id}
                onClick={() => setTookBreaks(opt.id as BreakExperience)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                  tookBreaks === opt.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question 4: Tomorrow's focus */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            What is one gentle priority you want to focus on tomorrow? (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Complete math assignment before 6 PM; drink water"
            value={tomorrowFocus}
            onChange={(e) => setTomorrowFocus(e.target.value)}
            maxLength={100}
            className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Question 5: Ephemeral private reflection */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              <span>Private reflection notes (Optional)</span>
            </label>
            <span className="text-[10px] text-slate-400">
              100% in-memory · Zero disk storage
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="Write any thoughts for yourself. Cleared on browser tab exit."
            value={privateReflection}
            onChange={(e) => setPrivateReflection(e.target.value)}
            maxLength={300}
            className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[10px] text-slate-400 italic">
            🛡️ Reflection text is held strictly in volatile component memory and will vanish when you close this window.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={handleSkip}>
            Skip
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Save Today's Check-In
          </Button>
        </div>
      </form>
    </Card>
  );
};
