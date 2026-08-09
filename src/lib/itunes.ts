// iTunes 官方搜索：返回代表作 30 秒试听 + 官方链接 + 封面（免 key）
import { httpsGet } from "@/lib/http";
import { db } from "@/db";
import { royaltyCache } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sha1Hex } from "@/lib/rss";

export interface PreviewInfo {
  trackName: string;
  artistName: string;
  previewUrl: string;
  trackViewUrl: string;
  artworkUrl: string;
}

const TTL = 7 * 24 * 60 * 60 * 1000;

export async function findPreview(q: string): Promise<PreviewInfo | null> {
  const key = sha1Hex(`preview:${q}`);
  try {
    const [row] = await db
      .select()
      .from(royaltyCache)
      .where(eq(royaltyCache.key, key))
      .limit(1);
    if (row?.payload && Date.now() - new Date(row.ts ?? 0).getTime() < TTL) {
      return row.payload as unknown as PreviewInfo;
    }
  } catch {
    // 缓存不可用则实时取
  }

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=1`;
  const { status, buf } = await httpsGet(
    url,
    20000,
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
  );
  if (status !== 200) return null;
  const data = JSON.parse(buf.toString("utf8")) as {
    results?: {
      trackName?: string;
      artistName?: string;
      previewUrl?: string;
      trackViewUrl?: string;
      artworkUrl100?: string;
    }[];
  };
  const r = data.results?.[0];
  if (!r?.previewUrl) return null;
  const info: PreviewInfo = {
    trackName: String(r.trackName ?? ""),
    artistName: String(r.artistName ?? ""),
    previewUrl: r.previewUrl,
    trackViewUrl: String(r.trackViewUrl ?? ""),
    artworkUrl: String(r.artworkUrl100 ?? ""),
  };
  try {
    await db
      .insert(royaltyCache)
      .values({ key, payload: info as unknown as object })
      .onDuplicateKeyUpdate({ set: { payload: info as unknown as object, ts: new Date() } });
  } catch {
    // 写缓存失败忽略
  }
  return info;
}
