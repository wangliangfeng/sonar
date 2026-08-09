// 人呐印章：朱砂红方印 + 「人呐」字样（致敬莫言《人呐》）+ REN NA 标识
export function Seal({ size = 76 }: { size?: number }) {
  return (
    <svg className="seal" width={size} height={size} viewBox="0 0 76 76" aria-hidden="true">
      <rect x="2.5" y="2.5" width="71" height="71" rx="11" fill="var(--red)" />
      <rect x="8" y="8" width="60" height="60" rx="8" fill="none" stroke="rgba(243,234,216,.9)" />
      <text
        x="38"
        y="44"
        fontSize="26"
        fontWeight="bold"
        textAnchor="middle"
        fill="#f3ead8"
        fontFamily="KaiTi, STKaiti, Kaiti SC, Noto Serif SC, serif"
      >
        人呐
      </text>
      <text
        x="38"
        y="63"
        fontSize="6.5"
        letterSpacing="1.5"
        textAnchor="middle"
        fill="rgba(243,234,216,.85)"
      >
        REN NA
      </text>
    </svg>
  );
}
