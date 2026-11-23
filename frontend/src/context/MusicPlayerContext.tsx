import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { getApiBaseUrl } from '../config/api';

export type AmbientTrackId =
  | 'soft_piano'
  | 'ambient_instrumental'
  | 'lofi_calm'
  | 'meditation_instrumental'
  | 'peaceful_guitar'
  | 'focus_music'
  // Backward compatibility aliases
  | 'peaceful_instrumental'
  | 'nature_sounds'
  | 'rain_ambience'
  | 'ocean_waves'
  | 'gentle_meditation';

export interface AmbientTrack {
  id: AmbientTrackId;
  name: string;
  category: string;
  description: string;
  src: string;
  icon: string;
  durationSeconds?: number;
}

export const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'soft_piano',
    name: 'Soft Piano',
    category: 'Soft Piano',
    description: 'Gentle acoustic piano melodies with slow tempo, minimal arrangement, and warm peaceful atmosphere.',
    src: '/audio/soft_piano.wav',
    icon: 'Music',
    durationSeconds: 16
  },
  {
    id: 'ambient_instrumental',
    name: 'Ambient Instrumental',
    category: 'Ambient Instrumental',
    description: 'Soft synthesizer pads and smooth atmospheric layers with calm, non-distracting sound.',
    src: '/audio/ambient_instrumental.wav',
    icon: 'Sparkles',
    durationSeconds: 16
  },
  {
    id: 'lofi_calm',
    name: 'Lo-fi Calm',
    category: 'Lo-fi Calm',
    description: 'Warm Rhodes electric piano chords with relaxed lo-fi rhythm sway and zero vocal distractions.',
    src: '/audio/lofi_calm.wav',
    icon: 'Headphones',
    durationSeconds: 16
  },
  {
    id: 'meditation_instrumental',
    name: 'Meditation Instrumental',
    category: 'Meditation Instrumental',
    description: '432 Hz healing resonance drone with subtle crystal overtones for mindful centering.',
    src: '/audio/meditation_instrumental.wav',
    icon: 'Heart',
    durationSeconds: 16
  },
  {
    id: 'peaceful_guitar',
    name: 'Peaceful Guitar',
    category: 'Peaceful Guitar',
    description: 'Soft acoustic guitar fingerpicking arpeggios with gentle phrasing and warm resonance.',
    src: '/audio/peaceful_guitar.wav',
    icon: 'Radio',
    durationSeconds: 16
  },
  {
    id: 'focus_music',
    name: 'Focus Music',
    category: 'Focus Music',
    description: 'Minimalist warm mallet and marimba pulses with a stable background bed for deep concentration.',
    src: '/audio/focus_music.wav',
    icon: 'Compass',
    durationSeconds: 16
  }
];

// Map legacy IDs to clean instrumental replacements
export const normalizeTrackId = (trackId?: string): AmbientTrackId => {
  if (!trackId) return 'soft_piano';
  switch (trackId) {
    case 'peaceful_instrumental':
      return 'ambient_instrumental';
    case 'nature_sounds':
      return 'peaceful_guitar';
    case 'rain_ambience':
      return 'focus_music';
    case 'ocean_waves':
      return 'lofi_calm';
    case 'gentle_meditation':
      return 'meditation_instrumental';
    default:
      if (AMBIENT_TRACKS.some((t) => t.id === trackId)) {
        return trackId as AmbientTrackId;
      }
      return 'soft_piano';
  }
};

