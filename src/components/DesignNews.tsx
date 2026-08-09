"use client";

import { useEffect, useState } from "react";
import { htmlEscape } from "@/lib/article";

interface Article {
  source: string;
  title: string;
  link: string;
  desc: string;
  author: string;
  pubTs: number | null;
}

function fmtTime(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 设计资讯：官方 RSS 聚合（少数派 / 数英网 / Dezeen），按来源筛选
export function DesignNews() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/design")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setArticles(d.articles ?? []);
      })
      .catch(() => alive && setArticles([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const sources = [...new Set(articles.map((a) => a.source))];
  const list = filter ? articles.filter((a) => a.source === filter) : articles;

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ◈ 设计资讯 · 官方 RSS 聚合
      </h3>
      <div className="p-3.5">
        {sources.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              className={`rounded border px-2 py-0.5 text-xs transition ${
                filter === null
                  ? "border-line-strong bg-panel text-red"
                  : "border-transparent opacity-70 hover:border-line-strong"
              }`}
              onClick={() => setFilter(null)}
            >
              全部
            </button>
            {sources.map((s) => (
              <button
                key={s}
                className={`rounded border px-2 py-0.5 text-xs transition ${
                  filter === s
                    ? "border-line-strong bg-panel text-red"
                    : "border-transparent opacity-70 hover:border-line-strong"
                }`}
                onClick={() => setFilter(filter === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">加载设计资讯中…</div>
        ) : list.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-55">（暂无文章）</div>
        ) : (
          <div className="mt-2">
            {list.map((a, i) => (
              <article
                key={`${a.source}-${i}`}
                className="border-b border-dashed border-line py-2.5 last:border-none"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-soft px-1.5 py-0.5 text-[10px] tracking-[2px] text-red">
                    {htmlEscape(a.source)}
                  </span>
                  {a.pubTs ? (
                    <span className="text-[10px] opacity-45">{fmtTime(a.pubTs)}</span>
                  ) : null}
                  {a.author ? (
                    <span className="text-[11px] opacity-50">{htmlEscape(a.author)}</span>
                  ) : null}
                </div>
                <a
                  className="mt-1 block truncate text-[14px] font-medium transition hover:text-red"
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={a.title}
                >
                  {htmlEscape(a.title)}
                </a>
                {a.desc ? (
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed opacity-60">
                    {htmlEscape(a.desc)}
                  </p>
                ) : null}
                <a
                  className="mt-1 inline-block text-[11px] text-red opacity-80 hover:underline"
                  href={a.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  阅读 →
                </a>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
