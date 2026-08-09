"use client";

import { useState, type FormEvent } from "react";
import { CATEGORIES } from "@/lib/sources";
import { useJournal, type CatKey, type Engine, ENGINE_LABEL } from "@/store/journal";

const THEME_LABEL = { day: "日版", night: "夜版", eye: "护眼" } as const;

export function Toolbar() {
  const cat = useJournal((s) => s.cat);
  const setCat = useJournal((s) => s.setCat);
  const doSearch = useJournal((s) => s.doSearch);
  const clearSearch = useJournal((s) => s.clearSearch);
  const theme = useJournal((s) => s.theme);
  const cycleTheme = useJournal((s) => s.cycleTheme);
  const engine = useJournal((s) => s.engine);
  const setEngine = useJournal((s) => s.setEngine);
  const a11y = useJournal((s) => s.a11y);
  const toggleA11y = useJournal((s) => s.toggleA11y);
  const [input, setInput] = useState("");
  const [showDisplay, setShowDisplay] = useState(false);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    doSearch(input);
  }

  function rowBtn(on: boolean): string {
    return `flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs transition ${
      on ? "bg-red-soft text-red" : "opacity-80 hover:bg-red-soft"
    }`;
  }

  return (
    <nav className="toolbar flex flex-wrap items-center gap-2 border-b border-line px-6 py-3">
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`rounded-md border px-3 py-1 text-sm tracking-[2px] transition ${
              cat === c.key
                ? "border-line-strong bg-panel text-red"
                : "border-transparent hover:bg-red-soft"
            }`}
            onClick={() => setCat(c.key as CatKey)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <form className="flex" onSubmit={onSearch}>
          <input
            className="w-48 rounded-l-md border border-r-0 border-line-strong bg-panel-solid px-3 py-1 text-[13px] outline-none focus:border-red"
            placeholder="RAG 向量检索 · 中英文皆可"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (!e.target.value) clearSearch();
            }}
          />
          <button
            className="rounded-r-md bg-red px-3 text-[13px] tracking-[2px] text-paper hover:brightness-110"
            type="submit"
          >
            检索
          </button>
        </form>

        <div className="relative">
          <button
            className="rounded-md border border-line-strong bg-panel px-2.5 py-1 text-xs tracking-[1px] hover:border-red hover:text-red"
            onClick={() => setShowDisplay((v) => !v)}
            title="显示与无障碍设置"
          >
            显示 ▾
          </button>
          {showDisplay ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDisplay(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-md border border-line bg-panel-solid p-2 shadow-lg">
                <div className="mb-1 px-1 text-[10px] tracking-[2px] opacity-50">主题</div>
                <button
                  className={rowBtn(theme !== "day")}
                  onClick={() => {
                    cycleTheme();
                    setShowDisplay(false);
                  }}
                >
                  <span>切换主题</span>
                  <span>{THEME_LABEL[theme]}</span>
                </button>

                <div className="mb-1 mt-2 px-1 text-[10px] tracking-[2px] opacity-50">无障碍</div>
                <button className={rowBtn(a11y.large)} onClick={() => toggleA11y("large")}>
                  <span>大字模式</span>
                  <span>{a11y.large ? "开" : "关"}</span>
                </button>
                <button className={rowBtn(a11y.contrast)} onClick={() => toggleA11y("contrast")}>
                  <span>高对比</span>
                  <span>{a11y.contrast ? "开" : "关"}</span>
                </button>

                <div className="mb-1 mt-2 px-1 text-[10px] tracking-[2px] opacity-50">
                  暗色渲染引擎
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(["dynamic", "static", "filter", "filter+"] as Engine[]).map((e) => (
                    <button
                      key={e}
                      className={`rounded px-2 py-1 text-xs transition ${
                        engine === e ? "bg-red-soft text-red" : "opacity-75 hover:bg-red-soft"
                      }`}
                      onClick={() => setEngine(e)}
                    >
                      {ENGINE_LABEL[e]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
