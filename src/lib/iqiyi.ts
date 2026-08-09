// 爱奇艺视频搜索：公开搜索 JSON 接口（无需 key，浏览器 UA + Referer 即可）
// 过滤付费/VIP 内容，仅保留免费可看；链接跳转到爱奇艺原页（不支持内嵌播放）
import { httpsGet } from "@/lib/http";

export interface IqiyiItem {
  title: string;
  url: string;
  thumb: string;
  channel: string;
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function toHttps(u: string): string {
  return String(u || "").replace(/^http:\/\//i, "https://");
}

export async function searchIqiyi(q: string, limit = 12): Promise<IqiyiItem[]> {
  const params = new URLSearchParams({
    key: q,
    if: "html5",
    pageNum: "1",
    pageSize: String(Math.min(30, Math.max(1, limit))),
  });
  const { status, buf } = await httpsGet(
    `https://search.video.iqiyi.com/o?${params}`,
    20000,
    UA,
    { Referer: "https://www.iqiyi.com/" },
  );
  if (status !== 200) throw new Error(`爱奇艺接口 HTTP ${status}`);
  const data = JSON.parse(buf.toString("utf8")) as {
    data?: { code?: number; docinfos?: { albumDocInfo?: Record<string, unknown> }[] };
  };
  const docs = data?.data?.docinfos ?? [];
  const out: IqiyiItem[] = [];
  for (const d of docs) {
    const a = d.albumDocInfo ?? {};
    const title = String(a.albumTitle ?? "").trim().slice(0, 160);
    const url = String(a.albumLink ?? "").trim();
    if (!title || !url) continue;
    if (Number(a.isPurchase) > 0) continue; // 只保留免费可看
    out.push({
      title,
      url,
      thumb: toHttps(String(a.albumVImage ?? a.albumHImage ?? "")),
      channel: String(a.channel ?? "").split(",")[0].slice(0, 40),
    });
  }
  return out.slice(0, limit);
}
