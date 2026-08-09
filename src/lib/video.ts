// 音乐视频（含音乐人采访）：Wikimedia Commons 开放接口（CC/公有领域，无需 key）
// 缩略图取 imageinfo.thumburl，时长取 videoinfo.duration
import { httpsGet } from "@/lib/http";
import { enrichSearch } from "@/lib/wikidata";

export interface VideoItem {
  title: string;
  url: string;
  thumb: string;
  duration: number;
  mime: string;
  license: string;
}

function stripHtml(s: string): string {
  return String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export async function searchVideos(q: string, limit = 16): Promise<VideoItem[]> {
  const eff = await enrichSearch(q); // 中文名 → 英文标签
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${eff} filemime:video`,
    gsrnamespace: "6",
    gsrlimit: String(Math.min(40, Math.max(1, limit))),
    prop: "imageinfo|videoinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "360",
    viprop: "duration",
  });
  const { status, buf } = await httpsGet(`https://commons.wikimedia.org/w/api.php?${params}`, 6000, undefined, undefined, 0);
  if (status !== 200) throw new Error(`Commons API HTTP ${status}`);
  const data = JSON.parse(buf.toString("utf8")) as {
    query?: {
      pages?: {
        title?: string;
        imageinfo?: { url?: string; mime?: string; thumburl?: string; extmetadata?: { LicenseShortName?: { value?: string } } }[];
        videoinfo?: { duration?: number }[];
      }[];
    };
  };
  const out: VideoItem[] = [];
  for (const p of data?.query?.pages ?? []) {
    const info = p.imageinfo?.[0];
    const mime = String(info?.mime || "");
    if (!info?.url || !mime.startsWith("video")) continue;
    out.push({
      title: String(p.title ?? "").replace(/^File:/, "").slice(0, 180),
      url: info.url,
      thumb: info.thumburl ?? "",
      duration: p.videoinfo?.[0]?.duration ?? 0,
      mime,
      license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? "").slice(0, 60),
    });
  }
  return out;
}
