import { stat } from "node:fs/promises";
import { NextResponse } from "next/server";
import { downloadToLocal } from "@/lib/royalty";
import { db } from "@/db";
import { downloads } from "@/db/schema";

// POST /api/royalty/download —— 下载免版权音乐到本地 music 目录，并记录到本地数据库
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string; name?: string };
    if (!body.url || !body.name) {
      return NextResponse.json({ error: "缺少 url 或 name" }, { status: 400 });
    }
    const saved = await downloadToLocal(body.url, body.name);
    let size: number | null = null;
    try {
      size = (await stat(saved)).size;
    } catch {
      size = null;
    }
    await db
      .insert(downloads)
      .values({
        title: String(body.name).slice(0, 200),
        url: body.url,
        filePath: saved,
        size,
      })
      .catch(() => {});
    return NextResponse.json({ saved });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "下载失败" },
      { status: 500 },
    );
  }
}
