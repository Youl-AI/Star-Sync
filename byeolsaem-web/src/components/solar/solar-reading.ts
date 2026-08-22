import { ASCENDANT_ATOMS } from "@/content/atoms/ascendant";
import { PLANET_IN_HOUSE } from "@/content/atoms/planet-in-house";
import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import { signAtLongitude } from "@/lib/zodiac";
import type { Chart } from "@/lib/chart";

/**
 * 솔라 리턴 해석 — 새 해석 원자를 만들지 않는다(스펙 결정). 출생 차트용 원자를
 * "올해의" 프레임으로 다시 문맥화한다: 같은 문장이라도 '한 해짜리 첫인상'으로
 * 읽히게 하는 것은 프레임의 일이다.
 */
export interface SolarAxis {
  title: string;
  frame: string;
  body: string;
}
export interface SolarReading {
  ascendant: SolarAxis | null;
  sunHouse: SolarAxis | null;
  moonSign: SolarAxis | null;
}

export function composeSolarReading(chart: Chart): SolarReading {
  const asc = chart.ascendant !== null ? signAtLongitude(chart.ascendant) : null;
  const sun = chart.placements.find((p) => p.planet === "sun");
  const moon = chart.placements.find((p) => p.planet === "moon");

  return {
    ascendant: asc && {
      title: `올해의 첫인상 — ${asc.ko} 상승`,
      frame: "리턴 차트의 상승궁은 이번 한 해 당신이 세상에 나서는 방식입니다. 타고난 것이 아니라 올해만의 옷입니다.",
      body: ASCENDANT_ATOMS[asc.key],
    },
    sunHouse: sun?.house != null ? {
      title: `올해 빛이 모이는 방 — ${sun.house}하우스의 태양`,
      frame: "리턴 태양이 든 하우스는 이번 해의 무게중심입니다. 한 해의 에너지가 이 방으로 모입니다.",
      body: PLANET_IN_HOUSE.sun[sun.house],
    } : null,
    moonSign: moon ? {
      title: `올해 마음이 머무는 곳 — ${moon.sign.ko}의 달`,
      frame: "리턴 달의 자리는 이번 해 마음이 쉬는 방식입니다. 일 년 동안의 기본 감정값으로 읽습니다.",
      body: PLANET_IN_SIGN.moon[moon.sign.key],
    } : null,
  };
}
