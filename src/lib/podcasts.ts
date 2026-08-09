// 播一会儿 · 精选音乐播客（标准 RSS 分发，含音频 enclosure，播放器可直接播放）
import { XMLParser } from "fast-xml-parser";
import { httpsGet } from "@/lib/http";
import type { PodcastFeed } from "@/lib/podcastFeeds";

export type { PodcastFeed } from "@/lib/podcastFeeds";
export { PODCAST_FEEDS } from "@/lib/podcastFeeds";

export interface PodcastEpisode {
  title: string;
  url: string;
  duration: string;
  pubTs: number | null;
  desc: string;
}

interface RawItem {
  title?: unknown;
  enclosure?: unknown;
  pubDate?: unknown;
  description?: unknown;
  ["itunes:duration"]?: unknown;
}

function toStr(v: unknown): string {
  return String(v ?? "").trim();
}

export async function fetchPodcast(
  feed: PodcastFeed,
  limit = 15,
): Promise<{ name: string; image: string; episodes: PodcastEpisode[] }> {
  const { status, buf } = await httpsGet(feed.rss, 25000);
  if (status !== 200) throw new Error(`RSS HTTP ${status}`);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    trimValues: true,
  });
  const doc = parser.parse(buf.toString("utf8")) as {
    rss?: { channel?: { title?: unknown; image?: { url?: unknown }; ["itunes:image"]?: { "@_href"?: string }; item?: unknown } };
  };
  const channel = doc?.rss?.channel ?? {};
  const image = toStr(channel?.["itunes:image"]?.["@_href"]) || toStr(channel?.image?.url);
  const raw = channel?.item;
  const items: RawItem[] = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const episodes: PodcastEpisode[] = [];
  for (const it of items) {
    const title = toStr(it.title);
    const enc = it.enclosure as { "@_url"?: unknown } | undefined;
    const url = toStr(enc?.["@_url"]);
    if (!title || !url) continue;
    episodes.push({
      title: title.slice(0, 180),
      url,
      duration: toStr(it["itunes:duration"]).slice(0, 40),
      pubTs: it.pubDate ? Date.parse(toStr(it.pubDate)) || null : null,
      desc: toStr(it.description)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .slice(0, 200),
    });
  }
  return {
    name: toStr(channel.title).slice(0, 80) || feed.name,
    image,
    episodes: episodes.slice(0, limit),
  };
}
