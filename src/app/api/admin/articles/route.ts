import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const [row] = await db.select({ n: sql<number>`COUNT(*)` }).from(articles);
  const recent = await db
    .select({ id: articles.id, title: articles.title, category: articles.category, pubTs: articles.pubTs })
    .from(articles)
    .orderBy(desc(articles.pubTs))
    .limit(10);
  return NextResponse.json({ count: row?.n ?? 0, recent });
}
