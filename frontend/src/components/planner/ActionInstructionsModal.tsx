import React, { useEffect, useRef } from 'react';
import { X, CheckCircle2, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import type { PlannerAction } from '../../contracts/plannerContract.ts';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

interface ActionInstructionsModalProps {
  action: PlannerAction | null;
  isOpen: boolean;
  isCompleted: boolean;
  onClose: () => void;
  onToggleComplete: () => void;
}

export const ActionInstructionsModal: React.FC<ActionInstructionsModalProps> = ({
  action,
  isOpen,
  isCompleted,
  onClose,
  onToggleComplete
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !action) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-action-title"
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-mindora-border overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-mindora-border flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="violet">{action.category}</Badge>
              <Badge variant="slate">
                <Clock className="w-3 h-3 mr-1 inline" />
                {action.estimatedDuration} mins
              </Badge>
              <Badge variant="amber" className="capitalize">
                {action.difficulty}
              </Badge>
            </div>
            <h2 id="modal-action-title" className="text-lg sm:text-xl font-bold text-mindora-darkText">
              {action.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close action instructions"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Short Description */}
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {action.shortDescription}
          </p>

          {/* Practical Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-mindora-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Step-by-Step Practice
            </h3>
            <ol className="space-y-2.5">
              {action.instructions.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-mindora-primary font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="leading-snug pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Safety or Suitability Note */}
          {action.safetyOrSuitabilityNote && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-950">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block text-emerald-900">Practical Guidance:</span>
                {action.safetyOrSuitabilityNote}
              </div>
            </div>
          )}

          {/* Rationale Context */}
          <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl text-xs text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Why this helps: </strong>
            {action.rationaleTemplate}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-mindora-border bg-slate-50/50 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => {
              onToggleComplete();
              onClose();
            }}
            icon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isCompleted ? 'Mark as Incomplete' : 'Complete Action'}
          </Button>
        </div>
      </div>
    </div>
  );
};
