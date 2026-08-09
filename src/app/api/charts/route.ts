import { NextResponse } from "next/server";
import { fetchChart } from "@/lib/charts";

// GET /api/charts?region=cn&kind=songs&limit=20 —— 全球音乐榜单（Apple Music 官方 RSS）
export async function GET(req: Request) {
  const u = new URL(req.url);
  const region = u.searchParams.get("region") || "cn";
  const kind = u.searchParams.get("kind") === "albums" ? "albums" : "songs";
  const limit = Math.min(50, Number(u.searchParams.get("limit")) || 20);
  try {
    const items = await fetchChart(region, kind, limit);
    return NextResponse.json({ region, kind, items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "榜单获取失败" },
      { status: 500 },
    );
  }
}
