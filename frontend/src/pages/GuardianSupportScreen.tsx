import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Users,
  Bell,
  CheckCircle2,
  Lock,
  Send,
  Eye,
  RefreshCw,
  LifeBuoy,
  Sliders,
  Mail,
  RotateCcw
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';

export const GuardianSupportScreen: React.FC = () => {
  // Guardian Contact Details
  const [guardianName, setGuardianName] = useState<string>('Morgan Rivera');
  const [relationship, setRelationship] = useState<string>('Parent');
  const [countryCode, setCountryCode] = useState<string>('+91');
  const [phone, setPhone] = useState<string>('9876543210');
  const [guardianEmail, setGuardianEmail] = useState<string>('guardian@example.com');
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(true);
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [emailConsent, setEmailConsent] = useState<boolean>(false);

  // Email Verification OTP State
  const [emailOtpCode, setEmailOtpCode] = useState<string>('');
  const [emailOtpSending, setEmailOtpSending] = useState<boolean>(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState<boolean>(false);
  const [emailOtpMessage, setEmailOtpMessage] = useState<string | null>(null);
  const [disclosedOtp, setDisclosedOtp] = useState<string | null>(null);

  // Auto-Alert Policy & Episode State
  const [activeEpisode, setActiveEpisode] = useState<any>(null);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  // Stress Simulation State
  const [simScore, setSimScore] = useState<number>(75);
  const [simRunning, setSimRunning] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Manual Support Notification State
  const [studentConfirmed, setStudentConfirmed] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [notificationSuccess, setNotificationSuccess] = useState<boolean>(false);
  const [lastAuditReceipt, setLastAuditReceipt] = useState<any>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  // Audit Logs State
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const getAuthToken = () => sessionStorage.getItem('mindora_auth_token') || '';

  const fetchProfile = async () => {
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
        if (g.name) setGuardianName(g.name);
        if (g.relationship) setRelationship(g.relationship);
        if (g.country_code) setCountryCode(g.country_code);
        if (g.phone) setPhone(g.phone);
        if (g.email) setGuardianEmail(g.email);
        setIsPhoneVerified(Boolean(g.verified));
        setIsEmailVerified(Boolean(g.email_verified));
        setEmailConsent(Boolean(g.email_consent));
      }
    } catch {
      // Offline fallback
    }
  };

  const fetchAuditLogs = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/guardian/audit-log`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const logs = data.logs || (Array.isArray(data) ? data : []);
      if (Array.isArray(logs)) {
        setAuditLog(logs);
      }
    } catch {
      // Offline fallback
    }
  };

  const fetchEpisodeStatus = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/guardian/episode-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        setActiveEpisode(data.episode);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAuditLogs();
    fetchEpisodeStatus();
  }, []);

  const handleUpdateGuardian = async () => {
    setPolicyMessage(null);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          name: guardianName,
          relationship,
          country_code: countryCode,
          phone,
          email: guardianEmail,
          email_consent: emailConsent
        })
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setPolicyMessage('Guardian contact information updated successfully.');
        fetchProfile();
      } else {
        setPolicyMessage(data.detail || 'Failed to update guardian contact.');
      }
    } catch {
      setPolicyMessage('Saved in local session.');
    }
  };

  const handleSendEmailVerification = async () => {
    setEmailOtpSending(true);
    setEmailOtpMessage(null);
    setDisclosedOtp(null);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/send-email-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setEmailOtpMessage('Verification code dispatched to guardian email.');
        if (data.code) {
          setDisclosedOtp(data.code);
        }
      } else {
        setEmailOtpMessage(data.detail || 'Failed to send verification code.');
      }
    } catch {
      setEmailOtpMessage('Failed to reach backend service.');
    } finally {
      setEmailOtpSending(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailOtpCode.trim()) {
      alert('Please enter the 6-digit verification code.');
      return;
    }
    setEmailOtpVerifying(true);
    setEmailOtpMessage(null);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ code: emailOtpCode.trim() })
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setIsEmailVerified(true);
        setEmailOtpCode('');
        setDisclosedOtp(null);
        setEmailOtpMessage('Guardian email successfully verified!');
        fetchProfile();
      } else {
        setEmailOtpMessage(data.detail || 'Invalid verification code.');
      }
    } catch {
      setEmailOtpMessage('Verification request failed.');
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleToggleConsent = async (newConsent: boolean) => {
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/email-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ consent: newConsent })
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setEmailConsent(newConsent);
        setPolicyMessage(newConsent ? 'Automated email alerts activated.' : 'Automated email alerts deactivated.');
      }
    } catch {
      setEmailConsent(newConsent);
    }
  };

  const handleSimulateScore = async (scoreToTest: number) => {
    setSimRunning(true);
    setSimResult(null);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/evaluate-stress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          friction_score: scoreToTest,
          idempotency_key: `SIM-${scoreToTest}-${Date.now()}`
        })
      });
      const data = await resp.json();
      setSimResult(data);
      fetchAuditLogs();
      fetchEpisodeStatus();
    } catch {
      setSimResult({ status: 'error', message: 'Simulation request failed' });
    } finally {
      setSimRunning(false);
    }
  };

  const handleRetryNotification = async (notificationId: number) => {
    setRetryingId(notificationId);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/retry-notification/${notificationId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        alert('Notification retry sent successfully!');
      } else {
        alert(data.message || data.detail || 'Retry failed.');
      }
      fetchAuditLogs();
    } catch {
      alert('Retry connection failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendStressNotification = async () => {
    if (!studentConfirmed) {
      alert('Please confirm that you want to dispatch this support notification.');
      return;
    }

    setIsSending(true);
    setNotificationError(null);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/guardian/notify-stress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ confirmed: true })
      });
      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        setNotificationSuccess(true);
        setLastAuditReceipt(data.audit);
        fetchAuditLogs();
      } else {
        setNotificationError(data.detail || data.message || 'Notification failed.');
      }
    } catch {
      setNotificationError('Network error while dispatching notification.');
    } finally {
      setIsSending(false);
    }
  };

  const handleRevokeConsent = async () => {
    try {
      await fetch(`${getApiBaseUrl()}/api/guardian/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
    } catch {}
    setEmailConsent(false);
    setIsEmailVerified(false);
    setIsPhoneVerified(false);
    alert('Guardian notification permission has been completely revoked. All automated communications halted.');
    fetchProfile();
    fetchAuditLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-purple-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-violet-200 text-xs font-semibold mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Voluntary Student Support Ecosystem &bull; Phase 6.1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Automated Guardian Email Alert &amp; Support System
          </h1>
          <p className="mt-2 text-sm sm:text-base text-violet-100 leading-relaxed">
            Configure automated, privacy-preserving email check-ins for your trusted guardian using secure SMTP delivery. Mindora strictly guarantees that numerical stress scores, PHQ-9 responses, and clinical diagnoses are <strong>never</strong> transmitted.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Guardian Settings & Policy Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Trusted Contact Details & Email Verification */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold text-gray-900">Guardian Contact &amp; Email Verification</h2>
              </div>
              <div className="flex items-center gap-2">
                {isPhoneVerified && <Badge variant="slate">Phone Verified</Badge>}
                {isEmailVerified ? (
                  <Badge variant="emerald">Email Verified</Badge>
                ) : (
                  <Badge variant="amber">Email Unverified</Badge>
                )}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Guardian Full Name</label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Guardian">Legal Guardian</option>
                    <option value="Counselor">Campus Counselor</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Trusted Mentor">Trusted Mentor</option>
                  </select>
                </div>
              </div>

              {/* Guardian Email Input with Verification CTA */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-violet-600" />
                      Guardian Email Address (Encrypted at Rest)
                    </span>
                    {isEmailVerified && (
                      <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={guardianEmail}
                      onChange={(e) => {
                        setGuardianEmail(e.target.value);
                        if (isEmailVerified) setIsEmailVerified(false);
                      }}
                      placeholder="parent@example.com"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
                    />
                    <Button
                      onClick={handleSendEmailVerification}
                      variant="secondary"
                      size="sm"
                      disabled={emailOtpSending || !guardianEmail.includes('@')}
                    >
                      {emailOtpSending ? 'Sending...' : (isEmailVerified ? 'Re-verify' : 'Send Code')}
                    </Button>
                  </div>
                </div>

                {/* Email OTP Verification Input */}
                <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtpCode}
                    onChange={(e) => setEmailOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-44 font-mono"
                  />
                  <Button
                    onClick={handleVerifyEmail}
                    variant="primary"
                    size="sm"
                    disabled={emailOtpVerifying || emailOtpCode.trim().length !== 6}
                  >
                    {emailOtpVerifying ? 'Verifying...' : 'Verify Email'}
                  </Button>
                  {disclosedOtp && (
                    <span className="text-xs text-amber-800 bg-amber-100 px-2 py-1 rounded font-mono">
                      Test Code: {disclosedOtp}
                    </span>
                  )}
                </div>

                {emailOtpMessage && (
                  <p className="text-xs text-violet-900 font-medium">{emailOtpMessage}</p>
                )}
              </div>

              {/* Explicit Student Email Consent Checkbox */}
              <div className="p-4 bg-violet-50/60 border border-violet-100 rounded-xl flex items-start gap-3">
                <input
                  type="checkbox"
                  id="emailConsentCheckbox"
                  checked={emailConsent}
                  onChange={(e) => handleToggleConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
                />
                <label htmlFor="emailConsentCheckbox" className="text-xs text-violet-950 leading-relaxed cursor-pointer">
                  <strong>Explicit Student Consent:</strong> Allow Mindora to automatically dispatch neutral wellbeing check-in emails to my verified guardian contact when elevated stress thresholds (Level 1 $\ge$ 75, Level 2 $\ge$ 90) are crossed. I understand that no scores, reflections, or diagnosis tags are ever disclosed, and I can revoke this consent at any time.
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button onClick={handleUpdateGuardian} variant="primary">
                  Save Contact Information
                </Button>
                {emailConsent && (
                  <Button onClick={handleRevokeConsent} variant="secondary">
                    Revoke All Guardian Permissions
                  </Button>
                )}
              </div>

              {policyMessage && (
                <div className="p-3 bg-violet-50 text-violet-900 border border-violet-200 rounded-xl text-xs">
                  {policyMessage}
                </div>
              )}
            </div>
          </Card>

          {/* Card 2: Two-Level Automated Alert Policy Display */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-bold text-gray-900">Two-Level Automated Alert Policy Rules</h2>
              </div>
              <Badge variant={emailConsent && isEmailVerified ? 'emerald' : 'slate'}>
                {emailConsent && isEmailVerified ? 'Engine Ready' : 'Awaiting Consent/Verification'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Level 1 Rule */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 uppercase">Level 1 &bull; High Stress</span>
                  <Badge variant="amber">75 &le; Stress &lt; 90</Badge>
                </div>
                <div className="text-xs text-amber-950 space-y-1">
                  <p><strong>Subject:</strong> <code>Mindora — A Student Wellbeing Check-In</code></p>
                  <p className="text-[11px] text-amber-800">
                    Dispatched on first elevated stress trigger. Recommends a calm, supportive, non-judgmental check-in without academic pressure.
                  </p>
                </div>
              </div>

              {/* Level 2 Rule */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-900 uppercase">Level 2 &bull; Critical Stress</span>
                  <Badge variant="rose">Stress &ge; 90</Badge>
                </div>
                <div className="text-xs text-rose-950 space-y-1">
                  <p><strong>Subject:</strong> <code>Mindora — Important Student Wellbeing Follow-Up</code></p>
                  <p className="text-[11px] text-rose-800">
                    Automatically escalates if stress reaches 90, even if Level 1 was previously sent in this episode. Recommends prompt assistance and professional helplines.
                  </p>
                </div>
              </div>
            </div>

            {/* Episode Recovery Model */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Active Episode Recovery State Machine</span>
                <span className="text-gray-500 font-mono text-[11px]">Recovery Threshold: &le; 65.0</span>
              </div>
              <p className="text-gray-600 leading-relaxed text-[11px]">
                Both levels are tracked independently within an active episode. If stress drops to 65.0 or below, the episode automatically marks <strong>recovered</strong>. A subsequent rise back across 75 initiates a brand-new episode, resetting both notification levels.
              </p>
              {activeEpisode && (
                <div className="p-2.5 bg-white border border-gray-200 rounded-lg font-mono text-[11px] text-gray-700 flex justify-between items-center">
                  <span>Episode: <strong>{activeEpisode.episode_id}</strong> ({activeEpisode.status})</span>
                  <span>L1: {activeEpisode.level_1_triggered ? 'Sent' : 'Pending'} | L2: {activeEpisode.level_2_triggered ? 'Sent' : 'Pending'}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: Automated Stress Test Simulator */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl bg-gradient-to-br from-white to-violet-50/30">
            <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-violet-600" />
              <span>Multi-Level Threshold Test Simulator</span>
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Test how the backend episode engine responds to different stress scores and recovery states:
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSimulateScore(50)}
                disabled={simRunning}
              >
                50 (Normal)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSimulateScore(75)}
                disabled={simRunning}
              >
                75 (Level 1 Trigger)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSimulateScore(80)}
                disabled={simRunning}
              >
                80 (L1 Duplicate Test)
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSimulateScore(90)}
                disabled={simRunning}
              >
                90 (Level 2 Escalation)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSimulateScore(95)}
                disabled={simRunning}
              >
                95 (L2 Duplicate Test)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSimulateScore(60)}
                disabled={simRunning}
              >
                60 (Recovery Reset)
              </Button>
            </div>

            <div className="flex items-center gap-2 mb-4 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-600 font-medium">Custom Stress Score:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={simScore}
                onChange={(e) => setSimScore(Number(e.target.value))}
                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg font-mono"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSimulateScore(simScore)}
                disabled={simRunning}
              >
                Evaluate Custom
              </Button>
            </div>

            {simResult && (
              <div className="p-3 bg-white border border-gray-200 rounded-xl text-xs font-mono space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Status: {simResult.status}</span>
                  <span className={simResult.status === 'success' ? 'text-emerald-700' : 'text-amber-700'}>
                    {simResult.receipt?.threshold_level ? `Level ${simResult.receipt.threshold_level}` : ''}
                  </span>
                </div>
                <div className="text-gray-600">Message: {simResult.message}</div>
                {simResult.receipt?.message_id && (
                  <div className="text-gray-500 text-[10px]">
                    Message ID: <code>{simResult.receipt.message_id}</code> &bull; Recipient: {simResult.receipt.recipient_email}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Card 4: Manual Student-Dispatched Notification */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4">
              <Bell className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-bold text-gray-900">Manual Student-Dispatched Support Notification</h2>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              If academic or personal pressure feels heavy, you can voluntarily dispatch an immediate wellbeing check-in message to your trusted contact at any time.
            </p>

            {/* Non-Diagnostic Message Preview */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
              <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Exact Neutral Message Preview</span>
              </span>
              <div className="bg-white border border-gray-200 p-3 rounded-lg text-xs font-medium text-gray-800 italic">
                &ldquo;Mindora has identified an elevated stress indicator in the student's recent wellbeing check-in. This is not a medical diagnosis. It is an indication that the student may benefit from additional support, understanding and encouragement.&rdquo;
              </div>
            </div>

            {/* Mandatory Approval Checkbox */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl mb-4 flex items-start gap-3">
              <input
                type="checkbox"
                id="manualStudentConfirm"
                checked={studentConfirmed}
                onChange={(e) => setStudentConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-violet-600 rounded border-gray-300 focus:ring-violet-500"
              />
              <label htmlFor="manualStudentConfirm" className="text-xs text-amber-950 leading-relaxed cursor-pointer">
                <strong>Mandatory Student Approval:</strong> I have reviewed the exact message above and confirm that I want Mindora to notify {guardianName} ({guardianEmail}).
              </label>
            </div>

            {notificationError && (
              <div className="p-3 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-xs mb-3">
                {notificationError}
              </div>
            )}

            <Button
              onClick={handleSendStressNotification}
              variant="primary"
              disabled={!studentConfirmed || isSending}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Dispatching...' : 'Dispatch Support Notification'}</span>
            </Button>

            {notificationSuccess && lastAuditReceipt && (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Support Notification Dispatched Successfully!</strong>
                <div className="mt-1 font-mono text-[11px]">
                  Message ID: <code>{lastAuditReceipt.message_id}</code> &bull; Status: <code>{lastAuditReceipt.status}</code>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Safeguards, Helplines & Audit Trail */}
        <div className="space-y-6">
          {/* Safeguarding Commitments */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl bg-gradient-to-br from-white to-violet-50/30">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-600" />
              <span>Five Privacy Guarantees</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Explicit Prior Consent:</strong> Emails are only dispatched when student explicitly opts in.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Zero Health Disclosures:</strong> Numerical scores, PHQ-9 items, and diagnosis tags are strictly excluded.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Guardian Email Verification:</strong> Automated alerts require verified email ownership via 6-digit OTP.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Idempotency &amp; Deduplication:</strong> Prevents repeated alerts or duplicate sends during an active stress episode.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Instant Revocation:</strong> Revoking consent immediately halts all future automated email dispatches.</span>
              </li>
            </ul>
          </Card>

          {/* Crisis Helplines */}
          <Card className="p-6 border border-rose-200 bg-rose-50/40 shadow-sm rounded-2xl">
            <h3 className="text-base font-bold text-rose-950 mb-2 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-rose-600" />
              <span>Immediate Professional Helplines</span>
            </h3>
            <p className="text-xs text-rose-900 leading-relaxed mb-4">
              If you or someone you know is in immediate distress, free professional support is available 24/7:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-white border border-rose-200 rounded-lg">
                <div className="font-bold text-gray-900">Tele-MANAS (India)</div>
                <div className="font-mono text-rose-700 font-bold mt-0.5">14416 / 1800-891-4416</div>
                <span className="text-[10px] text-gray-500">24/7 National Mental Health Helpline</span>
              </div>
              <div className="p-2.5 bg-white border border-rose-200 rounded-lg">
                <div className="font-bold text-gray-900">988 Suicide &amp; Crisis Lifeline (US/Canada)</div>
                <div className="font-mono text-rose-700 font-bold mt-0.5">Call or Text 988</div>
                <span className="text-[10px] text-gray-500">Free, confidential support</span>
              </div>
              <div className="p-2.5 bg-white border border-rose-200 rounded-lg">
                <div className="font-bold text-gray-900">Crisis Text Line</div>
                <div className="font-mono text-rose-700 font-bold mt-0.5">Text HOME to 741741</div>
                <span className="text-[10px] text-gray-500">24/7 volunteer crisis support</span>
              </div>
            </div>
          </Card>

          {/* Notification Audit Trail Card */}
          <Card className="p-6 border border-gray-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                <span>Email Audit Trail ({auditLog.length})</span>
              </h3>
              <button
                onClick={() => { fetchAuditLogs(); fetchEpisodeStatus(); }}
                className="text-xs text-violet-600 hover:text-violet-800"
              >
                Refresh
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto font-mono text-[11px]">
              {auditLog.length === 0 ? (
                <div className="text-gray-400 text-xs italic py-2">No notification records yet.</div>
              ) : (
                auditLog.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg space-y-1">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{log.message_id}</span>
                      <span className={
                        log.status === 'sent'
                          ? 'text-emerald-700'
                          : log.status === 'suppressed'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }>
                        {log.status.toUpperCase()}
                        {log.threshold_level ? ` (L${log.threshold_level})` : ''}
                      </span>
                    </div>
                    <div className="text-gray-500 text-[10px] flex justify-between">
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                      <span>{log.recipient_email || log.recipient_phone_masked}</span>
                    </div>
                    {log.failure_reason && (
                      <div className="text-rose-600 text-[10px]">
                        Reason: {log.failure_reason}
                      </div>
                    )}
                    {log.status === 'failed' && (
                      <div className="pt-1 flex justify-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={retryingId === log.id || (log.retry_count && log.retry_count >= 3)}
                          onClick={() => handleRetryNotification(log.id)}
                          className="text-[10px] px-2 py-0.5"
                        >
                          {retryingId === log.id ? 'Retrying...' : `Retry (${log.retry_count || 0}/3)`}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
