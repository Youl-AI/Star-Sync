import { ASPECT_MEANINGS, pairTheme } from "@/content/atoms/aspects";
import { ASCENDANT_ATOMS, MIDHEAVEN_ATOMS } from "@/content/atoms/ascendant";
import { lensFor, type ConcernLens } from "@/content/atoms/concerns";
import { HOUSE_BY_NUMBER, type House } from "@/content/atoms/houses";
import { PLANET_IN_HOUSE } from "@/content/atoms/planet-in-house";
import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import type { Aspect, Chart, Placement } from "./chart";
import { PLANET_BY_KEY, type Planet } from "./planets";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

/**
 * 계산된 차트에 아톰을 붙여 읽을 수 있는 글로 만든다.
 *
 * 여기에는 무작위도 인공지능도 없다. 같은 배치면 언제 다시 열어도 같은 문장이
 * 나온다 — 점술 서비스에서 이것은 취향이 아니라 신뢰의 조건이다
 * (RENEWAL_PLAN §2.3).
 *
 * 조립 순서도 규칙이다. 관심사에 해당하는 것을 먼저, 그다음 개인을 말해 주는
 * 별을, 세대를 말하는 별은 맨 뒤에 둔다.
 */

export interface ReadingPlacement {
  planet: Planet;
  placement: Placement;
  /** 이 별이 이 별자리에 있을 때 */
  inSign: string;
  /** 이 별이 이 하우스에 있을 때. 시각을 모르면 null. */
  inHouse: string | null;
  house: House | null;
  /** 관심사 렌즈에 걸렸는가 */
  highlighted: boolean;
}

export interface ReadingAspect {
  aspect: Aspect;
  a: Planet;
  b: Planet;
  /** "밖으로 향하는 의지와 안에서 움직이는 감정" */
  theme: string;
  headline: string;
  body: string;
}

export interface Reading {
  /** 태양·달·상승궁 세 줄. 이 셋이 없으면 나머지는 배경이다. */
  core: {
    sun: ReadingPlacement;
    moon: ReadingPlacement;
    ascendant: { sign: ZodiacSign; text: string } | null;
    midheaven: { sign: ZodiacSign; text: string } | null;
  };
  placements: ReadingPlacement[];
  aspects: ReadingAspect[];
  lens: ConcernLens | null;
  /** 원소가 어디에 몰려 있는가. 전체 인상을 한마디로 말할 때 쓴다. */
  elements: { element: string; count: number }[];
  timeUnknown: boolean;
}

function signOf(longitude: number): ZodiacSign {
  return ZODIAC_SIGNS[Math.floor((((longitude % 360) + 360) % 360) / 30)];
}

function toReadingPlacement(placement: Placement, lens: ConcernLens | null): ReadingPlacement {
  const planet = PLANET_BY_KEY[placement.planet];
  const house = placement.house === null ? null : HOUSE_BY_NUMBER[placement.house];
  return {
    planet,
    placement,
    inSign: PLANET_IN_SIGN[placement.planet][placement.sign.key],
    inHouse: placement.house === null ? null : PLANET_IN_HOUSE[placement.planet][placement.house],
    house,
    highlighted: Boolean(
      lens &&
        (lens.planets.includes(placement.planet) ||
          (placement.house !== null && lens.houses.includes(placement.house))),
    ),
  };
}

/**
 * 어스펙트를 문장으로. 각도가 사이를 정하고 행성 쌍이 무엇의 사이인지를 정한다
 * (content/atoms/aspects.ts 참고).
 */
function toReadingAspect(aspect: Aspect): ReadingAspect | null {
  const theme = pairTheme(aspect.a, aspect.b);
  if (!theme) return null;
  const meaning = ASPECT_MEANINGS[aspect.type.key];
  return {
    aspect,
    a: PLANET_BY_KEY[aspect.a],
    b: PLANET_BY_KEY[aspect.b],
    theme,
    headline: meaning.headline,
    body: meaning.body,
  };
}

/**
 * @param concern 히어로에서 고른 관심사. 렌즈에 없는 값이면 무시한다.
 * @param aspectLimit 몇 개까지 보여 줄지. 전부 늘어놓으면 읽히지 않는다.
 */
export function assembleReading(
  chart: Chart,
  concern?: string | null,
  aspectLimit = 6,
): Reading {
  const lens = concern ? (lensFor(concern) ?? null) : null;

  const placements = chart.placements.map((p) => toReadingPlacement(p, lens));
  const byKey = new Map(placements.map((p) => [p.planet.key, p]));

  // 관심사에 걸린 것 → 개인을 말하는 별 → 세대를 말하는 별 순서.
  const ordered = [...placements].sort((a, b) => {
    if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
    if (a.planet.personal !== b.planet.personal) return a.planet.personal ? -1 : 1;
    return 0;
  });

  const aspects = chart.aspects
    .map(toReadingAspect)
    .filter((a): a is ReadingAspect => a !== null)
    .slice(0, aspectLimit);

  const counts = new Map<string, number>();
  for (const placement of chart.placements) {
    counts.set(placement.sign.element, (counts.get(placement.sign.element) ?? 0) + 1);
  }

  return {
    core: {
      sun: byKey.get("sun")!,
      moon: byKey.get("moon")!,
      ascendant:
        chart.ascendant === null
          ? null
          : {
              sign: signOf(chart.ascendant),
              text: ASCENDANT_ATOMS[signOf(chart.ascendant).key],
            },
      midheaven:
        chart.midheaven === null
          ? null
          : {
              sign: signOf(chart.midheaven),
              text: MIDHEAVEN_ATOMS[signOf(chart.midheaven).key],
            },
    },
    placements: ordered,
    aspects,
    lens,
    elements: [...counts.entries()]
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count),
    timeUnknown: chart.timeUnknown,
  };
}

/**
 * 원소 분포를 한 문장으로.
 *
 * 열 개의 별이 네 원소에 고르게 흩어지는 일은 드물다. 한쪽에 몰려 있으면 그
 * 자체가 전체 인상을 정하고, 아예 비어 있는 원소가 있으면 그쪽이 이 사람의
 * 과제가 된다.
 */
export function describeElements(elements: { element: string; count: number }[]): string {
  const top = elements[0];
  const missing = ["불", "흙", "공기", "물"].filter(
    (element) => !elements.some((e) => e.element === element && e.count > 0),
  );

  const strong =
    top.count >= 5
      ? `열 개의 별 중 ${top.count}개가 ${top.element}에 몰려 있습니다.`
      : `${top.element}이(가) ${top.count}개로 가장 많지만 한쪽으로 크게 치우치지는 않았습니다.`;

  if (missing.length === 0) return `${strong} 네 원소가 모두 채워져 있습니다.`;
  return `${strong} 반면 ${missing.join("·")}은(는) 비어 있어, 그 성질은 스스로 익혀야 하는 쪽에 가깝습니다.`;
}
