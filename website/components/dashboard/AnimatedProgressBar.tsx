"use client";

type AnimatedProgressBarProps = {
  activeMappingStep: number;
};

export default function AnimatedProgressBar({ activeMappingStep }: AnimatedProgressBarProps) {
  const value = activeMappingStep >= 2 ? 50 : 0;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Work Progress</p>
        <span className="text-[10px] text-blue-400">{value}%</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800/80 border border-slate-700/60">
        <div
          className="h-full rounded-full bg-blue-400/80 transition-all duration-700 ease-out"
          style={{ width: `${value}%`, transitionDelay: "300ms" }}
        />
      </div>

      <p className="mt-2 text-[10px] text-slate-500">&ldquo;5h deep work&rdquo; mapped to today&apos;s work target</p>
    </div>
  );
}
