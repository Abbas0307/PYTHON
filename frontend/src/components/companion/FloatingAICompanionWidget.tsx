import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  X,
  Maximize2,
  Send,
  Compass,
  ArrowRight,
  RotateCcw,
  Minimize2,
  HelpCircle,
  Activity,
  CalendarCheck,
  LifeBuoy,
  Target,
  Sparkles
} from 'lucide-react';
import type { NavigationScreen } from '../../storage/sessionStorage';
import { getApiBaseUrl } from '../../config/api';
import { findMatchingRoute, RouteRegistryItem } from '../../navigation/routeRegistry';

interface FloatingAICompanionWidgetProps {
  onNavigate: (screen: NavigationScreen) => void;
  currentScreen?: NavigationScreen;
}

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  is_crisis?: boolean;
  navTarget?: RouteRegistryItem;
  quickActions?: { label: string; action: () => void }[];
}

export const FloatingAICompanionWidget: React.FC<FloatingAICompanionWidgetProps> = ({
  onNavigate,
  currentScreen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hi! I'm your Mindora Assistant. Ask me anything about study habits, managing stress, or finding any feature on the website."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lastSubmittedQueryRef = useRef<{ text: string; time: number }>({ text: '', time: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isLoading]);

  // Context-Aware Guidance based on currentScreen
  const contextGuidance = useMemo(() => {
    if (!currentScreen) return null;
    switch (currentScreen) {
      case 'assessment':
        return {
          title: 'Assessment Page',
          prompt: 'Would you like me to explain how this 10-factor lifestyle assessment works?',
          actionLabel: 'Explain Assessment',
          onTrigger: () =>
            handleSend(
              'Can you explain how this 10-factor lifestyle assessment works and how my privacy is safeguarded?'
            )
        };
      case 'goals':
        return {
          title: 'My Goals',
          prompt: 'Would you like help breaking one of your goals into smaller, manageable steps?',
          actionLabel: 'Break Down Goals',
          onTrigger: () =>
            handleSend(
              'How can I break down my collegiate study and wellness goals into smaller daily steps?'
            )
        };
      case 'personal_journal':
        return {
          title: 'Personal Journal',
          prompt: 'Would you like to know how your private journal encrypts and isolates your entries?',
          actionLabel: 'Journal Privacy',
          onTrigger: () =>
            handleSend(
              'How does the personal journal protect my privacy and encrypt my thoughts?'
            )
        };
      case 'ai_feelings_space':
        return {
          title: 'AI Feelings Space',
          prompt: 'You are in the Feelings Space. Would you like tips on getting the most from voice reflection?',
          actionLabel: 'Voice Tips',
          onTrigger: () =>
            handleSend(
              'What are the three conversation modes in the Feelings Space and how can I use them?'
            )
        };
      case 'wellness_studio':
      case 'breathing':
        return {
          title: 'Wellness Studio',
          prompt: 'Would you like guidance on choosing the right calming exercise for your current energy?',
          actionLabel: 'Exercise Tips',
          onTrigger: () =>
            handleSend(
              'Which wellness exercise should I choose right now if I feel mentally fatigued?'
            )
        };
      case 'dashboard':
        return {
          title: 'Dashboard Hub',
          prompt: 'Welcome to your Dashboard! Need help finding your latest assessments or daily habits?',
          actionLabel: 'Dashboard Tour',
          onTrigger: () =>
            handleSend(
              'Give me a quick tour of what I can track and do on my Mindora dashboard.'
            )
        };
      default:
        return null;
    }
  }, [currentScreen]);

  // Hidden on unauthenticated pages (Login, Signup, Welcome, Onboarding)
  const unauthenticatedScreens: NavigationScreen[] = [
    'welcome',
    'login',
    'signup',
    'parent_info',
    'student_info'
  ];

  if (currentScreen && unauthenticatedScreens.includes(currentScreen)) {
    return null;
  }

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    // Prevent duplicate rapid submissions within 1.5 seconds
    const now = Date.now();
    if (
      lastSubmittedQueryRef.current.text === query &&
      now - lastSubmittedQueryRef.current.time < 1500
    ) {
      return;
    }
    lastSubmittedQueryRef.current = { text: query, time: now };

    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    // 1. Navigation Intent Check (Website Navigation Intelligence)
    const matchedRoute = findMatchingRoute(query);
    const qLower = query.toLowerCase();
    const isNavigationInquiry =
      qLower.includes('where') ||
      qLower.includes('how can i') ||
      qLower.includes('how do i') ||
      qLower.includes('take me to') ||
      qLower.includes('open') ||
      qLower.includes('find') ||
      qLower.includes('navigate') ||
      qLower.includes('go to') ||
      qLower.includes('write something privately') ||
      qLower.includes('write about my feelings') ||
      qLower.includes('previous assessments') ||
      qLower.includes('old assessments') ||
      qLower.includes('breathing exercise') ||
      qLower.includes('guardian email') ||
      qLower.includes('i want to relax') ||
      qLower.includes('check my progress');

    // If strong navigation match
    if (
      matchedRoute &&
      (isNavigationInquiry || matchedRoute.keywords.some((k) => qLower.includes(k.toLowerCase())))
    ) {
      setTimeout(() => {
        let explanation = `You can find **${matchedRoute.title}** under **${matchedRoute.group}**.`;
        if (matchedRoute.id === 'personal_journal') {
          explanation =
            "You can use **Personal Journal** under *My Personal Space* to write about your feelings, thoughts, and reflections in a private encrypted notebook.";
        } else if (matchedRoute.id === 'assessment_history') {
          explanation =
            "You can review all your past survey responses and trend metrics under **Assessments → Assessment History**.";
        } else if (matchedRoute.id === 'breathing') {
          explanation =
            "Open **Wellness Studio** and select **Breathing Exercises** for guided diaphragmatic and box breathing.";
        } else if (matchedRoute.id === 'guardian_info') {
          explanation =
            "Open your **Student Profile** or **Guardian Settings** to update your guardian email, view verification status, or manage notification consent.";
        } else if (matchedRoute.id === 'ai_feelings_space') {
          explanation =
            "You can speak freely in our voice-based **AI Feelings Space** under *AI Support*. It offers three supportive conversation modes with zero audio retention.";
        } else if (matchedRoute.id === 'wellness_studio') {
          explanation =
            "The **Wellness Studio** is your hub for guided box breathing, 25-minute Pomodoro focus sprints, and muscle relaxation exercises.";
        } else if (matchedRoute.id === 'ambient_music') {
          explanation =
            "You can listen to relaxing curated lo-fi and ambient soundscapes in **Ambient Music** under *Wellness Studio*.";
        } else if (matchedRoute.id === 'mini_games') {
          explanation =
            "You can play gentle 5-minute stress-relief games (Snake and Block Puzzle) in **Mini Games** under *Wellness Studio*.";
        } else if (matchedRoute.id === 'goals') {
          explanation =
            "Track your collegiate habits, study pacing, and sleep restoration targets under **Personal Goals**.";
        } else if (matchedRoute.id === 'wellbeing') {
          explanation =
            "Track your overall stress indicator, sleep recovery, and academic load under **Wellbeing Rhythm & Trends**.";
        }

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `${explanation}\n\nWould you like me to open it for you?`,
            navTarget: matchedRoute
          }
        ]);
        setIsLoading(false);
      }, 300);
      return;
    }

    // 2. Intelligent Quick Actions Execution
    if (qLower === 'explain this page' && currentScreen) {
      setTimeout(() => {
        const routeItem = findMatchingRoute(currentScreen);
        const desc = routeItem
          ? `${routeItem.title} (${routeItem.group}): ${routeItem.description}`
          : `You are currently on the ${currentScreen.replace('_', ' ')} screen.`;
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**Page Breakdown:**\n\n${desc}\n\nFeel free to ask questions about specific controls or features on this screen.`
          }
        ]);
        setIsLoading(false);
      }, 250);
      return;
    }

    if (qLower === 'help me plan my day') {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              "**Suggested Collegiate Day Pacing Plan:**\n\n" +
              "1. **Morning (Focus block):** Tackle your top-1 hardest assignment for 25 minutes using the Pomodoro timer.\n" +
              "2. **Midday (Autonomic reset):** Take a 5-minute walk and do a 2-minute breathing cycle in the Wellness Studio.\n" +
              "3. **Evening (Unwind):** Set a study cutoff 30 minutes before sleep, and note a quick reflection in your private journal."
          }
        ]);
        setIsLoading(false);
      }, 300);
      return;
    }

    // 3. Standard Chat / Local Empathy Engine
    try {
      const token =
        sessionStorage.getItem('mindora_auth_token') ||
        localStorage.getItem('mindora_auth_token') ||
        localStorage.getItem('session_token') ||
        localStorage.getItem('auth_token') ||
        'local_dev_session';

      // Send only bounded recent context (last 4 messages) to optimize payload & latency
      const recentHistory = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch(`${getApiBaseUrl()}/api/ai-companion/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          country: 'India',
          include_context: true,
          context_data: {
            screen_context: currentScreen,
            history: recentHistory
          }
        })
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.data.content,
          is_crisis: data.data.is_crisis
        }
      ]);
    } catch {
      // Local empathetic fallback
      setTimeout(() => {
        let fallback =
          "Take a slow breath. When academic stress builds up, try taking a 5-minute pause away from screens, hydrating, or exploring our guided Breathing Exercises in the Wellness Studio.";
        if (qLower.includes('exam') || qLower.includes('study')) {
          fallback =
            "Exam preparation is demanding. Prioritizing one topic at a time and taking scheduled 5-minute Pomodoro breaks helps preserve cognitive clarity.";
        } else if (qLower.includes('sleep') || qLower.includes('tired')) {
          fallback =
            "Rest is fundamental to learning. Consider establishing a 20-minute screen-free buffer before sleeping to let your mind wind down.";
        }
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fallback
          }
        ]);
        setIsLoading(false);
      }, 200);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        content:
          "Conversation refreshed. How can I help you navigate Mindora or support your study rhythm right now?"
      }
    ]);
  };

  return (
    <>
      {/* Floating Action Button (Fixed Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white font-medium shadow-xl shadow-violet-600/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-violet-400/40"
          aria-label="Open Mindora AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-wide">Mindora AI</span>
        </button>
      )}

      {/* Floating Chat Panel Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Mindora Floating AI Assistant"
          className={`fixed bottom-4 sm:bottom-6 right-2 sm:right-6 z-50 bg-white rounded-3xl shadow-2xl border border-violet-100 flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-6 ${
            isExpanded
              ? 'w-[calc(100vw-1rem)] sm:w-[500px] h-[85vh] max-h-[700px]'
              : 'w-[calc(100vw-1rem)] sm:w-96 h-[540px] max-h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-700 p-3 px-4 text-white flex items-center justify-between shadow-sm shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight flex items-center gap-1.5">
                  <span>Mindora AI Assistant</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-semibold">
                    Global
                  </span>
                </h3>
                <span className="text-[10px] text-white/80">Navigation & Wellbeing Guide</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 hover:bg-white/20 rounded-lg transition text-white/90 hover:text-white"
                title="Restart Chat"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  if (isExpanded) {
                    onNavigate('ai_companion');
                  }
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition text-white/90 hover:text-white"
                title={isExpanded ? 'Restore Size' : 'Expand Panel'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition text-white/90 hover:text-white"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context-Aware Assistance Banner */}
          {contextGuidance && (
            <div className="bg-violet-50/90 px-3.5 py-2 border-b border-violet-100 flex items-center justify-between gap-2 text-xs shrink-0 animate-fade-in">
              <div className="flex items-center gap-1.5 text-violet-900 leading-tight">
                <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                <span className="line-clamp-1">{contextGuidance.prompt}</span>
              </div>
              <button
                type="button"
                onClick={contextGuidance.onTrigger}
                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition shrink-0"
              >
                {contextGuidance.actionLabel}
              </button>
            </div>
          )}

          {/* Quick Action Shortcuts Toolbar */}
          <div className="bg-slate-50 px-2 py-1.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            <button
              type="button"
              onClick={() => handleSend('Find a feature: show me popular sections')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 text-slate-700 whitespace-nowrap flex items-center gap-1 transition"
            >
              <Compass className="w-3 h-3 text-violet-600" />
              <span>Find feature</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Explain this page')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 text-slate-700 whitespace-nowrap flex items-center gap-1 transition"
            >
              <HelpCircle className="w-3 h-3 text-indigo-600" />
              <span>Explain page</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('I want to do a breathing exercise')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 text-slate-700 whitespace-nowrap flex items-center gap-1 transition"
            >
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>Wellbeing activity</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Where are my old assessments?')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 text-slate-700 whitespace-nowrap flex items-center gap-1 transition"
            >
              <CalendarCheck className="w-3 h-3 text-amber-600" />
              <span>Past assessments</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Help me plan my day')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-violet-300 text-slate-700 whitespace-nowrap flex items-center gap-1 transition"
            >
              <Target className="w-3 h-3 text-purple-600" />
              <span>Plan my day</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Contact emergency support helplines')}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-rose-300 text-rose-700 whitespace-nowrap flex items-center gap-1 transition"
            >
              <LifeBuoy className="w-3 h-3 text-rose-600" />
              <span>Support</span>
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-white to-slate-50/50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-violet-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Actionable Route Navigation Button */}
                  {msg.navTarget && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate(msg.navTarget!.id);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 active:scale-95 transition shadow-xs"
                      >
                        <span>Open {msg.navTarget.title}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {msg.navTarget.group}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-white border border-slate-200 w-fit text-xs text-slate-500 animate-pulse">
                <Bot className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything or request a page..."
              className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500 transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition shadow-xs active:scale-95"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
