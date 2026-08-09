// 声呐 · SONAR —— 音乐频道定义
// 每个源一条：名称 / RSS 地址 / 所属频道（决定卡片徽标色）

export type CategoryKey = "乐评" | "榜单" | "新专" | "现场";

export interface MusicSource {
  name: string;
  url: string;
  category: CategoryKey;
}

export const CATEGORIES: {
  key: CategoryKey | "戏曲" | "播一会儿" | "古籍" | "拌嘴";
  label: string;
}[] = [
  { key: "榜单", label: "榜单" },
  { key: "现场", label: "现场" },
  { key: "戏曲", label: "戏曲·戏剧" },
  { key: "播一会儿", label: "播一会儿" },
  { key: "古籍", label: "古籍" },
  { key: "拌嘴", label: "拌嘴" },
];

// 源均经实际探测验证可用（拒绝爬虫，仅抓官方 RSS）—— 仅保留国内中文源
export const MUSIC_SOURCES: MusicSource[] = [
  /* ===== 乐评 · Reviews（国内中文源） ===== */
  { name: "中新网·文化", url: "https://www.chinanews.com.cn/rss/culture.xml", category: "乐评" },
];

// 频道徽标色（与 globals.css 的 --mod-* 对应）
export const CATEGORY_COLOR: Record<CategoryKey, string> = {
  乐评: "var(--mod-reviews)",
  榜单: "var(--mod-charts)",
  新专: "var(--mod-releases)",
  现场: "var(--mod-live)",
};
