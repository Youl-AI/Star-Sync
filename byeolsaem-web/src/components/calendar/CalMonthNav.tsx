"use client";
import Link from "next/link";

/**
 * 월 이동 링크. 누르는 순간 문서 루트에 방향을 심어 두면 TransitionStage가 여는
 * View Transition에서 globals.css의 방향별 슬라이드가 걸린다. 전환이 끝날 때쯤
 * 지운다 — 남겨 두면 달력과 무관한 다음 이동까지 슬라이드된다.
 */
function setDir(dir: "prev" | "next") {
  document.documentElement.dataset.calDir = dir;
  window.setTimeout(() => {
    delete document.documentElement.dataset.calDir;
  }, 600);
}

export function CalMonthNav({
  label,
  prevHref,
  nextHref,
}: {
  label: string;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const cls = "text-sm text-starlight-dim transition-colors hover:text-gold-soft";
  return (
    <div className="flex items-baseline justify-between border-b border-gold/20 pb-3">
      <h1 className="break-keep font-display text-2xl text-starlight md:text-3xl">{label}</h1>
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
