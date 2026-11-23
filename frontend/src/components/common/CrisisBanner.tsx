import React, { useState } from 'react';
import { getNationalCrisisSummary } from '../../data/resourceCatalogue';
import { Phone, ShieldAlert, Heart, ExternalLink, X, Share2, Check } from 'lucide-react';

interface CrisisBannerProps {
  country?: string;
  isTriggeredByItem9?: boolean;
  onDismiss?: () => void;
}

export const CrisisBanner: React.FC<CrisisBannerProps> = ({
  country = 'India',
  isTriggeredByItem9 = false,
  onDismiss
}) => {
  const info = getNationalCrisisSummary(country);
  const [copied, setCopied] = useState<boolean>(false);

  const handleShareHelpline = async () => {
    const textToShare = `${info.primaryMentalHealthService}: Call ${info.primaryMentalHealthNumber} (Free, Confidential 24/7). Emergency Dispatch: ${info.emergencyNumber}. Shared from Mindora Student Wellbeing.`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: info.primaryMentalHealthService,
          text: textToShare,
          url: 'https://telemanas.mohfw.gov.in'
        });
        return;
      } catch (err) {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textToShare);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    }
  };

  return (
    <section
      role="region"
      aria-label="Crisis Support & Immediate Assistance"
      className="bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 md:p-6 shadow-md mb-6 transition-all"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-3.5">
          <div
            className="p-2.5 bg-rose-500 text-white rounded-xl shadow-xs shrink-0 mt-0.5"
            aria-hidden="true"
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                {isTriggeredByItem9 ? 'Important Support Safeguard' : 'Immediate Support Available'}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Free • Confidential • 24/7</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              You do not have to carry this alone. Dedicated support is here.
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl leading-relaxed">
              If you are feeling overwhelmed, distressed, or having thoughts of hurting yourself, compassionate counselors are available right now. Speaking to someone can help you find grounding.
            </p>
          </div>
        </div>

        {onDismiss && !isTriggeredByItem9 && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss Crisis Support Banner"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white border border-slate-200 px-2.5 py-1 rounded-lg transition-colors self-end md:self-start focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Close</span>
          </button>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-rose-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Primary Mental Health Helpline */}
        <div className="bg-white/95 backdrop-blur rounded-xl p-3.5 border border-rose-200 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide">
              {info.primaryMentalHealthService}
            </span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {info.primaryMentalHealthNumber}
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {info.primaryMentalHealthDetails}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={info.primaryMentalHealthNumber.startsWith('http') ? info.primaryMentalHealthNumber : `tel:${info.primaryMentalHealthNumber.split('/')[0].trim()}`}
              aria-label={`Call ${info.primaryMentalHealthService} at ${info.primaryMentalHealthNumber}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-2 px-3 rounded-lg shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Connect Now (24/7)</span>
            </a>
            <button
              onClick={handleShareHelpline}
              aria-label="Share or copy Tele-MANAS helpline details"
              className="inline-flex items-center justify-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 border border-rose-200 py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Emergency Dispatch */}
        <div className="bg-white/95 backdrop-blur rounded-xl p-3.5 border border-amber-200 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              {info.emergencyDispatchName}
            </span>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              Dial {info.emergencyNumber}
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {info.emergencyInstruction}
            </p>
          </div>
          <a
            href={`tel:${info.emergencyNumber}`}
            aria-label={`Call Emergency Dispatch at ${info.emergencyNumber}`}
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 py-2 px-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
            Emergency Call ({info.emergencyNumber})
          </a>
        </div>

        {/* Secondary Helpline / Global Directory */}
        <div className="bg-white/95 backdrop-blur rounded-xl p-3.5 border border-slate-200 flex flex-col justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              {info.secondaryContacts[0]?.serviceName || 'International Directory'}
            </span>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {info.secondaryContacts[0]?.contactNumber || 'findahelpline.com'}
            </div>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {info.secondaryContacts[0]?.description || 'Find free, confidential support worldwide.'}
            </p>
          </div>
          <a
            href={info.secondaryContacts[0]?.actionUrl || (info.secondaryContacts[0]?.contactNumber.startsWith('http') ? info.secondaryContacts[0].contactNumber : `tel:${info.secondaryContacts[0]?.contactNumber}`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View details for ${info.secondaryContacts[0]?.serviceName || 'International Helpline Directory'}`}
            className="mt-3 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2 px-3 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            View Helpline Details
          </a>
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <span>{info.accessibilityWarning}</span>
        <span className="text-rose-700 font-semibold">Strict Privacy: Crisis interactions are never recorded.</span>
      </div>
    </section>
  );
};