interface MusicPlayerContextType {
  isPlaying: boolean;
  currentTrackId: AmbientTrackId;
  currentTrack: AmbientTrack;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isRepeat: boolean;
  isShuffle: boolean;
  autoPlayOnLogin: boolean;
  defaultCategory: string;
  isAutoplayBlocked: boolean;
  isAutoplayAllowed: boolean;
  playTrack: (trackId?: AmbientTrackId) => Promise<void>;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  setAutoPlayOnLogin: (val: boolean) => void;
  setDefaultCategory: (cat: string) => void;
  clearAutoplayBlock: () => void;
  tracks: AmbientTrack[];
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

const STORAGE_KEY = 'mindora_ambient_music_preferences_v2';

export const getUserStorageKey = (userId?: number | string | null): string => {
  if (userId) return `mindora_ambient_music_preferences_u${userId}`;
  try {
    const raw = sessionStorage.getItem('mindora_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return `mindora_ambient_music_preferences_u${u.id}`;
    }
  } catch {}
  return 'mindora_ambient_music_preferences_guest';
};

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackId, setCurrentTrackId] = useState<AmbientTrackId>('soft_piano');
  const [volume, setVolumeState] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(16);
  const [isRepeat, setIsRepeat] = useState<boolean>(true);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [autoPlayOnLogin, setAutoPlayOnLoginState] = useState<boolean>(true);
  const [defaultCategory, setDefaultCategoryState] = useState<string>('Soft Piano');
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [isAutoplayAllowed, setIsAutoplayAllowed] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any>(null);
  const currentUserIdRef = useRef<number | string | null>(null);

  const currentTrack = AMBIENT_TRACKS.find((t) => t.id === currentTrackId) || AMBIENT_TRACKS[0];

  // Initialize single global Audio instance & synchronize user preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Resolve initial user ID if logged in
    try {
      const rawUser = sessionStorage.getItem('mindora_user');
      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        if (parsedUser?.id) {
          currentUserIdRef.current = parsedUser.id;
        }
      }
    } catch {}

    const userKey = getUserStorageKey(currentUserIdRef.current);

    // Load saved preferences from user-scoped key or legacy global key
    try {
      const saved = localStorage.getItem(userKey) || localStorage.getItem(STORAGE_KEY) || localStorage.getItem('mindora_ambient_music_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.trackId) {
          setCurrentTrackId(normalizeTrackId(parsed.trackId));
        }
        if (typeof parsed.volume === 'number') {
          setVolumeState(Math.max(0, Math.min(1, parsed.volume)));
        }
        if (typeof parsed.isMuted === 'boolean') {
          setIsMuted(parsed.isMuted);
        }
        if (typeof parsed.isRepeat === 'boolean') {
          setIsRepeat(parsed.isRepeat);
        }
        if (typeof parsed.isShuffle === 'boolean') {
          setIsShuffle(parsed.isShuffle);
        }
        if (typeof parsed.autoPlayOnLogin === 'boolean') {
          setAutoPlayOnLoginState(parsed.autoPlayOnLogin);
        }
        if (parsed.defaultCategory) {
          setDefaultCategoryState(parsed.defaultCategory);
        }
        if (parsed.isAutoplayAllowed) {
          setIsAutoplayAllowed(true);
        }
      }
    } catch {
      // Ignore parse error
    }

    // Also pull latest preferences from backend database if token is present
    const token = sessionStorage.getItem('mindora_auth_token');
    if (token) {
      fetch(`${getApiBaseUrl()}/api/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((r) => r.json())
        .then((res) => {
          if (res?.status === 'success' && res.data) {
            const d = res.data;
            if (d.ambient_music_track) {
              setCurrentTrackId(normalizeTrackId(d.ambient_music_track));
            }
            if (typeof d.ambient_music_volume === 'number') {
              setVolumeState(Math.max(0, Math.min(1, d.ambient_music_volume)));
            }
            if (typeof d.ambient_music_enabled === 'boolean') {
              setAutoPlayOnLoginState(d.ambient_music_enabled);
            }
          }
        })
        .catch(() => {});
    }

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    // Stop playback on logout or beforeunload, but preserve preferences
    const handleLogout = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      currentUserIdRef.current = null;
    };

    // User Login Event Handler: Loads user-scoped preferences and triggers auto-resume
    const handleLogin = async (event: any) => {
      const loggedUser = event?.detail?.user;
      const uid = loggedUser?.id || null;
      currentUserIdRef.current = uid;
      const loginUserKey = getUserStorageKey(uid);
      let targetTrackId = currentTrackId;
      let shouldAutoPlay = autoPlayOnLogin;

      try {
        const userSaved = localStorage.getItem(loginUserKey);
        if (userSaved) {
          const parsed = JSON.parse(userSaved);
          if (parsed.trackId) {
            targetTrackId = normalizeTrackId(parsed.trackId);
            setCurrentTrackId(targetTrackId);
          }
          if (typeof parsed.volume === 'number') {
            setVolumeState(Math.max(0, Math.min(1, parsed.volume)));
          }
          if (typeof parsed.isMuted === 'boolean') setIsMuted(parsed.isMuted);
          if (typeof parsed.isRepeat === 'boolean') setIsRepeat(parsed.isRepeat);
          if (typeof parsed.isShuffle === 'boolean') setIsShuffle(parsed.isShuffle);
          if (typeof parsed.autoPlayOnLogin === 'boolean') {
            shouldAutoPlay = parsed.autoPlayOnLogin;
            setAutoPlayOnLoginState(parsed.autoPlayOnLogin);
          }
        }
      } catch {}

      // Check backend preferences
      const authToken = sessionStorage.getItem('mindora_auth_token');
      if (authToken) {
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/preferences`, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.status === 'success' && data.data) {
              const d = data.data;
              if (d.ambient_music_track) {
                targetTrackId = normalizeTrackId(d.ambient_music_track);
                setCurrentTrackId(targetTrackId);
              }
              if (typeof d.ambient_music_volume === 'number') {
                setVolumeState(Math.max(0, Math.min(1, d.ambient_music_volume)));
              }
              if (typeof d.ambient_music_enabled === 'boolean') {
                shouldAutoPlay = d.ambient_music_enabled;
                setAutoPlayOnLoginState(d.ambient_music_enabled);
              }
            }
          }
        } catch {}
      }

      if (shouldAutoPlay) {
        playTrack(targetTrackId);
      }
    };

    window.addEventListener('mindora:login', handleLogin);
    window.addEventListener('mindora:logout', handleLogout);
    window.addEventListener('beforeunload', handleLogout);

    return () => {
      window.removeEventListener('mindora:login', handleLogin);
      window.removeEventListener('mindora:logout', handleLogout);
      window.removeEventListener('beforeunload', handleLogout);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Sync loop property with isRepeat
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isRepeat;
    }
  }, [isRepeat]);

  // Persist preferences to user-specific localStorage key and debounce sync to backend
  useEffect(() => {
    const userKey = getUserStorageKey(currentUserIdRef.current);
    const prefPayload = {
      trackId: currentTrackId,
      volume,
      isMuted,
      isRepeat,
      isShuffle,
      autoPlayOnLogin,
      defaultCategory,
      isAutoplayAllowed
    };

    try {
      localStorage.setItem(userKey, JSON.stringify(prefPayload));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefPayload));
    } catch {
      // Ignore
    }

    const token = sessionStorage.getItem('mindora_auth_token');
    if (token) {
      const syncTimer = setTimeout(() => {
        fetch(`${getApiBaseUrl()}/api/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ambient_music_enabled: autoPlayOnLogin,
            ambient_music_track: currentTrackId,
            ambient_music_volume: volume,
            game_sound_enabled: true
          })
        }).catch(() => {});
      }, 500);

      return () => clearTimeout(syncTimer);
    }
  }, [currentTrackId, volume, isMuted, isRepeat, isShuffle, autoPlayOnLogin, defaultCategory, isAutoplayAllowed]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current && !fadeIntervalRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Soft fade-in helper
  const fadeIn = (targetVol: number, durationMs = 1000) => {
    if (!audioRef.current) return;
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    audioRef.current.volume = 0;
    const steps = 20;
    const stepDuration = durationMs / steps;
    const volIncrement = targetVol / steps;
    let currentVol = 0;

    fadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        return;
      }
      currentVol = Math.min(targetVol, currentVol + volIncrement);
      audioRef.current.volume = isMuted ? 0 : currentVol;

      if (currentVol >= targetVol) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, stepDuration);
  };

  // Soft fade-out helper
  const fadeOut = (durationMs = 600, callback?: () => void) => {
    if (!audioRef.current) {
      if (callback) callback();
      return;
    }
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const startVol = audioRef.current.volume;
    const steps = 15;
    const stepDuration = durationMs / steps;
    const volDecrement = startVol / steps;
    let currentVol = startVol;

    fadeIntervalRef.current = setInterval(() => {
      if (!audioRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
        return;
      }
      currentVol = Math.max(0, currentVol - volDecrement);
      audioRef.current.volume = currentVol;

      if (currentVol <= 0) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, stepDuration);
  };

  const playTrack = useCallback(
    async (trackId?: AmbientTrackId) => {
      const audio = audioRef.current;
      if (!audio) return;

      const targetId = normalizeTrackId(trackId || currentTrackId);
      const targetObj = AMBIENT_TRACKS.find((t) => t.id === targetId) || AMBIENT_TRACKS[0];

      if (audio.src !== window.location.origin + targetObj.src && !audio.src.endsWith(targetObj.src)) {
        audio.src = targetObj.src;
      }

      setCurrentTrackId(targetId);

      try {
        await audio.play();
        setIsPlaying(true);
        setIsAutoplayBlocked(false);
        setIsAutoplayAllowed(true);
        fadeIn(volume);
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setIsAutoplayBlocked(true);
          setIsPlaying(false);
        } else {
          console.warn('Audio playback error:', err);
        }
      }
    },
    [currentTrackId, volume, isMuted]
  );

  const pause = useCallback(() => {
    fadeOut(400, () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    });
  }, []);

  const resume = useCallback(async () => {
    if (!audioRef.current) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
      fadeIn(volume);
    } catch {
      setIsAutoplayBlocked(true);
    }
  }, [volume]);

  const stop = useCallback(() => {
    fadeOut(500, () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setCurrentTime(0);
    });
  }, []);

  const nextTrack = useCallback(() => {
    const currentIndex = AMBIENT_TRACKS.findIndex((t) => t.id === currentTrackId);
    let nextIndex = 0;
    if (isShuffle) {
      let rand = Math.floor(Math.random() * AMBIENT_TRACKS.length);
      if (rand === currentIndex) rand = (rand + 1) % AMBIENT_TRACKS.length;
      nextIndex = rand;
    } else {
      nextIndex = (currentIndex + 1) % AMBIENT_TRACKS.length;
    }
    const nextTrackObj = AMBIENT_TRACKS[nextIndex];
    playTrack(nextTrackObj.id);
  }, [currentTrackId, isShuffle, playTrack]);

  const previousTrack = useCallback(() => {
    const currentIndex = AMBIENT_TRACKS.findIndex((t) => t.id === currentTrackId);
    let prevIndex = (currentIndex - 1 + AMBIENT_TRACKS.length) % AMBIENT_TRACKS.length;
    const prevTrackObj = AMBIENT_TRACKS[prevIndex];
    playTrack(prevTrackObj.id);
  }, [currentTrackId, playTrack]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current && !isNaN(seconds)) {
      const clamped = Math.max(0, Math.min(audioRef.current.duration || 16, seconds));
      audioRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    if (audioRef.current && !fadeIntervalRef.current) {
      audioRef.current.volume = isMuted ? 0 : clamped;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setIsRepeat((prev) => !prev);
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const setAutoPlayOnLogin = useCallback((val: boolean) => {
    setAutoPlayOnLoginState(val);
  }, []);

  const setDefaultCategory = useCallback((cat: string) => {
    setDefaultCategoryState(cat);
  }, []);

  const clearAutoplayBlock = useCallback(() => {
    setIsAutoplayBlocked(false);
    playTrack();
  }, [playTrack]);

  return (
    <MusicPlayerContext.Provider
      value={{
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
        isAutoplayAllowed,
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
        clearAutoplayBlock,
        tracks: AMBIENT_TRACKS
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useAmbientMusic = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useAmbientMusic must be used within a MusicPlayerProvider');
  }
  return context;
};
