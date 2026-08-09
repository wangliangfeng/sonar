// 声呐 RAG —— 纯浏览器端向量检索（移植自「蚊子」算法）
// 流程：tokenize → featureHash → 稀疏 256 维向量 → IDF 加权 → 余弦相似度 → topN

export const STOP: Set<string> = new Set(
  "的 了 和 是 在 我 有 就 不 人 都 一 一个 上 也 很 到 说 要 去 你 会 着 没有 看 好 自己 这 那 与 及 或 等 之 其 它 他 她 们 而 但 并 又 还 被 把 让 给 为 对 从 向 于 因 由 以 我们 他们 这个 那个 什么 怎么 可以 已经 进行 通过 以及 或者 不是 就是 但是 因为 所以 如果 虽然 然后 现在 时候 地方 东西 觉得 知道 成为 开始 发现 认为 世界 生活 人们 文化 作品 艺术 文学 内容 文章 评论 作者 读者 记者 编辑 出版 发布 报道 关于 其中 目前 今天 昨天 明天 今年 去年 时候 the and for are of in to it is as at on by be an or so but not you all any can her was one our out day get has him his how man new now old see two way who boy did its let put say she too use that with have this will your from they know want been good much some time very when come here just like long make many more only over such take than them well were what after about would there their which where could other might still think should before while again never every thing under world being first great these those because something someone nothing everything another around between through during within without against across behind below above under until among both each few next last same only own once also into upon what out up down off over again further then once here there when where why how all both each few more most other some such no nor not only own same so than too very just should now always even again".split(
    " ",
  ),
);

export type SparseVector = Record<number, number>;

/** 中英混合分词：英文单词（≥2 字母，去停用词）+ 中文二元组（去停用词） */
export function tokenize(text: string): string[] {
  const s = String(text || "").toLowerCase();
  const toks: string[] = [];
  const reWord = /[a-z][a-z0-9']{1,}/g;
  let m: RegExpExecArray | null;
  while ((m = reWord.exec(s)) !== null) {
    const w = m[0];
    if (!STOP.has(w)) toks.push(w);
  }
  const reCjk = /[一-鿿]+/g;
  while ((m = reCjk.exec(s)) !== null) {
    const run = m[0];
    for (let i = 0; i < run.length - 1; i++) {
      const bigram = run.substr(i, 2);
      if (!STOP.has(bigram)) toks.push(bigram);
    }
  }
  return toks;
}

/** FNV-1a 32 位哈希：token → 稳定 32 位整数 */
export function featureHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export type IdfTable = Record<string, number>;

/** 计算 IDF：文档频率的逆对数（平滑） */
export function buildIdf(docs: string[]): IdfTable {
  const n = docs.length;
  const df: Record<string, number> = {};
  for (const d of docs) {
    const seen = new Set<string>();
    for (const t of tokenize(d)) {
      if (!seen.has(t)) {
        seen.add(t);
        df[t] = (df[t] || 0) + 1;
      }
    }
  }
  const idf: IdfTable = {};
  for (const k in df) idf[k] = Math.log((1 + n) / (1 + df[k])) + 1;
  return idf;
}

/** 稀疏向量化：维号 = hash % 256，权重 = TF × IDF（无 IDF 时退化 TF） */
export function vectorize(tokens: string[], idf?: IdfTable | null): SparseVector {
  const tf: Record<string, number> = {};
  for (const t of tokens) tf[t] = (tf[t] || 0) + 1;
  const v: SparseVector = {};
  for (const t in tf) {
    const w = tf[t] * (idf && idf[t] ? idf[t] : 1);
    const dim = featureHash(t) % 256;
    v[dim] = (v[dim] || 0) + w;
  }
  return v;
}

/** 余弦相似度（稀疏向量） */
export function cosine(a: SparseVector, b: SparseVector): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const k in a) {
    dot += a[k] * (b[k] || 0);
    na += a[k] * a[k];
  }
  for (const k in b) nb += b[k] * b[k];
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface Scored {
  i: number;
  s: number;
}

/** 检索：对给定查询向量，返回与索引各向量余弦相似度 topN */
export function retrieve(qvec: SparseVector, idx: SparseVector[], topN: number): Scored[] {
  const scored: Scored[] = [];
  for (let i = 0; i < idx.length; i++) scored.push({ i, s: cosine(qvec, idx[i]) });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, topN || 10);
}

export interface RagDoc {
  title: string;
  desc: string;
}

/** 便捷：给定文档集，一次性建索引（返回平行索引） */
export function buildIndex(docs: RagDoc[]): { idx: SparseVector[]; idf: IdfTable } {
  const idf = buildIdf(docs.map((d) => `${d.title} ${d.desc}`));
  const idx = docs.map((d) => vectorize(tokenize(`${d.title} ${d.desc}`), idf));
  return { idx, idf };
}

/** 检索一个查询词串（内部自行分词建查询向量） */
export function search(docs: RagDoc[], idf: IdfTable, idx: SparseVector[], q: string, topN: number): Scored[] {
  const toks = tokenize(q);
  if (!toks.length) return [];
  return retrieve(vectorize(toks, idf), idx, topN);
}
