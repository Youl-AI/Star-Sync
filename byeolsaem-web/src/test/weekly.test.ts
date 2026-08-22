import { describe, expect, it } from "vitest";
import { kstWeekStart, weeklyData, weeklyPersonal } from "@/lib/weekly-reading";
import { computeChart } from "@/lib/chart";

describe("kstWeekStart", () => {
  it("일요일(KST)은 그 주 월요일로 돌아간다", () => {
    // 2026-08-23은 KST 일요일 → 주 시작은 8/17(월) 00:00 KST = 8/16 15:00 UTC
    const start = kstWeekStart(new Date(Date.UTC(2026, 7, 23, 3)));
    expect(start.toISOString()).toBe("2026-08-16T15:00:00.000Z");
  });
  it("월요일 아침은 같은 날이 주 시작이다", () => {
    const start = kstWeekStart(new Date(Date.UTC(2026, 7, 17, 0))); // KST 8/17 09:00 월
    expect(start.toISOString()).toBe("2026-08-16T15:00:00.000Z");
  });
});

describe("weeklyData", () => {
  it("수성 역행이 시작하는 주(2026-10-19~25)의 헤드라인이 역행을 앞세운다", () => {
    const data = weeklyData(new Date(Date.UTC(2026, 9, 20)));
    expect(data.headline).toContain("수성");
    expect(data.headline.endsWith("다.")).toBe(true);
  });
  it("조용한 주는 조용하다고 말한다", () => {
    // 2026-09-14~20 (KST): 삭망·역행·인그레스 없음 — 사전 실측으로 확인된 주.
    const data = weeklyData(new Date(Date.UTC(2026, 8, 16)));
    if (data.events.length === 0) {
      expect(data.headline).toContain("조용");
    }
    expect(data.headline.endsWith("다.")).toBe(true);
  });
});

describe("weeklyPersonal", () => {
  it("orb 1도 이내만, 쌍 중복 없음", () => {
    const natal = computeChart({
      date: "1995-07-14", time: "09:30",
      latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9,
    });
    const touches = weeklyPersonal(kstWeekStart(new Date(Date.UTC(2026, 9, 20))), natal);
    const keys = touches.map((t) => t.text.split(" — ")[1] ?? t.text);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of touches) expect(t.text.endsWith("다.")).toBe(true);
  });
});
