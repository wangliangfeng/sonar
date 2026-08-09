"use client";

import { useEffect, useState } from "react";
import { htmlEscape } from "@/lib/article";
import { useSession } from "@/lib/auth-client";
import { useJournal } from "@/store/journal";

interface Post {
  id: number;
  content: string;
  userName: string;
  createdAt: string | null;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

function fmtTime(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 拌嘴 · 树洞：登录后吐槽日常烦恼（类似豆瓣树洞）
export function Banter() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  // AI 树洞：今日氛围 / 求安慰 / 聊天助手
  const [summary, setSummary] = useState("");
  const [comfortingId, setComfortingId] = useState<number | null>(null);
  const [comforts, setComforts] = useState<Record<number, string>>({});
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatting, setChatting] = useState(false);

  const showToast = useJournal((s) => s.showToast);

  useEffect(() => {
    let alive = true;
    fetch("/api/banter")
      .then((r) => r.json())
      .then((d) => alive && setPosts(d.posts ?? []))
      .catch(() => alive && setPosts([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/banter/summary")
      .then((r) => r.json())
      .then((d) => {
        if (alive && d.summary) setSummary(d.summary);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function submit() {
    const c = text.trim();
    if (!c || posting) return;
    setPosting(true);
    try {
      const res = await fetch("/api/banter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: c }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "发布失败");
      setText("");
      const list = await fetch("/api/banter").then((r) => r.json());
      setPosts(list.posts ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "发布失败");
    } finally {
      setPosting(false);
    }
  }

  async function comfort(id: number, content: string) {
    if (comfortingId !== null || !session?.user) return;
    setComfortingId(id);
    try {
      const res = await fetch("/api/banter/comfort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "小树走神了");
      setComforts((m) => ({ ...m, [id]: d.reply ?? "" }));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "小树走神了");
    } finally {
      setComfortingId(null);
    }
  }

  async function sendChat() {
    const q = chatInput.trim();
    if (!q || chatting || !session?.user) return;
    const history: ChatMsg[] = [...chatMsgs, { role: "user", content: q }];
    setChatMsgs([...history, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatting(true);
    let full = "";
    try {
      const res = await fetch("/api/banter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        throw new Error(d?.error || "小树走神了");
      }
      if (!res.body) throw new Error("小树走神了");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setChatMsgs([...history, { role: "assistant", content: full }]);
      }
    } catch (e) {
      setChatMsgs(full ? [...history, { role: "assistant", content: full }] : history);
      showToast(e instanceof Error ? e.message : "小树走神了");
    } finally {
      setChatting(false);
    }
  }

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        ◉ 拌嘴 · 树洞
      </h3>
      <div className="p-3.5">
        {summary && (
          <div className="mb-3 rounded-md border border-dashed border-line bg-panel-solid px-3 py-2 text-[12px] leading-relaxed">
            <span className="font-medium text-red">◆ 今日树洞 · </span>
            {htmlEscape(summary)}
          </div>
        )}

        <div className="rounded-md border border-line bg-panel-solid p-2.5">
          <textarea
            className="w-full resize-none bg-transparent text-[13px] outline-none"
            rows={3}
            maxLength={400}
            placeholder={session?.user ? "吐槽一下今天的烦恼…" : "登录后即可吐槽"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!session?.user}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] opacity-45">{text.length}/400</span>
            {session?.user ? (
              <button
                className="rounded-md bg-red px-3 py-1 text-xs text-paper transition hover:brightness-110 disabled:opacity-60"
                onClick={submit}
                disabled={posting || !text.trim()}
              >
                {posting ? "发布中…" : "发布"}
              </button>
            ) : (
              <span className="text-[11px] opacity-55">请先登录（右上角账号按钮）</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm opacity-55">加载中…</div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center text-sm opacity-55">还没有人吐槽，来当第一个吧</div>
        ) : (
          <ul className="mt-3">
            {posts.map((p) => (
              <li
                key={p.id}
                className="border-b border-dashed border-line py-2.5 last:border-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-red">
                    {htmlEscape(p.userName)}
                  </span>
                  <span className="text-[10px] opacity-45">{fmtTime(p.createdAt)}</span>
                  <button
                    className="ml-auto rounded border border-line px-1.5 py-0.5 text-[10px] text-gold transition hover:border-line-strong disabled:opacity-50"
                    onClick={() => comfort(p.id, p.content)}
                    disabled={comfortingId !== null || !session?.user}
                    title={session?.user ? "让小树安慰一下" : "登录后可用"}
                  >
                    {comfortingId === p.id ? "想想…" : "求安慰"}
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-[13px] leading-relaxed">
                  {htmlEscape(p.content)}
                </p>
                {comforts[p.id] && (
                  <div className="mt-1.5 rounded-md border border-dashed border-line bg-panel-solid px-2.5 py-2 text-[12px] leading-relaxed">
                    <span className="font-medium text-red">树洞小树 · </span>
                    <span className="whitespace-pre-wrap break-words">
                      {htmlEscape(comforts[p.id])}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 rounded-md border border-line bg-panel-solid p-2.5">
          <button
            className="w-full text-left text-[12px] font-medium text-red"
            onClick={() => setChatOpen((v) => !v)}
          >
            {chatOpen ? "▾ 树洞小助手 · 收起" : "▸ 树洞小助手 · 聊聊"}
          </button>
          {chatOpen && (
            <>
              <div className="mt-2 max-h-60 space-y-2 overflow-y-auto pr-1">
                {chatMsgs.length === 0 ? (
                  <div className="py-3 text-center text-[11px] opacity-55">
                    有什么想说的，跟小树聊聊吧。
                  </div>
                ) : (
                  chatMsgs.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={`inline-block max-w-[85%] rounded-lg px-2.5 py-1.5 text-left text-[12px] leading-relaxed ${
                          m.role === "user"
                            ? "bg-red text-paper"
                            : "border border-line bg-paper"
                        }`}
                      >
                        <span className="whitespace-pre-wrap break-words">
                          {htmlEscape(m.content)}
                        </span>
                        {m.role === "assistant" &&
                          chatting &&
                          i === chatMsgs.length - 1 &&
                          !m.content && <span className="opacity-50">…</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-line bg-paper px-2 py-1.5 text-[12px] outline-none"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder={session?.user ? "和树洞聊聊…（Enter 发送）" : "登录后可用"}
                  disabled={!session?.user}
                />
                <button
                  className="rounded-md bg-red px-3 py-1.5 text-xs text-paper transition hover:brightness-110 disabled:opacity-60"
                  onClick={sendChat}
                  disabled={chatting || !chatInput.trim() || !session?.user}
                >
                  {chatting ? "回复中…" : "发送"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
