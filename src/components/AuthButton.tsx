"use client";

import { useState } from "react";
import { signOut, useSession } from "@/lib/auth-client";
import { LoginModal } from "./LoginModal";
import { useJournal } from "@/store/journal";

export function AuthButton() {
  const { data, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const showToast = useJournal((s) => s.showToast);

  if (isPending) {
    return <span className="text-xs opacity-50">…</span>;
  }

  if (data?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="max-w-[120px] truncate text-xs text-red">
          {data.user.name || data.user.email}
        </span>
        <button
          className="rounded-md border border-line-strong px-2 py-1 text-xs transition hover:border-red hover:text-red"
          onClick={async () => {
            await signOut();
            showToast("已退出");
          }}
        >
          退出
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        className="rounded-md bg-nred px-3 py-1 text-xs text-paper transition hover:brightness-110"
        onClick={() => setOpen(true)}
      >
        登录
      </button>
      <LoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
