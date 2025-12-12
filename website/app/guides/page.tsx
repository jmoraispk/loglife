export const metadata = { title: "Guides — LogLife", description: "Definitions that make change easier to think about." };

const defs = [
  { term: "Addiction", def: "A learned pattern that gives short-term relief but harms long-term goals and is hard to stop." },
  { term: "Habit", def: "A behavior your brain runs on autopilot in response to a cue." },
  { term: "Trigger (cue)", def: "A signal that precedes a behavior and pulls it into motion." },
  { term: "Craving", def: "The urge between cue and action that seeks relief or reward." },
  { term: "Routine", def: "The action you perform after a cue and craving." },
  { term: "Reward", def: "The outcome that teaches your brain whether to repeat a behavior." },
  { term: "Friction", def: "Anything that makes a behavior harder—decrease for good, increase for bad." },
  { term: "Environment design", def: "Arrange surroundings to make good actions easy and bad ones inconvenient." },
  { term: "Keystone habit", def: "One behavior that cascades into many other improvements." },
  { term: "Streak", def: "Consecutive days you’ve done a behavior; a simple momentum metric." },
  { term: "Pattern", def: "A repeated relationship in your data (e.g., late bedtime → fewer AM workouts)." },
  { term: "Query", def: "A natural-language question you ask your own log to get stats." },
  { term: "Minimum viable log", def: "The smallest daily note that counts as ‘done’ (e.g., 15–30s voice)." },
  { term: "Habit rating", def: "A quick non-binary score of how it went (1–4 or 🟩🟨🟧🟥)." },
  { term: "Weekly focus", def: "One keystone habit emphasized for the next 7 days." },
  { term: "Precommit (gentle)", def: "A friendly promise to future you; no guilt." },
  { term: "Recovery", def: "How you respond after a slip: analyze, adjust, continue." },
  { term: "Dopamine", def: "A neurotransmitter that encodes motivation/learning by signaling expected rewards." },
  { term: "‘Dopamine poisoning’", def: "Colloquial shorthand for overstimulation loops that hijack attention via repeated high-reward cues." },
  { term: "Autoplay loop", def: "Design that serves the next item automatically to keep you engaged." },
];

export default function GuidesPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-slate-900">Guides: Definitions</h1>
        <p className="mt-2 text-slate-600">One-line explanations so thinking and talking about change gets easier.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {defs.map((d) => (
            <div key={d.term} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-emerald-700">{d.term}</div>
              <p className="mt-1 text-sm text-slate-700">{d.def}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">Notes: “Dopamine poisoning” is informal shorthand, not a clinical diagnosis.</p>
      </section>
    </main>
  );
}
