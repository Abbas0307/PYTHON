import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Users,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  Lock,
  Bell
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface GuardianInfoScreenProps {
  currentUser?: any;
  onNavigate: (screen: NavigationScreen) => void;
  onOpenCrisis: () => void;
}

export const GuardianInfoScreen: React.FC<GuardianInfoScreenProps> = ({
  currentUser: initialUser,
  onNavigate
}) => {
  const [_user, setUser] = useState<any>(initialUser || null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('Parent');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthToken = () => sessionStorage.getItem('mindora_auth_token') || '';

  const loadGuardianData = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const userData = data.profile || data.user;
      if (data.status === 'success' && userData) {
        setUser(userData);
        const g = userData.guardian || {};
        setName(g.name || '');
        setRelationship(g.relationship || 'Parent');
        setEmail(g.email || '');
        setPhone(g.phone || '');
        setIsEmailVerified(Boolean(g.email_verified));
      }
    } catch {}
  };

  useEffect(() => {
    loadGuardianData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Guardian name is required.' });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setSaveMessage({ type: 'error', text: 'Please provide at least a guardian email or phone number.' });
      return;
    }

    setSaving(true);
    setSaveMessage(null);
    const token = getAuthToken();

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          guardian_name: name.trim(),
          guardian_relationship: relationship.trim(),
          guardian_email: email.trim() || undefined,
          guardian_phone: phone.trim() || undefined
        })
      });

      const data = await res.json();
      if (data.status === 'success') {
        setSaveMessage({ type: 'success', text: 'Guardian details updated successfully!' });
        setIsEditing(false);
        await loadGuardianData();
      } else {
        setSaveMessage({ type: 'error', text: data.detail || 'Failed to update guardian details.' });
      }
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: 'Network connection error while saving.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-50 via-white to-pink-50/40 p-6 sm:p-8 rounded-3xl border border-mindora-border shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="violet" icon={<Users className="w-3.5 h-3.5" />}>
              Support Network
            </Badge>
            <Badge variant="slate">AES-256 Encrypted</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Guardian & Family Information
          </h1>
          <p className="text-sm text-mindora-mutedText mt-1 max-w-2xl">
            Maintain your trusted parent or guardian contact details. Contacts are stored securely and never disclosed to peers or campus administrators.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('email_notifications')}
            icon={<Bell className="w-3.5 h-3.5 text-violet-600" />}
          >
            Notification Settings
          </Button>
        </div>
      </div>

      {/* Feedback Messages */}
      {saveMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold shadow-xs ${
            saveMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Guardian Profile Card */}
      <Card className="p-6 sm:p-8 border-violet-100 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-mindora-darkText">
                {name || 'Registered Guardian'}
              </h2>
              <span className="text-xs text-mindora-mutedText">
                {relationship || 'Parent / Legal Guardian'}
              </span>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              icon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Details
            </Button>
          )}
        </div>

        {!isEditing ? (
          /* View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Relationship
              </span>
              <p className="text-sm font-bold text-mindora-darkText">
                {relationship || 'Not specified'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Guardian Email Address
              </span>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-mindora-darkText">
                  {email || 'None provided'}
                </span>
                {email && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isEmailVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isEmailVerified ? 'Verified' : 'Unverified'}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Primary Phone Contact
              </span>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-mindora-darkText">
                  {phone || 'None provided'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Encryption Status
              </span>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                AES-256-GCM Encrypted at Rest
              </div>
            </div>
          </div>
        ) : (
          /* Edit Mode Form */
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                  Guardian Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Morgan Rivera"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                  Relationship
                </label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText bg-white"
                >
                  <option value="Parent">Parent</option>
                  <option value="Mother">Mother</option>
                  <option value="Father">Father</option>
                  <option value="Legal Guardian">Legal Guardian</option>
                  <option value="Relative">Relative</option>
                  <option value="Emergency Contact">Emergency Contact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                  Guardian Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guardian@example.com"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-mindora-darkText mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-violet-600 text-xs sm:text-sm text-mindora-darkText"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={saving}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                {saving ? 'Saving...' : 'Save Guardian Details'}
              </Button>
            </div>
          </form>
        )}
      </Card>

      {/* Confidentiality & Privacy Guarantee Notice */}
      <Card className="p-6 bg-slate-50 border border-slate-200/80">
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-mindora-mutedText leading-relaxed">
            <span className="font-bold text-mindora-darkText block text-sm mb-0.5">
              Strict Student Confidentiality Architecture
            </span>
            Guardian details are used strictly for emergency escalation or when you explicitly opt in to automated stress alerts. Guardians do not receive routine academic reflections, PHQ-9 answers, or diagnostic assessments.
          </div>
        </div>
      </Card>
    </div>
  );
};
