"use client";

import RadarChart, { type RadarDatum } from "@/components/charts/RadarChart";

interface GoalRadarPanelProps {
  data: RadarDatum[];
}

export default function GoalRadarPanel({ data }: GoalRadarPanelProps) {
  return (
    <RadarChart
      data={data}
      size={360}
      levels={5}
      maxValue={100}
      showLabels
      onAxisClick={(axis) => {
        console.log(`[Radar axis] ${axis}`);
      }}
    />
  );
}
