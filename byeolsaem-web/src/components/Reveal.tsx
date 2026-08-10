"use client";
import { useEffect, useRef, useState } from "react";

// 뷰포트 진입 시 fade-up. GSAP(히어로 전용)과 혼용하지 않기 위해 순수 CSS
// transition + IntersectionObserver로만 구현한다.
//
// motion-reduce:transition-none은 transition 자체만 없앨 뿐, IntersectionObserver가
// 아직 발화하지 않은 동안의 opacity-0/translate-y-8 상태는 감소 모드에서도 그대로
// 유지된다 — "즉시 최종 상태로 보인다"는 것은 사실이 아니다(게다가 globals.css에
// 이미 전역 transition-duration: .01ms !important 규칙이 있어 이 유틸리티 자체도
// 중복이다). 그래서 마운트 시 prefers-reduced-motion을 직접 확인해, 감소 모드면
// 옵저버를 기다리지 않고 inView를 즉시 true로 만든다.
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setInView(true), io.disconnect()),
      { threshold: 0.01, rootMargin: "0px 0px -10% 0px" },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        inView ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-sm"
      }`}
    >
      {children}
    </div>
  );
}
