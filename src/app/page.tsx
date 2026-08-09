import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, sources } from "@/db/schema";
import { Journal } from "@/components/Journal";
import type { ArticleItem } from "@/lib/article";

// 每次请求实时读库（服务端组件），保证刷新后能看到最新入库数据
export const dynamic = "force-dynamic";

export default async function Home() {
  let items: ArticleItem[] = [];
  try {
    const rows = await db
      .select({
        id: articles.linkHash,
        sourceId: articles.sourceId,
        sourceName: sources.name,
        title: articles.title,
        link: articles.link,
        desc: articles.desc,
        author: articles.author,
        category: articles.category,
        pubTs: articles.pubTs,
      })
      .from(articles)
      .leftJoin(sources, eq(articles.sourceId, sources.id))
      .orderBy(desc(articles.pubTs))
      .limit(400);
    items = rows.map((r) => ({
      id: r.id,
      sourceId: r.sourceId,
      sourceName: r.sourceName ?? "",
      title: r.title,
      link: r.link,
      desc: r.desc ?? "",
      author: r.author ?? "",
      category: r.category,
      pubTs: r.pubTs ? new Date(r.pubTs).getTime() : null,
    }));
  } catch (e) {
    // 数据库未就绪时优雅降级为空列表，页面仍可渲染
    console.error("DB 读取失败:", e);
  }
  return <Journal initialArticles={items} />;
}
