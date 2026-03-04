"use client";

type AnimatedHeatmapProps = {
  activeMappingStep: number;
};

const CELLS = 14;
const ACTIVE_INDICES = [1, 2, 4, 5, 8, 10, 11];

export default function AnimatedHeatmap({ activeMappingStep }: AnimatedHeatmapProps) {
  const isActive = activeMappingStep >= 1;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Health Heatmap</p>
        <span className="text-[10px] text-emerald-400">Weekly</span>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: CELLS }).map((_, index) => {
          const shouldLight = isActive && ACTIVE_INDICES.includes(index);

          return (
            <div
              key={index}
              className={`h-3 rounded-sm border transition-all duration-500 ease-out ${
                shouldLight
                  ? "bg-emerald-400/70 border-emerald-300/60 scale-105"
                  : "bg-slate-800/80 border-slate-700/60"
              }`}
              style={{ transitionDelay: `${(index % 7) * 70}ms` }}
            />
          );
        })}
      </div>
    </div>
  );
}
