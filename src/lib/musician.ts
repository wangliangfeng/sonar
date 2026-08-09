// 音乐人百科：Wikidata（姓名+简介）+ Wikimedia Commons（头像+图注），均为开放接口
import { httpsGet } from "@/lib/http";

export interface Musician {
  name: string;
  description: string;
  bio: string;
  image: string;
  sourceUrl: string;
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

async function wikidataLookup(q: string): Promise<{ label: string; desc: string }> {
  const params = new URLSearchParams({
    action: "wbsearchentities",
    search: q,
    language: "zh",
    format: "json",
    limit: "1",
  });
  const { status, buf } = await httpsGet(`https://www.wikidata.org/w/api.php?${params}`, 12000);
  if (status !== 200) return { label: q, desc: "" };
  const data = JSON.parse(buf.toString("utf8")) as {
    search?: {
      label?: string;
      description?: string;
      display?: { label?: { value?: string }; description?: { value?: string } };
    }[];
  };
  const first = data?.search?.[0];
  return {
    label: first?.display?.label?.value ?? first?.label ?? q,
    desc: first?.display?.description?.value ?? first?.description ?? "",
  };
}

async function commonsImage(q: string): Promise<{ image: string; bio: string; sourceUrl: string }> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${q} filemime:image`,
    gsrnamespace: "6",
    gsrlimit: "1",
    prop: "imageinfo",
    iiprop: "url|thumb|extmetadata|size",
    iiurlwidth: "400",
  });
  try {
    const { status, buf } = await httpsGet(`https://commons.wikimedia.org/w/api.php?${params}`, 15000);
    if (status !== 200) return { image: "", bio: "", sourceUrl: "" };
    const data = JSON.parse(buf.toString("utf8")) as {
      query?: {
        pages?: {
          title?: string;
          imageinfo?: {
            url?: string;
            thumburl?: string;
            extmetadata?: { ImageDescription?: { value?: string } };
          }[];
        }[];
      };
    };
    const page = data?.query?.pages?.[0];
    const info = page?.imageinfo?.[0];
    const bio = stripHtml(info?.extmetadata?.ImageDescription?.value ?? "");
    return {
      image: info?.thumburl ?? info?.url ?? "",
      bio: bio.slice(0, 800),
      sourceUrl: page?.title ? `https://commons.wikimedia.org/wiki/${page.title.replace(/ /g, "_")}` : "",
    };
  } catch {
    return { image: "", bio: "", sourceUrl: "" };
  }
}

export async function lookupMusician(q: string): Promise<Musician> {
  const { label, desc } = await wikidataLookup(q);
  const { image, bio, sourceUrl } = await commonsImage(label);
  return {
    name: label || q,
    description: desc,
    bio: bio || (desc ? "" : "（未找到详细图注，可尝试其他写法或英文名）"),
    image,
    sourceUrl,
  };
}
