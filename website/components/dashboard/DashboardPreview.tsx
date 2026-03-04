"use client";

import AnimatedHeatmap from "./AnimatedHeatmap";
import AnimatedProgressBar from "./AnimatedProgressBar";
import AnimatedActivityList from "./AnimatedActivityList";

type DashboardPreviewProps = {
  activeMappingStep: number;
};

const STEP_COPY = [
  'Highlighting "Morning gym" in your raw input',
  "Mapping it into Health and updating the weekly heatmap",
  'Mapping "5h deep work" into your Work progress',
  'Adding "Dinner with parents" to Activity Logs',
];

export default function DashboardPreview({ activeMappingStep }: DashboardPreviewProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-300">
        How this data updates your dashboard
      </p>

      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-3 py-2">
        <p className="text-[11px] text-violet-200 transition-all duration-500">
          {STEP_COPY[activeMappingStep]}
        </p>
      </div>

      <div className="grid gap-2">
        <AnimatedHeatmap activeMappingStep={activeMappingStep} />
        <AnimatedProgressBar activeMappingStep={activeMappingStep} />
        <AnimatedActivityList activeMappingStep={activeMappingStep} />
      </div>
    </div>
  );
}
