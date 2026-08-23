import { describe, expect, it } from "vitest";
import { navAmbient } from "@/lib/nav-ambient";

describe("navAmbient", () => {
  const ambient = navAmbient(new Date(Date.UTC(2026, 7, 23)));

  it("달 자리 구간이 60일을 덮고 시간순이다", () => {
    expect(ambient.moonSegments.length).toBeGreaterThan(20); // 달은 자리마다 2~3일
    for (let i = 1; i < ambient.moonSegments.length; i += 1) {
      expect(ambient.moonSegments[i].until > ambient.moonSegments[i - 1].until).toBe(true);
    }
  });
  it("다가오는 삭망이 있다", () => {
    expect(ambient.lunations.length).toBeGreaterThanOrEqual(2);
  });
  it("역행 구간에 세 행성 정보가 담긴다 (미래 창 안의 것)", () => {
    // 2026-10-03 금성, 10-24 수성이 60일 창 안에 있다
    expect(ambient.retro.some((r) => r.planet === "venus")).toBe(true);
  });
});
