import React, { useState } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Search,
  Clock,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  Headphones,
  MonitorOff,
  PenTool,
  HeartHandshake,
  Moon,
  Droplet,
  Coffee,
  Activity,
  Shield,
  Maximize2,
  Compass,
  Sun,
  Feather,
  MessageCircle,
  Smile,
  Users
} from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import {
  RELAXATION_ACTIVITIES,
  RELAXATION_CATEGORIES
} from '../../engines/relaxationLibrary.ts';
import { wellnessStore } from '../../engines/wellnessEngine.ts';
import type { RelaxationActivity } from '../../contracts/wellnessContract.ts';

interface RelaxationLibraryProps {
  onBack: () => void;
  onComplete?: () => void;
}

export const RelaxationLibrary: React.FC<RelaxationLibraryProps> = ({ onBack, onComplete }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<RelaxationActivity | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const filteredActivities = RELAXATION_ACTIVITIES.filter((act) => {
    const matchesCat = selectedCategory === 'all' || act.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleMarkDone = (activity: RelaxationActivity) => {
    setCompletedIds((prev) => new Set([...prev, activity.id]));
    wellnessStore.recordSession({
      experienceId: 'activities',
      title: activity.title,
      durationMinutes: activity.estimatedDuration
    });
    setSelectedActivity(null);
    if (onComplete) onComplete();
  };

  // Helper to render lucide icon dynamically
  const renderActivityIcon = (name: string) => {
    const props = { className: 'w-4 h-4 text-mindora-primary' };
    switch (name) {
      case 'Eye': return <Eye {...props} />;
      case 'Headphones': return <Headphones {...props} />;
      case 'MonitorOff': return <MonitorOff {...props} />;
      case 'PenTool': return <PenTool {...props} />;
      case 'HeartHandshake': return <HeartHandshake {...props} />;
      case 'Moon': return <Moon {...props} />;
      case 'Droplet': return <Droplet {...props} />;
      case 'Coffee': return <Coffee {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Maximize2': return <Maximize2 {...props} />;
      case 'Compass': return <Compass {...props} />;
      case 'Sun': return <Sun {...props} />;
      case 'Feather': return <Feather {...props} />;
      case 'MessageCircle': return <MessageCircle {...props} />;
      case 'Smile': return <Smile {...props} />;
      case 'Users': return <Users {...props} />;
      case 'Sparkles':
      default:
        return <Sparkles {...props} />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Wellness Studio
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Relaxation Library
          </Badge>
          <Badge variant="slate">{RELAXATION_ACTIVITIES.length} Micro-Practices</Badge>
        </div>
      </div>

      {/* Library Intro & Filters */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-mindora-border shadow-soft space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-mindora-darkText tracking-tight">
            Curated Micro-Relaxation Activities
          </h2>
          <p className="text-xs sm:text-sm text-mindora-mutedText">
            Explore 18 practical, non-clinical collegiate practices to decompress between classes, exams, and study blocks.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities by keyword (e.g. walk, stretch, eye rest, doodle)..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-mindora-primary bg-slate-50/50"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-mindora-primary text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Activities ({RELAXATION_ACTIVITIES.length})
          </button>
          {RELAXATION_CATEGORIES.map((cat) => {
            const count = RELAXATION_ACTIVITIES.filter((a) => a.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-mindora-primary text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((act) => {
          const isDone = completedIds.has(act.id);
          return (
            <Card
              key={act.id}
              className={`flex flex-col justify-between space-y-3 p-4 sm:p-5 border transition-all hover:shadow-md ${
                isDone ? 'bg-emerald-50/30 border-emerald-200' : 'border-mindora-border'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    {renderActivityIcon(act.iconName)}
                  </div>
                  <Badge variant={isDone ? 'emerald' : 'slate'}>
                    {isDone ? 'Finished' : act.category}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-mindora-darkText leading-snug">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-mindora-primary" />
                  {act.estimatedDuration} mins
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedActivity(act)}
                >
                  View Steps
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-500 space-y-2">
          <p className="text-sm font-semibold">No activities match your search.</p>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}>
            Reset Filters
          </Button>
        </div>
      )}

      {/* Activity Instructions Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-activity-title"
        >
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-mindora-border overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-mindora-border flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="violet">{selectedActivity.category}</Badge>
                  <Badge variant="slate">{selectedActivity.estimatedDuration} minutes</Badge>
                </div>
                <h3 id="modal-activity-title" className="text-lg font-bold text-mindora-darkText">
                  {selectedActivity.title}
                </h3>
                <p className="text-xs text-mindora-mutedText">
                  {selectedActivity.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                aria-label="Close activity modal"
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-mindora-primary">
                  Step-by-Step Instructions:
                </span>
                <ol className="text-xs sm:text-sm text-slate-700 space-y-2.5">
                  {selectedActivity.instructions.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {selectedActivity.safetyOrSuitabilityNote && (
                <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    <strong>Suitability Note:</strong> {selectedActivity.safetyOrSuitabilityNote}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-mindora-border bg-slate-50/50 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedActivity(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleMarkDone(selectedActivity)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark as Completed in Session
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
