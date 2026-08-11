"use client";
import { useEffect, useRef } from "react";

/**
 * 글 상단의 금색 읽기 진행선(스펙 §6.8).
 *
 * 스크롤 위치를 React 상태로 들고 있지 않다. 그렇게 하면 스크롤 프레임마다
 * 트리 전체가 다시 렌더된다 — 이 프로젝트가 금지하는 패턴이다. 대신 rAF 루프
 * 안에서 DOM 노드의 transform만 직접 건드린다. 리액트는 이 요소를 한 번 만들고
 * 그 뒤로는 관여하지 않는다.
 *
 * 진행률을 width가 아니라 scaleX로 준 것도 같은 이유다. width는 매 프레임
 * 레이아웃을 다시 계산하지만 transform은 합성만으로 끝난다.
 */
export function ReadingProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let raf = 0;
    let last = -1;

    const tick = () => {
      const doc = document.documentElement;
      // 읽을 거리가 없는 짧은 문서에서는 0으로 나누게 되므로 1로 막는다.
      const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
      const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
      // 소수 셋째 자리까지 같으면 건너뛴다 — 멈춰 있을 때 style 쓰기를 하지 않는다.
      if (Math.abs(ratio - last) > 0.001) {
        bar.style.transform = `scaleX(${ratio})`;
        last = ratio;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-50 h-px bg-gold-dark/10" aria-hidden>
      <div
        ref={barRef}
        className="h-full origin-left bg-gold-dark/70"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
