import { NextResponse } from "next/server";
import { lookupMusician } from "@/lib/musician";

// GET /api/musician?q=郎朗 —— 音乐人百科（Wikidata + Commons）
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "郎朗";
  try {
    const musician = await lookupMusician(q);
    return NextResponse.json({ q, musician });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "百科查询失败" },
      { status: 500 },
    );
  }
}
