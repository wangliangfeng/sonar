"use client";

import { useState } from "react";
import { Seal } from "./Seal";
import { AuthButton } from "./AuthButton";
import { useJournal } from "@/store/journal";

export function Header() {
  const progress = useJournal((s) => s.progress);
  const [dateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 星期${"日一二三四五六"[d.getDay()]}`;
  });

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-4">
      <div className="flex items-center gap-3">
        <Seal size={76} />
        <span className="max-w-[12rem] text-base leading-snug text-red">
          {progress
            ? `抓取 ${progress.ok}/${progress.total} · 收录 ${progress.inserted} 条`
            : "准备就绪"}
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <span className="text-right text-[13px] tracking-[2px] opacity-85">{dateStr}</span>
        <AuthButton />
      </div>
    </header>
  );
}
