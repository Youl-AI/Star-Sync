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

export interface ZrPeriod {
  sign: ZodiacSign;
  /** 만 나이(년, 소수). */
  fromAge: number;
  toAge: number;
  /** 달력 날짜 환산("2027-07-14"). 월 단위 환산이라 ±1일 오차 허용. */
  from: string;
  to: string;
  /** 행운의 점 자리를 1로 세는 자리 번호 — 어느 점 릴리징이든 행운 기준. */
  houseFromFortune: number;
  /** 1·4·7·10번째 — 각(角)의 장. */
  angular: boolean;
  /** 10번째 — 절정의 장. */
  peak: boolean;
  /** 매듭 풀림(루싱 오브 본드)으로 건너뛰어 시작한 장(L2 전용). */
  loosedBond: boolean;
}

export interface ZodiacalReleasing {
  lot: LotKey;
  lotSign: ZodiacSign;
  /** 행운의 점의 자리 인덱스(0=양) — 각 판정의 기준이고, l2PeriodsOf에 넘긴다. */
  fortuneSignIndex: number;
  l1: ZrPeriod[];
  currentL1: ZrPeriod | null;
  l2OfCurrent: ZrPeriod[];
  currentL2: ZrPeriod | null;
}

/** 만 나이의 소수부까지 — 생일 사이를 선형으로. */
export function fractionalAge(natalDate: string, now: Date): number {
  const whole = ageOn(natalDate, now);
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const last = Date.UTC(by + whole, bm - 1, bd) - KST_OFFSET_MS;
  const next = Date.UTC(by + whole + 1, bm - 1, bd) - KST_OFFSET_MS;
  return whole + (now.getTime() - last) / (next - last);
}

/** 생일 + 개월 수를 달력 날짜로. Date.UTC의 월 굴림에 맡긴다(±1일 허용). */
function ageToDate(natalDate: string, age: number): string {
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const months = Math.round(age * 12);
  const rolled = new Date(Date.UTC(by, bm - 1 + months, bd));
  return rolled.toISOString().slice(0, 10);
}

function makePeriod(
  natalDate: string,
  signIdx: number,
  fromAge: number,
  toAge: number,
  fortuneIdx: number,
  loosedBond: boolean,
): ZrPeriod {
  const house = ((signIdx - fortuneIdx + 12) % 12) + 1;
  return {
    sign: ZODIAC_SIGNS[signIdx],
    fromAge,
    toAge,
    from: ageToDate(natalDate, fromAge),
    to: ageToDate(natalDate, toAge),
    houseFromFortune: house,
    angular: house === 1 || house === 4 || house === 7 || house === 10,
    peak: house === 10,
    loosedBond,
  };
}

/**
 * L2 분할. 자리별 연수를 "월"로 배정하고, 열이 한 바퀴 돌아 자기 L1 자리의
 * 차례로 되돌아오면 그 자리를 반복하는 대신 맞은편으로 건너뛴다(매듭 풀림).
 * 긴 장(염소·물병 27년)에서는 두 번째 귀환에도 같은 규칙을 다시 적용한다.
 */
function l2Periods(
  natalDate: string,
  startIdx: number,
  fromAge: number,
  totalMonths: number,
  fortuneIdx: number,
): ZrPeriod[] {
  const out: ZrPeriod[] = [];
  let cursor = 0;
  let idx = startIdx;
  let first = true;
  while (cursor < totalMonths) {
    let loosed = false;
    if (!first && idx === startIdx) {
      idx = (idx + 6) % 12;
      loosed = true;
    }
    const months = Math.min(SIGN_YEARS[idx], totalMonths - cursor);
    out.push(
      makePeriod(
        natalDate,
        idx,
        fromAge + cursor / 12,
        fromAge + (cursor + months) / 12,
        fortuneIdx,
        loosed,
      ),
    );
    cursor += months;
    idx = (idx + 1) % 12;
    first = false;
  }
  return out;
}

/** 테스트 전용 — L2 분할 규칙을 차트 없이 검증하는 창구. fortuneIdx는 0 고정. */
export function zodiacalReleasingL2ForTest(startIdx: number, totalMonths: number): ZrPeriod[] {
  return l2Periods("2000-01-01", startIdx, 0, totalMonths, 0);
}

/**
 * 임의의 L1 장의 속살(L2). UI가 지금 장이 아닌 장의 속살도 넘겨 볼 수 있게
 * 한다(2026-08-28 — 다른 도구들은 평생치 L2를 훑을 수 있다는 피드백).
 * fortuneSignIndex는 zodiacalReleasing 결과의 같은 이름 필드를 그대로 넘긴다.
 */
export function l2PeriodsOf(
  natalDate: string,
  period: ZrPeriod,
  fortuneSignIndex: number,
): ZrPeriod[] {
  return l2Periods(
    natalDate,
    ZODIAC_SIGNS.indexOf(period.sign),
    period.fromAge,
    Math.round((period.toAge - period.fromAge) * 12),
    fortuneSignIndex,
  );
}

export function zodiacalReleasing(
  natal: BirthMoment,
  chart: Chart,
  lot: LotKey,
  now: Date,
): ZodiacalReleasing | null {
  const lotLon = lotLongitude(chart, lot);
  const fortuneLon = lotLongitude(chart, "fortune");
  if (lotLon === null || fortuneLon === null) return null;
  const startIdx = Math.floor(lotLon / 30);
  const fortuneIdx = Math.floor(fortuneLon / 30);

  const l1: ZrPeriod[] = [];
  let ageCursor = 0;
  let idx = startIdx;
  while (ageCursor < 100) {
    const years = SIGN_YEARS[idx];
    l1.push(makePeriod(natal.date, idx, ageCursor, ageCursor + years, fortuneIdx, false));
    ageCursor += years;
    idx = (idx + 1) % 12;
  }

  const age = fractionalAge(natal.date, now);
  const currentL1 = l1.find((p) => age >= p.fromAge && age < p.toAge) ?? null;
  const l2OfCurrent = currentL1
    ? l2Periods(
        natal.date,
        ZODIAC_SIGNS.indexOf(currentL1.sign),
        currentL1.fromAge,
        Math.round((currentL1.toAge - currentL1.fromAge) * 12),
        fortuneIdx,
      )
    : [];
  const currentL2 = l2OfCurrent.find((p) => age >= p.fromAge && age < p.toAge) ?? null;

  return {
    lot,
    lotSign: ZODIAC_SIGNS[startIdx],
    fortuneSignIndex: fortuneIdx,
    l1,
    currentL1,
    l2OfCurrent,
    currentL2,
  };
}
