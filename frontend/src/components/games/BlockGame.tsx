import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  RotateCw
} from 'lucide-react';

interface BlockGameProps {
  onScoreUpdate?: (score: number) => void;
  isSessionActive: boolean;
  onSessionComplete?: () => void;
}

export interface Piece {
  id: string;
  shape: number[][]; // 2D matrix
  color: string;
}

const BOARD_SIZE = 10;

const BASE_PIECE_TEMPLATES: { shape: number[][]; color: string }[] = [
  { shape: [[1]], color: 'bg-amber-400' },
  { shape: [[1, 1]], color: 'bg-emerald-400' },
  { shape: [[1], [1]], color: 'bg-emerald-400' },
  { shape: [[1, 1, 1]], color: 'bg-cyan-400' },
  { shape: [[1], [1], [1]], color: 'bg-cyan-400' },
  { shape: [[1, 1], [1, 1]], color: 'bg-indigo-400' },
  { shape: [[1, 0], [1, 1]], color: 'bg-violet-400' },
  { shape: [[0, 1], [1, 1]], color: 'bg-violet-400' },
  { shape: [[1, 1, 1], [0, 1, 0]], color: 'bg-rose-400' },
  { shape: [[1, 1, 1], [1, 0, 0]], color: 'bg-fuchsia-400' }
];

