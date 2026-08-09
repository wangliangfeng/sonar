"use client";

import { useEffect, useState, type FormEvent } from "react";
import { htmlEscape } from "@/lib/article";
import { CoverFallback } from "@/components/CoverFallback";

// 合并视频：B站 + 爱奇艺(免费) + 开源(Wikimedia Commons) 同一列表，卡片标注来源
interface VItem {
  type: "bili" | "commons" | "iqiyi";
  title: string;
  thumb: string;
  url: string; // commons=可播放地址；bili=bvid；iqiyi=原页链接
  author: string;
  duration: string;
  license: string;
}

function fmtDur(s: number): string {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss < 10 ? "0" : ""}${ss}`;
}

// 带超时的搜索请求：外部源(Commons 等)不可达时快速降级为空结果，避免整页被慢请求拖住
function fetchJsonOrEmpty(url: string, ms: number): Promise<any> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return fetch(url, { signal: c.signal })
    .then((r) => r.json())
    .catch(() => ({ videos: [] }))
    .finally(() => clearTimeout(t));
}

interface Props {
  title: string;
  defaultQuery?: string;
  quick?: [string, string][];
  commons?: boolean; // 是否合并开源 Wikimedia Commons 结果（默认 true）
  iqiyi?: boolean; // 是否合并爱奇艺免费视频（默认 false）
}

export function MergedVideos({ title, defaultQuery = "", quick = [], commons = true, iqiyi = false }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<VItem[] | null>(null);
  const [searched, setSearched] = useState("");
  const [playing, setPlaying] = useState<VItem | null>(null);

  const sourcesLabel = [
    "B站",
    ...(iqiyi ? ["爱奇艺"] : []),
    ...(commons ? ["开源"] : []),
  ].join(" + ");

  async function doSearch(term: string) {
    const k = term.trim() || defaultQuery || "京剧";
    setQ(k);
    setLoading(true);
    try {
      const kEnc = encodeURIComponent(k);
      const biliRes = fetchJsonOrEmpty(`/api/bilibili?q=${kEnc}`, 10000);
      const iqRes = iqiyi ? fetchJsonOrEmpty(`/api/iqiyi?q=${kEnc}`, 10000) : Promise.resolve({ videos: [] });
      const openRes = commons ? fetchJsonOrEmpty(`/api/video?q=${kEnc}`, 8000) : Promise.resolve({ videos: [] });
      const [bRes, iRes, oRes] = await Promise.all([biliRes, iqRes, openRes]);
      const bili: VItem[] = (bRes.videos ?? []).map(
        (v: { bvid: string; title: string; pic: string; author: string; duration: string }) => ({
          type: "bili",
          title: v.title,
          thumb: v.pic,
          url: v.bvid,
          author: v.author ?? "",
          duration: v.duration ?? "",
          license: "B站",
        }),
      );
      const iq: VItem[] = (iRes.videos ?? []).map(
        (v: { title: string; url: string; thumb: string; channel?: string }) => ({
          type: "iqiyi",
          title: v.title,
          thumb: v.thumb,
          url: v.url,
          author: v.channel ?? "",
          duration: "",
          license: "爱奇艺",
        }),
      );
      const open: VItem[] = (oRes.videos ?? []).map(
        (v: { title: string; thumb: string; url: string; duration: number; author?: string; license: string }) => ({
          type: "commons",
          title: v.title,
          thumb: v.thumb,
          url: v.url,
          author: v.author ?? "",
          duration: fmtDur(v.duration),
          license: "开源",
        }),
      );
      setItems([...bili, ...iq, ...open]);
      setSearched(k);
    } catch {
      setItems([]);
    } finally {
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
        ▶ {title}（{sourcesLabel}）
      </h3>
      <div className="p-3.5">
        <form className="flex gap-2" onSubmit={onSubmit}>
          <input
            className="w-full rounded-md border border-line-strong bg-panel-solid px-3 py-1.5 text-[13px] outline-none focus:border-red"
            placeholder={`搜索${title}，如：京剧 / 话剧 / 音乐剧`}
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

        {quick.length ? (
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
        ) : null}

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">正在搜索…</div>
        ) : items === null ? (
          <div className="py-8 text-center text-sm opacity-55">搜索或点上方快捷词查看视频</div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-55">「{htmlEscape(searched)}」无结果</div>
        ) : (
          <>
            <div className="mt-3 mb-2 text-xs opacity-60">
              「{htmlEscape(searched)}」· {items.length} 条（{sourcesLabel}）· 点击卡片播放
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((v, i) => (
                <button
                  key={i}
                  className="group text-left"
                  onClick={() => {
                    if (v.type === "iqiyi") {
                      window.open(v.url, "_blank", "noopener,noreferrer");
                      return;
                    }
                    setPlaying(v);
                  }}
                >
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
                    <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1 text-[10px] text-paper">
                      {v.license}
                    </span>
                    {v.duration ? (
                      <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] text-paper">
                        {v.duration}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px]" title={v.title}>
                    {htmlEscape(v.title)}
                  </div>
                  <div className="truncate text-xs opacity-60">
                    {htmlEscape(v.author || "佚名")} · {htmlEscape(v.license)}
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
              {playing.type === "commons" ? (
                <video
                  src={playing.url}
                  controls
                  autoPlay
                  className="aspect-video w-full rounded-lg bg-black"
                />
              ) : playing.type === "iqiyi" ? (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-black/80 text-center">
                  <div className="max-w-full truncate px-4 text-sm opacity-80">
                    {htmlEscape(playing.title)}
                  </div>
                  <a
                    className="rounded-md bg-nred px-4 py-1.5 text-sm text-paper transition hover:brightness-110"
                    href={playing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    在爱奇艺观看 ↗
                  </a>
                </div>
              ) : (
                <iframe
                  src={`https://player.bilibili.com/player.html?bvid=${playing.url}&page=1&high_quality=1`}
                  className="aspect-video w-full rounded-lg bg-black"
                  allowFullScreen
                />
              )}
              <div className="mt-2 text-[15px] font-medium leading-[1.4]">
                {htmlEscape(playing.title)}
              </div>
              <div className="mt-0.5 text-xs opacity-60">
                {htmlEscape(playing.license)} · {htmlEscape(playing.author || "佚名")}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
