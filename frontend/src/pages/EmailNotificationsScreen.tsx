import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Mail,
  CheckCircle2,
  ShieldCheck,
  Send,
  RotateCcw,
  Sliders,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface EmailNotificationsScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const EmailNotificationsScreen: React.FC<EmailNotificationsScreenProps> = ({
  onNavigate,
  onOpenCrisis: _onOpenCrisis
}) => {
  const [guardianEmail, setGuardianEmail] = useState<string>('guardian@example.com');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [emailConsent, setEmailConsent] = useState<boolean>(false);

  // Email Verification OTP State
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [emailOtpSending, setEmailOtpSending] = useState<boolean>(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState<boolean>(false);
  const [emailOtpMessage, setEmailOtpMessage] = useState<string | null>(null);
  const [disclosedOtp, setDisclosedOtp] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Email Verification Link Handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('verify_guardian_token');
    if (tokenParam) {
      (async () => {
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/guardian/verify-email-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenParam })
          });
          const data = await res.json();
          if (res.ok && data.status === 'success') {
            setIsEmailVerified(true);
            setEmailOtpMessage('Guardian email successfully verified via secure link!');
            fetchProfileAndStatus();
          } else {
            setEmailOtpMessage(data.detail || 'Verification link expired or invalid.');
          }
        } catch {
          setEmailOtpMessage('Network error occurred while validating verification link.');
        }
      })();
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Auto-Alert Policy & Episode State
  const [_activeEpisode, setActiveEpisode] = useState<any>(null);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  // Stress Simulation State
  const [simScore, setSimScore] = useState<number>(75);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Audit Logs State
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const getAuthToken = () => sessionStorage.getItem('mindora_auth_token') || '';

  const fetchProfileAndStatus = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const userData = data.profile || data.user;
      if (data.status === 'success' && userData) {
        const g = userData.guardian || {};
        if (g.email) setGuardianEmail(g.email);
        setIsEmailVerified(Boolean(g.email_verified));
        setEmailConsent(Boolean(g.guardian_consent));
      }
    } catch {}

    try {
      const epRes = await fetch(`${getApiBaseUrl()}/api/guardian/episode-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const epData = await epRes.json();
      if (epData.status === 'success') {
        setActiveEpisode(epData.active_episode);
        if (epData.recent_audit_logs) {
          setAuditLog(epData.recent_audit_logs);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchProfileAndStatus();
  }, []);

  // Send Verification OTP & Link
  const handleSendEmailOtp = async () => {
    const token = getAuthToken();
    if (!token) return;
    if (resendCooldown > 0) return;

    setEmailOtpSending(true);
    setEmailOtpMessage(null);
    setDisclosedOtp(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/guardian/send-email-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: guardianEmail })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setEmailOtpMessage('Verification code and secure link dispatched to guardian email.');
        setResendCooldown(30);
        const codeValue = data.code || data.dev_otp;
        if (codeValue) {
          setDisclosedOtp(codeValue);
        }
      } else {
        setEmailOtpMessage(data.detail || data.message || 'Failed to send verification.');
      }
    } catch {
      setEmailOtpMessage('Network error occurred while requesting verification email.');
    } finally {
      setEmailOtpSending(false);
    }
  };

  // Verify OTP
  const handleVerifyEmailOtp = async () => {
    const token = getAuthToken();
    if (!token || !emailOtpCode.trim()) return;
    setEmailOtpVerifying(true);
    setEmailOtpMessage(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/guardian/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: emailOtpCode.trim() })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIsEmailVerified(true);
        setEmailOtpMessage('Guardian email successfully verified!');
        setDisclosedOtp(null);
        setEmailOtpCode('');
        await fetchProfileAndStatus();
      } else {
        setEmailOtpMessage(data.detail || 'Invalid or expired OTP code.');
      }
    } catch {
      setEmailOtpMessage('Network error occurred while verifying OTP.');
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  // Toggle Email Consent
  const handleToggleConsent = async (desiredConsent: boolean) => {
    const token = getAuthToken();
    if (!token) return;
    setPolicyMessage(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/guardian/email-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ consent: desiredConsent })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setEmailConsent(desiredConsent);
        setPolicyMessage(
          desiredConsent
            ? 'Guardian email notification consent granted.'
            : 'Guardian email notification consent withdrawn. Automatic emails are deactivated.'
        );
      } else {
        setPolicyMessage(data.detail || 'Failed to update notification consent.');
      }
    } catch {
      setPolicyMessage('Network error updating consent.');
    }
  };

  // Run Stress Evaluation Simulator
  const handleRunSimulation = async () => {
    const token = getAuthToken();
    if (!token) return;
    setSimRunning(true);
    setSimResult(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/guardian/evaluate-stress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          stress_score: simScore,
          idempotency_key: `sim-${Date.now()}`
        })
      });
      const data = await res.json();
      setSimResult(data);
      await fetchProfileAndStatus();
    } catch {
      setSimResult({ status: 'error', detail: 'Network error executing stress evaluation.' });
    } finally {
      setSimRunning(false);
    }
  };

  // Retry Failed Notification
  const handleRetryNotification = async (notificationId: number) => {
    const token = getAuthToken();
    if (!token) return;
    setRetryingId(notificationId);

    try {
      await fetch(`${getApiBaseUrl()}/api/guardian/retry-notification/${notificationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchProfileAndStatus();
    } catch {}
    finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-pink-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Mail className="w-3.5 h-3.5" />}>
              Automated SMTP Service
            </Badge>
            <Badge variant="slate">Two-Level Thresholds</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Automated Guardian Email Alerts
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Configure privacy-preserving automated guardian alerts when sustained stress thresholds are crossed.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('guardian_info')}
          icon={<ArrowRight className="w-3.5 h-3.5 text-violet-600" />}
        >
          Guardian Profile
        </Button>
      </div>

      {/* Threshold Logic Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              Threshold 70 — Level 1
            </span>
            <span className="text-xs font-semibold text-slate-500">Score 70% – 89%</span>
          </div>
          <h3 className="text-base font-bold text-mindora-darkText">
            Elevated Stress Alert
          </h3>
          <p className="text-xs text-mindora-mutedText mt-2 leading-relaxed">
            Sends an informative, supportive check-in email with the student's actual stress indicator percentage, interpretation, and supportive parent recommendations.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Cooldown: 24-hour episode cooldown prevents notification floods.
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
              Threshold 90 — Level 2
            </span>
            <span className="text-xs font-semibold text-slate-500">Score 90% – 100%</span>
          </div>
          <h3 className="text-base font-bold text-mindora-darkText">
            Urgent Wellbeing Alert
          </h3>
          <p className="text-xs text-mindora-mutedText mt-2 leading-relaxed">
            Sends an urgent alert with actual percentage recommending prompt parental check-in and connection with collegiate wellness counseling.
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Independent escalation: Never blocked by Level 1 cooldown.
          </div>
        </Card>
      </div>

      {/* Verification & Consent Settings Card */}
      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
              Guardian Email Verification & Explicit Consent
            </h2>
            <p className="text-xs text-mindora-mutedText mt-0.5">
              Automated notifications are strictly blocked until the email address is verified and you provide explicit consent.
            </p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Guardian Recipient Email
            </span>
            <span className="text-sm font-bold text-mindora-darkText">{guardianEmail}</span>
          </div>

          <div className="flex items-center gap-2">
            {isEmailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                Email Verified
              </span>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmailOtp}
                disabled={emailOtpSending || resendCooldown > 0}
                icon={<Send className="w-3.5 h-3.5" />}
              >
                {emailOtpSending
                  ? 'Sending...'
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : 'Send Verification Email'}
              </Button>
            )}
          </div>
        </div>

        {/* OTP Input Form (if unverified) */}
        {!isEmailVerified && (
          <div className="space-y-3 p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
            <label className="block text-xs font-bold text-mindora-darkText">
              Enter 6-Digit Email Verification Code
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                maxLength={6}
                value={emailOtpCode}
                onChange={(e) => setEmailOtpCode(e.target.value)}
                placeholder="123456"
                className="w-36 px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-center text-sm tracking-widest focus:border-violet-600"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleVerifyEmailOtp}
                disabled={emailOtpVerifying || emailOtpCode.trim().length !== 6}
              >
                {emailOtpVerifying ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
            {disclosedOtp && (
              <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                Development Test OTP: <strong>{disclosedOtp}</strong>
              </div>
            )}
          </div>
        )}

        {emailOtpMessage && (
          <div className="text-xs text-violet-800 bg-violet-50 p-3 rounded-xl border border-violet-200">
            {emailOtpMessage}
          </div>
        )}

        {/* Consent Toggle & Revocation */}
        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-mindora-darkText">
                Automated Notification Consent
              </span>
              <Badge variant={emailConsent ? 'violet' : 'slate'}>
                {emailConsent ? 'Active Consent' : 'Disabled'}
              </Badge>
            </div>
            <p className="text-xs text-mindora-mutedText mt-0.5 max-w-lg">
              When enabled, Mindora will dispatch supportive check-in emails to your verified guardian if calculated stress reaches 75 or 90.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {emailConsent ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleConsent(false)}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Withdraw Consent
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleToggleConsent(true)}
                disabled={!isEmailVerified}
              >
                Enable Email Alerts
              </Button>
            )}
          </div>
        </div>

        {policyMessage && (
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            {policyMessage}
          </div>
        )}
      </Card>

      {/* Stress Evaluation Simulator Card */}
      <Card className="p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
          <Sliders className="w-5 h-5 text-violet-600" />
          Threshold Alert Simulator (Testing Tool)
        </h2>
        <p className="text-xs text-mindora-mutedText">
          Simulate a calculated stress score to observe the automated two-level notification logic and episode tracking.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-mindora-darkText">Simulated Score:</span>
            <input
              type="number"
              min={0}
              max={100}
              value={simScore}
              onChange={(e) => setSimScore(Number(e.target.value))}
              className="w-20 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-center text-xs"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimScore(78)}
            className="text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            Preset Level 1 (78)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimScore(94)}
            className="text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
          >
            Preset Level 2 (94)
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunSimulation}
            disabled={simRunning}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            {simRunning ? 'Evaluating...' : 'Run Stress Test'}
          </Button>
        </div>

        {simResult && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="font-bold text-mindora-darkText">
              Evaluation Outcome: {simResult.notification_dispatched ? 'EMAIL DISPATCHED' : simResult.reason || simResult.status}
            </div>
            {simResult.level && <div>Alert Level: {simResult.level}</div>}
            {simResult.cooldown_active && <div className="text-amber-700 font-semibold">24-hour cooldown active. Notification suppressed.</div>}
          </div>
        )}
      </Card>

      {/* Notification Audit Log */}
      <Card className="p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-mindora-darkText flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-violet-600" />
            Notification Audit Trail & History
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProfileAndStatus}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
        </div>

        {auditLog.length === 0 ? (
          <div className="text-center py-6 text-xs text-mindora-mutedText">
            No notification episodes recorded. All stress levels have remained within safe bounds.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 uppercase tracking-wider">
                  <th className="pb-2 font-bold">Episode ID</th>
                  <th className="pb-2 font-bold">Alert Level</th>
                  <th className="pb-2 font-bold">Status</th>
                  <th className="pb-2 font-bold">Timestamp</th>
                  <th className="pb-2 font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLog.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 font-mono text-slate-600">#{log.id}</td>
                    <td className="py-2.5 font-bold text-violet-700">{log.level || 'LEVEL_1'}</td>
                    <td className="py-2.5">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {log.status || 'DELIVERED'}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-500">{log.timestamp || log.created_at || 'Recent'}</td>
                    <td className="py-2.5">
                      {log.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetryNotification(log.id)}
                          disabled={retryingId === log.id}
                          className="font-semibold text-violet-600 hover:text-violet-800"
                        >
                          {retryingId === log.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
