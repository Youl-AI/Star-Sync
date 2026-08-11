import {
  greenwichSiderealTime,
  JD_J2000,
  nutationInLongitude,
  obliquity,
  planetPosition,
  sunPosition,
  toJulianDay,
  type OrbitingBody,
} from "./ephemeris";
import { moonPosition } from "./moon";
import { PLANETS, type PlanetKey } from "./planets";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

/**
 * 태어난 순간의 하늘을 하나의 자료로 만든다.
 *
 * 계산은 브라우저에서 한다. 원래 계획은 파이썬 백엔드가 스위스 천문력으로
 * 맡는 것이었지만(RENEWAL_PLAN §6), 그 백엔드는 아직 없고 이 사이트는 정적
 * 내보내기다. 요청당 과금되는 외부 API를 쓰지 않겠다는 원칙까지 고려하면,
 * 위치 계산을 직접 하는 쪽이 남는 선택지였다.
 *
 * 정밀도는 정직하게 적어 둔다. 행성은 JPL 근사 요소로 몇 분각, 달은 ELP 축약
 * 급수로 10초각 수준이다. 별자리와 하우스 판정에는 충분하고, 경계에서 몇 초
 * 이내로 태어난 경우에만 어긋날 수 있다. 백엔드가 붙으면 이 모듈은 그대로
 * 남되 값의 출처만 바뀐다.
 */

const DEG = Math.PI / 180;

function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** 두 황경 사이의 최단 각도 (0~180). */
export function angleBetween(a: number, b: number): number {
  const diff = Math.abs(norm360(a - b));
  return diff > 180 ? 360 - diff : diff;
}

export interface Placement {
  planet: PlanetKey;
  /** 황경 (도) */
  longitude: number;
  /** 어느 별자리에 있는가 */
  sign: ZodiacSign;
  /** 그 별자리 안에서 몇 도인가 (0~29) */
  degree: number;
  /** 몇 번째 하우스인가 (1~12). 태어난 시각을 모르면 null. */
  house: number | null;
  /** 역행 중인가. 태양과 달은 역행하지 않는다. */
  retrograde: boolean;
}

export const ASPECT_TYPES = [
  { key: "conjunction", ko: "합", angle: 0, orb: 8, symbol: "☌", harmony: 0 },
  { key: "sextile", ko: "육분", angle: 60, orb: 5, symbol: "⚹", harmony: 1 },
  { key: "square", ko: "사각", angle: 90, orb: 7, symbol: "□", harmony: -1 },
  { key: "trine", ko: "삼각", angle: 120, orb: 7, symbol: "△", harmony: 1 },
  { key: "opposition", ko: "대립", angle: 180, orb: 8, symbol: "☍", harmony: -1 },
] as const;

export type AspectKey = (typeof ASPECT_TYPES)[number]["key"];
export type AspectType = (typeof ASPECT_TYPES)[number];

export interface Aspect {
  a: PlanetKey;
  b: PlanetKey;
  type: AspectType;
  /** 정확한 각도에서 얼마나 벗어났는가 (도). 작을수록 강하게 본다. */
  orb: number;
  /** 0~1. 오브가 0이면 1, 허용 범위 끝이면 0. */
  strength: number;
}

export interface BirthMoment {
  /** "1999-03-21" */
  date: string;
  /** "09:30". 모르면 null — 그 경우 하우스와 상승궁을 내지 않는다. */
  time: string | null;
  /** 위도 (북쪽 양수) */
  latitude: number;
  /** 경도 (동쪽 양수) */
  longitude: number;
  /** 출생지의 표준시 오프셋(시간). 한국은 9. */
  timezoneOffsetHours: number;
}

export interface Chart {
  julianDay: number;
  placements: Placement[];
  /** 상승궁의 황경. 시각을 모르면 null. */
  ascendant: number | null;
  /** 중천(MC)의 황경. 시각을 모르면 null. */
  midheaven: number | null;
  /** 하우스 경계 12개의 황경. 시각을 모르면 null. */
  houseCusps: number[] | null;
  aspects: Aspect[];
  /** 시각을 몰라 비워 둔 부분이 있는가. */
  timeUnknown: boolean;
}

/** 출생 순간을 율리우스일로. 시각을 모르면 정오로 잡는다. */
export function birthJulianDay(moment: BirthMoment): number {
  const [year, month, day] = moment.date.split("-").map(Number);
  const [hour, minute] = moment.time
    ? moment.time.split(":").map(Number)
    : // 시각을 모를 때 정오를 쓰는 이유는 오차를 반으로 줄이기 위해서다.
      // 자정을 기준으로 삼으면 실제 시각과 최대 24시간 벌어지지만 정오면 12시간이다.
      [12, 0];
  const utcMillis = Date.UTC(year, month - 1, day, hour, minute) - moment.timezoneOffsetHours * 3600000;
  return toJulianDay(new Date(utcMillis));
}

function signAt(longitude: number): { sign: ZodiacSign; degree: number } {
  const normalized = norm360(longitude);
  return {
    sign: ZODIAC_SIGNS[Math.floor(normalized / 30)],
    degree: normalized % 30,
  };
}

/** 황경이 몇 번째 하우스에 드는가. 경계 배열은 1하우스부터 순서대로. */
export function houseOf(longitude: number, cusps: number[]): number {
  const target = norm360(longitude);
  for (let i = 0; i < 12; i += 1) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm360(end - start);
    if (norm360(target - start) < span) return i + 1;
  }
  return 1;
}

