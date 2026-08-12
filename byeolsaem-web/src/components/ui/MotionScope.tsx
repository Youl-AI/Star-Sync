"use client";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/**
 * Motion(`motion/react`)의 울타리 — 스프링을 실제로 쓰는 잎 컴포넌트가 자기
 * 둘레에만 친다.
 *
 * 전역(루트 레이아웃)에 치지 않는 이유는 값이다. 실측으로 모션 런타임이
 * 페이지당 gzip +41KB인데, `/sign`·`/retrograde`·`/blog`는 스펙 §5.4·§7이
 * "속도 우선"으로 못박은 검색 유입 페이지라 스프링 하나에 그 값을 낼 수 없다.
 * 울타리를 잎에 두면 모션 없는 페이지는 한 바이트도 싣지 않는다.
 *
 * 역할 분담은 스펙 §1 그대로 — GSAP+ScrollTrigger는 스크롤텔링(핀·스크럽),
 * Motion은 컴포넌트 마이크로 모션. 같은 요소를 둘이 함께 만지지 않는다.
 *
 * strict: `motion.` 전체 런타임을 실수로 쓰면 개발 중에 바로 던진다.
 * reducedMotion="user": 감소 모드에서 스프링이 즉시 값으로 건너뛴다.
 */
export function MotionScope({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
