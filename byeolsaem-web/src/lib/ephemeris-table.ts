import { longitudeOf } from "./chart";
import { norm180, toJulianDay } from "./ephemeris";
import { PLANETS, type PlanetKey } from "./planets";
import { signAtLongitude } from "./zodiac";

/**
 * 천문력 표 — 날짜별(KST 자정) 10행성의 위치. 해석이 아니라 원자료다.
 *
 * 역행 판정은 하루 전후의 황경 차이(수치 미분)로 한다 — retrograde.ts의
 * longitudeRate는 수·금·화만 알지만, 표는 목성~명왕성의 ℞도 보여줘야 한다.
 * 태양·달은 겉보기 역행이 없으므로 항상 false다.
 */
export interface EphemerisCell {
  planet: PlanetKey;
  symbol: string;
  signKo: string;
  degree: number;
  minute: number;
  retrograde: boolean;
}
export interface EphemerisRow {
  date: string;
  cells: EphemerisCell[];
}

const KST_MS = 9 * 3600000;
const NEVER_RETRO: PlanetKey[] = ["sun", "moon"];

export function monthTable(year: number, month: number): EphemerisRow[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rows: EphemerisRow[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const at = new Date(Date.UTC(year, month - 1, day) - KST_MS); // KST 자정
    const jd = toJulianDay(at);
    const cells = PLANETS.map((planet): EphemerisCell => {
      const lon = longitudeOf(planet.key, jd);
      const inSign = lon % 30;
      let degree = Math.floor(inSign);
      let minute = Math.round((inSign - degree) * 60);
      if (minute === 60) {
        // 59.5분 반올림이 60이 되면 도 쪽으로 올린다 — 29°60′은 표에 못 싣는다.
        minute = 0;
        degree += 1;
      }
      if (degree === 30) degree = 0;
      const retrograde = NEVER_RETRO.includes(planet.key)
        ? false
        : norm180(longitudeOf(planet.key, jd + 0.5) - longitudeOf(planet.key, jd - 0.5)) < 0;
      return {
        planet: planet.key,
        symbol: planet.symbol,
        signKo: signAtLongitude(lon).ko,
        degree,
        minute,
        retrograde,
      };
    });
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    rows.push({ date: `${year}-${mm}-${dd}`, cells });
  }
  return rows;
}
