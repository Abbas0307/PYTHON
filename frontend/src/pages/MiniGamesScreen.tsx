import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../components/common/Card';
import { SnakeGame } from '../components/games/SnakeGame';
import { BlockGame } from '../components/games/BlockGame';
import { Gamepad2, Timer, Trophy, RefreshCw, CheckCircle, Info } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import type { NavigationScreen } from '../storage/sessionStorage';

const SESSION_STORAGE_KEY = 'mindora_active_game_session_v1';
const FIVE_MINUTES_SECONDS = 300;

interface MiniGamesScreenProps {
  onNavigate?: (screen: NavigationScreen) => void;
}

export const MiniGamesScreen: React.FC<MiniGamesScreenProps> = () => {
  const [selectedGame, setSelectedGame] = useState<'snake' | 'block'>('snake');
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showTimeLimitModal, setShowTimeLimitModal] = useState<boolean>(false);
  const [showStopCompletionMessage, setShowStopCompletionMessage] = useState<boolean>(false);
  const [engagement, setEngagement] = useState<any>(null);

  const sessionIdRef = useRef<string | null>(null);
  const currentScoreRef = useRef<number>(0);

  // Load existing session or restore timer across refreshes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.startTime && parsed.sessionId) {
          const now = Date.now();
          const elapsed = Math.floor((now - parsed.startTime) / 1000);
          sessionIdRef.current = parsed.sessionId;
          setSelectedGame(parsed.gameType || 'snake');
          setSessionStartTime(parsed.startTime);

          if (elapsed >= FIVE_MINUTES_SECONDS) {
            setElapsedSeconds(FIVE_MINUTES_SECONDS);
            setIsSessionActive(false);
            setShowTimeLimitModal(true);
          } else {
            setElapsedSeconds(elapsed);
            setIsSessionActive(true);
          }
        }
      }
    } catch {
      // Ignore session storage error
    }

    fetchEngagement();
  }, []);

  const fetchEngagement = async () => {
    try {
      const token = sessionStorage.getItem('mindora_auth_token') || localStorage.getItem('mindora_auth_token') || '';
      const res = await fetch(`${getApiBaseUrl()}/api/games/engagement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setEngagement(json.data);
      }
    } catch {
      // Fallback
    }
  };

  // Wall-clock ticker loop (handles tab-switching and backgrounding reliably)
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const trueElapsed = Math.floor((now - sessionStartTime) / 1000);
      setElapsedSeconds(trueElapsed);

      // Enforce strict 5-minute session limit
      if (trueElapsed >= FIVE_MINUTES_SECONDS) {
        setIsSessionActive(false);
        setShowTimeLimitModal(true);
        clearInterval(interval);
        syncBackendSession(FIVE_MINUTES_SECONDS, currentScoreRef.current, 'time_limit_reached');
      } else if (trueElapsed % 15 === 0) {
        // Periodic heartbeat sync
        syncBackendSession(trueElapsed, currentScoreRef.current, 'active');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive, sessionStartTime]);

  const syncBackendSession = async (duration: number, score: number, status: string) => {
    if (!sessionIdRef.current) return;
    try {
      const token = sessionStorage.getItem('mindora_auth_token') || localStorage.getItem('mindora_auth_token') || '';
      await fetch(`${getApiBaseUrl()}/api/games/session/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          duration_seconds: duration,
          score,
          status
        })
      });
    } catch {
      // Offline fallback
    }
  };

  const handleStartSession = async (gameType: 'snake' | 'block') => {
    const now = Date.now();
    const token = sessionStorage.getItem('mindora_auth_token') || localStorage.getItem('mindora_auth_token') || '';

    let newSessionId = `GAME-${now}`;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/games/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ game_type: gameType })
      });
      if (res.ok) {
        const json = await res.json();
        newSessionId = json.data.session_id;
      }
    } catch {
      // Offline session id fallback
    }

    sessionIdRef.current = newSessionId;
    setSelectedGame(gameType);
    setSessionStartTime(now);
    setElapsedSeconds(0);
    setIsSessionActive(true);
    setShowTimeLimitModal(false);
    setShowStopCompletionMessage(false);

    try {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          sessionId: newSessionId,
          gameType,
          startTime: now
        })
      );
    } catch {
      // Ignore
    }
  };

  const handleContinueSession = () => {
    // Starts a new 5-minute session without losing prior score
    handleStartSession(selectedGame);
  };

  const handleStopSession = async () => {
    setShowTimeLimitModal(false);
    setIsSessionActive(false);
    setShowStopCompletionMessage(true);

    if (sessionIdRef.current) {
      await syncBackendSession(elapsedSeconds, currentScoreRef.current, 'completed');
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    fetchEngagement();
  };

  const remainingSeconds = Math.max(0, FIVE_MINUTES_SECONDS - elapsedSeconds);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const progressPercent = Math.min(100, (elapsedSeconds / FIVE_MINUTES_SECONDS) * 100);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
              Wellness Center · Mini Games
            </span>
            <span className="px-3 py-1 bg-emerald-300/20 text-emerald-100 rounded-full text-xs font-semibold">
              5-Minute Structured Break Limit
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
            <Gamepad2 className="w-8 h-8" />
            <span>Mindora Stress-Relief Mini Games</span>
          </h1>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
            Short, focused recreational games designed for mindful cognitive disengagement. Each play session has a strict five-minute duration limit to help you recharge without losing study momentum.
          </p>
        </div>
      </div>

      {/* Five-Minute Session Timer & Status Bar */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${isSessionActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-500'}`}>
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isSessionActive ? 'Active 5-Minute Break Session' : 'Session Ready'}
              </span>
              <div className="text-xl font-mono font-black text-slate-900 dark:text-white">
                {isSessionActive ? `Time Remaining: ${timerDisplay}` : '5:00 Session Timer'}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full sm:w-64">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 mb-1">
              <span>Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s</span>
              <span>Limit: 5:00</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progressPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Game Switcher Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setSelectedGame('snake');
                if (!isSessionActive) handleStartSession('snake');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedGame === 'snake'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Snake Game
            </button>
            <button
              onClick={() => {
                setSelectedGame('block');
                if (!isSessionActive) handleStartSession('block');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedGame === 'block'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Block Puzzle
            </button>
          </div>
        </div>
      </Card>

      {/* Friendly Session Stop Confirmation Message */}
      {showStopCompletionMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-xs animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <strong>Great job completing your restorative break!</strong> Taking brief, structured pauses prevents mental fatigue and restores working memory. You are ready to resume your study routine.
          </div>
        </div>
      )}

      {/* Main Game Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm">
            {selectedGame === 'snake' ? (
              <SnakeGame
                isSessionActive={isSessionActive}
                onScoreUpdate={(s) => {
                  currentScoreRef.current = s;
                }}
              />
            ) : (
              <BlockGame
                isSessionActive={isSessionActive}
                onScoreUpdate={(s) => {
                  currentScoreRef.current = s;
                }}
              />
            )}
          </Card>
        </div>

        {/* Engagement & Pacing Stats Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>Personal Break Stats</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500">Snake High Score</span>
                <span className="font-mono font-bold text-emerald-600">
                  {engagement?.games?.snake?.high_score || 0}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500">Block High Score</span>
                <span className="font-mono font-bold text-indigo-600">
                  {engagement?.games?.block?.high_score || 0}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500">Total Break Sessions</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {engagement?.total_sessions || 0}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-slate-500">Total Rest Time</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {engagement?.total_playtime_minutes || 0} mins
                </span>
              </div>
            </div>
          </Card>

          {/* Educational Disclaimer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-2 text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Info className="w-4 h-4 text-violet-500" />
              <span>Non-Diagnostic Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              Mindora Mini Games are voluntary micro-breaks designed to prevent study burnout. They do not diagnose, treat, or cure depression, anxiety, or ADHD.
            </p>
          </div>
        </div>
      </div>

      {/* Strict Five-Minute Limit Popup Modal */}
      {showTimeLimitModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Timer className="w-7 h-7" />
            </div>

            <div>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider">
                Session Limit Reached
              </span>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2">
                Your five-minute play session is complete. Would you like to continue or stop?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Taking regular study pauses helps clear cognitive fog. Would you like to continue playing for another five-minute block or stop and return to your routine?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleContinueSession}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>CONTINUE (5 MINS)</span>
              </button>

              <button
                onClick={handleStopSession}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
              >
                STOP &amp; RETURN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
