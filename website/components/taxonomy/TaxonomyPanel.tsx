"use client";

import { useMemo, useState } from "react";
import type { TagNode } from "@/data/mock/tags";
import { flattenTree } from "@/utils/tags";

interface TaxonomyPanelProps {
  tree: TagNode[];
  counts: Record<string, number>;
  onAddTag: (input: { name: string; parentId: string | null }) => void;
}

function TreeNode({
  node,
  counts,
  level,
}: {
  node: TagNode;
  counts: Record<string, number>;
  level: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div
        className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-slate-200 hover:bg-slate-800/40 transition-colors"
        style={{ paddingLeft: `${level * 10 + 8}px` }}
      >
        <button
          type="button"
          className="flex min-w-0 cursor-pointer items-center gap-2 text-left"
          onClick={() => hasChildren && setOpen((value) => !value)}
          title={node.name}
        >
          <span className="w-3 text-slate-500">{hasChildren ? (open ? "−" : "+") : "•"}</span>
          <span className="truncate">{node.name}</span>
        </button>
        <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
          {counts[node.id] ?? 0}
        </span>
      </div>
      {hasChildren && open && (
        <ul className="space-y-1">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} counts={counts} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TaxonomyPanel({ tree, counts, onAddTag }: TaxonomyPanelProps) {
  const [newTagName, setNewTagName] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const flatTags = useMemo(() => flattenTree(tree), [tree]);

  return (
    <aside className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Tag Taxonomy</h3>
        <p className="mt-1 text-xs text-slate-400">
          Browse nested tags and usage across goals and timeline items.
        </p>
      </div>

      <ul className="space-y-1 max-h-80 overflow-y-auto pr-1">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} counts={counts} level={0} />
        ))}
      </ul>

      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 space-y-2">
        <p className="text-xs font-medium text-slate-200">Add new tag</p>
        <input
          value={newTagName}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="e.g. Mobility"
          className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <select
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">No parent (top-level)</option>
          {flatTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="w-full cursor-pointer rounded-md border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/20 transition-colors"
          onClick={() => {
            const trimmed = newTagName.trim();
            if (!trimmed) return;
            onAddTag({ name: trimmed, parentId: parentId || null });
            setNewTagName("");
          }}
        >
          Create tag
        </button>
      </div>
    </aside>
  );
}
