// 播客清单（纯数据，client/server 通用，勿引入 node 模块）
export interface PodcastFeed {
  id: string;
  name: string;
  desc: string;
  rss: string;
}

// 已实测可达的公开中文播客 RSS（谈话类 · 文学艺术）
export const PODCAST_FEEDS: PodcastFeed[] = [
  {
    id: "tiaodao",
    name: "跳岛FM",
    desc: "中信出版 · 文学播客",
    rss: "https://tiaodao.typlog.io/feed.xml",
  },
  {
    id: "wenhua",
    name: "文化有限",
    desc: "文化 · 文学话题谈话",
    rss: "https://s1.proxy.wavpub.com/weknownothing.xml",
  },
  {
    id: "jiangbulidao",
    name: "今天不讲道理",
    desc: "书籍 · 影视 · 文化闲聊",
    rss: "https://feed.xyzfm.space/kkguhemdb6nr",
  },
  {
    id: "kanlixiang",
    name: "看理想圆桌",
    desc: "文化 · 艺术 · 思想对谈",
    rss: "https://api.vistopia.com.cn/rss/program/13.xml",
  },
  {
    id: "luosi",
    name: "螺丝在拧紧",
    desc: "文化 · 文学对谈",
    rss: "http://www.ximalaya.com/album/47008946.xml",
  },
  {
    id: "huzuo",
    name: "忽左忽右",
    desc: "历史 · 文化对谈",
    rss: "https://feed.xyzfm.space/cv4bkgpuglwp",
  },
  {
    id: "yixi",
    name: "一席",
    desc: "人文 · 演讲 · 思想",
    rss: "https://feed.xyzfm.space/jq7xytwpykrg",
  },
  {
    id: "meiliangxiang",
    name: "没理想编辑部",
    desc: "看理想 · 文化闲聊",
    rss: "https://api.vistopia.com.cn/rss/program/116.xml",
  },
];
