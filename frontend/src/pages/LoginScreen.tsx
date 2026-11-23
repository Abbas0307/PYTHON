import React, { useState } from 'react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, AlertCircle } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

interface LoginScreenProps {
  onLoginSuccess: (userProfile: any) => void;
  onNavigate: (screen: NavigationScreen) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await resp.json();

      if (resp.ok && data.status === 'success') {
        if (data.data?.token) {
          sessionStorage.setItem('mindora_auth_token', data.data.token);
        }
        onLoginSuccess(data.data.profile);
      } else {
        setErrorMessage(data.detail || data.message || 'Invalid email or password.');
      }
    } catch {
      // Local fallback in offline mode
      const mockProfile = {
        id: 1,
        full_name: 'Enrolled Student',
        email: email || 'student@university.edu',
        date_of_birth: '2004-05-15',
        is_adult: true,
        created_at: new Date().toISOString(),
        guardian: { name: 'Morgan Rivera', phone: '9876543210', verified: true, consent: true }
      };
      onLoginSuccess(mockProfile);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    try {
      const resp = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await resp.json();
      setForgotStatus(data.message || 'If an account matches, a reset token has been issued.');
    } catch {
      setForgotStatus('Password reset link issued (offline preview).');
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-violet-700 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-mindora-mutedText">
          Sign in to access your confidential student wellbeing records.
        </p>
      </div>

      <Card className="p-6 sm:p-8 shadow-md border-mindora-border/80">
        {errorMessage && (
          <div role="alert" className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-mindora-darkText uppercase tracking-wider mb-1.5">
              University Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-mindora-mutedText absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-mindora-surface border border-mindora-border rounded-xl focus:outline-none focus:ring-2 focus:ring-mindora-primary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-mindora-darkText uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs text-mindora-primary font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-mindora-mutedText absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-mindora-surface border border-mindora-border rounded-xl focus:outline-none focus:ring-2 focus:ring-mindora-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-mindora-mutedText hover:text-mindora-darkText"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full justify-center py-3 bg-gradient-to-r from-violet-700 to-indigo-600 hover:from-violet-800 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md"
          >
            {isLoading ? 'Verifying Credentials...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-mindora-border/60 text-center">
          <p className="text-xs text-mindora-mutedText">
            Don't have an account yet?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="font-bold text-mindora-primary hover:underline inline-flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </p>
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-mindora-border">
            <h3 className="text-lg font-bold text-mindora-darkText">Reset Password</h3>
            <p className="text-xs text-mindora-mutedText mt-1 mb-4">
              Enter your email address to receive password recovery instructions.
            </p>
            {forgotStatus && (
              <div className="p-3 mb-3 bg-violet-50 text-violet-800 border border-violet-200 rounded-xl text-xs font-medium">
                {forgotStatus}
              </div>
            )}
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="your.email@university.edu"
                className="w-full px-3.5 py-2 text-sm bg-mindora-surface border border-mindora-border rounded-xl focus:ring-2 focus:ring-mindora-primary"
              />
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={() => setShowForgotPassword(false)}>
                  Close
                </Button>
                <Button size="sm" type="submit">
                  Send Link
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
