"use client";
import { useEffect, useRef, useState } from "react";

// 뷰포트 진입 시 fade-up. GSAP(히어로 전용)과 혼용하지 않기 위해 순수 CSS
// transition + IntersectionObserver로만 구현한다. prefers-reduced-motion에서는
// motion-reduce:transition-none이 transition 자체를 없애 즉시(inView 상태와
// 무관하게 다음 페인트에서 바로) 최종 상태로 보이게 한다.
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setInView(true), io.disconnect()),
      { threshold: 0.25 },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        inView ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-sm"
      }`}
    >
      {children}
    </div>
  );
}
