"use client";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PIN_MEDIA, refreshOnBodyGrowth } from "@/lib/pin";

gsap.registerPlugin(ScrollTrigger);

/**
 * 세 개의 문을 붙박아 두고 스크롤이 문을 하나씩 세운다(스펙 §4.4의 "핀 섹션
 * 메인 1곳", 자리는 §11.4에서 확정). 핀은 구경거리가 아니라 속도 조절이다 —
 * 세 문이 화면을 스치듯 지나가는 대신, 스크롤을 쥔 사람의 손이 문 하나하나를
 * 세우는 속도가 된다. 별하늘(전역 fixed)은 그동안 그대로 있으므로 "별하늘을
 * 붙박고 문이 다가온다"는 §11.4의 그림 그대로다.
 *
 * 서버가 그린 내용물(제목 + 문 셋)을 children으로 받기만 한다. 문은 [data-door]
 * 표식으로 찾는다 — 이 컴포넌트가 문 내용을 알 필요는 없다.
 *
 * 좁은 화면과 감소 모드에서는 핀 없이 지금까지의 등장(data-reveal)만 남는다.
 * gsap.matchMedia가 조건이 풀릴 때 스타일을 스스로 되돌린다.
 */
export function DoorsPin({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = ref.current;
    if (!section) return;

    const mm = gsap.matchMedia();
    mm.add(PIN_MEDIA, () => {
      const doors = section.querySelectorAll<HTMLElement>("[data-door]");
      if (doors.length === 0) return;

      // autoAlpha(visibility까지 끔)라 숨은 문도 자리는 차지한다 — 등장 전에
      // 격자 높이가 변하면 시작점 계산이 어긋난다.
      gsap.set(doors, { autoAlpha: 0, y: 36, scale: 0.97 });

      // 핀을 걸었다가 풀었다. 핀은 빨리 내리고 싶은 사람에게 90vh의 통행세를
      // 걷는다 — 수상작들도 핀은 그림 자체가 변형되는 장면(/yearly의 가로 강
      // 같은 것)에만 걸고, 카드 몇 장의 등장은 지나가는 길에 스스로 서게 한다.
      // "차례로 선다"는 스태거가 지킨다: 천천히 보면 I → II → III이 시차를
      // 두고 서고, 빨리 내리면 아무것도 막지 않는다. 문이 서는 속도는
      // 스크롤이 아니라 시간(0.7초, power3.out)이 정한다.
      const tween = gsap.to(doors, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.18,
        scrollTrigger: {
          trigger: section,
          start: "top 55%",
          // 위로 되감으면 문도 되돌아간다 — 사이트의 다른 등장(Reveal)과 같다.
          toggleActions: "play none none reverse",
        },
      });

      // 히어로가 장면을 접거나 늦게 그려지는 내용이 끼어들면 시작점을 다시 잰다.
      const stopWatching = refreshOnBodyGrowth(() => ScrollTrigger.refresh());
      return () => {
        stopWatching();
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-28 md:py-40">
      {children}
    </section>
  );
}
