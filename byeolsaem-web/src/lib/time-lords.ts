import type { BirthMoment, Chart } from "./chart";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

/**
 * 고전 시간법(연간 프로펙션 · 조디악 릴리징) 계산.
 *
 * 실제 하늘(트랜짓)을 보지 않는다 — 출생 차트에 감긴 상징적 시계를 돌린다.
 * 그래서 스위스 천문력 정밀도가 필요 없고, 전부 순수 산술이라 vitest로
 * 완전히 검증된다. 시각 미상(chart.ascendant === null)이면 어떤 함수도
 * 값을 지어내지 않고 null을 돌려준다 — 사이트 전체의 원칙이다.
 */

/**
 * 전통 지배성. ZODIAC_SIGNS의 ruler는 현대 지배성(전갈=명왕성 등)이라
 * 고전 기법인 프로펙션·릴리징에는 쓰지 않는다. 인덱스 0 = 양자리.
 */
export const TRADITIONAL_RULER: string[] = [
  "화성", // 양
  "금성", // 황소
  "수성", // 쌍둥이
  "달", // 게
  "태양", // 사자
  "수성", // 처녀
  "금성", // 천칭
  "화성", // 전갈
  "목성", // 사수
  "토성", // 염소
  "토성", // 물병
  "목성", // 물고기
];

/**
 * 조디악 릴리징의 자리별 연수 — 지배 행성의 소년기 연수(발렌스).
 * 인덱스 0 = 양자리.
 */
export const SIGN_YEARS: number[] = [15, 8, 20, 25, 19, 20, 8, 15, 12, 27, 27, 12];

const HOUR_MS = 3600_000;
const KST_OFFSET_MS = 9 * HOUR_MS;

/** now를 KST 달력 날짜로 읽는다. */
function kstParts(now: Date): { y: number; m: number; d: number } {
  const t = new Date(now.getTime() + KST_OFFSET_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 만 나이 — KST 달력 생일 기준. 프로펙션·릴리징의 연 경계가 이것이다. */
export function ageOn(natalDate: string, now: Date): number {
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const { y, m, d } = kstParts(now);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

/** 생일에 정수 년을 더한 날짜 문자열. */
function birthdayPlusYears(natalDate: string, years: number): string {
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const rolled = new Date(Date.UTC(by + years, bm - 1, bd));
  return rolled.toISOString().slice(0, 10);
}

export interface ProfectionYear {
  /** 만 나이. 생일 당일부터 다음 생일 전날까지 같은 값. */
  age: number;
  /** 이 해가 열리는 생일. "2026-07-14" */
  from: string;
  /** 다음 생일. */
  to: string;
  sign: ZodiacSign;
  /** 상승 자리를 1로 세는 방 번호(1~12). */
  house: number;
  /** 올해의 주인 — 전통 지배성. */
  lordKo: string;
}

function profectionAt(natal: BirthMoment, chart: Chart, age: number): ProfectionYear | null {
  if (chart.ascendant === null) return null;
  const ascIdx = Math.floor(chart.ascendant / 30);
  const steps = ((age % 12) + 12) % 12;
  const signIdx = (ascIdx + steps) % 12;
  return {
    age,
    from: birthdayPlusYears(natal.date, age),
    to: birthdayPlusYears(natal.date, age + 1),
    sign: ZODIAC_SIGNS[signIdx],
    house: steps + 1,
    lordKo: TRADITIONAL_RULER[signIdx],
  };
}

export function currentProfection(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear | null {
  return profectionAt(natal, chart, ageOn(natal.date, now));
}

/** 현재-2부터 12칸 — 프리뷰의 12년 스트립. */
export function profectionYears(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear[] | null {
  if (chart.ascendant === null) return null;
  const age = ageOn(natal.date, now);
  const out: ProfectionYear[] = [];
  for (let a = age - 2; a < age - 2 + 12; a++) {
    const year = profectionAt(natal, chart, a);
    if (year) out.push(year);
  }
  return out;
}

const norm360 = (x: number): number => ((x % 360) + 360) % 360;

export type LotKey = "fortune" | "spirit";

function planetLongitude(chart: Chart, planet: "sun" | "moon"): number {
  return chart.placements.find((p) => p.planet === planet)!.longitude;
}

/**
 * 주간 출생인가. 상승-하강 축 기준 — 상승에서 황도 순서로 180도까지가
 * 지평선 아래(1~6방 구간)다. 태양이 그 구간에 있으면 야간.
 */
export function isDayBirth(chart: Chart): boolean | null {
  if (chart.ascendant === null) return null;
  const diff = norm360(planetLongitude(chart, "sun") - chart.ascendant);
  return diff >= 180;
}

/**
 * 행운의 점: 주간 Asc+달-태양, 야간 반전. 정신의 점은 그 반대.
 * 릴리징의 출발 자리는 이 값의 whole-sign 자리다.
 */
export function lotLongitude(chart: Chart, lot: LotKey): number | null {
  const day = isDayBirth(chart);
  if (day === null || chart.ascendant === null) return null;
  const sun = planetLongitude(chart, "sun");
  const moon = planetLongitude(chart, "moon");
  const dayFormula = lot === "fortune" ? day : !day;
  return dayFormula
    ? norm360(chart.ascendant + moon - sun)
    : norm360(chart.ascendant + sun - moon);
}
