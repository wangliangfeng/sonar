import { NextResponse } from "next/server";
import { searchIqiyi } from "@/lib/iqiyi";

// GET /api/iqiyi?q=京剧 —— 爱奇艺免费视频搜索（付费内容已过滤）
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "京剧";
  try {
    const videos = await searchIqiyi(q);
    return NextResponse.json({ q, videos });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "爱奇艺搜索失败" },
      { status: 500 },
    );
  }
}
