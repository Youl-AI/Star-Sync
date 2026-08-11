"use client";

import { useEffect, useRef } from "react";
import type { ZodiacSign } from "@/lib/zodiac";

interface MockChartProps {
  /** 그릴 성좌. 입력된 생년월일의 태양궁이라 사람마다 다르다(lib/zodiac.ts). */
  sign: ZodiacSign;
  onDrawn: () => void;
}

export function MockChart({ sign, onDrawn }: MockChartProps) {
  const pathRef = useRef<SVGPathElement>(null);
  // onDrawn을 ref로 감싸 effect의 의존성 배열을 비워둔다 — 부모가 매 렌더마다
  // 새 함수 참조를 넘기더라도(인라인 화살표 함수) 드로잉 애니메이션이 재시작되지 않는다.
  const onDrawnRef = useRef(onDrawn);
  onDrawnRef.current = onDrawn;

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      // 감소 모드에서는 드로잉 연출 없이 즉시 완성된 상태로 보여야 한다.
      path.style.strokeDashoffset = "0";
      onDrawnRef.current();
      return;
    }

    path.style.strokeDashoffset = `${len}`;
    path.getBoundingClientRect(); // reflow: 위에서 설정한 offset이 트랜지션 시작점으로 확정되게 강제
    path.style.transition = "stroke-dashoffset 2s ease-in-out";
    path.style.strokeDashoffset = "0";
    const timer = window.setTimeout(() => onDrawnRef.current(), 2100);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <svg
      viewBox="0 0 260 200"
      className="mx-auto w-56"
      role="img"
      aria-label={`${sign.ko} 성좌`}
    >
      <path
        ref={pathRef}
        d={sign.path}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="0.9"
        opacity=".9"
      />
      {sign.stars.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="var(--color-starlight)" />
      ))}
    </svg>
  );
}
