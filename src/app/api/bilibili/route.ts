import { NextResponse } from "next/server";
import { searchBilibili } from "@/lib/bilibili";

// GET /api/bilibili?q=京剧 —— Bilibili 免费戏曲/音乐视频
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "京剧";
  try {
    const videos = await searchBilibili(q);
    return NextResponse.json({ q, videos });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "B站搜索失败" },
      { status: 500 },
    );
  }
}
