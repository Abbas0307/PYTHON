import React from 'react';
import {
  Lock,
  Unlock,
  HardDrive,
  Trash2,
  Clock
} from 'lucide-react';
import type { DataCategoryInventory } from '../../contracts/privacyInventoryContract';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface DataCategoryCardProps {
  category: DataCategoryInventory;
  onInitiateClear: (category: DataCategoryInventory) => void;
}

export const DataCategoryCard: React.FC<DataCategoryCardProps> = ({
  category,
  onInitiateClear
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between gap-4">
      {/* Top Header & Badges */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">
              {category.title}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {category.itemCount} {category.itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {category.isEncrypted ? (
              <Badge variant="emerald" icon={<Lock className="w-3 h-3 text-emerald-600" />}>
                Encrypted Vault
              </Badge>
            ) : (
              <Badge variant="slate" icon={<Unlock className="w-3 h-3 text-slate-400" />}>
                {category.persistence === 'ephemeral' ? 'In-Memory Only' : 'Plaintext UI'}
              </Badge>
            )}

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
              {category.persistenceLabel.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Data stored description */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {category.dataStoredDescription}
        </p>

        {/* Storage location & Encryption specs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              <span>Storage Location</span>
            </span>
            <span className="font-semibold text-slate-700 block truncate" title={category.storageLocationLabel}>
              {category.storageLocationLabel}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Persistence & Security</span>
            </span>
            <span className="font-semibold text-slate-700 block truncate" title={category.encryptionMethod}>
              {category.encryptionMethod}
            </span>
          </div>
        </div>

        {/* Deletion Procedure */}
        <div className="text-[11px] text-slate-500 italic leading-snug">
          ℹ️ {category.deletionProcedure}
        </div>
      </div>

      {/* Action footer */}
      {category.clearSupported && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-rose-500">
            {category.isReversible ? 'Reversible' : 'Irreversible deletion'}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInitiateClear(category)}
            className="text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>{category.clearActionLabel || 'Clear Data'}</span>
          </Button>
        </div>
      )}
    </div>
  );
};
