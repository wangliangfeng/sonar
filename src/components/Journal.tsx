"use client";

import { useEffect } from "react";
import { useJournal } from "@/store/journal";
import type { ArticleItem } from "@/lib/article";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar";
import { ArticleModal } from "./ArticleModal";
import { Charts } from "./Charts";
import { AllAwards } from "./AwardsPanel";
import { BookerPrize } from "./BookerPrize";
import { JapanesePrize } from "./JapanesePrize";
import { Podcasts } from "./Podcasts";
import { Guji } from "./Guji";
import { Banter } from "./Banter";
import { MergedVideos } from "./MergedVideos";
import { RoyaltyMusic } from "./RoyaltyMusic";
import { MusicianWiki } from "./MusicianWiki";
import { PlayerBar } from "./PlayerBar";
import { Toast } from "./Toast";

const INTERVIEW_QUICK: [string, string][] = [
  ["周杰伦", "周杰伦 采访"],
  ["邓丽君", "邓丽君 采访"],
  ["王菲", "王菲 采访"],
  ["张国荣", "张国荣 采访"],
  ["五月天", "五月天 采访"],
  ["林俊杰", "林俊杰 采访"],
  ["陈奕迅", "陈奕迅 采访"],
  ["张学友", "张学友 采访"],
];

const DOC_QUICK: [string, string][] = [
  ["迈克尔·杰克逊", "迈克尔杰克逊 纪录片"],
  ["泰勒·斯威夫特", "泰勒·斯威夫特 纪录片"],
  ["周杰伦", "周杰伦 纪录片"],
  ["邓丽君", "邓丽君 纪录片"],
  ["张国荣", "张国荣 纪录片"],
  ["王菲", "王菲 纪录片"],
  ["披头士", "披头士 纪录片"],
  ["皇后乐队", "皇后乐队 纪录片"],
];

const OPERA_QUICK: [string, string][] = [
  ["京剧", "京剧"],
  ["昆曲", "昆曲"],
  ["越剧", "越剧"],
  ["黄梅戏", "黄梅戏"],
  ["豫剧", "豫剧"],
  ["粤剧", "粤剧"],
  ["秦腔", "秦腔"],
];

const THEATRE_QUICK: [string, string][] = [
  ["话剧", "话剧"],
  ["音乐剧", "音乐剧"],
  ["歌剧", "歌剧"],
  ["舞剧", "舞剧"],
  ["Broadway", "Broadway musical"],
  ["西区音乐剧", "West End musical"],
];

// 期刊主骨架：左列文章 / 右栏焦点 + 词云 / 新专含免版权音乐区 / 底部播放器
export function Journal({ initialArticles }: { initialArticles: ArticleItem[] }) {
  const setArticles = useJournal((s) => s.setArticles);
  const theme = useJournal((s) => s.theme);
  const engine = useJournal((s) => s.engine);
  const a11y = useJournal((s) => s.a11y);
  const cat = useJournal((s) => s.cat);

  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles, setArticles]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("dark", theme !== "day");
    el.classList.toggle("eye", theme === "eye");
    const cls = `engine-${engine === "filter+" ? "filter-plus" : engine}`;
    el.classList.remove("engine-dynamic", "engine-static", "engine-filter", "engine-filter-plus");
    el.classList.add(cls);
  }, [theme, engine]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("a11y-large", a11y.large);
    el.classList.toggle("a11y-contrast", a11y.contrast);
  }, [a11y]);

  return (
    <div className="min-h-screen pb-16">
      <Header />
      <Toolbar />
      <main className="mx-auto max-w-6xl px-6 py-5">
        <div>
          {cat === "榜单" && (
            <>
              <Charts title="全球音乐榜单" defaultKind="songs" allowKind />
              <AllAwards />
              <BookerPrize />
              <JapanesePrize />
            </>
          )}
          {cat === "现场" && (
            <>
              <MusicianWiki />
              <MergedVideos title="采访 · 港台音乐人访谈" defaultQuery="周杰伦 采访" quick={INTERVIEW_QUICK} commons={false} iqiyi />
              <MergedVideos title="纪录片 · 港台 / 全球巨星" defaultQuery="迈克尔杰克逊 纪录片" quick={DOC_QUICK} commons={false} iqiyi />
              <RoyaltyMusic />
            </>
          )}
          {cat === "戏曲" && (
            <>
              <MergedVideos title="戏曲" defaultQuery="京剧" quick={OPERA_QUICK} iqiyi />
              <MergedVideos title="戏剧 · 话剧 / 音乐剧" defaultQuery="话剧" quick={THEATRE_QUICK} iqiyi />
            </>
          )}
          {cat === "播一会儿" && <Podcasts />}
          {cat === "古籍" && <Guji />}
          {cat === "拌嘴" && <Banter />}
        </div>
      </main>
      <ArticleModal />
      <PlayerBar />
      <Toast />
    </div>
  );
}
