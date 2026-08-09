import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { banter } from "@/db/schema";
import { ollamaChat, type OllamaMsg } from "@/lib/ollama";

const SYSTEM: OllamaMsg = {
  role: "system",
  content:
    "你是树洞的氛围观察员。以下是最近几天大家在拌嘴树洞里的匿名吐槽。请用温暖的语气总结：大家主要在烦恼什么、整体情绪氛围如何（40~100字）。口语化，不要列点，不要 Markdown，直接给出总结文字。",
};

const TTL = 10 * 60 * 1000;
let cache: { ts: number; text: string; count: number } | null = null;
let inflight: Promise<{ text: string; count: number }> | null = null;

// GET /api/banter/summary —— 今日树洞氛围总结（公开，AI 生成，10 分钟缓存）
export async function GET() {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) {
    return NextResponse.json({ summary: cache.text, count: cache.count });
  }
  if (!inflight) {
    inflight = (async () => {
      const rows = await db
        .select({ content: banter.content })
        .from(banter)
        .orderBy(desc(banter.createdAt))
        .limit(30);
      if (!rows.length) {
        return { text: "树洞空空的，来当第一个吐槽的人吧", count: 0 };
      }
      const joined = rows.map((r, i) => `${i + 1}. ${r.content}`).join("\n");
      const raw = await ollamaChat([SYSTEM, { role: "user", content: joined }], {
        temperature: 0.9,
        maxTokens: 200,
      });
      const text = raw.trim() || "大家似乎都在默默努力着。";
      cache = { ts: Date.now(), text, count: rows.length };
      return { text, count: rows.length };
    })();
  }
  try {
    const { text, count } = await inflight;
    return NextResponse.json({ summary: text, count });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "生成失败" },
      { status: 500 },
    );
  } finally {
    inflight = null;
  }
}
