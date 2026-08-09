import { NextResponse } from "next/server";
import { PODCAST_FEEDS, fetchPodcast } from "@/lib/podcasts";

// GET /api/podcast?feed=allsongs —— 精选音乐播客最新几期（标准 RSS）
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("feed") || PODCAST_FEEDS[0].id;
  const feed = PODCAST_FEEDS.find((f) => f.id === id);
  if (!feed) return NextResponse.json({ error: "未知播客" }, { status: 400 });
  try {
    const data = await fetchPodcast(feed);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "获取失败" },
      { status: 500 },
    );
  }
}
