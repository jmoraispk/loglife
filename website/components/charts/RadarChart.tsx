"use client";

import { useId, useMemo, useRef, useState, type MouseEvent } from "react";

export type RadarDatum = {
  axis: string;
  value: number;
};

type ChartPoint = {
  axis: string;
  value: number;
  x: number;
  y: number;
  angle: number;
};

type TooltipState = {
  visible: boolean;
  label: string;
  value: number;
  x: number;
  y: number;
};

export interface RadarChartProps {
  data: RadarDatum[];
  size?: number;
  levels?: number;
  maxValue?: number;
  showLabels?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  onAxisClick?: (axis: string) => void;
}

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toPoint(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function getPolygonString(points: Array<{ x: number; y: number }>): string {
  return points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

export default function RadarChart({
  data,
  size = 300,
  levels = 5,
  maxValue = 100,
  showLabels = true,
  showTooltip = true,
  interactive = true,
  onAxisClick,
}: RadarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    label: "",
    value: 0,
    x: 0,
    y: 0,
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const gradientId = useId();

  const safeData = useMemo(
    () =>
      data.map((entry) => ({
        axis: entry.axis,
        value: clampValue(entry.value, 0, maxValue),
      })),
    [data, maxValue]
  );

  const hasEnoughData = safeData.length >= 3;
  const center = size / 2;
  const radius = size * 0.35;

  const chart = useMemo(() => {
    const total = safeData.length;
    if (total < 3) {
      return {
        rings: [] as string[],
        axisLines: [] as Array<{ axis: string; x: number; y: number }>,
        points: [] as ChartPoint[],
        polygon: "",
      };
    }

    // Each axis is distributed evenly around a circle, starting from top (-90deg).
    const basePoints = safeData.map((entry, index) => {
      const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
      const outer = toPoint(center, center, radius, angle);
      return { axis: entry.axis, value: entry.value, angle, outer };
    });

    // Scale each metric to chart radius so real values can plug in directly later.
    const points = basePoints.map((entry) => {
      const scaled = (entry.value / maxValue) * radius;
      const point = toPoint(center, center, scaled, entry.angle);
      return {
        axis: entry.axis,
        value: entry.value,
        angle: entry.angle,
        x: point.x,
        y: point.y,
      };
    });

    const rings = Array.from({ length: levels }, (_, i) => {
      const ringRadius = (radius * (i + 1)) / levels;
      const ringPoints = basePoints.map((entry) => toPoint(center, center, ringRadius, entry.angle));
      return getPolygonString(ringPoints);
    });

    return {
      rings,
      axisLines: basePoints.map((entry) => ({ axis: entry.axis, x: entry.outer.x, y: entry.outer.y })),
      points,
      polygon: getPolygonString(points),
    };
  }, [center, levels, maxValue, radius, safeData]);

  const handleHover = (event: MouseEvent, label: string, value: number) => {
    if (!showTooltip) return;
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setTooltip({
      visible: true,
      label,
      value,
      x: event.clientX - bounds.left + 12,
      y: event.clientY - bounds.top - 12,
    });
  };

  const handleLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  if (!hasEnoughData) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 p-5 text-center text-xs text-slate-400">
        Add at least 3 axes to render radar chart.
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-2xl border border-white/10 bg-slate-950/30 p-3 animate-fade-in-up-1"
      onMouseLeave={handleLeave}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto block overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#a78bfa" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.22" />
          </linearGradient>
        </defs>

        {chart.rings.map((ring, idx) => (
          <polygon
            key={`ring-${idx}`}
            points={ring}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={idx === chart.rings.length - 1 ? 1.25 : 1}
          />
        ))}

        {chart.axisLines.map((line) => (
          <g key={`axis-${line.axis}`}>
            <line x1={center} y1={center} x2={line.x} y2={line.y} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <line
              x1={center}
              y1={center}
              x2={line.x}
              y2={line.y}
              stroke="transparent"
              strokeWidth="12"
              className={interactive ? "cursor-pointer" : ""}
              onClick={() => {
                if (interactive) onAxisClick?.(line.axis);
              }}
              onMouseMove={(event) => {
                if (!interactive) return;
                const value = safeData.find((entry) => entry.axis === line.axis)?.value ?? 0;
                handleHover(event, line.axis, value);
              }}
            />
          </g>
        ))}

        <polygon
          points={chart.polygon}
          fill={`url(#${gradientId})`}
          stroke="#60a5fa"
          strokeWidth="2"
          style={{
            transformOrigin: `${center}px ${center}px`,
          }}
        />

        {chart.points.map((point) => (
          <circle
            key={`point-${point.axis}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill="#0f172a"
            stroke="#22d3ee"
            strokeWidth={2}
            className={interactive ? "cursor-pointer" : ""}
            onClick={() => {
              if (interactive) onAxisClick?.(point.axis);
            }}
            onMouseMove={(event) => {
              if (!interactive) return;
              handleHover(event, point.axis, point.value);
            }}
          />
        ))}

        {showLabels &&
          chart.axisLines.map((line, idx) => {
            const angle = chart.points[idx]?.angle ?? 0;
            const labelPoint = toPoint(center, center, radius + 22, angle);
            return (
              <text
                key={`label-${line.axis}`}
                x={labelPoint.x}
                y={labelPoint.y}
                fill="rgba(203,213,225,0.9)"
                fontSize="11"
                textAnchor="middle"
                dominantBaseline="middle"
                className="select-none"
              >
                {line.axis}
              </text>
            );
          })}
      </svg>

      {showTooltip && (
        <div
          className={`pointer-events-none absolute z-20 rounded-md border border-slate-700/70 bg-slate-900/95 px-2.5 py-1.5 text-xs text-slate-100 shadow-lg shadow-black/40 transition-opacity duration-150 ${
            tooltip.visible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.label} — {tooltip.value}%
        </div>
      )}
    </div>
  );
}
