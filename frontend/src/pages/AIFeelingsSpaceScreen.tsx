import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  Pause,
  Clock,
  FileText,
  Ear,
  Brain,
  Compass,
  Repeat,
  Save,
  Trash2,
  Share2,
  Phone,
  Copy,
  Check,
  Globe2
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import type { NavigationScreen } from '../storage/sessionStorage';

interface AIFeelingsSpaceScreenProps {
  onNavigate: (screen: NavigationScreen) => void;
}

export type ConversationMode = 'just_listen' | 'understand_feelings' | 'help_move_forward';

type SessionState =
  | 'welcome'
  | 'waiting_to_start'
  | 'ai_speaking'
  | 'listening'
  | 'processing'
  | 'responding'
  | 'paused'
  | 'session_completed'
  | 'permission_denied'
  | 'error';

interface ConversationTurn {
  speaker: 'ai' | 'user';
  text: string;
  timestamp: string;
  mode?: ConversationMode;
}

interface StructuredSessionSummary {
  sessionDuration: string;
  completedAt: string;
  mainTopics: string[];
  challengesMentioned: string[];
  helpfulActionsSuggested: string[];
  personalGoals: string[];
  encouragingClosing: string;
}

export const AIFeelingsSpaceScreen: React.FC<AIFeelingsSpaceScreenProps> = ({
  onNavigate
}) => {
  // Session Core State
  const [sessionState, setSessionState] = useState<SessionState>('welcome');
  const [conversationMode, setConversationMode] = useState<ConversationMode>('understand_feelings');
  const [hasConsented, setHasConsented] = useState<boolean>(() => {
    return localStorage.getItem('mindora_feelings_space_consent') === 'true';
  });
  const [showConsentModal, setShowConsentModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcriptText, setTranscriptText] = useState<string>('');
  const [aiResponseText, setAiResponseText] = useState<string>('');
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [isCrisisDetected, setIsCrisisDetected] = useState<boolean>(false);
  const [speechLang, setSpeechLang] = useState<string>(() => {
    return localStorage.getItem('mindora_speech_lang') || 'en-IN';
  });
  const [isCopiedManas, setIsCopiedManas] = useState<boolean>(false);

  // Structured Session Summary State
  const [showSessionSummary, setShowSessionSummary] = useState<boolean>(false);
  const [structuredSummary, setStructuredSummary] = useState<StructuredSessionSummary | null>(null);
  const [saveSummaryConsent, setSaveSummaryConsent] = useState<boolean>(false);
  const [summarySavedStatus, setSummarySavedStatus] = useState<string | null>(null);

  // Real-time Audio Visualization & VAD State
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 20, 15, 25, 20, 30, 20, 25, 18, 22, 15, 20, 18, 15, 20, 15]);
  const [isVoiceDetected, setIsVoiceDetected] = useState<boolean>(false);

  // Fallback text input if speech recognition is unsupported or student prefers typing
  const [isFallbackInput, setIsFallbackInput] = useState<boolean>(false);
  const [fallbackTextInput, setFallbackTextInput] = useState<string>('');

  // Audio & Turn Management References
  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const lastAiSpokenTextRef = useRef<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechWatchdogRef = useRef<any>(null);
  const askedQuestionsRef = useRef<Set<string>>(new Set());
  const detectedTopicsRef = useRef<Set<string>>(new Set());

  // Web Audio API References
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Non-stale closure synchronization references
  const sessionStateRef = useRef<SessionState>(sessionState);
  const conversationModeRef = useRef<ConversationMode>(conversationMode);
  const conversationHistoryRef = useRef<ConversationTurn[]>(conversationHistory);
  const isMutedRef = useRef<boolean>(isMuted);
  const transcriptAccumulatorRef = useRef<string>('');
  const lastSpeechTimeRef = useRef<number>(0);
  const isUserSpeakingRef = useRef<boolean>(false);
  const speechDurationCountRef = useRef<number>(0);
  const speechLangRef = useRef<string>(speechLang);

  useEffect(() => {
    speechLangRef.current = speechLang;
    localStorage.setItem('mindora_speech_lang', speechLang);
  }, [speechLang]);

  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  useEffect(() => {
    conversationModeRef.current = conversationMode;
  }, [conversationMode]);

  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Web Speech API support check
  const isSpeechRecognitionSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }, []);

  // Format Elapsed Time (MM:SS)
  const formattedTime = useMemo(() => {
    const mins = Math.floor(sessionTimeSeconds / 60);
    const secs = sessionTimeSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [sessionTimeSeconds]);

  // Session Duration Timer (ticks only in active engaged states)
  useEffect(() => {
    const activeStates: SessionState[] = ['ai_speaking', 'listening', 'processing', 'responding'];
    if (activeStates.includes(sessionState)) {
      timerRef.current = setInterval(() => {
        setSessionTimeSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState]);

  // Stop & Clean up Audio Pipeline (zero audio leakage)
  const stopAudioPipeline = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch {}
      analyserRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsVoiceDetected(false);
  };

  // Stop recognition & silence timer during AI speech or pause
  const stopMicrophone = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setIsVoiceDetected(false);
  };

  // Cleanup audio, recognition and speech on unmount
  useEffect(() => {
    return () => {
      stopAiSpeech();
      stopAudioPipeline();
    };
  }, []);

  // Check Microphone Permissions
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          setMicPermission(permissionStatus.state as any);
          permissionStatus.onchange = () => {
            setMicPermission(permissionStatus.state as any);
          };
        })
        .catch(() => {
          // Fallback if permission query fails
        });
    }
  }, []);

  // Stop AI SpeechSynthesis
  const stopAiSpeech = () => {
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  };

  // Real-Time Audio Visualizer Loop (60 FPS via requestAnimationFrame)
  const startVisualizerLoop = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    let phase = 0;
    const freqData = new Uint8Array(32);
    const timeData = new Uint8Array(64);
    let smoothedVolume = 12;

    const renderFrame = () => {
      phase += 0.08;
      const currentState = sessionStateRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas ? canvas.getContext('2d') : null;

      let currentLevels: number[] = [];

      if (currentState === 'listening' && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(freqData);
        analyserRef.current.getByteTimeDomainData(timeData);

        // 1. RMS time-domain volume
        let sumSquares = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / timeData.length);

        // 2. Speech frequency band energy (bins 1 to 20)
        let speechBandSum = 0;
        const binCount = Math.min(20, freqData.length);
        for (let i = 1; i < binCount; i++) {
          speechBandSum += freqData[i] || 0;
        }
        const avgSpeechBand = speechBandSum / Math.max(1, binCount - 1);

        // Dynamic volume combining RMS and frequency content
        const rawTargetVol = Math.min(100, (rms * 380) + (avgSpeechBand / 255) * 55);
        smoothedVolume = smoothedVolume * 0.65 + rawTargetVol * 0.35;

        const voicePresent = rawTargetVol > 12;
        setIsVoiceDetected(voicePresent);
        if (voicePresent) {
          lastSpeechTimeRef.current = Date.now();
          isUserSpeakingRef.current = true;
          speechDurationCountRef.current = (speechDurationCountRef.current || 0) + 1;
        } else if (isUserSpeakingRef.current && (Date.now() - lastSpeechTimeRef.current >= 1500)) {
          // Hardware VAD silence trigger: Student spoke and has now paused for >= 1.5s
          isUserSpeakingRef.current = false;
          const captured = transcriptAccumulatorRef.current.trim();
          if (captured.length > 0 && sessionStateRef.current === 'listening') {
            finalizeStudentTurn(captured);
          } else if (sessionStateRef.current === 'listening' && (speechDurationCountRef.current || 0) > 15) {
            // Audio activity detected but SpeechRecognition failed to return text
            speechDurationCountRef.current = 0;
            finalizeStudentTurn("I am sharing my feelings with you.");
          }
          speechDurationCountRef.current = 0;
        }

        // Generate 16 bars reflecting speech band distribution
        for (let i = 0; i < 16; i++) {
          const binIndex = Math.min(freqData.length - 1, Math.floor(i * 1.4) + 1);
          const freqVal = (freqData[binIndex] || 0) / 255;
          const barVal = Math.min(100, Math.max(10, Math.round(smoothedVolume * 0.6 + freqVal * 40)));
          currentLevels.push(barVal);
        }
      } else if (currentState === 'ai_speaking') {
        setIsVoiceDetected(false);
        for (let i = 0; i < 16; i++) {
          const wave = Math.sin(phase + i * 0.45) * 0.5 + 0.5;
          currentLevels.push(Math.round(wave * 70 + 20));
        }
      } else if (currentState === 'processing') {
        setIsVoiceDetected(false);
        for (let i = 0; i < 16; i++) {
          const wave = Math.sin(phase * 1.6 + i * 0.35) * 0.35 + 0.35;
          currentLevels.push(Math.round(wave * 45 + 15));
        }
      } else {
        setIsVoiceDetected(false);
        currentLevels = [12, 16, 12, 18, 14, 16, 12, 14, 16, 12, 18, 14, 12, 16, 14, 12];
      }

      setAudioLevels(currentLevels);

      // Render onto real-time 60fps canvas
      if (canvas && ctx) {
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const barCount = 16;
        const barWidth = Math.floor(width / (barCount * 1.5));
        const gap = Math.floor(barWidth * 0.5);
        const totalW = barCount * (barWidth + gap) - gap;
        let startX = (width - totalW) / 2;

        for (let i = 0; i < barCount; i++) {
          const lvl = currentLevels[i] || 15;
          const barHeight = Math.max(6, (lvl / 100) * height * 0.85);
          const y = (height - barHeight) / 2;

          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          if (currentState === 'listening') {
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(1, '#06b6d4');
          } else if (currentState === 'ai_speaking') {
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#4f46e5');
          } else if (currentState === 'processing') {
            gradient.addColorStop(0, '#a855f7');
            gradient.addColorStop(1, '#6366f1');
          } else {
            gradient.addColorStop(0, '#cbd5e1');
            gradient.addColorStop(1, '#94a3b8');
          }

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(startX, y, barWidth, barHeight, [4, 4, 4, 4]);
          ctx.fill();

          startX += barWidth + gap;
        }
      }

      animFrameRef.current = requestAnimationFrame(renderFrame);
    };

    animFrameRef.current = requestAnimationFrame(renderFrame);
  };

  // Initialize Web Audio API Analyser & Microphone Stream
  const initAudioPipeline = async (): Promise<boolean> => {
    try {
      if (typeof window === 'undefined') return false;

      // 1. AudioContext initialization
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtxClass();
        }
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
      }

      // 2. MediaStream acquisition
      if (!mediaStreamRef.current || !mediaStreamRef.current.active) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            },
            video: false
          });
          mediaStreamRef.current = stream;
          setMicPermission('granted');

          // 3. Connect AnalyserNode with 64 FFT size for frequency binning and low-latency visualization
          if (audioContextRef.current) {
            const analyser = audioContextRef.current.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.5;
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyser);
            analyserRef.current = analyser;
            sourceNodeRef.current = source;
          }
        }
      }

      startVisualizerLoop();
      return true;
    } catch (err: any) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setSessionState('permission_denied');
        sessionStateRef.current = 'permission_denied';
      }
      return false;
    }
  };

  // AI Voice Output using Web SpeechSynthesis API (CPU-only)
  const speakAiResponse = (text: string, onEndCallback?: () => void) => {
    // Invariant: Abort mic listening while AI speaks to prevent audio feedback loop
    stopMicrophone();

    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }

    lastAiSpokenTextRef.current = text;
    setAiResponseText(text);
    setIsSpeaking(true);
    setSessionState('ai_speaking');
    sessionStateRef.current = 'ai_speaking';

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setTimeout(() => {
        setIsSpeaking(false);
        if (onEndCallback) {
          onEndCallback();
        } else if (!isMutedRef.current && sessionStateRef.current !== 'paused' && sessionStateRef.current !== 'session_completed') {
          startListening();
        } else {
          setSessionState('waiting_to_start');
          sessionStateRef.current = 'waiting_to_start';
        }
      }, 1500);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch {}

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance; // Prevent Chromium V8 GC from killing utterance and freezing turns
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Select calm natural voice if available
    const voices = window.speechSynthesis.getVoices();
    let gentleVoice = voices.find(
      (v) =>
        v.lang === (speechLangRef.current || 'en-IN') ||
        v.name.includes('India')
    );
    if (!gentleVoice) {
      gentleVoice = voices.find(
        (v) =>
          v.name.includes('Zira') ||
          v.name.includes('David') ||
          v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Google US English') ||
          v.lang.startsWith('en')
      );
    }
    if (gentleVoice) {
      utterance.voice = gentleVoice;
      utterance.lang = gentleVoice.lang;
    } else {
      utterance.lang = speechLangRef.current || 'en-IN';
    }

    let hasHandledEnd = false;
    const handleUtteranceEnd = () => {
      if (hasHandledEnd) return;
      hasHandledEnd = true;
      if (speechWatchdogRef.current) {
        clearTimeout(speechWatchdogRef.current);
        speechWatchdogRef.current = null;
      }
      utteranceRef.current = null;
      setIsSpeaking(false);
      if (onEndCallback) {
        onEndCallback();
      } else {
        // AUTOMATIC TURN-TAKING: Hands-free transition to listening
        if (!isMutedRef.current && sessionStateRef.current !== 'paused' && sessionStateRef.current !== 'session_completed') {
          startListening();
        } else {
          setSessionState('waiting_to_start');
          sessionStateRef.current = 'waiting_to_start';
        }
      }
    };

    utterance.onend = handleUtteranceEnd;

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error or interrupted:', e);
      handleUtteranceEnd();
    };

    // Watchdog timer: estimated reading time + 2.5s buffer
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const estimatedSeconds = Math.max(3, (wordCount / (2.2 * speechRate)) + 2.5);
    speechWatchdogRef.current = setTimeout(() => {
      if (!hasHandledEnd && sessionStateRef.current === 'ai_speaking') {
        console.warn('Speech watchdog triggered: forcing turn transition to listening');
        handleUtteranceEnd();
      }
    }, estimatedSeconds * 1000);

    setTimeout(() => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis speak failed:', err);
      }
    }, 40);
  };

  // Share Tele-MANAS Details
  const handleShareTeleManas = async () => {
    const textToShare =
      "Tele-MANAS (Govt of India National Mental Health Helpline): Call 14416 or 1800-89-14416 (Toll-Free, 24/7, Confidential, 20+ Languages). Immediate Emergency: 112. Shared from Mindora Student Wellbeing.";

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Tele-MANAS National Mental Health Helpline',
          text: textToShare,
          url: 'https://telemanas.mohfw.gov.in'
        });
        return;
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(textToShare);
        setIsCopiedManas(true);
        setTimeout(() => setIsCopiedManas(false), 3000);
      } catch {}
    }
  };

  // Replay Last AI Response
  const handleReplayResponse = () => {
    if (lastAiSpokenTextRef.current) {
      speakAiResponse(lastAiSpokenTextRef.current);
    }
  };

  // Finalize Spoken Input & Transition to AI Processing
  const finalizeStudentTurn = (capturedTranscript: string) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    stopMicrophone();
    processStudentInput(capturedTranscript);
  };

  // Start Microphone Listening with Real-Time VAD & Hands-Free Turn-Taking
  const startListening = async () => {
    if (isMutedRef.current || sessionStateRef.current === 'paused' || sessionStateRef.current === 'session_completed') {
      return;
    }

    if (isCrisisDetected) return;

    // Ensure audio pipeline is initialized and visualizer running
    await initAudioPipeline();

    if (!isSpeechRecognitionSupported) {
      setIsFallbackInput(true);
      setSessionState('listening');
      sessionStateRef.current = 'listening';
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLangRef.current || 'en-IN';

      transcriptAccumulatorRef.current = '';
      setTranscriptText('');

      recognition.onstart = () => {
        setSessionState('listening');
        sessionStateRef.current = 'listening';
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        let clean = fullTranscript.replace(/\s+/g, ' ').trim();
        // Collegiate phonetic corrections for maximum speech precision
        clean = clean
          .replace(/\bc\s*g\s*p\s*a\b/gi, 'CGPA')
          .replace(/\bg\s*p\s*a\b/gi, 'GPA')
          .replace(/\bb\s*tech\b|\bbe\s*tech\b/gi, 'B.Tech')
          .replace(/\bsem\s*master\b|\bsome\s*master\b/gi, 'semester')
          .replace(/\bwee\s*va\b/gi, 'viva')
          .replace(/\bback\s*log\b/gi, 'backlog')
          .replace(/\bback\s*logs\b/gi, 'backlogs')
          .replace(/\btele\s*manas\b|\btelly\s*manas\b/gi, 'Tele-MANAS')
          .replace(/\bplacement\s*s\b/gi, 'placements');

        if (clean) {
          transcriptAccumulatorRef.current = clean;
          setTranscriptText(clean);
          lastSpeechTimeRef.current = Date.now();
          isUserSpeakingRef.current = true;

          // Debounce turn-taking silence (1400ms to allow natural breathing pauses)
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            const captured = transcriptAccumulatorRef.current.trim();
            if (captured.length > 0 && sessionStateRef.current === 'listening') {
              finalizeStudentTurn(captured);
            }
          }, 1400);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          setSessionState('permission_denied');
          sessionStateRef.current = 'permission_denied';
          setErrorMessage(
            'Microphone access was denied. Please allow microphone permissions in your browser or use the text reflection option.'
          );
        } else if (event.error === 'language-not-supported' || event.error === 'network') {
          if (recognition.lang !== 'en-US') {
            try {
              recognition.lang = 'en-US';
              recognition.start();
              return;
            } catch {}
          }
          setSessionState('listening');
          sessionStateRef.current = 'listening';
        } else if (event.error === 'no-speech' || event.error === 'aborted') {
          // Normal ambient silence; keep listening peacefully
        } else {
          setSessionState('listening');
          sessionStateRef.current = 'listening';
        }
      };

      recognition.onend = () => {
        const captured = transcriptAccumulatorRef.current.trim();
        if (captured.length > 0 && sessionStateRef.current === 'listening') {
          finalizeStudentTurn(captured);
        } else if (sessionStateRef.current === 'listening' && !isMutedRef.current) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
    } catch (err: any) {
      setIsFallbackInput(true);
      setSessionState('listening');
      sessionStateRef.current = 'listening';
      setErrorMessage(
        'Speech recognition is unavailable in this environment. You can use the peaceful text input below.'
      );
    }
  };

  // ---------------------------------------------------------------------------
  // NATURAL CONVERSATIONAL INTELLIGENCE ENGINE (CPU-Compatible Empathy)
  // ---------------------------------------------------------------------------
  const generateEmpatheticResponse = (
    userText: string,
    history: ConversationTurn[],
    mode: ConversationMode
  ): string => {
    const qLower = userText.toLowerCase();

    // 0. Topic Identification & Session Memory Update
    const currentTurnTopics: string[] = [];

    // Helper to ensure varied, non-repeating questions
    const pickUnique = (options: string[]): string => {
      let unused = options.filter((opt) => !askedQuestionsRef.current.has(opt));
      if (unused.length === 0) {
        options.forEach((opt) => askedQuestionsRef.current.delete(opt));
        unused = options;
      }
      const chosen = unused[Math.floor(Math.random() * unused.length)] || options[0];
      askedQuestionsRef.current.add(chosen);
      return chosen;
    };

    // 0.1 Greetings & Friendly Check-Ins
    const isGreeting = /\b(hello|hi|hey|good morning|good evening|good afternoon|namaste|can you hear me|are you there|test|testing|yo)\b/i.test(qLower);
    if (isGreeting && history.filter((t) => t.speaker === 'user').length <= 2) {
      return pickUnique([
        "Hello! I hear you loud and clear. I'm right here with you in this private, calm space. Take your time—what's on your mind today?",
        "Hi there! Welcome. You have my full attention. How are you feeling right in this moment?",
        "Hello! I'm listening with a calm and open presence. Feel free to share whatever has been taking up space in your thoughts."
      ]);
    }

    // 0.2 Gratitude & Session Wrap-ups
    const isGratitude = /\b(thank you|thanks|that helps|feeling better|appreciate it|goodbye|bye)\b/i.test(qLower);
    if (isGratitude) {
      return pickUnique([
        "You are so welcome. It takes real strength to pause and speak your feelings aloud. How are your shoulders and breathing feeling right now?",
        "I'm truly glad this space feels comforting for you. Remember that you can return here whenever you need a calm listening ear.",
        "Take good care of yourself today. You are doing much better than you give yourself credit for."
      ]);
    }

    // 0.3 Comprehensive College Life Topics
    if (/\b(exam|exams|test|tests|quiz|quizs|finals|midterm|midterms|sessional|sessionals|viva|practical|practicals|paper|papers)\b/i.test(qLower)) {
      currentTurnTopics.push('exams');
      detectedTopicsRef.current.add('Upcoming Exams & Assessment Pressure');
    }
    if (/\b(assignment|assignments|project|projects|homework|programming|code|coding|lab|labs|submission|submissions|record|records)\b/i.test(qLower)) {
      currentTurnTopics.push('assignments');
      detectedTopicsRef.current.add('Project & Assignment Deadlines');
    }
    if (/\b(deadline|deadlines|due|hurry|rush|late|no time|running out of time|delay|delays)\b/i.test(qLower)) {
      currentTurnTopics.push('deadlines');
      detectedTopicsRef.current.add('Pacing & Time Constraints');
    }
    if (/\b(sleep|sleeping|insomnia|tired|exhausted|awake|night|nights|sleepy|drowsy|fatigue|drained|burnout|burned out|no energy)\b/i.test(qLower)) {
      currentTurnTopics.push('sleep');
      detectedTopicsRef.current.add('Sleep Routine & Physical Rest');
    }
    if (/\b(lonely|alone|isolate|isolated|isolation|friend|friends|nobody|hostel|roommate|roommates|homesick|homesickness|fitting in|left out)\b/i.test(qLower)) {
      currentTurnTopics.push('social');
      detectedTopicsRef.current.add('Social Connection & Isolation');
    }
    if (/\b(cgpa|gpa|marks|grade|grades|fail|failed|failing|backlog|backlogs|pointer|percentage|percent|result|results|flunk)\b/i.test(qLower)) {
      currentTurnTopics.push('grades');
      detectedTopicsRef.current.add('Academic Grades & Performance Standards');
    }
    if (/\b(placement|placements|job|jobs|interview|interviews|resume|cv|career|careers|internship|internships|package|offer|unplaced|rejected|rejection)\b/i.test(qLower)) {
      currentTurnTopics.push('placements');
      detectedTopicsRef.current.add('Career & Placement Uncertainties');
    }
    if (/\b(parent|parents|mom|dad|family|father|mother|relatives|expectation|expectations|disappointed|disappointment|compare|comparing|scolded)\b/i.test(qLower)) {
      currentTurnTopics.push('parents');
      detectedTopicsRef.current.add('Family Expectations & Parental Pressure');
    }
    if (/\b(overwhelm|overwhelmed|stress|stressed|anxious|anxiety|panic|panicking|pressure|worry|worried|nervous|freaking out|scared|fear)\b/i.test(qLower)) {
      currentTurnTopics.push('stress');
      detectedTopicsRef.current.add('Stress & Nervous System Load');
    }
    if (/\b(sad|sadness|depressed|depression|crying|cry|tears|unhappy|miserable|hopeless|giving up|broken|empty|numb|hurt|hurting|pain)\b/i.test(qLower)) {
      currentTurnTopics.push('sadness');
      detectedTopicsRef.current.add('Emotional Pain & Low Mood');
    }
    if (/\b(procrastinat|procrastination|lazy|distract|distracted|distraction|phone|scrolling|social media|unproductive|wasted|cannot focus|can't focus)\b/i.test(qLower)) {
      currentTurnTopics.push('procrastination');
      detectedTopicsRef.current.add('Procrastination & Cognitive Friction');
    }
    if (/\b(breakup|broke up|ex|girlfriend|boyfriend|partner|relationship|dumped|cheated|fighting|fight)\b/i.test(qLower)) {
      currentTurnTopics.push('relationship');
      detectedTopicsRef.current.add('Interpersonal Relationships & Heartbreak');
    }

    // Dynamic mirroring snippet of student's spoken words
    const userWords = userText.trim();
    const mirrorSnippet = userWords.length > 4 ? userWords.replace(/[?.!]/g, '').trim() : '';

    // 2. Multi-turn Topic Shift Detection
    const previousUserTurns = history.filter((t) => t.speaker === 'user');
    let acknowledgesShift = false;
    if (previousUserTurns.length > 0) {
      const lastUserText = previousUserTurns[previousUserTurns.length - 1].text.toLowerCase();
      const previousHadAcademic = lastUserText.includes('exam') || lastUserText.includes('assignment') || lastUserText.includes('grade');
      const currentHasSleep = qLower.includes('sleep') || qLower.includes('tired');
      if (previousHadAcademic && currentHasSleep) {
        acknowledgesShift = true;
      }
    }

    // 3. Mode-Specific Response Architecture
    if (mode === 'just_listen') {
      // MODE 1 — JUST LISTEN: Empathetic validation without offering solutions or unsolicited advice
      if (acknowledgesShift) {
        return pickUnique([
          "I hear how that exhaustion is catching up with you on top of the academic load. It makes complete sense that carrying both feels heavy. I'm right here listening.",
          "It sounds like your body is carrying that fatigue while your mind is still processing your coursework. Take all the time you need to let it out."
        ]);
      }
      if (currentTurnTopics.includes('sadness')) {
        return pickUnique([
          "I hear how much emotional heaviness you are carrying right now. It takes courage to speak honestly when you feel low. I'm right here listening.",
          "Feeling sad or drained is so quietly exhausting. You don't have to put on a brave face here—let it out at your own pace."
        ]);
      }
      if (currentTurnTopics.includes('grades') || currentTurnTopics.includes('placements')) {
        return pickUnique([
          "Numbers, CGPA, and placement pressure create such an unfair weight on your identity. Your worth as a human is so much greater than a grade or package. I'm here listening.",
          "It takes a lot of mental energy to deal with performance expectations and grades. It is completely okay to feel drained by it."
        ]);
      }
      if (currentTurnTopics.includes('parents')) {
        return pickUnique([
          "Family expectations can feel like a heavy silent backpack we carry everywhere. Thank you for expressing that honestly.",
          "It is so understandable to feel caught between wanting to make family proud and wanting peace of mind. I'm holding space for you."
        ]);
      }
      if (currentTurnTopics.includes('social')) {
        return pickUnique([
          "Feeling that quiet disconnect or loneliness is very real and tender. I'm holding space for you, exactly as you are.",
          "It takes vulnerability to admit when we feel isolated. I hear you, and you are not alone in this space."
        ]);
      }
      if (currentTurnTopics.includes('assignments') || currentTurnTopics.includes('exams')) {
        return pickUnique([
          "That is a significant amount of academic weight on your shoulders. It makes complete sense that you're feeling the intensity of it right now. I'm listening.",
          "Holding that much workload in your head is truly demanding. You don't have to carry it all in silence today."
        ]);
      }
      if (currentTurnTopics.includes('sleep')) {
        return pickUnique([
          "Tiredness makes everything feel twice as steep. I hear how draining that has been for you lately.",
          "Sleep disruptions are so quietly exhausting. Thank you for expressing that honestly right now."
        ]);
      }
      return pickUnique([
        mirrorSnippet ? `I hear you saying "${mirrorSnippet}". Take all the time you need, there is zero rush to fix or explain anything here.` : "I hear you clearly. Take your time, there is zero rush to explain or fix anything here.",
        "Thank you for sharing that with me. I'm listening with an open and calm presence.",
        "Your feelings are completely valid. Whatever is on your chest, you can speak it freely."
      ]);
    }

    if (mode === 'understand_feelings') {
      // MODE 2 — UNDERSTAND MY FEELINGS: Thoughtful follow-up questions prompting reflection
      if (acknowledgesShift) {
        return pickUnique([
          "I notice you mentioned feeling worn out right after the study pressure. How has your sleep been affecting your focus during the day?",
          "When both assignments and lack of rest pile up, which one feels like it is draining your energy the fastest right now?"
        ]);
      }
      if (currentTurnTopics.includes('sadness')) {
        return pickUnique([
          "When that sadness rises up, has it been feeling like a sudden dip or more like an ongoing exhaustion that hasn't lifted?",
          "If that sadness had a voice, what do you think it is asking for right now—rest, comfort, or someone to truly understand?",
          "Holding sadness inside university classes is so draining. What moment today felt the hardest to get through?"
        ]);
      }
      if (currentTurnTopics.includes('procrastination')) {
        return pickUnique([
          "Procrastination is often our nervous system freezing when a task feels too overwhelming or ambiguous. When you think about getting started, what is the loudest doubt in your head?",
          "Does it feel more like you are physically exhausted, or that the expectations on this task are making you anxious about starting?"
        ]);
      }
      if (currentTurnTopics.includes('grades') || currentTurnTopics.includes('placements')) {
        return pickUnique([
          "When you think about grades or placement outcomes, is the main anxiety about comparing yourself to peers, or worrying about what comes next?",
          "How much does that academic performance expectation feel like internal ambition versus external pressure?",
          "If grades weren't part of the picture for a moment, what would you genuinely enjoy learning or building?"
        ]);
      }
      if (currentTurnTopics.includes('parents')) {
        return pickUnique([
          "When family expectations weigh on you, do you feel like you can communicate your real feelings to them, or do you feel you have to put on a brave face?",
          "What is one thing you wish your family understood about the pressures you're facing in college right now?"
        ]);
      }
      if (currentTurnTopics.includes('social')) {
        return pickUnique([
          "Campus can feel surprisingly lonely even when surrounded by hundreds of classmates. When do you feel that disconnect most strongly?",
          "What does feeling truly supported look like for you when you're going through a tough week?"
        ]);
      }
      if (currentTurnTopics.includes('relationship')) {
        return pickUnique([
          "Heartbreak and relational conflicts are so disorienting during college because academic life keeps moving. How is your energy holding up today?",
          "When personal feelings are shaken like this, what helps you feel a tiny bit grounded?"
        ]);
      }
      if (currentTurnTopics.includes('assignments') && currentTurnTopics.includes('exams')) {
        return pickUnique([
          "Between the assignments and the upcoming exams, which one is creating the most internal friction today?",
          "With both coursework and exams on your plate, does it feel more like a time crunch or mental fatigue?"
        ]);
      }
      if (currentTurnTopics.includes('assignments')) {
        return pickUnique([
          "Is there one specific assignment or deliverable that feels especially heavy right now?",
          "When you look at your pending tasks, what feels like the biggest roadblock to getting started?"
        ]);
      }
      if (currentTurnTopics.includes('exams')) {
        return pickUnique([
          "Exams often bring a mix of pressure and high expectations. What part of the preparation feels most uncertain for you?",
          "How are your energy levels holding up as you get closer to the exam date?"
        ]);
      }
      if (currentTurnTopics.includes('sleep')) {
        return pickUnique([
          "When you lie down at night, does your mind stay active thinking about studies, or is your body having trouble unwinding?",
          "How long has your sleep pattern felt disrupted like this?"
        ]);
      }
      if (currentTurnTopics.includes('stress')) {
        return pickUnique([
          "When that stress rises up, where do you usually feel it most in your body—like in your chest, shoulders, or breathing?",
          "What is one thought that tends to repeat itself when the pressure peaks?"
        ]);
      }

      // Dynamic general inquiry mirroring student's actual words
      return pickUnique([
        mirrorSnippet
          ? `I hear you saying "${mirrorSnippet}". It makes complete sense that you're sitting with that right now. When you notice that feeling, what is the hardest part about it?`
          : "That sounds like a lot to navigate. When you think about that situation, what feels like the hardest part to carry?",
        "How long have you been holding these feelings inside, and does it help having a quiet moment to speak them out loud?",
        "If you could give yourself one kind thing in this exact moment, what do you think your mind or body needs?",
        "Sometimes putting words to our inner thoughts is the hardest step. What would feel like a tiny bit of relief right now?",
        "I'm listening closely to you. What is your mind most worried might happen next?"
      ]);
    }

    // MODE 3 — HELP ME MOVE FORWARD: Practical, micro-actionable next steps
    if (acknowledgesShift) {
      return pickUnique([
        "Let's protect your rest first. Would it help to set a hard cutoff time for studying tonight so your nervous system has time to unwind?",
        "When sleep is short, pushing through long study blocks rarely works. Would a quick 5-minute breather and triaging just one small task help?"
      ]);
    }
    if (currentTurnTopics.includes('sadness')) {
      return pickUnique([
        "When things feel heavy, our only goal should be gentle micro-steps. Would it help to drink a warm glass of water or step outside for 5 minutes of fresh air?",
        "You don't have to solve everything today. What is one kind, non-demanding thing you can do for yourself this evening?"
      ]);
    }
    if (currentTurnTopics.includes('procrastination')) {
      return pickUnique([
        "Let's use the 2-minute rule: pick just one tiny part of your task, work on it for 120 seconds, and give yourself full permission to stop if you want. Would you like to try that?",
        "Removing micro-friction helps a lot. Would it help to close all extra browser tabs and set a 15-minute timer to just outline your thoughts?"
      ]);
    }
    if (currentTurnTopics.includes('grades') || currentTurnTopics.includes('placements')) {
      return pickUnique([
        "Let's ground your focus on what is within your direct control today. Would it help to identify just one specific topic or preparation item for the next 20 minutes?",
        "Remember that college is a marathon, not a sprint. Would taking a quick break from comparison and charting your personal milestones help?"
      ]);
    }
    if (currentTurnTopics.includes('assignments') || currentTurnTopics.includes('exams')) {
      return pickUnique([
        "Let's break those down so you don't have to solve everything at once. Would it help to pick just one small 15-minute piece of an assignment to start today?",
        "When workloads pile up, making a simple 'Top-3' priority list can restore clarity. Would you like to outline your top priority together?",
        "You might benefit from a structured 25-minute study sprint in our Focus Timer with a built-in break. Would you like to try that after this session?"
      ]);
    }
    if (currentTurnTopics.includes('sleep')) {
      return pickUnique([
        "A realistic next step is establishing a 20-minute screen-free wind-down buffer before bed. Would you be open to trying that tonight?",
        "Our Wellness Studio has a gentle Non-Sleep Deep Rest (NSDR) audio exercise that helps calm racing thoughts before sleep. Would you like to bookmark that?"
      ]);
    }
    if (currentTurnTopics.includes('stress')) {
      return pickUnique([
        "Let's reset your autonomic pacing together right now. Would you like to take three slow breaths together, counting in for 4 and out for 6?",
        "A 5-minute break away from your desk can create immediate relief. Would you be willing to step away and drink a glass of water after we finish?"
      ]);
    }

    return pickUnique([
      mirrorSnippet ? `Looking at "${mirrorSnippet}", what is one tiny, achievable step that could make tomorrow 5% easier?` : "Taking things one step at a time is the healthiest approach. What is one tiny, achievable thing you can do for yourself in the next hour?",
      "Would it help to write down what's on your mind in your private encrypted journal, or would you prefer a guided breathing reset?",
      "Let's keep things manageable today. What is one thing you can safely postpone until tomorrow so you have space to breathe?"
    ]);
  };

  // Process Spoken/Input Student Thoughts
  const processStudentInput = (spokenText: string) => {
    if (!spokenText.trim()) return;

    setSessionState('processing');
    const userTurn: ConversationTurn = {
      speaker: 'user',
      text: spokenText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: conversationMode
    };
    const updatedHistory = [...conversationHistory, userTurn];
    setConversationHistory(updatedHistory);
    setTranscriptText('');

    // 1. Immediate Crisis & Tele-MANAS Evaluation Safeguard
    const qLower = spokenText.toLowerCase();
    const isAskingForManasOrHelpline =
      qLower.includes('manas') ||
      qLower.includes('telemanas') ||
      qLower.includes('tele-manas') ||
      qLower.includes('14416') ||
      qLower.includes('kiran') ||
      qLower.includes('helpline') ||
      qLower.includes('help line') ||
      qLower.includes('emergency contact') ||
      qLower.includes('counselor number');

    const crisisKeywords = [
      'kill myself',
      'end my life',
      'suicide',
      'want to die',
      'hang myself',
      'take my life',
      'hurt myself',
      'harm myself',
      'better off dead',
      'crisis'
    ];

    const hasCrisisIntent = crisisKeywords.some((k) => qLower.includes(k));

    if (isAskingForManasOrHelpline || hasCrisisIntent) {
      setIsCrisisDetected(true);
      const teleManasResponse = hasCrisisIntent
        ? "I hear how much pain you are holding right now. You do not have to carry this alone. Please connect with someone who can support you right this minute. Tele-MANAS is available 24/7 at 14416, and the KIRAN mental health helpline is at 1800-599-0019. Please stay safe and reach out to a trusted professional or friend."
        : "Tele-MANAS is India's 24/7 National Mental Health Helpline. You can call toll-free at 14416 or 1800-89-14416 for free, confidential emotional support in over 20 languages. I have shared the direct call, WhatsApp share, and copy card below for you.";

      const aiTurn: ConversationTurn = {
        speaker: 'ai',
        text: teleManasResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: conversationMode
      };
      setConversationHistory((prev) => [...prev, aiTurn]);
      speakAiResponse(teleManasResponse, () => {
        setSessionState('responding');
      });
      return;
    }

    // 2. Natural Conversational Intelligence Synthesis
    setTimeout(() => {
      const aiResponse = generateEmpatheticResponse(spokenText, updatedHistory, conversationMode);

      const aiTurn: ConversationTurn = {
        speaker: 'ai',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mode: conversationMode
      };
      setConversationHistory((prev) => [...prev, aiTurn]);
      speakAiResponse(aiResponse);
    }, 450);
  };

  // Start Voice Session
  const handleStartSession = async () => {
    if (!hasConsented) {
      setShowConsentModal(true);
      return;
    }

    setErrorMessage(null);
    setSessionTimeSeconds(0);
    setConversationHistory([]);
    setIsCrisisDetected(false);
    setShowSessionSummary(false);
    setStructuredSummary(null);
    setSummarySavedStatus(null);
    askedQuestionsRef.current.clear();
    detectedTopicsRef.current.clear();

    // Mode-tailored Initial Greeting
    let initialGreeting =
      "Hello! Welcome to your Feelings Space. How are you feeling today? Is there anything on your mind you would like to talk about?";
    if (conversationMode === 'just_listen') {
      initialGreeting =
        "Hello! I am in Just Listen mode. I'm here to listen quietly without jumping to solutions. What's on your heart today?";
    } else if (conversationMode === 'help_move_forward') {
      initialGreeting =
        "Hello! I am in Help Me Move Forward mode. Tell me what challenges you are facing today, and we can find small, doable steps together.";
    }

    const initialTurn: ConversationTurn = {
      speaker: 'ai',
      text: initialGreeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode: conversationMode
    };
    setConversationHistory([initialTurn]);

    // Initialize audio pipeline on user gesture
    await initAudioPipeline();

    speakAiResponse(initialGreeting);
  };

  // Pause Conversation
  const handlePauseConversation = () => {
    stopAiSpeech();
    stopMicrophone();
    setSessionState('paused');
    sessionStateRef.current = 'paused';
  };

  // Resume Conversation
  const handleResumeConversation = () => {
    setSessionState('listening');
    sessionStateRef.current = 'listening';
    if (!isMutedRef.current) {
      startListening();
    }
  };

  // End Voice Session & Generate Structured Private Summary
  const handleEndSession = () => {
    stopAiSpeech();
    stopAudioPipeline();
    setSessionState('session_completed');
    sessionStateRef.current = 'session_completed';

    // Build Structured Session Summary
    const userTurns = conversationHistory.filter((t) => t.speaker === 'user');
    const topics = Array.from(detectedTopicsRef.current);
    if (topics.length === 0) {
      topics.push('General Emotional Check-in & Self-Reflection');
    }

    const challenges: string[] = [];
    if (userTurns.some((t) => t.text.toLowerCase().includes('exam') || t.text.toLowerCase().includes('test'))) {
      challenges.push('Exam preparation pressure and performance concerns');
    }
    if (userTurns.some((t) => t.text.toLowerCase().includes('assignment') || t.text.toLowerCase().includes('deadline'))) {
      challenges.push('Tight assignment deadlines and multi-task scheduling');
    }
    if (userTurns.some((t) => t.text.toLowerCase().includes('sleep') || t.text.toLowerCase().includes('tired'))) {
      challenges.push('Rest deficit and physical fatigue accumulation');
    }
    if (userTurns.some((t) => t.text.toLowerCase().includes('stress') || t.text.toLowerCase().includes('overwhelm'))) {
      challenges.push('Elevated stress feeling and cognitive overload');
    }
    if (challenges.length === 0) {
      challenges.push('Navigating daily collegiate lifestyle and academic demands');
    }

    const suggestedActions: string[] = [];
    if (conversationMode === 'help_move_forward') {
      suggestedActions.push('Break assignments into single 25-minute Pomodoro study sprints');
      suggestedActions.push('Prioritize a top-1 task to complete before moving to secondary items');
    }
    suggestedActions.push('Engage in 2-3 minutes of diaphragmatic breathing in the Wellness Studio');
    suggestedActions.push('Take a 5-minute screen-free hydration pause to decompress');

    const goals: string[] = [];
    if (topics.some((t) => t.includes('Sleep'))) {
      goals.push('Set a 20-minute screen-free wind-down routine tonight');
    }
    if (topics.some((t) => t.includes('Assignment') || t.includes('Exam'))) {
      goals.push('Focus on one manageable academic task at a time');
    }
    if (goals.length === 0) {
      goals.push('Practice daily self-compassion during busy academic days');
    }

    const summaryObj: StructuredSessionSummary = {
      sessionDuration: formattedTime,
      completedAt: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      mainTopics: topics,
      challengesMentioned: challenges,
      helpfulActionsSuggested: suggestedActions,
      personalGoals: goals,
      encouragingClosing:
        'Speaking your thoughts aloud is a powerful self-regulation practice. Honor your pace, take rest seriously, and remember you do not have to carry everything all at once.'
    };

    setStructuredSummary(summaryObj);
    setShowSessionSummary(true);
  };

  // Save Summary with Explicit Student Consent
  const handleSaveSummary = () => {
    if (!saveSummaryConsent || !structuredSummary) return;

    try {
      const existingRaw = localStorage.getItem('mindora_feelings_space_summaries') || '[]';
      const parsed = JSON.parse(existingRaw);
      parsed.unshift(structuredSummary);
      localStorage.setItem('mindora_feelings_space_summaries', JSON.stringify(parsed.slice(0, 20)));
      setSummarySavedStatus('Saved to your private local reflections');
    } catch {
      setSummarySavedStatus('Saved locally');
    }
  };

  // Confirm Privacy Consent
  const handleConfirmConsent = () => {
    setHasConsented(true);
    localStorage.setItem('mindora_feelings_space_consent', 'true');
    setShowConsentModal(false);
    handleStartSession();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-4 px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-violet-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-700 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Voice AI Listener</span>
            </span>
            <Badge variant="slate">CPU-Only</Badge>
            <Badge variant={micPermission === 'granted' ? 'emerald' : micPermission === 'denied' ? 'rose' : 'slate'}>
              Mic: {micPermission.toUpperCase()}
            </Badge>
            <Badge variant="emerald">Private & Non-Diagnostic</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mindora-darkText tracking-tight">
            Your Feelings Space
          </h1>
          <p className="text-xs sm:text-sm text-mindora-mutedText max-w-2xl mt-1">
            Take a moment. Speak freely. You are in a confidential, non-diagnostic space where you can express yourself without judgment.
          </p>
        </div>

        {/* Session Timer & Privacy Info Button */}
        <div className="flex items-center gap-3">
          <div
            aria-live="polite"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white border border-violet-100 shadow-soft text-xs font-mono font-bold text-violet-900"
          >
            <Clock className="w-4 h-4 text-violet-600" />
            <span>{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowConsentModal(true)}
            className="p-2 rounded-xl text-slate-500 hover:text-violet-700 hover:bg-violet-50 border border-slate-200 transition"
            title="Privacy Information"
            aria-label="View Privacy Information"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Three Selectable Conversation Modes & Voice Accent Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-violet-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-extrabold text-slate-700 px-1 uppercase tracking-wider shrink-0">
            Mode:
          </span>
          <div className="grid grid-cols-3 gap-1.5 w-full md:w-auto">
            {/* Mode 1: Just Listen */}
            <button
              type="button"
              onClick={() => setConversationMode('just_listen')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                conversationMode === 'just_listen'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Ear className="w-3.5 h-3.5" />
              <span>1. Just Listen</span>
            </button>

            {/* Mode 2: Understand My Feelings */}
            <button
              type="button"
              onClick={() => setConversationMode('understand_feelings')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                conversationMode === 'understand_feelings'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>2. Understand</span>
            </button>

            {/* Mode 3: Help Me Move Forward */}
            <button
              type="button"
              onClick={() => setConversationMode('help_move_forward')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                conversationMode === 'help_move_forward'
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3. Guidance</span>
            </button>
          </div>
        </div>

        {/* Accent / Speech Language Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shrink-0 self-end md:self-auto">
          <Globe2 className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          <span className="text-[11px] font-bold text-slate-600">Voice Accent:</span>
          <select
            value={speechLang}
            onChange={(e) => setSpeechLang(e.target.value)}
            className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            aria-label="Select speech recognition and synthesis accent"
          >
            <option value="en-IN">English (India) 🇮🇳</option>
            <option value="en-US">English (US) 🇺🇸</option>
            <option value="en-GB">English (UK) 🇬🇧</option>
            <option value="hi-IN">Hindi / Hinglish 🇮🇳</option>
          </select>
        </div>
      </div>

      {/* 3. Tele-MANAS Shareable Helpline Card & Immediate Crisis Safeguard */}
      {isCrisisDetected && (
        <Card className="p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 border-2 border-rose-300 text-rose-950 animate-shake shadow-md">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <Phone className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                  National Helpline Support (24/7 • Free • Confidential)
                </span>
                <span className="text-xs text-rose-700 font-bold">Tele-MANAS: 14416 / 1800-89-14416</span>
              </div>
              <h4 className="font-extrabold text-base text-rose-950">Tele-MANAS National Mental Health Helpline</h4>
              <p className="text-xs text-rose-800 leading-relaxed">
                You do not have to carry this alone. Tele-MANAS is free, confidential, and available 24/7 across India in over 20 regional languages.
                Toll-free numbers: <strong>14416</strong> or <strong>1800-89-14416</strong>. National KIRAN Helpline: <strong>1800-599-0019</strong>.
              </p>
              
              {/* Direct Actions: Call, WhatsApp Share, Copy Info, All Helplines */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <a
                  href="tel:14416"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call 14416 Now</span>
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    "Tele-MANAS National Mental Health Helpline (India): Call 14416 or 1800-89-14416 (24/7 Toll-Free, Confidential, 20+ Languages). Free support is available right now."
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share via WhatsApp</span>
                </a>
                <button
                  onClick={handleShareTeleManas}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                >
                  {isCopiedManas ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedManas ? 'Copied to Clipboard!' : 'Copy Helpline Info'}</span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('help_support')}
                  className="text-slate-700 border-slate-300"
                >
                  All Helplines
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 4. Central Voice Interaction Pod */}
      <Card className="p-8 sm:p-12 border-violet-100 bg-gradient-to-b from-white via-violet-50/20 to-white shadow-soft relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[440px]">
        {/* Soft Background Wave Glow */}
        <div className="absolute inset-0 bg-radial from-violet-200/20 via-transparent to-transparent pointer-events-none" />

        {/* State A: Welcome & Waiting To Start */}
        {(sessionState === 'welcome' || sessionState === 'waiting_to_start') && (
          <div className="space-y-6 max-w-lg z-10 flex flex-col items-center animate-fade-in">
            {/* Visual Aura Orb */}
            <div className="relative">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-2xl shadow-violet-600/30 flex items-center justify-center text-white transition-transform hover:scale-105 duration-300">
                <Mic className="w-12 h-12 sm:w-16 sm:h-16" />
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-violet-400/40 animate-ping opacity-25" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-mindora-darkText">
                Ready to speak your thoughts?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {conversationMode === 'just_listen'
                  ? 'Mode 1: The AI will listen and validate without pushing tasks or advice.'
                  : conversationMode === 'understand_feelings'
                  ? 'Mode 2: The AI will ask thoughtful questions to help you reflect on your feelings.'
                  : 'Mode 3: The AI will offer practical next steps and achievable micro-activities.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartSession}
                icon={<Play className="w-4 h-4 fill-current" />}
                className="px-8 shadow-lg shadow-violet-600/20"
              >
                Start Conversation
              </Button>
            </div>

            <div className="pt-4 flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero audio retention • Non-diagnostic listener • Parental isolation guaranteed</span>
            </div>
          </div>
        )}

        {/* State B: Active Session (AI Speaking, Listening, Processing, Responding) */}
        {(sessionState === 'ai_speaking' ||
          sessionState === 'listening' ||
          sessionState === 'processing' ||
          sessionState === 'responding') && (
          <div className="space-y-6 max-w-xl z-10 flex flex-col items-center w-full animate-fade-in">
            {/* Dynamic Animated Pulse Sphere & Microphone */}
            <div className="relative flex items-center justify-center my-4">
              {/* Outer Pulsing Waves */}
              <div
                className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center transition-all duration-700 ${
                  sessionState === 'ai_speaking'
                    ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-500 shadow-2xl shadow-indigo-600/40 animate-pulse'
                    : sessionState === 'listening'
                    ? 'bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 shadow-2xl shadow-emerald-600/40 scale-105'
                    : 'bg-gradient-to-tr from-violet-700 to-purple-800 shadow-xl'
                }`}
              >
                {sessionState === 'ai_speaking' ? (
                  <Volume2 className="w-16 h-16 text-white animate-bounce" />
                ) : sessionState === 'listening' ? (
                  <Mic className="w-16 h-16 text-white" />
                ) : (
                  <Sparkles className="w-16 h-16 text-white animate-spin" />
                )}
              </div>

              {/* Surrounding Harmonic Soundwave Rings */}
              {sessionState === 'ai_speaking' && (
                <div className="absolute inset-0 rounded-full border-4 border-violet-400/30 animate-ping opacity-40 pointer-events-none" />
              )}
              {sessionState === 'listening' && (
                <div className="absolute inset-0 rounded-full border-4 border-emerald-400/40 animate-pulse pointer-events-none" />
              )}
            </div>

            {/* Current State Text Indicator */}
            <div className="space-y-2 text-center" aria-live="polite">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors duration-300">
                {sessionState === 'ai_speaking' && (
                  <span className="bg-violet-100 text-violet-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                    Mindora is speaking...
                  </span>
                )}
                {sessionState === 'listening' && (
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Listening... Speak freely
                  </span>
                )}
                {sessionState === 'processing' && (
                  <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-violet-600 animate-spin" />
                    Reflecting on your words...
                  </span>
                )}
                {sessionState === 'responding' && (
                  <span className="bg-violet-50 text-violet-700 px-3 py-1 rounded-full">
                    Grounded Presence
                  </span>
                )}
              </div>

              {/* Realtime Live Speech Feedback */}
              <div className="min-h-[64px] flex items-center justify-center px-4">
                {sessionState === 'listening' && transcriptText && (
                  <div className="space-y-2 max-w-md animate-fade-in text-center">
                    <p className="text-sm sm:text-base font-medium text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-violet-100 shadow-2xs">
                      "{transcriptText}"
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          finalizeStudentTurn(transcriptText);
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Send Thought Now
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          stopMicrophone();
                          setFallbackTextInput(transcriptText);
                          setIsFallbackInput(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
                      >
                        ✏️ Edit Text
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          transcriptAccumulatorRef.current = '';
                          setTranscriptText('');
                        }}
                        className="px-2 py-1 text-slate-400 hover:text-slate-600 text-xs transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}
                {sessionState === 'listening' && !transcriptText && (
                  <p className="text-xs sm:text-sm text-slate-400">
                    Take your time. Speak whenever you are ready.
                  </p>
                )}
                {sessionState === 'ai_speaking' && (
                  <p className="text-sm sm:text-base font-semibold text-mindora-darkText max-w-lg leading-relaxed">
                    "{aiResponseText}"
                  </p>
                )}
              </div>
            </div>

            {/* Real-time Dynamic Audio Visualizer */}
            <div className="w-full max-w-md my-2 flex flex-col items-center">
              {/* 60fps Canvas Visualizer */}
              <canvas
                ref={canvasRef}
                width={360}
                height={64}
                className="w-full max-w-[360px] h-16 rounded-2xl bg-slate-50/80 border border-violet-100 shadow-inner px-2 py-1"
                aria-label="Real-time Voice Activity Waveform"
              />

              {/* Dynamic Responsive Spectrum Bars */}
              <div
                data-testid="audio-waveform-bars"
                className="flex items-center justify-center gap-1.5 h-8 my-2 w-full max-w-xs"
              >
                {audioLevels.map((lvl, idx) => (
                  <span
                    key={idx}
                    style={{
                      height: `${lvl}%`
                    }}
                    className={`w-1 rounded-full transition-all duration-100 ${
                      sessionState === 'ai_speaking'
                        ? 'bg-violet-600'
                        : sessionState === 'listening'
                        ? isVoiceDetected
                          ? 'bg-emerald-500 scale-y-110'
                          : 'bg-emerald-400/60'
                        : sessionState === 'processing'
                        ? 'bg-purple-500 animate-pulse'
                        : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Comprehensive Active Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
              {/* Mute/Unmute Mic */}
              <button
                type="button"
                onClick={() => {
                  const newMuted = !isMuted;
                  setIsMuted(newMuted);
                  isMutedRef.current = newMuted;
                  if (newMuted) stopMicrophone();
                  else startListening();
                }}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 ${
                  isMuted
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                <span>{isMuted ? 'Unmute' : 'Mute Mic'}</span>
              </button>

              {/* Pause Conversation */}
              <button
                type="button"
                onClick={handlePauseConversation}
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Pause Conversation"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>

              {/* Stop AI Speech */}
              {sessionState === 'ai_speaking' && (
                <button
                  type="button"
                  onClick={stopAiSpeech}
                  className="px-3.5 py-2.5 rounded-2xl bg-violet-100 hover:bg-violet-200 text-violet-800 text-xs font-bold transition flex items-center gap-1.5"
                  title="Stop AI Voice"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop Speech</span>
                </button>
              )}

              {/* Test AI Voice Button */}
              {sessionState !== 'ai_speaking' && (
                <button
                  type="button"
                  onClick={() => speakAiResponse("Hello! I can hear you and I am speaking clearly. How can I support you today?")}
                  className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                  title="Test Audio Output"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Test Voice</span>
                </button>
              )}

              {/* Type Instead Toggle */}
              <button
                type="button"
                onClick={() => setIsFallbackInput(!isFallbackInput)}
                className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                title="Type reflection with keyboard"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>{isFallbackInput ? 'Voice Only' : 'Type Instead'}</span>
              </button>

              {/* Replay Last AI Response */}
              {lastAiSpokenTextRef.current && sessionState !== 'ai_speaking' && (
                <button
                  type="button"
                  onClick={handleReplayResponse}
                  className="px-3 py-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                  title="Replay Last AI Response"
                >
                  <Repeat className="w-3.5 h-3.5 text-violet-600" />
                  <span>Replay</span>
                </button>
              )}

              {/* Done Speaking / Manual Trigger */}
              {sessionState === 'listening' && (
                <button
                  type="button"
                  onClick={() => {
                    const text = transcriptAccumulatorRef.current.trim() || transcriptText.trim();
                    if (text) {
                      finalizeStudentTurn(text);
                    } else {
                      stopMicrophone();
                      setSessionState('waiting_to_start');
                      sessionStateRef.current = 'waiting_to_start';
                    }
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{transcriptText ? 'Done Speaking' : 'Pause Listening'}</span>
                </button>
              )}

              {/* End Session Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndSession}
                icon={<Square className="w-3.5 h-3.5 fill-current" />}
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                End Session
              </Button>
            </div>

            {/* Speech Rate & Language Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 pt-1">
              <div className="flex items-center gap-1.5">
                <span>Pace:</span>
                {[0.85, 0.95, 1.1].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                      speechRate === rate
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <span>Voice:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSpeechLang('en-US');
                    speechLangRef.current = 'en-US';
                    localStorage.setItem('mindora_speech_lang', 'en-US');
                    if (recognitionRef.current && sessionState === 'listening') {
                      try {
                        recognitionRef.current.lang = 'en-US';
                      } catch {}
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    speechLang === 'en-US'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Recommended for Windows & Edge"
                >
                  US English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpeechLang('en-IN');
                    speechLangRef.current = 'en-IN';
                    localStorage.setItem('mindora_speech_lang', 'en-IN');
                    if (recognitionRef.current && sessionState === 'listening') {
                      try {
                        recognitionRef.current.lang = 'en-IN';
                      } catch {}
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    speechLang === 'en-IN'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Indian English
                </button>
              </div>

              {isSpeaking && (
                <span className="flex items-center gap-1 text-violet-700 font-semibold ml-1">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                  Speaking
                </span>
              )}
            </div>

            {/* Quick Starter Prompts for immediate test */}
            {sessionState === 'listening' && (
              <div className="w-full max-w-md pt-2 space-y-1.5 text-center animate-fade-in">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Starter Thoughts:
                </span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => finalizeStudentTurn("I am feeling overwhelmed with my exam schedule and coursework.")}
                    className="text-xs px-3 py-1 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/80 font-medium transition cursor-pointer"
                  >
                    💭 Overwhelmed by exams
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeStudentTurn("I haven't been sleeping well and feel constantly exhausted.")}
                    className="text-xs px-3 py-1 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/80 font-medium transition cursor-pointer"
                  >
                    💭 Exhausted & sleepless
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeStudentTurn("I just want a quiet space to vent about my week.")}
                    className="text-xs px-3 py-1 rounded-full bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/80 font-medium transition cursor-pointer"
                  >
                    💭 Just need to vent
                  </button>
                </div>
              </div>
            )}

            {/* Error Notice */}
            {errorMessage && (
              <div className="w-full max-w-md p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center animate-fade-in">
                {errorMessage}
              </div>
            )}

            {/* Peaceful Text Fallback Input */}
            {isFallbackInput && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (fallbackTextInput.trim()) {
                    processStudentInput(fallbackTextInput.trim());
                    setFallbackTextInput('');
                  }
                }}
                className="w-full max-w-md pt-4 flex gap-2"
              >
                <input
                  type="text"
                  value={fallbackTextInput}
                  onChange={(e) => setFallbackTextInput(e.target.value)}
                  placeholder="Type your reflection here if speech is unsupported..."
                  className="flex-1 text-xs bg-white border border-violet-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <Button type="submit" variant="primary" size="sm">
                  Send
                </Button>
              </form>
            )}
          </div>
        )}

        {/* State C: Paused State */}
        {sessionState === 'paused' && (
          <div className="space-y-6 max-w-lg z-10 flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Pause className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-mindora-darkText">
                Conversation Paused
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Take a moment to breathe. Your microphone and session are safely paused.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleResumeConversation}
                icon={<Play className="w-4 h-4 fill-current" />}
              >
                Resume Conversation
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handleEndSession}
                className="text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                End Session
              </Button>
            </div>
          </div>
        )}

        {/* State D: Session Completed */}
        {sessionState === 'session_completed' && (
          <div className="space-y-6 max-w-lg z-10 flex flex-col items-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-mindora-darkText">
                Session Completed Peacefully
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                You took {formattedTime} to pause and reflect on your experiences today.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartSession}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Start New Session
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* State E: Permission Denied */}
        {sessionState === 'permission_denied' && (
          <div className="space-y-4 max-w-md z-10 flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <MicOff className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">Microphone Access Needed</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              To speak freely in your Feelings Space, please grant microphone permissions in your browser. Alternatively, you can use our peaceful text input.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFallbackInput(true);
                  setSessionState('listening');
                }}
              >
                Use Text Reflection
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartSession}
              >
                Retry Microphone
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* 5. Structured Private Session Summary Card (Consent-Gated) */}
      {showSessionSummary && structuredSummary && (
        <Card className="p-6 sm:p-8 border-violet-200 bg-white shadow-soft space-y-5 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-violet-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Private Session Reflection Summary
                </h3>
                <span className="text-[11px] text-slate-500">
                  Duration: {structuredSummary.sessionDuration} • Completed: {structuredSummary.completedAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="emerald">Private & Student-Only</Badge>
              <Badge variant="slate">Non-Diagnostic</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Main Topics */}
            <div className="p-4 rounded-2xl bg-violet-50/60 border border-violet-100 space-y-2">
              <span className="font-extrabold text-violet-900 uppercase tracking-wider block">
                Main Topics Discussed
              </span>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                {structuredSummary.mainTopics.map((top, idx) => (
                  <li key={idx}>{top}</li>
                ))}
              </ul>
            </div>

            {/* Challenges Mentioned */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
              <span className="font-extrabold text-amber-900 uppercase tracking-wider block">
                Challenges Acknowledged
              </span>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                {structuredSummary.challengesMentioned.map((ch, idx) => (
                  <li key={idx}>{ch}</li>
                ))}
              </ul>
            </div>

            {/* Helpful Actions Suggested */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
              <span className="font-extrabold text-emerald-900 uppercase tracking-wider block">
                Helpful Actions Explored
              </span>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                {structuredSummary.helpfulActionsSuggested.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Personal Goals Chosen */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
              <span className="font-extrabold text-indigo-900 uppercase tracking-wider block">
                Personal Goals Chosen
              </span>
              <ul className="space-y-1 text-slate-700 list-disc list-inside">
                {structuredSummary.personalGoals.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Encouraging Closing */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
            "{structuredSummary.encouragingClosing}"
          </div>

          {/* Explicit Consent to Save */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={saveSummaryConsent}
                onChange={(e) => setSaveSummaryConsent(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span>
                I give explicit consent to save this private summary into my local reflection memory. (It will <strong>never</strong> be shared with guardians, used for diagnostic scoring, or sent to external servers).
              </span>
            </label>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveSummary}
                  disabled={!saveSummaryConsent}
                  icon={<Save className="w-3.5 h-3.5" />}
                >
                  Save to My Private Reflections
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSessionSummary(false)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Discard Summary
                </Button>
              </div>

              {summarySavedStatus && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {summarySavedStatus}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* 6. Explicit Privacy Consent Modal */}
      {showConsentModal && (
        <div
          role="dialog"
          aria-label="AI Feelings Space Privacy Safeguards"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-violet-100">
            <div className="flex items-center gap-3 pb-3 border-b border-violet-100">
              <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-mindora-darkText">
                  Feelings Space Privacy Terms
                </h3>
                <span className="text-xs text-slate-500">
                  Strict Non-Diagnostic Emotional Sanctuary
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-violet-50/70 border border-violet-100 space-y-1.5 text-xs">
                <span className="font-extrabold text-violet-900 block">
                  Core Privacy Safeguards:
                </span>
                <ul className="list-disc list-inside space-y-1 text-violet-950">
                  <li><strong>Zero Audio Retention:</strong> Your raw voice is processed transiently in browser memory and is never recorded or uploaded to disk.</li>
                  <li><strong>NOT a Diagnostic Instrument:</strong> Voice is strictly an emotional support listener. It does not calculate a depression score or trigger parent notifications.</li>
                  <li><strong>Parental Isolation:</strong> Your voice reflections are never shared with parents or guardians.</li>
                  <li><strong>Crisis Help:</strong> Immediate hotlines (Tele-MANAS 14416) are shown if self-harm intent is expressed.</li>
                </ul>
              </div>

              <p className="text-xs text-slate-500">
                By entering, you confirm you understand this is an informational wellness support tool for university students and not clinical psychotherapy.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowConsentModal(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmConsent}
              >
                I Understand & Agree
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
