// 设计资讯：官方 RSS 聚合（少数派 / 数英网 / Dezeen）
import { httpsGet } from "@/lib/http";
import { parseFeed } from "@/lib/rss";

export interface DesignSource {
  id: string;
  name: string;
  desc: string;
  rss: string;
}

export interface DesignArticle {
  source: string;
  title: string;
  link: string;
  desc: string;
  author: string;
  pubTs: number | null;
}

// 均已实测可达的官方 RSS
export const DESIGN_SOURCES: DesignSource[] = [
  { id: "sspai", name: "少数派", desc: "数字工具与效率 · 设计与生活", rss: "https://sspai.com/feed" },
  { id: "digitaling", name: "数英网", desc: "广告 · 创意 · 设计案例", rss: "https://www.digitaling.com/rss" },
  { id: "dezeen", name: "Dezeen", desc: "全球设计媒体 · 建筑/产品/室内", rss: "https://www.dezeen.com/feed" },
];

export async function fetchDesignFeed(src: DesignSource, limit = 12): Promise<DesignArticle[]> {
  const { status, buf } = await httpsGet(src.rss, 20000);
  if (status !== 200) throw new Error(`HTTP ${status}`);
  const items = parseFeed(buf.toString("utf8"));
  return items.slice(0, limit).map((it) => ({
    source: src.name,
    title: it.title,
    link: it.link,
    desc: it.desc,
    author: it.author,
    pubTs: it.pubTs,
  }));
}
