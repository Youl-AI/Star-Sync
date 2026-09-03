"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Chart } from "@/lib/chart";
import { PIN_MEDIA, refreshOnBodyGrowth } from "@/lib/pin";
import type { PlanetKey } from "@/lib/planets";
import {
  ChartWheel,
  ChartWheelLegend,
  describeSelection,
  type WheelSelection,
  type WheelSpotlight,
} from "./ChartWheel";
import { Term } from "./Term";

gsap.registerPlugin(ScrollTrigger);

/**
 * 원반과 그 원반을 읽는 법 — 나란히 붙어 함께 스크롤을 지난다.
 *
 * 넓은 화면에서는 이 그림이 잠시 붙박인다(스펙 §4.4의 "핀 결과 1곳", 자리는
 * §11.4에서 확정). 스크롤이 내려가는 동안 태양 → 달 → 상승궁 차례로 원반의
 * 기호가 밝아지고 옆의 설명이 갈린다 — §11.3의 "이 화면을 읽는 법" 세 줄을
 * 글로 읽는 대신 원반 위에서 눈으로 따라가게 한 것이다. 투어가 끝나면 원반이
 * 풀리고 옆자리는 평소의 범례로 돌아간다.
 *
 * 손이 우선이다. 투어 중이라도 별 기호에 커서를 올리면 그 별의 설명이 이긴다.
 * 좁은 화면과 감소 모드에서는 핀 없이 지금까지의 호버/범례 동작만 남는다.
 */

interface TourStep {
  spotlight: WheelSpotlight;
  ordinal: string;
  selection: WheelSelection | { headline: string; detail: string };
}

export function WheelFigure({
  chart,
  ascendantSignKo,
  onSelectPlanet,
}: {
  chart: Chart;
  /** 상승궁 별자리 이름. 시각을 몰라 상승궁이 없으면 undefined. */
  ascendantSignKo?: string;
  onSelectPlanet: (planet: PlanetKey) => void;
}) {
  const figureRef = useRef<HTMLElement>(null);
  const [hovered, setHovered] = useState<WheelSelection | null>(null);
  const [tourIndex, setTourIndex] = useState<number | null>(null);

  // 투어의 대본. 태양·달은 원반 호버와 같은 문장을 쓰고, 상승궁만 따로 적는다 —
  // 상승궁은 행성이 아니라 지평선과 하늘이 만나는 점이기 때문이다.
  const steps: TourStep[] = [
    { spotlight: "sun", ordinal: "하나", selection: describeSelection(chart, "sun") },
    { spotlight: "moon", ordinal: "둘", selection: describeSelection(chart, "moon") },
  ];
  if (chart.ascendant !== null && ascendantSignKo) {
    steps.push({
      spotlight: "ascendant",
      ordinal: "셋",
      selection: {
        headline: `상승궁 · ${ascendantSignKo}`,
        detail:
          "남들이 처음 보는 나 — 태어난 순간 동쪽 지평선(원반 왼쪽의 굵은 선)에 떠오르던 자리입니다.",
      },
    });
  }
  const stepCount = steps.length;

  useLayoutEffect(() => {
    const figure = figureRef.current;
    if (!figure) return;

    const mm = gsap.matchMedia();
    mm.add(PIN_MEDIA, () => {
      const trigger = ScrollTrigger.create({
        trigger: figure,
        start: "top 18%",
        // 한 별에 화면 4할의 스크롤. 처음 55%로 잡았더니 전환은 순간인데
        // 다음 전환까지의 대기가 길어 붙잡힌 기분이 들었다.
        end: `+=${stepCount * 40}%`,
        pin: true,
        onUpdate: (self) => {
          if (!self.isActive) {
            setTourIndex(null);
            return;
          }
          // 투어는 내려갈 때만 진행한다. 위로 되짚어 올라올 때 단계가 역순으로
          // 갈리면 페이지가 붙잡는 느낌이 들어서(사용자 피드백), 올라오는 동안은
          // 범례 — 바깥 띠·하우스 번호를 읽는 법 — 를 그대로 둔다. 방향을 다시
          // 아래로 꺾으면 그 지점의 단계부터 이어진다.
          if (self.direction < 0) {
            setTourIndex(null);
            return;
          }
          setTourIndex(Math.min(stepCount - 1, Math.floor(self.progress * stepCount)));
        },
        onToggle: (self) => {
          if (!self.isActive) setTourIndex(null);
        },
      });

      // 이 페이지의 본문은 출생 정보를 읽은 뒤에야 그려지므로, 문서 높이가
      // 변할 때마다 핀의 시작점을 다시 잰다.
      const stopWatching = refreshOnBodyGrowth(() => ScrollTrigger.refresh());
      return () => {
        stopWatching();
        trigger.kill();
      };
    });

    return () => mm.revert();
  }, [stepCount]);

  const tour = tourIndex !== null ? steps[tourIndex] : null;
  // 손으로 짚은 별 > 투어의 차례 > 범례.
  const shown = hovered ?? tour?.selection ?? null;

  // justify-center: 줄바꿈이 일어나 원반만 한 줄을 차지할 때 가운데로 온다.
  // 두 칸으로 눕는 폭에서는 범례가 남은 자리를 다 채워 효과가 없다.
  return (
    <figure ref={figureRef} className="mt-14 flex flex-wrap items-start justify-center gap-x-10 gap-y-6">
      {/* 원반이 이 그림의 주인공이다. 340px일 때는 기호가 눈을 좁혀야 보였다. */}
      <div className="w-full max-w-[460px] flex-none">
        <ChartWheel
          chart={chart}
          spotlight={hovered ? null : (tour?.spotlight ?? null)}
          onActiveChange={setHovered}
          onSelect={onSelectPlanet}
        />
      </div>
      <figcaption className="min-w-0 flex-1 basis-64">
        {/* 짚은 별의 설명이 범례 자리를 대신 차지한다. 따로 칸을 만들면 아무것도
            짚지 않았을 때 빈 상자가 남고, 짚었을 때는 범례와 설명이 동시에 떠서
            어느 쪽을 봐야 할지 알 수 없다. 높이는 미리 잡아 둬 갈릴 때 아래
            내용이 밀리지 않게 한다. */}
        <div className="min-h-[220px]" aria-live="polite">
          {shown ? (
            <div className="border-l-2 border-gold-soft pl-5">
              {!hovered && tour && (
                <p className="font-latin text-eyebrow tracking-[0.2em] text-gold">
                  {tour.ordinal} · {tourIndex! + 1}/{stepCount}
                </p>
              )}
              <p className={`font-display text-lg text-starlight ${!hovered && tour ? "mt-2" : ""}`}>
                {shown.headline}
              </p>
              <p className="mt-2 break-keep text-guide text-starlight">{shown.detail}</p>
              <p className="mt-4 text-meta text-starlight-dim">
                {hovered
                  ? "누르면 아래 설명으로 갑니다."
                  : "스크롤을 내리면 다음으로 넘어갑니다."}
              </p>
            </div>
          ) : (
            <ChartWheelLegend />
          )}
        </div>
        <p className="mt-5 break-keep text-meta text-starlight-dim">
          <Term name="하우스" />는 <Term name="홀사인" /> 방식으로 나눴습니다.
        </p>
      </figcaption>
    </figure>
  );
}
