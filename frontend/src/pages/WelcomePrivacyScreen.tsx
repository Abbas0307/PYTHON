import React from 'react';
import { Sparkles, ArrowRight, Lock, Zap, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';

interface WelcomePrivacyScreenProps {
  onStartAssessment: () => void;
  onExplorePreview: () => void;
  hasConsented: boolean;
  onToggleConsent: (val: boolean) => void;
}

export const WelcomePrivacyScreen: React.FC<WelcomePrivacyScreenProps> = ({
  onStartAssessment,
  onExplorePreview,
  hasConsented,
  onToggleConsent
}) => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto py-2">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-mindora-surface to-mindora-lavender/40 border border-mindora-border p-8 sm:p-12 shadow-soft">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-mindora-secondary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-mindora-primary/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="violet" icon={<Sparkles className="w-3.5 h-3.5" />}>
              Mindora 2.0 Intelligence Platform
            </Badge>
            <Badge variant="emerald" icon={<Lock className="w-3.5 h-3.5" />}>
              100% Offline-First Architecture
            </Badge>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-mindora-darkText tracking-tight leading-[1.15]">
            Empowering Student Wellbeing with <span className="text-transparent bg-clip-text bg-gradient-to-r from-mindora-primary to-mindora-secondary">Clarity & Privacy</span>.
          </h1>

          <p className="text-base sm:text-lg text-mindora-mutedText leading-relaxed">
            Mindora provides grounded, explainable insights into your sleep routines, academic commitments, and daily habits. Built with strict client-side privacy, your personal thoughts and assessment responses never leave your device.
          </p>

          {/* Consent Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-4 bg-white/80 backdrop-blur rounded-2xl border border-mindora-border/80 shadow-2xs cursor-pointer transition-colors hover:border-mindora-primary/40">
              <input
                type="checkbox"
                checked={hasConsented}
                onChange={(e) => onToggleConsent(e.target.checked)}
                className="mt-1 w-4 h-4 text-mindora-primary rounded border-slate-300 focus:ring-mindora-primary/30 accent-mindora-primary cursor-pointer"
              />
              <div className="text-xs text-mindora-darkText leading-relaxed">
                <span className="font-bold text-mindora-primary block text-sm">
                  Acknowledge Offline Privacy & Non-Clinical Scope
                </span>
                I understand that Mindora 2.0 is an educational self-reflection platform and does not offer clinical depression diagnosis or medical therapy. I consent to temporary session-only assessment processing in volatile memory.
              </div>
            </label>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <Button
              size="lg"
              onClick={onStartAssessment}
              disabled={!hasConsented}
              icon={<ArrowRight className="w-5 h-5" />}
              iconPosition="right"
              className="w-full sm:w-auto shadow-md"
            >
              Begin Student Assessment
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={onExplorePreview}
              icon={<Sparkles className="w-4 h-4 text-amber-600" />}
              className="w-full sm:w-auto"
            >
              Explore Preview Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Pillar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 text-mindora-primary flex items-center justify-center shadow-2xs">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-mindora-darkText">Zero-Persistence Privacy</h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            Standardized psychometric items (including PHQ-9 questions and crisis responses) are strictly classified as Category A sensitive data. They exist only in browser memory and are wiped when you close the tab.
          </p>
        </Card>

        <Card hoverable className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-mindora-darkText">Explainable Habit Insights</h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            Gain transparent understanding of how your sleep schedule, study hours, and academic load interact. We prioritize transparent, actionable habits over opaque black-box scores.
          </p>
        </Card>

        <Card hoverable className="space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-mindora-darkText">Supportive Safety Safeguards</h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            If self-harm or distress is reported, supportive national resources (such as Tele-MANAS in India, 988 in the US/Canada, and 999 in the UK) are surfaced with zero automated barrier.
          </p>
        </Card>
      </div>

      {/* Tri-Engine Architecture & Governance Card */}
      <Card className="bg-gradient-to-r from-white to-mindora-surface border-mindora-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-mindora-border/60">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-mindora-primary">
              Core System Architecture
            </span>
            <h2 className="text-xl font-bold text-mindora-darkText mt-0.5">
              The Three-Layer Segregated Design
            </h2>
          </div>
          <Badge variant="violet">Governed Boundaries</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-mindora-border/70 space-y-1.5 shadow-2xs">
            <div className="font-bold text-mindora-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Layer 1: Deterministic Engine</span>
            </div>
            <p className="text-mindora-mutedText leading-relaxed">
              Calculates lifestyle friction, sleep indices, and standardized PHQ-9 scoring with zero guesswork.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-mindora-border/70 space-y-1.5 shadow-2xs">
            <div className="font-bold text-mindora-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Layer 2: ML Research Sandbox</span>
            </div>
            <p className="text-mindora-mutedText leading-relaxed">
              Experimental models (Stage 3B.4) remain isolated in the research lab. Never exposed to students as medical diagnoses.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-mindora-border/70 space-y-1.5 shadow-2xs">
            <div className="font-bold text-mindora-primary flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Layer 3: Resource Navigator</span>
            </div>
            <p className="text-mindora-mutedText leading-relaxed">
              Curates verified crisis directories and campus support pathways (Tele-MANAS, 988, 999).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