export const BlockGame: React.FC<BlockGameProps> = ({
  onScoreUpdate,
  isSessionActive
}) => {
  const [board, setBoard] = useState<string[][]>(() =>
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''))
  );
  const [availablePieces, setAvailablePieces] = useState<Piece[]>([]);
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [hoverCoord, setHoverCoord] = useState<{ r: number; c: number } | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('mindora_block_high_score') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const boardRef = useRef<string[][]>(board);
  boardRef.current = board;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  // Web Audio pleasant chime generator
  const playTone = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.1) => {
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

  // Rotate a 2D matrix 90 degrees clockwise
  const rotateShape = (matrix: number[][]): number[][] => {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = matrix[r][c];
      }
    }
    return rotated;
  };

  const handleRotateSelectedPiece = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedPieceIndex === null || !availablePieces[selectedPieceIndex]) return;

    setAvailablePieces((prev) => {
      const updated = [...prev];
      const target = updated[selectedPieceIndex];
      updated[selectedPieceIndex] = {
        ...target,
        shape: rotateShape(target.shape)
      };
      return updated;
    });
    playTone(600, 'sine', 0.05);
  };

  // Check if a piece can be placed at (startRow, startCol) on a given board
  const canPlacePiece = useCallback(
    (piece: Piece, startRow: number, startCol: number, currentBoard: string[][]): boolean => {
      const shape = piece.shape;
      const pRows = shape.length;
      const pCols = shape[0].length;

      if (startRow + pRows > BOARD_SIZE || startCol + pCols > BOARD_SIZE) {
        return false;
      }
      if (startRow < 0 || startCol < 0) {
        return false;
      }

      for (let r = 0; r < pRows; r++) {
        for (let c = 0; c < pCols; c++) {
          if (shape[r][c] === 1) {
            if (currentBoard[startRow + r][startCol + c] !== '') {
              return false;
            }
          }
        }
      }
      return true;
    },
    []
  );

  // Check if any of the remaining pieces can be placed anywhere on the board
  const checkHasValidMoves = useCallback(
    (pieces: Piece[], currentBoard: string[][]): boolean => {
      if (pieces.length === 0) return true;

      for (const piece of pieces) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            if (canPlacePiece(piece, r, c, currentBoard)) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [canPlacePiece]
  );

  const generatePieces = useCallback(() => {
    const pieces: Piece[] = [];
    for (let i = 0; i < 3; i++) {
      const randomTpl = BASE_PIECE_TEMPLATES[Math.floor(Math.random() * BASE_PIECE_TEMPLATES.length)];
      pieces.push({
        id: `piece-${Date.now()}-${i}-${Math.random()}`,
        shape: randomTpl.shape,
        color: randomTpl.color
      });
    }
    setAvailablePieces(pieces);
    setSelectedPieceIndex(null);
    setHoverCoord(null);

    // Verify newly generated pieces have at least one valid move on current board
    if (!checkHasValidMoves(pieces, boardRef.current)) {
      setIsGameOver(true);
      setIsPlaying(false);
    }
  }, [checkHasValidMoves]);

  const handleStart = () => {
    const emptyBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''));
    setBoard(emptyBoard);
    boardRef.current = emptyBoard;
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
    generatePieces();
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleResume = () => {
    if (isGameOver) {
      handleStart();
    } else {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    const emptyBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''));
    setBoard(emptyBoard);
    boardRef.current = emptyBoard;
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(false);
    generatePieces();
  };

  // Auto-pause if session expires
  useEffect(() => {
    if (!isSessionActive && isPlaying) {
      setIsPlaying(false);
    }
  }, [isSessionActive, isPlaying]);

  // Initial piece generation
  useEffect(() => {
    generatePieces();
  }, [generatePieces]);

  // Keyboard controls (1, 2, 3 to select piece, R to rotate)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayingRef.current) return;

      if (e.key === '1' && availablePieces[0]) {
        setSelectedPieceIndex(0);
        playTone(480, 'sine', 0.05);
      } else if (e.key === '2' && availablePieces[1]) {
        setSelectedPieceIndex(1);
        playTone(540, 'sine', 0.05);
      } else if (e.key === '3' && availablePieces[2]) {
        setSelectedPieceIndex(2);
        playTone(600, 'sine', 0.05);
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotateSelectedPiece();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [availablePieces, selectedPieceIndex]);

  // Attempt placement on click
  const handleCellClick = (r: number, c: number) => {
    if (!isPlaying || isGameOver || selectedPieceIndex === null) return;
    const piece = availablePieces[selectedPieceIndex];
    if (!piece) return;

    if (!canPlacePiece(piece, r, c, board)) {
      playTone(180, 'sawtooth', 0.1);
      return;
    }

    // Place piece on cloned board
    const newBoard = board.map((row) => [...row]);
    const shape = piece.shape;
    let placedBlocksCount = 0;

    for (let pr = 0; pr < shape.length; pr++) {
      for (let pc = 0; pc < shape[0].length; pc++) {
        if (shape[pr][pc] === 1) {
          newBoard[r + pr][c + pc] = piece.color;
          placedBlocksCount++;
        }
      }
    }

    playTone(520, 'sine', 0.08);

    // Check completed rows & columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let rowIdx = 0; rowIdx < BOARD_SIZE; rowIdx++) {
      if (newBoard[rowIdx].every((cell) => cell !== '')) {
        fullRows.push(rowIdx);
      }
    }

    for (let colIdx = 0; colIdx < BOARD_SIZE; colIdx++) {
      let isColFull = true;
      for (let rowIdx = 0; rowIdx < BOARD_SIZE; rowIdx++) {
        if (newBoard[rowIdx][colIdx] === '') {
          isColFull = false;
          break;
        }
      }
      if (isColFull) fullCols.push(colIdx);
    }

    // Clear completed lines
    fullRows.forEach((rowIdx) => {
      for (let colIdx = 0; colIdx < BOARD_SIZE; colIdx++) {
        newBoard[rowIdx][colIdx] = '';
      }
    });

    fullCols.forEach((colIdx) => {
      for (let rowIdx = 0; rowIdx < BOARD_SIZE; rowIdx++) {
        newBoard[rowIdx][colIdx] = '';
      }
    });

    const linesCleared = fullRows.length + fullCols.length;
    if (linesCleared > 0) {
      playTone(880, 'triangle', 0.2);
    }

    const earnedPoints = placedBlocksCount * 10 + linesCleared * 100;
    const newScore = score + earnedPoints;
    setScore(newScore);

    if (newScore > highScore) {
      setHighScore(newScore);
      try {
        localStorage.setItem('mindora_block_high_score', newScore.toString());
      } catch {}
    }
    if (onScoreUpdate) onScoreUpdate(newScore);

    // Remove used piece
    const remainingPieces = availablePieces.filter((_, idx) => idx !== selectedPieceIndex);
    setSelectedPieceIndex(null);
    setHoverCoord(null);
    setBoard(newBoard);
    boardRef.current = newBoard;

    if (remainingPieces.length === 0) {
      generatePieces();
    } else {
      setAvailablePieces(remainingPieces);
      // Run Authoritative Game-Over Check on remaining pieces
      if (!checkHasValidMoves(remainingPieces, newBoard)) {
        playTone(220, 'sawtooth', 0.25);
        setIsGameOver(true);
        setIsPlaying(false);
      }
    }
  };

  // Determine if cell (r, c) is covered by the ghost preview
  const isGhostCell = (r: number, c: number): { isGhost: boolean; isValid: boolean } => {
    if (!hoverCoord || selectedPieceIndex === null || !availablePieces[selectedPieceIndex]) {
      return { isGhost: false, isValid: false };
    }
    const piece = availablePieces[selectedPieceIndex];
    const { r: startR, c: startC } = hoverCoord;
    const pr = r - startR;
    const pc = c - startC;

    if (pr >= 0 && pr < piece.shape.length && pc >= 0 && pc < piece.shape[0].length) {
      if (piece.shape[pr][pc] === 1) {
        const isValid = canPlacePiece(piece, startR, startC, board);
        return { isGhost: true, isValid };
      }
    }
    return { isGhost: false, isValid: false };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md mx-auto">
      {/* Header Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4">
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {score}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">Best: {highScore}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedPieceIndex !== null && (
            <button
              onClick={handleRotateSelectedPiece}
              className="px-2.5 py-1.5 rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-semibold flex items-center gap-1 hover:bg-violet-100 transition-colors"
              title="Rotate piece 90 degrees (Press R)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotate</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            title={soundEnabled ? 'Mute' : 'Unmute'}
            aria-label="Toggle sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 10x10 Board with Hover Previews and Placement Validation */}
      <div className="relative w-full aspect-square bg-slate-900 rounded-2xl overflow-hidden shadow-inner border-2 border-slate-800 p-2">
        <div
          className="w-full h-full grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`
          }}
          onMouseLeave={() => setHoverCoord(null)}
        >
          {board.map((row, r) =>
            row.map((cellColor, c) => {
              const { isGhost, isValid } = isGhostCell(r, c);

              let displayColor = cellColor;
              if (isGhost) {
                displayColor = isValid ? 'bg-emerald-400/80 ring-2 ring-emerald-300' : 'bg-rose-500/80 ring-2 ring-rose-400';
              }

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  onMouseEnter={() => setHoverCoord({ r, c })}
                  className={`w-full h-full rounded-md transition-all cursor-pointer ${
                    displayColor
                      ? `${displayColor} shadow-xs`
                      : 'bg-slate-800/80 hover:bg-slate-700/60'
                  }`}
                />
              );
            })
          )}
        </div>

        {/* Start / Game-Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in z-20">
            {isGameOver ? (
              <div className="space-y-3">
                <span className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  No More Moves Available
                </span>
                <h3 className="text-2xl font-black text-white">Board Full!</h3>
                <p className="text-xs text-slate-300 max-w-xs">
                  Splendid spatial focus! Final score: <span className="font-mono font-bold text-amber-400">{score}</span> points.
                </p>
                <button
                  onClick={handleStart}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg transition-transform active:scale-95"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Mindora Block Puzzle
                </span>
                <h3 className="text-xl font-black text-white">Mindful Placement</h3>
                <p className="text-xs text-slate-300 max-w-xs">
                  Select a piece below (press 1, 2, or 3), rotate if needed (press R), and click to place. Clear rows or columns to score!
                </p>
                <button
                  onClick={handleResume}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{score > 0 ? 'Resume Game' : 'Start Game'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Available Pieces Selection Bar */}
      <div className="w-full mt-3 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center justify-around min-h-[90px]">
        {availablePieces.map((piece, idx) => {
          const isSelected = selectedPieceIndex === idx;
          return (
            <div
              key={piece.id}
              onClick={() => {
                if (isSelected) {
                  // Click selected piece again to rotate!
                  handleRotateSelectedPiece();
                } else {
                  setSelectedPieceIndex(idx);
                  playTone(520, 'sine', 0.05);
                }
              }}
              className={`p-2.5 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                isSelected
                  ? 'ring-2 ring-indigo-500 bg-white dark:bg-slate-900 shadow-md scale-105'
                  : 'hover:bg-white/60 dark:hover:bg-slate-700/40'
              }`}
              title="Click to select; click again or press R to rotate"
            >
              <div
                className="grid gap-0.5"
                style={{
                  gridTemplateColumns: `repeat(${piece.shape[0].length}, 12px)`,
                  gridTemplateRows: `repeat(${piece.shape.length}, 12px)`
                }}
              >
                {piece.shape.map((row, pr) =>
                  row.map((val, pc) => (
                    <div
                      key={`${pr}-${pc}`}
                      className={`w-3 h-3 rounded-[2px] ${val ? piece.color : 'opacity-0'}`}
                    />
                  ))
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
            </div>
          );
        })}
      </div>

      {/* Action Controls */}
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
            onClick={handleResume}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-700 shadow-sm transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Resume</span>
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
