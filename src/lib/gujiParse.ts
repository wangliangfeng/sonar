// 古籍文档解析：EPUB / HTML / TXT → [{ name, lines }]
// EPUB 按 spine 顺序逐章拆条（章标题为条名），TXT/HTML 作为单条
import { unzipSync, strFromU8 } from "fflate";

export interface GujiEntry {
  name: string;
  lines: string[];
}

function clean(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, c: string) => String.fromCodePoint(Number(c)))
    .replace(/ /g, " ")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function htmlTitle(html: string): string {
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (t && clean(t)) return clean(t);
  const h = html.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
  return h ? clean(h) : "";
}

function htmlLines(html: string): string[] {
  const body = html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const lines: string[] = [];
  for (const m of body.matchAll(/<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const t = clean(m[2]);
    if (t) lines.push(t);
  }
  return lines;
}

export function parseHtmlEntry(html: string, fallbackName: string): GujiEntry {
  return { name: htmlTitle(html) || fallbackName, lines: htmlLines(html) };
}

function parseTxt(text: string, name: string): GujiEntry {
  const lines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return { name: name || "正文", lines };
}

function resolveFile(files: Record<string, Uint8Array>, p: string): Uint8Array | undefined {
  const norm = (s: string) => s.replace(/\\/g, "/").replace(/^\/+/, "");
  const direct = files[norm(p)];
  if (direct) return direct;
  const base = norm(p).split("/").pop()!;
  for (const k of Object.keys(files)) {
    if (norm(k).split("/").pop() === base) return files[k];
  }
  return undefined;
}

export function parseEpub(buf: Uint8Array): GujiEntry[] {
  const files = unzipSync(buf);
  const container = resolveFile(files, "META-INF/container.xml");
  if (!container) return [];
  const opfRel = strFromU8(container).match(/full-path\s*=\s*"([^"]+)"/)?.[1];
  if (!opfRel) return [];
  const opfText = strFromU8(resolveFile(files, opfRel) ?? new Uint8Array());
  if (!opfText) return [];

  const manifest = new Map<string, string>();
  for (const m of opfText.matchAll(/<item\b[^>]*>/g)) {
    const id = m[0].match(/id\s*=\s*"([^"]+)"/)?.[1];
    const href = m[0].match(/href\s*=\s*"([^"]+)"/)?.[1];
    if (id && href) manifest.set(id, href);
  }
  const hrefs: string[] = [];
  for (const m of opfText.matchAll(/<itemref\b[^>]*>/g)) {
    const idref = m[0].match(/idref\s*=\s*"([^"]+)"/)?.[1];
    if (idref && manifest.has(idref)) hrefs.push(manifest.get(idref)!);
  }

  const baseDir = opfRel.includes("/") ? opfRel.slice(0, opfRel.lastIndexOf("/") + 1) : "";
  const entries: GujiEntry[] = [];
  const seen = new Set<string>();
  for (let href of hrefs) {
    href = href.split("#")[0];
    let key = href;
    try {
      key = decodeURIComponent(href);
    } catch {
      /* 保留原样 */
    }
    if (seen.has(key)) continue;
    seen.add(key);
    const content = resolveFile(files, baseDir + key);
    if (!content) continue;
    const html = strFromU8(content);
    if (!/<(p|h[1-6])\b/i.test(html)) continue; // 跳过图片页/封面
    const entry = parseHtmlEntry(html, `第${entries.length + 1}篇`);
    if (entry.lines.length === 0) continue;
    if (/^(cover|bookcover|coverpage|titlepage|封面|封底|扉页)$/i.test(entry.name)) continue;
    entries.push(entry);
  }
  return entries;
}

// 统一入口：按扩展名分派解析
export function parseUpload(buf: Uint8Array, filename: string, title: string): GujiEntry[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".epub")) return parseEpub(buf);
  if (lower.endsWith(".html") || lower.endsWith(".htm") || lower.endsWith(".xhtml")) {
    return [parseHtmlEntry(new TextDecoder("utf-8").decode(buf), title)];
  }
  return [parseTxt(new TextDecoder("utf-8").decode(buf), title)];
}
