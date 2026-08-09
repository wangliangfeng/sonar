"use client";

import { useJournal, findArticle } from "@/store/journal";
import { fmtTime, htmlEscape } from "@/lib/article";
import { CATEGORY_COLOR } from "@/lib/sources";

export function ArticleModal() {
  const modalId = useJournal((s) => s.modalId);
  const closeArticle = useJournal((s) => s.closeArticle);
  const theme = useJournal((s) => s.theme);
  const cycleTheme = useJournal((s) => s.cycleTheme);
  const modalFont = useJournal((s) => s.modalFont);
  const setFont = useJournal((s) => s.setFont);

  if (!modalId) return null;
  const a = findArticle(modalId);
  if (!a) return null;

  const color = CATEGORY_COLOR[a.category as keyof typeof CATEGORY_COLOR] ?? "var(--ink)";

  return (
    <div className="modal-mask" onClick={closeArticle}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute right-3 top-2.5 rounded-md px-2 py-1 text-xl opacity-60 transition hover:bg-red-soft hover:opacity-100"
          onClick={closeArticle}
          title="关闭"
        >
          ✕
        </button>
        <div className="px-7 py-6 leading-[1.9]" style={{ fontSize: `${modalFont}px` }}>
          <div className="mb-2.5 text-[22px] font-bold leading-[1.45] text-red">
            {htmlEscape(a.title)}
          </div>
          <div className="mb-3.5 flex flex-wrap gap-2.5 text-xs opacity-60">
            <span
              className="rounded px-1.5 py-0.5 text-[11px] tracking-[2px] text-[#f7f1e2]"
              style={{ background: color }}
            >
              {a.category}
            </span>
            <span>{htmlEscape(a.sourceName)}</span>
            {a.author ? <span>作者：{htmlEscape(a.author)}</span> : null}
            <span>{fmtTime(a.pubTs)}</span>
          </div>
          <div className="whitespace-pre-wrap break-words">
            {htmlEscape(a.desc || "（该源未提供正文简介）")}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3.5">
            <button
              className="rounded-md border border-line-strong bg-panel px-2.5 py-1 text-xs transition hover:border-red hover:text-red"
              onClick={cycleTheme}
            >
              {theme === "day" ? "夜版" : theme === "night" ? "护眼" : "日版"}
            </button>
            <button
              className="rounded-md border border-line-strong bg-panel px-2.5 py-1 text-xs transition hover:border-red hover:text-red"
              onClick={() => setFont(modalFont - 2)}
            >
              A−
            </button>
            <button
              className="rounded-md border border-line-strong bg-panel px-2.5 py-1 text-xs transition hover:border-red hover:text-red"
              onClick={() => setFont(modalFont + 2)}
            >
              A+
            </button>
            <a
              className="ml-auto rounded-md border border-red px-3 py-1 text-xs tracking-[1px] text-red transition hover:bg-red hover:text-paper"
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              打开原文 ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
