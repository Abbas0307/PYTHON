import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface SnakeGameProps {
  onScoreUpdate?: (score: number) => void;
  isSessionActive: boolean;
  onSessionComplete?: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 }
];

export const SnakeGame: React.FC<SnakeGameProps> = ({
  onScoreUpdate,
  isSessionActive
}) => {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('mindora_snake_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Direction and input FIFO queue to prevent 180-degree self-inversion on fast typing
  const currentDirRef = useRef<Direction>('UP');
  const inputQueueRef = useRef<Direction[]>([]);
  const isPlayingRef = useRef<boolean>(false);
  isPlayingRef.current = isPlaying;
  const isGameOverRef = useRef<boolean>(false);
  isGameOverRef.current = isGameOver;
  const isSessionActiveRef = useRef<boolean>(isSessionActive);
  isSessionActiveRef.current = isSessionActive;

  // Web Audio pleasant chime generator
  const playChime = useCallback((freq = 520, type: OscillatorType = 'sine', duration = 0.08) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context restricted
    }
  }, [soundEnabled]);

  const generateFood = (currentSnake: Point[]): Point => {
    while (true) {
      const candidate: Point = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      if (!currentSnake.some((seg) => seg.x === candidate.x && seg.y === candidate.y)) {
        return candidate;
      }
    }
  };

  const queueDirection = useCallback((newDir: Direction) => {
    const queue = inputQueueRef.current;
    const lastDir = queue.length > 0 ? queue[queue.length - 1] : currentDirRef.current;

    // Reject opposing 180-degree moves
    if (
      (newDir === 'UP' && lastDir === 'DOWN') ||
      (newDir === 'DOWN' && lastDir === 'UP') ||
      (newDir === 'LEFT' && lastDir === 'RIGHT') ||
      (newDir === 'RIGHT' && lastDir === 'LEFT')
    ) {
      return;
    }

    // Limit queue size to 2 to prevent stale latency
    if (queue.length < 2) {
      queue.push(newDir);
    }
  }, []);

  const handleStartOrResume = () => {
    if (isGameOver) {
      const freshSnake = [...INITIAL_SNAKE];
      setSnake(freshSnake);
      currentDirRef.current = 'UP';
      inputQueueRef.current = [];
      setScore(0);
      setIsGameOver(false);
      setFood(generateFood(freshSnake));
    }
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleRestart = () => {
    const freshSnake = [...INITIAL_SNAKE];
    setSnake(freshSnake);
    currentDirRef.current = 'UP';
    inputQueueRef.current = [];
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(false);
    setFood(generateFood(freshSnake));
  };

  // Auto-pause if session finishes or becomes inactive
  useEffect(() => {
    if (!isSessionActive && isPlaying) {
      setIsPlaying(false);
    }
  }, [isSessionActive, isPlaying]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Space toggles pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (isGameOverRef.current) {
          handleStartOrResume();
        } else {
          setIsPlaying((p) => !p);
        }
        return;
      }

      if (!isPlayingRef.current || isGameOverRef.current) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          queueDirection('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          queueDirection('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          queueDirection('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          queueDirection('RIGHT');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [queueDirection]);

  // Main game tick interval
  useEffect(() => {
    if (!isPlaying || isGameOver || !isSessionActive) return;

    const interval = setInterval(() => {
      // Consume next buffered direction if available
      if (inputQueueRef.current.length > 0) {
        currentDirRef.current = inputQueueRef.current.shift()!;
      }

      const dir = currentDirRef.current;

      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        // Wall collision check
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          playChime(220, 'sawtooth', 0.2);
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Self collision check
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          playChime(220, 'sawtooth', 0.2);
          setIsGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat food check
        if (head.x === food.x && head.y === food.y) {
          playChime(640, 'sine', 0.09);
          setScore((s) => {
            const nextScore = s + 10;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              try {
                localStorage.setItem('mindora_snake_high_score', nextScore.toString());
              } catch {}
            }
            if (onScoreUpdate) onScoreUpdate(nextScore);
            return nextScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, 130);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, isSessionActive, food, highScore, onScoreUpdate, playChime]);

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto">
      {/* Game Header Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {score}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">Best: {highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            aria-label="Toggle sound effects"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grid Canvas Board (Guaranteed responsive, never overflows container) */}
      <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800">
        <div
          className="w-full h-full grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);

            const isHead = snake[0]?.x === x && snake[0]?.y === y;
            const isBody = snake.slice(1).some((s) => s.x === x && s.y === y);
            const isApple = food.x === x && food.y === y;

            return (
              <div
                key={idx}
                className="w-full h-full flex items-center justify-center border-[0.5px] border-slate-800/40"
              >
                {isHead && (
                  <div className="w-[85%] h-[85%] bg-emerald-400 rounded-md shadow-xs ring-2 ring-emerald-300" />
                )}
                {isBody && (
                  <div className="w-[75%] h-[75%] bg-emerald-600 rounded-sm" />
                )}
                {isApple && (
                  <div className="w-[80%] h-[80%] bg-rose-500 rounded-full shadow-md animate-pulse ring-2 ring-rose-400" />
                )}
              </div>
            );
          })}
        </div>

        {/* Start / Pause / Game-Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
            {isGameOver ? (
              <div className="space-y-3">
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Session Paused
                </span>
                <h3 className="text-2xl font-black text-white">Mindful Reset</h3>
                <p className="text-xs text-slate-300 max-w-xs">
                  Nice focus! You collected {score / 10} focus nodes. Ready for another round?
                </p>
                <button
                  onClick={handleStartOrResume}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-xl font-black text-white">Mindora Snake</h3>
                <p className="text-xs text-slate-300 max-w-xs">
                  Use Arrow keys, WASD, or on-screen touch arrows to guide the snake. Short recreational break to reset cognitive fatigue.
                </p>
                <button
                  onClick={handleStartOrResume}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{score > 0 ? 'Resume Game' : 'Start Game'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Action Buttons */}
      <div className="flex items-center gap-3 mt-4">
        {isPlaying ? (
          <button
            onClick={handlePause}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        ) : (
          <button
            onClick={handleStartOrResume}
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{score > 0 ? 'Resume' : 'Start'}</span>
          </button>
        )}
        <button
          onClick={handleRestart}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Responsive Mobile / Touch D-Pad Controls */}
      <div className="mt-4 flex flex-col items-center gap-1 select-none">
        <button
          onClick={() => queueDirection('UP')}
          className="w-12 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-emerald-600 active:text-white transition-colors"
          aria-label="Move Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => queueDirection('LEFT')}
            className="w-12 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-emerald-600 active:text-white transition-colors"
            aria-label="Move Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => queueDirection('DOWN')}
            className="w-12 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-emerald-600 active:text-white transition-colors"
            aria-label="Move Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => queueDirection('RIGHT')}
            className="w-12 h-10 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-700 dark:text-slate-200 active:bg-emerald-600 active:text-white transition-colors"
            aria-label="Move Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
