"use client";

import { useMemo, useState } from "react";
import type { TagNode } from "@/data/mock/tags";
import { flattenTree } from "@/utils/tags";

interface TagSelectorProps {
  tree: TagNode[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
  buttonLabel?: string;
}

export default function TagSelector({
  tree,
  selectedTagIds,
  onChange,
  buttonLabel = "Edit Tags",
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const flatTags = useMemo(() => flattenTree(tree), [tree]);
  const selectedSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  const grouped = useMemo(
    () =>
      tree
        .map((parent) => ({
          parent,
          children: parent.children.filter((child) =>
            child.name.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter(
          (group) =>
            group.parent.name.toLowerCase().includes(search.toLowerCase()) ||
            group.children.length > 0
        ),
    [tree, search]
  );

  const toggleTag = (tagId: string) => {
    if (selectedSet.has(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
      return;
    }
    onChange([...selectedTagIds, tagId]);
  };

  return (
    <div className="relative z-50">
      <button
        type="button"
        className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-700/80 transition-colors"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="absolute right-0 z-[120] mt-2 w-[min(92vw,24rem)] rounded-xl border border-slate-700/80 bg-slate-900/95 p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tags..."
              className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="button"
              className="cursor-pointer text-xs text-slate-400 hover:text-slate-200"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
            {grouped.map(({ parent, children }) => (
              <div key={parent.id}>
                <p className="text-[11px] uppercase tracking-wide text-slate-400 mb-1.5">
                  {parent.name}
                </p>
                <div className="space-y-1">
                  {[parent, ...children].map((node) => (
                    <label
                      key={node.id}
                      className="flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/40 px-2 py-1.5 text-xs text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSet.has(node.id)}
                        onChange={() => toggleTag(node.id)}
                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900"
                      />
                      <span className={node.id === parent.id ? "font-medium" : ""}>
                        {node.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="text-xs text-slate-500">No tags match your search.</p>
            )}
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            {selectedTagIds.length} selected • {flatTags.length} total tags
          </p>
        </div>
      )}
    </div>
  );
}
