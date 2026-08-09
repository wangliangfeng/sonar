// 免版权音乐：Wikimedia Commons 开放接口（仅 CC / 公有领域素材，无需 API key，不用 RSS）
// 用 node:https（Node fetch/undici 连不上 commons，https 模块可稳定连接）
// 每条曲目：作者（extmetadata.Artist）+ 封面（按作者名搜 Commons 图当专辑封面，模块级缓存）
// 下载落盘到 MUSIC_DIR（默认项目根目录下 music/）
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { royaltyCache } from "@/db/schema";
import { sha1Hex } from "@/lib/rss";
import { httpsGet } from "@/lib/http";
import { enrichSearch } from "@/lib/wikidata";

export interface RoyaltyTrack {
  title: string;
  url: string;
  artist: string;
  license: string;
  mime: string;
  size: number;
  cover?: string;
}

const MAX_ARTIST_COVERS = 6; // 每次搜索最多补多少位作者头像，避免 Commons 限流

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

// 作者名 → 封面图 URL（null 表示没有），模块级缓存避免重复请求
const artistCoverCache = new Map<string, string | null>();

async function getArtistCover(artist: string): Promise<string | null> {
  if (artistCoverCache.has(artist)) return artistCoverCache.get(artist) ?? null;
  let cover: string | null = null;
  try {
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      generator: "search",
      gsrsearch: `${artist} filemime:image`,
      gsrnamespace: "6",
      gsrlimit: "1",
      prop: "imageinfo",
      iiprop: "url",
      iiurlwidth: "300",
    });
    const { status, buf } = await httpsGet(`https://commons.wikimedia.org/w/api.php?${params}`, 12000);
    if (status === 200) {
      const data = JSON.parse(buf.toString("utf8")) as {
        query?: { pages?: { imageinfo?: { thumburl?: string; url?: string }[] }[] };
      };
      const info = data?.query?.pages?.[0]?.imageinfo?.[0];
      cover = info?.thumburl ?? info?.url ?? null;
    }
  } catch {
    cover = null;
  }
  artistCoverCache.set(artist, cover);
  return cover;
}

/** 搜索免版权音频：MediaWiki API（generator=search + filemime:audio，File 命名空间） */
export async function searchRoyalty(q: string, limit = 12): Promise<RoyaltyTrack[]> {
  const eff = await enrichSearch(q); // 中文名 → 英文标签
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "search",
    gsrsearch: `${eff} filemime:audio`,
    gsrnamespace: "6",
    gsrlimit: String(Math.min(30, Math.max(1, limit))),
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
  });
  const { status, buf } = await httpsGet(`https://commons.wikimedia.org/w/api.php?${params}`, 25000);
  if (status !== 200) throw new Error(`Commons API HTTP ${status}`);
  const data = JSON.parse(buf.toString("utf8")) as {
    query?: { pages?: { title?: string; imageinfo?: { url?: string; mime?: string; size?: number; extmetadata?: { Artist?: { value?: string }; LicenseShortName?: { value?: string } } }[] }[] };
  };
  const pages = data?.query?.pages ?? [];
  const tracks: RoyaltyTrack[] = [];
  for (const p of pages) {
    const info = p.imageinfo?.[0];
    const mime = String(info?.mime || "");
    if (!info?.url || !mime.startsWith("audio")) continue;
    if (/midi|mid\b/.test(mime)) continue; // 浏览器 <audio> 无法播放 MIDI
    tracks.push({
      title: String(p.title ?? "").replace(/^File:/, "").slice(0, 160),
      url: info.url,
      artist: stripHtml(info.extmetadata?.Artist?.value ?? "").slice(0, 120),
      license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? "").slice(0, 60),
      mime,
      size: info.size ?? 0,
    });
  }

  // 按作者补封面（最多 MAX_ARTIST_COVERS 位作者，顺序请求避免限流）
  const artists = [...new Set(tracks.map((t) => t.artist).filter(Boolean))].slice(0, MAX_ARTIST_COVERS);
  const covers = new Map<string, string | null>();
  for (const a of artists) covers.set(a, await getArtistCover(a));
  for (const t of tracks) {
    const c = covers.get(t.artist);
    if (c) t.cover = c;
  }
  return tracks;
}

// 主题（作曲家/流派）→ 代表作（公有领域，Commons 有大量免费录音）
const WORKS_MAP: Record<string, { match: string[]; works: string[] }> = {
  beethoven: {
    match: ["贝多芬", "beethoven", "ludwig van beethoven"],
    works: [
      "Für Elise Beethoven",
      "Moonlight Sonata Beethoven",
      "Symphony No.5 Beethoven",
      "Ode to Joy Beethoven",
      "Pathétique Sonata Beethoven",
    ],
  },
  mozart: {
    match: ["莫扎特", "mozart", "wolfgang amadeus mozart"],
    works: [
      "Eine kleine Nachtmusik Mozart",
      "Symphony No.40 Mozart",
      "Requiem Mozart",
      "Piano Sonata No.11 Mozart",
      "Piano Concerto No.21 Mozart",
    ],
  },
  bach: {
    match: ["巴赫", "bach", "johann sebastian bach"],
    works: [
      "Air on the G String Bach",
      "Cello Suite No.1 Bach",
      "Toccata and Fugue D minor Bach",
      "Goldberg Variations Bach",
      "Brandenburg Concerto No.3 Bach",
    ],
  },
  chopin: {
    match: ["肖邦", "chopin", "frédéric chopin", "frederic chopin"],
    works: [
      "Nocturne Op.9 No.2 Chopin",
      "Fantaisie-Impromptu Chopin",
      "Ballade No.1 Chopin",
      "Tristesse Étude Op.10 No.3 Chopin",
      "Polonaise Heroic Chopin",
    ],
  },
  jazz: {
    match: ["爵士", "jazz"],
    works: [
      "Take Five jazz",
      "So What Miles Davis jazz",
      "Kind of Blue jazz",
      "Blue in Green jazz",
      "My Favorite Things jazz",
    ],
  },
};

