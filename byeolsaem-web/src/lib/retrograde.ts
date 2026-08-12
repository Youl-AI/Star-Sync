import { signAtLongitude } from "./zodiac";
import { fromJulianDay, mercuryApparent, norm180, toJulianDay } from "./ephemeris";
import type { RetrogradePeriod } from "./retrograde-clock";

export type { RetrogradePeriod } from "./retrograde-clock";

/**
 * 수성 역행 구간을 찾는다.
 *
 * 역행은 천문 현상이 아니라 **보이는 방향**의 문제다. 수성이 실제로 뒤로 가는
 * 것이 아니라, 지구와 수성의 공전 속도 차이 때문에 지구에서 볼 때 황경이
 * 잠시 줄어드는 것처럼 보인다. 그래서 판정 기준도 그대로다 — 겉보기 황경의
 * 변화율이 음수인 구간.
 *
 * 변화율이 0이 되는 순간을 유(留, station)라고 부르고, 그 두 지점이 역행의
 * 시작과 끝이다. 구간 안에서 부호가 바뀌는 곳을 하루 간격으로 훑어 찾은 뒤
 * 이분법으로 좁힌다.
 */

/** 유 시각을 이 정밀도까지 좁힌다. 0.0002일 ≈ 17초. */
const STATION_PRECISION_DAYS = 0.0002;

/**
 * 변화율을 재는 폭. 너무 좁으면 위치 계산의 수치 잡음이 그대로 미분에 실리고,
 * 너무 넓으면 유 근처의 곡률을 뭉갠다. 반나절이 둘 사이에서 안정적이다.
 */
const RATE_WINDOW_DAYS = 0.5;

/** 하루에 몇 도씩 겉보기 황경이 움직이는가. 음수면 역행 중. */
export function longitudeRate(jd: number): number {
  const before = mercuryApparent(jd - RATE_WINDOW_DAYS / 2).longitude;
  const after = mercuryApparent(jd + RATE_WINDOW_DAYS / 2).longitude;
  return norm180(after - before) / RATE_WINDOW_DAYS;
}

