import { describe, expect, it } from "vitest";
import { solarReturnChart, solarReturnInstant } from "@/lib/solar-return";
import { birthJulianDay, type BirthMoment } from "@/lib/chart";
import { norm180, sunApparentLongitude, toJulianDay } from "@/lib/ephemeris";

// EXAMPLE_BIRTH과 같은 사람 — 예시 화면과 테스트가 같은 하늘을 본다.
const NATAL: BirthMoment = {
  date: "1995-07-14",
  time: "09:30",
  latitude: 37.5665,
  longitude: 126.978,
  timezoneOffsetHours: 9,
};

describe("solarReturnInstant", () => {
  it("리턴 순간의 태양 황경이 출생 태양 황경과 일치한다 (±0.01도)", () => {
    const natalSun = sunApparentLongitude(birthJulianDay(NATAL));
    const instant = solarReturnInstant(NATAL, 2026);
    const returnSun = sunApparentLongitude(toJulianDay(instant));
    expect(Math.abs(norm180(returnSun - natalSun))).toBeLessThan(0.01);
  });

  it("리턴은 생일 ±1일 안이다", () => {
    const instant = solarReturnInstant(NATAL, 2026);
    const birthday = Date.UTC(2026, 6, 14);
    expect(Math.abs(instant.getTime() - birthday)).toBeLessThan(2 * 86400000);
  });
});

describe("solarReturnChart", () => {
  it("생일이 지난 시점: 올해 리턴이 현재 차트다", () => {
    const { instant, nextInstant } = solarReturnChart(NATAL, new Date(Date.UTC(2026, 7, 23)));
    expect(instant.getUTCFullYear()).toBe(2026);
    expect(nextInstant.getUTCFullYear()).toBe(2027);
  });
  it("생일 전 시점: 작년 리턴이 아직 유효하다", () => {
    const { instant, nextInstant } = solarReturnChart(NATAL, new Date(Date.UTC(2026, 2, 1)));
    expect(instant.getUTCFullYear()).toBe(2025);
    expect(nextInstant.getUTCFullYear()).toBe(2026);
  });
  it("차트에 상승궁과 하우스가 있다 (출생 시각을 아는 사람)", () => {
    const { chart } = solarReturnChart(NATAL, new Date(Date.UTC(2026, 7, 23)));
    expect(chart.ascendant).not.toBeNull();
    expect(chart.placements.find((p) => p.planet === "sun")?.house).not.toBeNull();
  });
});
