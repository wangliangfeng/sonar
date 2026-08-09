"use client";

import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useJournal } from "@/store/journal";

// 邮箱仅作为 better-auth 内部标识自动生成，用户只填账号名 + 密码
function genEmail(): string {
  return `u_${Math.random().toString(36).slice(2, 10)}@renna.local`;
}

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const showToast = useJournal((s) => s.showToast);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error } = await signIn.username({ username, password });
        if (error) throw new Error(error.message || "登录失败");
        showToast("登录成功");
        onClose();
      } else {
        const { error } = await signUp.email({
          name: username,
          username,
          displayUsername: username,
          email: genEmail(),
          password,
        });
        if (error) throw new Error(error.message || "注册失败");
        showToast("注册成功，已登录");
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-mask" onClick={onClose}>
      <div
        className="modal aspect-square"
        style={{ width: "min(360px, 90vw)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-3 top-2.5 rounded-md px-2 py-1 text-xl opacity-60 transition hover:bg-red-soft hover:opacity-100"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex h-full flex-col justify-center px-7 py-6">
          <h2 className="mb-4 text-xl font-bold tracking-[4px] text-red">
            {mode === "login" ? "登 录" : "注 册"}
          </h2>
          <form className="flex flex-col gap-3" onSubmit={submit}>
            <input
              className="rounded-md border border-line-strong bg-panel-solid px-3 py-2 text-[13px] outline-none focus:border-red"
              placeholder={mode === "login" ? "账号名字" : "设置账号名字（登录用）"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="rounded-md border border-line-strong bg-panel-solid px-3 py-2 text-[13px] outline-none focus:border-red"
              type="password"
              placeholder="密码（至少 8 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <div className="text-xs text-red">{error}</div> : null}
            <button
              className="rounded-md bg-nred py-2 text-[13px] text-paper transition hover:brightness-110 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "提交中…" : mode === "login" ? "登录" : "注册"}
            </button>
          </form>
          <button
            className="mt-3 text-xs opacity-60 transition hover:text-red"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
          >
            {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
          </button>
        </div>
      </div>
    </div>
  );
}
