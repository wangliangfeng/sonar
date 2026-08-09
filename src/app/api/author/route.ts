import { NextResponse } from "next/server";
import { authorIntro } from "@/lib/author";

// GET /api/author?name=石黑一雄 —— 获奖作者简介（Wikidata）
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name")?.trim() || "";
  if (!name) return NextResponse.json({ error: "缺少作者名" }, { status: 400 });
  try {
    const author = await authorIntro(name);
    if (!author) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json({ author });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "查询失败" },
      { status: 500 },
    );
  }
}
