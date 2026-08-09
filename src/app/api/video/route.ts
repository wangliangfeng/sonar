import { NextResponse } from "next/server";
import { searchVideos } from "@/lib/video";

// GET /api/video?q=... —— 搜索音乐/采访视频（Wikimedia Commons 开放接口）
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "music interview";
  try {
    const videos = await searchVideos(q);
    return NextResponse.json({ q, videos });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "视频搜索失败" },
      { status: 500 },
    );
  }
}
