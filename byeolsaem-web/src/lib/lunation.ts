import { fromJulianDay, norm180, sunPosition, toJulianDay } from "./ephemeris";
import { moonPosition } from "./moon";
import { signAtLongitude } from "./zodiac";

/**
 * 삭망 — 다음 신월과 보름의 정확한 시각.
 *
 * 달의 위상은 태양과 달의 황경 차로 정해진다. 차가 0도인 순간이 신월(삭),
 * 180도인 순간이 보름(망)이다. 역행의 유(留)를 찾을 때와 같은 방법을 쓴다 —
 * 하루 간격으로 부호 변화를 훑고 이분법으로 좁힌다(retrograde.ts 참고).
 *
 * 왜 필요한가: 달의 위상 칼럼이 "신월에 세우고 만월에 정리하라"고 말해 놓고
 * 정작 그 날짜를 사이트 어디서도 주지 않았다(정찰 2026-08-22).
 */

export interface Lunation {
  kind: "new" | "full";
  /** 정확한 순간 (ISO). 화면은 KST로 바꿔 쓴다. */
  date: string;
  /** 그 순간 달이 있는 별자리 (신월이면 태양도 같은 자리). */
  signKo: string;
}

/** 이분법 정지 조건. 0.0002일 ≈ 17초 — 역행의 유와 같은 정밀도. */
const PRECISION_DAYS = 0.0002;

/** 태양-달 황경 차에서 target(0=삭, 180=망)까지의 부호 있는 거리. */
function offsetFrom(jd: number, target: number): number {
  const gap = moonPosition(jd).longitude - sunPosition(jd).longitude;
  return norm180(gap - target);
}

/** fromJd 이후 처음으로 위상각이 target을 지나는 순간. */
function nextCrossing(fromJd: number, target: number): number {
  let previous = fromJd;
  let previousOffset = offsetFrom(previous, target);
  // 삭망 주기는 약 29.5일 — 32일 안에 반드시 한 번 온다.
  for (let step = 1; step <= 32; step += 1) {
    const jd = fromJd + step;
    const current = offsetFrom(jd, target);
    // norm180 경계(±180)를 스치는 가짜 부호 반전을 거르기 위해, 실제로 target
    // 근처를 지나는 좁은 간격만 받는다. 위상각은 하루 12도쯤 움직인다.
    if (Math.sign(current) !== Math.sign(previousOffset) && Math.abs(current) < 30) {
      let low = previous;
      let high = jd;
      const lowSign = Math.sign(offsetFrom(low, target));
      while (high - low > PRECISION_DAYS) {
        const mid = (low + high) / 2;
        if (Math.sign(offsetFrom(mid, target)) === lowSign) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    }
    previous = jd;
    previousOffset = current;
  }
  // 32일 안에 못 찾는 하늘은 없다. 그래도 조용히 틀린 값을 내놓지는 않는다.
  return fromJd;
}

/** now 이후의 다음 신월과 다음 보름. 어느 쪽이 먼저인지는 호출한 쪽이 본다. */
export function nextLunations(now: Date): { newMoon: Lunation; fullMoon: Lunation } {
  const jd = toJulianDay(now);
  const newJd = nextCrossing(jd, 0);
  const fullJd = nextCrossing(jd, 180);
  return {
    newMoon: {
      kind: "new",
      date: fromJulianDay(newJd).toISOString(),
      signKo: signAtLongitude(moonPosition(newJd).longitude).ko,
    },
    fullMoon: {
      kind: "full",
      date: fromJulianDay(fullJd).toISOString(),
      signKo: signAtLongitude(moonPosition(fullJd).longitude).ko,
    },
  };
}

/**
 * from(포함)부터 to(제외)까지의 모든 신월·보름, 시간순.
 * 달력·위클리·ics가 같은 목록을 쓰기 위한 기간 스캔이다.
 */
export function lunationsBetween(from: Date, to: Date): Lunation[] {
  const out: Lunation[] = [];
  const endJd = toJulianDay(to);
  const targets = [
    { target: 0, kind: "new" as const },
    { target: 180, kind: "full" as const },
  ];
  for (const { target, kind } of targets) {
    let jd = toJulianDay(from);
    // 12개월 스캔이면 삭망 각 13번 — 40이면 3년치까지 안전하다.
    for (let guard = 0; guard < 40; guard += 1) {
      const found = nextCrossing(jd, target);
      if (found <= jd || found >= endJd) break;
      out.push({
        kind,
        date: fromJulianDay(found).toISOString(),
        signKo: signAtLongitude(moonPosition(found).longitude).ko,
      });
      jd = found + 1;
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
