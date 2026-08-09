// 声呐客户端状态：文章 + 向量索引 + 检索 + 偏好（夜版/已读/稍后读/字号）持久化
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ArticleItem } from "@/lib/article";
import {
  buildIndex,
  cosine,
  retrieve,
  tokenize,
  vectorize,
  type IdfTable,
  type SparseVector,
} from "@/lib/rag";

export type CatKey = "榜单" | "现场" | "戏曲" | "播一会儿" | "古籍" | "拌嘴";

export type Theme = "day" | "night" | "eye";

export type Engine = "dynamic" | "static" | "filter" | "filter+";
export const ENGINE_LABEL: Record<Engine, string> = {
  dynamic: "动态",
  static: "静态",
  filter: "过滤",
  "filter+": "过滤+",
};

export interface SearchHit {
  i: number;
  s: number;
  hits: number;
}

export interface Progress {
  ok: number;
  fail: number;
  total: number;
  inserted: number;
}

interface JournalState {
  articles: ArticleItem[];
  idx: SparseVector[];
  idf: IdfTable;
  cat: CatKey;
  q: string;
  qToks: string[];
  results: SearchHit[] | null;
  theme: Theme;
  engine: Engine;
  a11y: { large: boolean; contrast: boolean };
  read: string[];
  later: string[];
  modalFont: number;
  modalId: string | null;
  refreshing: boolean;
  progress: Progress | null;
  toast: string | null;

  setArticles: (a: ArticleItem[]) => void;
  setCat: (c: CatKey) => void;
  doSearch: (q: string) => void;
  clearSearch: () => void;
  cycleTheme: () => void;
  setEngine: (e: Engine) => void;
  toggleA11y: (k: "large" | "contrast") => void;
  openArticle: (id: string) => void;
  closeArticle: () => void;
  toggleLater: (id: string) => void;
  setFont: (n: number) => void;
  setRefreshing: (b: boolean) => void;
  setProgress: (p: Progress | null) => void;
  showToast: (msg: string | null) => void;
}

export const useJournal = create<JournalState>()(
  persist(
    (set, get) => ({
      articles: [],
      idx: [],
      idf: {},
      cat: "榜单",
      q: "",
      qToks: [],
      results: null,
      theme: "day",
      engine: "dynamic",
      a11y: { large: false, contrast: false },
      read: [],
      later: [],
      modalFont: 17,
      modalId: null,
      refreshing: false,
      progress: null,
      toast: null,

      setArticles: (a) => {
        const { idx, idf } = buildIndex(a);
        set({ articles: a, idx, idf });
      },

      setCat: (c) => set({ cat: c, q: "", qToks: [], results: null }),

      // RAG 检索：向量 topN + 关键词命中重排 + 高亮 token
      doSearch: (raw) => {
        const q = String(raw || "").trim();
        const { articles, idx, idf } = get();
        if (!q || !idx.length) {
          set({ q, qToks: [], results: null });
          return;
        }
        const toks = tokenize(q);
        if (!toks.length) {
          set({ q, qToks: [], results: null });
          return;
        }
        const qvec = vectorize(toks, idf);
        const top = retrieve(qvec, idx, 20);
        const lower = q.toLowerCase();
        const scored = top
          .map(({ i, s }) => {
            const a = articles[i];
            const text = `${a.title} ${a.desc}`.toLowerCase();
            let hits = 0;
            for (const t of toks) if (text.includes(t)) hits++;
            if (lower.length > 1 && a.title.toLowerCase().includes(lower)) hits += 2;
            return { i, s: s + hits * 0.25, hits };
          })
          .sort((x, y) => y.s - x.s)
          .slice(0, 30);
        set({ q, qToks: toks, results: scored });
      },

      clearSearch: () => set({ q: "", qToks: [], results: null }),

      cycleTheme: () => {
        const order: Theme[] = ["day", "night", "eye"];
        const cur = get().theme;
        set({ theme: order[(order.indexOf(cur) + 1) % order.length] });
      },
      setEngine: (e) => set({ engine: e }),
      toggleA11y: (k) =>
        set((s) => ({ a11y: { ...s.a11y, [k]: !s.a11y[k] } })),

      openArticle: (id) => {
        const read = get().read;
        set({ modalId: id, read: read.includes(id) ? read : [...read, id] });
      },
      closeArticle: () => set({ modalId: null }),

      toggleLater: (id) => {
        const later = get().later;
        set({
          later: later.includes(id) ? later.filter((x) => x !== id) : [...later, id],
        });
      },

      setFont: (n) => set({ modalFont: Math.max(13, Math.min(26, n)) }),
      setRefreshing: (b) => set({ refreshing: b }),
      setProgress: (p) => set({ progress: p }),
      showToast: (msg) => set({ toast: msg }),
    }),
    {
      name: "sonar-journal",
      partialize: (s) => ({
        theme: s.theme,
        engine: s.engine,
        a11y: s.a11y,
        read: s.read,
        later: s.later,
        modalFont: s.modalFont,
      }),
    },
  ),
);

/** 便捷：按 id 取文章（供列表/焦点/模态框共用） */
export function findArticle(id: string): ArticleItem | undefined {
  return useJournal.getState().articles.find((a) => a.id === id);
}

/** 便捷：余弦参考（供词云展示等） */
export { cosine };
