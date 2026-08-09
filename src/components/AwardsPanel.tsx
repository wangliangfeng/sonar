"use client";

import { useState } from "react";
import { AWARDS, type AwardGroup, type AwardRow } from "@/lib/awards";
import { htmlEscape } from "@/lib/article";

interface PreviewInfo {
  trackName: string;
  artistName: string;
  previewUrl: string;
  trackViewUrl: string;
  artworkUrl: string;
}

// 单条获奖记录：代表作 + 试听 + 官方链接
function RowView({ row }: { row: AwardRow }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "err">("idle");
  const [info, setInfo] = useState<PreviewInfo | null>(null);

  async function load() {
    if (state === "loading" || state === "ready") return;
    setState("loading");
    try {
      const res = await fetch(`/api/preview?q=${encodeURIComponent(`${row.winner} ${row.work}`)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "无试听");
      setInfo(d.info);
      setState("ready");
    } catch {
      setState("err");
    }
  }

  return (
    <li className="border-b border-dashed border-line px-2 py-1.5 transition last:border-none hover:bg-red-soft">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-11 shrink-0 text-xs font-bold text-gold">{row.year}</span>
        <span className="w-36 shrink-0 truncate text-xs opacity-70" title={row.category}>
          {htmlEscape(row.category)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px]" title={row.winner}>
          {htmlEscape(row.winner)}
        </span>
        <span className="shrink-0 text-[11px] text-gold/85" title={row.work}>
          代表作：{htmlEscape(row.work)}
        </span>
        {state === "idle" ? (
          <button
            className="shrink-0 rounded border border-line-strong px-2 py-0.5 text-[11px] transition hover:border-nred hover:text-nred"
            onClick={load}
          >
            试听
          </button>
        ) : state === "loading" ? (
          <span className="shrink-0 text-[11px] opacity-50">查找中…</span>
        ) : state === "err" ? (
          <span className="shrink-0 text-[10px] opacity-45">无试听</span>
        ) : null}
      </div>
      {state === "ready" && info ? (
        <div className="mt-1.5 ml-[7.5rem] flex flex-wrap items-center gap-2">
          <audio controls src={info.previewUrl} preload="none" className="h-7 w-56" />
          <span className="truncate text-[11px] opacity-60">
            {htmlEscape(info.artistName)} · {htmlEscape(info.trackName)}
          </span>
          {info.trackViewUrl ? (
            <a
              className="text-[11px] text-nred hover:underline"
              href={info.trackViewUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apple Music ↗
            </a>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function AwardsPanel({ group }: { group: AwardGroup }) {
  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ♛ {group.name}
      </h3>
      <div className="flex flex-wrap items-center justify-between border-b border-dashed border-line px-3.5 py-1.5 text-[11px] opacity-55">
        <span>
          {group.en} · {group.desc}（公开获奖记录 · 精选收录）
        </span>
        {group.officialUrl ? (
          <a
            className="text-gold hover:underline"
            href={group.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            官网 ↗
          </a>
        ) : null}
      </div>
      <ol>
        {group.rows.map((r, i) => (
          <RowView key={i} row={r} />
        ))}
      </ol>
    </section>
  );
}

export function AllAwards() {
  return (
    <div>
      {AWARDS.map((g) => (
        <AwardsPanel key={g.id} group={g} />
      ))}
    </div>
  );
}
