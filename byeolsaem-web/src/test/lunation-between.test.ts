import { describe, expect, it } from "vitest";
import { lunationsBetween } from "@/lib/lunation";

describe("lunationsBetween", () => {
  // 2026년 10월(KST) 실측: 신월 10/10, 보름 10/26 근방.
  it("2026년 10월에 신월 하나와 보름 하나를 찾는다", () => {
    const from = new Date(Date.UTC(2026, 9, 1) - 9 * 3600000);
    const to = new Date(Date.UTC(2026, 10, 1) - 9 * 3600000);
    const found = lunationsBetween(from, to);
    const news = found.filter((l) => l.kind === "new");
    const fulls = found.filter((l) => l.kind === "full");
    expect(news).toHaveLength(1);
    expect(fulls).toHaveLength(1);
  });

  it("결과가 시간순이고 전부 범위 안이다", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2026, 6, 1));
    const found = lunationsBetween(from, to);
    // 6개월 ≈ 삭망 각 6번 안팎
    expect(found.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < found.length; i += 1) {
      expect(found[i].date >= found[i - 1].date).toBe(true);
    }
    for (const l of found) {
      expect(Date.parse(l.date)).toBeGreaterThanOrEqual(from.getTime());
      expect(Date.parse(l.date)).toBeLessThan(to.getTime());
    }
  });
});
