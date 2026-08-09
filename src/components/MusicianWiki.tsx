"use client";

import { useState, type FormEvent } from "react";
import { htmlEscape } from "@/lib/article";
import { NATIONS, MUSICIANS_BY_NATION } from "@/lib/musicians";

interface Musician {
  name: string;
  description: string;
  bio: string;
  image: string;
  sourceUrl: string;
}

// 音乐人百科：按国籍筛选 + 搜索
export function MusicianWiki() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [m, setM] = useState<Musician | null>(null);
  const [searched, setSearched] = useState("");
  const [err, setErr] = useState(false);
  const [nation, setNation] = useState<string | null>(null);

  async function lookup(term: string) {
    const k = term.trim() || "郎朗";
    setQ(k);
    setLoading(true);
    setErr(false);
    try {
      const res = await fetch(`/api/musician?q=${encodeURIComponent(k)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "查询失败");
      setM(data.musician);
      setSearched(k);
    } catch {
      setErr(true);
      setM(null);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    lookup(q);
  }

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        〄 音乐人百科
      </h3>
      <div className="p-3.5">
        <form className="flex gap-2" onSubmit={onSubmit}>
          <input
            className="w-full rounded-md border border-line-strong bg-panel-solid px-3 py-1.5 text-[13px] outline-none focus:border-red"
            placeholder="搜音乐人，如：郎朗 / Taylor Swift"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="shrink-0 rounded-md bg-red px-4 text-[13px] tracking-[1px] text-paper hover:brightness-110 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "查询中…" : "查询"}
          </button>
        </form>

        {/* 按国籍筛选 */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] opacity-60">按国籍：</span>
          {NATIONS.map((n) => (
            <button
              key={n}
              className={`rounded border px-2 py-0.5 text-xs transition ${
                nation === n
                  ? "border-line-strong bg-panel text-red"
                  : "border-transparent opacity-75 hover:border-line-strong"
              }`}
              onClick={() => setNation(nation === n ? null : n)}
            >
              {n}
            </button>
          ))}
        </div>

        {nation ? (
          <div className="mt-2 flex flex-wrap gap-1.5 rounded-md border border-line p-2">
            <span className="w-full text-[11px] opacity-60">
              {nation} · 代表音乐人（点击查询百科）
            </span>
            {(MUSICIANS_BY_NATION[nation] ?? []).map((name) => (
              <button
                key={name}
                className="rounded border border-line-strong px-2 py-0.5 text-xs opacity-85 transition hover:border-red hover:text-red"
                onClick={() => lookup(name)}
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">正在查询百科…</div>
        ) : err ? (
          <div className="py-8 text-center text-sm opacity-55">
            「{htmlEscape(searched)}」查询失败，试试其他写法或英文名
          </div>
        ) : m ? (
          <div className="mt-3 flex flex-col gap-4 sm:flex-row">
            {m.image ? (
              <img
                src={m.image}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-40 w-40 shrink-0 rounded-lg object-cover shadow"
              />
            ) : (
              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-lg bg-nred/15 text-5xl text-nred/60">
                ♪
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold tracking-[2px]">{htmlEscape(m.name)}</div>
              {m.description ? (
                <div className="mt-1 text-[13px] text-red">{htmlEscape(m.description)}</div>
              ) : null}
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[1.8] opacity-80">
                {htmlEscape(m.bio || "（未找到图注信息，可尝试其他写法或英文名）")}
              </p>
              {m.sourceUrl ? (
                <a
                  className="mt-3 inline-block rounded-md border border-red px-3 py-1 text-xs tracking-[1px] text-red transition hover:bg-red hover:text-paper"
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看图片来源 ↗
                </a>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm opacity-55">
            输入名称或点上方国籍，查看音乐人简介与头像
          </div>
        )}
      </div>
    </section>
  );
}
