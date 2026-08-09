import { NextResponse } from "next/server";
import { ollamaChat, type OllamaMsg } from "@/lib/ollama";
import { getAdminUser } from "@/lib/admin";

const SYSTEM: OllamaMsg = {
  role: "system",
  content:
    "你是一个温柔共情的树洞伙伴，负责回应别人的匿名吐槽。根据吐槽内容写一句暖心安慰（20~60字）：口语化、真诚、不评判对错、不说教。直接给出安慰，不要重复吐槽内容，不要用 Markdown 或表情，结尾不要用空泛的「加油」。",
};

// POST /api/banter/comfort —— 一键求安慰（登录可用）
export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let content = "";
  try {
    const body = await req.json();
    content = String(body?.content ?? "").trim();
  } catch {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }
  if (!content) return NextResponse.json({ error: "内容为空" }, { status: 400 });
  if (content.length > 400) content = content.slice(0, 400);

  try {
    const reply = await ollamaChat(
      [SYSTEM, { role: "user", content }],
      { temperature: 0.9, maxTokens: 160, signal: req.signal },
    );
    return NextResponse.json({ reply: reply.trim() || "抱抱你，都会过去的。" });
  } catch {
    return NextResponse.json({ error: "AI 暂时走神了，待会儿再试" }, { status: 502 });
  }
}
