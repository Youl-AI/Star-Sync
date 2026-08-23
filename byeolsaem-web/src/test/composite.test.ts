import { describe, expect, it } from "vitest";
import { arcMidpoint, compositeChart } from "@/lib/composite";
import { computeChart } from "@/lib/chart";
import { angleBetween } from "@/lib/chart";

const MINE = computeChart({
  date: "1995-07-14", time: "09:30",
  latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9,
});
const THEIRS = computeChart({
  date: "1997-04-19", time: "20:10",
  latitude: 35.1796, longitude: 129.0756, timezoneOffsetHours: 9,
});

describe("arcMidpoint", () => {
  it("짧은 호의 중간이다", () => {
    expect(arcMidpoint(10, 30)).toBeCloseTo(20, 6);
    // 350°와 10° 사이의 짧은 호는 0°를 지난다 — 산술 평균(180)이 아니라 0.
    expect(arcMidpoint(350, 10)).toBeCloseTo(0, 6);
    expect(arcMidpoint(10, 350)).toBeCloseTo(0, 6);
  });
  it("중간점은 항상 두 점 어느 쪽에서도 반호 이내다 (속성)", () => {
    for (let i = 0; i < 50; i += 1) {
      const a = (i * 71.3) % 360;
      const b = (i * 137.7 + 40) % 360;
      const mid = arcMidpoint(a, b);
      expect(angleBetween(a, mid)).toBeLessThanOrEqual(90.0001);
      expect(angleBetween(b, mid)).toBeLessThanOrEqual(90.0001);
    }
  });
  it("정확한 대립(180°)은 작은 황경 쪽 + 90°로 결정론", () => {
    expect(arcMidpoint(10, 190)).toBeCloseTo(100, 6);
    expect(arcMidpoint(190, 10)).toBeCloseTo(100, 6);
    expect(arcMidpoint(0, 180)).toBeCloseTo(90, 6);
  });
});

describe("compositeChart", () => {
  const composite = compositeChart(MINE, THEIRS);

  it("행성 10개, house 전부 null, retrograde 전부 false", () => {
    expect(composite.placements).toHaveLength(10);
    expect(composite.placements.every((p) => p.house === null)).toBe(true);
    expect(composite.placements.every((p) => p.retrograde === false)).toBe(true);
  });
  it("각 행성의 황경이 두 차트 그 행성의 중간점이다", () => {
    for (const p of composite.placements) {
      const a = MINE.placements.find((x) => x.planet === p.planet)!.longitude;
      const b = THEIRS.placements.find((x) => x.planet === p.planet)!.longitude;
      expect(p.longitude).toBeCloseTo(arcMidpoint(a, b), 6);
    }
  });
  it("둘 다 시각을 알면 상승궁도 중간점이다", () => {
    expect(composite.ascendant).not.toBeNull();
    expect(composite.ascendant).toBeCloseTo(arcMidpoint(MINE.ascendant!, THEIRS.ascendant!), 6);
  });
  it("한쪽이라도 시각을 모르면 상승궁은 null — 지어내지 않는다", () => {
    const noTime = computeChart({
      date: "1997-04-19", time: null,
      latitude: 35.1796, longitude: 129.0756, timezoneOffsetHours: 9,
    });
    expect(compositeChart(MINE, noTime).ascendant).toBeNull();
  });
  it("sign·degree가 중간점 황경과 일치한다", () => {
    for (const p of composite.placements) {
      expect(p.longitude >= 0 && p.longitude < 360).toBe(true);
      expect(p.degree).toBe(Math.floor(p.longitude % 30));
    }
  });
});
