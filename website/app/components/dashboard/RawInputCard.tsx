// ─── RawInputCard ─────────────────────────────────────────────────────────────
// Step 1 of the AI pipeline — the raw text message from the user

const MOCK_MESSAGE =
  "Had a great day. Went to the gym in the morning, worked 5 hours on the project proposal, and had dinner with my parents.";

export default function RawInputCard() {
  return (
    <div className="flex-1 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      {/* Step label */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0 select-none">
          1
        </span>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          Raw Input
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-4">
        {/* Source row */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-3.5 h-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-300">Journal · WhatsApp</p>
            <p className="text-[10px] text-slate-600">Today · 21:03</p>
          </div>
        </div>

        {/* Message bubble */}
        <div className="bg-[#25D366]/5 border border-[#25D366]/10 rounded-xl rounded-tl-none px-4 py-3.5">
          <p className="text-sm text-slate-300 leading-relaxed">
            &ldquo;{MOCK_MESSAGE}&rdquo;
          </p>
        </div>

        {/* Metadata chips */}
        <div className="flex items-center gap-2 flex-wrap mt-auto">
          <span className="text-[10px] font-medium text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-md">
            unstructured text
          </span>
          <span className="text-[10px] font-medium text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-md">
            3 activities detected
          </span>
        </div>
      </div>
    </div>
  );
}
