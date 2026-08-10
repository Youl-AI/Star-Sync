"use client";

export function TalismanChip({
  symbol,
  label,
  theme = "night",
  onClick,
}: {
  symbol: string;
  label: string;
  theme?: "night" | "dawn";
  onClick?: () => void;
}) {
  const cls =
    theme === "night"
      ? "border-gold/50 text-gold-soft"
      : "border-gold-dark/50 text-gold-dark bg-gold-dark/5";
  const className = `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-transform active:scale-[0.98] ${cls}`;
  const content = (
    <>
      <span className="astro-symbol" aria-hidden>
        {symbol}
        {"︎"}
      </span>
      <span>{label}</span>
    </>
  );

  // onClick이 없으면 상호작용이 없는 순수 표시용 칩이다. <button>으로 렌더하면
  // 키보드 사용자에게 아무 반응 없는 탭 스톱이 생기고 스크린리더는 "버튼"이라
  // 읽어 상호작용이 있다고 오인시킨다 — <span>으로 렌더해 탭 순서에서 제외한다.
  if (!onClick) {
    return <span className={className}>{content}</span>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
