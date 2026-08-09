// 搜索词增强：中文人名/词条 → Wikidata 英文标签（如「郎朗」→ Lang Lang），提升 Commons 检索命中率
import { httpsGet } from "@/lib/http";

const CACHE = new Map<string, string>();

export async function enrichSearch(q: string): Promise<string> {
  const query = String(q || "").trim();
  if (!query) return query;
  if (!/[一-鿿]/.test(query)) return query; // 非中文无需解析
  if (CACHE.has(query)) return CACHE.get(query)!;

  let eff = query;
  try {
    const params = new URLSearchParams({
      action: "wbsearchentities",
      search: query,
      language: "zh",
      format: "json",
      limit: "3",
      props: "labels",
    });
    const { status, buf } = await httpsGet(`https://www.wikidata.org/w/api.php?${params}`, 6000, undefined, undefined, 0);
    if (status === 200) {
      const data = JSON.parse(buf.toString("utf8")) as {
        search?: {
          label?: string;
          description?: string;
          display?: { label?: { value?: string } };
          labels?: Record<string, { value?: string }>;
        }[];
      };
      const first = data?.search?.[0];
      const anyLabel =
        first?.display?.label?.value ??
        first?.label ??
        Object.values(first?.labels ?? {})[0]?.value;
      if (anyLabel && anyLabel.trim().toLowerCase() !== query.toLowerCase()) {
        eff = `${anyLabel} ${query}`;
      }
    }
  } catch {
    // 解析失败则用原词
  }
  CACHE.set(query, eff);
  return eff;
}
