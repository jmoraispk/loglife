"use client";

import RadarChart from "@/components/charts/RadarChart";
import type { RadarDatum } from "@/components/charts/RadarChart";

interface RadarMiniProps {
  data: RadarDatum[];
  size?: number;
}

export default function RadarMini({ data, size = 124 }: RadarMiniProps) {
  return (
    <div className="shrink-0">
      <RadarChart data={data} size={size} levels={4} showLabels={false} showTooltip={false} interactive={false} />
    </div>
  );
}
