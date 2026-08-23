import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import type { CompositeChart } from "@/lib/composite";

/**
 * 컴포짓의 세 축 — 새 해석 원자를 만들지 않는다(스펙 결정). 출생 차트용
 * PLANET_IN_SIGN을 "관계의" 프레임으로 다시 문맥화한다. 원자 문장이 개인
 * 주어로 서술되어 관계 주어와 간극이 있는 자리는 프레임이 잇는다 — 원자를
 * 고치면 natal과 갈라진다.
 */
export interface CompositeAxis {
  title: string;
  frame: string;
  body: string;
}
export interface CompositeReading {
  sun: CompositeAxis;
  moon: CompositeAxis;
  venus: CompositeAxis;
}

export const COMPOSITE_INTRO =
  "궁합이 두 하늘 사이에 오가는 각도라면, 컴포짓은 두 하늘의 한가운데에 생기는 세 번째 차트입니다. 관계 자체를 하나의 인격처럼 읽는 오래된 방법입니다.";

export function composeCompositeReading(composite: CompositeChart): CompositeReading {
  const of = (key: "sun" | "moon" | "venus") => composite.placements.find((p) => p.planet === key)!;
  const sun = of("sun");
  const moon = of("moon");
  const venus = of("venus");
  return {
    sun: {
      title: `관계의 태양 — ${sun.sign.ko}자리`,
      frame: "이 관계가 무엇을 향해 가는가입니다.",
      body: PLANET_IN_SIGN.sun[sun.sign.key],
    },
    moon: {
      title: `관계의 달 — ${moon.sign.ko}자리`,
      frame: "둘이 함께 있을 때 흐르는 기류입니다.",
      body: PLANET_IN_SIGN.moon[moon.sign.key],
    },
    venus: {
      title: `관계의 금성 — ${venus.sign.ko}자리`,
      frame: "이 관계가 애정을 표현하는 방식입니다.",
      body: PLANET_IN_SIGN.venus[venus.sign.key],
    },
  };
}
