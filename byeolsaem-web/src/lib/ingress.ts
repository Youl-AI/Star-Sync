import { fromJulianDay, sunPosition, toJulianDay } from "./ephemeris";
import { signAtLongitude } from "./zodiac";

/**
 * 태양 인그레스 — 태양이 별자리 경계(황경 30도 배수)를 넘는 순간.
 *
 * 하루 간격으로 별자리 인덱스 변화를 훑고 이분법으로 좁힌다 — 역행의 유(留)와
 * 삭망을 찾는 것과 같은 방법이다(retrograde.ts·lunation.ts 참고). 태양은 하루
 * 1도쯤 움직이므로 하루 걸음에 경계를 두 번 넘는 일은 없다.
 *
 * 태양만 다룬다. 수성·금성·화성 인그레스까지 실으면 달력이 소음이 된다.
 */
export interface Ingress {
  /** 넘어간 뒤의 별자리 */
  signKo: string;
  /** 정확한 순간 (ISO) */
  date: string;
}

/** 이분법 정지 조건 — 사이트 공통 정밀도(약 17초). */
const PRECISION_DAYS = 0.0002;

function signIndex(jd: number): number {
  return Math.floor(sunPosition(jd).longitude / 30) % 12;
}

export function sunIngresses(from: Date, to: Date): Ingress[] {
  const out: Ingress[] = [];
  const endJd = toJulianDay(to);
  let prevJd = toJulianDay(from);
  let prevIdx = signIndex(prevJd);
  for (let jd = prevJd + 1; jd <= endJd + 1; jd += 1) {
    const idx = signIndex(jd);
    if (idx !== prevIdx) {
      let low = prevJd;
      let high = jd;
      while (high - low > PRECISION_DAYS) {
        const mid = (low + high) / 2;
        if (signIndex(mid) === prevIdx) low = mid;
        else high = mid;
      }
      const at = (low + high) / 2;
      if (at >= toJulianDay(from) && at < endJd) {
        // 경계 위의 값은 부동소수 쪽에 따라 앞자리로 읽힐 수 있어, 새 자리의
        // 안쪽 1도를 물어 자리 이름을 정한다.
        out.push({ signKo: signAtLongitude(idx * 30 + 1).ko, date: fromJulianDay(at).toISOString() });
      }
    }
    prevJd = jd;
    prevIdx = idx;
  }
  return out;
}
