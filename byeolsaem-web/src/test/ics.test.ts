import { describe, expect, it } from "vitest";
import { buildIcs } from "@/lib/ics";
import { monthEvents } from "@/lib/calendar-events";

describe("buildIcs", () => {
  const events = monthEvents(2026, 10);
  const ics = buildIcs(events);

  it("VCALENDAR 골격과 CRLF", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
    expect(ics.includes("\n") && !ics.includes("\r\n")).toBe(false);
  });
  it("이벤트 수가 맞고 UID가 전부 다르다", () => {
    const uids = [...ics.matchAll(/^UID:(.+)$/gm)].map((m) => m[1]);
    expect(uids).toHaveLength(events.length);
    expect(new Set(uids).size).toBe(uids.length);
  });
  it("UID는 내용 기반이라 재생성해도 같다 — 구독자 캘린더에 중복이 쌓이면 안 된다", () => {
    expect(buildIcs(events)).toBe(ics);
    // 2026-10 신월은 UTC 10/10 밤 = KST 10/11 새벽이다 (Task 3에서 실측 확정).
    expect(ics).toMatch(/UID:new-moon-20261011@byeolsaem\.com/);
  });
  it("종일 이벤트(KST 날짜)로 나간다", () => {
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20261011/);
  });
});
