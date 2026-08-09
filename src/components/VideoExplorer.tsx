"use client";

import { useEffect, useState, type FormEvent } from "react";
import { htmlEscape } from "@/lib/article";
import { CoverFallback } from "@/components/CoverFallback";

interface VideoItem {
  title: string;
  url: string;
  thumb: string;
  duration: number;
  mime: string;
  license: string;
}

const DEFAULT_QUICK: [string, string][] = [
  ["郎朗", "Lang Lang"],
  ["戏曲·京剧", "Peking opera"],
  ["音乐人采访", "music interview"],
  ["演唱会", "live concert"],
  ["古典", "classical"],
  ["爵士", "jazz"],
  ["纪录片", "documentary music"],
];

function fmtDur(s: number): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss < 10 ? "0" : ""}${ss}`;
}

interface Props {
  title?: string;
  defaultQuery?: string;
  quick?: [string, string][];
}

// 音乐视频（含音乐人采访）：Wikimedia Commons 开放接口，点击卡片内嵌播放
export function VideoExplorer({
  title = "音乐视频 · 采访 / 现场 / 纪录片",
  defaultQuery,
  quick = DEFAULT_QUICK,
}: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [searched, setSearched] = useState("");
  const [playing, setPlaying] = useState<VideoItem | null>(null);

  async function doSearch(term: string) {
    const k = term.trim() || "music interview";
    setQ(k);
    setLoading(true);
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), 8000);
    try {
      const res = await fetch(`/api/video?q=${encodeURIComponent(k)}`, { signal: c.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "搜索失败");
      setVideos(data.videos ?? []);
      setSearched(k);
    } catch {
      setVideos([]);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!defaultQuery) return;
    // 默认关键词自动加载（外部数据获取）
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doSearch(defaultQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    doSearch(q);
  }

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ▶ {title}
      </h3>
      <div className="p-3.5">
        <form className="flex gap-2" onSubmit={onSubmit}>
          <input
            className="w-full rounded-md border border-line-strong bg-panel-solid px-3 py-1.5 text-[13px] outline-none focus:border-red"
            placeholder="搜索音乐视频，如：郎朗 / Lang Lang / 演唱会"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="shrink-0 rounded-md bg-red px-4 text-[13px] tracking-[1px] text-paper hover:brightness-110 disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "搜索中…" : "搜索"}
          </button>
        </form>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {quick.map(([label, term]) => (
            <button
              key={label}
              className="rounded border border-line-strong px-2 py-0.5 text-xs opacity-80 transition hover:border-red hover:text-red"
              onClick={() => doSearch(term)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">正在搜索…</div>
        ) : videos === null ? (
          <div className="py-8 text-center text-sm opacity-55">
            搜索或点上方快捷词，查找音乐人采访 / 现场 / 纪录片视频
          </div>
        ) : videos.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-55">
            「{htmlEscape(searched)}」无结果 · 可尝试英文或艺术家名（如 Lang Lang / 郎朗）
          </div>
        ) : (
          <>
            <div className="mt-3 mb-2 text-xs opacity-60">
              「{htmlEscape(searched)}」· {videos.length} 条 · 点击卡片播放
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {videos.map((v, i) => (
                <button key={i} className="group text-left" onClick={() => setPlaying(v)}>
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/10 shadow">
                    {v.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.thumb}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <CoverFallback title={v.title} icon="▶" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-nred text-sm text-paper shadow-lg">
                        ▶
                      </span>
                    </div>
                    {v.duration ? (
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-paper">
                        {fmtDur(v.duration)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px]" title={v.title}>
                    {htmlEscape(v.title)}
                  </div>
                  <div className="truncate text-xs opacity-60">
                    {htmlEscape(v.license || "免版权")}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {playing ? (
        <div className="modal-mask" onClick={() => setPlaying(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute right-3 top-2.5 z-10 rounded-md px-2 py-1 text-xl opacity-60 hover:bg-red-soft hover:opacity-100"
              onClick={() => setPlaying(null)}
            >
              ✕
            </button>
            <div className="p-5">
              <video
                src={playing.url}
                controls
                autoPlay
                className="aspect-video w-full rounded-lg bg-black"
              />
              <div className="mt-2 text-[15px] font-medium leading-[1.4]">
                {htmlEscape(playing.title)}
              </div>
              <div className="mt-0.5 text-xs opacity-60">
                {htmlEscape(playing.license || "免版权")} · {htmlEscape(playing.mime)}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
