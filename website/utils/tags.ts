import type { Goal, Tag, TimelineItem } from "@/data/mock/goals-with-tags";
import type { TagNode } from "@/data/mock/tags";

export interface TagUsageCounts {
  byTagId: Record<string, number>;
}

export function flattenTree(tree: TagNode[], parentId: string | null = null): Tag[] {
  return tree.flatMap((node) => [
    { id: node.id, name: node.name, color: node.color, parentId },
    ...flattenTree(node.children, node.id),
  ]);
}

export function findChildren(tagId: string, tree: TagNode[]): TagNode[] {
  for (const node of tree) {
    if (node.id === tagId) return node.children;
    const inChildren = findChildren(tagId, node.children);
    if (inChildren.length > 0) return inChildren;
  }
  return [];
}

export function getTagById(tagId: string, tree: TagNode[]): Tag | null {
  const all = flattenTree(tree);
  return all.find((tag) => tag.id === tagId) ?? null;
}

export function applyTagFilter<T extends { tagIds: string[] }>(
  items: T[],
  selectedTagIds: string[]
): T[] {
  if (selectedTagIds.length === 0) return items;
  const selected = new Set(selectedTagIds);
  return items.filter((item) => item.tagIds.some((tagId) => selected.has(tagId)));
}

export function computeTagUsageCounts(goals: Goal[]): TagUsageCounts {
  const byTagId: Record<string, number> = {};
  for (const goal of goals) {
    for (const tagId of new Set(goal.tagIds)) {
      byTagId[tagId] = (byTagId[tagId] ?? 0) + 1;
    }
    for (const item of goal.timeline) {
      for (const tagId of new Set(item.tagIds)) {
        byTagId[tagId] = (byTagId[tagId] ?? 0) + 1;
      }
    }
  }
  return { byTagId };
}

function createTagId(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Adds a new tag to the taxonomy tree under a parent.
 */
export function addTag(
  tree: TagNode[],
  input: { name: string; parentId: string | null; color?: TagNode["color"] }
): TagNode[] {
  const id = createTagId(input.name);
  if (!id) return tree;

  const allTags = flattenTree(tree);
  if (allTags.some((tag) => tag.id === id)) return tree;

  const nextNode: TagNode = {
    id,
    name: input.name.trim(),
    color: input.color ?? "slate",
    children: [],
  };

  if (!input.parentId) {
    return [...tree, nextNode];
  }

  const addToNode = (nodes: TagNode[]): TagNode[] =>
    nodes.map((node) => {
      if (node.id === input.parentId) {
        return { ...node, children: [...node.children, nextNode] };
      }
      return { ...node, children: addToNode(node.children) };
    });

  return addToNode(tree);
}

/**
 * Assigns a full tag list to a goal.
 */
export function assignTagToGoal(goals: Goal[], goalId: string, tagIds: string[]): Goal[] {
  return goals.map((goal) => (goal.id === goalId ? { ...goal, tagIds } : goal));
}

/**
 * Assigns a full tag list to a timeline item.
 */
export function assignTagToTimelineItem(
  goals: Goal[],
  goalId: string,
  itemId: string,
  tagIds: string[]
): Goal[] {
  return goals.map((goal) => {
    if (goal.id !== goalId) return goal;
    return {
      ...goal,
      timeline: goal.timeline.map((item: TimelineItem) =>
        item.id === itemId ? { ...item, tagIds } : item
      ),
    };
  });
}

