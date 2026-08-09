"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { PLAY_MODE_LABEL, usePlayer } from "@/store/player";
import { useJournal } from "@/store/journal";
import { htmlEscape } from "@/lib/article";

function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss < 10 ? "0" : ""}${ss}`;
}

// 倍速档位（循环切换）
const PLAY_RATES = [0.75, 1, 1.25, 1.5, 2];

// 声呐播放器：固定底部播放条（顺序/循环/单曲/随机 + 播放列表），内含 HTML5 <audio>
export function PlayerBar() {
  const current = usePlayer((s) => s.current);
  const playing = usePlayer((s) => s.playing);
  const toggle = usePlayer((s) => s.toggle);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const mode = usePlayer((s) => s.mode);
  const cycleMode = usePlayer((s) => s.cycleMode);
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const playAt = usePlayer((s) => s.playAt);
  const showToast = useJournal((s) => s.showToast);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [dur, setDur] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [showList, setShowList] = useState(false);
  const [rate, setRate] = useState(() => {
    if (typeof window === "undefined") return 1;
    const r = Number(window.localStorage.getItem("sonar-player-rate"));
    return PLAY_RATES.includes(r) ? r : 1;
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 1;
    const v = Number(window.localStorage.getItem("sonar-player-volume"));
    return v >= 0 && v <= 1 ? v : 1;
  });
  const [muted, setMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("sonar-player-muted") === "1";
  });

  // 倍速 / 音量 / 静音应用到音频元素（切换曲目时也要保持）
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.playbackRate = rate;
    a.volume = muted ? 0 : volume;
  }, [rate, volume, muted, current]);

  // 持久化播放偏好
  useEffect(() => {
    window.localStorage.setItem("sonar-player-rate", String(rate));
  }, [rate]);
  useEffect(() => {
    window.localStorage.setItem("sonar-player-volume", String(volume));
  }, [volume]);
  useEffect(() => {
    window.localStorage.setItem("sonar-player-muted", muted ? "1" : "0");
  }, [muted]);

  // 键盘快捷键：空格播放/暂停、←/→ 快退快进、↑/↓ 音量（避开输入框/按钮等焦点）
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t) {
        const tag = t.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          tag === "BUTTON" ||
          tag === "AUDIO" ||
          tag === "VIDEO" ||
          t.isContentEditable
        ) {
          return;
        }
      }
      const st = usePlayer.getState();
      if (!st.current) return;
      const a = audioRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        st.toggle();
      } else if (e.code === "ArrowLeft" && a) {
        e.preventDefault();
        a.currentTime = Math.max(0, a.currentTime - 10);
      } else if (e.code === "ArrowRight" && a) {
        e.preventDefault();
        a.currentTime = Math.min(a.duration || 0, a.currentTime + 10);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        setVolume((v) => Math.min(1, Math.round((v + 0.1) * 10) / 10));
        setMuted(false);
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        setVolume((v) => Math.max(0, Math.round((v - 0.1) * 10) / 10));
        setMuted(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current) {
      a.pause();
      a.removeAttribute("src");
      // 与音频元素同步的复位
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(0);
      setDur(0);
      return;
    }
    // 电台直播流（HLS/m3u8）：安卓原生播放器支持 HLS 且不受 CORS 限制，桌面 Chrome 才用 hls.js
    let hls: Hls | null = null;
    const url = current.url;
    const isHls = /\.m3u8($|\?)/i.test(url);
    const nativeHls = a.canPlayType("application/vnd.apple.mpegurl") !== "";
    if (isHls && !nativeHls && Hls.isSupported()) {
      hls = new Hls({ liveDurationInfinity: true });
      hls.attachMedia(a);
      hls.on(Hls.Events.MEDIA_ATTACHED, () => hls?.loadSource(url));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) hls?.destroy();
      });
    } else {
      a.src = url;
    }
    a.play().catch(() => {});
    return () => {
      if (hls) hls.destroy();
    };
  }, [current]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, current]);

  function onEnded() {
    const a = audioRef.current;
    if (!a) return;
    if (mode === "single") {
      a.currentTime = 0;
      a.play().catch(() => {});
    } else {
      next();
    }
  }

  function cycleRate() {
    setRate((r) => PLAY_RATES[(PLAY_RATES.indexOf(r) + 1) % PLAY_RATES.length]);
  }

  async function download() {
    if (!current) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/royalty/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: current.url, name: current.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "下载失败");
      showToast(`已保存：${data.saved}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "下载失败");
    } finally {
      setDownloading(false);
    }
  }

  if (!current) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-line-strong bg-panel-solid/95 backdrop-blur">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={onEnded}
      />

      {showList ? (
        <div className="absolute bottom-full left-0 right-0 max-h-56 overflow-y-auto border-t border-line bg-panel-solid/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-2">
            <div className="mb-1 text-xs opacity-60">播放列表 · {queue.length} 首</div>
            {queue.length === 0 ? (
              <div className="py-2 text-xs opacity-50">（队列为空）</div>
            ) : (
              queue.map((t, i) => (
                <button
                  key={t.url + i}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-[13px] transition hover:bg-red-soft ${
                    i === index ? "text-red" : ""
                  }`}
                  onClick={() => {
                    playAt(i);
                    setShowList(false);
                  }}
                >
                  <span className="w-5 shrink-0 text-right text-[11px] opacity-50">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{htmlEscape(t.title)}</span>
                  <span className="shrink-0 truncate text-[11px] opacity-50">
                    {htmlEscape(t.artist || "佚名")}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2">
        <button
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nred text-sm text-paper transition hover:brightness-110"
          onClick={toggle}
          title={playing ? "暂停" : "播放"}
        >
          {playing ? "❚❚" : "▶"}
        </button>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium" title={current.title}>
            {htmlEscape(current.title)}
          </div>
          <div className="truncate text-xs opacity-60">
            {htmlEscape(current.artist || "佚名")} · {htmlEscape(current.license || "免版权")}
          </div>
        </div>

        <input
          className="hidden w-40 accent-muted sm:block"
          type="range"
          min={0}
          max={dur || 0}
          value={progress}
          onChange={(e) => {
            if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
          }}
        />
        <span className="hidden text-[11px] opacity-60 sm:block">
          {fmtTime(progress)} / {fmtTime(dur)}
        </span>

        <button
          className="shrink-0 text-[11px] opacity-70 transition hover:text-nred"
          onClick={() => setMuted((m) => !m)}
          title={muted || volume === 0 ? "取消静音" : "静音"}
        >
          {muted || volume === 0 ? "静音" : "声音"}
        </button>
        <input
          className="w-14 accent-muted"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => {
            setVolume(Number(e.target.value));
            setMuted(false);
          }}
          title="音量"
        />

        <button
          className="shrink-0 rounded border border-line-strong px-2 py-1 text-[11px] transition hover:border-nred hover:text-nred"
          onClick={cycleMode}
          title={`播放模式：${PLAY_MODE_LABEL[mode]}播放`}
        >
          {PLAY_MODE_LABEL[mode]}
        </button>

        <button
          className="shrink-0 rounded border border-line-strong px-2 py-1 text-[11px] transition hover:border-nred hover:text-nred"
          onClick={cycleRate}
          title={`播放速度：${rate}x（点击切换）`}
        >
          {rate}x
        </button>

        <button
          className="shrink-0 rounded border border-line-strong px-2 py-1 text-[11px] transition hover:border-nred hover:text-nred"
          onClick={() => setShowList((v) => !v)}
          title="播放列表"
        >
          列表（{queue.length}）
        </button>

        <button
          className="text-sm opacity-70 transition hover:text-nred"
          onClick={prev}
          title="上一首"
        >
          ⏮
        </button>
        <button
          className="text-sm opacity-70 transition hover:text-nred"
          onClick={next}
          title="下一首"
        >
          ⏭
        </button>

        <button
          className="shrink-0 rounded-md border border-line-strong px-2.5 py-1 text-xs transition hover:border-nred hover:text-nred disabled:opacity-60"
          disabled={downloading}
          onClick={download}
          title="下载到本地 music 目录"
        >
          {downloading ? "保存中…" : "下载"}
        </button>
      </div>
    </div>
  );
}
