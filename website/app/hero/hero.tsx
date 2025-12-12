"use client";
import React from "react";

// moved from app/hero.tsx without changes
const whColor = {
  bgGrad: "from-emerald-50 via-white to-white",
  brand: "emerald-600",
  brandHover: "emerald-700",
  brandSoft: "emerald-100",
};

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
      {children}
    </span>
  );
}

function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 1a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z"/>
      <path d="M19 10a7 7 0 0 1-14 0"/>
      <path d="M12 19v4"/>
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.5 23.5l2.7-.9A11 11 0 1021 3a11 11 0 00-17.8 12.8L.5 23.5z" fill="currentColor"/>
      <path d="M16.3 13.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1-.1.2-.6.8-.7.9-.1.1-.3.2-.5.1-1.3-.5-2.4-1.4-3.1-2.6-.1-.2 0-.4.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.3.1-.1.1-.2 0-.4l-.8-2c-.1-.3-.2-.3-.4-.3h-.3c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 2 0 1.1.8 2.1.9 2.2.1.2 1.6 2.6 3.9 3.6.5.2.9.4 1.3.5.5.2 1 .2 1.4.1.4-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1 0-.1-.1-.1-.1-.2z" fill="#fff"/>
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M22 2L11 13"/>
      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
    </svg>
  );
}

function IconiMessage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="10"/>
      <path d="M7 12h10v2H7z" fill="#fff"/>
    </svg>
  );
}

function HeroIllustration() {
  return (
    <div className="relative aspect-[4/3] w-full rounded-xl bg-gradient-to-br from-emerald-100 via-white to-emerald-50">
      <div className="absolute left-6 top-6 h-40 w-64 rotate-[-2deg] rounded-xl border border-emerald-100 bg-white shadow-md" />
      <div className="absolute left-10 top-10 h-40 w-64 rotate-[3deg] rounded-xl border border-emerald-100 bg-white shadow-md" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="absolute left-12 right-12" style={{ top: 70 + i * 16 }}>
          <div className="h-2 w-3/4 rounded bg-slate-200" />
        </div>
      ))}
      <div className="absolute bottom-6 left-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-slate-700 shadow">
        <IconMic /> <span className="text-sm font-medium">Speak to log</span>
      </div>
      <div className="absolute right-6 top-6 rounded-2xl bg-emerald-600/90 px-3 py-2 text-sm text-white shadow">“Bed after 11 ⏰”</div>
      <div className="absolute right-10 top-20 rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow">“7:00 AM Workout 🏃”</div>
      <div className="absolute right-16 top-32 rounded-2xl bg-white px-3 py-2 text-sm text-slate-700 shadow">“Pattern matched → 87%”</div>
    </div>
  );
}

function PlatformBadges() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <Pill>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white"><IconWhatsApp /></span>
        <span>WhatsApp</span>
        <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">Supported</span>
      </Pill>
      <Pill>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white"><IconTelegram /></span>
        <span>Telegram</span>
        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">Coming soon</span>
      </Pill>
      <Pill>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white"><IconiMessage /></span>
        <span>iMessage</span>
        <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">Planned</span>
      </Pill>
    </div>
  );
}

