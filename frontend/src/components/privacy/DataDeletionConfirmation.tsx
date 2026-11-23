import React, { useState } from 'react';
import {
  AlertTriangle,
  X,
  Trash2
} from 'lucide-react';
import type { DataCategoryInventory } from '../../contracts/privacyInventoryContract';
import { Button } from '../common/Button';

interface DataDeletionConfirmationProps {
  category: DataCategoryInventory | null;
  isAllData?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DataDeletionConfirmation: React.FC<DataDeletionConfirmationProps> = ({
  category,
  isAllData = false,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [typedConfirmation, setTypedConfirmation] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const title = isAllData
    ? 'Permanently Clear All Eligible Personal Data?'
    : `Clear ${category?.shortLabel || 'Data'}?`;

  const requiresTypedConfirm = isAllData || category?.id === 'trends_vault';

  const handleConfirmAction = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="deletion-confirmation-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-rose-200 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-rose-600 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/20 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h3 id="deletion-confirmation-title" className="text-base font-bold">
                {title}
              </h3>
              <span className="text-[11px] text-rose-100">
                Irreversible local data deletion
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close confirmation dialog"
            className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-slate-700 leading-relaxed">
            {isAllData
              ? 'This action will completely purge your personalization preferences, saved student goals, in-memory planner tasks, and volatile wellness session counters.'
              : `You are about to clear records for "${category?.title}". ${category?.deletionProcedure}`}
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
            <span className="font-bold block">Consequences of Deletion:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
              <li>Cannot be undone. Data will be completely deleted from this browser.</li>
              <li>Mindora maintains zero cloud backups of your personal data.</li>
              {isAllData && (
                <li>Encrypted Weekly Trends vault is preserved unless specifically deleted separately.</li>
              )}
            </ul>
          </div>

          {requiresTypedConfirm && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Type <strong className="text-rose-600">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={typedConfirmation}
                onChange={(e) => setTypedConfirmation(e.target.value)}
                className="w-full text-xs sm:text-sm p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 font-mono uppercase"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleConfirmAction}
            disabled={
              isProcessing ||
              (requiresTypedConfirm && typedConfirmation.trim().toUpperCase() !== 'DELETE')
            }
            className="bg-rose-600 hover:bg-rose-700 text-white border-transparent font-bold"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>{isProcessing ? 'Deleting...' : 'Confirm Deletion'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
