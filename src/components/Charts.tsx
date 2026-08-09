"use client";

import { useEffect, useState } from "react";
import { htmlEscape } from "@/lib/article";

// 覆盖全球主要音乐市场的地区（客户端常量，避免引入服务端库）
const REGIONS: [string, string][] = [
  ["中国大陆", "cn"],
  ["美国", "us"],
  ["英国", "gb"],
  ["日本", "jp"],
  ["韩国", "kr"],
  ["港台", "tw"],
  ["法国", "fr"],
  ["德国", "de"],
  ["巴西", "br"],
  ["澳大利亚", "au"],
  ["加拿大", "ca"],
  ["印度", "in"],
  ["西班牙", "es"],
  ["意大利", "it"],
];

interface ChartItem {
  rank: number;
  title: string;
  artist: string;
  album: string;
  url: string;
  cover: string;
}

interface PreviewInfo {
  trackName: string;
  artistName: string;
  previewUrl: string;
  trackViewUrl: string;
  artworkUrl: string;
}

interface Props {
  title: string;
  defaultKind?: "songs" | "albums";
  allowKind?: boolean;
}

// 单条榜单：试听（iTunes 官方 30s）+ 打开官方链接；命中后内联展开播放条
function ChartRow({ it }: { it: ChartItem }) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "err">("idle");
  const [info, setInfo] = useState<PreviewInfo | null>(null);

  async function load() {
    if (state === "loading" || state === "ready") return;
    setState("loading");
    try {
      const res = await fetch(`/api/preview?q=${encodeURIComponent(`${it.artist} ${it.title}`)}`);
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "无试听");
      setInfo(d.info);
      setState("ready");
    } catch {
      setState("err");
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-dashed border-line py-2 last:border-none">
      <span
        className="w-6 shrink-0 text-center text-[15px] font-bold"
        style={{ color: it.rank <= 3 ? "var(--nred)" : "var(--muted)" }}
      >
        {it.rank}
      </span>
      <img
        src={it.cover}
        alt=""
        loading="lazy"
        className="h-12 w-12 shrink-0 rounded object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium" title={it.title}>
          {htmlEscape(it.title)}
        </div>
        <div className="truncate text-xs opacity-60">
          {htmlEscape(it.artist)}
          {it.album && it.album !== it.title ? ` · ${htmlEscape(it.album)}` : ""}
        </div>
      </div>
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
      {it.url ? (
        <a
          className="shrink-0 text-xs opacity-60 transition hover:text-nred"
          href={it.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          打开 →
        </a>
      ) : null}
      {state === "ready" && info ? (
        <div className="flex w-full flex-wrap items-center gap-2 pl-9">
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

// 音乐榜单：Apple Music 官方 RSS（排名 + 封面 + 歌手 + 专辑）
export function Charts({ title, defaultKind = "songs", allowKind = true }: Props) {
  // 记住上次选择的地域与类型（localStorage），刷新后不丢失
  const [region, setRegion] = useState(() => {
    if (typeof window === "undefined") return "cn";
    return window.localStorage.getItem("sonar-chart-region") || "cn";
  });
  const [kind, setKind] = useState<"songs" | "albums">(() => {
    if (typeof window === "undefined") return defaultKind;
    const k = window.localStorage.getItem("sonar-chart-kind");
    return k === "albums" ? "albums" : k === "songs" ? "songs" : defaultKind;
  });
  const [items, setItems] = useState<ChartItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("sonar-chart-region", region);
  }, [region]);

  useEffect(() => {
    window.localStorage.setItem("sonar-chart-kind", kind);
  }, [kind]);

  useEffect(() => {
    let alive = true;
    // 数据获取（外部系统）同步加载态
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/charts?region=${region}&kind=${kind}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setItems(d.items ?? []);
      })
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [region, kind]);

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ◈ {title}
      </h3>
      <div className="border-b border-dashed border-line px-3.5 py-1.5 text-[11px] opacity-55">
        数据源：Apple Music 官方 RSS（覆盖全球主要市场 · 免授权）
      </div>
      <div className="p-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {REGIONS.map(([label, code]) => (
            <button
              key={code}
              className={`rounded border px-2 py-0.5 text-xs transition ${
                region === code
                  ? "border-line-strong bg-panel text-red"
                  : "border-transparent opacity-70 hover:border-line-strong"
              }`}
              onClick={() => setRegion(code)}
            >
              {label}
            </button>
          ))}
          {allowKind ? (
            <div className="ml-auto flex gap-1">
              {(["songs", "albums"] as const).map((k) => (
                <button
                  key={k}
                  className={`rounded border px-2 py-0.5 text-xs transition ${
                    kind === k
                      ? "border-line-strong bg-panel text-red"
                      : "border-transparent opacity-70 hover:border-line-strong"
                  }`}
                  onClick={() => setKind(k)}
                >
                  {k === "songs" ? "单曲" : "专辑"}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">加载榜单中…</div>
        ) : items && items.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-55">该地区暂无榜单数据</div>
        ) : (
          <ol className="mt-2">
            {(items ?? []).map((it) => (
              <ChartRow key={it.rank} it={it} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
