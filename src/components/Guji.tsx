"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import { useJournal } from "@/store/journal";

interface GujiMeta {
  id: number;
  title: string;
  author: string;
  dynasty: string;
  intro: string | null;
  createdAt: string;
}

interface GujiEntry {
  name: string;
  lines: string[];
}

const LIST_PAGE = 200;
const LINE_PAGE = 400;

const fieldCls =
  "w-full rounded-lg border border-line-strong bg-transparent px-3 py-2 text-sm outline-none transition focus:border-red";

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const parts: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while ((k = text.indexOf(q, i)) !== -1) {
    if (k > i) parts.push(text.slice(i, k));
    parts.push(
      <mark key={k} className="rounded-[2px] bg-[var(--mark)] px-0.5 text-ink">
        {text.slice(k, k + q.length)}
      </mark>
    );
    i = k + q.length;
  }
  if (i < text.length) parts.push(text.slice(i));
  return <>{parts}</>;
}

function snippet(line: string, q: string): string {
  const i = line.indexOf(q);
  if (i === -1) return line;
  const start = Math.max(0, i - 18);
  const end = Math.min(line.length, i + q.length + 42);
  return (start > 0 ? "…" : "") + line.slice(start, end) + (end < line.length ? "…" : "");
}

// 古籍：书目列表（DB）+ 上传文档 + 大书阅读器（搜索/分页）
export function Guji() {
  const { data: session } = useSession();
  const showToast = useJournal((s) => s.showToast);
  const [books, setBooks] = useState<GujiMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<GujiMeta | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guji");
      const j = await res.json();
      setBooks(j.books ?? []);
    } catch {
      /* 保留原列表 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/guji");
        const j = await res.json();
        if (!cancelled) setBooks(j.books ?? []);
      } catch {
        /* 保留原列表 */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loggedIn = !!session?.user;

  const del = async (b: GujiMeta) => {
    if (!confirm(`删除《${b.title}》？`)) return;
    const res = await fetch(`/api/guji?id=${b.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("已删除");
      refresh();
    } else {
      showToast("删除失败");
    }
  };

  return (
    <section className="panel mb-4 overflow-hidden">
      <h3 className="border-b border-line px-3.5 py-2.5 text-sm tracking-[4px] text-red">
        卍 古籍 · 历代文献
      </h3>
      <div className="p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="text-xs opacity-55">{loading ? "…" : `${books.length} 部`}</span>
          {loggedIn ? (
            <button
              onClick={() => setUploadOpen(true)}
              className="rounded-md border border-line-strong px-2.5 py-1 text-xs transition hover:border-red hover:text-red"
            >
              + 上传文档
            </button>
          ) : null}
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm opacity-55">加载中…</div>
        ) : books.length === 0 ? (
          <div className="py-10 text-center text-sm opacity-55">
            {loggedIn ? "暂无古籍，点击右上角上传文档" : "古籍文档待提供，将逐份收录于此"}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <li key={b.id} className="relative">
                <button
                  onClick={() => setReading(b)}
                  className="w-full rounded-lg border border-line p-3 text-left transition hover:border-red"
                >
                  <div className="text-[14px] font-medium">{b.title}</div>
                  <div className="mt-1 text-xs opacity-60">
                    {b.dynasty} · {b.author}
                  </div>
                  {b.intro ? (
                    <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed opacity-55">
                      {b.intro}
                    </div>
                  ) : null}
                </button>
                {loggedIn ? (
                  <button
                    onClick={() => del(b)}
                    title="删除"
                    className="absolute right-1.5 top-1.5 rounded-md px-1.5 text-sm opacity-50 transition hover:bg-red-soft hover:opacity-100"
                  >
                    ✕
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {reading ? <Reader book={reading} onClose={() => setReading(null)} /> : null}
      {uploadOpen ? (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refresh} showToast={showToast} />
      ) : null}
    </section>
  );
}

function Reader({ book, onClose }: { book: GujiMeta; onClose: () => void }) {
  const [entries, setEntries] = useState<GujiEntry[] | null>(null);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [listLimit, setListLimit] = useState(LIST_PAGE);
  const [lineLimit, setLineLimit] = useState(LINE_PAGE);

  // 换书时重置阅读状态（渲染期间调整，避免在 effect 里 setState）
  const [prevBookId, setPrevBookId] = useState(book.id);
  if (prevBookId !== book.id) {
    setPrevBookId(book.id);
    setEntries(null);
    setErr("");
    setOpenIdx(null);
    setQuery("");
    setListLimit(LIST_PAGE);
    setLineLimit(LINE_PAGE);
  }
  // 查询 / 进入词人时重置分页
  const [prevQ, setPrevQ] = useState(query);
  if (prevQ !== query) {
    setPrevQ(query);
    setListLimit(LIST_PAGE);
    setLineLimit(LINE_PAGE);
  }
  const [prevOpen, setPrevOpen] = useState(openIdx);
  if (prevOpen !== openIdx) {
    setPrevOpen(openIdx);
    setLineLimit(LINE_PAGE);
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/guji/content?id=${book.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        if (!cancelled) setEntries(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (!cancelled) setErr("加载失败，请重试");
      });
    return () => {
      cancelled = true;
    };
  }, [book.id]);

  const q = query.trim();
  const multi = entries !== null && entries.length > 1;
  const detailIdx = multi ? openIdx : 0;
  const detail = entries && detailIdx !== null ? entries[detailIdx] : null;

  const filtered = useMemo(() => {
    if (!entries) return [] as GujiEntry[];
    if (!q) return entries;
    return entries.filter((e) => e.name.includes(q) || e.lines.some((l) => l.includes(q)));
  }, [entries, q]);
  const visibleList = filtered.slice(0, listLimit);
  const canMoreList = filtered.length > listLimit;

  const detailLines = useMemo(() => {
    if (!detail) return [] as string[];
    return q ? detail.lines.filter((l) => l.includes(q)) : detail.lines;
  }, [detail, q]);
  const visibleLines = detailLines.slice(0, lineLimit);
  const canMoreLines = detailLines.length > lineLimit;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute right-3 top-2.5 z-10 rounded-md px-2 py-1 text-xl opacity-60 transition hover:bg-red-soft hover:opacity-100"
          onClick={onClose}
          title="关闭"
        >
          ✕
        </button>
        <div className="px-7 py-6">
          <div className="mb-1 text-2xl font-bold tracking-[2px] text-red">{book.title}</div>
          <div className="mb-4 text-xs opacity-60">
            {book.dynasty} · {book.author}
          </div>
          {book.intro ? (
            <p className="mb-4 border-l-2 border-line-strong pl-3 text-[13px] leading-relaxed opacity-70">
              {book.intro}
            </p>
          ) : null}

          {entries === null && !err ? (
            <div className="py-10 text-center text-sm opacity-55">加载中…</div>
          ) : err ? (
            <div className="py-10 text-center text-sm text-red">{err}</div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={multi ? "搜索词人 / 词句…" : "搜索正文…"}
                  className={fieldCls}
                />
                {multi && detailIdx !== null ? (
                  <button
                    onClick={() => setOpenIdx(null)}
                    className="shrink-0 rounded-md border border-line-strong px-2.5 py-1.5 text-xs transition hover:border-red hover:text-red"
                  >
                    ← 返回
                  </button>
                ) : null}
              </div>

              {multi && detailIdx === null ? (
                filtered.length === 0 ? (
                  <div className="py-10 text-center text-sm opacity-55">
                    未找到「{query}」相关词人
                  </div>
                ) : (
                  <ul className="max-h-[52vh] overflow-y-auto pr-1">
                    {visibleList.map((e, i) => {
                      const lineMatch = q ? e.lines.find((l) => l.includes(q)) : undefined;
                      return (
                        <li key={`${e.name}-${i}`}>
                          <button
                            onClick={() => setOpenIdx(entries.indexOf(e))}
                            className="flex w-full items-baseline justify-between gap-3 border-b border-line px-1 py-2 text-left transition hover:bg-red-soft"
                          >
                            <span className="text-[14px] font-medium">{e.name}</span>
                            <span className="shrink-0 text-xs opacity-55">{e.lines.length} 行</span>
                          </button>
                          {q && lineMatch ? (
                            <div className="px-1 pb-2 text-xs opacity-60">
                              <Highlight text={snippet(lineMatch, q)} q={q} />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                    {canMoreList ? (
                      <li className="py-2 text-center">
                        <button
                          onClick={() => setListLimit((n) => n + LIST_PAGE)}
                          className="rounded-md border border-line-strong px-4 py-1.5 text-xs transition hover:border-red hover:text-red"
                        >
                          加载更多（{filtered.length - listLimit} 位）
                        </button>
                      </li>
                    ) : null}
                  </ul>
                )
              ) : detail ? (
                <div className="whitespace-pre-wrap break-words font-serif text-[15px] leading-loose">
                  <div className="mb-2 text-lg font-semibold tracking-[2px] text-red">{detail.name}</div>
                  {q ? (
                    detailLines.length === 0 ? (
                      <div className="py-6 text-center text-sm opacity-55">
                        未找到「{query}」相关句
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 text-xs opacity-55">命中 {detailLines.length} 处</div>
                        {visibleLines.map((l, i) => (
                          <div key={i} className="py-0.5">
                            <Highlight text={l} q={q} />
                          </div>
                        ))}
                      </>
                    )
                  ) : (
                    <>
                      {visibleLines.map((l, i) => (
                        <div key={i} className="py-0.5">
                          {l}
                        </div>
                      ))}
                      {canMoreLines ? (
                        <div className="py-3 text-center">
                          <button
                            onClick={() => setLineLimit((n) => n + LINE_PAGE)}
                            className="rounded-md border border-line-strong px-4 py-1.5 text-xs transition hover:border-red hover:text-red"
                          >
                            加载更多
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadModal({
  onClose,
  onUploaded,
  showToast,
}: {
  onClose: () => void;
  onUploaded: () => void;
  showToast: (s: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [dynasty, setDynasty] = useState("");
  const [intro, setIntro] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim() || !dynasty.trim()) {
      setError("书名 / 作者 / 朝代必填");
      return;
    }
    if (!file) {
      setError("请选择文件");
      return;
    }
    setBusy(true);
    setError("");
    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("author", author.trim());
    fd.append("dynasty", dynasty.trim());
    fd.append("intro", intro.trim());
    fd.append("file", file);
    try {
      const res = await fetch("/api/guji", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "上传失败");
        return;
      }
      showToast(`已上传《${title.trim()}》`);
      onUploaded();
      onClose();
    } catch {
      setError("网络错误，请重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-mask" onClick={onClose}>
      <form
        className="modal px-7 py-6"
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 text-xl font-bold tracking-[2px] text-red">上传古籍文档</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 block opacity-60">书名 *</span>
            <input
              className={fieldCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：全宋词"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block opacity-60">作者 *</span>
            <input
              className={fieldCls}
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="如：唐圭璋 编"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block opacity-60">朝代 *</span>
            <input
              className={fieldCls}
              value={dynasty}
              onChange={(e) => setDynasty(e.target.value)}
              placeholder="如：宋"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block opacity-60">简介（可选）</span>
            <input
              className={fieldCls}
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="一句话简介"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs">
          <span className="mb-1 block opacity-60">
            文档文件 *（EPUB / TXT / HTML，EPUB 按章拆分）
          </span>
          <input
            type="file"
            accept=".epub,.txt,.htm,.html,.xhtml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm"
          />
        </label>
        {file ? (
          <div className="mt-1 text-xs opacity-55">
            {file.name}（{Math.max(1, Math.round(file.size / 1024))} KB）
          </div>
        ) : null}
        {error ? <div className="mt-3 text-xs text-red">{error}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line-strong px-3.5 py-1.5 text-sm transition hover:border-red hover:text-red"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-nred px-3.5 py-1.5 text-sm text-paper transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "解析中…" : "上传"}
          </button>
        </div>
      </form>
    </div>
  );
}
