import { birthJulianDay, computeChart, type BirthMoment, type Chart } from "./chart";
import { fromJulianDay, norm180, sunApparentLongitude, toJulianDay } from "./ephemeris";

/**
 * 솔라 리턴 — 태양이 출생 순간의 황경으로 돌아오는 순간과 그때의 차트.
 *
 * 그 순간의 하늘로 생일부터 다음 생일까지 한 해를 읽는 것이 솔라 리턴이다.
 * 장소는 출생지를 그대로 쓴다(현재 위치로 세우는 유파도 있으나 우리는 위치를
 * 수집하지 않는다 — 페이지가 이 관례 차이를 밝힌다).
 *
 * 탐색은 삭망·인그레스와 같은 뼈대다: 생일 근방 ±6일 창에서 부호 반전을 찾아
 * 이분법으로 좁힌다. 태양년(365.24일)과 달력년의 어긋남이 하루를 넘지 않으므로
 * 창 안에 반전이 반드시 하나 있다.
 */
const PRECISION_DAYS = 0.0002;

export function solarReturnInstant(natal: BirthMoment, targetYear: number): Date {
  const natalSun = sunApparentLongitude(birthJulianDay(natal));
  const [, m, d] = natal.date.split("-").map(Number);
  // 2/29 출생은 Date.UTC가 3/1로 굴리지만 창이 ±6일이라 반전을 놓치지 않는다.
  const guess = toJulianDay(new Date(Date.UTC(targetYear, m - 1, d, 12)));
  const offset = (jd: number) => norm180(sunApparentLongitude(jd) - natalSun);

  let low = guess - 6;
  let high = guess + 6;
  let prev = low;
  let prevOff = offset(low);
  for (let jd = low + 1; jd <= high; jd += 1) {
    const off = offset(jd);
    if (Math.sign(off) !== Math.sign(prevOff) && Math.abs(off) < 30) {
      low = prev;
      high = jd;
      break;
    }
    prev = jd;
    prevOff = off;
  }
  const lowSign = Math.sign(offset(low));
  while (high - low > PRECISION_DAYS) {
    const mid = (low + high) / 2;
    if (Math.sign(offset(mid)) === lowSign) low = mid;
    else high = mid;
  }
  return fromJulianDay((low + high) / 2);
}

export function solarReturnChart(
  natal: BirthMoment,
  now: Date,
): { instant: Date; nextInstant: Date; chart: Chart } {
  let year = now.getUTCFullYear();
  let instant = solarReturnInstant(natal, year);
  if (instant.getTime() > now.getTime()) {
    year -= 1;
    instant = solarReturnInstant(natal, year);
  }
  const nextInstant = solarReturnInstant(natal, year + 1);

  // 리턴 순간을 출생지의 지역시로 옮겨 BirthMoment 형태로 만든다.
  const local = new Date(instant.getTime() + natal.timezoneOffsetHours * 3600000);
  let chart = computeChart({
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
    latitude: natal.latitude,
    longitude: natal.longitude,
    timezoneOffsetHours: natal.timezoneOffsetHours,
  });

  // 출생 시각을 모르면 리턴 차트의 상승궁·하우스도 내지 않는다 — 리턴 '순간'은
  // 정밀해도, 그 순간을 세울 출생 기준시가 없는 사람에게 시각 의존 층을 보여주는
  // 것은 지어내는 일이다(planet-in-house.ts의 약속과 동일).
  if (natal.time === null) {
    chart = {
      ...chart,
      ascendant: null,
      midheaven: null,
      houseCusps: null,
      timeUnknown: true,
      placements: chart.placements.map((p) => ({ ...p, house: null })),
    };
  }

  return { instant, nextInstant, chart };
}
