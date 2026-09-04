import { Link } from "@/components/ui/Link";

/**
 * 월 이동 링크.
 *
 * 같은 꼴의 화면끼리 오갈 때는 스크롤을 그대로 둔다(keepScroll) — 표 가운데를
 * 읽다가 다음 달을 누르면 맨 위로 튕겨 올라가는 것이 "다른 페이지로 갔다"는
 * 느낌의 큰 몫이었다. 허브에서 월별 화면으로 갈 때는 머리글 높이가 달라
 * 그대로 두면 엉뚱한 자리에 떨어지므로, 그쪽은 기본값대로 위로 올린다.
 */
export function CalMonthNav({
  label,
  prevHref,
  nextHref,
  as = "h1",
  keepScroll = false,
}: {
  label: string;
  prevHref: string | null;
  nextHref: string | null;
  as?: "h1" | "h2";
  keepScroll?: boolean;
}) {
  // 허브는 페이지 제목 h1을 따로 가지므로 h2로 내려 앉는다 — 문서에 h1은 하나.
  const Heading = as;
  const cls = "text-sm text-starlight-dim transition-colors hover:text-gold-soft";
  return (
    // 위쪽 여백을 자기가 갖는다 — 앞에 무엇이 오든(범례 상자처럼 테두리를 두른
    // 것이라도) 달 이름이 그것에 붙지 않는다. 앞 요소가 이미 아래 여백을 가진
    // 자리에서는 마진이 합쳐지므로 간격이 두 배가 되지 않는다.
    <div className="mt-10 flex items-baseline justify-between border-b border-gold/20 pb-3">
      <Heading className="break-keep font-display text-2xl text-starlight md:text-3xl">{label}</Heading>
      <div className="flex items-baseline gap-5">
        {prevHref ? (
          <Link href={prevHref} scroll={!keepScroll} className={cls}>
            ‹ 이전 달
          </Link>
        ) : (
          <span className="text-sm text-starlight-dim/40">‹ 이전 달</span>
        )}
        {nextHref ? (
          <Link href={nextHref} scroll={!keepScroll} className={cls}>
            다음 달 ›
          </Link>
        ) : (
          <span className="text-sm text-starlight-dim/40">다음 달 ›</span>
        )}
      </div>
    </div>
  );
}
