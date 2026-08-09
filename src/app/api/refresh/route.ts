import { NextResponse } from "next/server";
import { refreshAllSources } from "@/lib/refresh";

// POST /api/refresh —— 全量重新抓取所有音乐源并入库
export async function POST() {
  try {
    const result = await refreshAllSources();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "刷新失败" },
      { status: 500 },
    );
  }
}
