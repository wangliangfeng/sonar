"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/store/player";
import { useJournal } from "@/store/journal";
import { PODCAST_FEEDS } from "@/lib/podcastFeeds";
import { RADIO_STATIONS, type RadioStation } from "@/lib/radio";
import { TV_CHANNELS, type TvChannel, DOUYIN_LINKS } from "@/lib/tv";
import { htmlEscape } from "@/lib/article";

interface Episode {
  title: string;
  url: string;
  duration: string;
  pubTs: number | null;
  desc: string;
}

// 电台节目单（/api/radio/schedule 返回，当前节目按本地时间实时计算）
interface ScheduleProgram {
  title: string;
  startTime: string;
  endTime: string;
  host: string;
}
interface StationSchedule {
  id: string;
  name: string;
  date: string;
  today: ScheduleProgram[];
  tomorrow: ScheduleProgram[];
  error?: string;
}

// 播一会儿 · 精选音乐播客：选播客 → 列最新几期 → 底部播放器播放
export function Podcasts() {
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  // 电台节目单：服务端缓存各台当日/明日，客户端按本地时间实时算"正在播"
  const [schedules, setSchedules] = useState<Record<string, StationSchedule>>({});
  const [nowTs, setNowTs] = useState(() => Date.now());
  const qtIds = RADIO_STATIONS.filter((s) => /^qt\d+$/.test(s.id)).map((s) => s.id);
  const qtIdsKey = qtIds.join(",");
  const setQueue = usePlayer((s) => s.setQueue);
  const playAt = usePlayer((s) => s.playAt);
  const showToast = useJournal((s) => s.showToast);

  useEffect(() => {
    if (!qtIdsKey) return;
    let live = true;
    async function load() {
      try {
        const res = await fetch(`/api/radio/schedule?ids=${qtIdsKey}`);
        const d = await res.json();
        if (live && Array.isArray(d.stations)) {
          setSchedules(Object.fromEntries(d.stations.map((s: StationSchedule) => [s.id, s])));
        }
      } catch {
        /* 节目单获取失败时静默 */
      }
    }
    load();
    const timer = setInterval(load, 60 * 60 * 1000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [qtIdsKey]);

  // 每 30 秒重渲染一次，让"正在播"随节目表推进
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 30 * 1000);
    return () => clearInterval(t);
  }, []);

  function currentProgram(id: string): ScheduleProgram | null {
    const s = schedules[id];
    if (!s) return null;
    for (const p of s.today) {
      const st = new Date(p.startTime).getTime();
      const et = new Date(p.endTime).getTime();
      if (nowTs >= st && nowTs < et) return p;
    }
    return null;
  }

  async function open(id: string) {
    setActive(id);
    setLoading(true);
    try {
      const res = await fetch(`/api/podcast?feed=${id}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "获取失败");
      setName(d.name);
      setImage(d.image);
      setEpisodes(d.episodes ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "获取失败");
      setEpisodes([]);
    } finally {
      setLoading(false);
    }
  }

  function play(i: number) {
    const tracks = episodes.map((e) => ({
      title: e.title,
      url: e.url,
      artist: name,
      license: "RSS",
      cover: image || undefined,
    }));
    setQueue(tracks);
    playAt(i);
  }

  function playStream(name: string, desc: string, url: string) {
    setQueue([{ title: name, url, artist: desc, license: "直播" }]);
    playAt(0);
  }

  function playRadio(s: RadioStation) {
    playStream(s.name, s.desc, s.url);
  }

  function playTv(c: TvChannel) {
    playStream(c.name, c.desc, c.url);
  }

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ◉ 播一会儿
      </h3>
      <div className="p-3.5">
        <div className="mb-1.5 text-xs opacity-60">电台 · 实时收听</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {RADIO_STATIONS.map((s) => {
            const prog = /^qt\d+$/.test(s.id) ? currentProgram(s.id) : null;
            return (
              <button
                key={s.id}
                onClick={() => playRadio(s)}
                className="group rounded-lg border border-line p-3 text-left transition hover:border-red"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-nred" />
                  <span className="truncate text-[13px] font-medium">{htmlEscape(s.name)}</span>
                </div>
                <div className="mt-1 text-xs opacity-60">{htmlEscape(s.desc)} · 点击收听</div>
                {/^qt\d+$/.test(s.id) ? (
                  <div className="mt-1 truncate text-[11px] text-nred" title={prog ? prog.title : "节目单加载中"}>
                    正在播：{prog ? htmlEscape(prog.title) : "…"}
                    {prog && prog.host ? <span className="opacity-70"> · {htmlEscape(prog.host)}</span> : null}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mb-1.5 mt-5 border-t border-line pt-3 text-xs opacity-60">
          电视台 · 视频伴听（仅音频，HLS）
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {TV_CHANNELS.map((c) => (
            <button
              key={c.id}
              onClick={() => playTv(c)}
              className="group rounded-lg border border-line p-3 text-left transition hover:border-red"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-nred" />
                <span className="truncate text-[13px] font-medium">{htmlEscape(c.name)}</span>
              </div>
              <div className="mt-1 text-xs opacity-60">{htmlEscape(c.desc)} · 点击收听</div>
            </button>
          ))}
        </div>

        <div className="mb-1.5 mt-5 border-t border-line pt-3 text-xs opacity-60">
          抖音直播 · 新标签页打开
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {DOUYIN_LINKS.map((d) => (
            <a
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noreferrer"
              className="group rounded-lg border border-line p-3 text-left transition hover:border-red"
            >
              <div className="truncate text-[13px] font-medium">{htmlEscape(d.name)}</div>
              <div className="mt-1 text-xs opacity-60">{htmlEscape(d.desc)} ↗</div>
            </a>
          ))}
        </div>

        <div className="mb-1.5 mt-5 border-t border-line pt-3 text-xs opacity-60">
          播客 · 点选后播放最新几期
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {PODCAST_FEEDS.map((f) => (
            <button
              key={f.id}
              onClick={() => open(f.id)}
              className={`rounded-lg border p-3 text-left transition ${
                active === f.id
                  ? "border-red bg-red-soft"
                  : "border-line hover:border-red"
              }`}
            >
              <div className="truncate text-[13px] font-medium">{htmlEscape(f.name)}</div>
              <div className="mt-1 text-xs opacity-60">{htmlEscape(f.desc)}</div>
            </button>
          ))}
        </div>

        {active ? (
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 flex items-center justify-between gap-2 text-xs opacity-60">
              <span>
                {htmlEscape(name)} · {loading ? "加载中…" : `${episodes.length} 期 · 点击播放`}
              </span>
              {active && !loading ? (
                <button
                  className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] transition hover:border-red hover:text-red"
                  onClick={() => open(active)}
                >
                  刷新
                </button>
              ) : null}
            </div>
            {episodes.length === 0 && !loading ? (
              <div className="py-6 text-center text-sm opacity-55">（暂无节目）</div>
            ) : (
              <ol>
                {episodes.map((e, i) => (
                  <li
                    key={e.url}
                    className="flex items-center gap-2 border-b border-dashed border-line py-1.5 last:border-none"
                  >
                    <button
                      className="shrink-0 text-[13px] opacity-70 transition hover:text-nred"
                      onClick={() => play(i)}
                      title="播放"
                    >
                      ▶
                    </button>
                    <span className="min-w-0 flex-1 truncate text-[13px]" title={e.desc}>
                      {htmlEscape(e.title)}
                    </span>
                    {e.duration ? (
                      <span className="shrink-0 text-[10px] opacity-50">{e.duration}</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
