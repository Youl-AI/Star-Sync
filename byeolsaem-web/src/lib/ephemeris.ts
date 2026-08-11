/**
 * 수성과 지구의 위치를 직접 계산한다.
 *
 * 역행 페이지는 "언제부터 언제까지 역행인가"에 전부를 건다. 그 날짜를 어디선가
 * 베껴 오면 출처가 틀렸을 때 알아챌 방법이 없고, 해가 바뀔 때마다 사람이 다시
 * 적어 넣어야 한다. 그래서 궤도 요소에서 위치를 직접 구하고, 겉보기 황경이
 * 줄어드는 구간을 찾아 역행으로 판정한다 — 한 번 맞으면 몇 년치가 저절로 나온다.
 *
 * 궤도 요소는 JPL이 공개한 근사값(Standish, "Keplerian Elements for Approximate
 * Positions of the Major Planets", 1800~2050년 유효)이다. 정밀 천문력이 아니라
 * 몇 분각(arcminute) 수준의 근사지만, 이 페이지가 답해야 하는 것은 "며칠에
 * 멈추는가"이고 유(留, station) 시각은 황경의 **변화율**이 0이 되는 지점이라
 * 천천히 변하는 위치 오차에는 거의 영향을 받지 않는다.
 *
 * 개인 천궁도의 행성 위치는 이 값을 쓰지 않는다. 그쪽은 백엔드의 스위스 천문력
 * 담당이다(RENEWAL_PLAN §6.1). 여기 계산은 이 페이지 하나를 위한 것이다.
 */

const DEG = Math.PI / 180;

/** 빛이 1AU를 지나는 데 걸리는 시간의 역수 (AU/일). */
const LIGHT_SPEED_AU_PER_DAY = 173.144632674;

/** 유닉스 시각 0의 율리우스일. */
const JD_UNIX_EPOCH = 2440587.5;
/** J2000.0 (2000-01-01 12:00 TT). */
export const JD_J2000 = 2451545;

/**
 * 궤도 요소 한 벌. 각 항목은 [J2000에서의 값, 1세기당 변화량].
 * 각도는 도, 거리는 AU.
 */
export interface ElementSet {
  /** 궤도 긴반지름 */
  a: readonly [number, number];
  /** 이심률 */
  e: readonly [number, number];
  /** 궤도 경사 */
  inclination: readonly [number, number];
  /** 평균 황경 */
  meanLongitude: readonly [number, number];
  /** 근일점 황경 */
  perihelion: readonly [number, number];
  /** 승교점 황경 */
  node: readonly [number, number];
}

/**
 * JPL "Keplerian Elements for Approximate Positions of the Major Planets"
 * (Standish) 1800~2050년 판. 이 구간에서는 보정항(b, c, s, f) 없이 1차 변화율만
 * 쓰는 것이 표의 규정이다.
 *
 * 지구 대신 지구-달 질량중심이 실려 있다. 표가 그렇게 준다. 지구와의 차이는
 * 최대 약 4,700km로 1AU의 3만분의 1이고, 황경으로는 몇 초각(arcsecond)이라
 * 별자리 판정에 영향을 주지 않는다.
 */
