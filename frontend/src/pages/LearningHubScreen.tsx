import React, { useState } from 'react';
import {
  GraduationCap,
  Search,
  Clock,
  ArrowRight,
  Bot
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import type { NavigationScreen } from '../storage/sessionStorage';

interface LearningArticle {
  id: string;
  title: string;
  category: 'Study Habits' | 'Sleep Science' | 'Nervous System' | 'Mindfulness';
  readTime: string;
  summary: string;
  keyPoints: string[];
  evidenceSource: string;
}

const ARTICLES: LearningArticle[] = [
  {
    id: 'art-1',
    title: 'The Pomodoro Rhythm: Why Micro-Breaks Protect Working Memory',
    category: 'Study Habits',
    readTime: '3 min read',
    summary:
      'Continuous unbroken study leads to cognitive fatigue and increased error rates. Structuring study in 25-minute intervals prevents mental depletion.',
    keyPoints: [
      '25 minutes matches optimal sustained collegiate attention spans.',
      'A 5-minute break clears transient metabolic waste and resets executive focus.',
      'Active movement during breaks works 3x better than scrolling social media.'
    ],
    evidenceSource: 'Cognitive Science & Attention Restoration Theory'
  },
  {
    id: 'art-2',
    title: 'Circadian Pacing & The 30-Minute Blue Light Wind-Down',
    category: 'Sleep Science',
    readTime: '4 min read',
    summary:
      'Blue light emitted from laptops and phones suppresses melatonin synthesis, keeping the brain in active alert mode long after studying stops.',
    keyPoints: [
      'Melatonin onset is delayed by up to 90 minutes when screens are used right before sleep.',
      'Switching to warm, indirect light 30 minutes before bed cues the parasympathetic system.',
      'Writing down tomorrow\'s to-do list ("brain dumping") reduces pre-sleep cognitive worry.'
    ],
    evidenceSource: 'Chronobiology & Sleep Medicine Reviews'
  },
  {
    id: 'art-3',
    title: 'Overcoming Procrastination with the 2-Minute Friction Rule',
    category: 'Study Habits',
    readTime: '3 min read',
    summary:
      'Procrastination is rarely laziness—it is emotional resistance to perceived task scale or perfectionism. Lowering the initial activation energy solves it.',
    keyPoints: [
      'Tell yourself you will only do the task for 2 minutes, then you may stop.',
      'Overcoming task initiation friction triggers the psychological momentum effect.',
      'Set up your study desk the night before to eliminate micro-decisions.'
    ],
    evidenceSource: 'Behavioral Economics & Implementation Intentions'
  },
  {
    id: 'art-4',
    title: 'The Vagus Nerve & Diaphragmatic Pacing (4-6 Breathing)',
    category: 'Nervous System',
    readTime: '4 min read',
    summary:
      'Extending your exhalation stimulates the vagus nerve, immediately signaling the heart to slow down and dampening the sympathetic stress response.',
    keyPoints: [
      'Inhaling slightly increases heart rate; exhaling triggers vagal brake deceleration.',
      'A 4-second inhale followed by a 6-second exhale creates cardiac coherence.',
      'Just 2 minutes of paced breathing visibly lowers salivary cortisol markers.'
    ],
    evidenceSource: 'Autonomic Neuroscience & Psychophysiology'
  },
  {
    id: 'art-5',
    title: 'Cognitive Reframing for Midterm and Exam Pressure',
    category: 'Mindfulness',
    readTime: '5 min read',
    summary:
      'Physiological arousal (racing heart, sweaty palms) is often mislabeled as panic. Reframing arousal as readiness improves collegiate test outcomes.',
    keyPoints: [
      'Nervousness and excitement share identical physiological footprints.',
      'Telling yourself "I am ready and energized" improves focus over trying to force total calm.',
      'Separate your self-worth from academic test scores; exams evaluate preparation, not your value.'
    ],
    evidenceSource: 'Clinical Psychological Science (Harvard/Rochester Study)'
  }
];

interface LearningHubScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
}

export const LearningHubScreen: React.FC<LearningHubScreenProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<LearningArticle | null>(null);

  const categories = ['all', 'Study Habits', 'Sleep Science', 'Nervous System', 'Mindfulness'];

  const filteredArticles = ARTICLES.filter((art) => {
    const matchesCat = selectedCategory === 'all' || art.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600" />
            Wellness Learning Hub
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Evidence-grounded psychoeducational guides, cognitive pacing science, and study routines.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onNavigate('ai_companion')}
          className="text-xs"
        >
          <Bot className="w-4 h-4 mr-1.5" />
          Ask Mindora AI Companion
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guides..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredArticles.map((art) => (
          <Card
            key={art.id}
            className="p-5 flex flex-col justify-between border-gray-200 dark:border-gray-800 hover:shadow-md transition cursor-pointer"
            onClick={() => setSelectedArticle(art)}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider text-[11px]">
                  {art.category}
                </span>
                <span className="flex items-center gap-1 text-gray-400 text-[11px]">
                  <Clock className="w-3 h-3" />
                  {art.readTime}
                </span>
              </div>

              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug">
                {art.title}
              </h3>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {art.summary}
              </p>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 mt-4 flex items-center justify-between text-xs text-brand-600 dark:text-brand-400 font-semibold">
              <span>Read Guide</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Card>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-xl w-full p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300">
                {selectedArticle.category}
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedArticle.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedArticle.readTime} • Evidence Base: {selectedArticle.evidenceSource}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedArticle.summary}
              </p>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl space-y-2 border border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Core Practical Takeaways:
                </h4>
                <ul className="list-disc pl-5 text-xs text-gray-600 dark:text-gray-300 space-y-1.5 leading-relaxed">
                  {selectedArticle.keyPoints.map((pt, i) => (
                    <li key={i}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedArticle(null);
                  onNavigate('ai_companion');
                }}
                className="text-xs"
              >
                <Bot className="w-3.5 h-3.5 mr-1.5" />
                Discuss with AI Companion
              </Button>
              <Button size="sm" onClick={() => setSelectedArticle(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
