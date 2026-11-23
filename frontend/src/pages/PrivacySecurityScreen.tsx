import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Database,
  HardDrive
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface PrivacySecurityScreenProps {
  currentUser?: any;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({
  currentUser,
  onNavigate,
  onOpenCrisis: _onOpenCrisis
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthToken = () => sessionStorage.getItem('mindora_auth_token') || '';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);
    const token = getAuthToken();

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: data.detail || 'Failed to update password.' });
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Network connection error while changing password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-slate-50 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
              Privacy & Security Center
            </Badge>
            <Badge variant="slate">Zero Remote Telemetry</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Account Security & Privacy Protections
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Mindora is built on a zero-knowledge, local-first foundation. Manage credentials and examine your cryptographic guarantees.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('data_center')}
          icon={<Database className="w-3.5 h-3.5 text-violet-600" />}
        >
          Open Data Center
        </Button>
      </div>

      {/* Security Architecture Invariant Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-mindora-darkText">Argon2id Hashing</h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            All user credentials are encrypted with memory-hard Argon2id. Passwords can never be recovered in plaintext.
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <HardDrive className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-mindora-darkText">PBKDF2 600k Rounds</h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            Longitudinal trend records are authenticated via AES-256-GCM using keys derived from 600,000 PBKDF2 iterations.
          </p>
        </Card>

        <Card className="p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-mindora-darkText">Zero Ad Tracking</h3>
          <p className="text-xs text-mindora-mutedText leading-relaxed">
            No advertising pixels, trackers, or commercial analytics scripts run anywhere within Mindora.
          </p>
        </Card>
      </div>

      {/* Password Management Form */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-violet-600" />
            Change Account Password
          </h2>
          <p className="text-xs text-mindora-mutedText mt-0.5">
            Update your student portal password. Use at least 8 characters with numbers and symbols.
          </p>
        </div>

        {passwordMessage && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              passwordMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border border-rose-300 text-rose-900'
            }`}
          >
            {passwordMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{passwordMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText"
            />
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={passwordLoading}
              icon={<KeyRound className="w-3.5 h-3.5" />}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Active Session & Consents Card */}
      <Card className="p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-mindora-darkText">
          Active Session & Consents Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-mindora-darkText block">Current User Session</span>
            <span className="text-slate-500 font-mono">{currentUser?.email || 'Authenticated Student'}</span>
            <div className="text-emerald-700 font-semibold mt-1">JWT Bearer Token Active</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-mindora-darkText block">Guardian Alert Consent</span>
            <span className="text-slate-500">
              {currentUser?.guardian?.guardian_consent ? 'Explicit Consent Enabled' : 'No Automatic Alerts'}
            </span>
            <div className="mt-1">
              <button
                onClick={() => onNavigate('email_notifications')}
                className="font-semibold text-violet-600 hover:text-violet-800"
              >
                Manage Guardian Alerts →
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
