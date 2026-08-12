import { JD_J2000, nutationInLongitude, type EclipticPosition } from "./ephemeris";

/**
 * 달의 위치.
 *
 * 행성과 달리 케플러 요소만으로는 쓸 만한 값이 나오지 않는다. 달은 지구와
 * 태양 양쪽에 끌려다니며 궤도가 계속 흔들리기 때문이다. 그래서 여기서는
 * ELP-2000/82를 줄인 주기항 급수(Meeus, 천문 알고리즘 47장)를 그대로 쓴다.
 *
 * 아래 표는 다섯 개의 기본 각(D, M, M', F)의 정수 조합과 그 진폭이다. 이
 * 조합 하나하나가 실제 섭동에 대응한다 — 첫 줄의 6,288,774는 달이 근지점과
 * 원지점 사이를 오가며 생기는 6.3도짜리 흔들림이다.
 *
 * 여기 실은 항까지 계산하면 황경 오차는 대략 10초각 수준이다. 달은 한 시간에
 * 0.5도를 움직이므로 시간으로는 1초도 되지 않는다. 태어난 시각을 분 단위로
 * 아는 사람에게 충분한 정밀도다.
 */

const DEG = Math.PI / 180;

/** [D, M, M', F, 진폭(1e-6도)] */
const LONGITUDE_TERMS: [number, number, number, number, number][] = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314],
  [0, 0, 2, 0, 213618], [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332],
  [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066], [2, 0, 1, 0, 53322],
  [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528],
  [0, 0, 1, -2, 10980], [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034],
  [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888], [2, 1, 0, 0, -6766],
  [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861], [2, 0, -3, 0, 3665],
  [0, 1, -2, 0, -2689], [2, 0, -1, 2, -2602], [2, -1, -2, 0, 2390],
  [1, 0, 1, 0, -2348], [2, -2, 0, 0, 2236], [0, 1, 2, 0, -2120],
  [0, 2, 0, 0, -2069], [2, -2, -1, 0, 2048], [2, 0, 1, -2, -1773],
  [2, 0, 0, 2, -1595], [4, -1, -1, 0, 1215], [0, 0, 2, 2, -1110],
  [3, 0, -1, 0, -892], [2, 1, 1, 0, -810], [4, -1, -2, 0, 759],
  [0, 2, -1, 0, -713], [2, 2, -1, 0, -700], [2, 1, -2, 0, 691],
  [2, -1, 0, -2, 596], [4, 0, 1, 0, 549], [0, 0, 4, 0, 537],
  [4, -1, 0, 0, 520], [1, 0, -2, 0, -487], [2, 1, 0, -2, -399],
  [0, 0, 2, -2, -381], [1, 1, 1, 0, 351], [3, 0, -2, 0, -340],
  [4, 0, -3, 0, 330], [2, -1, 2, 0, 327], [0, 2, 1, 0, -323],
  [1, 1, -1, 0, 299], [2, 0, 3, 0, 294],
];

const LATITUDE_TERMS: [number, number, number, number, number][] = [
  [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693],
  [2, 0, 0, -1, 173237], [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271],
  [2, 0, 0, 1, 32573], [0, 0, 2, -1, 17198], [2, 0, 1, -1, 9266],
  [0, 0, 2, 1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359], [2, -1, -1, 1, 2463],
  [2, -1, 0, 1, 2211], [2, -1, -1, -1, 2065], [0, 1, -1, -1, -1870],
  [4, 0, -1, -1, 1828], [0, 1, 0, 1, -1794], [0, 0, 0, 3, -1749],
  [0, 1, -1, 1, -1565], [1, 0, 0, 1, -1491], [0, 1, 1, 1, -1475],
  [0, 1, 1, -1, -1410], [0, 1, 0, -1, -1344], [1, 0, 0, -1, -1335],
  [0, 0, 3, 1, 1107], [4, 0, 0, -1, 1021], [4, 0, -1, 1, 833],
  [0, 0, 1, -3, 777], [4, 0, -2, 1, 671], [2, 0, 0, -3, 607],
  [2, 0, 2, -1, 596], [2, -1, 1, -1, 491], [2, 0, -2, 1, -451],
  [0, 0, 3, -1, 439], [2, 0, 2, 1, 422], [2, 0, -3, -1, 421],
  [2, 1, -1, 1, -366], [2, 1, 0, 1, -351], [4, 0, 0, 1, 331],
  [2, -1, 1, 1, 315], [2, -2, 0, -1, 302], [0, 0, 1, 3, -283],
];

