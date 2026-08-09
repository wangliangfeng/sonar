"use client";

// Apple Music 风格标签云：热度(0~1)决定字号，点击触发交互
import { htmlEscape } from "@/lib/article";

export interface TagItem {
  name: string;
  hot: number; // 0 ~ 1，越大字越大
}

interface Props {
  tags: TagItem[];
  onClick?: (name: string) => void;
  className?: string;
}

function styleFor(hot: number): { fontSize: number; px: number; py: number } {
  const clamp = Math.max(0, Math.min(1, hot || 0));
  const fontSize = Math.round(12 + 14 * clamp);
  return { fontSize, px: Math.round(fontSize * 0.55), py: Math.round(fontSize * 0.18) };
}

export function TagCloud({ tags, onClick, className }: Props) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {tags.map((tag) => {
        const s = styleFor(tag.hot);
        return (
          <button
            key={tag.name}
            type="button"
            className="cursor-pointer select-none rounded-full border border-line bg-panel-solid text-ink/80 transition-colors hover:border-red hover:bg-red-soft hover:text-red"
            style={{ fontSize: `${s.fontSize}px`, padding: `${s.py}px ${s.px}px` }}
            onClick={() => onClick?.(tag.name)}
            title={tag.name}
          >
            {htmlEscape(tag.name)}
          </button>
        );
      })}
    </div>
  );
}
