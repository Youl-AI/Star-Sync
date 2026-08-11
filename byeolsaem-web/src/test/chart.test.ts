import { describe, expect, it } from "vitest";
import { greenwichSiderealTime, planetPosition, sunPosition, toJulianDay } from "@/lib/ephemeris";
import { moonIllumination, moonPhaseAngle, moonPhaseOf, moonPosition } from "@/lib/moon";
import {
  angleBetween,
  ascendantAndMidheaven,
  computeChart,
  findAspects,
  houseOf,
  wholeSignCusps,
  type BirthMoment,
} from "@/lib/chart";

const jd = (iso: string) => toJulianDay(new Date(iso));
const apart = (a: number, b: number) => angleBetween(a, b);

describe("천체 위치 — 공개된 사건과 맞춰 본다", () => {
  /**
   * 2020년 12월 21일의 대합(great conjunction). 목성과 토성이 물병자리 0도
   * 29분에서 0.1도까지 붙었던, 800년 만에 가장 가까웠던 합이다. 두 행성의
   * 궤도 요소나 회전 행렬이 틀렸다면 여기서 바로 드러난다.
   */
  it("2020년 목성-토성 대합이 물병자리 0도에서 일어난다", () => {
    const t = jd("2020-12-21T18:20:00Z");
    const jupiter = planetPosition("jupiter", t).longitude;
    const saturn = planetPosition("saturn", t).longitude;
    expect(apart(jupiter, saturn), `목성 ${jupiter} 토성 ${saturn}`).toBeLessThan(0.4);
    // 물병자리 0도 = 황경 300도
    expect(Math.abs(apart(jupiter, 300.5))).toBeLessThan(0.5);
  });

  /**
   * 2024년 4월 8일 개기일식. 일식은 태양과 달의 황경이 겹치는 순간이므로,
   * 이 시각의 위상각이 0에 가깝지 않으면 달 급수가 틀린 것이다.
   */
  it("2024년 4월 개기일식 때 태양과 달이 겹친다", () => {
    const t = jd("2024-04-08T18:21:00Z");
    const angle = moonPhaseAngle(sunPosition(t).longitude, moonPosition(t).longitude);
    const offset = angle > 180 ? 360 - angle : angle;
    expect(offset, `위상각 ${angle}도`).toBeLessThan(0.3);
  });

  /** 2020년 목성-토성 대합 반년 전에는 둘이 확실히 떨어져 있어야 한다. */
  it("합이 아닌 때는 합으로 판정하지 않는다", () => {
    const t = jd("2020-06-21T00:00:00Z");
    expect(apart(planetPosition("jupiter", t).longitude, planetPosition("saturn", t).longitude))
      .toBeGreaterThan(5);
  });

  /**
   * 명왕성의 물병자리 첫 진입(2023년 3월 하순). 블로그 글이 다루는 사건이라
   * 계산과 본문이 어긋나면 안 된다.
   */
  it("명왕성이 2023년 3월에 물병자리로 들어간다", () => {
    const before = planetPosition("pluto", jd("2023-03-01T00:00:00Z")).longitude;
    const after = planetPosition("pluto", jd("2023-04-15T00:00:00Z")).longitude;
    expect(before, `${before}도`).toBeLessThan(300); // 아직 염소자리
    expect(after, `${after}도`).toBeGreaterThan(300); // 물병자리
  });

  it("그리니치 항성시가 J2000 기준값과 맞는다", () => {
    // 2000-01-01 12:00 UT의 GMST는 280.46061837도로 정의되어 있다.
    expect(greenwichSiderealTime(2451545)).toBeCloseTo(280.46061837, 4);
  });

  it("달은 하루에 약 13도씩 움직인다", () => {
    const t = jd("2026-08-12T00:00:00Z");
    const step = angleBetween(moonPosition(t).longitude, moonPosition(t + 1).longitude);
    expect(step).toBeGreaterThan(11);
    expect(step).toBeLessThan(16);
  });

  it("달의 황위가 ±6도 안에 머문다", () => {
    for (let i = 0; i < 40; i += 1) {
      const latitude = moonPosition(jd("2026-01-01T00:00:00Z") + i * 3).latitude;
      expect(Math.abs(latitude)).toBeLessThan(6);
    }
  });
});

describe("달의 위상", () => {
  it("겹치면 삭, 마주 보면 보름", () => {
    expect(moonPhaseOf(0).ko).toBe("삭");
    expect(moonPhaseOf(180).ko).toBe("보름달");
    expect(moonPhaseOf(90).ko).toBe("상현달");
    expect(moonPhaseOf(270).ko).toBe("하현달");
    expect(moonPhaseOf(359).ko).toBe("삭");
  });

  it("밝은 면의 비율이 위상과 맞는다", () => {
    expect(moonIllumination(0)).toBeCloseTo(0, 5);
    expect(moonIllumination(90)).toBeCloseTo(0.5, 5);
    expect(moonIllumination(180)).toBeCloseTo(1, 5);
  });
});