/** 변화율이 0을 지나는 지점을 이분법으로 좁힌다. */
function refineStation(lowJd: number, highJd: number): number {
  let low = lowJd;
  let high = highJd;
  const lowRate = longitudeRate(low);
  while (high - low > STATION_PRECISION_DAYS) {
    const mid = (low + high) / 2;
    if (Math.sign(longitudeRate(mid)) === Math.sign(lowRate)) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/**
 * 두 시각 사이에 완결되는 역행 구간을 모두 찾는다.
 *
 * 경계에 걸친 구간(시작만 있고 끝이 범위 밖)은 버린다. 반쪽짜리 구간을 표에
 * 올리면 종료일이 비거나 틀린 값이 들어가기 때문이다. 대신 범위를 넉넉히
 * 잡아 부르는 쪽에서 손해가 없게 한다.
 */
export function mercuryRetrogrades(from: Date, to: Date): RetrogradePeriod[] {
  const fromJd = toJulianDay(from);
  const toJd = toJulianDay(to);

  // 부호가 바뀌는 지점을 모두 모은다.
  const stations: { jd: number; entering: boolean }[] = [];
  let previousJd = fromJd;
  let previousRate = longitudeRate(previousJd);
  for (let jd = fromJd + 1; jd <= toJd; jd += 1) {
    const rate = longitudeRate(jd);
    if (Math.sign(rate) !== Math.sign(previousRate)) {
      stations.push({ jd: refineStation(previousJd, jd), entering: rate < 0 });
    }
    previousJd = jd;
    previousRate = rate;
  }

  const periods: RetrogradePeriod[] = [];
  for (let i = 0; i < stations.length - 1; i += 1) {
    if (!stations[i].entering || stations[i + 1].entering) continue;
    const startJd = stations[i].jd;
    const endJd = stations[i + 1].jd;
    const startLongitude = mercuryApparent(startJd).longitude;
    const endLongitude = mercuryApparent(endJd).longitude;
    periods.push({
      start: fromJulianDay(startJd).toISOString(),
      end: fromJulianDay(endJd).toISOString(),
      startLongitude,
      endLongitude,
      days: endJd - startJd,
      arc: Math.abs(norm180(startLongitude - endLongitude)),
    });
  }
  return periods;
}

/**
 * 그림자 기간 — 역행 구간과 같은 도수를 앞뒤로 한 번씩 더 지나는 때.
 *
 * 수성은 역행으로 되짚어 갈 구간을 순행으로 먼저 한 번 지나고(전 그림자),
 * 역행으로 되돌아온 뒤 다시 순행으로 한 번 더 지난다(후 그림자). 같은 하늘을
 * 세 번 지나가는 셈이라 점성술에서는 이 앞뒤 구간까지 함께 본다.
 *
 * 경계는 계산으로 정해진다. 전 그림자의 시작은 수성이 **역행이 끝날 도수**에
 * 처음 닿는 순간이고, 후 그림자의 끝은 **역행이 시작된 도수**로 되돌아오는
 * 순간이다.
 */
export function shadowPeriod(period: RetrogradePeriod): { start: string; end: string } {
  const startJd = toJulianDay(new Date(period.start));
  const endJd = toJulianDay(new Date(period.end));

  const crossing = (fromJd: number, target: number, direction: -1 | 1): number => {
    // 하루씩 옮겨 가며 부호가 바뀌는 날을 찾고, 그 하루 안에서 이분법으로 좁힌다.
    const offset = (jd: number) => norm180(mercuryApparent(jd).longitude - target);
    let previous = fromJd;
    let previousOffset = offset(previous);
    for (let step = 1; step <= 90; step += 1) {
      const jd = fromJd + direction * step;
      const current = offset(jd);
      if (Math.sign(current) !== Math.sign(previousOffset)) {
        let low = Math.min(previous, jd);
        let high = Math.max(previous, jd);
        const lowSign = Math.sign(offset(low));
        while (high - low > STATION_PRECISION_DAYS) {
          const mid = (low + high) / 2;
          if (Math.sign(offset(mid)) === lowSign) low = mid;
          else high = mid;
        }
        return (low + high) / 2;
      }
      previous = jd;
      previousOffset = current;
    }
    // 90일 안에 못 찾는 일은 없다(그림자는 보통 2~3주). 그래도 조용히 틀린 값을
    // 내놓지는 않는다.
    return fromJd;
  };

  return {
    start: fromJulianDay(crossing(startJd, period.endLongitude, -1)).toISOString(),
    end: fromJulianDay(crossing(endJd, period.startLongitude, 1)).toISOString(),
  };
}

/** 황경이 어느 별자리에 드는가. 0도가 양자리 0도이고 30도마다 한 자리씩. */
// signAtLongitude는 zodiac.ts로 옮겼다 — 역행만의 지식이 아니라 황도 자체의
// 지식이고, 오늘의 하늘도 같은 것을 쓴다. 여기서 쓰던 곳들을 위해 다시 내보낸다.
export { signAtLongitude };

/** "양자리 12도"처럼 자리와 그 안에서의 도수로 적는다. */
export function formatZodiacDegree(longitude: number): string {
  const sign = signAtLongitude(longitude);
  const degree = Math.floor((((longitude % 360) + 360) % 360) % 30);
  return `${sign.ko} ${degree}도`;
}

export interface LoopSample {
  /** 겉보기 황경 (도) */
  longitude: number;
  /** 겉보기 황위 (도) */
  latitude: number;
  /** 구간 시작에서 며칠째인가 */
  day: number;
  /** 이 시점이 역행 구간 안인가 */
  retrograde: boolean;
}

/**
 * 역행 고리의 궤적. 별을 배경으로 수성이 그리는 실제 경로다.
 *
 * 순행으로 다가와 멈추고, 되짚어 물러났다가, 다시 멈춰 앞으로 나아간다. 황위가
 * 함께 움직이기 때문에 되짚는 길이 왔던 길과 겹치지 않고 고리 모양이 남는다 —
 * 이 페이지의 이름이 "역행 고리"인 이유다.
 *
 * @param margin 역행 구간 앞뒤로 며칠씩 더 그릴지
 */
export function retrogradeLoop(period: RetrogradePeriod, margin = 14): LoopSample[] {
  const startJd = toJulianDay(new Date(period.start));
  const endJd = toJulianDay(new Date(period.end));
  const samples: LoopSample[] = [];
  for (let jd = startJd - margin; jd <= endJd + margin; jd += 1) {
    const position = mercuryApparent(jd);
    samples.push({
      longitude: position.longitude,
      latitude: position.latitude,
      day: jd - startJd,
      retrograde: jd >= startJd && jd <= endJd,
    });
  }
  return samples;
}
