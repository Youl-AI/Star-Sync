import { describe, expect, it } from "vitest";
import { eventsBetween, monthEvents } from "@/lib/calendar-events";
import { moonIngresses } from "@/lib/moon-ingress";
import { weeklyData } from "@/lib/weekly-reading";

/**
 * 달의 자리 이동.
 *
 * 주간 화면이 이것을 세지 않던 동안, 삭망도 역행 전환도 없는 주는 화면에
 * "조용합니다" 한 줄만 남았다(2026-09-05). 달은 어느 주에나 움직이므로 그런
 * 주는 없어야 한다.
 *
 * 동시에 이 값이 달력 그리드와 ics 구독으로 새면 안 된다. 한 달에 열두어 개가
 * 더 실리면 신월·보름·역행이 묻힌다 — 그래서 `eventsBetween`의 옵션이다.
 */
describe("달 인그레스", () => {
  it("한 주에 두세 번 온다", () => {
    // 2026년 9월의 네 주. 달은 하루 12~15도를 걸으므로 이레에 두 번에서 네 번
    // 사이다 — 궤도가 타원이라 근지점 근처에서는 한 번 더 넘는 주가 나온다.
    for (const day of ["2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22"]) {
      const from = new Date(`${day}T00:00:00+09:00`);
      const to = new Date(from.getTime() + 7 * 86400000);
      const count = moonIngresses(from, to).length;
      expect(count, day).toBeGreaterThanOrEqual(2);
      expect(count, day).toBeLessThanOrEqual(4);
    }
  });

  it("달력과 ics에는 실리지 않는다", () => {
    expect(monthEvents(2026, 10).some((e) => e.kind === "moon-ingress")).toBe(false);
    const from = new Date("2026-10-01T00:00:00+09:00");
    const to = new Date("2026-11-01T00:00:00+09:00");
    expect(eventsBetween(from, to).some((e) => e.kind === "moon-ingress")).toBe(false);
    expect(eventsBetween(from, to, { moon: true }).some((e) => e.kind === "moon-ingress")).toBe(true);
  });

  it("사건 없는 주에도 화면에 실을 것이 남는다", () => {
    // 2026-08-31 주는 삭망도 역행 전환도 태양 인그레스도 없다 — 예전에는 여기가 비었다.
    const week = weeklyData(new Date("2026-09-02T12:00:00+09:00"));
    expect(week.events.length).toBeGreaterThan(0);
    expect(week.summary).toContain("달은");
    expect(week.headline).not.toBe("이번 주 하늘은 조용합니다.");
  });
});
