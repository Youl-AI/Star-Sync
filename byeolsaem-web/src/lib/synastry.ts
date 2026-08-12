import { pairKey } from "@/content/atoms/aspects";
import { SYNASTRY_HIGHLIGHTS } from "@/content/atoms/synastry";
import { angleBetween, ASPECT_TYPES, type AspectKey, type AspectType, type Chart } from "./chart";
import type { PlanetKey } from "./planets";

/**
 * 두 하늘이 만나는 자리.
 *
 * 출생 차트의 어스펙트가 한 사람 안의 두 힘 사이라면, 여기는 **서로 다른 두
 * 사람의** 별 사이다. 계산은 같다 — 두 황경의 각도를 재고 다섯 개의 주요 각도에
 * 가까운지를 본다. 다른 것은 짝을 짓는 방식뿐이라, 45쌍이 아니라 10 × 10 = 100쌍을
 * 본다.
 *
 * 그리고 이 페이지는 **점수를 매기지 않는다.** 두 사람이 잘 지낼지는 하늘이 정하지
 * 않으므로 그것을 100점 만점으로 적는 순간 계산이 아니라 점괘가 된다. 앞에 세우는
 * 숫자는 **이름이 붙어 있는 조합이 몇 개 맺혀 있는가**다 — 세는 방법이 한 줄로
 * 설명되고, 세어 보면 목록과 정확히 맞는다.
 *
 * 처음에는 0~100의 "공명도"를 냈다. 실제 값을 재 보니 웬만한 두 사람이 58에서
 * 95 사이에 몰렸다. 100쌍을 훑으면 걸리는 각도의 총량이 누구든 비슷해지기
 * 때문이다 — 눈금이 넓어 보일 뿐 실제로는 아무것도 가르지 못하는 숫자였다.
 * 이름 붙은 조합의 수는 같은 표본에서 1에서 11까지 퍼졌다.
 */

/**
 * 오브는 출생 차트보다 좁게 잡는다.
 *
 * 100쌍을 다 훑으므로 출생 차트와 같은 오브를 쓰면 서른 개 넘게 걸린다. 그러면
 * 목록이 "이 관계의 특징"이 아니라 "웬만한 두 사람이면 나오는 것"이 된다.
 */
const SYNASTRY_ORB: Record<AspectKey, number> = {
  conjunction: 6,
  sextile: 3,
  square: 5,
  trine: 5,
  opposition: 6,
};

/** 태양과 달이 낀 만남은 1도 넓게 본다. 두 별의 작용이 그만큼 넓다. */
const LUMINARY_BONUS = 1;

/**
 * 어느 별의 만남이 관계에서 실제로 무게를 갖는가.
 *
 * 천왕성·해왕성·명왕성은 한 자리에 7년에서 20년을 머문다. 또래끼리라면 이 셋은
 * 거의 언제나 서로 각도를 맺으므로, 같은 무게로 세면 아무나 붙여 놔도 점수가
 * 높게 나온다. 빼지는 않고 — 명왕성이 상대의 금성에 닿는 것은 실제로 큰 일이다 —
 * 무게만 낮춘다.
 */
const PLANET_WEIGHT: Record<PlanetKey, number> = {
  sun: 1,
  moon: 1,
  venus: 1,
  mars: 1,
  mercury: 0.8,
  jupiter: 0.5,
  saturn: 0.5,
  uranus: 0.2,
  neptune: 0.2,
  pluto: 0.2,
};

/** 두 별의 짝만으로도 할 말이 있는 조합. 앞에 세우는 숫자가 이것을 센 값이다. */
function isNamed(a: PlanetKey, b: PlanetKey): boolean {
  return SYNASTRY_HIGHLIGHTS[pairKey(a, b)] !== undefined;
}

export interface CrossAspect {
  /** 내 차트의 별. */
  mine: PlanetKey;
  /** 상대 차트의 별. */
  theirs: PlanetKey;
  type: AspectType;
  orb: number;
  /** 0~1. 오브가 0이면 1, 허용 범위 끝이면 0. */
  strength: number;
  /** 이 만남이 갖는 무게. 두 별의 무게를 곱한 값이다. */
  weight: number;
  /** 이름이 붙어 있는 조합인가. 목록의 차례와 앞의 숫자가 여기서 나온다. */
  named: boolean;
}

export interface Synastry {
  aspects: CrossAspect[];
  /** 이름이 붙어 있는 조합이 몇 개 맺혀 있는가. 화면 앞에 세우는 숫자다. */
  named: number;
  /** 힘이 흐르는 각도(육분·삼각)의 수. */
  flowing: number;
  /** 마찰이 있는 각도(사각·대립)의 수. */
  friction: number;
  /** 겹치는 각도(합)의 수. 흐름도 마찰도 아니고 둘 다일 수 있다. */
  overlapping: number;
  /** 가장 정확한 각도의 오차. 각도가 하나도 없으면 null. */
  tightest: number | null;
}

/** 두 차트가 맺는 각도를 모두 찾는다. 방향이 있다 — 내 별과 상대의 별은 다르다. */
export function crossAspects(mine: Chart, theirs: Chart): CrossAspect[] {
  const found: CrossAspect[] = [];

  for (const a of mine.placements) {
    for (const b of theirs.placements) {
      const separation = angleBetween(a.longitude, b.longitude);
      const luminary =
        a.planet === "sun" || a.planet === "moon" || b.planet === "sun" || b.planet === "moon";

      for (const type of ASPECT_TYPES) {
        const allowed = SYNASTRY_ORB[type.key] + (luminary ? LUMINARY_BONUS : 0);
        const orb = Math.abs(separation - type.angle);
        if (orb > allowed) continue;
        found.push({
          mine: a.planet,
          theirs: b.planet,
          type,
          orb,
          strength: 1 - orb / allowed,
          weight: PLANET_WEIGHT[a.planet] * PLANET_WEIGHT[b.planet],
          named: isNamed(a.planet, b.planet),
        });
        // 다섯 각도는 서로 멀리 떨어져 있어 한 쌍이 둘에 걸리지 않는다.
        break;
      }
    }
  }

  // 이름이 붙은 조합이 먼저다. 화면에는 열 개만 세우는데, 무게순으로만 자르면
  // 앞에 세운 숫자가 세는 것들이 목록 밖으로 밀려난다.
  return found.sort(
    (x, y) => Number(y.named) - Number(x.named) || y.weight * y.strength - x.weight * x.strength,
  );
}

export function synastry(mine: Chart, theirs: Chart): Synastry {
  const aspects = crossAspects(mine, theirs);

  return {
    aspects,
    named: aspects.filter((a) => a.named).length,
    tightest: aspects.length ? Math.min(...aspects.map((a) => a.orb)) : null,
    flowing: aspects.filter((a) => a.type.harmony > 0).length,
    friction: aspects.filter((a) => a.type.harmony < 0).length,
    overlapping: aspects.filter((a) => a.type.harmony === 0).length,
  };
}
