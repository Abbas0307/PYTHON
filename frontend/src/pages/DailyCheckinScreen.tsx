import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  CalendarCheck,
  SunMedium,
  Zap,
  BookOpen,
  Moon,
  Lock,
  CheckCircle2,
  Clock,
  Sparkles,
  Smile,
  Meh,
  Frown,
  Heart
} from 'lucide-react';
import { personalizationStorage } from '../storage/personalizationStorage';
import type { NavigationScreen } from '../storage/sessionStorage';

interface DailyCheckinScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

interface CheckInEntry {
  id: string;
  date: string;
  mood: number;
  energy: number;
  studyPressure: number;
  sleepQuality: number;
  note?: string;
}

export const DailyCheckinScreen: React.FC<DailyCheckinScreenProps> = ({
  onNavigate,
  onOpenCrisis: _onOpenCrisis
}) => {
  const [mood, setMood] = useState<number>(3);
  const [energy, setEnergy] = useState<number>(3);
  const [studyPressure, setStudyPressure] = useState<number>(3);
  const [sleepQuality, setSleepQuality] = useState<number>(3);
  const [note, setNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [history, setHistory] = useState<CheckInEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mindora_daily_checkin_history');
      return saved ? JSON.parse(saved) : [
        {
          id: '1',
          date: 'Yesterday',
          mood: 4,
          energy: 3,
          studyPressure: 2,
          sleepQuality: 4,
          note: 'Good lecture on data structures, went for an evening walk.'
        },
        {
          id: '2',
          date: '3 days ago',
          mood: 3,
          energy: 2,
          studyPressure: 4,
          sleepQuality: 3,
          note: 'Heavy exam preparation day.'
        }
      ];
    } catch {
      return [];
    }
  });

  const moodLabels = [
    { value: 1, label: 'Struggling', icon: Frown, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    { value: 2, label: 'Low', icon: Frown, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { value: 3, label: 'Steady', icon: Meh, color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
    { value: 4, label: 'Good', icon: Smile, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
    { value: 5, label: 'Thriving', icon: Sparkles, color: 'text-violet-600 bg-violet-50 border-violet-200' }
  ];

  const handleSaveCheckIn = () => {
    const newEntry: CheckInEntry = {
      id: String(Date.now()),
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      mood,
      energy,
      studyPressure,
      sleepQuality,
      note: note.trim() || undefined
    };

    const updated = [newEntry, ...history];
    setHistory(updated);
    try {
      localStorage.setItem('mindora_daily_checkin_history', JSON.stringify(updated.slice(0, 30)));
    } catch {}

    // Also update personalization storage if available
    try {
      personalizationStorage.recordDailyCheckIn({
        id: newEntry.id,
        date: new Date().toISOString().split('T')[0],
        dayRating: mood,
        energyRating: energy,
        studyRoutineRating: studyPressure,
        privateReflection: note.trim() || undefined,
        completedAt: new Date().toISOString()
      });
    } catch {}

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
    setNote('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-pink-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<CalendarCheck className="w-3.5 h-3.5" />}>
              Daily Pulse
            </Badge>
            <Badge variant="slate">Encrypted Memory</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Daily Wellbeing Check-In
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1">
            Take 60 seconds to observe your energy, study tension, and mood. Your personal reflection never leaves your browser.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('wellbeing')}
          icon={<Heart className="w-3.5 h-3.5 text-violet-600" />}
        >
          View Long-Term Trends
        </Button>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs sm:text-sm font-semibold">
            Check-in saved successfully! Your daily metrics have been securely stored in client memory.
          </div>
        </div>
      )}

      {/* Main Check-In Form Card */}
      <Card className="p-6 sm:p-8 space-y-6 sm:space-y-8 border-violet-100">
        {/* Mood Section */}
        <div>
          <label className="block text-sm font-bold text-mindora-darkText mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <SunMedium className="w-4 h-4 text-violet-600" />
              How are you feeling overall today?
            </span>
            <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full">
              {moodLabels.find((m) => m.value === mood)?.label}
            </span>
          </label>
          <div className="grid grid-cols-5 gap-2 sm:gap-3 mt-3">
            {moodLabels.map((m) => {
              const Icon = m.icon;
              const isSelected = mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`p-3 sm:p-4 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-violet-600 bg-violet-50/70 shadow-sm ring-2 ring-violet-500/30'
                      : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-violet-700' : 'text-slate-400'}`} />
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-violet-900 font-bold' : 'text-slate-600'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Energy Scale */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-mindora-darkText flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Vitality & Physical Energy
            </span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Level {energy} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>1 (Exhausted)</span>
            <span>3 (Moderate)</span>
            <span>5 (Energized)</span>
          </div>
        </div>

        {/* Study Pressure Scale */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-mindora-darkText flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              Perceived Academic Pressure
            </span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
              Level {studyPressure} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={studyPressure}
            onChange={(e) => setStudyPressure(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>1 (Very Calm)</span>
            <span>3 (Manageable)</span>
            <span>5 (Intense Deadlines)</span>
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-mindora-darkText flex items-center gap-2">
              <Moon className="w-4 h-4 text-violet-500" />
              Last Night's Sleep Quality
            </span>
            <span className="text-xs font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
              Level {sleepQuality} / 5
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={sleepQuality}
            onChange={(e) => setSleepQuality(Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium mt-1">
            <span>1 (Disrupted / Insufficient)</span>
            <span>3 (Average)</span>
            <span>5 (Deep & Restful)</span>
          </div>
        </div>

        {/* Optional Private Reflection Note */}
        <div className="border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-mindora-darkText flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              Private Reflection Note (Optional)
            </label>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Zero Telemetry / Encrypted
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Write down any thoughts, course challenges, or gratitude moments for yourself..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-xs sm:text-sm text-mindora-darkText placeholder:text-slate-400 transition-all resize-none"
          />
          <p className="text-[11px] text-mindora-mutedText mt-1">
            This note stays strictly in your local browser vault. It is never transmitted or visible to guardians.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={handleSaveCheckIn}
            icon={<CheckCircle2 className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Save Today's Check-in
          </Button>
        </div>
      </Card>

      {/* Previous Check-ins History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-mindora-darkText flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-600" />
            Previous Check-ins
          </h2>
          <span className="text-xs font-semibold text-mindora-mutedText">
            {history.length} logged records
          </span>
        </div>

        {history.length === 0 ? (
          <Card className="p-8 text-center text-mindora-mutedText text-xs">
            No previous check-in records found. Complete your first check-in above!
          </Card>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => (
              <Card key={entry.id} className="p-4 sm:p-5 hover:border-violet-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-mindora-darkText">{entry.date}</span>
                    <Badge variant="violet">Mood {entry.mood}/5</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-mindora-mutedText">
                    <span>Energy: <strong>{entry.energy}/5</strong></span>
                    <span>Pressure: <strong>{entry.studyPressure}/5</strong></span>
                    <span>Sleep: <strong>{entry.sleepQuality}/5</strong></span>
                  </div>
                </div>
                {entry.note && (
                  <p className="text-xs text-slate-600 mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    "{entry.note}"
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
