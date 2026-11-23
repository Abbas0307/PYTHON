import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Globe2,
  WifiOff,
  User,
  Settings,
  Shield,
  Users,
  LogOut,
  ChevronDown,
  LogIn,
  UserPlus,
  Menu
} from 'lucide-react';
import { NATIONAL_CRISIS_DIRECTORY } from '../../engines/crisisDirectory';
import { getApiBaseUrl } from '../../config/api';
import type { NavigationScreen } from '../../storage/sessionStorage';
import { CompactMusicPlayer } from '../music/CompactMusicPlayer';

interface HeaderProps {
  currentScreen: NavigationScreen;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  onOpenCrisis: () => void;
  isPreviewMode: boolean;
  currentUser?: any | null;
  onNavigate?: (screen: NavigationScreen) => void;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCountry,
  onCountryChange,
  onOpenCrisis,
  isPreviewMode,
  currentUser,
  onNavigate,
  onLogout,
  onToggleMobileMenu
}) => {
  const countries = Object.keys(NATIONAL_CRISIS_DIRECTORY);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatarUrl = currentUser?.profile_image_url
    ? `${getApiBaseUrl()}${currentUser.profile_image_url}`
    : null;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-mindora-border/60 transition-all">
      {isPreviewMode && (
        <div
          role="status"
          aria-live="polite"
          className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white text-xs font-semibold py-1.5 px-3 sm:px-4 text-center flex items-center justify-center gap-1.5 sm:gap-2 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate sm:overflow-visible">
            EXPLORATION PREVIEW MODE: Displaying synthetic student data for walkthrough only.
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Menu Toggle + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleMobileMenu && currentUser && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="flex items-center gap-2 sm:gap-3 min-w-0 cursor-pointer"
          >
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-mindora-primary to-mindora-secondary flex items-center justify-center text-white shadow-soft font-black text-lg sm:text-xl select-none shrink-0"
              aria-hidden="true"
            >
              💜
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-mindora-primary truncate">
                  Mindora
                </span>
                <span className="hidden xs:inline-flex text-[10px] font-bold uppercase tracking-wider bg-mindora-lavender text-mindora-primary px-1.5 sm:px-2 py-0.5 rounded-full border border-mindora-primary/20 shrink-0">
                  2.0
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-mindora-mutedText -mt-0.5 hidden sm:block truncate">
                Student Wellbeing Intelligence
              </p>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Ambient Music Player for logged-in students */}
          {currentUser && (
            <div className="hidden md:flex items-center">
              <CompactMusicPlayer />
            </div>
          )}

          {/* Offline indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
            role="status"
            aria-label="Offline-First: Local client memory only"
          >
            <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-semibold">Local-First</span>
            <span className="text-emerald-500 font-normal">• Memory Only</span>
          </div>

          {/* Country selector */}
          <div className="flex items-center gap-1 bg-mindora-surface px-2 sm:px-2.5 py-1 rounded-xl border border-mindora-border text-xs">
            <Globe2 className="w-3.5 h-3.5 text-mindora-primary shrink-0" aria-hidden="true" />
            <label htmlFor="country-select" className="sr-only">
              Select Country for Localized Crisis Support
            </label>
            <select
              id="country-select"
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-mindora-darkText focus:outline-none cursor-pointer pr-1"
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Urgent Help button */}
          <button
            onClick={onOpenCrisis}
            aria-label="Open Immediate Crisis and Support Directory"
            className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-2xs active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600 shrink-0" aria-hidden="true" />
            <span className="hidden xs:inline">Crisis Help</span>
          </button>

          {/* Top-Right Profile Picture & Dropdown Menu */}
          {currentUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-full hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-mindora-primary cursor-pointer"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="Open Student Account Menu"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm overflow-hidden shadow-xs ring-2 ring-violet-200 shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={currentUser.full_name || 'Student'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(currentUser.full_name)}</span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-mindora-mutedText hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              {dropdownOpen && (
                <div
                  role="menu"
                  aria-label="Student Account Menu"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-mindora-border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Student Info Header */}
                  <div className="px-4 py-3 border-b border-mindora-border/70">
                    <p className="text-xs font-bold text-mindora-darkText truncate">
                      {currentUser.full_name || 'Enrolled Student'}
                    </p>
                    <p className="text-[11px] text-mindora-mutedText truncate mt-0.5">
                      {currentUser.email || 'student@university.edu'}
                    </p>
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Argon2id Authenticated</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="py-1">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate && onNavigate('profile');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-mindora-darkText hover:bg-violet-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-violet-600" />
                      <span>View &amp; Edit Profile</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate && onNavigate('settings');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-mindora-darkText hover:bg-violet-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-violet-600" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate && onNavigate('data_center');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-mindora-darkText hover:bg-violet-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-violet-600" />
                      <span>Privacy &amp; Data Center</span>
                    </button>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        onNavigate && onNavigate('email_notifications');
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-mindora-darkText hover:bg-violet-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-violet-600" />
                      <span>Guardian Notification Settings</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="pt-1 border-t border-mindora-border/70">
                    <button
                      role="menuitem"
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout && onLogout();
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl border border-violet-200 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign In</span>
              </button>
              <button
                onClick={() => onNavigate && onNavigate('signup')}
                className="inline-flex items-center gap-1 text-xs font-bold text-white bg-violet-700 hover:bg-violet-800 px-3 py-1.5 rounded-xl shadow-xs transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
