import React from 'react';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Database,
  ShieldCheck
} from 'lucide-react';
import { PrivacyDataCenter } from '../components/privacy/PrivacyDataCenter';
import type { NavigationScreen } from '../storage/sessionStorage';

interface DataCenterScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const DataCenterScreen: React.FC<DataCenterScreenProps> = ({
  onNavigate
}) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-slate-50 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Database className="w-3.5 h-3.5" />}>
              Data Sovereignty
            </Badge>
            <Badge variant="slate">Client-Controlled</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Personal Data Center & Privacy Vault
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Audit, export, or permanently erase your local wellness records. You retain 100% control over all data stored within this browser instance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('privacy_security')}
          icon={<ShieldCheck className="w-3.5 h-3.5 text-violet-600" />}
        >
          Privacy & Security
        </Button>
      </div>

      {/* Embed Reusable Component: PrivacyDataCenter */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-mindora-border shadow-soft">
        <PrivacyDataCenter />
      </div>
    </div>
  );
};
