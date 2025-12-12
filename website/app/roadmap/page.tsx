export const metadata = { title: "Roadmap — LogLife", description: "What we're building now and next." };

const lanes = [
  { name: "Now",  items: ["WhatsApp flow polish", "Export/Delete UX", "Weekly focus + habit boosts", "GitHub hooks for web & server deploys"] },
  { name: "Next", items: ["Telegram integration", "Query improvements", "Better correlations view"] },
  { name: "Later",items: ["iMessage", "Web dashboard", "Shared accountability (opt-in)"] },
];

export default function RoadmapPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-slate-900">Roadmap</h1>
        <p className="mt-2 text-slate-600">Public, living roadmap—tell us what to build next.</p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {lanes.map((lane) => (
            <div key={lane.name} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-emerald-700">{lane.name}</div>
              <ul className="mt-3 space-y-2 text-slate-700">
                {lane.items.map((it) => (<li key={it}>• {it}</li>))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
