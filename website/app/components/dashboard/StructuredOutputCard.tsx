// ─── Mock JSON output ─────────────────────────────────────────────────────────

const MOCK_JSON = `{
  "activities": [
    { "text": "Morning gym",         "category": "Health"        },
    { "text": "5h deep work",        "category": "Work",
      "duration": "5h"                                           },
    { "text": "Dinner with parents", "category": "Relationships" }
  ],
  "summary": {
    "health": 30,
    "work": 50,
    "relationships": 20
  }
}`;

// ─── Simple JSON syntax highlighter (no library) ──────────────────────────────

function syntaxHighlight(json: string): string {
  return (
    json
      // Keys: "key":
      .replace(/"([^"]+)"(\s*:)/g, '<span style="color:#7dd3fc">"$1"</span>$2')
      // String values: : "value"
      .replace(/:\s*"([^"]+)"/g, ': <span style="color:#86efac">"$1"</span>')
      // Numbers: : 30
      .replace(/:\s*(\d+)/g, ': <span style="color:#fcd34d">$1</span>')
      // Braces and brackets
      .replace(/[{}\[\]]/g, '<span style="color:#94a3b8">$&</span>')
  );
}

// ─── StructuredOutputCard ─────────────────────────────────────────────────────

export default function StructuredOutputCard() {
  return (
    <div className="flex-1 flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: "0.55s" }}>
      {/* Step label */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-emerald-900/50 border border-emerald-700/40 text-[10px] font-bold text-emerald-400 flex items-center justify-center flex-shrink-0 select-none">
          3
        </span>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
          Structured Output
        </span>
      </div>

      {/* Card */}
      <div className="flex-1 bg-slate-950/70 border border-emerald-900/25 rounded-2xl p-5 overflow-hidden flex flex-col">
        {/* Fake code-editor chrome */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
          </div>
          <span className="text-[10px] font-mono text-slate-600">output.json</span>
        </div>

        {/* Highlighted JSON */}
        <pre
          className="text-[11.5px] font-mono leading-[1.85] text-slate-400 overflow-x-auto flex-1"
          dangerouslySetInnerHTML={{ __html: syntaxHighlight(MOCK_JSON) }}
        />
      </div>
    </div>
  );
}
