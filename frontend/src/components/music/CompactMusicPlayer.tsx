import React, { useState, useRef, useEffect } from 'react';
import { useAmbientMusic } from '../../context/MusicPlayerContext';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Sparkles,
  ChevronDown,
  Music
} from 'lucide-react';

interface CompactMusicPlayerProps {
  className?: string;
  variant?: 'minimal' | 'full';
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const CompactMusicPlayer: React.FC<CompactMusicPlayerProps> = ({
  className = '',
  variant = 'minimal'
}) => {
  const {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    currentTime,
    duration,
    isRepeat,
    isShuffle,
    isAutoplayBlocked,
    playTrack,
    pause,
    resume,
    stop,
    nextTrack,
    previousTrack,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    clearAutoplayBlock,
    tracks
  } = useAmbientMusic();

  const [isOpenMenu, setIsOpenMenu] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (playerRef.current && !playerRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
        setShowVolumeSlider(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If autoplay was blocked by browser
  if (isAutoplayBlocked) {
    return (
      <button
        onClick={clearAutoplayBlock}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all duration-200 animate-pulse ${className}`}
        title="Click to enable gentle ambient instrumental music"
      >
        <Sparkles className="w-3.5 h-3.5 text-violet-200" />
        <span>Enable peaceful music</span>
      </button>
    );
  }

  return (
    <div
      ref={playerRef}
      className={`relative inline-flex items-center gap-2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-violet-200 dark:border-violet-900/50 rounded-full px-3 py-1.5 shadow-sm transition-all ${className}`}
    >
      {/* Previous Track Button */}
      <button
        onClick={previousTrack}
        className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1"
        title="Previous Track"
        aria-label="Previous Track"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={() => {
          if (isPlaying) {
            pause();
          } else {
            resume();
          }
        }}
        className="w-7 h-7 rounded-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-all shadow-xs active:scale-95 focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
        title={isPlaying ? 'Pause peaceful music' : 'Play peaceful background music'}
        aria-label={isPlaying ? 'Pause peaceful music' : 'Play peaceful background music'}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        )}
      </button>

      {/* Stop Button */}
      <button
        onClick={stop}
        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
        title="Stop Music"
        aria-label="Stop Music"
      >
        <Square className="w-3 h-3 fill-current" />
      </button>

      {/* Next Track Button */}
      <button
        onClick={nextTrack}
        className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors p-1"
        title="Next Track"
        aria-label="Next Track"
      >
        <SkipForward className="w-3.5 h-3.5" />
      </button>

      {/* Equalizer Wave / Track Name / Category Dropdown */}
      <div
        className="flex items-center gap-1.5 cursor-pointer select-none px-1"
        onClick={() => setIsOpenMenu(!isOpenMenu)}
      >
        {isPlaying ? (
          <div className="flex items-end gap-0.5 h-3.5">
            <span className="w-0.5 bg-violet-500 rounded-full animate-bounce h-2" style={{ animationDelay: '0ms' }} />
            <span className="w-0.5 bg-violet-600 rounded-full animate-bounce h-3.5" style={{ animationDelay: '150ms' }} />
            <span className="w-0.5 bg-violet-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <Music className="w-3.5 h-3.5 text-violet-400" />
        )}
        <div className="flex flex-col text-left max-w-[130px]">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-none">
            {currentTrack.name}
          </span>
          <span className="text-[9px] font-medium text-violet-600 dark:text-violet-400 truncate leading-tight">
            {currentTrack.category}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
      </div>

      {/* Progress Bar (Full Variant or on hover) */}
      {variant === 'full' && (
        <div className="hidden sm:flex items-center gap-2 px-2 border-l border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-mono text-slate-500 w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 16}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-20 sm:w-28 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            title="Seek position"
          />
          <span className="text-[10px] font-mono text-slate-400 w-8">
            {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Repeat & Shuffle Controls */}
      <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
        <button
          onClick={toggleRepeat}
          className={`p-1 rounded-md transition-colors ${
            isRepeat
              ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={isRepeat ? 'Repeat: On' : 'Repeat: Off'}
          aria-label={isRepeat ? 'Repeat: On' : 'Repeat: Off'}
        >
          <Repeat className="w-3 h-3" />
        </button>
        <button
          onClick={toggleShuffle}
          className={`p-1 rounded-md transition-colors ${
            isShuffle
              ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={isShuffle ? 'Shuffle: On' : 'Shuffle: Off'}
          aria-label={isShuffle ? 'Shuffle: On' : 'Shuffle: Off'}
        >
          <Shuffle className="w-3 h-3" />
        </button>
      </div>

      {/* Volume / Mute Popover */}
      <div className="relative flex items-center border-l border-slate-200 dark:border-slate-800 pl-1.5">
        <button
          onClick={toggleMute}
          onMouseEnter={() => setShowVolumeSlider(true)}
          className="text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300 p-1"
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        {showVolumeSlider && (
          <div
            onMouseLeave={() => setShowVolumeSlider(false)}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/60 rounded-xl p-2.5 shadow-xl z-50 flex items-center gap-2 animate-in fade-in"
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
            <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 w-7">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Playlist Dropdown */}
      {isOpenMenu && (
        <div className="absolute top-full mt-2 left-0 sm:w-72 bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-900 rounded-2xl shadow-2xl p-2.5 z-50 max-h-[380px] overflow-y-auto custom-scrollbar animate-in fade-in">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 mb-1 border-b border-slate-100 dark:border-slate-800">
            Soft Instrumental Playlist
          </div>
          <div className="space-y-1">
            {tracks.map((track) => {
              const isSelected = track.id === currentTrack.id;
              return (
                <button
                  key={track.id}
                  onClick={() => {
                    playTrack(track.id);
                    setIsOpenMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-violet-100/80 text-violet-900 dark:bg-violet-950/80 dark:text-violet-200 font-bold border border-violet-200 dark:border-violet-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-semibold">{track.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">{track.category}</div>
                  </div>
                  {isSelected && isPlaying && (
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-600 animate-ping shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
