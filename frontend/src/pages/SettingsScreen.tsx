import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Sliders,
  Eye,
  RotateCcw,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { personalizationStorage } from '../storage/personalizationStorage';
import { AccessibilityPreferencesModal } from '../components/personalization/AccessibilityPreferencesModal';
import { DashboardCustomizationModal } from '../components/personalization/DashboardCustomizationModal';
import type { NavigationScreen } from '../storage/sessionStorage';

interface SettingsScreenProps {
  onResetSession: () => void;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onResetSession,
  onNavigate: _onNavigate,
  onOpenCrisis: _onOpenCrisis
}) => {
  const [personalState, setPersonalState] = useState(() => personalizationStorage.getState());
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleDensityChange = (density: 'compact' | 'standard' | 'spacious') => {
    personalizationStorage.updateAccessibility((prev) => ({ ...prev, density }));
    setPersonalState(personalizationStorage.getState());
  };

  const handleContrastToggle = (highContrast: 'standard' | 'high_contrast') => {
    personalizationStorage.updateAccessibility((prev) => ({ ...prev, highContrast }));
    setPersonalState(personalizationStorage.getState());
  };

  const handleFontSizeChange = (fontSize: 'standard' | 'large' | 'extra_large') => {
    personalizationStorage.updateAccessibility((prev) => ({ ...prev, fontSize }));
    setPersonalState(personalizationStorage.getState());
  };

  const handlePerformReset = () => {
    onResetSession();
    setResetDone(true);
    setTimeout(() => setResetDone(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-slate-50 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Sliders className="w-3.5 h-3.5" />}>
              Platform Preferences
            </Badge>
            <Badge variant="slate">User Customization</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Settings & Accessibility
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Customize visual contrast, layout spacing, font scaling, and session controls for comfortable study and reading.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAccessibilityOpen(true)}
          icon={<Eye className="w-3.5 h-3.5 text-violet-600" />}
        >
          Accessibility Modal
        </Button>
      </div>

      {resetDone && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Session memory has been reset to initial baseline values.</span>
        </div>
      )}

      {/* Appearance & Layout Density Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-600" />
          Layout Density & Spacing
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'compact', title: 'Compact', desc: 'Higher information density with reduced card padding.' },
            { id: 'standard', title: 'Balanced (Default)', desc: 'Standard SaaS spacing for optimal reading comfort.' },
            { id: 'spacious', title: 'Spacious', desc: 'Extra generous padding and breathing room between cards.' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleDensityChange(item.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                personalState.accessibility.density === item.id
                  ? 'border-violet-600 bg-violet-50/70 shadow-sm ring-2 ring-violet-500/20'
                  : 'border-slate-200 hover:border-violet-200 hover:bg-slate-50'
              }`}
            >
              <span className="font-bold text-xs sm:text-sm text-mindora-darkText block">
                {item.title}
              </span>
              <span className="text-[11px] text-mindora-mutedText mt-1 block">
                {item.desc}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Contrast & Font Size Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
          <Eye className="w-5 h-5 text-violet-600" />
          Contrast & Typography Scaling
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase text-mindora-darkText mb-2">
              Color Contrast
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleContrastToggle('standard')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold ${
                  personalState.accessibility.highContrast === 'standard'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Standard Palette
              </button>
              <button
                onClick={() => handleContrastToggle('high_contrast')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold ${
                  personalState.accessibility.highContrast === 'high_contrast'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                High Contrast (WCAG AA)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-mindora-darkText mb-2">
              Text Scaling
            </label>
            <div className="flex gap-2">
              {['standard', 'large', 'extra_large'].map((fs) => (
                <button
                  key={fs}
                  onClick={() => handleFontSizeChange(fs as any)}
                  className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold capitalize ${
                    personalState.accessibility.fontSize === fs
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {fs.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Session Controls Card */}
      <Card className="p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-slate-500" />
          Session Memory Controls
        </h2>
        <p className="text-xs text-mindora-mutedText leading-relaxed">
          Clear uncommitted reflection inputs and restore fresh session baseline state in browser memory without deleting your account profile.
        </p>
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePerformReset}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
          >
            Reset Active Session Memory
          </Button>
        </div>
      </Card>

      {/* Accessibility Preferences Modal */}
      {isAccessibilityOpen && (
        <AccessibilityPreferencesModal
          isOpen={isAccessibilityOpen}
          onClose={() => setIsAccessibilityOpen(false)}
          onPreferencesUpdated={() => setPersonalState(personalizationStorage.getState())}
        />
      )}

      {/* Dashboard Customization Modal */}
      {isCustomizationOpen && (
        <DashboardCustomizationModal
          isOpen={isCustomizationOpen}
          onClose={() => setIsCustomizationOpen(false)}
          onPreferencesUpdated={() => setPersonalState(personalizationStorage.getState())}
        />
      )}
    </div>
  );
};
