"use client";
import { m } from "motion/react";
import { MotionScope } from "./MotionScope";

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
  const className = `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs tracking-wide ${cls}`;
  const content = (
    <>
      <span className="astro-symbol" aria-hidden>
        {symbol}
        {"︎"}
      </span>
      <span>{label}</span>
    </>
  );

  // 부적이 지면 위로 살짝 떠오르며 나타난다(스펙 §4.4). 칩은 결과가 조립될 때
  // 함께 생기므로 마운트가 곧 등장이다. 감소 모드는 MotionConfig가 건너뛴다.
  const appear = {
    initial: { opacity: 0, scale: 0.9, y: 6 },
    animate: { opacity: 1, scale: 1, y: 0 },
    transition: { type: "spring", stiffness: 100, damping: 20 },
  } as const;

  // onClick이 없으면 상호작용이 없는 순수 표시용 칩이다. <button>으로 렌더하면
  // 키보드 사용자에게 아무 반응 없는 탭 스톱이 생기고 스크린리더는 "버튼"이라
  // 읽어 상호작용이 있다고 오인시킨다 — <span>으로 렌더해 탭 순서에서 제외한다.
  if (!onClick) {
    return (
      <MotionScope>
        <m.span {...appear} className={className}>
          {content}
        </m.span>
      </MotionScope>
    );
  }

  return (
    <MotionScope>
      <m.button
        {...appear}
        whileTap={{ scale: 0.96 }}
        type="button"
        onClick={onClick}
        className={className}
      >
        {content}
      </m.button>
    </MotionScope>
  );
}
