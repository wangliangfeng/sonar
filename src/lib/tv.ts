// 中文电视频道直播流（纯数据，client/server 通用，勿引入 node 模块）
// 均为 HLS(.m3u8)，走 hls.js 伴听（仅音频）；索引/分片/CORS 均已实测可达。
// 央视为公开 IPTV 源；浙江为浙江广电「新蓝网」官方源。
export interface TvChannel {
  id: string;
  name: string;
  desc: string;
  url: string;
}

export const TV_CHANNELS: TvChannel[] = [
  // 央视（公开 IPTV 源）
  { id: "cctv1", name: "CCTV-1 综合", desc: "央视 · HLS 伴听", url: "https://liveplay-srs.voc.com.cn/hls/tv/134_180adf.m3u8" },
  { id: "cctv2", name: "CCTV-2 财经", desc: "央视 · HLS 伴听", url: "http://1.24.39.180:9003/hls/2/index.m3u8" },
  { id: "cctv5", name: "CCTV-5 体育", desc: "央视 · HLS 伴听", url: "http://1.24.39.180:9003/hls/5/index.m3u8" },
  { id: "cctv6", name: "CCTV-6 电影", desc: "央视 · HLS 伴听", url: "http://1.24.39.180:9003/hls/6/index.m3u8" },
  { id: "cctv8", name: "CCTV-8 电视剧", desc: "央视 · HLS 伴听", url: "http://1.24.39.180:9003/hls/8/index.m3u8" },
  { id: "cctv13", name: "CCTV-13 新闻", desc: "央视 · HLS 伴听", url: "http://1.24.39.180:9003/hls/13/index.m3u8" },
  // 浙江 · 浙江广电「新蓝网」官方源
  { id: "zjws", name: "浙江卫视", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel001/1080p.m3u8" },
  { id: "zjnews", name: "浙江公共新闻", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel007/1080p.m3u8" },
  { id: "zjqj", name: "浙江钱江都市", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel002/1080p.m3u8" },
  { id: "zjjs", name: "浙江经视", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel003/1080p.m3u8" },
  { id: "zjkj", name: "浙江教科影视", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel004/1080p.m3u8" },
  { id: "zjms", name: "浙江民生休闲", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel006/1080p.m3u8" },
  { id: "zjse", name: "浙江少儿", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel008/1080p.m3u8" },
  { id: "zjgjj", name: "浙江国际", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel010/1080p.m3u8" },
  { id: "zjzl", name: "之江纪录", desc: "浙江 · 新蓝网官方", url: "https://ali-m-l.cztv.com/channels/lantian/channel012/1080p.m3u8" },
];

// 抖音直播：无公开直链，站内点击后新标签页打开抖音网页版（可在此追加具体直播间链接）
export interface DouyinLink {
  id: string;
  name: string;
  desc: string;
  url: string;
}

export const DOUYIN_LINKS: DouyinLink[] = [
  { id: "dy-home", name: "抖音直播", desc: "新标签页打开抖音网页版", url: "https://live.douyin.com/" },
];
