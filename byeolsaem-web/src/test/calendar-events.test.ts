import { describe, expect, it } from "vitest";
import { calendarMonths, monthEvents, retroSpans } from "@/lib/calendar-events";
import { eventDescription, eventTitle } from "@/lib/calendar-copy";
import { kstParts } from "@/lib/retrograde-clock";

describe("monthEvents — 2026년 10월 실측 대조", () => {
  const EVENTS = monthEvents(2026, 10);
  const day = (kind: string) => {
    const hit = EVENTS.find((e) => e.kind === kind);
    return hit ? kstParts(hit.date).day : null;
  };

  it("금성 역행 시작 10/3", () => {
    const hit = EVENTS.find((e) => e.kind === "retro-start" && "planet" in e && e.planet === "venus");
    expect(hit && kstParts(hit.date).day).toBe(3);
  });
  it("신월 10/11 (천칭 — UTC 10/10 밤이 KST로 넘어온다)", () => {
    const hit = EVENTS.find((e) => e.kind === "new-moon");
    expect(hit && kstParts(hit.date).day).toBe(11);
    expect(hit && "signKo" in hit && hit.signKo).toBe("천칭자리");
  });
  it("태양 전갈 진입 10/23", () => expect(day("ingress")).toBe(23));
  it("수성 역행 시작 10/24", () => {
    const hit = EVENTS.find((e) => e.kind === "retro-start" && "planet" in e && e.planet === "mercury");
    expect(hit && kstParts(hit.date).day).toBe(24);
  });
  it("보름 10/26", () => expect(day("full-moon")).toBe(26));
  it("시간순 정렬", () => {
    for (let i = 1; i < EVENTS.length; i += 1) expect(EVENTS[i].date >= EVENTS[i - 1].date).toBe(true);
  });
});

describe("retroSpans", () => {
  it("2026년 11월에 금성·수성 밴드가 걸쳐 있다 (둘 다 11/14 종료)", () => {
    const spans = retroSpans(2026, 11);
    expect(spans.map((s) => s.planet).sort()).toEqual(["mercury", "venus"]);
  });
  it("2026년 9월에는 역행 밴드가 없다", () => {
    expect(retroSpans(2026, 9)).toHaveLength(0);
  });
});

describe("calendarMonths", () => {
  it("이전 1 + 당월 + 이후 10 = 12", () => {
    const months = calendarMonths(new Date(Date.UTC(2026, 7, 23)));
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ year: 2026, month: 7 });
    expect(months[1]).toEqual({ year: 2026, month: 8 });
    expect(months[11]).toEqual({ year: 2027, month: 6 });
  });
  it("연 경계를 넘는다", () => {
    const months = calendarMonths(new Date(Date.UTC(2026, 11, 15)));
    expect(months[11]).toEqual({ year: 2027, month: 10 });
  });
});

describe("문구 계약", () => {
  it("모든 kind의 제목과 해설이 나온다, 해설은 완결 문장", () => {
    for (const ev of monthEvents(2026, 10)) {
      expect(eventTitle(ev).length).toBeGreaterThan(2);
      expect(eventDescription(ev).endsWith("다.")).toBe(true);
    }
  });
});
