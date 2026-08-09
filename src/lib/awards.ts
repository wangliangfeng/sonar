// 三大奖项榜单（公开获奖记录 · 精选收录）+ 代表作 + 官网
export interface AwardRow {
  year: string;
  category: string;
  winner: string;
  work: string; // 代表作（用于 iTunes 试听检索）
}

export interface AwardGroup {
  id: string;
  name: string;
  en: string;
  desc: string;
  officialUrl: string;
  rows: AwardRow[];
}

export const AWARDS: AwardGroup[] = [
  {
    id: "grammy",
    name: "格莱美音乐奖",
    en: "GRAMMY AWARDS",
    desc: "全球音乐界最高荣誉 · 美国录音学院颁发",
    officialUrl: "https://www.grammy.com/",
    rows: [
      { year: "2025", category: "年度专辑", winner: "Beyoncé《Cowboy Carter》", work: "Texas Hold 'Em" },
      { year: "2025", category: "年度歌曲", winner: "Kendrick Lamar《Not Like Us》", work: "Not Like Us" },
      { year: "2025", category: "最佳新人", winner: "Chappell Roan", work: "Good Luck, Babe!" },
      { year: "2024", category: "年度专辑", winner: "Taylor Swift《Midnights》", work: "Anti-Hero" },
      { year: "2024", category: "年度歌曲", winner: "Billie Eilish《What Was I Made For?》", work: "What Was I Made For?" },
      { year: "2024", category: "年度制作", winner: "Miley Cyrus《Flowers》", work: "Flowers" },
      { year: "2024", category: "最佳新人", winner: "Victoria Monét", work: "On My Mama" },
      { year: "2023", category: "年度专辑", winner: "Harry Styles《Harry's House》", work: "As It Was" },
      { year: "2023", category: "年度歌曲", winner: "Bonnie Raitt《Just Like That》", work: "Just Like That" },
      { year: "2023", category: "最佳新人", winner: "Samara Joy", work: "Linger Awhile" },
    ],
  },
  {
    id: "gma",
    name: "台湾金曲奖",
    en: "GOLDEN MELODY AWARDS",
    desc: "华语流行音乐最高荣誉 · 历届最佳专辑精选",
    officialUrl: "https://www.culture.gov.tw/",
    rows: [
      { year: "2002", category: "最佳流行音乐演唱专辑", winner: "周杰伦《范特西》", work: "双截棍" },
      { year: "2012", category: "最佳国语专辑", winner: "五月天《第二人生》", work: "诺亚方舟" },
      { year: "2013", category: "最佳国语专辑", winner: "林忆莲《盖亚》", work: "盖亚" },
      { year: "2015", category: "最佳国语专辑", winner: "蔡依林《呸》", work: "Play 我呸" },
      { year: "2017", category: "最佳国语专辑", winner: "五月天《自传》", work: "成名在望" },
      { year: "2020", category: "最佳华语专辑", winner: "王若琳《爱的呼唤》", work: "我只在乎你" },
    ],
  },
  {
    id: "theatre",
    name: "全球戏剧榜单",
    en: "GLOBAL THEATRE",
    desc: "托尼奖 · 奥利弗奖 · 音乐剧最高荣誉",
    officialUrl: "https://www.tonyawards.com/",
    rows: [
      { year: "2025", category: "托尼奖 · 最佳音乐剧", winner: "Dead Outlaw", work: "Dead Outlaw" },
      { year: "2024", category: "托尼奖 · 最佳音乐剧", winner: "The Outsiders", work: "Great Expectations" },
      { year: "2023", category: "托尼奖 · 最佳音乐剧", winner: "Kimberly Akimbo", work: "How to Be a Person" },
      { year: "2022", category: "托尼奖 · 最佳音乐剧", winner: "A Strange Loop", work: "A Strange Loop" },
      { year: "2024", category: "奥利弗奖 · 最佳新音乐剧", winner: "Operation Mincemeat", work: "Operation Mincemeat" },
      { year: "2023", category: "奥利弗奖 · 最佳新音乐剧", winner: "Standing at the Sky's Edge", work: "Standing at the Sky's Edge" },
    ],
  },
];
