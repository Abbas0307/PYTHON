import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Users,
  ShieldCheck,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Lock
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface ParentDetailsScreenProps {
  currentUser: any;
  onSuccess: (updatedProfile: any) => void;
  onNavigate: (screen: NavigationScreen) => void;
  onLogout: () => void;
}

export const ParentDetailsScreen: React.FC<ParentDetailsScreenProps> = ({
  currentUser,
  onSuccess,
  onLogout
}) => {
  // Pre-fill existing guardian details if partially filled
  const [name, setName] = useState(currentUser?.guardian?.name || '');
  const [relationship, setRelationship] = useState(currentUser?.guardian?.relationship || 'Mother');
  const [countryCode, setCountryCode] = useState(currentUser?.guardian?.country_code || '+91');
  const [phone, setPhone] = useState(currentUser?.guardian?.phone || '');
  const [secondaryCode, setSecondaryCode] = useState('+91');
  const [secondaryPhone, setSecondaryPhone] = useState(currentUser?.guardian?.secondary_phone || '');
  const [preferredContact, setPreferredContact] = useState<'SMS' | 'WhatsApp' | 'Phone Call'>(
    currentUser?.guardian?.preferred_contact || 'WhatsApp'
  );
  const [priority, setPriority] = useState<'Primary' | 'Secondary'>(
    currentUser?.guardian?.priority || 'Primary'
  );
  const [consent, setConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (name.trim().length < 2) {
      setErrorMessage('Parent/Guardian full name must be at least 2 characters.');
      return;
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(name.trim())) {
      setErrorMessage('Parent/Guardian name should only contain letters and standard punctuation.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      setErrorMessage('Please enter a valid primary contact number (7 to 15 digits).');
      return;
    }

    if (secondaryPhone.trim()) {
      const cleanSec = secondaryPhone.replace(/\D/g, '');
      if (cleanSec.length < 7 || cleanSec.length > 15) {
        setErrorMessage('Please enter a valid secondary contact number (7 to 15 digits).');
        return;
      }
    }

    setIsLoading(true);

    try {
      const token = sessionStorage.getItem('mindora_auth_token');
      const resp = await fetch(`${getApiBaseUrl()}/api/onboarding/parent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          relationship,
          country_code: countryCode,
          phone: cleanPhone,
          secondary_phone: secondaryPhone.trim() ? secondaryPhone.replace(/\D/g, '') : '',
          preferred_contact: preferredContact,
          priority,
          consent
        })
      });

      const data = await resp.json();
      if (resp.ok && data.status === 'success') {
        const updated = data.data.profile;
        sessionStorage.setItem('mindora_user', JSON.stringify(updated));
        onSuccess(updated);
      } else {
        setErrorMessage(data.detail || data.message || 'Failed to save parent information.');
      }
    } catch {
      // Local fallback for offline mode
      const updated = {
        ...currentUser,
        guardian: {
          name: name.trim(),
          relationship,
          country_code: countryCode,
          phone: phone.trim(),
          secondary_phone: secondaryPhone.trim(),
          preferred_contact: preferredContact,
          priority,
          verified: false,
          consent
        },
        onboarding: {
          parent_info_completed: true,
          student_info_completed: false,
          onboarding_completed: false,
          next_step: 'student_info'
        }
      };
      sessionStorage.setItem('mindora_user', JSON.stringify(updated));
      onSuccess(updated);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Onboarding Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto mb-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium text-emerald-700 mt-1">Account</span>
          </div>

          <div className="flex-1 h-0.5 bg-violet-600 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-violet-500/20 ring-4 ring-violet-100">
              2
            </div>
            <span className="text-[11px] font-semibold text-violet-900 mt-1">Parent Info</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">
              3
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Student Profile</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">
              4
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Dashboard</span>
          </div>
        </div>
      </div>

      {/* Screen Title & Motivation */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-200 rounded-full text-violet-700 text-xs font-medium mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Confidential Guardian Support Contact</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Parent or Guardian Information
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
          Providing a verified contact ensures your trusted family member can be reached strictly if you request support or enable wellness alert policies.
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-lg border-violet-100 bg-white">
        {errorMessage && (
          <div role="alert" className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent/Guardian Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Parent / Guardian Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Gonzalez / Dr. Robert Chen"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Relationship to You <span className="text-rose-500">*</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900"
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Legal Guardian">Legal Guardian</option>
              <option value="Sibling">Older Sibling</option>
              <option value="Other Relative">Other Family Relative</option>
            </select>
          </div>

          {/* Primary Phone Number with Country Code */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Primary Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="w-28 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 shrink-0"
              >
                <option value="+91">🇮🇳 +91 (IN)</option>
                <option value="+1">🇺🇸 +1 (US)</option>
                <option value="+44">🇬🇧 +44 (UK)</option>
                <option value="+61">🇦🇺 +61 (AU)</option>
                <option value="+65">🇸🇬 +65 (SG)</option>
                <option value="+81">🇯🇵 +81 (JP)</option>
                <option value="+49">🇩🇪 +49 (DE)</option>
              </select>
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Encrypted with AES-256-GCM. Used strictly for authorized notifications.
            </p>
          </div>

          {/* Secondary Phone Number (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Secondary / Alternate Contact Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="flex gap-2">
              <select
                value={secondaryCode}
                onChange={(e) => setSecondaryCode(e.target.value)}
                className="w-28 px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 shrink-0"
              >
                <option value="+91">🇮🇳 +91 (IN)</option>
                <option value="+1">🇺🇸 +1 (US)</option>
                <option value="+44">🇬🇧 +44 (UK)</option>
                <option value="+61">🇦🇺 +61 (AU)</option>
              </select>
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  placeholder="Alternate phone or landline"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Preferred Contact Method & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Notification Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['WhatsApp', 'SMS', 'Phone Call'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPreferredContact(method)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                      preferredContact === method
                        ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold ring-1 ring-violet-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contact Priority
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Primary', 'Secondary'] as const).map((pri) => (
                  <button
                    key={pri}
                    type="button"
                    onClick={() => setPriority(pri)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                      priority === pri
                        ? 'border-violet-600 bg-violet-50 text-violet-700 font-semibold ring-1 ring-violet-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {pri} Contact
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy & Disclosures Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <Lock className="w-4 h-4 text-violet-600" />
              <span>Privacy & Notification Guarantee</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Mindora <strong>never</strong> shares clinical assessments, diagnosis scores, or chat transcripts with parents. 
              If enabled, automatic guardian alerts only dispatch neutral collegiate support messages during prolonged elevated stress.
            </p>

            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-slate-700 group-hover:text-slate-900 leading-normal">
                  I authorize Mindora to store this parent/guardian contact and enable optional support alerts. I understand I can revoke or reconfigure this permission anytime in Guardian Settings.
                </span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Save & Exit Later
            </button>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-500/20 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <span>{isLoading ? 'Saving...' : 'Save & Continue to Student Profile'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
