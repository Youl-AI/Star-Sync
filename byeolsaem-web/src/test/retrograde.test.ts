import { describe, expect, it } from "vitest";
import { sunApparentLongitude, toJulianDay } from "../lib/ephemeris";
import {
  formatZodiacDegree,
  longitudeRate,
  mercuryRetrogrades,
  retrogradeLoop,
  shadowPeriod,
  signAtLongitude,
} from "../lib/retrograde";
import {
  formatKstDate,
  formatKstDateTime,
  kstParts,
  retrogradeStatus,
} from "../lib/retrograde-clock";

const jd = (iso: string) => toJulianDay(new Date(iso));

describe("천문 계산", () => {
  /**
   * 궤도 요소를 잘못 옮겨 적거나 회전 행렬을 틀리면 여기서 걸린다. 분점·지점은
   * 태양의 황경이 정확히 0·90·180·270도가 되는 순간으로 정의되므로, 공개된
   * 시각을 넣었을 때 그 값이 나오지 않으면 지구 쪽 계산이나 세차 보정이 틀린
   * 것이다.
   */
  it("분점과 지점에서 태양의 황경이 제자리에 온다", () => {
    const checks: [string, number][] = [
      ["2026-03-20T14:46:00Z", 0],
      ["2026-06-21T08:24:00Z", 90],
      ["2026-09-23T00:06:00Z", 180],
    ];
    for (const [iso, expected] of checks) {
      const longitude = sunApparentLongitude(jd(iso));
      const offset = ((longitude - expected + 540) % 360) - 180;
      expect(Math.abs(offset), `${iso}: ${longitude}도`).toBeLessThan(0.02);
    }
  });

  it("역행 중에는 겉보기 황경이 줄어든다", () => {
    // 2025년 3월 하순은 공개된 어느 일정표에서도 역행 구간이다.
    expect(longitudeRate(jd("2025-03-25T00:00:00Z"))).toBeLessThan(0);
    // 그 두 달 뒤는 순행. 수성의 순행 속도는 하루 2도 안팎까지 오른다.
    expect(longitudeRate(jd("2025-05-25T00:00:00Z"))).toBeGreaterThan(0);
  });
});

describe("수성 역행 구간", () => {
  const periods = mercuryRetrogrades(
    new Date("2025-01-01T00:00:00Z"),
    new Date("2029-01-01T00:00:00Z"),
  );

  /**
   * 계산이 맞는지 확인하는 가장 강한 근거. 2025년 세 번의 역행은 널리 공개된
   * 값이고, 여기 계산이 그 날짜(한국 시간 기준)와 맞아떨어진다.
   */
  it("2025년 세 구간이 공개된 날짜와 맞는다", () => {
    const found = periods
      .filter((p) => kstParts(p.start).year === 2025)
      .map((p) => `${formatKstDate(p.start)} ~ ${formatKstDate(p.end)}`);
    expect(found).toEqual([
      "2025. 3. 15 ~ 2025. 4. 7",
      "2025. 7. 18 ~ 2025. 8. 11",
      "2025. 11. 10 ~ 2025. 11. 30",
    ]);
  });

  it("해마다 세 번씩 돌아온다", () => {
    for (const year of [2025, 2026, 2027, 2028]) {
      const count = periods.filter((p) => kstParts(p.start).year === year).length;
      expect(count, `${year}년`).toBe(3);
    }
  });

  it("한 구간은 3주 안팎이고 10도 남짓을 되짚는다", () => {
    for (const period of periods) {
      expect(period.days, period.start).toBeGreaterThan(18);
      expect(period.days, period.start).toBeLessThan(26);
      expect(period.arc, period.start).toBeGreaterThan(5);
      expect(period.arc, period.start).toBeLessThan(20);
    }
  });

  it("구간 사이 간격이 수성의 회합 주기(약 116일)에 맞는다", () => {
    for (let i = 1; i < periods.length; i += 1) {
      const gap = (Date.parse(periods[i].start) - Date.parse(periods[i - 1].start)) / 86400000;
      expect(gap, `${periods[i - 1].start} 다음`).toBeGreaterThan(105);
      expect(gap, `${periods[i - 1].start} 다음`).toBeLessThan(130);
    }
  });

  it("경계에 걸친 반쪽 구간은 내놓지 않는다", () => {
    for (const period of periods) {
      expect(Date.parse(period.end)).toBeGreaterThan(Date.parse(period.start));
    }
  });

  it("그림자 기간이 역행 구간을 앞뒤로 감싼다", () => {
    for (const period of periods.slice(0, 4)) {
      const shadow = shadowPeriod(period);
      expect(Date.parse(shadow.start), period.start).toBeLessThan(Date.parse(period.start));
      expect(Date.parse(shadow.end), period.start).toBeGreaterThan(Date.parse(period.end));
      // 전 그림자와 후 그림자는 보통 2~3주씩이다.
      const before = (Date.parse(period.start) - Date.parse(shadow.start)) / 86400000;
      const after = (Date.parse(shadow.end) - Date.parse(period.end)) / 86400000;
      expect(before, period.start).toBeGreaterThan(5);
      expect(before, period.start).toBeLessThan(40);
      expect(after, period.start).toBeGreaterThan(5);
      expect(after, period.start).toBeLessThan(40);
    }
  });

  it("역행 고리는 하루 간격 표본이고 가운데가 역행 구간이다", () => {
    const loop = retrogradeLoop(periods[0], 10);
    expect(loop.length).toBe(Math.floor(periods[0].days) + 21);
    expect(loop[0].retrograde).toBe(false);
    expect(loop[loop.length - 1].retrograde).toBe(false);
    expect(loop.some((s) => s.retrograde)).toBe(true);
    // 고리인 이상 황위가 눈에 띄게 움직여야 한다. 평평하면 고리가 아니라 선이다.
    const latitudes = loop.map((s) => s.latitude);
    expect(Math.max(...latitudes) - Math.min(...latitudes)).toBeGreaterThan(1);
  });
});

