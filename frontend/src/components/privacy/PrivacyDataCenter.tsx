import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  RefreshCw
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { DataCategoryInventory } from '../../contracts/privacyInventoryContract';
import {
  executePrivacyDeletion,
  getPrivacyInventory
} from '../../engines/privacyInventoryEngine';
import { DataCategoryCard } from './DataCategoryCard';
import { DataDeletionConfirmation } from './DataDeletionConfirmation';

interface PrivacyDataCenterProps {
  onDataPurged?: () => void;
}

export const PrivacyDataCenter: React.FC<PrivacyDataCenterProps> = ({ onDataPurged }) => {
  const [categories, setCategories] = useState<DataCategoryInventory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<DataCategoryInventory | null>(null);
  const [isAllDataModal, setIsAllDataModal] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const refreshInventory = async () => {
    setLoading(true);
    try {
      const inv = await getPrivacyInventory();
      setCategories(inv);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInventory();
  }, []);

  const handleClearSingle = async () => {
    if (!selectedCategory) return;
    const res = await executePrivacyDeletion(selectedCategory.id);
    setStatusMessage(res.message);
    await refreshInventory();
    if (onDataPurged) onDataPurged();
  };

  const handleClearAll = async () => {
    const res = await executePrivacyDeletion('all_eligible');
    setStatusMessage(res.message);
    await refreshInventory();
    if (onDataPurged) onDataPurged();
  };

  return (
    <Card className="p-5 sm:p-6 lg:p-7 border border-mindora-border/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Privacy & My Data Control Center
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Client-Side Isolation
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Full transparency over what Mindora stores, where it resides on your machine, and how you can export or delete it.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshInventory}
            disabled={loading}
            className="text-xs font-semibold text-slate-500"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAllDataModal(true)}
            className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            <span>Clear All Eligible Data</span>
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mindora Privacy Pledge Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-indigo-50/40 border border-emerald-200/80 space-y-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
            Mindora’s Zero-Cloud Privacy Guarantee
          </h3>
        </div>
        <p className="text-xs text-emerald-900/90 leading-relaxed">
          Mindora 2.0 does not transmit your personal notes, lifestyle reflections, or psychometrics to any cloud server or telemetry provider.
          Your assessment is evaluated locally via deterministic mathematics. When you choose to save Weekly Trends, records are protected with 
          AES-256-GCM encryption with 600,000 PBKDF2 iterations using a passphrase known only to you.
        </p>
      </div>

      {/* 6 Data Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
          <DataCategoryCard
            key={cat.id}
            category={cat}
            onInitiateClear={(c) => setSelectedCategory(c)}
          />
        ))}
      </div>

      {/* Confirmation Modal */}
      <DataDeletionConfirmation
        category={selectedCategory}
        isAllData={isAllDataModal}
        isOpen={isAllDataModal || !!selectedCategory}
        onClose={() => {
          setSelectedCategory(null);
          setIsAllDataModal(false);
        }}
        onConfirm={isAllDataModal ? handleClearAll : handleClearSingle}
      />
    </Card>
  );
};
