import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { sources } from "@/db/schema";
import { sha1Hex } from "@/lib/rss";
import { getAdminUser } from "@/lib/admin";

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const rows = await db.select().from(sources).orderBy(asc(sources.id));
  return NextResponse.json({ sources: rows });
}

export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const body = (await req.json()) as { name?: string; url?: string; category?: string };
  if (!body.name || !body.url || !body.category) {
    return NextResponse.json({ error: "参数不全" }, { status: 400 });
  }
  await db
    .insert(sources)
    .values({ name: body.name, url: body.url, urlHash: sha1Hex(body.url), category: body.category })
    .onDuplicateKeyUpdate({ set: { name: body.name, category: body.category } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  await db.delete(sources).where(eq(sources.id, id));
  return NextResponse.json({ ok: true });
}