describe("지금 역행 중인가", () => {
  const periods = [
    { start: "2026-06-30T00:00:00Z", end: "2026-07-24T00:00:00Z", startLongitude: 116, endLongitude: 106, days: 24, arc: 10 },
    { start: "2026-10-24T00:00:00Z", end: "2026-11-14T00:00:00Z", startLongitude: 230, endLongitude: 215, days: 21, arc: 15 },
  ];

  it("구간 안이면 종료까지 남은 날을 센다", () => {
    const status = retrogradeStatus(periods, new Date("2026-07-14T00:00:00Z"));
    expect(status.state).toBe("retrograde");
    if (status.state !== "retrograde") return;
    expect(status.daysLeft).toBe(10);
    expect(status.period.start).toBe(periods[0].start);
  });

  it("구간 밖이면 다음 역행까지 남은 날을 센다", () => {
    const status = retrogradeStatus(periods, new Date("2026-08-12T00:00:00Z"));
    expect(status.state).toBe("direct");
    if (status.state !== "direct") return;
    expect(status.daysUntil).toBe(73);
    expect(status.next.start).toBe(periods[1].start);
  });

  it("지나간 구간은 건너뛰고 다음 것을 고른다", () => {
    const status = retrogradeStatus(periods, new Date("2026-11-01T00:00:00Z"));
    expect(status.state).toBe("retrograde");
  });

  it("계산해 둔 범위를 지나면 지어내지 않는다", () => {
    expect(retrogradeStatus(periods, new Date("2027-01-01T00:00:00Z")).state).toBe("unknown");
  });
});

describe("표기", () => {
  it("황경을 별자리와 도수로 옮긴다", () => {
    expect(signAtLongitude(0).ko).toBe("양자리");
    expect(signAtLongitude(359.9).ko).toBe("물고기자리");
    expect(formatZodiacDegree(0)).toBe("양자리 0도");
    expect(formatZodiacDegree(125.4)).toBe("사자자리 5도");
    expect(formatZodiacDegree(-5)).toBe("물고기자리 25도");
  });

  it("시각을 한국 시간으로 적는다", () => {
    // UTC로 15:52는 한국에서 그날 자정을 넘긴 다음 날 00:52다.
    expect(formatKstDateTime("2026-02-26T15:52:00Z")).toBe("2026. 2. 27. 00:52");
    expect(formatKstDate("2026-12-31T20:00:00Z")).toBe("2027. 1. 1");
  });
});
