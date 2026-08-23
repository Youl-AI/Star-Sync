import { describe, expect, it } from "vitest";
import { monthTable } from "@/lib/ephemeris-table";

describe("monthTable", () => {
  it("행 수 = 그 달의 일수, 셀 수 = 10", () => {
    const oct = monthTable(2026, 10);
    expect(oct).toHaveLength(31);
    expect(monthTable(2026, 9)).toHaveLength(30);
    expect(oct[0].cells).toHaveLength(10);
    expect(oct[0].date).toBe("2026-10-01");
  });
  it("추분 다음날 태양은 천칭 0~1도다", () => {
    const row = monthTable(2026, 9).find((r) => r.date === "2026-09-24")!;
    const sun = row.cells.find((c) => c.planet === "sun")!;
    expect(sun.signKo).toBe("천칭자리");
    expect(sun.degree).toBeLessThanOrEqual(1);
  });
  it("수성 역행 중(2026-10-30)엔 수성 ℞, 순행 중(2026-10-01)엔 아님", () => {
    const on = monthTable(2026, 10).find((r) => r.date === "2026-10-30")!;
    expect(on.cells.find((c) => c.planet === "mercury")!.retrograde).toBe(true);
    const off = monthTable(2026, 10).find((r) => r.date === "2026-10-01")!;
    expect(off.cells.find((c) => c.planet === "mercury")!.retrograde).toBe(false);
  });
  it("태양·달은 역행하지 않는다", () => {
    for (const row of monthTable(2026, 10)) {
      expect(row.cells.find((c) => c.planet === "sun")!.retrograde).toBe(false);
      expect(row.cells.find((c) => c.planet === "moon")!.retrograde).toBe(false);
    }
  });
  it("도·분이 범위 안이다", () => {
    for (const c of monthTable(2026, 10)[14].cells) {
      expect(c.degree).toBeGreaterThanOrEqual(0);
      expect(c.degree).toBeLessThanOrEqual(29);
      expect(c.minute).toBeGreaterThanOrEqual(0);
      expect(c.minute).toBeLessThanOrEqual(59);
    }
  });
});
