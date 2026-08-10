"use client";

import { useEffect, useRef } from "react";

// 목업 성좌: 7개의 별을 잇는 고정 폴리라인. 실제 천궁도 연산은 이번 태스크 범위 밖이라
// 좌표는 하드코딩된 값이다.
const STARS: [number, number][] = [
  [60, 40],
  [110, 80],
  [170, 60],
  [200, 120],
  [150, 170],
  [90, 150],
];
const PATH = "M60 40 L110 80 L170 60 L200 120 L150 170 L90 150 L60 40";

export function MockChart({ onDrawn }: { onDrawn: () => void }) {
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
    <svg viewBox="0 0 260 200" className="mx-auto w-56" role="img" aria-label="목업 천궁도">
      <path
        ref={pathRef}
        d={PATH}
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="0.9"
        opacity=".9"
      />
      {STARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="var(--color-starlight)" />
      ))}
    </svg>
  );
}
