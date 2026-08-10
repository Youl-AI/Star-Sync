"use client";
import { useState } from "react";
import { GoldButton } from "@/components/ui/GoldButton";
import { Moon } from "./Moon";

export type Scene = "arrival" | "altar" | "ritual" | "complete";

// 장면별 달 위치. "arrival"은 화면 우상단 모서리에 반쯤 걸쳐 잘린 비대칭 구도,
// 그 이후 장면은 중앙 상단으로 이동한다. 이번 태스크에서는 CSS 클래스가 즉시
// 바뀌는 것까지만 구현한다 — 부드러운 전환(GSAP)은 다음 태스크(Task 9)의 몫이라
// 여기서는 transition 유틸리티를 의도적으로 걸지 않는다.
const MOON_POSITION: Record<Scene, string> = {
  arrival: "-right-[130px] -top-[110px] md:-right-[210px] md:-top-[170px]",
  altar: "left-1/2 top-[18%] -translate-x-1/2 -translate-y-1/2",
  ritual: "left-1/2 top-[18%] -translate-x-1/2 -translate-y-1/2",
  complete: "left-1/2 top-[18%] -translate-x-1/2 -translate-y-1/2",
};

export function HeroSequence() {
  const [scene, setScene] = useState<Scene>("arrival");

  return (
    <section className="relative min-h-[100dvh] overflow-hidden" id="hero">
      <Moon className={MOON_POSITION[scene]} />

      {scene === "arrival" && (
        <div className="absolute bottom-20 left-6 md:bottom-24 md:left-14">
          <h1 className="font-display text-3xl leading-snug text-starlight md:text-6xl">
            <span className="block whitespace-nowrap">당신이 태어난 밤,</span>
            <em className="block whitespace-nowrap not-italic text-gold-soft">하늘은 기억하고 있어요</em>
          </h1>
          <p className="mt-5 text-sm text-starlight-dim md:text-base">
            태어난 순간의 행성 배치로 읽는 나의 이야기
          </p>
          <div className="mt-8 flex items-center gap-6">
            <GoldButton variant="solid" onClick={() => setScene("altar")}>
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
        <div className="absolute inset-x-0 top-[52%] px-6 text-center" id="hero-ritual">
          <p className="font-display text-2xl text-starlight md:text-3xl">
            어느 밤에 태어나셨나요?
          </p>
        </div>
      )}
    </section>
  );
}
