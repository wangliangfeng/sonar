"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useJournal } from "@/store/journal";
import { htmlEscape } from "@/lib/article";

type Tab = "sources" | "articles" | "downloads" | "users";

interface AdminSource {
  id: number;
  name: string;
  url: string;
  category: string;
  enabled: boolean;
}
interface AdminArticle { id: number; title: string; category: string }
interface AdminDownload { id: number; title: string; filePath: string }
interface AdminUser { id: string; name: string; email: string }

const CAT_OPTIONS = ["乐评", "榜单", "现场", "戏曲"];

export function AdminPanel({ user }: { user: string }) {
  const showToast = useJournal((s) => s.showToast);
  const [tab, setTab] = useState<Tab>("sources");

  const [sources, setSources] = useState<AdminSource[]>([]);
  const [articles, setArticles] = useState<{ count: number; recent: AdminArticle[] } | null>(null);
  const [downloads, setDownloads] = useState<AdminDownload[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({ name: "", url: "", category: "乐评" });

  async function load() {
    setBusy(true);
    try {
      const headers = { "Content-Type": "application/json" };
      if (tab === "sources") {
        const d = await fetch("/api/admin/sources").then((r) => r.json());
        setSources(d.sources ?? []);
      } else if (tab === "articles") {
        const d = await fetch("/api/admin/articles").then((r) => r.json());
        setArticles({ count: d.count ?? 0, recent: d.recent ?? [] });
      } else if (tab === "downloads") {
        const d = await fetch("/api/admin/downloads").then((r) => r.json());
        setDownloads(d.downloads ?? []);
      } else {
        const d = await fetch("/api/admin/users").then((r) => r.json());
        setUsers(d.users ?? []);
      }
    } catch {
      showToast("加载失败（需登录）");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // 数据获取（外部系统）同步加载态
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function addSource(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "添加失败");
      showToast("已添加源");
      setForm({ name: "", url: "", category: "乐评" });
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "添加失败");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSource(id: number) {
    setBusy(true);
    try {
      await fetch(`/api/admin/sources?id=${id}`, { method: "DELETE" });
      showToast("已删除源");
      load();
    } finally {
      setBusy(false);
    }
  }

  async function runRefresh() {
    setBusy(true);
    showToast("正在抓取全部源…");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const d = await res.json();
      showToast(`抓取完成：成功 ${d.ok} · 失败 ${d.fail} · 收录 ${d.inserted}`);
    } finally {
      setBusy(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    ["sources", "源管理"],
    ["articles", "文章"],
    ["downloads", "下载"],
    ["users", "用户"],
  ].map(([k, l]) => ({ key: k as Tab, label: l }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-[4px] text-red">人呐 · 管理后台</h1>
        <span className="text-xs opacity-60">管理员：{htmlEscape(user)}</span>
        <div className="ml-auto flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`rounded-md border px-3 py-1 text-xs tracking-[1px] transition ${
                tab === t.key ? "border-line-strong bg-panel text-red" : "border-transparent opacity-70 hover:border-line-strong"
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="panel p-4">
        {tab === "sources" ? (
          <>
            <form className="mb-4 flex flex-wrap items-end gap-2" onSubmit={addSource}>
              <input
                className="w-36 rounded-md border border-line-strong bg-panel-solid px-2 py-1.5 text-xs outline-none focus:border-red"
                placeholder="名称"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="w-72 rounded-md border border-line-strong bg-panel-solid px-2 py-1.5 text-xs outline-none focus:border-red"
                placeholder="RSS 地址（仅官方 RSS）"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
              />
              <select
                className="rounded-md border border-line-strong bg-panel-solid px-2 py-1.5 text-xs outline-none focus:border-red"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CAT_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                className="rounded-md bg-nred px-3 py-1.5 text-xs text-paper hover:brightness-110 disabled:opacity-60"
                disabled={busy}
                type="submit"
              >
                添加源
              </button>
              <button
                className="rounded-md border border-line-strong px-3 py-1.5 text-xs hover:border-red hover:text-red disabled:opacity-60"
                disabled={busy}
                type="button"
                onClick={runRefresh}
              >
                立即抓取全部
              </button>
            </form>

            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line opacity-60">
                  <th className="py-1.5">名称</th>
                  <th className="py-1.5">分类</th>
                  <th className="py-1.5">RSS 地址</th>
                  <th className="py-1.5">状态</th>
                  <th className="py-1.5" />
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-b border-dashed border-line last:border-none">
                    <td className="py-1.5">{htmlEscape(s.name)}</td>
                    <td className="py-1.5">{htmlEscape(s.category)}</td>
                    <td className="max-w-[280px] truncate opacity-70" title={s.url}>
                      {htmlEscape(s.url)}
                    </td>
                    <td className="py-1.5">{s.enabled ? "启用" : "停用"}</td>
                    <td className="py-1.5 text-right">
                      <button
                        className="text-xs text-red opacity-70 hover:opacity-100"
                        onClick={() => deleteSource(s.id)}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sources.length === 0 ? (
              <div className="py-6 text-center text-sm opacity-55">暂无源</div>
            ) : null}
          </>
        ) : null}

        {tab === "articles" ? (
          <div>
            <div className="mb-2 text-sm">共收录文章 <b className="text-red">{articles?.count ?? "…"}</b> 篇</div>
            <ul className="space-y-1">
              {(articles?.recent ?? []).map((a) => (
                <li key={a.id} className="truncate text-xs opacity-80">
                  [{a.category}] {htmlEscape(a.title)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === "downloads" ? (
          <ul className="space-y-1">
            {downloads.map((d) => (
              <li key={d.id} className="truncate text-xs opacity-80" title={d.filePath}>
                ♪ {htmlEscape(d.title)}
              </li>
            ))}
            {downloads.length === 0 ? (
              <li className="py-4 text-center text-sm opacity-55">暂无下载记录</li>
            ) : null}
          </ul>
        ) : null}

        {tab === "users" ? (
          <ul className="space-y-1">
            {users.map((u) => (
              <li key={u.id} className="text-xs opacity-80">
                {htmlEscape(u.name)} · {htmlEscape(u.email)}
              </li>
            ))}
            {users.length === 0 ? (
              <li className="py-4 text-center text-sm opacity-55">暂无用户</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
