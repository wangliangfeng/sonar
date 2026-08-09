// 中文电台直播流（纯数据，client/server 通用，勿引入 node 模块）
// HLS 走 hls.js；MP3 直连走 HTML5 audio。均已实测可达
export interface RadioStation {
  id: string;
  name: string;
  desc: string;
  url: string;
}

export const RADIO_STATIONS: RadioStation[] = [
  // 国际台（HLS，hls.js 播放）
  { id: "cri905", name: "环球资讯广播", desc: "CRI 国际台", url: "http://sk.cri.cn/905.m3u8" },
  { id: "cri846", name: "国际台 AM846", desc: "CRI 国际台", url: "http://sk.cri.cn/am846.m3u8" },
  // 杭州/浙江本地（蜻蜓 FM 直播，MP3 直连）
  { id: "qt1133", name: "杭州交通广播", desc: "杭州 · FM91.8", url: "http://lhttp.qingting.fm/live/1133/64k.mp3" },
  { id: "qt1163", name: "西湖之声", desc: "杭州 · FM105.4", url: "http://lhttp.qingting.fm/live/1163/64k.mp3" },
  { id: "qt4875", name: "杭州FM90.7", desc: "杭州 · 音乐", url: "http://lhttp.qingting.fm/live/4875/64k.mp3" },
  { id: "qt4518", name: "浙江之声", desc: "浙江 · FM88", url: "http://lhttp.qingting.fm/live/4518/64k.mp3" },
  { id: "qt2799", name: "浙江交通之声", desc: "浙江 · FM93", url: "http://lhttp.qingting.fm/live/2799/64k.mp3" },
  // 蜻蜓 FM 直播（MP3 直连）
  { id: "qt5052", name: "绍兴综合广播 FM93.6", desc: "浙江 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/5052/64k.mp3" },
  { id: "qt5054", name: "绍兴音乐广播 FM103.5", desc: "浙江 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/5054/64k.mp3" },
  { id: "qt4936", name: "江苏音乐广播 PlayFM897", desc: "江苏 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/4936/64k.mp3" },
  { id: "qt4938", name: "江苏经典流行音乐", desc: "江苏 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/4938/64k.mp3" },
  { id: "qt4963", name: "南京音乐广播", desc: "江苏 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/4963/64k.mp3" },
  { id: "qt4932", name: "山西音乐广播", desc: "山西 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/4932/64k.mp3" },
  { id: "qt4969", name: "黑龙江音乐广播", desc: "黑龙江 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/4969/64k.mp3" },
  { id: "qt4921", name: "郑州音乐广播", desc: "河南 · 蜻蜓直播", url: "http://lhttp.qingting.fm/live/4921/64k.mp3" },
  { id: "qt4913", name: "乐享音乐", desc: "蜻蜓直播 · 音乐", url: "http://lhttp.qingting.fm/live/4913/64k.mp3" },
];
