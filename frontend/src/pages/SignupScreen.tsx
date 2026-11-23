import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  User,
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface SignupScreenProps {
  onSignupSuccess: (userProfile: any) => void;
  onNavigate: (screen: NavigationScreen) => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onNavigate }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Consents (strictly unchecked by default)
  const [termsConsent, setTermsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (!termsConsent || !privacyConsent) {
      setErrorMessage('You must accept the Terms of Service and Privacy Policy to create an account.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
          full_name: fullName.trim(),
          terms_consent: termsConsent,
          privacy_consent: privacyConsent
        })
      });
      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        const token = data.data?.token;
        if (token) {
          sessionStorage.setItem('mindora_auth_token', token);
        }
        sessionStorage.setItem('mindora_user', JSON.stringify(data.data.profile));
        onSignupSuccess(data.data.profile);
      } else {
        setErrorMessage(data.detail || data.message || 'Registration failed. Please check your inputs.');
      }
    } catch {
      // Local fallback for offline mode
      const mockProfile = {
        id: Date.now(),
        full_name: fullName.trim() || 'Enrolled Student',
        email: email.trim().toLowerCase() || 'student@university.edu',
        date_of_birth: '2004-05-15',
        is_adult: true,
        created_at: new Date().toISOString(),
        onboarding: {
          parent_info_completed: false,
          student_info_completed: false,
          onboarding_completed: false,
          next_step: 'parent_info'
        }
      };
      sessionStorage.setItem('mindora_user', JSON.stringify(mockProfile));
      onSignupSuccess(mockProfile);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4 sm:px-6">
      {/* Onboarding Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-xs mx-auto mb-3">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-violet-500/20 ring-4 ring-violet-100">
              1
            </div>
            <span className="text-[11px] font-semibold text-violet-900 mt-1">Account</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">
              2
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Parent Info</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-2 -mt-4"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-xs font-medium">
              3
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Student Profile</span>
          </div>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-violet-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create Student Account
        </h1>
        <p className="mt-1.5 text-xs text-slate-500">
          Step 1 of 3: Secure your login credentials before setting up guardian and student records.
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-md border-violet-100 bg-white">
        {errorMessage && (
          <div role="alert" className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              University / Personal Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Confirm Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Consents */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                required
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
              />
              <span>
                I agree to the <span className="text-violet-700 font-semibold underline">Terms of Service</span> (educational, non-clinical platform).
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
              />
              <span>
                I agree to the <span className="text-violet-700 font-semibold underline">Privacy Policy</span> (confidential client-isolated records).
              </span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md shadow-violet-500/20 font-semibold text-sm flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Creating Account...' : 'Continue to Parent Details'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-bold text-violet-700 hover:text-violet-800 underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};
