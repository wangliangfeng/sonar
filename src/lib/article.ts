// 客户端共享类型与工具（无服务端依赖，可被组件安全引用）

export interface ArticleItem {
  id: string; // linkHash
  sourceId: number | null;
  sourceName: string;
  title: string;
  link: string;
  desc: string;
  author: string;
  category: string; // 乐评 / 榜单 / 新专 / 现场
  pubTs: number | null; // 毫秒
}

export function htmlEscape(s: string): string {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string;
  });
}

export function stripHtml(h: string): string {
  return String(h || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function trimText(s: string, n: number): string {
  s = String(s || "").trim();
  return s.length > n ? s.slice(0, n) + "…" : s;
}

export function fmtTime(ms: number | null): string {
  if (!ms) return "";
  const diff = Date.now() - ms;
  const d = new Date(ms);
  const p = (x: number) => (x < 10 ? "0" + x : "" + x);
  if (diff < 60e3) return "刚刚";
  if (diff < 3600e3) return Math.floor(diff / 60e3) + " 分钟前";
  if (diff < 86400e3) return Math.floor(diff / 3600e3) + " 小时前";
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function escRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 高亮：把命中 token 用 <mark> 包裹（调用方负责先 htmlEscape） */
export function highlight(text: string, toks: string[]): string {
  let esc = htmlEscape(text);
  for (const t of toks) {
    if (!t) continue;
    const re = new RegExp(escRe(t), "gi");
    esc = esc.replace(re, (m0) => "<mark>" + m0 + "</mark>");
  }
  return esc;
}
