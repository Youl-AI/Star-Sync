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
        // 한 별에 화면 절반쯤의 스크롤을 준다. 너무 짧으면 셋이 스쳐 지나가고,
        // 너무 길면 붙잡힌 기분이 든다.
        end: `+=${stepCount * 55}%`,
        pin: true,
        onUpdate: (self) => {
          const index = Math.min(stepCount - 1, Math.floor(self.progress * stepCount));
          setTourIndex(self.isActive ? index : null);
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

  return (
    <figure ref={figureRef} className="mt-14 flex flex-wrap items-start gap-x-10 gap-y-6">
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
