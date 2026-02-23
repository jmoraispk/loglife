import { CATEGORY_CONFIG, LogCategory } from "./ActivityItem";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassificationSegment {
  text: string;
  category: LogCategory;
}

interface ClassificationExample {
  id: string;
  rawInput: string;
  segments: ClassificationSegment[];
}

// ─── Mock classification examples ─────────────────────────────────────────────

const MOCK_CLASSIFICATIONS: ClassificationExample[] = [
  {
    id: "1",
    rawInput: "Had lunch with my parents and went for a run after",
    segments: [
      { text: "lunch with my parents", category: "Relationships" },
      { text: "went for a run",        category: "Health"        },
    ],
  },
  {
    id: "2",
    rawInput: "Deep work session all morning, then called Sarah",
    segments: [
      { text: "Deep work session", category: "Work"          },
      { text: "called Sarah",      category: "Relationships" },
    ],
  },
  {
    id: "3",
    rawInput: "Morning gym, team standup, reading before sleep",
    segments: [
      { text: "Morning gym",       category: "Health" },
      { text: "team standup",      category: "Work"   },
      { text: "reading before sleep", category: "Health" },
    ],
  },
];

// ─── Highlighted text renderer ────────────────────────────────────────────────

function HighlightedText({
  raw,
  segments,
}: {
  raw: string;
  segments: ClassificationSegment[];
}) {
  const parts: { text: string; category: LogCategory | null }[] = [];
  let remaining = raw;

  for (const seg of segments) {
    const idx = remaining.indexOf(seg.text);
    if (idx === -1) continue;
    if (idx > 0) parts.push({ text: remaining.slice(0, idx), category: null });
    parts.push({ text: seg.text, category: seg.category });
    remaining = remaining.slice(idx + seg.text.length);
  }
  if (remaining.length > 0) parts.push({ text: remaining, category: null });

  return (
    <p className="text-sm text-slate-300 leading-relaxed italic">
      &ldquo;
      {parts.map((part, i) =>
        part.category ? (
          <mark
            key={i}
            className={`rounded-sm px-0.5 mx-px ${CATEGORY_CONFIG[part.category].highlight}`}
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
      &rdquo;
    </p>
  );
}

// ─── ClassificationPanel ──────────────────────────────────────────────────────

export default function ClassificationPanel() {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-5">
        Data Classification
      </p>

      <div className="space-y-3">
        {MOCK_CLASSIFICATIONS.map((ex) => (
          <div
            key={ex.id}
            className="bg-slate-950/50 border border-slate-800/40 rounded-2xl p-5 space-y-3
              hover:border-slate-700/50 transition-colors duration-150"
          >
            {/* Input bubble */}
            <div className="flex items-start gap-2.5">
              {/* WhatsApp-style avatar dot */}
              <div className="w-5 h-5 rounded-full bg-[#25D366]/15 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-2.5 h-2.5 text-[#25D366]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <HighlightedText raw={ex.rawInput} segments={ex.segments} />
            </div>

            {/* Arrow + "classified as" label */}
            <div className="flex items-center gap-1.5 pl-7">
              <svg
                className="w-3 h-3 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
              <span className="text-[11px] text-slate-600 uppercase tracking-wide">
                classified as
              </span>
            </div>

            {/* Extracted category tags */}
            <div className="flex flex-wrap gap-2 pl-7">
              {ex.segments.map((seg, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    CATEGORY_CONFIG[seg.category].badge
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_CONFIG[seg.category].color }}
                  />
                  {seg.category}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
