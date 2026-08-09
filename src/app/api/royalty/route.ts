import { NextResponse } from "next/server";
import { searchRoyaltyPlus } from "@/lib/royalty";

// GET /api/royalty?q=... —— 搜索免版权音乐（含作曲家代表作）
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "music";
  try {
    const { tracks, works, theme } = await searchRoyaltyPlus(q);
    return NextResponse.json({ q, tracks, works, theme });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "搜索失败" },
      { status: 500 },
    );
  }
}
