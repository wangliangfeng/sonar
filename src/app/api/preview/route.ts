import { NextResponse } from "next/server";
import { findPreview } from "@/lib/itunes";

// GET /api/preview?q=代表作 —— iTunes 官方 30 秒试听 + 链接
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (!q) return NextResponse.json({ error: "缺少关键词" }, { status: 400 });
  try {
    const info = await findPreview(q);
    if (!info) return NextResponse.json({ error: "未找到试听" }, { status: 404 });
    return NextResponse.json({ info });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "试听获取失败" },
      { status: 500 },
    );
  }
}
