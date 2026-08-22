import { describe, expect, it } from "vitest";
import { sunIngresses } from "@/lib/ingress";

/** KST 날짜 문자열로 — 분지점 검증은 한국 날짜 기준이 읽기 쉽다. */
function kstDate(iso: string): string {
  return new Date(Date.parse(iso) + 9 * 3600000).toISOString().slice(0, 10);
}

describe("sunIngresses", () => {
  const YEAR = sunIngresses(new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2027, 0, 1)));

  it("한 해에 정확히 12번", () => {
    expect(YEAR).toHaveLength(12);
  });

  // 2026년 분지점 실측: 춘분 3/20, 하지 6/21, 추분 9/23, 동지 12/22 (KST).
  it.each([
    ["양자리", "2026-03-20"],
    ["게자리", "2026-06-21"],
    ["천칭자리", "2026-09-23"],
    ["염소자리", "2026-12-22"],
  ])("%s 진입이 %s", (signKo, date) => {
    const hit = YEAR.find((i) => i.signKo === signKo);
    expect(hit).toBeDefined();
    expect(kstDate(hit!.date)).toBe(date);
  });

  it("시간순", () => {
    for (let i = 1; i < YEAR.length; i += 1) {
      expect(YEAR[i].date > YEAR[i - 1].date).toBe(true);
    }
  });
});
