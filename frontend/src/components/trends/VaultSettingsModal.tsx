import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  KeyRound,
  FileText,
  HardDrive
} from 'lucide-react';
import { Button } from '../common/Button';
import { StorageStatus, trendStorage } from '../../storage/vault/trendStorage';

interface VaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: StorageStatus;
  onRefreshStatus: () => Promise<void>;
  onNotification: (msg: string) => void;
}

export const VaultSettingsModal: React.FC<VaultSettingsModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshStatus,
  onNotification
}) => {
  const [passphrase, setPassphrase] = useState<string>('');
  const [confirmPassphrase, setConfirmPassphrase] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleEnableVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passphrase.length < 6) {
      setErrorMsg('Passphrase must be at least 6 characters long.');
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setErrorMsg('Passphrases do not match. Please re-enter carefully.');
      return;
    }

    setIsProcessing(true);
    try {
      await trendStorage.enableEncryptedVault(passphrase);
      await onRefreshStatus();
      setPassphrase('');
      setConfirmPassphrase('');
      onNotification('Encrypted Local Vault enabled successfully.');
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize encrypted vault.');
      setIsProcessing(false);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!passphrase) {
      setErrorMsg('Please enter your passphrase.');
      return;
    }

    setIsProcessing(true);
    try {
      await trendStorage.unlockVault(passphrase);
      await onRefreshStatus();
      setPassphrase('');
      onNotification('Vault unlocked successfully.');
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect passphrase or decryption error.');
      setIsProcessing(false);
    }
  };

  const handleDisableVault = async () => {
    if (!window.confirm('Switching to In-Memory mode will delete the encrypted record from your browser storage. Your current session will remain in memory until the tab is closed. Continue?')) {
      return;
    }

    setIsProcessing(true);
    try {
      await trendStorage.disableEncryptedVault();
      await onRefreshStatus();
      onNotification('Switched to in-memory session mode. Persistent database deleted.');
      setIsProcessing(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch storage mode.');
      setIsProcessing(false);
    }
  };

  const handleLockVault = () => {
    trendStorage.lockVault();
    onRefreshStatus();
    onNotification('Vault locked. In-memory records cleared.');
  };

  const handleExport = async (format: 'json' | 'enc') => {
    try {
      const exportFile = await trendStorage.exportData(format);
      const blob = new Blob([exportFile.content], { type: exportFile.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFile.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotification(`Exported ${format === 'json' ? 'JSON' : 'encrypted container'} successfully.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Export failed.');
    }
  };

  const handlePurgeAll = async () => {
    setIsProcessing(true);
    try {
      await trendStorage.clearAllData();
      await onRefreshStatus();
      setShowPurgeConfirm(false);
      onNotification('All weekly check-ins permanently cleared from memory and disk.');
      setIsProcessing(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to purge data.');
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full border border-mindora-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-mindora-surface to-white border-b border-mindora-border flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-mindora-lavender text-mindora-primary inline-flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Privacy & Cryptographic Vault
            </span>
            <h3 id="vault-modal-title" className="text-lg sm:text-xl font-black text-mindora-darkText">
              Storage & Vault Settings
            </h3>
            <p className="text-xs text-mindora-mutedText">
              Choose how your optional weekly check-in trends are stored.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close vault settings"
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-mindora-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>{errorMsg}</div>
            </div>
          )}

          {/* Current Status Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Active Storage Mode:</span>
              <span
                className={`font-black text-xs px-2.5 py-1 rounded-full ${
                  status.mode === 'encrypted-vault'
                    ? 'bg-violet-100 text-violet-800 border border-violet-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {status.mode === 'encrypted-vault' ? 'Encrypted Local Vault (AES-GCM)' : 'In-Memory Session Only'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {status.mode === 'encrypted-vault'
                ? 'Your weekly records are encrypted with AES-256-GCM in IndexedDB using your passphrase. Plaintext is never stored on disk.'
                : 'Your check-ins exist only in volatile browser memory. When you close this tab or browser, all records vanish automatically.'}
            </p>
            <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              Recorded weeks in active memory: <strong>{status.recordCount}</strong>
            </div>
          </div>

          {/* Mode 1: Enable Encrypted Vault if in-memory */}
          {status.mode === 'in-memory' && (
            <form onSubmit={handleEnableVault} className="p-4 rounded-2xl border border-violet-200 bg-violet-50/40 space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-mindora-primary" aria-hidden="true" />
                <span className="font-extrabold text-sm text-mindora-darkText">
                  Enable Persistent Encrypted Local Vault
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Want to keep your weekly trends across browser sessions? Set a personal passphrase.
                Mindora will encrypt your records with <strong>Web Crypto AES-256-GCM</strong> (fresh 96-bit IV per write, PBKDF2 with 100k iterations).
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <label htmlFor="vault-passphrase" className="block text-[11px] font-bold text-slate-700 mb-1">
                    Choose Passphrase (min 6 characters):
                  </label>
                  <input
                    id="vault-passphrase"
                    type="password"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter a secure local passphrase"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="vault-confirm-passphrase" className="block text-[11px] font-bold text-slate-700 mb-1">
                    Confirm Passphrase:
                  </label>
                  <input
                    id="vault-confirm-passphrase"
                    type="password"
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Re-type your passphrase"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                <strong>No Cloud Reset:</strong> There is zero server recovery. If you forget your passphrase, encrypted data cannot be recovered.
              </div>

              <Button
                size="sm"
                type="submit"
                disabled={isProcessing}
                icon={<KeyRound className="w-3.5 h-3.5" />}
              >
                {isProcessing ? 'Encrypting & Saving...' : 'Initialize Encrypted Vault'}
              </Button>
            </form>
          )}

          {/* Mode 2: Unlocking or Managing Active Encrypted Vault */}
          {status.mode === 'encrypted-vault' && (
            <div className="space-y-4">
              {status.isVaultLocked ? (
                <form onSubmit={handleUnlockVault} className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" aria-hidden="true" />
                    <span className="font-extrabold text-sm text-amber-950">
                      Vault is Currently Locked
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Enter your passphrase to decrypt your weekly records into browser memory.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter passphrase to unlock"
                      className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-mindora-primary/30 focus:outline-none"
                    />
                    <Button
                      size="sm"
                      type="submit"
                      disabled={isProcessing}
                      icon={<Unlock className="w-3.5 h-3.5" />}
                    >
                      {isProcessing ? 'Unlocking...' : 'Unlock'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5">
                      <Unlock className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                      Vault Unlocked & Active
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLockVault}
                      icon={<Lock className="w-3 h-3" />}
                    >
                      Lock Vault
                    </Button>
                  </div>
                  <p className="text-xs text-emerald-900">
                    Your records are active in memory. You can switch back to temporary in-memory mode at any time.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisableVault}
                    disabled={isProcessing}
                    icon={<HardDrive className="w-3 h-3" />}
                  >
                    Switch to In-Memory Only
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Export Controls */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-mindora-primary" />
              Export Your Data
            </h4>
            <p className="text-xs text-slate-500">
              Download your records directly to your device for personal archiving:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                icon={<FileText className="w-3.5 h-3.5" />}
              >
                Export Plaintext JSON
              </Button>
              {status.mode === 'encrypted-vault' && !status.isVaultLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('enc')}
                  icon={<Lock className="w-3.5 h-3.5" />}
                >
                  Export Encrypted (.enc)
                </Button>
              )}
            </div>
          </div>

          {/* Permanent Wipe / Deletion Section */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Permanent Deletion
            </h4>
            <p className="text-xs text-rose-900 leading-relaxed">
              Irreversibly delete all weekly check-ins from both browser memory and IndexedDB storage.
            </p>

            {showPurgeConfirm ? (
              <div className="p-3 bg-white rounded-xl border border-rose-300 space-y-2">
                <span className="font-bold text-xs text-rose-950 block">
                  Are you absolutely sure? This cannot be undone.
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handlePurgeAll}
                    disabled={isProcessing}
                    className="bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Yes, Permanently Purge All Data
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPurgeConfirm(false)}
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPurgeConfirm(true)}
                className="text-rose-700 border-rose-300 hover:bg-rose-100"
              >
                Clear All Saved Trends
              </Button>
            )}
          </div>

          {/* Cryptographic Limitations Disclaimer (Mandatory) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed space-y-1">
            <strong>Cryptographic Transparency Note:</strong>
            <p>
              Browser Web Crypto provides authenticated confidentiality against local disk inspection. However, client-side encryption cannot compensate for compromised host operating systems, keyloggers, or active XSS attacks, and does not guarantee memory zeroization in JavaScript runtimes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
