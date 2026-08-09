"use client";

// 程序化封面兜底：视频无缩略图时自动生成渐变封面（非真 AIGC，无需 API key）
export function coverGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue},50%,42%), hsl(${(hue + 45) % 360},58%,28%))`;
}

export function CoverFallback({ title, icon = "♪" }: { title: string; icon?: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center p-2 text-center"
      style={{ background: coverGradient(title) }}
    >
      <span className="text-3xl text-paper/85">{icon}</span>
      <span className="mt-1 line-clamp-2 text-[10px] text-paper/80">{title}</span>
    </div>
  );
}
