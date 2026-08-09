// 作者简介：Wikidata 中文描述（国内可达的开放接口），用于获奖作者快速介绍
import { httpsGet } from "@/lib/http";

export interface AuthorInfo {
  name: string;
  desc: string;
  wikidataUrl: string;
}

export async function authorIntro(name: string): Promise<AuthorInfo | null> {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: name,
    language: "zh",
    format: "json",
    limit: "1",
  });
  try {
    const { status, buf } = await httpsGet(`https://www.wikidata.org/w/api.php?${params}`, 12000);
    if (status !== 200) return null;
    const d = JSON.parse(buf.toString("utf8")) as {
      search?: {
        id?: string;
        label?: string;
        description?: string;
        display?: { label?: { value?: string }; description?: { value?: string } };
      }[];
    };
    const f = d?.search?.[0];
    if (!f) return null;
    return {
      name: f?.display?.label?.value ?? f?.label ?? name,
      desc: f?.display?.description?.value ?? f?.description ?? "",
      wikidataUrl: f?.id ? `https://www.wikidata.org/wiki/${f.id}` : "",
    };
  } catch {
    return null;
  }
}
