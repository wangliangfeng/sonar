import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "人呐 · REN NA — 音乐期刊聚合器",
  description: "人呐 REN NA · 乐评 / 榜单 / 新专 / 现场 · RAG 向量检索",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
