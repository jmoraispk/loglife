"use client";

type AnimatedActivityListProps = {
  activeMappingStep: number;
};

const BASE_ITEMS = [
  "Reviewed sprint plan",
  "Quick walk after lunch",
];

export default function AnimatedActivityList({ activeMappingStep }: AnimatedActivityListProps) {
  const showNewItem = activeMappingStep >= 3;

  return (
    <div className="rounded-xl border border-slate-800/70 bg-slate-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">Activity Logs</p>
        <span className="text-[10px] text-amber-400">Live</span>
      </div>

      <div className="space-y-1.5">
        {BASE_ITEMS.map((item) => (
          <div
            key={item}
            className="rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] text-slate-400"
          >
            {item}
          </div>
        ))}

        <div
          className={`rounded-md border px-2 py-1 text-[10px] transition-all duration-500 ease-out ${
            showNewItem
              ? "border-amber-400/30 bg-amber-400/10 text-amber-200 opacity-100 translate-y-0 scale-100"
              : "border-slate-800 bg-slate-900/80 text-slate-600 opacity-0 translate-y-2 scale-95"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          Dinner with parents
        </div>
      </div>
    </div>
  );
}
