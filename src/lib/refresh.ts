// 全量刷新：upsert 内置源 → 读取数据库启用源 → 并发抓取解析 → upsert 文章（按 linkHash 去重）
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, sources } from "@/db/schema";
import { MUSIC_SOURCES } from "@/lib/sources";
import { fetchFeedText, parseFeed, sha1Hex } from "@/lib/rss";

export interface RefreshResult {
  ok: number;
  fail: number;
  total: number;
  inserted: number;
  bySource: { name: string; ok: boolean; items: number; error?: string }[];
}

/** 简易并发池：最多 max 个任务同时执行，全部完成后 resolve */
async function runPool<T>(
  jobs: T[],
  max: number,
  worker: (job: T) => Promise<void>,
): Promise<void> {
  let idx = 0;
  let active = 0;
  let remaining = jobs.length;
  await new Promise<void>((resolve, reject) => {
    function pump() {
      while (active < max && idx < jobs.length) {
        const job = jobs[idx++];
        active++;
        worker(job)
          .catch(reject)
          .finally(() => {
            active--;
            remaining--;
            if (remaining === 0) resolve();
            else pump();
          });
      }
    }
    pump();
  });
}

async function upsertSources(): Promise<Map<string, number>> {
  for (const s of MUSIC_SOURCES) {
    await db
      .insert(sources)
      .values({ name: s.name, url: s.url, urlHash: sha1Hex(s.url), category: s.category })
      .onDuplicateKeyUpdate({ set: { name: s.name, category: s.category } });
  }
  const rows = await db.select().from(sources);
  return new Map(rows.map((r) => [r.urlHash, r.id]));
}

export async function refreshAllSources(): Promise<RefreshResult> {
  const idByHash = await upsertSources(); // 内置源写入库（若已存在则更新）
  const enabled = await db.select().from(sources).where(eq(sources.enabled, true));
  const jobs = enabled.map((s) => ({
    name: s.name,
    url: s.url,
    category: s.category,
    urlHash: s.urlHash,
  }));
  const result: RefreshResult = {
    ok: 0,
    fail: 0,
    total: jobs.length,
    inserted: 0,
    bySource: [],
  };

  await runPool(jobs, 5, async (job) => {
    const entry = { name: job.name, ok: false, items: 0, error: undefined as string | undefined };
    try {
      const xml = await fetchFeedText(job.url);
      const parsed = parseFeed(xml).slice(0, 30);
      const sourceId = idByHash.get(job.urlHash) ?? null;
      const now = new Date();
      for (const item of parsed) {
        await db
          .insert(articles)
          .values({
            sourceId,
            title: item.title,
            link: item.link,
            linkHash: sha1Hex(item.link),
            desc: item.desc || null,
            author: item.author || null,
            category: job.category,
            pubTs: item.pubTs ? new Date(item.pubTs) : null,
          })
          .onDuplicateKeyUpdate({
            set: {
              title: item.title,
              desc: item.desc || null,
              author: item.author || null,
              updatedAt: now,
            },
          });
      }
      entry.ok = true;
      entry.items = parsed.length;
      result.inserted += parsed.length;
      result.ok++;
    } catch (e) {
      entry.error = e instanceof Error ? e.message : String(e);
      result.fail++;
    }
    result.bySource.push(entry);
  });

  return result;
}
