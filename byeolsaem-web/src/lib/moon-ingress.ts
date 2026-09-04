import { fromJulianDay, toJulianDay } from "./ephemeris";
import { moonPosition } from "./moon";
import { signAtLongitude } from "./zodiac";

/**
 * 달 인그레스 — 달이 별자리 경계(황경 30도 배수)를 넘는 순간.
 *
 * 태양 인그레스(ingress.ts)와 같은 방법이다. 하루 간격으로 자리 인덱스가 바뀌는
 * 구간을 찾고 이분법으로 좁힌다. 달은 하루에 13도쯤 움직이므로 한 걸음에 경계를
 * 두 번 넘는 일은 없다.
 *
 * 이것을 따로 둔 이유: 달은 이틀 반마다 자리를 옮겨 한 달에 열두어 번이다. 달력
 * 그리드에 그대로 실으면 신월·보름·역행이 묻힌다. 그래서 이 값은 주간 화면만
 * 가져다 쓴다(calendar-events.ts의 `moon` 옵션).
 *
 * 대신 주간 화면에는 이것이 필요했다. 삭망·역행·태양 인그레스만 세면 한 주가
 * 통째로 비는 일이 생기고, 그런 주의 화면에는 "조용합니다" 한 줄밖에 남지
 * 않았다. 달의 이동은 어느 주에나 두세 번 있다 — 조용한 주에도 하늘은 움직인다.
 */
export interface MoonIngress {
  /** 넘어간 뒤의 별자리 */
  signKo: string;
  /** 정확한 순간 (ISO) */
  date: string;
}

/** 이분법 정지 조건 — 사이트 공통 정밀도(약 17초). */
const PRECISION_DAYS = 0.0002;

function signIndex(jd: number): number {
  return Math.floor(moonPosition(jd).longitude / 30) % 12;
}

export function moonIngresses(from: Date, to: Date): MoonIngress[] {
  const out: MoonIngress[] = [];
  const startJd = toJulianDay(from);
  const endJd = toJulianDay(to);
  let prevJd = startJd;
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
      if (at >= startJd && at < endJd) {
        // 경계 위의 값은 부동소수 쪽에 따라 앞자리로 읽힐 수 있어, 새 자리의
        // 안쪽 1도를 물어 자리 이름을 정한다(ingress.ts와 같은 이유).
        out.push({ signKo: signAtLongitude(idx * 30 + 1).ko, date: fromJulianDay(at).toISOString() });
      }
    }
    prevJd = jd;
    prevIdx = idx;
  }
  return out;
}
