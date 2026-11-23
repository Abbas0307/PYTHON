import React, { useState, useEffect } from 'react';
import { Bot, Send, ShieldCheck, AlertCircle, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { getApiBaseUrl } from '../../config/api';

interface LocalResourceCompanionProps {
  selectedCountry: string;
}

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: string[];
  isCrisis?: boolean;
  isDiagnostic?: boolean;
  metrics?: {
    total_time_seconds?: number;
    tokens_per_second?: number;
  };
}

const SERVICE_BASE_URL: string = getApiBaseUrl();

const EXAMPLE_PROMPTS = [
  'What is Tele-MANAS in India?',
  'How does 988 work in the US/Canada?',
  'What are evidence-based sleep hygiene tips?',
  'How can I manage exam study hours without burnout?'
];

export const LocalResourceCompanion: React.FC<LocalResourceCompanionProps> = ({ selectedCountry }) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [serviceStatus, setServiceStatus] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [serviceDetails, setServiceDetails] = useState<string | null>(null);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check health whenever companion is enabled
  useEffect(() => {
    if (!isEnabled) {
      setServiceStatus('idle');
      return;
    }

    if (!SERVICE_BASE_URL) {
      setServiceStatus('offline');
      setServiceDetails(null);
      return;
    }

    let isMounted = true;
    setServiceStatus('checking');

    fetch(`${SERVICE_BASE_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error('Service returned non-200');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setServiceStatus('online');
          const vramStr = data.gpu?.gpu_detected
            ? ` • VRAM: ${data.gpu.vram_used_mb}MB / ${data.gpu.vram_total_mb}MB`
            : '';
          setServiceDetails(`${data.model} (Ollama Local)${vramStr}`);
        }
      })
      .catch(() => {
        if (isMounted) {
          setServiceStatus('offline');
          setServiceDetails(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isEnabled]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');

    if (!SERVICE_BASE_URL) {
      const offlineMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content:
          'Service offline. The Local AI Companion is configured for local desktop/development environments only. All verified directory cards remain 100% available offline.'
      };
      setMessages((prev) => [...prev, offlineMsg]);
      return;
    }

    setIsLoading(true);

    try {
      // NOTE: Strictly transmits ONLY query and country. Zero PHQ-9 or personal assessment data.
      const res = await fetch(`${SERVICE_BASE_URL}/api/companion/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          country: selectedCountry
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: MessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response generated.',
        citations: data.citations || [],
        isCrisis: data.is_crisis || false,
        isDiagnostic: data.is_diagnostic || false,
        metrics: data.metrics
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: MessageItem = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          'Unable to reach the local companion service (http://127.0.0.1:8000). Please ensure the FastAPI companion service is running. All verified directory cards remain 100% available offline.'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
  };

  return (
    <Card className="mb-8 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-slate-900/60 dark:via-slate-900 dark:to-indigo-950/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-100 dark:border-indigo-950/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Local AI Resource Companion
              </h3>
              <Badge variant="violet" className="border-indigo-300 text-indigo-700 dark:text-indigo-300 text-xs">
                Optional · Local Qwen
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Strictly grounded Q&A over approved student wellbeing resources. Non-diagnostic.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isEnabled ? 'Companion Active' : 'Companion Disabled (Default)'}
          </span>
        </div>
      </div>

      {!isEnabled ? (
        <div className="py-4 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>
            The Local AI Companion is <strong>completely optional</strong> and turned off by default. All 24 verified support resources, emergency numbers, and crisis safeguards function 100% offline without it.
          </span>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              {serviceStatus === 'checking' && (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-slate-600 dark:text-slate-400">Connecting to local companion service...</span>
                </>
              )}
              {serviceStatus === 'online' && (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                    Online: {serviceDetails}
                  </span>
                </>
              )}
              {serviceStatus === 'offline' && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                    {SERVICE_BASE_URL
                      ? 'Service offline. Start FastAPI companion with Ollama.'
                      : 'Service offline. Local AI Companion operates in local desktop/dev mode only. All 24 directory resources remain 100% offline.'}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Zero Remote Telemetry · Ephemeral Memory</span>
            </div>
          </div>

          {/* Example Prompts */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 py-1">Quick Prompts:</span>
            {EXAMPLE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading || serviceStatus !== 'online'}
                className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 pt-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white ml-8 rounded-br-none'
                      : m.isCrisis
                      ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 mr-8 rounded-bl-none'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 mr-8 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed font-sans">{m.content}</p>

                  {/* Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5 items-center">
                      <span className="font-bold text-[10px] text-slate-500 uppercase tracking-wide">
                        Verified Sources:
                      </span>
                      {m.citations.map((c, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Metrics */}
                  {m.metrics && m.metrics.tokens_per_second !== undefined && m.metrics.tokens_per_second > 0 && (
                    <div className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      Generated locally in {m.metrics.total_time_seconds}s ({m.metrics.tokens_per_second} tok/s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 pt-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask an educational or resource question (e.g. sleep hygiene, Tele-MANAS)..."
              disabled={isLoading || serviceStatus !== 'online'}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading || !inputQuery.trim() || serviceStatus !== 'online'}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask</span>
                </>
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearHistory}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear
              </Button>
            )}
          </form>
        </div>
      )}
    </Card>
  );
};
