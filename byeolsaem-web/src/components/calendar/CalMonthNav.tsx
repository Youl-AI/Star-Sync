"use client";
import { Link } from "@/components/ui/Link";

/**
 * 월 이동 링크. 누르는 순간 문서 루트에 방향을 심어 두면 TransitionStage가 여는
 * View Transition에서 globals.css의 방향별 슬라이드가 걸린다. 전환이 끝날 때쯤
 * 지운다 — 남겨 두면 달력과 무관한 다음 이동까지 슬라이드된다.
 */
function setDir(dir: "prev" | "next") {
  document.documentElement.dataset.calDir = dir;
  // TransitionStage의 커밋 데드라인은 1200ms — 그보다 짧게 지우면 늦게 커밋된
  // 전환이 방향 없이 걸려 다음 무관한 이동까지 슬라이드 없이 어긋난다(최종 리뷰
  // M-7). 1300ms로 여유를 둔다.
  window.setTimeout(() => {
    delete document.documentElement.dataset.calDir;
  }, 1300);
}

export function CalMonthNav({
  label,
  prevHref,
  nextHref,
  as = "h1",
}: {
  label: string;
  prevHref: string | null;
  nextHref: string | null;
  as?: "h1" | "h2";
}) {
  // 허브는 페이지 제목 h1을 따로 가지므로 h2로 내려 앉는다 — 문서에 h1은 하나.
  const Heading = as;
  const cls = "text-sm text-starlight-dim transition-colors hover:text-gold-soft";
  return (
    <div className="flex items-baseline justify-between border-b border-gold/20 pb-3">
      <Heading className="break-keep font-display text-2xl text-starlight md:text-3xl">{label}</Heading>
      <div className="flex items-baseline gap-5">
        {prevHref ? (
          <Link href={prevHref} className={cls} onClick={() => setDir("prev")}>
            ‹ 이전 달
          </Link>
        ) : (
          <span className="text-sm text-starlight-dim/40">‹ 이전 달</span>
        )}
        {nextHref ? (
          <Link href={nextHref} className={cls} onClick={() => setDir("next")}>
            다음 달 ›
          </Link>
        ) : (
          <span className="text-sm text-starlight-dim/40">다음 달 ›</span>
        )}
      </div>
    </div>
  );
}
