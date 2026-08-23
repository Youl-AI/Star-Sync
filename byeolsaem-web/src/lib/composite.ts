import { findAspects, type Aspect, type Chart, type Placement } from "./chart";
import { norm180 } from "./ephemeris";
import { signAtLongitude } from "./zodiac";

/**
 * 컴포짓 차트 — 두 차트의 행성별 원호 중간점으로 세우는 제3의 차트.
 * 궁합이 둘 사이에 오가는 각도라면, 컴포짓은 "이 관계 자체"를 하나의
 * 인격처럼 읽는 관례다.
 *
 * 중간점은 짧은 호의 중간을 쓴다. 정확히 180° 대립이면 어느 쪽 중간도
 * 관례상 유효하므로, 작은 황경 쪽 + 90°로 고정해 결정론을 지킨다.
 *
 * 하우스는 다루지 않는다 — 컴포짓의 장소를 무엇으로 볼지는 학파마다 갈리고,
 * 우리는 갈리는 것을 지어내지 않는다(스펙 결정). 상승궁만은 둘 다 시각을
 * 알 때 두 상승궁의 중간점으로 낸다.
 */
export interface CompositeChart {
  placements: Placement[];
  aspects: Aspect[];
  ascendant: number | null;
}

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

export function arcMidpoint(a: number, b: number): number {
  const diff = norm180(b - a);
  if (Math.abs(Math.abs(diff) - 180) < 1e-9) {
    return norm360(Math.min(norm360(a), norm360(b)) + 90);
  }
  return norm360(a + diff / 2);
}

export function compositeChart(mine: Chart, theirs: Chart): CompositeChart {
  const placements: Placement[] = mine.placements.map((p) => {
    const other = theirs.placements.find((x) => x.planet === p.planet);
    // 두 차트 모두 computeChart 산출물이라 행성 목록이 같다 — 없으면 버그다.
    if (!other) throw new Error(`composite: ${p.planet} missing in partner chart`);
    const longitude = arcMidpoint(p.longitude, other.longitude);
    return {
      planet: p.planet,
      longitude,
      sign: signAtLongitude(longitude),
      degree: Math.floor(longitude % 30),
      house: null,
      retrograde: false, // 중간점에서 역행은 의미가 없다
    };
  });

  return {
    placements,
    aspects: findAspects(placements),
    ascendant:
      mine.ascendant !== null && theirs.ascendant !== null
        ? arcMidpoint(mine.ascendant, theirs.ascendant)
        : null,
  };
}
