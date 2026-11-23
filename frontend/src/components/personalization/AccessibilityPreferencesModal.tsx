import React, { useState } from 'react';
import {
  X,
  Eye,
  Type,
  Volume2,
  VolumeX,
  Globe,
  RotateCcw,
  CheckCircle,
  Check
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  AccessibilityPreferences,
  ContrastOption,
  FontSizeOption,
  ReducedMotionOption
} from '../../contracts/personalizationContract';
import { personalizationStorage } from '../../storage/personalizationStorage';

interface AccessibilityPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesUpdated: () => void;
}

export const AccessibilityPreferencesModal: React.FC<AccessibilityPreferencesModalProps> = ({
  isOpen,
  onClose,
  onPreferencesUpdated
}) => {
  if (!isOpen) return null;

  const [prefs, setPrefs] = useState<AccessibilityPreferences>(
    personalizationStorage.getState().accessibility
  );
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleUpdate = (updater: (prev: AccessibilityPreferences) => AccessibilityPreferences) => {
    personalizationStorage.updateAccessibility(updater);
    const updated = personalizationStorage.getState().accessibility;
    setPrefs(updated);
    onPreferencesUpdated();
  };

  const handleReset = () => {
    personalizationStorage.resetAllPersonalization();
    setPrefs(personalizationStorage.getState().accessibility);
    onPreferencesUpdated();
    setStatusNotice('All accessibility and personalization preferences reset to defaults.');
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-preferences-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-mindora-border/80 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 sm:p-6 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-300" aria-hidden="true" />
              <h2 id="accessibility-preferences-title" className="text-lg sm:text-xl font-bold">
                Accessibility & Personal Preferences
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Adjust text scaling, motion, contrast, and audio settings to support your sensory comfort.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close accessibility dialog"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
          {statusNotice && (
            <div
              role="status"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusNotice}</span>
            </div>
          )}

          {/* 1. Font Size Scaling */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Type className="w-4 h-4 text-indigo-600" />
              <span>Text Scaling</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'standard', label: 'Standard (100%)' },
                { id: 'large', label: 'Large (110%)' },
                { id: 'extra_large', label: 'Extra Large (120%)' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdate((p) => ({ ...p, fontSize: opt.id as FontSizeOption }))}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    prefs.fontSize === opt.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Reduced Motion */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 uppercase tracking-wider block">
              Motion & Animation
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'system', label: 'System Default' },
                { id: 'reduced', label: 'Reduce Motion' },
                { id: 'standard', label: 'Standard Motion' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdate((p) => ({ ...p, reducedMotion: opt.id as ReducedMotionOption }))}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    prefs.reducedMotion === opt.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              When reduced motion is selected, expanding breathing orbs and transition animations are suppressed.
            </p>
          </div>

          {/* 3. Contrast Mode */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 uppercase tracking-wider block">
              Visual Contrast
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'standard', label: 'Standard Contrast' },
                { id: 'high_contrast', label: 'High Contrast Mode' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleUpdate((p) => ({ ...p, highContrast: opt.id as ContrastOption }))}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                    prefs.highContrast === opt.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-800 shadow-2xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Audio Sound Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {prefs.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-indigo-600 shrink-0" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <div>
                <span className="font-bold text-slate-800 block">Restorative Chime Sound</span>
                <span className="text-[11px] text-slate-500">
                  Optional gentle Web Audio sine harmonic on timer & breathing completions.
                </span>
              </div>
            </div>

            <button
              onClick={() => handleUpdate((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
              aria-pressed={prefs.soundEnabled}
              className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                prefs.soundEnabled
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
            >
              {prefs.soundEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* 5. Verified Languages */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 uppercase tracking-wider block flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Language & Locale</span>
            </label>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">English (Verified Complete)</span>
                <span className="text-[11px] text-slate-500">
                  Complete translations verified across all contracts, tools, and disclaimers.
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Mindora only enables languages once 100% verified to prevent misleading partial translations in safety contexts.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset All Preferences</span>
          </button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
