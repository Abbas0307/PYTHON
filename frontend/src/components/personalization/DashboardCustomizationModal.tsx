import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  ShieldCheck,
  Sliders
} from 'lucide-react';
import { Button } from '../common/Button';
import {
  ALL_DASHBOARD_SECTIONS,
  DashboardSectionId,
  LayoutDensity,
  PersonalizationState
} from '../../contracts/personalizationContract';
import { personalizationStorage } from '../../storage/personalizationStorage';

interface DashboardCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPreferencesUpdated: () => void;
}

export const DashboardCustomizationModal: React.FC<DashboardCustomizationModalProps> = ({
  isOpen,
  onClose,
  onPreferencesUpdated
}) => {
  if (!isOpen) return null;

  const [state, setState] = useState<PersonalizationState>(personalizationStorage.getState());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleSection = (id: DashboardSectionId) => {
    if (id === 'wellbeing_overview') return; // Mandatory
    const isVisible = state.visibleSections.includes(id);
    const updated = isVisible
      ? state.visibleSections.filter((s) => s !== id)
      : [...state.visibleSections, id];

    personalizationStorage.setVisibleSections(updated);
    setState(personalizationStorage.getState());
    onPreferencesUpdated();
  };

  const moveSection = (id: DashboardSectionId, direction: 'up' | 'down') => {
    const currentOrder = [...state.sectionOrder];
    const index = currentOrder.indexOf(id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;

    // Swap
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIndex];
    currentOrder[targetIndex] = temp;

    personalizationStorage.setSectionOrder(currentOrder);
    setState(personalizationStorage.getState());
    onPreferencesUpdated();
  };

  const handleDensityChange = (density: LayoutDensity) => {
    personalizationStorage.updateAccessibility((prev) => ({ ...prev, density }));
    setState(personalizationStorage.getState());
    onPreferencesUpdated();
  };

  const handleResetDefaults = () => {
    personalizationStorage.restoreDefaultLayout();
    setState(personalizationStorage.getState());
    onPreferencesUpdated();
    setSuccessMessage('Dashboard layout restored to default view.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-customization-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-mindora-border/80 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 sm:p-6 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-violet-200" aria-hidden="true" />
              <h2 id="dashboard-customization-title" className="text-lg sm:text-xl font-bold">
                Customize Dashboard Layout
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-violet-100/90 leading-relaxed">
              Personalize which sections appear on your dashboard and reorder them to match your study workflow.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close customization dialog"
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {successMessage && (
            <div
              role="status"
              className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Density Preference */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Layout Density
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'standard', 'spacious'] as LayoutDensity[]).map((d) => (
                <button
                  key={d}
                  onClick={() => handleDensityChange(d)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                    state.accessibility.density === d
                      ? 'bg-violet-50 border-violet-500 text-violet-700 shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Reorder and Toggle Sections */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Dashboard Sections ({state.visibleSections.length} visible)
              </span>
              <span className="text-[11px] text-slate-400">
                Mandatory safety sections remain pinned
              </span>
            </div>

            <div className="space-y-2">
              {state.sectionOrder.map((sectionId, idx) => {
                const meta = ALL_DASHBOARD_SECTIONS.find((s) => s.id === sectionId);
                if (!meta) return null;
                const isVisible = state.visibleSections.includes(sectionId);

                return (
                  <div
                    key={sectionId}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isVisible
                        ? 'bg-white border-slate-200 shadow-2xs'
                        : 'bg-slate-50/80 border-dashed border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button
                          onClick={() => moveSection(sectionId, 'up')}
                          disabled={idx === 0}
                          aria-label={`Move ${meta.title} up`}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                        >
                          <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => moveSection(sectionId, 'down')}
                          disabled={idx === state.sectionOrder.length - 1}
                          aria-label={`Move ${meta.title} down`}
                          className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed text-slate-600"
                        >
                          <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {meta.title}
                          </span>
                          {meta.isMandatory && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                              Mandatory Core
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {meta.isMandatory ? (
                        <div
                          title="Mandatory educational and safety information cannot be hidden"
                          className="p-2 text-slate-400 cursor-not-allowed"
                        >
                          <ShieldCheck className="w-5 h-5 text-emerald-600" aria-label="Mandatory Section" />
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleSection(sectionId)}
                          aria-label={isVisible ? `Hide ${meta.title}` : `Show ${meta.title}`}
                          className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            isVisible
                              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {isVisible ? (
                            <>
                              <Eye className="w-4 h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Visible</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-4 h-4" aria-hidden="true" />
                              <span className="hidden sm:inline">Hidden</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleResetDefaults}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-200/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Restore Default Layout</span>
          </button>

          <Button variant="primary" size="sm" onClick={onClose}>
            Done Customizing
          </Button>
        </div>
      </div>
    </div>
  );
};
