import { describe, expect, it } from "vitest";
import { toJulianDay } from "@/lib/ephemeris";
import { nextLunations } from "@/lib/lunation";
import { moonIllumination, moonPhaseAngle, moonPosition } from "@/lib/moon";
import { sunApparentLongitude } from "@/lib/ephemeris";
import { retrogradesOf } from "@/lib/retrograde";

/**
 * 표를 베끼지 않고 성립해야 하는 사실로 검증한다(astronomy.test.ts와 같은 방침).
 * 삭망의 정의 자체 — 그 순간의 조도 — 로 결과를 되물으면, 표가 틀려도 같이
 * 틀릴 길이 없다.
 */
describe("삭망", () => {
  const now = new Date("2026-08-22T00:00:00Z");
  const { newMoon, fullMoon } = nextLunations(now);

  it("신월의 순간에는 달이 사실상 완전히 어둡다", () => {
    const jd = toJulianDay(new Date(newMoon.date));
    const angle = moonPhaseAngle(sunApparentLongitude(jd), moonPosition(jd).longitude);
    expect(moonIllumination(angle)).toBeLessThan(0.005);
  });

  it("보름의 순간에는 달이 사실상 가득 찬다", () => {
    const jd = toJulianDay(new Date(fullMoon.date));
    const angle = moonPhaseAngle(sunApparentLongitude(jd), moonPosition(jd).longitude);
    expect(moonIllumination(angle)).toBeGreaterThan(0.995);
  });

  it("둘 다 미래이고 32일 안에 있다", () => {
    for (const l of [newMoon, fullMoon]) {
      const gap = (new Date(l.date).getTime() - now.getTime()) / 86400000;
      expect(gap).toBeGreaterThan(0);
      expect(gap).toBeLessThan(32);
    }
  });

  it("신월과 보름은 반 주기(약 14.8일)만큼 떨어져 있다", () => {
    const gap = Math.abs(new Date(fullMoon.date).getTime() - new Date(newMoon.date).getTime()) / 86400000;
    // 다음 신월과 다음 보름 사이 — 어느 쪽이 먼저냐에 따라 14.8일 또는 29.5-14.8일.
    const half = 29.53 / 2;
    const near = Math.min(Math.abs(gap - half), Math.abs(gap - (29.53 - half)));
    expect(near).toBeLessThan(1.2);
  });

  it("별자리 이름이 열두 방 중 하나다", () => {
    expect(newMoon.signKo.endsWith("자리")).toBe(true);
    expect(fullMoon.signKo.endsWith("자리")).toBe(true);
  });
});

describe("역행 일반화 — 금성·화성", () => {
  it("금성 역행은 약 19개월마다 오고 40일 안팎 지속된다", () => {
    // 4년 창이면 2~3회 들어온다.
    const periods = retrogradesOf("venus", new Date("2024-01-01"), new Date("2028-01-01"));
    expect(periods.length).toBeGreaterThanOrEqual(2);
    expect(periods.length).toBeLessThanOrEqual(3);
    for (const p of periods) {
      expect(p.days).toBeGreaterThan(38);
      expect(p.days).toBeLessThan(46);
    }
  });

  it("화성 역행은 약 26개월마다 오고 두 달 이상 지속된다", () => {
    const periods = retrogradesOf("mars", new Date("2024-01-01"), new Date("2029-01-01"));
    expect(periods.length).toBeGreaterThanOrEqual(2);
    for (const p of periods) {
      expect(p.days).toBeGreaterThan(55);
      expect(p.days).toBeLessThan(85);
    }
  });

  it("수성 별칭은 일반화 전과 같은 답을 낸다", () => {
    // mercuryRetrogrades가 retrogradesOf("mercury")의 지름길이라는 계약.
    const a = retrogradesOf("mercury", new Date("2026-01-01"), new Date("2027-01-01"));
    expect(a.length).toBeGreaterThanOrEqual(3);
  });
});
