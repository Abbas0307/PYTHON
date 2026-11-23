import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  LifeBuoy,
  Phone,
  Heart,
  Globe2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Share2,
  Check
} from 'lucide-react';
import { NATIONAL_CRISIS_DIRECTORY } from '../engines/crisisDirectory';
import { LocalResourceCompanion } from '../components/companion/LocalResourceCompanion';
import type { NavigationScreen } from '../storage/sessionStorage';

interface HelpSupportScreenProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  onNavigate: (screen: NavigationScreen) => void;
}

export const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({
  selectedCountry,
  onCountryChange,
  onNavigate: _onNavigate
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [copiedHelpline, setCopiedHelpline] = useState<boolean>(false);
  const countries = Object.keys(NATIONAL_CRISIS_DIRECTORY);
  const currentCrisis = NATIONAL_CRISIS_DIRECTORY[selectedCountry] || NATIONAL_CRISIS_DIRECTORY['India'];

  const handleShareHelpline = async () => {
    const textToShare = `${currentCrisis.primaryMentalHealthService}: Call ${currentCrisis.primaryMentalHealthNumber} (Free, Confidential 24/7). Emergency Dispatch: ${currentCrisis.emergencyNumber}. Shared from Mindora Student Wellbeing.`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: currentCrisis.primaryMentalHealthService,
          text: textToShare,
          url: 'https://telemanas.mohfw.gov.in'
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopiedHelpline(true);
        setTimeout(() => setCopiedHelpline(false), 3000);
      } catch {}
    }
  };

  const faqs = [
    {
      q: 'Is Mindora a substitute for a professional therapist or doctor?',
      a: 'No. Mindora is an educational self-care and lifestyle pacing intelligence tool. It calculates statistical lifestyle equilibrium from self-reported data. It never issues psychiatric or medical diagnoses.'
    },
    {
      q: 'Will my university, professors, or peers ever see my responses?',
      a: 'Never. Mindora is architected with a strict client-side encryption policy. Your assessment responses, check-in reflections, and journal notes are stored in private local memory using authenticated AES-256-GCM encryption with 600,000 PBKDF2 rounds.'
    },
    {
      q: 'What triggers automated email notifications to my guardian?',
      a: 'Automated email alerts are dispatched ONLY if you explicitly enable guardian notifications, verify their email address, and your calculated stress reaches approved thresholds (75 for Level 1 High Stress, or 90 for Level 2 Critical Stress). Furthermore, you can withdraw consent at any time with immediate effect.'
    },
    {
      q: 'Do guardian emails contain my specific answers or test scores?',
      a: 'No. The automated emails contain zero test scores, zero PHQ-9 items, and zero clinical diagnosis terms. They simply provide a gentle, non-diagnostic prompt encouraging your guardian to check in on your academic wellbeing.'
    },
    {
      q: 'How do I erase all my personal data from Mindora?',
      a: 'You can navigate to the Data Center in the left sidebar and click "Purge Local Storage & Vaults" or clear individual data categories. The erasure is immediate and permanent.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-pink-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="rose" icon={<Heart className="w-3.5 h-3.5" />}>
              24/7 Support Network
            </Badge>
            <Badge variant="slate">Confidential & Free</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Help & Crisis Support Center
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Free, confidential emotional support hotlines, collegiate guidance, and student platform answers.
          </p>
        </div>

        {/* Country Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          <Globe2 className="w-4 h-4 text-violet-600" />
          <select
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="text-xs font-bold text-mindora-darkText bg-transparent focus:outline-none cursor-pointer"
          >
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Immediate Emergency Helplines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primary National Lifeline */}
        <Card className="p-6 border-l-4 border-l-rose-500 bg-rose-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
              Primary Lifeline
            </span>
            <Phone className="w-4 h-4 text-rose-500" />
          </div>
          <h3 className="text-base font-extrabold text-mindora-darkText">
            {currentCrisis.primaryMentalHealthService}
          </h3>
          <p className="text-xs text-mindora-mutedText mt-1">
            24/7 free and confidential mental health and suicide prevention line.
          </p>
          <div className="mt-4 pt-3 border-t border-rose-100 flex flex-wrap items-center gap-2">
            <a
              href={`tel:${currentCrisis.primaryMentalHealthNumber.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-2 text-sm font-extrabold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-3.5 py-1.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call {currentCrisis.primaryMentalHealthNumber}
            </a>
            <button
              onClick={handleShareHelpline}
              title="Share or Copy helpline information"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-900 bg-white border border-rose-300 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {copiedHelpline ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedHelpline ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </Card>

        {/* Text / Crisis Line */}
        <Card className="p-6 border-l-4 border-l-violet-500 bg-violet-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
              Crisis Text Support
            </span>
            <LifeBuoy className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-base font-extrabold text-mindora-darkText">
            Crisis Text Line
          </h3>
          <p className="text-xs text-mindora-mutedText mt-1">
            Connect with a crisis counselor over text messaging at any hour.
          </p>
          <div className="mt-4 pt-3 border-t border-violet-100">
            <span className="inline-block text-xs font-bold text-violet-800 bg-violet-100 px-3 py-1.5 rounded-xl">
              Text HOME to 741741
            </span>
          </div>
        </Card>

        {/* Emergency Services */}
        <Card className="p-6 border-l-4 border-l-amber-500 bg-amber-50/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
              Immediate Danger
            </span>
            <Phone className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-base font-extrabold text-mindora-darkText">
            National Emergency Services
          </h3>
          <p className="text-xs text-mindora-mutedText mt-1">
            If you or someone around you is in immediate danger or medical distress.
          </p>
          <div className="mt-4 pt-3 border-t border-amber-100">
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-1.5 rounded-xl transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call Emergency 112 / 911
            </a>
          </div>
        </Card>
      </div>

      {/* Local AI Resource Navigator Companion */}
      <Card className="p-6 sm:p-8">
        <h2 className="text-base font-bold text-mindora-darkText mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-violet-600" />
          Collegiate Resource Navigator
        </h2>
        <LocalResourceCompanion selectedCountry={selectedCountry} />
      </Card>

      {/* Frequently Asked Questions Accordion */}
      <Card className="p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-violet-600" />
          Frequently Asked Questions
        </h2>

        <div className="divide-y divide-slate-100">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div key={index} className="py-3.5">
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left font-bold text-xs sm:text-sm text-mindora-darkText hover:text-violet-700 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-violet-600 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-mindora-mutedText leading-relaxed pr-4">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
