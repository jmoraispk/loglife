import { CATEGORY_STYLES, MOCK_CLASSIFICATION_EXAMPLES } from "./mockData";

export default function ClassificationPanel() {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Data Classification</p>
        <p className="text-sm text-slate-400 mt-1">How AI parses raw messages into meaningful categories.</p>
      </div>

      {MOCK_CLASSIFICATION_EXAMPLES.map((example) => (
        <details
          key={example.id}
          className="group bg-slate-900/55 border border-slate-800/60 rounded-xl p-4 open:border-slate-700/80 transition-colors"
        >
          <summary className="list-none cursor-pointer flex items-center justify-between gap-3">
            <p className="text-sm text-slate-200 line-clamp-2">&ldquo;{example.rawMessage}&rdquo;</p>
            <span className="text-xs text-slate-500 group-open:text-slate-400">Expand</span>
          </summary>

          <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Raw Message</p>
              <p className="text-sm text-slate-300 leading-relaxed">{example.rawMessage}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">Extracted Categories</p>
              <div className="flex flex-wrap gap-2">
                {example.extractedCategories.map((category) => (
                  <span key={`${example.id}-${category}`} className={`text-xs font-medium px-2 py-0.5 rounded-md ${CATEGORY_STYLES[category]}`}>
                    {category}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Classification Notes</p>
              <p className="text-sm text-slate-400">{example.notes}</p>
            </div>
          </div>
        </details>
      ))}
    </section>
  );
}
