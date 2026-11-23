import React from 'react';
import { useAmbientMusic } from '../context/MusicPlayerContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  Music,
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
  Headphones,
  Heart,
  Radio,
  Compass,
  CheckCircle2,
  Sliders,
  Info
} from 'lucide-react';
import type { NavigationScreen } from '../storage/sessionStorage';

interface AmbientMusicScreenProps {
  onNavigate?: (screen: NavigationScreen) => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const AmbientMusicScreen: React.FC<AmbientMusicScreenProps> = () => {
  const {
    isPlaying,
    currentTrackId,
    currentTrack,
    volume,
    isMuted,
    currentTime,
    duration,
    isRepeat,
    isShuffle,
    autoPlayOnLogin,
    defaultCategory,
    isAutoplayBlocked,
    clearAutoplayBlock,
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
    setAutoPlayOnLogin,
    setDefaultCategory,
    tracks
  } = useAmbientMusic();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Soft Piano':
        return <Music className="w-5 h-5 text-violet-600" />;
      case 'Ambient Instrumental':
        return <Sparkles className="w-5 h-5 text-violet-500" />;
      case 'Lo-fi Calm':
        return <Headphones className="w-5 h-5 text-indigo-500" />;
      case 'Meditation Instrumental':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'Peaceful Guitar':
        return <Radio className="w-5 h-5 text-amber-500" />;
      case 'Focus Music':
        return <Compass className="w-5 h-5 text-cyan-500" />;
      default:
        return <Music className="w-5 h-5 text-violet-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold tracking-wide uppercase">
              Mindora Instrumental Suite
            </span>
            <span className="px-3 py-1 bg-emerald-400/20 text-emerald-100 rounded-full text-xs font-semibold">
              Continuous Playback Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Soft Relaxing Instrumental Music
          </h1>
          <p className="mt-2 text-sm text-violet-100 leading-relaxed">
            Gentle piano melodies, smooth ambient synthesizers, warm lo-fi chords, acoustic guitar, and minimal mallet pulses engineered for deep study focus and stress down-regulation. Pure musical soundscapes with zero harsh transients or nature noise effects.
          </p>
        </div>
      </div>

      {/* Autoplay Blocked Notification Banner */}
      {isAutoplayBlocked && (
        <div
          data-testid="autoplay-blocked-banner"
          className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800 dark:text-amber-200 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium">
              Autoplay was held by your browser. Tap Resume to enjoy seamless instrumental wellness audio.
            </p>
          </div>
          <button
            onClick={clearAutoplayBlock}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all shrink-0 active:scale-95"
          >
            Resume Music
          </button>
        </div>
      )}

      {/* Master Controller Card */}
      <Card className="p-6 border border-violet-100 dark:border-violet-950 shadow-sm rounded-3xl bg-white dark:bg-slate-900">
        <div className="space-y-6">
          {/* Top row: Track Information & Quick Status */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md transition-all ${
                  isPlaying ? 'bg-violet-600 shadow-violet-200 dark:shadow-none scale-105' : 'bg-slate-700'
                }`}
              >
                {getCategoryIcon(currentTrack.category)}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase text-violet-600 dark:text-violet-400 tracking-wider">
                  {isPlaying ? 'Currently Playing' : 'Playback Paused'} • {currentTrack.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentTrack.name}
                </h3>
                <p className="text-xs text-slate-500 max-w-md truncate">
                  {currentTrack.description}
                </p>
              </div>
            </div>

            {/* Transport Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={previousTrack}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
                title="Previous track"
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (isPlaying) {
                    pause();
                  } else {
                    resume();
                  }
                }}
                className="w-12 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-all shadow-md active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={stop}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 transition-colors"
                title="Stop playback"
                aria-label="Stop playback"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>

              <button
                onClick={nextTrack}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors"
                title="Next track"
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isRepeat
                    ? 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
                title={isRepeat ? 'Repeat: Enabled' : 'Repeat: Disabled'}
                aria-label="Toggle repeat"
              >
                <Repeat className="w-4 h-4" />
              </button>

              <button
                onClick={toggleShuffle}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isShuffle
                    ? 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
                title={isShuffle ? 'Shuffle: Enabled' : 'Shuffle: Disabled'}
                aria-label="Toggle shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar & Seekable Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500">
              <span>{formatTime(currentTime)}</span>
              <span className="text-[11px] font-sans font-medium text-slate-400">
                16-Second Seamless Loop
              </span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 16}
              step="0.05"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-600"
              title="Seek track position"
            />
          </div>

          {/* Volume and Mute Controls */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMute}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-violet-600"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-32 sm:w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
                />
                <span className="text-xs font-mono text-slate-500 w-8">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 hidden sm:block">
              Soft 500ms fade-in/fade-out enabled
            </div>
          </div>
        </div>
      </Card>

      {/* 6 Music Soundscapes Grid (Part 2A Categories) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Available Instrumental Categories
          </h2>
          <Badge variant="violet">6 Pure Musical Compositions</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tracks.map((track) => {
            const isCurrent = track.id === currentTrackId;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <Card
                key={track.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'border-violet-500/80 bg-violet-50/20 dark:bg-violet-950/20 shadow-md ring-2 ring-violet-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-violet-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    {getCategoryIcon(track.category)}
                  </div>
                  <Badge variant={isCurrentPlaying ? 'violet' : 'slate'}>
                    {track.category}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  {track.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                  {track.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <button
                    onClick={() => {
                      if (isCurrentPlaying) {
                        pause();
                      } else {
                        playTrack(track.id);
                      }
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCurrentPlaying
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-violet-600 hover:bg-violet-700 text-white shadow-xs'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play {track.category}</span>
                      </>
                    )}
                  </button>

                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Music Preferences & Pacing Settings Card (Part 2E Requirements) */}
      <Card className="p-6 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-violet-600" />
          <span>Student Ambient Music Preferences</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Automatic Music Toggle */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Automatic Soft Music on Login
              </span>
              <p className="text-slate-500 mt-0.5">
                Automatically fade in gentle background music when you log in to study.
              </p>
            </div>
            <button
              onClick={() => setAutoPlayOnLogin(!autoPlayOnLogin)}
              className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                autoPlayOnLogin ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={autoPlayOnLogin}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  autoPlayOnLogin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Category Selection */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Default Music Category
              </span>
              <p className="text-slate-500 mt-0.5">
                Preferred instrumental style for study sessions.
              </p>
            </div>
            <select
              value={defaultCategory}
              onChange={(e) => setDefaultCategory(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.category}>
                  {t.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Educational Disclaimer */}
        <div className="mt-4 p-3.5 bg-violet-50/60 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 rounded-2xl flex items-start gap-2.5 text-xs text-violet-900 dark:text-violet-200 leading-relaxed">
          <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <span>
            <strong>Educational Pacing Tool:</strong> Mindora's ambient music is designed for cognitive down-regulation, background masking, and mindful study focus. It is completely optional, persists continuously during navigation, and does not provide clinical or medical treatment.
          </span>
        </div>
      </Card>
    </div>
  );
};
