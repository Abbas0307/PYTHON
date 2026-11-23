import React, { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  ClipboardList,
  Sparkles,
  User,
  CalendarCheck,
  Target,
  History,
  HeartPulse,
  Wind,
  Compass,
  Timer,
  Zap,
  Users,
  Mail,
  Clock,
  ShieldCheck,
  Database,
  Sliders,
  LifeBuoy,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  RotateCcw,
  Cpu,
  Scale,
  FileSpreadsheet,
  TrendingUp,
  BookOpen,
  Award,
  GraduationCap,
  Gamepad2,
  Music,
  Mic
} from 'lucide-react';
import type { NavigationScreen } from '../../storage/sessionStorage';

interface SidebarProps {
  currentScreen: NavigationScreen;
  onNavigate: (screen: NavigationScreen) => void;
  onJumpToSection?: (sectionId: string) => void;
  assessmentCompleted: boolean;
  onLoadPreview: () => void;
  onResetSession: () => void;
  isPreviewMode: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  id: NavigationScreen;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isLocked?: boolean;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  assessmentCompleted,
  onLoadPreview,
  onResetSession,
  isPreviewMode: _isPreviewMode,
  isMobileOpen = false,
  onMobileClose
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    research: true // Keep research lab collapsed by default for clean student UI
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'overview',
      title: 'A. OVERVIEW',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          badge: assessmentCompleted ? 'Active' : undefined
        },
        {
          id: 'wellbeing',
          label: 'My Wellbeing',
          icon: Activity
        },
        {
          id: 'weekly_insights',
          label: 'Weekly Insights',
          icon: TrendingUp
        }
      ]
    },
    {
      id: 'assessments',
      title: 'B. ASSESSMENTS',
      items: [
        {
          id: 'assessment',
          label: 'Stress Assessment',
          icon: ClipboardList,
          badge: assessmentCompleted ? 'Done' : undefined
        },
        {
          id: 'assessment_history',
          label: 'Assessment History',
          icon: History
        },
        {
          id: 'risk_insights',
          label: 'Risk Insights',
          icon: Sparkles
        }
      ]
    },
    {
      id: 'personal_space',
      title: 'C. MY PERSONAL SPACE',
      items: [
        {
          id: 'daily_checkin',
          label: 'Daily Check-in',
          icon: CalendarCheck
        },
        {
          id: 'goals',
          label: 'My Goals',
          icon: Target
        },
        {
          id: 'activity_history',
          label: 'Activity History',
          icon: Clock
        },
        {
          id: 'personal_journal',
          label: 'Personal Journal',
          icon: BookOpen
        },
        {
          id: 'ambient_music',
          label: 'Ambient Music',
          icon: Music
        }
      ]
    },
    {
      id: 'wellness_center',
      title: 'D. WELLNESS CENTER',
      items: [
        {
          id: 'wellness_studio',
          label: 'Wellness Studio',
          icon: HeartPulse
        },
        {
          id: 'breathing',
          label: 'Breathing Exercises',
          icon: Wind
        },
        {
          id: 'grounding',
          label: 'Grounding Exercises',
          icon: Compass
        },
        {
          id: 'focus_timer',
          label: 'Focus Timer',
          icon: Timer
        },
        {
          id: 'relaxation_exercises',
          label: 'Relaxation Exercises',
          icon: Zap
        },
        {
          id: 'personalized_activities',
          label: 'Personalized Activities',
          icon: Award,
          badge: 'Smart'
        },
        {
          id: 'mini_games',
          label: 'Mindora Mini Games',
          icon: Gamepad2,
          badge: '5-Min'
        }
      ]
    },
    {
      id: 'ai_support',
      title: 'E. AI SUPPORT',
      items: [
        {
          id: 'ai_feelings_space',
          label: 'AI Feelings Space',
          icon: Mic,
          badge: 'Voice'
        },
        {
          id: 'learning_hub',
          label: 'AI Learning & Guidance',
          icon: GraduationCap
        }
      ]
    },
    {
      id: 'account_support',
      title: 'F. ACCOUNT & SUPPORT',
      items: [
        {
          id: 'profile',
          label: 'Student Profile',
          icon: User
        },
        {
          id: 'guardian_info',
          label: 'Guardian Information',
          icon: Users
        },
        {
          id: 'email_notifications',
          label: 'Email Notifications',
          icon: Mail
        },
        {
          id: 'privacy_security',
          label: 'Privacy & Security',
          icon: ShieldCheck
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Sliders
        },
        {
          id: 'help_support',
          label: 'Help & Support',
          icon: LifeBuoy
        }
      ]
    },
    {
      id: 'research',
      title: 'ML RESEARCH LAB',
      items: [
        {
          id: 'model_lab',
          label: 'Model Laboratory',
          icon: Cpu,
          badge: '4 Models'
        },
        {
          id: 'model_comparison',
          label: 'Four-Model Comparison',
          icon: Scale,
          badge: 'Benchmark'
        },
        {
          id: 'real_world_163',
          label: 'Real-World 163-Record Data Analyzer',
          icon: FileSpreadsheet,
          badge: '163'
        },
        {
          id: 'large_dataset',
          label: 'Large Dataset Lab',
          icon: Database,
          badge: '27.9k'
        },
        {
          id: 'explainability',
          label: 'Explainability & SHAP',
          icon: Sparkles
        }
      ]
    }
  ];

  const handleItemClick = (screenId: NavigationScreen) => {
    onNavigate(screenId);
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const isItemActive = (itemId: NavigationScreen) => {
    if (currentScreen === itemId) return true;
    // Handle aliases
    if (itemId === 'profile' && currentScreen === 'profile_settings') return true;
    if (itemId === 'goals' && currentScreen === 'personal_goals') return true;
    if (itemId === 'risk_insights' && currentScreen === 'explainability') return true;
    if (itemId === 'guardian_info' && currentScreen === 'guardian_support') return true;
    if (itemId === 'data_center' && currentScreen === 'privacy_center') return true;
    if (itemId === 'help_support' && currentScreen === 'support') return true;
    return false;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* 1. Fixed Top Header / Branding & Collapse Toggle */}
      <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b border-slate-100 bg-white z-10">
        {!isCollapsed && (
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5CE8] to-[#4936B5] flex items-center justify-center text-white text-sm font-black shadow-xs shrink-0">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#202033]">
                  Mindora
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-[#F1EEFF] text-[#6D5CE8]">
                  2.0
                </span>
              </div>
              <span className="text-[10px] text-[#77788C] font-medium block -mt-0.5">
                Student Wellbeing
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div
            onClick={() => handleItemClick('dashboard')}
            className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-br from-[#6D5CE8] to-[#4936B5] flex items-center justify-center text-white text-sm font-black shadow-xs cursor-pointer"
            title="Mindora 2.0"
          >
            M
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle sidebar collapse"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Scrollable Navigation Groups List */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-4 custom-scrollbar">
        {navGroups.map((group) => {
            const isGroupCollapsed = collapsedGroups[group.id];

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Title Accordion Header */}
                {!isCollapsed ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#77788C] hover:text-[#202033] rounded-md transition-colors"
                  >
                    <span>{group.title}</span>
                    {isGroupCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                ) : (
                  <div className="w-full border-t border-slate-100 my-2" />
                )}

                {/* Group Navigation Items */}
                {(!isGroupCollapsed || isCollapsed) && (
                  <nav className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isItemActive(item.id);

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          aria-current={active ? 'page' : undefined}
                          title={isCollapsed ? item.label : undefined}
                          className={`w-full flex items-center ${
                            isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                          } py-2 rounded-xl text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-[#6D5CE8] text-white font-semibold shadow-xs'
                              : 'text-[#202033] hover:bg-[#F1EEFF] hover:text-[#6D5CE8] font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                active ? 'text-white' : 'text-[#77788C] group-hover:text-[#6D5CE8]'
                              }`}
                            />
                            {!isCollapsed && (
                              <span className="text-xs truncate">{item.label}</span>
                            )}
                          </div>

                          {!isCollapsed && item.badge && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                                active
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#F1EEFF] text-[#6D5CE8]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>
            );
          })}
        </div>

      {/* 3. Fixed Bottom Session Controls & Privacy Indicator */}
      <div className="shrink-0 p-3 border-t border-slate-100 space-y-2 bg-white z-10">
        {!isCollapsed && (
          <div className="space-y-1.5">
            {!assessmentCompleted && (
              <button
                onClick={onLoadPreview}
                className="w-full flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="truncate">Load Demo Baseline</span>
              </button>
            )}

            <button
              onClick={onResetSession}
              className="w-full flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 p-2 rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Reset Memory</span>
            </button>
          </div>
        )}

        {/* Local Memory Guarantee */}
        {!isCollapsed ? (
          <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <div className="leading-tight truncate">
              <span className="font-bold text-slate-800 block">Zero Telemetry</span>
              Local browser memory only
            </div>
          </div>
        ) : (
          <div
            className="flex justify-center p-2 text-emerald-600 cursor-pointer"
            title="Zero Telemetry — Local browser memory only"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        aria-label="Application Navigation"
        className={`hidden lg:flex flex-col shrink-0 border-r border-slate-200 bg-white sticky top-16 h-[calc(100vh-4rem)] overflow-hidden transition-all duration-300 z-10 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Slide-out drawer panel */}
          <div className="relative w-72 max-w-[80vw] bg-white shadow-2xl flex flex-col z-10 animate-slide-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
