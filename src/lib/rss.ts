// 服务端 RSS 抓取与解析（Next.js 服务端无 CORS 限制，无需代理链）
import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

export interface ParsedItem {
  title: string;
  link: string;
  desc: string;
  author: string;
  pubTs: number | null;
}

/** 稳定哈希：MySQL 5.7 唯一索引用固定长度 hash 列去重 */
export function sha1Hex(s: string): string {
  return createHash("sha1").update(String(s)).digest("hex");
}

export async function fetchFeedText(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text || text.length < 40) throw new Error("内容过短");
  return text;
}

function stripHtml(html: string): string {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(node: unknown, names: string[]): string {
  const n = node as Record<string, unknown> | undefined;
  if (!n) return "";
  for (const name of names) {
    let v = n[name];
    if (v == null) continue;
    if (typeof v === "object") {
      const o = v as Record<string, unknown>;
      v = o["#text"] ?? o["@_href"] ?? "";
    }
    const s = String(v).trim();
    if (s) return s;
  }
  return "";
}

export function parseFeed(xml: string): ParsedItem[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    trimValues: true,
  });
  const doc = parser.parse(xml) as {
    rss?: { channel?: { item?: unknown } };
    feed?: { entry?: unknown };
  };
  const channel = doc?.rss?.channel;
  let raw: unknown[] = [];
  let kind: "rss" | "atom" = "rss";
  if (channel) {
    const item = channel.item;
    raw = Array.isArray(item) ? item : item ? [item] : [];
  } else if (doc?.feed?.entry) {
    const entry = doc.feed.entry;
    raw = Array.isArray(entry) ? entry : [entry];
    kind = "atom";
  }

  const out: ParsedItem[] = [];
  for (const it of raw) {
    const title = pick(it, ["title"]);
    if (!title) continue;
    let link = "";
    if (kind === "atom") {
      const links = (it as Record<string, unknown>)?.["link"];
      if (Array.isArray(links)) {
        const alt = links.find(
          (l) => (l as Record<string, unknown>)?.["@_rel"] === "alternate",
        ) ?? links[0];
        link = String((alt as Record<string, unknown>)?.["@_href"] ?? "").trim();
      } else {
        link = String((links as Record<string, unknown>)?.["@_href"] ?? "").trim();
      }
    } else {
      const rawLink = (it as Record<string, unknown>)?.["link"];
      link = String(
        typeof rawLink === "object"
          ? ((rawLink as Record<string, unknown>)?.["#text"] ?? "")
          : rawLink ?? "",
      ).trim();
    }
    if (!link) continue;
    const desc = stripHtml(pick(it, ["description", "summary", "content:encoded", "content"]));
    const author = pick(it, ["dc:creator", "creator", "author", "name"]);
    const pubRaw = pick(it, ["pubDate", "published", "updated", "date"]);
    const pubTs = pubRaw ? Date.parse(pubRaw) || null : null;
    out.push({ title, link, desc, author, pubTs });
  }
  return out;
}
