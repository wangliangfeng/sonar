import { NextResponse } from "next/server";
import { ollamaChatStream, type OllamaMsg } from "@/lib/ollama";
import { getAdminUser } from "@/lib/admin";

const SYSTEM: OllamaMsg = {
  role: "system",
  content:
    "你是「人呐」站的拌嘴树洞小助手「小树」。你温柔、共情、不评判，说话口语化，偶尔带一点俏皮。用户在匿名吐槽日常烦恼，你的任务是倾听和安慰，而不是说教、下结论或评判对错。回答简短（30~80 字），用中文，不要用 Markdown、列表或表情符号。若用户提到自伤等危险，请温和地建议 ta 寻求专业帮助。",
};

// POST /api/banter/chat —— 树洞聊天助手（登录可用，流式返回）
export async function POST(req: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  let raw: { messages?: unknown } = {};
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const msgs: OllamaMsg[] = (Array.isArray(raw.messages) ? raw.messages : [])
    .filter(
      (m): m is OllamaMsg =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, 800) }))
    .slice(-12);

  if (!msgs.length) return NextResponse.json({ error: "说点什么吧" }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of ollamaChatStream([SYSTEM, ...msgs], { signal: req.signal })) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch {
        controller.enqueue(encoder.encode("……小树一时走神了，待会儿再聊好吗？"));
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
