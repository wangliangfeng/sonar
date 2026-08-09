// 全球音乐榜单：Apple Music 官方 RSS 榜单（无需 key），返回排名/曲名/歌手/专辑/封面
// 直接访问最终地址 rss.marketingtools.apple.com，避免 301 重定向
import { httpsGet } from "@/lib/http";

export interface ChartItem {
  rank: number;
  title: string;
  artist: string;
  album: string;
  url: string;
  cover: string;
}

const HOST = "https://rss.marketingtools.apple.com/api/v2";

// 服务端内存缓存（TTL 15 分钟），避免重复/多组件加载反复请求 Apple
const cache = new Map<string, { ts: number; items: ChartItem[] }>();
const TTL = 15 * 60 * 1000;

export async function fetchChart(
  region: string,
  kind: "songs" | "albums",
  limit = 20,
): Promise<ChartItem[]> {
  const key = `${region}:${kind}:${limit}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL) return hit.items;

  const url = `${HOST}/${region}/music/most-played/${Math.min(50, Math.max(1, limit))}/${kind}.json`;
  const { status, buf } = await httpsGet(url, 25000);
  if (status !== 200) throw new Error(`榜单接口 HTTP ${status}`);
  const data = JSON.parse(buf.toString("utf8")) as {
    feed?: { results?: { name?: string; artistName?: string; collectionName?: string; artworkUrl100?: string; url?: string }[] };
  };
  const results = data?.feed?.results ?? [];
  const items: ChartItem[] = results
    .map((r, i) => ({
      rank: i + 1,
      title: String(r.name ?? "").slice(0, 160),
      artist: String(r.artistName ?? "").slice(0, 120),
      album: String(r.collectionName ?? "").slice(0, 120),
      url: String(r.url ?? ""),
      // 放大封面 100x100 → 300x300
      cover: String(r.artworkUrl100 ?? "").replace(/100x100bb/g, "300x300bb"),
    }))
    .filter((x) => x.title && x.artist);
  cache.set(key, { ts: Date.now(), items });
  return items;
}
