import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { banter } from "@/db/schema";
import { getAdminUser } from "@/lib/admin";

// GET /api/banter —— 树洞留言墙（公开可读，最新在前）
export async function GET() {
  try {
    const rows = await db
      .select({
        id: banter.id,
        content: banter.content,
        userName: banter.userName,
        createdAt: banter.createdAt,
      })
      .from(banter)
      .orderBy(desc(banter.createdAt))
      .limit(60);
    return NextResponse.json({ posts: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "获取失败" },
      { status: 500 },
    );
  }
}

// POST /api/banter —— 登录用户吐槽一条
export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  let content = "";
  try {
    const body = await req.json();
    content = String(body?.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }
  if (!content) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  if (content.length > 400) {
    return NextResponse.json({ error: "最多 400 字" }, { status: 400 });
  }
  await db.insert(banter).values({
    content,
    userId: user.id,
    userName: user.name.slice(0, 120),
  });
  return NextResponse.json({ ok: true });
}
