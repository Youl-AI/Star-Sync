import { kstParts } from "@/lib/retrograde-clock";
import { eventTitle } from "@/lib/calendar-copy";
import type { CalendarEvent } from "@/lib/calendar-events";
import type { retroSpans } from "@/lib/calendar-events";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const BAND_COLOR: Record<string, string> = {
  mercury: "bg-[#8ca5cd]/85",
  venus: "bg-[#c98f8f]/85",
  mars: "bg-[#cd8f6a]/85",
};
/** 밴드가 겹치는 달(2026-10처럼)을 위해 행성마다 높이 자리를 나눈다. */
const BAND_OFFSET: Record<string, string> = { mercury: "bottom-0.5", venus: "bottom-2", mars: "bottom-3.5" };

export function MonthGrid({
  year,
  month,
  events,
  spans,
}: {
  year: number;
  month: number;
  events: CalendarEvent[];
  spans: ReturnType<typeof retroSpans>;
}) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  const byDay = new Map<number, CalendarEvent[]>();
  for (const ev of events) {
    const p = kstParts(ev.date);
    if (p.month !== month) continue;
    (byDay.get(p.day) ?? byDay.set(p.day, []).get(p.day)!).push(ev);
  }

  /** 이 날짜에 걸친 역행 행성들. 날짜는 KST 달력일로 비교한다. */
  const bandsFor = (day: number) =>
    spans.filter((s) => {
      const start = kstParts(s.start);
      const end = kstParts(s.end);
      const startsBefore =
        start.year < year || (start.year === year && (start.month < month || (start.month === month && start.day <= day)));
      const endsAfter =
        end.year > year || (end.year === year && (end.month > month || (end.month === month && end.day >= day)));
      return startsBefore && endsAfter;
    });

  return (
    <div
      role="table"
      aria-label={`${year}년 ${month}월 하늘의 달력`}
      className="mt-6 grid grid-cols-7 border-l border-t border-gold/10"
    >
      {DOW.map((d) => (
        <div key={d} className="border-b border-r border-gold/10 py-2 text-center text-meta tracking-[0.15em] text-starlight-dim">
          {d}
        </div>
      ))}
      {Array.from({ length: firstDow }, (_, i) => (
        <div key={`blank-${i}`} className="min-h-16 border-b border-r border-gold/10 bg-white/[0.015] sm:min-h-[4.6rem]" />
      ))}
      {Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayEvents = byDay.get(day) ?? [];
        const moon = dayEvents.find((e) => e.kind === "new-moon" || e.kind === "full-moon");
        return (
          <div key={day} className="relative min-h-16 border-b border-r border-gold/10 px-1.5 py-1 sm:min-h-[4.6rem]">
            <span className={`text-sm ${dayEvents.length > 0 ? "text-starlight" : "text-starlight-dim"}`}>{day}</span>
            {moon && (
              <span
                aria-hidden
                className={`absolute right-1.5 top-1.5 size-1.5 rounded-full ${
                  moon.kind === "new-moon" ? "bg-gold" : "border border-gold"
                }`}
              />
            )}
            {dayEvents.map((ev) => (
              <span key={ev.kind + ev.date} className="mt-0.5 hidden break-keep text-[0.68rem] leading-tight text-starlight sm:block">
                {eventTitle(ev)}
              </span>
            ))}
            {bandsFor(day).map((s) => (
              <span
                key={s.planet}
                aria-hidden
                className={`absolute inset-x-0 h-0.5 ${BAND_COLOR[s.planet]} ${BAND_OFFSET[s.planet]}`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