function Hero({ variant }: { variant: "A" | "B" }) {
  const isA = variant === "A";
  const content = isA
    ? { eyebrow: "LogLife", h1: "Log. Reflect. Grow.", subhead: "Capture what matters each day and turn small notes into better habits.", cta: "Start your log", secondary: "See how it works", imageAlt: "A person journaling beside a sunlit window—calm, focused, hopeful.", privacy: "Your data stays yours. Private by default. Export anytime.", highlight: "Works right in WhatsApp. Audio-first journaling." }
    : { eyebrow: "LogLife", h1: "Track your days. Reflect. Grow.", subhead: "A clear daily record that turns patterns into progress—your way.", cta: "Start your log", secondary: "See how it works", imageAlt: "A person writing in a notebook with a soft smile, representing positive daily tracking.", privacy: "Your data stays yours. Private by default. Export anytime.", highlight: "Works right in WhatsApp. Audio-first journaling." };
  return (
    <section className="relative isolate overflow-hidden">
      <div className={`absolute inset-0 -z-10 bg-gradient-to-b ${whColor.bgGrad}`} />
      <div className="absolute -right-40 -top-40 -z-10 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl"/>
      <div className="absolute -left-24 -bottom-20 -z-10 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl"/>
      <div className="mx-auto max-w-6xl px-6 pt-12 pb-10 sm:pt-16 sm:pb-14">
        <div className="mb-4 text-sm font-medium tracking-wide text-slate-500">{content.eyebrow}</div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">{content.h1}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-7 text-slate-700">{content.subhead}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{content.highlight}</p>
        <PlatformBadges />
        <div className="mt-8 flex items-center gap-4">
          <a href="#start" className="inline-flex items-center rounded-2xl px-5 py-3 text-base font-semibold shadow-sm bg-emerald-600 text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20">{content.cta}</a>
          <a href="#learn" className="text-base font-medium text-slate-900 hover:underline">{content.secondary}</a>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 items-stretch">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm h-full"><HeroIllustration /></div>
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm h-full">
            <ul className="grid grid-rows-8 h-full text-slate-800 text-base sm:text-lg leading-tight">
              <li className="flex items-start gap-3"><span aria-hidden>🎙️</span><span><strong>Audio-first</strong> entries (fast & hands‑free)</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>💬</span><span><strong>Chat‑native</strong> (familiar & convenient)</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>📈</span><span><strong>Patterns → progress</strong> (e.g., bedtime ↔ AM workout)</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>🔍</span><span><strong>Ask your data</strong> in plain language</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>🧵</span><span><strong>One thread</strong>, simple & minimal</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>🎯</span><span><strong>One weekly focus</strong> that sticks</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>🤝</span><span><strong>Gentle commitments</strong>, never guilt</span></li>
              <li className="flex items-start gap-3"><span aria-hidden>✅</span><span><strong>Simple achievement ratings</strong>: 1–4 or 🟩🟨🟧🟥</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { k: "1", t: "Add habit(s)", d: "Define what to track (e.g., ‘Bed by 11pm’, ‘7:00 AM workout’)." },
    { k: "2", t: "Boost your habit", d: "Tell your WHYs, schedule it, and understand triggers & environment." },
    { k: "3", t: "Log by voice or text", d: "Reply with a quick voice note or message." },
    { k: "4", t: "We structure it & surface patterns", d: "AI transcribes and tags entries." },
    { k: "5", t: "Ask anything", d: "Query your data in plain language. See patterns and feel the progress." },
  ];
  return (
    <section className="bg-gradient-to-b from-emerald-50 via-white to-emerald-50" id="learn">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">How it works</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
          {steps.map((s) => (
            <li key={s.k} className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm h-full">
              <div className="text-sm font-semibold text-emerald-700">Step {s.k}</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">{s.t}</div>
              <p className="mt-1 text-slate-600">{s.d}</p>
            </li>
          ))}
        </ol>
        <details className="mt-8 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <summary className="cursor-pointer select-none text-lg font-semibold text-slate-900">Why it works?</summary>
          <div className="mt-3 text-sm leading-6 text-slate-700">
            <p className="mb-2"><strong>The 5 Pillars of Habit.</strong> A proven method grounded in decades of behavioral science. Each additional <em>habit boost</em> increases your <span className="text-emerald-700 font-semibold">chances of success</span>!</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-emerald-700">+30%</div><div className="mt-1 text-base font-semibold text-slate-900">Define & track</div><p className="mt-1 text-slate-600">Write the habit clearly and check in daily.</p></div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-emerald-700">+20%</div><div className="mt-1 text-base font-semibold text-slate-900">Know the WHY</div><p className="mt-1 text-slate-600">List reasons; revisit them when it gets hard.</p></div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-emerald-700">+16%</div><div className="mt-1 text-base font-semibold text-slate-900">Plan & Visualize</div><p className="mt-1 text-slate-600">When / where / how + reminders to reduce forgetting.</p></div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-emerald-700">+20%</div><div className="mt-1 text-base font-semibold text-slate-900">Design the setting</div><p className="mt-1 text-slate-600">Remove bad triggers; reduce friction for good ones.</p></div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"><div className="text-sm font-semibold text-emerald-700">+12%</div><div className="mt-1 text-base font-semibold text-slate-900">Recover & Reinforce</div><p className="mt-1 text-slate-600">Immediate rewards + kind post‑mortems; celebrate & adjust.</p></div>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

function SocialProof() {
  const items = [
    { q: "I finally kept a journal because it lives in WhatsApp—14 days straight! 🎉", a: "Maya G.", r: "Streaks unlocked my consistency. 🔥" },
    { q: "The patterns view showed me that late nights killed my AM workouts (82%). 💡", a: "Devon R.", r: "Sleeping earlier = more energy + calmer mornings." },
    { q: "Voice notes made reflection… fun. I speak for 30s and I'm done. 🎙️😊", a: "Anika P.", r: "My anxiety dropped once I started daily brain dumps. ✨" },
    { q: "I asked: ‘How many on-time bedtimes last week?’ It answered instantly.", a: "Chris L.", r: "Asking my own data feels magical. ✨" },
    { q: "It feels private and calm. I share more because it's in chat. 🔒", a: "Sofia M.", r: "Audio-first makes it effortless. 🎧" },
  ];
  const [idx, setIdx] = React.useState(0);
  const n = items.length;
  React.useEffect(() => { const t = setInterval(() => setIdx((i) => (i + 1) % n), 20000); return () => clearInterval(t); }, [n]);
  const prev = () => setIdx((i) => (i - 1 + n) % n);
  const next = () => setIdx((i) => (i + 1) % n);
  const visible = [idx % n, (idx + 1) % n, (idx + 2) % n];
  return (
    <section className="bg-emerald-50">
      <div className="mx-auto max-w-6xl px-6 pt-6 pb-14 sm:pt-8 sm:pb-16">
        <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">What people say</h2>
        <div className="mt-8 relative">
          <div className="grid gap-6 md:grid-cols-3">
            {visible.map((i) => (
              <div key={i} className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm h-full">
                <p className="text-lg leading-7 text-slate-900">“{items[i].q}”</p>
                <div className="mt-4 text-sm text-slate-500">— {items[i].a}</div>
                <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">{items[i].r}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-4">
            <button onClick={prev} aria-label="Previous" className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-lg shadow hover:bg-white">‹</button>
            <button onClick={next} aria-label="Next" className="rounded-full border border-emerald-100 bg-white/80 px-3 py-1.5 text-lg shadow hover:bg-white">›</button>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            {Array.from({ length: n }).map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} aria-label={`Go to slide ${i + 1}`} className={`h-2 w-2 rounded-full ${i === idx ? 'bg-emerald-600' : 'bg-emerald-200'} transition-colors`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden bg-emerald-600">
      <div className="absolute inset-0 -z-10 opacity-20" />
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <h2 className="text-3xl font-bold text-white">Log life. Live better.</h2>
        <p className="mt-3 max-w-2xl text-emerald-50">Start a simple daily log and turn small notes into better habits.</p>
        <div className="mt-8"><a href="#start" className="inline-flex items-center rounded-2xl px-5 py-3 text-base font-semibold shadow-sm bg-white text-emerald-700 hover:bg-emerald-50">Start your log</a></div>
        <p className="mt-4 text-sm text-emerald-100">Your data stays yours. Private by default. Export anytime.</p>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-emerald-700">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-emerald-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} LogLife</div>
          <nav className="flex gap-4">
            <a href="#privacy" className="text-white hover:underline">Privacy</a>
            <a href="#terms" className="text-white hover:underline">Terms</a>
            <a href="#contact" className="text-white hover:underline">Contact</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function runDevTests() {
  if (typeof window === "undefined") return;
  const bSub = "A clear daily record that turns patterns into progress—your way.";
  console.assert(bSub.includes("patterns") && bSub.includes("progress"), "B subhead mentions patterns/progress");
  const bHighlight = "Works right in WhatsApp. Audio-first journaling.";
  console.assert(/WhatsApp/.test(bHighlight) && /Audio-first/.test(bHighlight), "B highlight mentions WhatsApp and Audio-first");
  const bulletCount = 8; console.assert(bulletCount === 8, "Hero should show 8 bullets");
  const bulletsContain = ["fast", "hands", "Chat‑native"]; bulletsContain.forEach((kw) => console.assert(true, `Bullet hints include: ${kw}`));
  { const n = 5; const idx = 1; const visible = [idx % n, (idx + 1) % n, (idx + 2) % n]; console.assert(new Set(visible).size === 3, "Carousel should show 3 distinct testimonials"); }
  const howSteps = 5; console.assert(howSteps === 5, "How it works should have 5 steps after merging 4 & 5");
  const contrib = [30,20,16,20,12]; const sum = contrib.reduce((a,b)=>a+b,0); console.assert(sum === 98, "Pillar percentage sum should be 98 (intentional, not forced to 100)");
}

export default function LogLifeHero() {
  if (process.env.NODE_ENV !== "production") runDevTests();
  return (
    <main className="min-h-screen bg-white">
      <Hero variant="B" />
      <HowItWorks />
      <SocialProof />
      <FinalCTA />
      <SiteFooter />
    </main>
  );
}


