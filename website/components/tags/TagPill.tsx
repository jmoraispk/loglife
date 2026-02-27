"use client";

import { TAG_COLOR_STYLES, type TagColor } from "@/data/mock/tags";

interface TagPillProps {
  label: string;
  color?: TagColor;
  count?: number;
  onClick?: () => void;
  onRemove?: () => void;
  active?: boolean;
  className?: string;
}

export default function TagPill({
  label,
  color = "slate",
  count,
  onClick,
  onRemove,
  active = false,
  className = "",
}: TagPillProps) {
  const styles = TAG_COLOR_STYLES[color] ?? TAG_COLOR_STYLES.slate;
  const clickable = Boolean(onClick);

  return (
    <span
      className={[
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        styles.bg,
        styles.text,
        styles.border,
        clickable ? "cursor-pointer hover:brightness-110" : "",
        active ? "ring-1 ring-white/30" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      title={label}
    >
      <span className="truncate max-w-32">{label}</span>
      {typeof count === "number" && (
        <span className="text-[10px] opacity-90">({count})</span>
      )}
      {onRemove && (
        <button
          type="button"
          className="ml-0.5 cursor-pointer rounded-sm text-[10px] leading-none opacity-90 hover:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
          aria-label={`Remove ${label}`}
        >
          x
        </button>
      )}
    </span>
  );
}
