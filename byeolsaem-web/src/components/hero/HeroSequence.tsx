"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { GoldButton } from "@/components/ui/GoldButton";
import { Moon } from "./Moon";

gsap.registerPlugin(Flip);

export type Scene = "arrival" | "altar" | "ritual" | "complete";

// 장면별 달 위치. "arrival"은 화면 우상단 모서리에 반쯤 걸쳐 잘린 비대칭 구도,
// 그 이후 장면은 중앙 상단으로 이동한다. 클래스 자체는 즉시 바뀌지만(top/left는
// 절대 애니메이션하지 않는다), startRitual()이 전환 직전 시점의 GSAP Flip으로
// 두 위치 사이를 transform 보간해 "미끄러지듯" 움직이는 것처럼 보이게 한다.
//
// 주의: 중앙 정렬을 `-translate-x-1/2 -translate-y-1/2`(Tailwind translate 유틸,
// 즉 transform 프로퍼티)로 하지 않는다. GSAP Flip도 같은 요소의 transform을
// 직접 제어하므로 두 시스템이 transform 프로퍼티를 두고 충돌하면 Flip이 캐싱한
// transform 값이 최종적으로 CSS 클래스의 translate를 덮어써 버려, 애니메이션이
// 끝나는 순간 달이 (translate 없는 위치)에서 (translate 적용된 진짜 목표 위치)로
// 순간 점프하는 버그가 생긴다(dev-browser 좌표 기록으로 실측 확인함). 달의 크기가
// 브레이크포인트별 고정값(260px/400px)이므로 음수 margin으로 동일한 중앙 정렬
// 효과를 transform 없이 낼 수 있다.
const MOON_POSITION: Record<Scene, string> = {
  arrival: "-right-[130px] -top-[110px] md:-right-[210px] md:-top-[170px]",
  altar: "left-1/2 top-[18%] -ml-[130px] -mt-[130px] md:-ml-[200px] md:-mt-[200px]",
  ritual: "left-1/2 top-[18%] -ml-[130px] -mt-[130px] md:-ml-[200px] md:-mt-[200px]",
  complete: "left-1/2 top-[18%] -ml-[130px] -mt-[130px] md:-ml-[200px] md:-mt-[200px]",
};

export function HeroSequence() {
  const [scene, setScene] = useState<Scene>("arrival");
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const ritualRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);

  // gsap.context는 이 컴포넌트가 만든 모든 트윈/타임라인(Flip 포함)을 추적해서
  // unmount 시 ctx.revert() 한 번으로 정리할 수 있게 해준다.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {}, sectionRef);
    ctxRef.current = ctx;

    ctx.add("startRitual", () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedMotion) {
        setScene("ritual");
        return;
      }

      const moonEl = document.getElementById("hero-moon");
      if (!moonEl) {
        setScene("ritual");
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => setScene("ritual"),
      });

      // 1) 헤드라인이 별빛처럼 위로 살짝 뜨며 흐려져 사라진다 (0.5s).
      if (headlineRef.current) {
        tl.to(
          headlineRef.current,
          {
            opacity: 0,
            y: -24,
            filter: "blur(6px)",
            duration: 0.5,
            ease: "power2.in",
          },
          0
        );
      }

      // 2) 헤드라인이 채 다 사라지기 전, 달이 중앙으로 흘러가기 시작한다.
      //    Flip.getState → (동기) DOM 반영 → Flip.from 순서를 한 프레임 안에서
      //    보장하기 위해 flushSync로 scene 전환을 강제 커밋한다. rAF/setState의
      //    비동기 배칭에 의존하면 달이 순간이동해 보일 수 있다.
      tl.call(
        () => {
          const state = Flip.getState(moonEl);
          flushSync(() => setScene("altar"));

          // "어느 밤에 태어나셨나요?"는 altar 진입과 동시에 마운트되지만
          // 달이 자리 잡기 전까지는 보이지 않아야 한다.
          if (ritualRef.current) {
            gsap.set(ritualRef.current, { opacity: 0, y: 12 });
          }

          const flip = Flip.from(state, {
            duration: 1.1,
            ease: "power3.out",
          });
          // 타임라인의 일부로 편입시켜 kill()/revert() 한 번으로 함께 정리되게 한다.
          tl.add(flip, tl.time());

          // 3) 달이 자리를 잡으면 곧바로 문구가 부드럽게 나타난다.
          if (ritualRef.current) {
            tl.to(
              ritualRef.current,
              { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
              ">"
            );
          }
        },
        undefined,
        0.15
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] overflow-hidden"
      id="hero"
    >
      <Moon className={MOON_POSITION[scene]} />

      {(scene === "arrival" || scene === "altar") && (
        <div
          ref={headlineRef}
          aria-hidden={scene !== "arrival"}
          className={`absolute bottom-20 left-6 md:bottom-24 md:left-14 ${
            scene !== "arrival" ? "pointer-events-none" : ""
          }`}
        >
          <h1 className="font-display text-3xl leading-snug text-starlight md:text-6xl">
            <span className="block whitespace-nowrap">당신이 태어난 밤,</span>
            <em className="block whitespace-nowrap not-italic text-gold-soft">
              하늘은 기억하고 있어요
            </em>
          </h1>
          <p className="mt-5 text-sm text-starlight-dim md:text-base">
            태어난 순간의 행성 배치로 읽는 나의 이야기
          </p>
          <div className="mt-8 flex items-center gap-6">
            <GoldButton
              variant="solid"
              onClick={() => ctxRef.current?.startRitual?.()}
            >
              나의 밤하늘 보기
            </GoldButton>
            <a
              href="/today"
              className="border-b border-starlight-dim/40 pb-0.5 text-sm text-starlight-dim transition-colors hover:text-starlight"
            >
              오늘의 하늘
            </a>
          </div>
        </div>
      )}

      {scene !== "arrival" && (
        <div
          ref={ritualRef}
          className="absolute inset-x-0 top-[52%] px-6 text-center"
          id="hero-ritual"
        >
          <p className="font-display text-2xl text-starlight md:text-3xl">
            어느 밤에 태어나셨나요?
          </p>
        </div>
      )}
    </section>
  );
}