export const ORBITAL_ELEMENTS = {
  mercury: {
    a: [0.38709927, 0.00000037],
    e: [0.20563593, 0.00001906],
    inclination: [7.00497902, -0.00594749],
    meanLongitude: [252.2503235, 149472.67411175],
    perihelion: [77.45779628, 0.16047689],
    node: [48.33076593, -0.12534081],
  },
  venus: {
    a: [0.72333566, 0.0000039],
    e: [0.00677672, -0.00004107],
    inclination: [3.39467605, -0.0007889],
    meanLongitude: [181.9790995, 58517.81538729],
    perihelion: [131.60246718, 0.00268329],
    node: [76.67984255, -0.27769418],
  },
  earth: {
    a: [1.00000261, 0.00000562],
    e: [0.01671123, -0.00004392],
    inclination: [-0.00001531, -0.01294668],
    meanLongitude: [100.46457166, 35999.37244981],
    perihelion: [102.93768193, 0.32327364],
    node: [0, 0],
  },
  mars: {
    a: [1.52371034, 0.00001847],
    e: [0.0933941, 0.00007882],
    inclination: [1.84969142, -0.00813131],
    meanLongitude: [-4.55343205, 19140.30268499],
    perihelion: [-23.94362959, 0.44441088],
    node: [49.55953891, -0.29257343],
  },
  jupiter: {
    a: [5.202887, -0.00011607],
    e: [0.04838624, -0.00013253],
    inclination: [1.30439695, -0.00183714],
    meanLongitude: [34.39644051, 3034.74612775],
    perihelion: [14.72847983, 0.21252668],
    node: [100.47390909, 0.20469106],
  },
  saturn: {
    a: [9.53667594, -0.0012506],
    e: [0.05386179, -0.00050991],
    inclination: [2.48599187, 0.00193609],
    meanLongitude: [49.95424423, 1222.49362201],
    perihelion: [92.59887831, -0.41897216],
    node: [113.66242448, -0.28867794],
  },
  uranus: {
    a: [19.18916464, -0.00196176],
    e: [0.04725744, -0.00004397],
    inclination: [0.77263783, -0.00242939],
    meanLongitude: [313.23810451, 428.48202785],
    perihelion: [170.9542763, 0.40805281],
    node: [74.01692503, 0.04240589],
  },
  neptune: {
    a: [30.06992276, 0.00026291],
    e: [0.00859048, 0.00005105],
    inclination: [1.77004347, 0.00035372],
    meanLongitude: [-55.12002969, 218.45945325],
    perihelion: [44.96476227, -0.32241464],
    node: [131.78422574, -0.00508664],
  },
  pluto: {
    a: [39.48211675, -0.00031596],
    e: [0.2488273, 0.0000517],
    inclination: [17.14001206, 0.00004818],
    meanLongitude: [238.92903833, 145.20780515],
    perihelion: [224.06891629, -0.04062942],
    node: [110.30393684, -0.01183482],
  },
} satisfies Record<string, ElementSet>;

/** 케플러 요소로 위치를 구할 수 있는 천체. 태양과 달은 여기 없다. */
export type OrbitingBody = keyof typeof ORBITAL_ELEMENTS;

const MERCURY = ORBITAL_ELEMENTS.mercury;
const EARTH_MOON_BARYCENTER = ORBITAL_ELEMENTS.earth;

export type Vector3 = [number, number, number];

/** 자바스크립트 시각을 율리우스일로. */
export function toJulianDay(date: Date): number {
  return date.getTime() / 86400000 + JD_UNIX_EPOCH;
}

/** 율리우스일을 자바스크립트 시각으로. */
export function fromJulianDay(jd: number): Date {
  return new Date((jd - JD_UNIX_EPOCH) * 86400000);
}

