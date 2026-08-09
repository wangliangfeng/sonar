// 本地 Ollama 客户端 —— 服务端专用（拌嘴树洞 AI）
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:1.5b";

export interface OllamaMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOpts {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/** 一次性对话，返回完整文本 */
export async function ollamaChat(messages: OllamaMsg[], opts: ChatOpts = {}): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: opts.temperature ?? 0.8,
        num_predict: opts.maxTokens ?? 300,
      },
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return data.message?.content ?? "";
}

/** 流式对话：逐段产出文本增量（解析 Ollama NDJSON 流） */
export async function* ollamaChatStream(
  messages: OllamaMsg[],
  opts: ChatOpts = {},
): AsyncGenerator<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: true,
      options: {
        temperature: opts.temperature ?? 0.8,
        num_predict: opts.maxTokens ?? 400,
      },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const j = JSON.parse(line);
        const delta = j.message?.content ?? "";
        if (delta) yield delta;
      } catch {
        // 忽略解析失败的行
      }
    }
  }
}
