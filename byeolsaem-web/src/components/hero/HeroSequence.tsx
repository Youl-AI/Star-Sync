"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { GoldButton } from "@/components/ui/GoldButton";
import { ArchCard } from "@/components/ui/ArchCard";
import { TalismanChip } from "@/components/ui/TalismanChip";
import { Moon } from "./Moon";
import { RitualForm } from "./RitualForm";
import { MockChart } from "./MockChart";

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
  // "complete" 장면에서 목업 천궁도 드로잉이 끝났는지. 드로잉이 끝나야 그 아래
  // 목업 결과 카드가 페이드인한다.
  const [chartDrawn, setChartDrawn] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const ritualRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  // CTA 더블클릭/Enter 재호출로 두 번째 타임라인이 생성되는 것을 막는 재진입 가드.
  // useState가 아니라 useRef인 이유: setState는 배칭되어 같은 프레임 안의 두 번째
  // 호출 시점에 아직 반영되지 않을 수 있다. ref는 대입 즉시(동기) 값이 바뀌므로
  // 같은 이벤트 루프 틱 안에서 벌어지는 연속 클릭도 확실히 막는다.
  const isTransitioningRef = useRef(false);

  // gsap.context는 이 컴포넌트가 만든 모든 트윈/타임라인(Flip 포함)을 추적해서
  // unmount 시 ctx.revert() 한 번으로 정리할 수 있게 해준다.
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {}, sectionRef);
    ctxRef.current = ctx;

    ctx.add("startRitual", () => {
      // 재진입 가드: 이미 전환이 진행 중이면(scene이 아직 "arrival"에서 안 바뀌었어도)
      // 즉시 무시한다. scene 상태가 "altar"로 바뀌어 pointer-events-none이 걸리기까지
      // 약 150ms의 창이 있고, 그 사이의 더블클릭이나 키보드 Enter 재호출을 이 플래그가 막는다.
      if (isTransitioningRef.current) {
        return;
      }
      isTransitioningRef.current = true;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reducedMotion) {
        setScene("ritual");
        isTransitioningRef.current = false;
        return;
      }

      const moonEl = document.getElementById("hero-moon");
      if (!moonEl) {
        setScene("ritual");
        isTransitioningRef.current = false;
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: "power2.out" },
        onComplete: () => {
          setScene("ritual");
          isTransitioningRef.current = false;
        },
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

          // 헤드라인 컨테이너가 이 순간 aria-hidden="true"로 바뀐다. 방금까지
          // 포커스를 갖고 있던 CTA 버튼(마우스 클릭이든 Enter 키 호출이든)이 그
          // 안에 그대로 남아있으면 "포커스 요소가 aria-hidden 조상 안에 있음"
          // 위반(axe aria-hidden-focus)이 발생한다. blur()만으로는 포커스가
          // body로 빠져 맥락이 끊기므로, 다음 단계에서 사용자가 답할 질문인
          // "어느 밤에 태어나셨나요?" 문구 쪽으로 포커스를 옮겨 스크린리더
          // 사용자에게도 흐름이 이어지게 한다. 이 시점은 aria-hidden이 걸리는
          // 시점과 동일한 동기 구간(flushSync 직후)이라 위반 창이 생기지 않는다.
          if (ritualRef.current) {
            ritualRef.current.focus({ preventScroll: true });
          } else {
            (document.activeElement as HTMLElement | null)?.blur();
          }

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

    return () => {
      ctx.revert();
      isTransitioningRef.current = false;
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      // overflow-hidden은 "arrival"/"altar" 장면에서 달이 화면 모서리에 반쯤 잘려
      // 보이는 비대칭 구도를 만들기 위한 것(위 MOON_POSITION 주석 참고)이다. 그 두
      // 장면을 벗어나면 달은 이미 중앙에 자리를 잡아 더 이상 자를 필요가 없고,
      // 오히려 의식 폼과 목업 결과가 섹션의 min-height(고정 100dvh, absolute 자식은
      // 높이 계산에 기여하지 않음)를 넘어설 때 overflow-hidden이 내용을 완전히
      // 잘라내 버려 스크롤로도 닿지 못하게 만든다(모바일 키보드 검증 항목 참고).
      // 그래서 "ritual"/"complete"에서는 overflow를 풀어 문서 스크롤이 넘치는
      // 내용을 그대로 포함하도록 한다.
      className={`relative min-h-[100dvh] ${
        scene === "ritual" || scene === "complete" ? "overflow-visible" : "overflow-hidden"
      }`}
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
          tabIndex={-1}
          className="absolute inset-x-0 top-[52%] px-6 pb-16 text-center focus:outline-none"
          id="hero-ritual"
        >
          <p className="font-display text-2xl text-starlight md:text-3xl">
            어느 밤에 태어나셨나요?
          </p>

          {scene === "ritual" && (
            <div className="mt-10">
              <RitualForm onComplete={() => setScene("complete")} />
            </div>
          )}

          {scene === "complete" && (
            <div className="mt-10 flex flex-col items-center gap-8">
              <MockChart onDrawn={() => setChartDrawn(true)} />
              <div
                className={`flex flex-col items-center gap-6 transition-opacity duration-700 ${
                  chartDrawn ? "opacity-100" : "opacity-0"
                }`}
                inert={!chartDrawn}
              >
                <ArchCard
                  name="봄의 불꽃"
                  latin="MOCK RESULT"
                  tagline="곧 진짜 하늘이 연결됩니다"
                />
                <div className="flex flex-wrap justify-center gap-2.5">
                  <TalismanChip symbol="☉" label="태양 양자리" />
                  <TalismanChip symbol="☽" label="달 게자리" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
