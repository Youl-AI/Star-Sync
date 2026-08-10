"use client";
import { useEffect, useRef, useState } from "react";

/**
 * 뷰포트에 들어오면 안쪽의 data-reveal 요소들을 순서대로 들여보낸다.
 *
 * 이 컴포넌트 자체는 아무것도 움직이지 않는다. 클래스 하나(reveal-in)를 켜는
 * 일만 하고, 실제 등장 순서와 속도는 globals.css의 [data-reveal] 규칙과 각
 * 요소의 --reveal-i 값이 정한다. 요소마다 자바스크립트 타이머를 걸면 프레임이
 * 밀릴 때 순서가 어긋나지만, CSS transition-delay는 브라우저가 알아서 맞춘다.
 *
 * GSAP은 히어로 전용이라 여기서 쓰지 않는다. 스크롤 이벤트 리스너도 쓰지
 * 않는다(스크롤 프레임마다 실행되어 버벅인다) — IntersectionObserver 한 번이면
 * 충분하다.
 *
 * 감소 모드에서는 옵저버를 기다리지 않고 즉시 켠다. globals.css의 전역
 * transition-duration: .01ms 규칙이 움직임 자체는 이미 없애지만, 옵저버가
 * 발화하기 전까지 요소가 opacity 0으로 남아 있는 것은 그 규칙으로 해결되지
 * 않기 때문이다.
 */
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
    <div ref={ref} className={inView ? "reveal-in" : undefined}>
      {children}
    </div>
  );
}
