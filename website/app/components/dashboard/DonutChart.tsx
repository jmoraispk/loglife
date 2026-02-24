"use client";

import { useState } from "react";

export interface CategoryData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: CategoryData[];
  size?: number;
  strokeWidth?: number;
}

const SEGMENT_GAP = 4;

export default function DonutChart({ data, size = 216, strokeWidth = 20 }: DonutChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const segments = data.reduce<Array<CategoryData & { dashLength: number; rotation: number; percent: number }>>(
    (acc, item) => {
      const percent = item.value / total;
      const dashLength = Math.max(0, percent * circumference - SEGMENT_GAP);
      const prevAngle = acc.length > 0 ? acc[acc.length - 1].rotation + acc[acc.length - 1].percent * 360 : -90;
      acc.push({ ...item, dashLength, rotation: prevAngle, percent });
      return acc;
    },
    []
  );

  const activeSegment = hovered ? segments.find((s) => s.label === hovered) : null;

  return (
    <div className="flex items-center gap-8">
      <div className="relative flex-shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) => (
            <circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={hovered === seg.label ? strokeWidth + 5 : strokeWidth}
              strokeDasharray={`${seg.dashLength} ${circumference}`}
              strokeDashoffset={0}
              transform={`rotate(${seg.rotation} ${center} ${center})`}
              className="transition-all duration-200 cursor-pointer"
              style={{
                opacity: hovered && hovered !== seg.label ? 0.25 : 1,
                filter:
                  hovered === seg.label
                    ? `drop-shadow(0 0 8px ${seg.color}99)`
                    : "none",
              }}
              onMouseEnter={() => setHovered(seg.label)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          {activeSegment ? (
            <>
              <span
                className="text-3xl font-bold tabular-nums transition-colors duration-150"
                style={{ color: activeSegment.color }}
              >
                {activeSegment.value}%
              </span>
              <span className="text-xs text-slate-400 mt-1">{activeSegment.label}</span>
            </>
          ) : (
            <>
              <span className="text-xl font-bold text-white">Today</span>
              <span className="text-xs text-slate-500 mt-1">{data.length} areas</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-5 min-w-[152px]">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="cursor-pointer group"
            onMouseEnter={() => setHovered(seg.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-transform duration-150 group-hover:scale-150"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors duration-150 font-medium">
                  {seg.label}
                </span>
              </div>
              <span
                className="text-sm font-bold tabular-nums transition-colors duration-150"
                style={{ color: hovered === seg.label ? seg.color : "#f8fafc" }}
              >
                {seg.value}%
              </span>
            </div>
            {/* Mini progress bar */}
            <div className="h-[3px] rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${seg.value}%`,
                  backgroundColor: seg.color,
                  opacity: hovered && hovered !== seg.label ? 0.25 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