function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** 지구에서 본 달의 겉보기 위치. 거리는 AU가 아니라 지구 반지름 단위가 자연스러워 km로 준다. */
export function moonPosition(jd: number): EclipticPosition {
  const T = (jd - JD_J2000) / 36525;
  const T2 = T * T;
  const T3 = T2 * T;
  const T4 = T3 * T;

  // 달의 평균 황경
  const meanLongitude =
    218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  // 태양과의 평균 이각
  const elongation =
    297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  // 태양의 평균 근점이각
  const sunAnomaly = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  // 달의 평균 근점이각
  const moonAnomaly =
    134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  // 승교점으로부터의 평균 거리
  const argumentOfLatitude =
    93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;

  // 금성과 목성이 끌어당기는 몫. 위 다섯 각으로는 표현되지 않아 따로 붙인다.
  const a1 = 119.75 + 131.849 * T;
  const a2 = 53.09 + 479264.29 * T;
  const a3 = 313.45 + 481266.484 * T;

  // 지구 궤도의 이심률이 줄고 있어, 태양이 관련된 항은 그만큼 약해진다.
  const eccentricityFactor = 1 - 0.002516 * T - 0.0000074 * T2;

  let sumLongitude = 0;
  for (const [d, m, mp, f, amplitude] of LONGITUDE_TERMS) {
    const argument =
      (d * elongation + m * sunAnomaly + mp * moonAnomaly + f * argumentOfLatitude) * DEG;
    sumLongitude += amplitude * eccentricityFactor ** Math.abs(m) * Math.sin(argument);
  }
  sumLongitude +=
    3958 * Math.sin(a1 * DEG) +
    1962 * Math.sin((meanLongitude - argumentOfLatitude) * DEG) +
    318 * Math.sin(a2 * DEG);

  let sumLatitude = 0;
  for (const [d, m, mp, f, amplitude] of LATITUDE_TERMS) {
    const argument =
      (d * elongation + m * sunAnomaly + mp * moonAnomaly + f * argumentOfLatitude) * DEG;
    sumLatitude += amplitude * eccentricityFactor ** Math.abs(m) * Math.sin(argument);
  }
  sumLatitude +=
    -2235 * Math.sin(meanLongitude * DEG) +
    382 * Math.sin(a3 * DEG) +
    175 * Math.sin((a1 - argumentOfLatitude) * DEG) +
    175 * Math.sin((a1 + argumentOfLatitude) * DEG) +
    127 * Math.sin((meanLongitude - moonAnomaly) * DEG) -
    115 * Math.sin((meanLongitude + moonAnomaly) * DEG);

  return {
    // 이 급수의 황경은 이미 그 날짜의 평균 춘분점 기준이다. 세차 보정을 또
    // 더하면 두 번 적용된다 — 장동만 얹어 겉보기 값으로 만든다.
    longitude: norm360(meanLongitude + sumLongitude / 1e6 + nutationInLongitude(T)),
    latitude: sumLatitude / 1e6,
    // 평균 거리를 AU로. 이 페이지들에서 달의 거리는 쓰이지 않지만, 다른 천체와
    // 같은 모양을 유지해 두면 부르는 쪽이 분기하지 않아도 된다.
    distance: 385000.56 / 149597870.7,
  };
}

/**
 * 달의 위상 — 태양과 달의 황경 차이(0~360도).
 *
 * 0도가 삭(달이 보이지 않음), 180도가 망(보름달)이다. 이 각도 하나로 위상의
 * 이름과 밝은 면의 비율이 모두 나온다.
 */
export function moonPhaseAngle(sunLongitude: number, moonLongitude: number): number {
  return norm360(moonLongitude - sunLongitude);
}

export const MOON_PHASES = [
  { key: "new", ko: "삭", label: "그믐과 초승 사이" },
  { key: "waxing-crescent", ko: "초승달", label: "차오르기 시작" },
  { key: "first-quarter", ko: "상현달", label: "절반이 밝음" },
  { key: "waxing-gibbous", ko: "차는 달", label: "보름에 가까움" },
  { key: "full", ko: "보름달", label: "가장 밝음" },
  { key: "waning-gibbous", ko: "기우는 달", label: "보름을 지남" },
  { key: "last-quarter", ko: "하현달", label: "절반이 밝음" },
  { key: "waning-crescent", ko: "그믐달", label: "새 달을 앞둠" },
] as const;

export type MoonPhase = (typeof MOON_PHASES)[number];
/** 위상 이름의 키. 위상별 문장을 담은 표가 이것으로 색인된다. */
export type MoonPhaseKey = MoonPhase["key"];

/** 위상각을 여덟 이름 중 하나로. 경계는 45도씩 나누되 22.5도 어긋나게 잡는다. */
export function moonPhaseOf(phaseAngle: number): MoonPhase {
  const index = Math.floor((norm360(phaseAngle) + 22.5) / 45) % 8;
  return MOON_PHASES[index];
}

/** 밝게 보이는 면의 비율 (0~1). */
export function moonIllumination(phaseAngle: number): number {
  return (1 - Math.cos(phaseAngle * DEG)) / 2;
}
