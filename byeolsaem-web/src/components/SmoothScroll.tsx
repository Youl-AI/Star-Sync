"use client";
import { useEffect } from "react";
import Lenis from "lenis";

// 전역 부드러운 스크롤. Lenis는 실제 window 스크롤 위치(scrollY)를 프레임마다
// 갱신하며 진행하므로 IntersectionObserver 기반 센티넬(Veil 등)은 원칙적으로
// 그대로 동작한다. reduced-motion에서는 아예 기동하지 않는다.
export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.1 });
    let raf: number;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
