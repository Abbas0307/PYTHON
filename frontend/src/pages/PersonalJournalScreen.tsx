import React, { useState } from 'react';
import { BookOpen, Sparkles, CheckCircle2, Trash2, Calendar, Lock } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

interface JournalEntry {
  id: string;
  date: string;
  prompt: string;
  content: string;
  moodRating: number;
}

const JOURNAL_PROMPTS = [
  "What is one small victory or progress you made today?",
  "What academic task felt heaviest, and how can you break it down?",
  "What is one thing your body or mind needs right now?",
  "Free Reflection: Write whatever is on your mind..."
];

export const PersonalJournalScreen: React.FC = () => {
  const [selectedPrompt, setSelectedPrompt] = useState(JOURNAL_PROMPTS[0]);
  const [journalContent, setJournalContent] = useState('');
  const [moodRating, setMoodRating] = useState(4);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const DEFAULT_ENTRIES: JournalEntry[] = [
    {
      id: 'entry-1',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      prompt: 'What is one small victory or progress you made today?',
      content: 'Finished reading chapter 3 of algorithms and took a 20-minute walk outside. Felt much clearer afterwards.',
      moodRating: 4
    }
  ];

  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('mindora_personal_journal_entries');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_ENTRIES;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalContent.trim()) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      prompt: selectedPrompt,
      content: journalContent.trim(),
      moodRating
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    try {
      localStorage.setItem('mindora_personal_journal_entries', JSON.stringify(updated));
    } catch {}
    setJournalContent('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((entry) => entry.id !== id);
    setEntries(updated);
    try {
      localStorage.setItem('mindora_personal_journal_entries', JSON.stringify(updated));
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600" />
            Personal Journal & Reflection Space
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            A serene, zero-judgment reflection sanctuary for your academic journey.
          </p>
        </div>
      </div>

      {/* Strict Privacy Shield Banner */}
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
        <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-emerald-950 dark:text-emerald-100">
            100% Private to You — Category A Privacy Invariant
          </p>
          <p className="leading-relaxed">
            Your personal journal entries and private reflections are strictly isolated to your authenticated browser session. They are <strong>NEVER</strong> shared with guardians, mentors, or external models.
          </p>
        </div>
      </div>

      {/* Write New Reflection Form */}
      <Card className="p-6 border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-500" />
            Write Today's Reflection
          </h2>
          <span className="text-xs text-gray-400">{new Date().toDateString()}</span>
        </div>

        {/* Prompt Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Select a Reflection Prompt:
          </label>
          <div className="flex flex-wrap gap-2">
            {JOURNAL_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedPrompt(p)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  selectedPrompt === p
                    ? 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-700 font-semibold'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <textarea
              rows={5}
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Write your unfiltered thoughts here in complete safety..."
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            {/* Mood selector */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Overall Feeling:</span>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setMoodRating(lvl)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    moodRating === lvl
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved Privately
                </span>
              )}
              <Button type="submit" disabled={!journalContent.trim()} size="sm">
                Save Reflection
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Past Journal Entries */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-600" />
          Past Private Reflections ({entries.length})
        </h3>

        {entries.map((entry) => (
          <Card key={entry.id} className="p-5 border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-100 dark:border-gray-800">
              <span className="font-semibold text-gray-600 dark:text-gray-300">{entry.date}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold">
                  Mood: {entry.moodRating}/5
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-gray-400 hover:text-rose-500 transition"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {entry.prompt}
            </p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
              {entry.content}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};
