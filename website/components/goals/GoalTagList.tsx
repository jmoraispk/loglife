"use client";

import type { TagNode } from "@/data/mock/tags";
import { getTagById } from "@/utils/tags";
import TagPill from "@/components/tags/TagPill";

interface GoalTagListProps {
  tagIds: string[];
  tree: TagNode[];
  max?: number;
  onTagClick?: (tagId: string) => void;
}

export default function GoalTagList({
  tagIds,
  tree,
  max = 3,
  onTagClick,
}: GoalTagListProps) {
  const visible = tagIds.slice(0, max);
  const overflow = Math.max(0, tagIds.length - max);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tagId) => {
        const tag = getTagById(tagId, tree);
        if (!tag) return null;
        return (
          <TagPill
            key={tag.id}
            label={tag.name}
            color={tag.color}
            onClick={onTagClick ? () => onTagClick(tag.id) : undefined}
          />
        );
      })}
      {overflow > 0 && (
        <span className="rounded-full border border-slate-700/80 bg-slate-800/70 px-2 py-1 text-[10px] text-slate-300">
          +{overflow}
        </span>
      )}
    </div>
  );
}