describe("상승궁과 하우스", () => {
  const seoul = { latitude: 37.5665, longitude: 126.978 };

  it("상승궁은 하루에 열두 자리를 모두 지난다", () => {
    const start = jd("2026-03-21T00:00:00Z");
    const seen = new Set<number>();
    for (let i = 0; i < 288; i += 1) {
      const { ascendant } = ascendantAndMidheaven(start + i / 288, seoul.latitude, seoul.longitude);
      seen.add(Math.floor(ascendant / 30));
    }
    expect(seen.size).toBe(12);
  });

  it("상승궁은 중천보다 앞선 자리에 온다", () => {
    // 북반구에서 상승궁은 늘 중천의 90도에서 180도 사이 뒤에 있다.
    for (let i = 0; i < 24; i += 1) {
      const t = jd("2026-06-15T00:00:00Z") + i / 24;
      const { ascendant, midheaven } = ascendantAndMidheaven(t, seoul.latitude, seoul.longitude);
      const gap = (ascendant - midheaven + 360) % 360;
      expect(gap, `${i}시: 중천 ${midheaven.toFixed(1)} 상승궁 ${ascendant.toFixed(1)}`)
        .toBeGreaterThan(60);
      expect(gap).toBeLessThan(300);
    }
  });

  it("상승궁은 4분에 약 1도씩 움직인다", () => {
    const t = jd("2026-06-15T03:00:00Z");
    const a = ascendantAndMidheaven(t, seoul.latitude, seoul.longitude).ascendant;
    const b = ascendantAndMidheaven(t + 4 / 1440, seoul.latitude, seoul.longitude).ascendant;
    expect(angleBetween(a, b)).toBeGreaterThan(0.3);
    expect(angleBetween(a, b)).toBeLessThan(3);
  });

  it("홀사인 하우스는 상승궁이 든 별자리의 0도에서 시작한다", () => {
    const cusps = wholeSignCusps(139.4); // 사자자리 19도
    expect(cusps[0]).toBe(120);
    expect(cusps[11]).toBe(90);
    expect(cusps).toHaveLength(12);
    expect(houseOf(139.4, cusps)).toBe(1);
    expect(houseOf(155, cusps)).toBe(2);
    expect(houseOf(119.9, cusps)).toBe(12);
  });
});

describe("어스펙트", () => {
  const at = (planet: string, longitude: number) =>
    ({ planet, longitude, sign: null, degree: 0, house: null, retrograde: false }) as never;

  it("정확한 각도에 가까울수록 강하게 잡는다", () => {
    const aspects = findAspects([at("mars", 10), at("saturn", 130.5)]);
    expect(aspects).toHaveLength(1);
    expect(aspects[0].type.key).toBe("trine");
    expect(aspects[0].orb).toBeCloseTo(0.5, 5);
    expect(aspects[0].strength).toBeGreaterThan(0.9);
  });

  it("허용 범위를 넘으면 어스펙트로 세지 않는다", () => {
    expect(findAspects([at("mars", 0), at("saturn", 45)])).toHaveLength(0);
  });

  it("태양과 달이 낀 어스펙트는 오브를 넓게 본다", () => {
    // 사각(90도)의 기본 오브는 7도. 8.5도 벗어난 조합은 행성끼리면 빠지고
    // 태양이 끼면 잡힌다.
    expect(findAspects([at("mars", 0), at("saturn", 98.5)])).toHaveLength(0);
    expect(findAspects([at("sun", 0), at("saturn", 98.5)])).toHaveLength(1);
  });
});

describe("차트 한 벌", () => {
  const moment: BirthMoment = {
    date: "1999-03-21",
    time: "09:30",
    latitude: 37.5665,
    longitude: 126.978,
    timezoneOffsetHours: 9,
  };

  it("열 개의 별이 모두 자리를 갖는다", () => {
    const chart = computeChart(moment);
    expect(chart.placements).toHaveLength(10);
    for (const placement of chart.placements) {
      expect(placement.longitude).toBeGreaterThanOrEqual(0);
      expect(placement.longitude).toBeLessThan(360);
      expect(placement.sign.ko.length).toBeGreaterThan(0);
      expect(placement.degree).toBeGreaterThanOrEqual(0);
      expect(placement.degree).toBeLessThan(30);
      expect(placement.house).toBeGreaterThanOrEqual(1);
      expect(placement.house).toBeLessThanOrEqual(12);
    }
  });

  it("1999년 3월 21일의 태양은 양자리 언저리에 있다", () => {
    const sun = computeChart(moment).placements.find((p) => p.planet === "sun")!;
    expect(["물고기자리", "양자리"]).toContain(sun.sign.ko);
  });

  it("태양과 달은 역행하지 않는다", () => {
    for (const placement of computeChart(moment).placements) {
      if (placement.planet === "sun" || placement.planet === "moon") {
        expect(placement.retrograde).toBe(false);
      }
    }
  });

  /**
   * 시각을 모르면 하우스와 상승궁은 정할 수 없다. 그럴듯한 값을 채워 넣는
   * 대신 비워 두는 것이 이 서비스의 약속이다(/about 참고).
   */
  it("태어난 시각을 모르면 하우스와 상승궁을 비워 둔다", () => {
    const chart = computeChart({ ...moment, time: null });
    expect(chart.timeUnknown).toBe(true);
    expect(chart.ascendant).toBeNull();
    expect(chart.midheaven).toBeNull();
    expect(chart.houseCusps).toBeNull();
    for (const placement of chart.placements) expect(placement.house).toBeNull();
  });

  it("같은 입력이면 항상 같은 결과가 나온다", () => {
    const a = computeChart(moment);
    const b = computeChart(moment);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
