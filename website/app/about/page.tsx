export const metadata = {
  title: "About — LogLife",
  description: "Values, data pledge, and commitments.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">About</h1>
        <p className="mt-4 text-slate-700 dark:text-slate-300">
          LogLife helps you put attention where you intended—without more time in apps.
          It’s a simple, chat-native way to record, reflect, and track.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-slate-900 dark:text-slate-100">What we stand for</h2>
        <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-300">
          <li>• <strong>Convenience.</strong> Chat-native, right at your fingertips.</li>
          <li>• <strong>Minimal & simple.</strong> Capture → move on. No dashboards to babysit.</li>
          <li>• <strong>Non-addictive by design.</strong> No hooks designed to keep you staring at a screen.</li>
          <li>• <strong>Voice-first.</strong> More human than typing; lets you move while you reflect.</li>
          <li>• <strong>Use biology right.</strong> Dopamine should signal <em>progress</em>, not trap you in loops. We highlight wins.</li>
          <li>• <strong>Self-discovery over prescriptions.</strong> We ask evidence-based questions; you decide.</li>
          <li>• <strong>Speed & automation.</strong> Short feedback loops; we automate everything we can so you get fast help.</li>
          <li>• <strong>Honesty & transparency.</strong> Open-source long-term, clear docs, and visible status where possible.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-slate-900 dark:text-slate-100">Data Pledge</h2>
        <div className="mt-3 rounded-2xl border border-emerald-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li>• <strong>No ads. No selling data.</strong></li>
            <li>• <strong>Service-only use.</strong> Your data is used only to provide LogLife’s features—nothing else.</li>
            <li>• <strong>Raw audio is discarded.</strong> We transcribe your entry, then drop the audio. Transcripts are stored encrypted.</li>
            <li>• <strong>No model training on personal entries.</strong> Ever. There is no opt-in toggle; it’s by design.</li>
            <li>• <strong>Private by default.</strong> Entries aren’t reviewed by humans unless you explicitly request support.</li>
            <li>• <strong>Encryption in transit & at rest.</strong> Access is tightly limited and audited.</li>
            <li>• <strong>Delete anytime—fast.</strong> Send <code className="font-mono">delete all</code> or <code className="font-mono">cancel account</code>; we erase within ~1 minute and send a confirmation.</li>
            <li>• <strong>Export anytime.</strong> You can export your data whenever you want.</li>
          </ul>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            We’ll publish storage-region details in a short technical note.
          </p>
        </div>

        <h2 className="mt-10 text-2xl font-semibold text-slate-900 dark:text-slate-100">Commitments</h2>
        <ul className="mt-3 space-y-2 text-slate-700 dark:text-slate-300">
          <li>• <strong>Minimize app time.</strong> Capture quickly; live your day.</li>
          <li>• <strong>Fast support.</strong> Issues acknowledged instantly in chat with a trackable link; WhatsApp updates as humans pick it up.</li>
          <li>• <strong>Your data stays yours.</strong> Own it; export/delete anytime.</li>
          <li>• <strong>We listen.</strong> Public roadmap + feature requests; we ship what helps.</li>
        </ul>

        <div className="mt-10 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p><strong>Founder’s note (tiny):</strong> if you start using LogLife, I’ll likely reach out personally to check in and hear feedback. The goal is simple: help you make the changes you care about.</p>
        </div>
      </section>
    </main>
  );
}
