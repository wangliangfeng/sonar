import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { downloads } from "@/db/schema";

// GET /api/downloads —— 本地已下载的免版权音乐（来自本地数据库）
export async function GET() {
  try {
    const rows = await db
      .select({
        id: downloads.id,
        title: downloads.title,
        filePath: downloads.filePath,
        size: downloads.size,
        createdAt: downloads.createdAt,
      })
      .from(downloads)
      .orderBy(desc(downloads.createdAt))
      .limit(20);
    return NextResponse.json({ downloads: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "读取失败" },
      { status: 500 },
    );
  }
}
