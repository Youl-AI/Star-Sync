import { describe, expect, it } from "vitest";
import { angleBetween, computeChart } from "@/lib/chart";
import { planetPosition, sunPosition, toJulianDay } from "@/lib/ephemeris";
import { moonPosition } from "@/lib/moon";
import { longitudeRate, mercuryRetrogrades } from "@/lib/retrograde";

/**
 * 천문 계산이 구조적으로 맞는지 본다.
 *
 * 다른 테스트들이 "같은 입력이면 같은 글이 나오는가"를 보는 데 반해 여기서는
 * **하늘이 실제로 그런가**를 본다. 이 파일이 잡으려는 것은 몇 분각의 오차가
 * 아니라 부호가 뒤집혔다든지, 각도를 라디안으로 잘못 넣었다든지, 세차를
 * 빼먹었다든지 하는 종류다. 그런 오류는 화면에서 그럴듯해 보이기 때문에
 * 눈으로는 잡히지 않는다.
 *
 * 기준값을 어디서 가져오지 않고 **반드시 참이어야 하는 성질**로만 적었다.
 * 외부 표를 베껴 오면 그 표를 잘못 옮겼을 때 테스트가 함께 틀린다.
 */

const norm360 = (d: number) => ((d % 360) + 360) % 360;

/** 태양 황경이 target을 지나는 순간을 이분법으로 찾는다. */
function sunCrossing(target: number, fromIso: string, toIso: string): Date {
  let lo = toJulianDay(new Date(fromIso));
  let hi = toJulianDay(new Date(toIso));
  const signedGap = (jd: number) => norm360(sunPosition(jd).longitude - target + 180) - 180;
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (signedGap(lo) * signedGap(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return new Date((((lo + hi) / 2) - 2440587.5) * 86400000);
}

describe("태양", () => {
  const rateOn = (iso: string) => {
    const jd = toJulianDay(new Date(iso));
    return norm360(sunPosition(jd + 1).longitude - sunPosition(jd).longitude);
  };

  it("하루에 1도 안팎을 움직인다", () => {
    for (const iso of ["2026-01-03T00:00:00Z", "2026-04-05T00:00:00Z", "2026-07-05T00:00:00Z"]) {
      expect(rateOn(iso), iso).toBeGreaterThan(0.95);
      expect(rateOn(iso), iso).toBeLessThan(1.02);
    }
  });

  /**
   * 지구 궤도는 원이 아니라 타원이라, 근일점(1월 초)에서 가장 빠르고
   * 원일점(7월 초)에서 가장 느리다. 중심차를 빼먹은 계산은 이 차이가 0이 된다.
   */
  it("1월이 7월보다 빠르다", () => {
    expect(rateOn("2026-01-03T00:00:00Z")).toBeGreaterThan(rateOn("2026-07-05T00:00:00Z"));
  });

  it("한 회귀년 뒤에 제자리로 온다", () => {
    const jd = toJulianDay(new Date("2026-03-01T00:00:00Z"));
    expect(angleBetween(sunPosition(jd).longitude, sunPosition(jd + 365.2422).longitude)).toBeLessThan(0.02);
  });
});

/**
 * 분점과 지점은 태양 황경이 0·90·180·270이 되는 순간으로 정의된다. 날짜를
 * 어디서 가져오지 않고 우리 계산으로 그 순간을 찾은 뒤, 달력이 아는 범위 안에
 * 떨어지는지만 본다. 세차를 빼먹으면 여기가 며칠씩 밀린다.
 */
describe("분점과 지점", () => {
  const cases: [string, number, string, string, number, number][] = [
    ["춘분", 0, "2026-03-15T00:00:00Z", "2026-03-25T00:00:00Z", 19, 21],
    ["하지", 90, "2026-06-16T00:00:00Z", "2026-06-26T00:00:00Z", 20, 22],
    ["추분", 180, "2026-09-18T00:00:00Z", "2026-09-28T00:00:00Z", 21, 24],
    ["동지", 270, "2026-12-17T00:00:00Z", "2026-12-27T00:00:00Z", 20, 23],
  ];

  for (const [name, target, from, to, lo, hi] of cases) {
    it(`${name}이 달력이 아는 날짜에 떨어진다`, () => {
      const day = sunCrossing(target, from, to).getUTCDate();
      expect(day, `${name}: ${day}일`).toBeGreaterThanOrEqual(lo);
      expect(day, `${name}: ${day}일`).toBeLessThanOrEqual(hi);
    });
  }
});

/**
 * 수성과 금성은 지구보다 안쪽을 돈다. 그래서 하늘에서 태양으로부터 일정 각도
 * 이상 떨어지지 못한다 — 수성 약 28도, 금성 약 47도. 궤도 요소를 잘못 넣으면
 * 이 한계가 곧바로 무너진다.
 */
describe("내행성의 최대이각", () => {
  const maxElongation = (body: "mercury" | "venus", days: number) => {
    const jd0 = toJulianDay(new Date("2026-01-01T00:00:00Z"));
    let max = 0;
    for (let d = 0; d < days; d += 1) {
      const jd = jd0 + d;
      max = Math.max(max, angleBetween(planetPosition(body, jd).longitude, sunPosition(jd).longitude));
    }
    return max;
  };

  it("수성이 태양에서 18~28도 사이까지만 벌어진다", () => {
    const max = maxElongation("mercury", 730);
    expect(max).toBeGreaterThan(18);
    expect(max).toBeLessThan(29);
  });

  it("금성이 태양에서 44~48도 사이까지만 벌어진다", () => {
    const max = maxElongation("venus", 730);
    expect(max).toBeGreaterThan(44);
    expect(max).toBeLessThan(48.5);
  });
});

describe("달", () => {
  const jd0 = toJulianDay(new Date("2026-01-01T00:00:00Z"));

  it("항성월 뒤에 거의 제자리로 온다", () => {
    // 27.321661일. 섭동 때문에 정확히 0이 되지는 않는다.
    expect(angleBetween(moonPosition(jd0).longitude, moonPosition(jd0 + 27.321661).longitude)).toBeLessThan(3);
  });

  it("하루에 11~16도를 움직인다", () => {
    for (let d = 0; d < 60; d += 1) {
      const step = norm360(moonPosition(jd0 + d + 1).longitude - moonPosition(jd0 + d).longitude);
      expect(step, `${d}일째`).toBeGreaterThan(11);
      expect(step, `${d}일째`).toBeLessThan(16);
    }
  });

  it("황도에서 5.4도 넘게 벗어나지 않는다", () => {
    // 백도 경사가 약 5.145도. 이 한계를 넘으면 황위 계산이 틀린 것이다.
    for (let d = 0; d < 400; d += 1) {
      expect(Math.abs(moonPosition(jd0 + d).latitude), `${d}일째`).toBeLessThan(5.4);
    }
  });
});

/**
 * 역행은 이 사이트가 페이지 하나를 통째로 쓰는 주제이고, 10월 시즌의 주력이다.
 * 값이 틀리면 그 페이지 전체가 거짓말이 된다.
 */
describe("수성 역행", () => {
  const periods = mercuryRetrogrades(new Date("2026-01-01T00:00:00Z"), new Date("2029-01-01T00:00:00Z"));

  it("한 해에 세 번 안팎이다", () => {
    const perYear = periods.length / 3;
    expect(perYear).toBeGreaterThanOrEqual(2.6);
    expect(perYear).toBeLessThanOrEqual(3.7);
  });

  it("한 번에 18~26일 이어진다", () => {
    for (const p of periods) {
      const days = (Date.parse(p.end) - Date.parse(p.start)) / 86400000;
      expect(days, p.start).toBeGreaterThan(17);
      expect(days, p.start).toBeLessThan(27);
    }
  });

  it("되짚는 각도가 8~18도다", () => {
    for (const p of periods) {
      expect(p.arc, p.start).toBeGreaterThan(8);
      expect(p.arc, p.start).toBeLessThan(18);
    }
  });

  it("구간 안에서는 황경이 실제로 뒤로 간다", () => {
    for (const p of periods) {
      const mid = (toJulianDay(new Date(p.start)) + toJulianDay(new Date(p.end))) / 2;
      expect(longitudeRate(mid), p.start).toBeLessThan(0);
    }
  });

  it("구간 밖에서는 앞으로 간다", () => {
    for (const p of periods) {
      // 유에서 사흘 떨어지면 확실히 순행이다.
      expect(longitudeRate(toJulianDay(new Date(p.start)) - 3), p.start).toBeGreaterThan(0);
      expect(longitudeRate(toJulianDay(new Date(p.end)) + 3), p.end).toBeGreaterThan(0);
    }
  });

  it("구간끼리 겹치지 않고 시간순이다", () => {
    for (let i = 1; i < periods.length; i += 1) {
      expect(Date.parse(periods[i].start)).toBeGreaterThan(Date.parse(periods[i - 1].end));
    }
  });
});

describe("차트 조립", () => {
  const seoul = { latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9 };
  const base = { date: "1996-06-11", time: "09:30", ...seoul };
  const chart = computeChart(base);

  it("행성 열 개가 나온다", () => {
    expect(chart.placements).toHaveLength(10);
  });

  it("모든 황경이 0~360 안에 있다", () => {
    for (const p of chart.placements) {
      expect(p.longitude, p.planet).toBeGreaterThanOrEqual(0);
      expect(p.longitude, p.planet).toBeLessThan(360);
      expect(p.degree, p.planet).toBeGreaterThanOrEqual(0);
      expect(p.degree, p.planet).toBeLessThan(30);
    }
  });

  /**
   * 상승궁은 지역 항성시로 구한다. 항성시는 하루에 한 바퀴를 조금 넘게 돌므로
   * 4분이면 황도 위에서 약 1도가 지나간다. 이 값이 0이면 시각을 아예 쓰지 않고
   * 있다는 뜻이고, 24시간에 한 바퀴로 계산하면 여기서 미세하게 어긋난다.
   */
  it("태어난 시각 4분 차이가 상승궁을 1도쯤 움직인다", () => {
    const later = computeChart({ ...base, time: "09:34" });
    const drift = angleBetween(chart.ascendant!, later.ascendant!);
    expect(drift).toBeGreaterThan(0.8);
    expect(drift).toBeLessThan(1.4);
  });

  it("하루 뒤 같은 시각의 상승궁은 1도 안쪽으로만 다르다", () => {
    // 항성일은 태양일보다 약 3분 56초 짧다. 같은 시계 시각이면 약 1도 앞선다.
    const tomorrow = computeChart({ ...base, date: "1996-06-12" });
    const drift = angleBetween(chart.ascendant!, tomorrow.ascendant!);
    expect(drift).toBeLessThan(1.6);
  });

  it("홀사인 하우스가 상승궁이 든 별자리에서 시작해 30도씩 간다", () => {
    expect(chart.houseCusps![0]).toBe(Math.floor(chart.ascendant! / 30) * 30);
    chart.houseCusps!.forEach((cusp, i) => {
      expect(cusp).toBe(norm360(chart.houseCusps![0] + i * 30));
    });
  });

  it("동쪽으로 갈수록 상승궁이 앞선다", () => {
    // 같은 시각이라면 동쪽(경도가 큰 곳)의 하늘이 더 돌아 있다.
    const east = computeChart({ ...base, longitude: 129.0 });
    const gap = norm360(east.ascendant! - chart.ascendant!);
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(10);
  });

  /**
   * 이 사이트가 다른 곳과 갈리는 지점이다. 태어난 시각을 모르면 정오로 채워
   * 상승궁을 뽑아 주는 서비스가 많은데, 그렇게 나온 값은 열두 자리 중 하나를
   * 찍은 것과 다르지 않다. 여기서는 아예 내지 않는다.
   */
  it("시각을 모르면 상승궁과 하우스를 내지 않는다", () => {
    const unknown = computeChart({ ...base, time: null });
    expect(unknown.timeUnknown).toBe(true);
    expect(unknown.ascendant).toBeNull();
    expect(unknown.midheaven).toBeNull();
    expect(unknown.houseCusps).toBeNull();
    expect(unknown.placements).toHaveLength(10);
    expect(unknown.placements.every((p) => p.house === null)).toBe(true);
  });

  it("시각을 몰라도 행성 자리는 그대로 나온다", () => {
    const unknown = computeChart({ ...base, time: null });
    for (const p of unknown.placements) {
      expect(p.sign, p.planet).toBeTruthy();
      expect(Number.isFinite(p.longitude), p.planet).toBe(true);
    }
  });
});
