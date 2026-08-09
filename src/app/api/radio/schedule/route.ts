import { NextResponse } from "next/server";

// 蜻蜓FM 直播电台节目单（EPG）：抓 m.qingting.fm 频道页内嵌的 playBill（今日+明日），服务端缓存
export interface ScheduleProgram {
  title: string;
  startTime: string; // UTC ISO
  endTime: string; // UTC ISO
  host: string;
}

export interface StationSchedule {
  id: string; // qt1133
  name: string;
  date: string; // 节目单所属日期 YYYYMMDD
  today: ScheduleProgram[];
  tomorrow: ScheduleProgram[];
  error?: string;
}

const CACHE = new Map<string, { at: number; data: StationSchedule }>();
const TTL = 45 * 60 * 1000;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/144.0 Safari/537.36";

// 从 HTML 中精确截取 window.__initStores 后的 JSON 对象（花括号配平，跳过字符串）
function extractInit(s: string): string | null {
  const i = s.indexOf("window.__initStores=");
  if (i < 0) return null;
  let j = i + "window.__initStores=".length;
  while (j < s.length && /\s/.test(s[j])) j++;
  if (s[j] !== "{") return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  const start = j;
  for (; j < s.length; j++) {
    const c = s[j];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return s.slice(start, j + 1);
    }
  }
  return null;
}

function toPrograms(list: unknown[]): ScheduleProgram[] {
  return list.map((p) => {
    const o = p as Record<string, unknown>;
    return {
      title: typeof o.title === "string" ? o.title : "",
      startTime: typeof o.startTime === "string" ? o.startTime : "",
      endTime: typeof o.endTime === "string" ? o.endTime : "",
      host: typeof o.broadcasterNames === "string" ? o.broadcasterNames : "",
    };
  });
}

async function fetchStation(qingtingId: string): Promise<StationSchedule> {
  const res = await fetch(`http://m.qingting.fm/channels/${qingtingId}/`, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`蜻蜓FM ${qingtingId} HTTP ${res.status}`);
  const html = await res.text();
  const raw = extractInit(html);
  if (!raw) throw new Error(`蜻蜓FM ${qingtingId} 无节目单数据`);
  const j = JSON.parse(raw) as {
    ChannelStore?: {
      basicInfo?: { name?: string };
      playBill?: { today?: unknown[]; tomorrow?: unknown[] };
    };
  };
  const store = j.ChannelStore || {};
  const today = store.playBill?.today || [];
  const first = today[0] as Record<string, unknown> | undefined;
  return {
    id: `qt${qingtingId}`,
    name: store.basicInfo?.name || "",
    date: first && typeof first.from === "string" ? first.from.slice(0, 8) : "",
    today: toPrograms(today),
    tomorrow: toPrograms(store.playBill?.tomorrow || []),
  };
}

// GET /api/radio/schedule?ids=qt1133,qt1163,... —— 电台节目单（当前节目由客户端按本地时间计算）
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^qt\d+$/.test(s));
  if (!ids.length) {
    return NextResponse.json({ error: "缺少 ids" }, { status: 400 });
  }
  const stations = await Promise.all(
    ids.map(async (id) => {
      const cached = CACHE.get(id);
      if (cached && Date.now() - cached.at < TTL) return cached.data;
      try {
        const data = await fetchStation(id.replace("qt", ""));
        CACHE.set(id, { at: Date.now(), data });
        return data;
      } catch (e) {
        return {
          id,
          name: "",
          date: "",
          today: [],
          tomorrow: [],
          error: e instanceof Error ? e.message : "获取失败",
        } satisfies StationSchedule;
      }
    }),
  );
  return NextResponse.json({ stations });
}
