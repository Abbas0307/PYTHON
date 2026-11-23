import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Sparkles, ArrowRight, Gauge } from 'lucide-react';
import { getApiBaseUrl } from '../../config/api';

export interface MotorcycleStressGaugeProps {
  value?: number | null;
  interpretation?: string;
  lastAssessmentDate?: string | null;
  isLoading?: boolean;
  onNavigateToAssessment?: () => void;
  className?: string;
  enableTestingControls?: boolean;
}

export const MotorcycleStressGauge: React.FC<MotorcycleStressGaugeProps> = ({
  value: propValue,
  interpretation: propInterpretation,
  lastAssessmentDate: propLastAssessmentDate,
  isLoading: propLoading = false,
  onNavigateToAssessment,
  className = '',
  enableTestingControls = false
}) => {
  // Check user accessibility preference for reduced motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, []);

  // Internal state for live backend fetching
  const [fetchedValue, setFetchedValue] = useState<number | null>(null);
  const [fetchedInterp, setFetchedInterp] = useState<string>('');
  const [fetchedDate, setFetchedDate] = useState<string | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [stressChange, setStressChange] = useState<number | null>(null);
  const [hasAssessment, setHasAssessment] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Testing override state (for QA verification requirements)
  const [simulatedValue, setSimulatedValue] = useState<number | null>(null);
  const [showDevControls, setShowDevControls] = useState<boolean>(enableTestingControls);

  // Active target value priority: Simulated > Prop > Fetched
  const effectiveLoading = propLoading || isFetching;

  const activeValue: number | null = simulatedValue !== null
    ? simulatedValue
    : propValue !== undefined
    ? propValue
    : fetchedValue;

  const activeInterp: string = propInterpretation || fetchedInterp || (
    activeValue !== null
      ? activeValue >= 90 ? 'Critical Stress Spike'
        : activeValue >= 75 ? 'Elevated Stress Friction'
        : activeValue >= 50 ? 'Moderate Equilibrium'
        : activeValue >= 25 ? 'Balanced Pacing'
        : 'Optimal Restorative State'
      : 'No Assessment Recorded'
  );

  const activeDate: string | null = propLastAssessmentDate !== undefined
    ? propLastAssessmentDate
    : fetchedDate;

  // Geometry Constants
  // Center is (200, 200). Scale sweeps 240 degrees: from -120 deg (value 0, 8 o'clock) to +120 deg (value 100, 4 o'clock).
  // Top dead center (value 50) is at 0 deg (12 o'clock).
  const CX = 200;
  const CY = 200;
  const START_ANGLE = -120; // 0 position in degrees from 12 o'clock
  const SWEEP_ANGLE = 240;  // Total degrees sweep

  // Map 0-100 score to angle [-120, +120]
  const calculateAngle = (val: number | null): number => {
    if (val === null || val === undefined) return START_ANGLE;
    const clamped = Math.max(0, Math.min(100, val));
    return START_ANGLE + (clamped / 100) * SWEEP_ANGLE;
  };

  // Needle angle state with smooth physics transitions
  const [needleAngle, setNeedleAngle] = useState<number>(START_ANGLE);
  const previousValueRef = useRef<number | null>(null);
  const isInitialMount = useRef<boolean>(true);

  // Fetch from authoritative backend API
  const fetchStressData = async () => {
    setIsFetching(true);
    setApiError(null);
    try {
      const token = sessionStorage.getItem('mindora_auth_token') ||
                    localStorage.getItem('mindora_auth_token') ||
                    localStorage.getItem('session_token') || '';

      const res = await fetch(`${getApiBaseUrl()}/api/student/stress-indicator`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'success' && data.data) {
        const payload = data.data;
        if (payload.has_assessment && payload.stress_score !== null) {
          setFetchedValue(payload.stress_score);
          setFetchedInterp(payload.interpretation || 'Balanced Pace');
          setFetchedDate(payload.last_assessment_date || null);
          setPreviousScore(payload.previous_assessment_score !== undefined ? payload.previous_assessment_score : null);
          setStressChange(payload.stress_change !== undefined ? payload.stress_change : null);
          setHasAssessment(true);
        } else {
          setFetchedValue(null);
          setFetchedInterp('No Assessment Recorded');
          setFetchedDate(null);
          setPreviousScore(null);
          setStressChange(null);
          setHasAssessment(false);
        }
      }
    } catch (err: any) {
      setApiError('Unable to sync live stress indicator from server.');
      // If propValue provided, use it gracefully
      if (propValue !== undefined && propValue !== null) {
        setFetchedValue(propValue);
        setHasAssessment(true);
      } else {
        setHasAssessment(false);
      }
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (propValue === undefined) {
      fetchStressData();
    } else {
      setIsFetching(false);
    }

    const handleSync = () => {
      fetchStressData();
    };

    window.addEventListener('mindora:assessment-submitted', handleSync);
    window.addEventListener('mindora:stress-updated', handleSync);

    return () => {
      window.removeEventListener('mindora:assessment-submitted', handleSync);
      window.removeEventListener('mindora:stress-updated', handleSync);
    };
  }, [propValue]);

  // Smooth Needle Animation Effect
  useEffect(() => {
    const targetAngle = calculateAngle(activeValue);

    if (prefersReducedMotion) {
      setNeedleAngle(targetAngle);
      previousValueRef.current = activeValue;
      return;
    }

    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Start needle at resting 0 (-120deg) then sweep smoothly to target value
      setNeedleAngle(START_ANGLE);
      const timer = setTimeout(() => {
        setNeedleAngle(targetAngle);
      }, 80);
      previousValueRef.current = activeValue;
      return () => clearTimeout(timer);
    }

    // When value changes, animate from current needle position to target angle
    if (previousValueRef.current !== activeValue) {
      setNeedleAngle(targetAngle);
      previousValueRef.current = activeValue;
    }
  }, [activeValue, prefersReducedMotion]);

  // Generate Radial Speedometer Ticks (Major & Minor)
  const ticks = useMemo(() => {
    const result = [];
    const TOTAL_STEPS = 50; // every 2 units from 0 to 100

    for (let i = 0; i <= TOTAL_STEPS; i++) {
      const score = i * 2;
      const angle = START_ANGLE + (score / 100) * SWEEP_ANGLE;
      const rad = (angle * Math.PI) / 180;

      const isMajor = score % 20 === 0;   // 0, 20, 40, 60, 80, 100
      const isMedium = score % 10 === 0 && !isMajor; // 10, 30, 50, 70, 90

      const outerR = 158;
      const innerR = isMajor ? 138 : isMedium ? 144 : 150;

      const x1 = CX + innerR * Math.sin(rad);
      const y1 = CY - innerR * Math.cos(rad);
      const x2 = CX + outerR * Math.sin(rad);
      const y2 = CY - outerR * Math.cos(rad);

      // Color coding along motorcycle progression
      let tickColor = 'rgba(255, 255, 255, 0.45)';
      if (isMajor || isMedium) {
        if (score <= 40) tickColor = '#10b981'; // Restorative Emerald
        else if (score <= 70) tickColor = '#a78bfa'; // Mindora Violet
        else if (score < 90) tickColor = '#f59e0b'; // Focused Amber
        else tickColor = '#f43f5e'; // Warning Crimson
      }

      result.push({
        score,
        x1,
        y1,
        x2,
        y2,
        isMajor,
        isMedium,
        strokeWidth: isMajor ? 3.5 : isMedium ? 2.2 : 1.2,
        color: tickColor
      });
    }
    return result;
  }, []);

  // Major Numerical Labels around edge (0, 20, 40, 60, 80, 100)
  const majorLabels = useMemo(() => {
    const values = [0, 20, 40, 60, 80, 100];
    const LABEL_R = 120;

    return values.map((val) => {
      const angle = START_ANGLE + (val / 100) * SWEEP_ANGLE;
      const rad = (angle * Math.PI) / 180;
      const x = CX + LABEL_R * Math.sin(rad);
      const y = CY - LABEL_R * Math.cos(rad);

      let labelColor = '#e2e8f0';
      if (val === 0) labelColor = '#6ee7b7';
      if (val === 100) labelColor = '#fda4af';

      return { val, x, y, color: labelColor };
    });
  }, []);

  // Format Display Value & Empty State
  const isUnassessed = activeValue === null || activeValue === undefined || !hasAssessment;
  const displayValue = isUnassessed ? '--' : Math.round(activeValue);

  // Status Tier Styling
  const getStatusBadgeStyle = () => {
    if (isUnassessed) {
      return {
        bg: 'bg-slate-800 text-slate-300 border-slate-700',
        label: 'No Assessment Recorded'
      };
    }
    if (activeValue >= 90) {
      return {
        bg: 'bg-rose-950/80 text-rose-300 border-rose-700/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        label: activeInterp || 'Critical Stress Threshold'
      };
    }
    if (activeValue >= 75) {
      return {
        bg: 'bg-amber-950/80 text-amber-300 border-amber-700/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
        label: activeInterp || 'Elevated Stress Friction'
      };
    }
    if (activeValue >= 50) {
      return {
        bg: 'bg-violet-950/80 text-violet-300 border-violet-700/60 shadow-[0_0_12px_rgba(167,139,250,0.3)]',
        label: activeInterp || 'Moderate Equilibrium'
      };
    }
    if (activeValue >= 25) {
      return {
        bg: 'bg-blue-950/80 text-blue-300 border-blue-700/60 shadow-[0_0_12px_rgba(96,165,250,0.3)]',
        label: activeInterp || 'Balanced Pacing'
      };
    }
    return {
      bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      label: activeInterp || 'Optimal Restorative State'
    };
  };

  const statusBadge = getStatusBadgeStyle();

  return (
    <div className={`relative flex flex-col items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/90 rounded-3xl border border-violet-900/50 shadow-2xl text-white ${className}`}>
      {/* Top Header Label with Speedometer Icon */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
              <span>Analog Stress Meter</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold normal-case">
                Motorcycle Instrument Cluster
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Real-time collegiate stress indicator scaled from 0 to 100
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSimulatedValue(null);
              fetchStressData();
            }}
            title="Refresh from server"
            disabled={effectiveLoading}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${effectiveLoading ? 'animate-spin text-violet-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* API Notice / Fallback if any */}
      {apiError && (
        <div className="w-full mb-3 px-3.5 py-2 rounded-xl bg-slate-900/90 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Analog Motorcycle Speedometer Gauge */}
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[420px] aspect-square flex items-center justify-center my-2">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-2xl select-none"
          role="img"
          aria-label={`Motorcycle Stress Speedometer Gauge reading ${displayValue} out of 100`}
        >
          <defs>
            {/* Outer Metallic Bezel Gradient */}
            <radialGradient id="outerBezelGrad" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor="#334155" />
              <stop offset="93%" stopColor="#64748b" />
              <stop offset="96%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* Dial Face Dark Carbon/Violet Background */}
            <radialGradient id="dialFaceGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="90%" stopColor="#090d16" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Glowing Accent Arc Gradient */}
            <linearGradient id="scaleProgressionGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="40%" stopColor="#8b5cf6" />
              <stop offset="75%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Needle Gradient */}
            <linearGradient id="needleBodyGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#4338ca" />
              <stop offset="35%" stopColor="#8b5cf6" />
              <stop offset="85%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#ffedd5" />
            </linearGradient>

            {/* Central Pivot Metallic Hub Gradient */}
            <radialGradient id="hubCapGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="45%" stopColor="#475569" />
              <stop offset="80%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            {/* Glass Curvature Reflection */}
            <linearGradient id="glassReflectionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="40%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Needle Drop Shadow */}
            <filter id="needleShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.7" />
            </filter>

            {/* Soft Luminescence Filter */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Outer Metallic Bezel Ring */}
          <circle
            cx={CX}
            cy={CY}
            r="192"
            fill="url(#outerBezelGrad)"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* 2. Concentric Bezel Ring with Violet Accent Inlay */}
          <circle
            cx={CX}
            cy={CY}
            r="184"
            fill="none"
            stroke="#0f172a"
            strokeWidth="5"
          />
          <circle
            cx={CX}
            cy={CY}
            r="180"
            fill="none"
            stroke="rgba(139, 92, 246, 0.4)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* 3. Deep Instrument Dial Face */}
          <circle
            cx={CX}
            cy={CY}
            r="178"
            fill="url(#dialFaceGrad)"
          />

          {/* 4. Speedometer Scale Arc Track (240-degree sweep from -120 to +120) */}
          {/* Background Groove Track */}
          <path
            d="M 70.1 275 A 150 150 0 1 1 329.9 275"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Color Progression Gradient Track */}
          <path
            d="M 70.1 275 A 150 150 0 1 1 329.9 275"
            fill="none"
            stroke="url(#scaleProgressionGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#softGlow)"
            opacity="0.85"
          />

          {/* 5. Radial Speedometer Ticks (Major & Minor) */}
          <g id="speedometer-ticks">
            {ticks.map((t, idx) => (
              <line
                key={`tick-${idx}`}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.color}
                strokeWidth={t.strokeWidth}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* 6. Major Speedometer Labels (0, 20, 40, 60, 80, 100) */}
          <g id="speedometer-labels">
            {majorLabels.map((lbl) => (
              <text
                key={`label-${lbl.val}`}
                x={lbl.x}
                y={lbl.y}
                fill={lbl.color}
                fontSize={lbl.val === 0 || lbl.val === 100 ? '16' : '15'}
                fontWeight="900"
                fontFamily="ui-monospace, monospace"
                textAnchor="middle"
                dominantBaseline="central"
                className="select-none font-black tracking-tight"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                {lbl.val}
              </text>
            ))}
          </g>

          {/* 7. Inner Tachometer Atmosphere Rings */}
          <circle
            cx={CX}
            cy={CY}
            r="94"
            fill="none"
            stroke="rgba(139, 92, 246, 0.15)"
            strokeWidth="1"
            strokeDasharray="6 3"
          />

          {/* 8. Rotating Motorcycle Speedometer Needle */}
          <g
            id="motorcycle-needle"
            filter="url(#needleShadow)"
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${CX}px ${CY}px`,
              transition: prefersReducedMotion
                ? 'none'
                : 'transform 1.4s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            {/* Extended Rear Counter-Balance Tail */}
            <polygon
              points="196,200 204,200 206,232 200,240 194,232"
              fill="#334155"
              stroke="#0f172a"
              strokeWidth="1"
            />
            <circle cx="200" cy="232" r="3" fill="#64748b" />

            {/* Main Tapered Sports Needle Body */}
            <polygon
              points="196,200 198.5,52 200,46 201.5,52 204,200"
              fill="url(#needleBodyGrad)"
              stroke="#0f172a"
              strokeWidth="0.8"
            />

            {/* High-Visibility Luminous Center Spine */}
            <line
              x1="200"
              y1="195"
              x2="200"
              y2="48"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Razor-Sharp Needle Tip Glow */}
            <polygon
              points="198,62 200,45 202,62"
              fill="#f43f5e"
              filter="url(#softGlow)"
            />
          </g>

          {/* 9. Central Pivot Hub / Cap */}
          {/* Metallic Outer Pivot Ring */}
          <circle
            cx={CX}
            cy={CY}
            r="26"
            fill="url(#hubCapGrad)"
            stroke="#0f172a"
            strokeWidth="2"
            filter="url(#needleShadow)"
          />
          {/* Inner Matte Dome Cap */}
          <circle
            cx={CX}
            cy={CY}
            r="18"
            fill="#090d16"
            stroke="rgba(139, 92, 246, 0.5)"
            strokeWidth="1.5"
          />
          {/* Center Specular Highlight Pin */}
          <circle
            cx="195"
            cy="195"
            r="2.5"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* 10. Center/Lower Digital Readout Pod */}
          {/* Pod Background Plate */}
          <rect
            x="125"
            y="266"
            width="150"
            height="52"
            rx="14"
            fill="rgba(3, 7, 18, 0.85)"
            stroke="rgba(139, 92, 246, 0.4)"
            strokeWidth="1.5"
            filter="url(#needleShadow)"
          />

          {/* Digital Value */}
          <text
            x="192"
            y="292"
            fill="#ffffff"
            fontSize="30"
            fontWeight="900"
            fontFamily="ui-monospace, monospace"
            textAnchor="middle"
            dominantBaseline="central"
            className="tracking-tight"
          >
            {displayValue}
          </text>
          <text
            x="240"
            y="288"
            fill="#a78bfa"
            fontSize="10"
            fontWeight="800"
            fontFamily="sans-serif"
            textAnchor="start"
            dominantBaseline="central"
          >
            / 100
          </text>

          {/* Label: STRESS LEVEL */}
          <text
            x="200"
            y="308"
            fill="#c4b5fd"
            fontSize="9.5"
            fontWeight="900"
            fontFamily="sans-serif"
            letterSpacing="2.5"
            textAnchor="middle"
            dominantBaseline="central"
            className="uppercase font-mono"
          >
            STRESS LEVEL
          </text>

          {/* 11. Subtle Glass Curved Reflection Highlight (Top Half) */}
          <path
            d="M 60 140 C 90 70, 310 70, 340 140 C 290 100, 110 100, 60 140 Z"
            fill="url(#glassReflectionGrad)"
            pointerEvents="none"
          />
        </svg>
      </div>

      {/* Indicator Status & Approved Interpretation */}
      <div className="w-full flex flex-col items-center text-center mt-3 space-y-2">
        <div className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all duration-300 flex items-center gap-2 ${statusBadge.bg}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{statusBadge.label}</span>
        </div>

        {/* Previous Assessment Comparison Delta */}
        {stressChange !== null && stressChange !== undefined && (
          <div className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/70 shadow-xs">
            <span className={stressChange < 0 ? "text-emerald-400 font-bold" : stressChange > 0 ? "text-amber-400 font-bold" : "text-slate-300 font-bold"}>
              {stressChange < 0 ? `↓ ${Math.abs(stressChange).toFixed(1)}%` : stressChange > 0 ? `↑ ${stressChange.toFixed(1)}%` : '0.0%'}
            </span>
            <span className="text-slate-300 text-[11px]">
              vs previous check-in {previousScore !== null ? `(${previousScore}%)` : ''}
            </span>
          </div>
        )}

        {/* Last Assessment Date & Non-diagnostic reassurance */}
        <div className="text-xs text-slate-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 pt-1">
          {activeDate ? (
            <span>
              Last assessed: <strong className="text-slate-200">{new Date(activeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
          ) : (
            <span>No assessment timestamp recorded</span>
          )}
          <span>•</span>
          <span className="text-violet-400 font-semibold">Motorcycle Dynamic Dial</span>
        </div>

        {/* Empty State Action when unassessed */}
        {isUnassessed && onNavigateToAssessment && (
          <button
            onClick={onNavigateToAssessment}
            className="mt-3 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Complete Assessment to Calibrate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Non-Diagnostic Clinical Safety Notice */}
        <div className="w-full pt-4 mt-2 border-t border-slate-800/80 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed text-left">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            This analog stress meter visualizes collegiate academic pacing and lifestyle friction. It is strictly educational and is <strong>never a psychiatric diagnosis or clinical risk assessment</strong>.
          </span>
        </div>
      </div>

      {/* Testing Controls Panel (QA Verification for Section 7) */}
      <div className="w-full mt-4 pt-3 border-t border-slate-800/60">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDevControls(!showDevControls)}
            className="text-[10px] font-mono text-slate-500 hover:text-violet-400 transition-colors uppercase tracking-wider flex items-center gap-1.5"
          >
            <span>[QA Speedometer Testing Panel]</span>
            <span>{showDevControls ? '▲ Hide' : '▼ Show'}</span>
          </button>
          {simulatedValue !== null && (
            <button
              type="button"
              onClick={() => setSimulatedValue(null)}
              className="text-[10px] text-amber-400 hover:underline"
            >
              Reset to Live API
            </button>
          )}
        </div>

        {showDevControls && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-violet-900/40 space-y-2.5 animate-fade-in">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Required Test Values (Section 7)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 10, 25, 40, 60, 74, 75, 90, 100].map((testVal) => (
                <button
                  key={testVal}
                  type="button"
                  onClick={() => setSimulatedValue(testVal)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    simulatedValue === testVal
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {testVal}
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pt-1">
              Required Test Transitions
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSimulatedValue(74);
                  setTimeout(() => setSimulatedValue(75), 800);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-800/60 text-amber-300 text-xs font-mono hover:bg-amber-900 transition-colors"
              >
                74 → 75 (Level 1 Alert)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulatedValue(75);
                  setTimeout(() => setSimulatedValue(90), 800);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs font-mono hover:bg-rose-900 transition-colors"
              >
                75 → 90 (Level 2 Alert)
              </button>
              <button
                type="button"
                onClick={() => {
                  setSimulatedValue(90);
                  setTimeout(() => setSimulatedValue(40), 800);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-mono hover:bg-emerald-900 transition-colors"
              >
                90 → 40 (Recovery)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedValue(null)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs font-mono hover:text-white transition-colors"
              >
                Simulate Empty / Missing API
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
