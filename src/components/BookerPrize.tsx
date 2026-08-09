"use client";

import { useState } from "react";
import { htmlEscape } from "@/lib/article";
import { BOOKER_WINNERS, BOOKER_OFFICIAL_URL, type BookerWinner } from "@/lib/booker";

interface AuthorInfo {
  name: string;
  desc: string;
  wikidataUrl: string;
}

// 单条获奖：点「简介」懒加载作者介绍（Wikidata），代表作即书名列
function BookerRow({ w }: { w: BookerWinner }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "err">("idle");
  const [info, setInfo] = useState<AuthorInfo | null>(null);

  async function load() {
    setOpen(true);
    if (state === "loading" || state === "ready") return;
    setState("loading");
    try {
      const res = await fetch(`/api/author?name=${encodeURIComponent(w.author)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "查询失败");
      setInfo(d.author);
      setState("ready");
    } catch {
      setState("err");
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-dashed border-line px-3.5 py-1.5 transition last:border-none hover:bg-red-soft">
      <span className="w-12 shrink-0 text-xs font-bold text-gold">{w.year}</span>
      <span className="min-w-0 flex-1 truncate text-[13px]" title={`${w.title} · ${w.author}`}>
        {htmlEscape(w.title)}
      </span>
      <span className="shrink-0 truncate text-[11px] opacity-60" title={w.author}>
        {htmlEscape(w.author)}
      </span>
      {state === "idle" ? (
        <button
          className="shrink-0 rounded border border-line-strong px-2 py-0.5 text-[11px] transition hover:border-red hover:text-red"
          onClick={load}
        >
          简介
        </button>
      ) : state === "loading" ? (
        <span className="shrink-0 text-[11px] opacity-50">查找中…</span>
      ) : state === "err" ? (
        <span className="shrink-0 text-[10px] opacity-45">无资料</span>
      ) : (
        <button
          className="shrink-0 rounded border border-line-strong px-2 py-0.5 text-[11px] transition hover:border-red hover:text-red"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "收起" : "简介"}
        </button>
      )}
      {open && state === "ready" && info ? (
        <div className="flex w-full flex-wrap items-start gap-2 pl-12 pb-1">
          <span className="min-w-0 flex-1 text-[12px] leading-relaxed opacity-80">
            {htmlEscape(info.desc || "（暂无简介）")}
          </span>
          {info.wikidataUrl ? (
            <a
              className="shrink-0 text-[11px] text-nred hover:underline"
              href={info.wikidataUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Wikidata ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

// 布克图书奖（The Booker Prize）历届获奖图书（1969–2025），官网链接
export function BookerPrize() {
  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ♛ 布克图书奖 · Booker Prize
      </h3>
      <div className="flex flex-wrap items-center justify-between border-b border-dashed border-line px-3.5 py-1.5 text-[11px] opacity-55">
        <span>英国文学最高荣誉 · 历届获奖图书（1969–2025 全收录）</span>
        <a
          className="text-gold hover:underline"
          href={BOOKER_OFFICIAL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          官网 ↗
        </a>
      </div>
      <ol className="max-h-[26rem] overflow-y-auto">
        {BOOKER_WINNERS.map((w) => (
          <BookerRow key={`${w.year}-${w.title}`} w={w} />
        ))}
      </ol>
    </section>
  );
}