function detectTheme(q: string, eff: string): string | null {
  const hay = `${q} ${eff}`.toLowerCase();
  for (const key of Object.keys(WORKS_MAP)) {
    if (WORKS_MAP[key].match.some((m) => hay.includes(m.toLowerCase()))) return key;
  }
  return null;
}

/** 拉取某作曲家的代表作（逐个搜索 Commons 音频，封面复用作曲家头像） */
async function searchComposerWorks(works: string[], composerCover: string | null): Promise<RoyaltyTrack[]> {
  const out: RoyaltyTrack[] = [];
  for (const w of works) {
    try {
      const params = new URLSearchParams({
        action: "query",
        format: "json",
        formatversion: "2",
        generator: "search",
        gsrsearch: `${w} filemime:audio`,
        gsrnamespace: "6",
        gsrlimit: "1",
        prop: "imageinfo",
        iiprop: "url|mime|size|extmetadata",
      });
      const { status, buf } = await httpsGet(`https://commons.wikimedia.org/w/api.php?${params}`, 15000);
      if (status !== 200) continue;
      const data = JSON.parse(buf.toString("utf8")) as {
        query?: { pages?: { title?: string; imageinfo?: { url?: string; mime?: string; size?: number; extmetadata?: { Artist?: { value?: string }; LicenseShortName?: { value?: string } } }[] }[] };
      };
      const p = data?.query?.pages?.[0];
      const info = p?.imageinfo?.[0];
      if (!info?.url || !String(info.mime || "").startsWith("audio")) continue;
      if (/midi|mid\b/.test(String(info.mime || ""))) continue;
      out.push({
        title: String(p?.title ?? "").replace(/^File:/, "").slice(0, 160),
        url: info.url,
        artist: stripHtml(info.extmetadata?.Artist?.value ?? "").slice(0, 120) || "佚名",
        license: stripHtml(info.extmetadata?.LicenseShortName?.value ?? "").slice(0, 60),
        mime: info.mime ?? "",
        size: info.size ?? 0,
        cover: composerCover ?? undefined,
      });
    } catch {
      // 单个代表作失败不影响整体
    }
  }
  return out;
}

export interface RoyaltySearchResult {
  tracks: RoyaltyTrack[];
  works: RoyaltyTrack[];
  theme: string | null;
}

// 搜索结果本地数据库缓存（TTL 30 分钟）：命中直接返回，大幅提速且不重复请求 Commons
const CACHE_TTL_MS = 30 * 60 * 1000;

async function getCached(key: string): Promise<RoyaltySearchResult | null> {
  try {
    const [row] = await db
      .select()
      .from(royaltyCache)
      .where(eq(royaltyCache.key, key))
      .limit(1);
    if (row?.payload && Date.now() - new Date(row.ts ?? 0).getTime() < CACHE_TTL_MS) {
      return row.payload as unknown as RoyaltySearchResult;
    }
  } catch {
    // 缓存不可用则忽略，走实时抓取
  }
  return null;
}

async function setCache(key: string, data: RoyaltySearchResult): Promise<void> {
  try {
    await db
      .insert(royaltyCache)
      .values({ key, payload: data as unknown as object })
      .onDuplicateKeyUpdate({ set: { payload: data as unknown as object, ts: new Date() } });
  } catch {
    // 写缓存失败忽略
  }
}

/** 搜索免版权音乐：普通曲目 + （若是作曲家/流派）代表作；结果本地库缓存 */
export async function searchRoyaltyPlus(q: string, limit = 12): Promise<RoyaltySearchResult> {
  const key = sha1Hex(`royalty:${q}:${limit}`);
  const cached = await getCached(key);
  if (cached) return cached;

  const eff = await enrichSearch(q);
  const tracks = await searchRoyalty(q, limit);
  const themeKey = detectTheme(q, eff);
  let works: RoyaltyTrack[] = [];
  let theme: string | null = null;
  if (themeKey) {
    theme = WORKS_MAP[themeKey].match[0];
    const cover = await getArtistCover(WORKS_MAP[themeKey].match[0]);
    works = await searchComposerWorks(WORKS_MAP[themeKey].works, cover);
  }
  const result: RoyaltySearchResult = { tracks, works, theme };
  await setCache(key, result);
  return result;
}

export function musicDir(): string {
  return process.env.MUSIC_DIR || path.join(process.cwd(), "music");
}

const ALLOWED_HOSTS = ["upload.wikimedia.org", "commons.wikimedia.org"];

/** 把免版权音频下载保存到本地 music 目录（仅允许 Wikimedia 域名，防 SSRF） */
export async function downloadToLocal(url: string, name: string): Promise<string> {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("非法 URL");
  }
  if (!ALLOWED_HOSTS.includes(u.hostname)) {
    throw new Error("仅允许从 Wikimedia Commons 下载");
  }
  const safeName = String(name || "track")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\.{2,}/g, ".")
    .slice(0, 120);
  const dir = musicDir();
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, safeName);

  const { status, buf } = await httpsGet(url, 180000);
  if (status !== 200) throw new Error(`下载失败 HTTP ${status}`);
  await writeFile(dest, buf);
  return dest;
}
