/**
 * 선-다이아-선 장식. `symbol`이 오면 다이아 대신 그 글리프가 앉는다 —
 * 별자리 카드는 자리 글리프(♌), 달 카드는 ☽를 앉힌다(2026-08-24 요청).
 * 글리프 뒤의 U+FE0E는 이모지 폴백 방지(globals.css .astro-symbol 참고).
 */
export function LineDiamond({ className = "", symbol }: { className?: string; symbol?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden>
      <span className="h-px w-6 bg-gold/50" />
      {symbol ? (
        <span className="astro-symbol text-[0.8rem] leading-none text-gold-soft/90">
          {symbol + "\uFE0E"}
        </span>
      ) : (
        <span className="size-[3px] rotate-45 bg-gold-soft/70" />
      )}
      <span className="h-px w-6 bg-gold/50" />
    </div>
  );
}
