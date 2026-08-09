import { NextResponse } from "next/server";
import { DESIGN_SOURCES, fetchDesignFeed } from "@/lib/design";

// GET /api/design —— 设计资讯官方 RSS 聚合（按时间倒序）
export async function GET() {
  try {
    const lists = await Promise.all(
      DESIGN_SOURCES.map((s) =>
        fetchDesignFeed(s).catch(() => [] as Awaited<ReturnType<typeof fetchDesignFeed>>),
      ),
    );
    const articles = lists
      .flat()
      .filter((a) => a.title && a.link)
      .sort((a, b) => (b.pubTs ?? 0) - (a.pubTs ?? 0))
      .slice(0, 60);
    return NextResponse.json({ sources: DESIGN_SOURCES, articles });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "设计资讯获取失败" },
      { status: 500 },
    );
  }
}
