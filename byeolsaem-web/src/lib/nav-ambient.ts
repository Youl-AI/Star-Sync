import { fromJulianDay, toJulianDay } from "./ephemeris";
import { lunationsBetween, type Lunation } from "./lunation";
import { moonPosition } from "./moon";
import { retrogradesOf, type RetroPlanet } from "./retrograde";
import { signAtLongitude } from "./zodiac";

/**
 * 오버레이 메뉴의 "지금 하늘" 한 줄이 쓰는 데이터. 서버(빌드)에서만 계산한다 —
 * 천문 엔진이 내비 때문에 클라이언트 번들에 실리면 안 된다(retrograde-clock의
 * 분리 원칙과 동일). 클라이언트는 이 표에서 now에 맞는 조각을 고르기만 한다.
 * 값이 시각의 함수가 아니라 표라서, 배포가 며칠 묵어도 어긋나지 않는다.
 */
export interface NavAmbient {
  builtAt: string;
  /** 달이 이 시각(ISO)까지 이 자리에 있다 — 60일치, 시간순. */
  moonSegments: { until: string; signKo: string }[];
  /** 다가오는 삭망 — 60일치. */
  lunations: Lunation[];
  /** 60일 창과 겹치는 역행 구간. */
  retro: { planet: RetroPlanet; planetKo: string; start: string; end: string }[];
}

const DAY_MS = 86400000;
const WINDOW_DAYS = 60;
const PRECISION_DAYS = 0.0002;
const PLANET_KO: Record<RetroPlanet, string> = { mercury: "수성", venus: "금성", mars: "화성" };

function moonSignIndex(jd: number): number {
  return Math.floor(moonPosition(jd).longitude / 30) % 12;
}

export function navAmbient(now: Date): NavAmbient {
  const startJd = toJulianDay(now);
  const endJd = startJd + WINDOW_DAYS;

  // 달은 하루 13도 — 0.25일 걸음이면 경계를 놓치지 않는다.
  const moonSegments: { until: string; signKo: string }[] = [];
  let prevJd = startJd;
  let prevIdx = moonSignIndex(prevJd);
  for (let jd = startJd + 0.25; jd <= endJd; jd += 0.25) {
    const idx = moonSignIndex(jd);
    if (idx !== prevIdx) {
      let low = prevJd;
      let high = jd;
      while (high - low > PRECISION_DAYS) {
        const mid = (low + high) / 2;
        if (moonSignIndex(mid) === prevIdx) low = mid;
        else high = mid;
      }
      moonSegments.push({ until: fromJulianDay((low + high) / 2).toISOString(), signKo: signAtLongitude(prevIdx * 30 + 1).ko });
      prevIdx = idx;
    }
    prevJd = jd;
  }
  moonSegments.push({ until: fromJulianDay(endJd).toISOString(), signKo: signAtLongitude(prevIdx * 30 + 1).ko });

  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * DAY_MS);
  const retro: NavAmbient["retro"] = [];
  for (const planet of ["mercury", "venus", "mars"] as const) {
    for (const p of retrogradesOf(planet, new Date(now.getTime() - 120 * DAY_MS), new Date(windowEnd.getTime() + 120 * DAY_MS))) {
      if (Date.parse(p.end) >= now.getTime() && Date.parse(p.start) < windowEnd.getTime()) {
        retro.push({ planet, planetKo: PLANET_KO[planet], start: p.start, end: p.end });
      }
    }
  }

  return {
    builtAt: now.toISOString(),
    moonSegments,
    lunations: lunationsBetween(now, windowEnd),
    retro,
  };
}
