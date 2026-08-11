import Link from "next/link";

/**
 * 글 안에 박아 넣는 새벽 배색 부적 칩 (스펙 §6.8).
 *
 * 본문에서 개념 하나가 그 개념만 다루는 페이지를 가리킬 때 쓴다. 문장 흐름을
 * 끊는 배너 대신 한 줄 안에 들어가는 표식이라, 읽던 사람이 그냥 지나쳐도
 * 손해가 없다.
 */
export function DawnChip({
  symbol,
  label,
  href,
}: {
  /** 행성·어스펙트 기호. 컬러 이모지로 바뀌지 않게 astro-symbol을 쓴다. */
  symbol: string;
  label: string;
  href?: string;
}) {
  const className =
    "inline-flex items-baseline gap-1.5 rounded-full border border-gold-dark/45 bg-gold-dark/5 px-3 py-1 text-[13px] tracking-wide text-gold-dark no-underline transition-colors hover:border-gold-dark hover:bg-gold-dark/10";
  const content = (
    <>
      <span className="astro-symbol" aria-hidden>
        {symbol}
        {"︎"}
      </span>
      <span>{label}</span>
    </>
  );

  if (!href) return <span className={className}>{content}</span>;
  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
