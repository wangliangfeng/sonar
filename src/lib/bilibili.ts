// Bilibili 免费戏曲/音乐视频搜索（官方公开接口，需先取 buvid3 cookie 防 412）
import { httpsGet } from "@/lib/http";

export interface BiliVideo {
  bvid: string;
  title: string;
  author: string;
  pic: string;
  play: number;
  duration: string;
  arcurl: string;
}

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

let buvidCookie: string | null = null;

async function getBuvidCookie(): Promise<string> {
  if (buvidCookie) return buvidCookie;
  try {
    const { status, buf } = await httpsGet(
      "https://api.bilibili.com/x/frontend/finger/spi",
      15000,
      BROWSER_UA,
    );
    if (status === 200) {
      const d = JSON.parse(buf.toString("utf8")) as { data?: { b_3?: string } };
      if (d?.data?.b_3) buvidCookie = `buvid3=${d.data.b_3}`;
    }
  } catch {
    // 取不到则无 cookie 重试
  }
  return buvidCookie ?? "";
}

function toVideo(r: Record<string, unknown>): BiliVideo | null {
  const bvid = String(r.bvid ?? "");
  const title = String(r.title ?? "").replace(/<[^>]+>/g, "").slice(0, 200);
  if (!bvid || !title) return null;
  return {
    bvid,
    title,
    author: String(r.author ?? "").slice(0, 120),
    pic: String(r.pic ?? ""),
    play: Number(r.play ?? 0),
    duration: String(r.duration ?? ""),
    arcurl: String(r.arcurl ?? ""),
  };
}

type Json = { code?: number; message?: string; data?: { result?: unknown } };

export async function searchBilibili(q: string, limit = 20): Promise<BiliVideo[]> {
  const cookie = await getBuvidCookie();
  const headers = cookie ? { Cookie: cookie } : undefined;
  const qs = encodeURIComponent(q);

  // 主端点
  const r1 = await httpsGet(
    `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${qs}&page=1`,
    20000,
    BROWSER_UA,
    headers,
  );
  if (r1.status === 200) {
    const d1 = JSON.parse(r1.buf.toString("utf8")) as Json;
    const res1 = d1.data?.result;
    if (d1.code === 0 && Array.isArray(res1)) {
      return (res1 as Record<string, unknown>[])
        .map(toVideo)
        .filter((v): v is BiliVideo => v !== null)
        .slice(0, limit);
    }
  }

  // 回退端点：search/all/v2（type 被风控 412 时可用）
  const r2 = await httpsGet(
    `https://api.bilibili.com/x/web-interface/search/all/v2?keyword=${qs}`,
    20000,
    BROWSER_UA,
    headers,
  );
  if (r2.status === 200) {
    const d2 = JSON.parse(r2.buf.toString("utf8")) as {
      code?: number;
      data?: { result?: { result_type?: string; data?: Record<string, unknown>[] }[] };
    };
    if (d2.code === 0) {
      const videoSection = (d2.data?.result ?? []).find((s) => s?.result_type === "video");
      return (videoSection?.data ?? [])
        .map(toVideo)
        .filter((v): v is BiliVideo => v !== null)
        .slice(0, limit);
    }
  }
  throw new Error("B站搜索失败（风控或接口不可用）");
}