/**
 * 상승궁과 중천.
 *
 * 상승궁은 태어난 순간 동쪽 지평선에 떠오르던 황도의 점이고, 중천은 그때
 * 남중해 있던 점이다. 둘 다 지구의 자전에 달려 있어서 태어난 시각과 장소를
 * 모르면 구할 수 없다 — 시각이 4분 어긋나면 상승궁이 1도 움직인다.
 */
export function ascendantAndMidheaven(jd: number, latitude: number, longitude: number) {
  const centuries = (jd - JD_J2000) / 36525;
  const eps = obliquity(centuries) * DEG;
  // 지역 항성시. 겉보기 값을 쓰려면 장동을 얹는다.
  const localSidereal =
    (greenwichSiderealTime(jd) + nutationInLongitude(centuries) * Math.cos(eps) + longitude) * DEG;
  const lat = latitude * DEG;

  const midheaven = norm360(
    Math.atan2(Math.sin(localSidereal), Math.cos(localSidereal) * Math.cos(eps)) / DEG,
  );
  const ascendant = norm360(
    Math.atan2(
      Math.cos(localSidereal),
      -(Math.sin(localSidereal) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps)),
    ) / DEG,
  );

  return { ascendant, midheaven };
}

/**
 * 하우스 경계 — 홀사인(whole sign) 방식.
 *
 * 상승궁이 든 별자리의 0도가 1하우스의 시작이고, 그다음 별자리가 차례로 2, 3,
 * ... 하우스가 된다. 하우스와 별자리가 정확히 겹치는 가장 오래된 방식이다.
 *
 * 플라시두스처럼 경계를 불균등하게 나누는 방식도 널리 쓰이지만, 그쪽은
 * 반복 계산으로 경계를 찾는 절차라 검증 없이 넣으면 조용히 틀린 값을 내놓기
 * 쉽다. 지금은 결과를 눈으로 확인할 수 있는 홀사인만 쓰고, 화면에도 어떤
 * 방식인지 밝힌다.
 */
export function wholeSignCusps(ascendant: number): number[] {
  const firstHouse = Math.floor(norm360(ascendant) / 30) * 30;
  return Array.from({ length: 12 }, (_, i) => norm360(firstHouse + i * 30));
}

const ORBITING: Partial<Record<PlanetKey, OrbitingBody>> = {
  mercury: "mercury",
  venus: "venus",
  mars: "mars",
  jupiter: "jupiter",
  saturn: "saturn",
  uranus: "uranus",
  neptune: "neptune",
  pluto: "pluto",
};

/** 그 순간 하늘에서 별 하나의 황경. */
export function longitudeOf(planet: PlanetKey, jd: number): number {
  if (planet === "sun") return sunPosition(jd).longitude;
  if (planet === "moon") return moonPosition(jd).longitude;
  return planetPosition(ORBITING[planet]!, jd).longitude;
}

/**
 * 어스펙트 — 두 별이 맺는 각도.
 *
 * 다섯 개의 주요 각도만 본다. 오브(허용 오차)는 정확한 각도에서 얼마나
 * 벗어났는지이고, 벗어날수록 약하게 친다. 태양과 달이 낀 어스펙트는 오브를
 * 2도 넓게 잡는다 — 두 별의 겉보기 크기가 크고 작용도 그만큼 넓기 때문이다.
 */
export function findAspects(placements: Placement[]): Aspect[] {
  const aspects: Aspect[] = [];
  for (let i = 0; i < placements.length; i += 1) {
    for (let j = i + 1; j < placements.length; j += 1) {
      const a = placements[i];
      const b = placements[j];
      const separation = angleBetween(a.longitude, b.longitude);
      const luminary = a.planet === "sun" || a.planet === "moon" || b.planet === "sun" || b.planet === "moon";
      for (const type of ASPECT_TYPES) {
        const allowed = type.orb + (luminary ? 2 : 0);
        const orb = Math.abs(separation - type.angle);
        if (orb > allowed) continue;
        aspects.push({
          a: a.planet,
          b: b.planet,
          type,
          orb,
          strength: 1 - orb / allowed,
        });
        break;
      }
    }
  }
  // 정확한 각도에 가까운 것부터. 화면에 다 담을 수 없을 때 위에서 자르면 된다.
  return aspects.sort((x, y) => y.strength - x.strength);
}

/** 하늘 한 벌을 통째로 계산한다. */
export function computeChart(moment: BirthMoment): Chart {
  const jd = birthJulianDay(moment);
  const timeUnknown = moment.time === null;

  const angles = timeUnknown
    ? null
    : ascendantAndMidheaven(jd, moment.latitude, moment.longitude);
  const houseCusps = angles ? wholeSignCusps(angles.ascendant) : null;

  const placements: Placement[] = PLANETS.map((planet) => {
    const longitude = longitudeOf(planet.key, jd);
    const { sign, degree } = signAt(longitude);
    // 역행 판정은 하루 뒤 위치와 비교한다. 달과 태양은 언제나 순행이므로 묻지 않는다.
    const retrograde =
      planet.key === "sun" || planet.key === "moon"
        ? false
        : norm360(longitudeOf(planet.key, jd + 1) - longitude) > 180;
    return {
      planet: planet.key,
      longitude,
      sign,
      degree,
      house: houseCusps ? houseOf(longitude, houseCusps) : null,
      retrograde,
    };
  });

  return {
    julianDay: jd,
    placements,
    ascendant: angles?.ascendant ?? null,
    midheaven: angles?.midheaven ?? null,
    houseCusps,
    aspects: findAspects(placements),
    timeUnknown,
  };
}

/** "사자자리 19도" */
export function formatPlacement(placement: Placement): string {
  return `${placement.sign.ko} ${Math.floor(placement.degree)}도`;
}
