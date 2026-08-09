// 声呐播放器状态：队列 + 播放控制 + 播放模式（顺序/循环/单曲/随机）
import { create } from "zustand";

export interface PlayerTrack {
  title: string;
  url: string;
  artist: string;
  license: string;
  cover?: string;
}

export type PlayMode = "order" | "repeat" | "single" | "shuffle";
export const PLAY_MODE_LABEL: Record<PlayMode, string> = {
  order: "顺序",
  repeat: "循环",
  single: "单曲",
  shuffle: "随机",
};

interface PlayerState {
  queue: PlayerTrack[];
  index: number;
  playing: boolean;
  current: PlayerTrack | null;
  mode: PlayMode;
  setQueue: (tracks: PlayerTrack[]) => void;
  playAt: (i: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  cycleMode: () => void;
}

const MODE_CYCLE: PlayMode[] = ["order", "repeat", "single", "shuffle"];

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: -1,
  playing: false,
  current: null,
  mode: "order",
  setQueue: (tracks) => set({ queue: tracks }),
  playAt: (i) => {
    const q = get().queue;
    if (i < 0 || i >= q.length) return;
    set({ index: i, current: q[i], playing: true });
  },
  toggle: () => set((s) => ({ playing: !s.playing })),
  next: () => {
    const { queue, index, mode } = get();
    if (!queue.length) return;
    let i: number;
    if (mode === "shuffle" && queue.length > 1) {
      i = (index + 1 + Math.floor(Math.random() * (queue.length - 1))) % queue.length;
    } else {
      i = (index + 1) % queue.length;
    }
    set({ index: i, current: queue[i], playing: true });
  },
  prev: () => {
    const { queue, index } = get();
    if (!queue.length) return;
    const i = (index - 1 + queue.length) % queue.length;
    set({ index: i, current: queue[i], playing: true });
  },
  cycleMode: () => {
    const { mode } = get();
    const i = MODE_CYCLE.indexOf(mode);
    set({ mode: MODE_CYCLE[(i + 1) % MODE_CYCLE.length] });
  },
}));