function norm360(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** -180 ~ +180으로 접는다. 각도 차이를 다룰 때 쓴다. */
export function norm180(deg: number): number {
  const r = norm360(deg);
  return r > 180 ? r - 360 : r;
}

/**
 * 케플러 방정식 M = E - e·sin E 를 이심 근점이각 E에 대해 푼다.
 * 뉴턴법. 수성의 이심률(0.206)에서도 대여섯 번이면 배정밀도 한계까지 간다.
 */
function eccentricAnomaly(meanAnomaly: number, e: number): number {
  let E = meanAnomaly + e * Math.sin(meanAnomaly);
  for (let i = 0; i < 20; i += 1) {
    const delta = (E - e * Math.sin(E) - meanAnomaly) / (1 - e * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-13) break;
  }
  return E;
}

/**
 * 태양 중심 좌표 (J2000 황도면 기준, AU).
 * @param centuries J2000에서 지난 율리우스 세기
 */
export function heliocentric(elements: ElementSet, centuries: number): Vector3 {
  const T = centuries;
  const a = elements.a[0] + elements.a[1] * T;
  const e = elements.e[0] + elements.e[1] * T;
  const inclination = (elements.inclination[0] + elements.inclination[1] * T) * DEG;
  const meanLongitude = elements.meanLongitude[0] + elements.meanLongitude[1] * T;
  const perihelion = elements.perihelion[0] + elements.perihelion[1] * T;
  const node = (elements.node[0] + elements.node[1] * T) * DEG;
  const argPerihelion = perihelion * DEG - node;

  const E = eccentricAnomaly(norm180(meanLongitude - perihelion) * DEG, e);

  // 궤도면 안의 좌표. x축이 근일점 방향.
  const xOrbit = a * (Math.cos(E) - e);
  const yOrbit = a * Math.sqrt(1 - e * e) * Math.sin(E);

  const cw = Math.cos(argPerihelion);
  const sw = Math.sin(argPerihelion);
  const cn = Math.cos(node);
  const sn = Math.sin(node);
  const ci = Math.cos(inclination);
  const si = Math.sin(inclination);

  return [
    (cw * cn - sw * sn * ci) * xOrbit + (-sw * cn - cw * sn * ci) * yOrbit,
    (cw * sn + sw * cn * ci) * xOrbit + (-sw * sn + cw * cn * ci) * yOrbit,
    sw * si * xOrbit + cw * si * yOrbit,
  ];
}

/**
 * J2000 황도 기준 황경을 그 날짜의 황도(춘분점) 기준으로 옮긴다.
 *
 * 점성술의 12궁은 춘분점에서 시작하는 회귀 황도이므로 이 보정이 필요하다.
 * 세차운동은 100년에 약 1.4°라 유 시각에는 영향이 없지만, "어느 별자리에서
 * 멈추는가"를 말할 때는 있어야 맞는다.
 */
function precessionSinceJ2000(centuries: number): number {
  return 1.396971 * centuries + 0.0003086 * centuries * centuries;
}

export interface ApparentPosition {
  /** 겉보기 황경 (도, 0~360, 그 날짜의 춘분점 기준) */
  longitude: number;
  /** 겉보기 황위 (도) */
  latitude: number;
  /** 지구에서의 거리 (AU) */
  distance: number;
}

/** 지구에서 본 수성의 겉보기 위치. */
export function mercuryApparent(jd: number): ApparentPosition {
  const centuries = (jd - JD_J2000) / 36525;
  const earth = heliocentric(EARTH_MOON_BARYCENTER, centuries);

  // 우리가 보는 것은 지금의 수성이 아니라 빛이 출발하던 때의 수성이다. 거리를
  // 먼저 재고, 그만큼 과거의 위치로 다시 계산한다. 수성은 최대 0.9AU까지
  // 멀어지므로 이 보정이 8분(약 0.1도)에 달한다 — 무시할 수 없다.
  let position = heliocentric(MERCURY, centuries);
  let distance = separation(position, earth);
  for (let i = 0; i < 3; i += 1) {
    const lightTime = distance / LIGHT_SPEED_AU_PER_DAY;
    position = heliocentric(MERCURY, (jd - lightTime - JD_J2000) / 36525);
    distance = separation(position, earth);
  }

  const x = position[0] - earth[0];
  const y = position[1] - earth[1];
  const z = position[2] - earth[2];

  return {
    longitude: norm360(Math.atan2(y, x) / DEG + precessionSinceJ2000(centuries)),
    latitude: Math.asin(z / Math.hypot(x, y, z)) / DEG,
    distance: Math.hypot(x, y, z),
  };
}

/** 지구에서 본 태양의 겉보기 황경. 계산이 맞는지 확인하는 데 쓴다. */
export function sunApparentLongitude(jd: number): number {
  const centuries = (jd - JD_J2000) / 36525;
  const earth = heliocentric(EARTH_MOON_BARYCENTER, centuries);
  return norm360(
    Math.atan2(-earth[1], -earth[0]) / DEG + precessionSinceJ2000(centuries),
  );
}

function separation(a: Vector3, b: Vector3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * 황도 경사각 (도). 지구 자전축이 공전면에 대해 기울어진 각도로, 천천히 줄고
 * 있다. 적도 좌표와 황도 좌표를 오갈 때 쓴다. (Meeus, 천문 알고리즘 22.2)
 */
export function obliquity(centuries: number): number {
  const T = centuries;
  return (
    23.439291111 - 0.0130041667 * T - 1.6389e-7 * T * T + 5.036111e-7 * T * T * T
  );
}

/**
 * 황경의 장동(章動). 달의 궤도면이 흔들리면서 춘분점이 18.6년 주기로 앞뒤로
 * 미세하게 움직인다. 크기는 최대 17초각 — 별자리 판정에는 영향이 없지만,
 * 도수를 소수점까지 적는 이상 빼놓으면 그만큼 틀린 값이 된다.
 */
export function nutationInLongitude(centuries: number): number {
  const T = centuries;
  const omega = (125.04452 - 1934.136261 * T) * DEG;
  const meanSun = (280.4665 + 36000.7698 * T) * DEG;
  const meanMoon = (218.3165 + 481267.8813 * T) * DEG;
  // 주요 세 항만. 나머지는 모두 1초각 아래다.
  return (
    (-17.2 * Math.sin(omega) - 1.32 * Math.sin(2 * meanSun) - 0.23 * Math.sin(2 * meanMoon)) / 3600
  );
}

/**
 * 그리니치 평균 항성시 (도). 지구가 항성에 대해 얼마나 돌았는가.
 * 상승궁과 중천을 구하려면 이 값이 먼저 필요하다. (Meeus 12.4)
 */
export function greenwichSiderealTime(jd: number): number {
  const T = (jd - JD_J2000) / 36525;
  const theta =
    280.46061837 +
    360.98564736629 * (jd - JD_J2000) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return norm360(theta);
}

/** 겉보기 황경·황위·거리. 태양과 달, 그리고 아홉 행성이 같은 모양으로 나온다. */
export interface EclipticPosition {
  /** 겉보기 황경 (도, 그 날짜의 춘분점 기준) */
  longitude: number;
  /** 겉보기 황위 (도) */
  latitude: number;
  /** 지구에서의 거리 (AU) */
  distance: number;
}

/**
 * 지구에서 본 행성의 겉보기 위치.
 *
 * 빛이 오는 데 걸린 시간만큼 과거의 위치를 본다. 토성쯤 되면 이 보정이 한
 * 시간을 넘고, 그 사이 행성은 실제로 움직인다.
 */
export function planetPosition(body: OrbitingBody, jd: number): EclipticPosition {
  const centuries = (jd - JD_J2000) / 36525;
  const earth = heliocentric(EARTH_MOON_BARYCENTER, centuries);

  let position = heliocentric(ORBITAL_ELEMENTS[body], centuries);
  let distance = separation(position, earth);
  for (let i = 0; i < 3; i += 1) {
    const lightTime = distance / LIGHT_SPEED_AU_PER_DAY;
    position = heliocentric(ORBITAL_ELEMENTS[body], (jd - lightTime - JD_J2000) / 36525);
    distance = separation(position, earth);
  }

  const x = position[0] - earth[0];
  const y = position[1] - earth[1];
  const z = position[2] - earth[2];
  const correction = precessionSinceJ2000(centuries) + nutationInLongitude(centuries);

  return {
    longitude: norm360(Math.atan2(y, x) / DEG + correction),
    latitude: Math.asin(z / Math.hypot(x, y, z)) / DEG,
    distance: Math.hypot(x, y, z),
  };
}

/** 지구에서 본 태양의 겉보기 위치. 지구 위치를 정확히 뒤집은 것이다. */
export function sunPosition(jd: number): EclipticPosition {
  const centuries = (jd - JD_J2000) / 36525;
  const earth = heliocentric(EARTH_MOON_BARYCENTER, centuries);
  const distance = Math.hypot(earth[0], earth[1], earth[2]);
  const correction = precessionSinceJ2000(centuries) + nutationInLongitude(centuries);
  return {
    longitude: norm360(Math.atan2(-earth[1], -earth[0]) / DEG + correction),
    latitude: -Math.asin(earth[2] / distance) / DEG,
    distance,
  };
}
