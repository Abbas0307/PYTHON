import React from 'react';
import { ShieldAlert, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-mindora-border/60 bg-white/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Important Disclaimer Card */}
        <div className="bg-mindora-surface rounded-2xl p-4 md:p-5 border border-mindora-border/80 text-xs text-mindora-mutedText leading-relaxed">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-mindora-darkText block mb-1">
                Important Educational & Non-Diagnostic Disclaimer
              </span>
              Mindora 2.0 is an educational student wellbeing intelligence platform designed to reflect academic habits, sleep routines, and self-reported patterns. It does <strong>NOT</strong> provide medical diagnoses, psychiatric triage, clinical depression treatment, or medical advice. Standardized assessment instruments (such as the PHQ-9) are informational screening tools only. For clinical evaluations, please speak directly with a university counseling center or licensed mental healthcare professional.
            </div>
          </div>
        </div>

        {/* Bottom links and branding */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-mindora-mutedText">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-mindora-primary">Mindora 2.0</span>
            <span>•</span>
            <span>Student Wellbeing Intelligence Platform</span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
              <Lock className="w-3 h-3" /> Offline-First Client Memory
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>National Crisis: <strong>14416</strong> (India Tele-MANAS) • <strong>988</strong> (US/CA) • <strong>999/111</strong> (UK)</span>
            <span>•</span>
            <span>Zero Remote Storage</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
