"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useJournal } from "@/store/journal";
import { usePlayer, type PlayerTrack } from "@/store/player";
import { htmlEscape } from "@/lib/article";

interface LocalDownload {
  id: number;
  title: string;
  filePath: string;
  createdAt: Date | null;
}

import { GENRES } from "@/lib/genres";
import { TagCloud, type TagItem } from "@/components/TagCloud";

// 给 100 种类型分配热度（热门类型更大，其余确定性散列）
const HOT_GENRES = new Set(["流行", "摇滚", "爵士", "古典钢琴", "电子", "民谣", "嘻哈", "说唱", "钢琴", "环境"]);
function genreHot(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return Math.min(1, 0.3 + (h % 55) / 100 + (HOT_GENRES.has(name) ? 0.35 : 0));
}
const genreTags: TagItem[] = GENRES.map(([label]) => ({ name: label, hot: genreHot(label) }));

const HOT: [string, string][] = [
  ["贝多芬", "贝多芬"],
  ["莫扎特", "莫扎特"],
  ["肖邦", "肖邦"],
  ["郎朗", "郎朗"],
  ["爵士", "jazz"],
  ["古典钢琴", "classical piano"],
];

// 确定性封面配色（按标题哈希生成渐变），无真实封面时兜底
function coverColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,45%), hsl(${(hue + 40) % 360},62%,30%))`;
}

// 免版权音乐 · 网易云风格卡片网格（Wikimedia Commons 开放接口）
export function RoyaltyMusic() {
  const showToast = useJournal((s) => s.showToast);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<PlayerTrack[]>([]);
  const [works, setWorks] = useState<PlayerTrack[]>([]);
  const [theme, setTheme] = useState<string | null>(null);
  const [searched, setSearched] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showGenres, setShowGenres] = useState(false);
  const [dl, setDl] = useState<LocalDownload[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/downloads")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setDl(d.downloads ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const setQueue = usePlayer((s) => s.setQueue);
  const playAt = usePlayer((s) => s.playAt);
  const nowIndex = usePlayer((s) => s.index);

  async function doSearch(term: string) {
    const k = term.trim() || "music";
    setQ(k);
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/royalty?q=${encodeURIComponent(k)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "搜索失败");
      const list: PlayerTrack[] = data.tracks ?? [];
      const w: PlayerTrack[] = data.works ?? [];
      setTracks(list);
      setWorks(w);
      setTheme(data.theme ?? null);
      setSearched(k);
      setQueue([...w, ...list]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "搜索失败");
      setTracks([]);
      setWorks([]);
      setTheme(null);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    doSearch(q);
  }

  function card(t: PlayerTrack, i: number, base: number) {
    return (
      <button
        key={t.url + i}
        className="group text-left"
        onClick={() => {
          setQueue([...works, ...tracks]);
          playAt(base + i);
        }}
      >
        <div
          className="relative aspect-square w-full overflow-hidden rounded-lg shadow"
          style={t.cover ? undefined : { background: coverColor(t.title) }}
        >
          {t.cover ? (
            <img src={t.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-paper/80">
              ♪
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
            <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-nred text-sm text-paper shadow-lg group-hover:flex">
              {nowIndex === base + i ? "❚❚" : "▶"}
            </span>
          </div>
          {nowIndex === base + i ? (
            <div className="absolute left-1.5 top-1.5 rounded bg-nred px-1 text-[10px] text-paper">
              播放中
            </div>
          ) : null}
        </div>
        <div className="mt-1 truncate text-[13px]" title={t.title}>
          {htmlEscape(t.title)}
        </div>
        <div className="truncate text-xs opacity-60">{htmlEscape(t.artist || "佚名")}</div>
        <div className="truncate text-[10px] opacity-50">{htmlEscape(t.license || "免版权")}</div>
      </button>
    );
  }

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ♫ 免版权音乐 · 本地下载
      </h3>
      <div className="p-3.5">
        <form className="flex gap-2" onSubmit={onSubmit}>
          <input
            className="w-full rounded-md border border-line-strong bg-panel-solid px-3 py-1.5 text-[13px] outline-none focus:border-red"
            placeholder="搜索免版权音乐，如：贝多芬 / 郎朗 / piano"
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

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {HOT.map(([label, term]) => (
            <button
              key={label}
              className="rounded border border-line-strong px-2 py-0.5 text-xs opacity-80 transition hover:border-red hover:text-red"
              onClick={() => doSearch(term)}
            >
              {label}
            </button>
          ))}
          <button
            className="rounded border border-line-strong px-2 py-0.5 text-xs opacity-80 transition hover:border-red hover:text-red"
            onClick={() => setShowGenres((v) => !v)}
          >
            {showGenres ? "收起类型" : `全部类型（${GENRES.length}）`}
          </button>
        </div>

        {showGenres ? (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-line p-2.5">
            <TagCloud
              tags={genreTags}
              onClick={(label) => {
                const term = GENRES.find(([l]) => l === label)?.[1] ?? label;
                doSearch(term);
              }}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">正在搜索…</div>
        ) : !hasSearched ? (
          <div className="py-8 text-center text-sm opacity-55">
            搜索作曲家（如贝多芬）可看代表作；或搜索免版权音乐（CC / 公有领域）本地下载
          </div>
        ) : works.length + tracks.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-55">
            「{htmlEscape(searched)}」无结果 · 可尝试英文关键词（如 piano / jazz）
          </div>
        ) : (
          <>
            {works.length > 0 ? (
              <>
                <div className="mt-3 mb-2 text-xs opacity-60">
                  「{htmlEscape(theme ?? searched)}」的代表作 · 点击卡片播放
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {works.map((t, i) => card(t, i, 0))}
                </div>
              </>
            ) : null}
            {tracks.length > 0 ? (
              <>
                {works.length > 0 ? (
                  <div className="mt-4 mb-2 text-xs opacity-60">更多「{htmlEscape(searched)}」相关 · {tracks.length} 条</div>
                ) : null}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {tracks.map((t, i) => card(t, i, works.length))}
                </div>
              </>
            ) : null}
          </>
        )}

        {dl.length > 0 ? (
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1 text-xs opacity-60">
              本地已下载 {dl.length} 首（保存在项目 music/ 目录，记录于本地数据库）
            </div>
            <ul className="space-y-1">
              {dl.map((x) => (
                <li key={x.id} className="truncate text-[12px] opacity-70" title={x.filePath}>
                  ♪ {htmlEscape(x.title)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
