import React, { useState } from 'react';
import { MetricDefinition, WeeklyCheckIn, formatWeekLabel } from '../../contracts/trendsContract';
import { MetricDelta } from '../../engines/trendEngine';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendChartProps {
  metric: MetricDefinition;
  checkIns: WeeklyCheckIn[];
  delta?: MetricDelta;
  average: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  metric,
  checkIns,
  delta,
  average
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState<boolean>(false);

  const n = checkIns.length;

  if (n === 0) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          {metric.label}
        </span>
        <p className="text-xs text-slate-400">
          No check-ins recorded yet for {metric.label.toLowerCase()}.
        </p>
      </div>
    );
  }

  // SVG Chart Geometry
  const width = 500;
  const height = 180;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  // Y mapping: rating 1 to 5
  const getY = (val: number) => {
    const clamped = Math.max(1, Math.min(5, val));
    // Rating 5 is at top (padTop), rating 1 is at bottom (padTop + chartHeight)
    return padTop + chartHeight - ((clamped - 1) / 4) * chartHeight;
  };

  // X mapping: evenly spaced check-ins
  const getX = (index: number) => {
    if (n === 1) return padLeft + chartWidth / 2;
    return padLeft + (index / (n - 1)) * chartWidth;
  };

  const points = checkIns.map((c, i) => ({
    x: getX(i),
    y: getY(c[metric.key]),
    value: c[metric.key],
    week: c.weekIdentifier,
    date: c.date
  }));

  const pathD = points.length === 1
    ? ''
    : points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');

  const areaD = points.length === 1
    ? ''
    : `${pathD} L ${points[points.length - 1].x} ${padTop + chartHeight} L ${points[0].x} ${padTop + chartHeight} Z`;

  // Accessible description for screen readers
  const accessibleSummary = `${metric.label} trend over ${n} check-in${n > 1 ? 's' : ''}: ` +
    points.map((p) => `${formatWeekLabel(p.week)} was rated ${p.value} out of 5`).join(', ') +
    `. Current average is ${average} out of 5.`;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-mindora-border/80 shadow-2xs space-y-3">
      {/* Metric Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: metric.accentColor }}
              aria-hidden="true"
            />
            <h4 className="font-extrabold text-sm sm:text-base text-mindora-darkText">
              {metric.label}
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Avg: {average}/5
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
            {metric.description}
          </p>
        </div>

        {delta && delta.delta !== null && (
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            {delta.direction === 'improved' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <TrendingUp className="w-3 h-3" aria-hidden="true" />
                {delta.delta > 0 ? `+${delta.delta}` : delta.delta} vs last week
              </span>
            )}
            {delta.direction === 'declined' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <TrendingDown className="w-3 h-3" aria-hidden="true" />
                {delta.delta > 0 ? `+${delta.delta}` : delta.delta} vs last week
              </span>
            )}
            {delta.direction === 'steady' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                <Minus className="w-3 h-3" aria-hidden="true" />
                Steady
              </span>
            )}
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label={accessibleSummary}
        >
          <defs>
            <linearGradient id={`gradient-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.accentColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={metric.accentColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines for levels 1 to 5 */}
          {[1, 2, 3, 4, 5].map((lvl) => {
            const y = getY(lvl);
            return (
              <g key={lvl}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  fill="#94A3B8"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          {areaD && (
            <path
              d={areaD}
              fill={`url(#gradient-${metric.key})`}
            />
          )}

          {/* Trend Polyline */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={metric.accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Check-In Point Markers */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            const isLatest = idx === n - 1;

            return (
              <g key={idx} className="cursor-pointer">
                {/* Invisible larger hit target */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onFocus={() => setHoveredIndex(idx)}
                  onBlur={() => setHoveredIndex(null)}
                  tabIndex={0}
                  aria-label={`${formatWeekLabel(p.week)}: rated ${p.value} out of 5 on ${p.date}`}
                />

                {/* Outer ring for latest point or hovered */}
                {(isHovered || isLatest) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? 8 : 6}
                    fill={metric.accentColor}
                    fillOpacity="0.3"
                    className="transition-all duration-200"
                  />
                )}

                {/* White border circle */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#FFFFFF"
                  stroke={metric.accentColor}
                  strokeWidth="2.5"
                />

                {/* X-axis week label */}
                <text
                  x={p.x}
                  y={height - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isLatest ? '700' : '500'}
                  fill={isLatest ? '#475569' : '#94A3B8'}
                >
                  {p.week.replace(/^(\d{4})-W/, 'W')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900 text-white rounded-xl shadow-lg text-xs space-y-0.5 animate-fadeIn"
            style={{
              left: `${(points[hoveredIndex].x / width) * 100}%`,
              top: `${(points[hoveredIndex].y / height) * 100}%`
            }}
          >
            <div className="font-bold flex items-center justify-between gap-3 text-[11px]">
              <span>{formatWeekLabel(points[hoveredIndex].week)}</span>
              <span className="text-violet-300 font-extrabold">{points[hoveredIndex].value}/5</span>
            </div>
            <div className="text-[10px] text-slate-300">
              {metric.ratingDescriptions[points[hoveredIndex].value]}
            </div>
            <div className="text-[9px] text-slate-400">
              Logged: {points[hoveredIndex].date}
            </div>
          </div>
        )}
      </div>

      {/* Accessible Table View Toggle for Screen Readers & Clarity */}
      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" aria-hidden="true" />
          <span>Scale: 1 ({metric.minLabel}) to 5 ({metric.maxLabel})</span>
        </span>
        <button
          onClick={() => setShowTable((prev) => !prev)}
          className="text-mindora-primary font-bold hover:underline focus-visible:ring-2 focus-visible:ring-mindora-primary rounded px-1"
          aria-expanded={showTable}
        >
          {showTable ? 'Hide data table' : 'View data table'}
        </button>
      </div>

      {showTable && (
        <div className="pt-2 border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                <th className="py-1 px-2">Week</th>
                <th className="py-1 px-2">Date</th>
                <th className="py-1 px-2 text-right">Rating (1–5)</th>
                <th className="py-1 px-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5 px-2 font-bold text-slate-700">{formatWeekLabel(c.weekIdentifier)}</td>
                  <td className="py-1.5 px-2 text-slate-500">{c.date}</td>
                  <td className="py-1.5 px-2 text-right font-black text-mindora-primary">{c[metric.key]}/5</td>
                  <td className="py-1.5 px-2 text-slate-600 text-[11px]">{metric.ratingDescriptions[c[metric.key]]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
