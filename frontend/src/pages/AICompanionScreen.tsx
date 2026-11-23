import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Trash2,
  Shield,
  Sparkles,
  Info,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { getApiBaseUrl } from '../config/api';

interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  source?: string;
  is_crisis?: boolean;
  is_diagnostic?: boolean;
}

interface ContextDisclosure {
  title: string;
  student_approved_context_items: string[];
  strictly_excluded_data: string[];
  non_diagnostic_declaration: string;
}

const STARTER_PROMPTS = [
  "I have an exam in 2 days and I'm feeling overwhelmed with the syllabus.",
  "Help me build a gentle 30-minute sleep wind-down routine.",
  "I'm feeling stuck in procrastination and can't start studying.",
  "Guide me through a quick 3-minute breathing reset."
];

export const AICompanionScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [disclosure, setDisclosure] = useState<ContextDisclosure>({
    title: 'Student Privacy & Context Boundaries',
    student_approved_context_items: [
      'Current wellness indicator band (e.g. Balanced, Elevated, Heightened)',
      'Active student self-care goals and study targets',
      'Titles of recently completed wellness practices',
      'Preferred study break rhythm'
    ],
    strictly_excluded_data: [
      'Private personal journal entries and reflection notes (always encrypted at rest)',
      'Guardian contact details (email addresses and phone numbers)',
      'Clinical psychometric assessment raw numbers or PHQ-9 items',
      'Student account passwords or authentication tokens'
    ],
    non_diagnostic_declaration:
      'Mindora AI Companion is an educational wellness assistant designed to encourage healthy daily habits, mindful pacing, and study routines. It is not a therapist, physician, or diagnostic instrument.'
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAuthToken = () => {
    return (
      sessionStorage.getItem('mindora_auth_token') ||
      localStorage.getItem('mindora_auth_token') ||
      localStorage.getItem('session_token') ||
      localStorage.getItem('auth_token') ||
      'local_dev_session'
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history & context disclosure on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${getApiBaseUrl()}/api/ai-companion/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.history && data.history.length > 0) {
            setMessages(data.history);
          } else {
            // Add initial greeting
            setMessages([
              {
                role: 'assistant',
                content:
                  "Hello! I am your Mindora AI Wellbeing Companion. I'm here to support you with collegiate stress management, study pacing, sleep habits, and mindfulness exercises.\n\nHow are you feeling today?",
                source: 'companion'
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };

    const fetchDisclosure = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/ai-companion/context-info`);
        if (res.ok) {
          const data = await res.json();
          setDisclosure(data.data);
        }
      } catch (err) {
        console.error('Failed to load context disclosure', err);
      }
    };

    fetchHistory();
    fetchDisclosure();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${getApiBaseUrl()}/api/ai-companion/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          country: 'India',
          include_context: includeContext
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.data.content,
        is_crisis: data.data.is_crisis,
        is_diagnostic: data.data.is_diagnostic,
        source: data.data.source
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: unknown) {
      console.error('Error chatting with companion:', err);
      setErrorMsg('Failed to receive response. Mindora companion fallback is active.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I'm here with you. Take a slow, deep breath in for 4 seconds, and exhale for 6 seconds. When feeling overwhelmed by academics, remember to break your tasks into tiny 15-minute segments.",
          source: 'collegiate_fallback'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) return;
    try {
      const token = getAuthToken();
      await fetch(`${getApiBaseUrl()}/api/ai-companion/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([
        {
          role: 'assistant',
          content: 'Conversation history cleared. How can I assist your student wellbeing today?',
          source: 'companion'
        }
      ]);
    } catch (err) {
      console.error('Failed to clear history', err);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Mindora AI Companion
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                Collegiate AI
              </span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Empathetic, non-diagnostic student wellbeing guidance and study habit support.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDisclosure(true)}
            className="text-xs text-gray-600 dark:text-gray-300"
          >
            <Shield className="w-4 h-4 mr-1.5 text-brand-600" />
            Privacy & Context Info
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear History
          </Button>
        </div>
      </div>

      {/* Emergency Crisis Contact Ribbon */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 px-4 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Immediate Support Available:</strong> If you or a peer are experiencing a crisis, confidential help is available 24/7. Tele-MANAS: <strong>14416</strong> | Emergency: <strong>112</strong> | KIRAN: <strong>1800-599-0019</strong>
          </span>
        </div>
        <span className="shrink-0 text-amber-700 dark:text-amber-300 font-medium hidden sm:inline">
          Free & Confidential
        </span>
      </div>

      {/* Chat Container Card */}
      <Card className="flex flex-col h-[600px] p-0 overflow-hidden border-gray-200 dark:border-gray-800 shadow-sm">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/40">
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isCrisis = msg.is_crisis;
            const isDiagnostic = msg.is_diagnostic;

            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${
                  isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser
                      ? 'bg-brand-600 text-white'
                      : isCrisis
                      ? 'bg-rose-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? 'You' : isCrisis ? 'SOS' : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-tr-none shadow-sm'
                      : isCrisis
                      ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100 rounded-tl-none font-medium'
                      : isDiagnostic
                      ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 rounded-tl-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 mr-auto max-w-[75%]">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-150" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-300" />
                <span className="text-xs text-gray-400 ml-2">Mindora Companion thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Starters (Only shown when few messages) */}
        {messages.length <= 2 && (
          <div className="px-4 py-3 bg-white dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              Suggested Starters:
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-xs text-left px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-700/60 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800">
          {errorMsg && (
            <p className="text-xs text-rose-500 dark:text-rose-400 mb-2">{errorMsg}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about study pacing, sleep habits, exam stress, or mindfulness..."
              disabled={isLoading}
              className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="px-5 py-3 h-auto rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

          {/* Context toggle bar */}
          <div className="flex items-center justify-between mt-2 pt-2 text-xs text-gray-500 dark:text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <span>Share my active wellbeing band and goals for personalized responses</span>
            </label>
            <button
              type="button"
              onClick={() => setShowDisclosure(true)}
              className="hover:underline flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Info className="w-3.5 h-3.5" />
              What is shared?
            </button>
          </div>
        </div>
      </Card>

      {/* Privacy & Context Disclosure Modal */}
      {showDisclosure && disclosure && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-brand-600" />
                {disclosure.title}
              </h3>
              <button
                onClick={() => setShowDisclosure(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  What can be shared (when toggle enabled):
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 text-xs space-y-1">
                  {disclosure.student_approved_context_items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                  <Shield className="w-4 h-4" />
                  What is STRICTLY NEVER shared:
                </p>
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 text-xs space-y-1">
                  {disclosure.strictly_excluded_data.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                {disclosure.non_diagnostic_declaration}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setShowDisclosure(false)} size="sm">
                Got It
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
