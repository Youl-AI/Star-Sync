import { Link } from "@/components/ui/Link";
import { eventDescription, eventHref, eventTitle } from "@/lib/calendar-copy";
import type { CalendarEvent } from "@/lib/calendar-events";
import { formatKstDateTime, kstParts } from "@/lib/retrograde-clock";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function MonthEventList({ events }: { events: CalendarEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="mt-10 break-keep text-guide text-starlight-dim">
        이 달은 큰 사건 없이 조용히 지나갑니다. 이런 달도 있습니다.
      </p>
    );
  }
  return (
    <div className="mt-12">
      <h2 className="mb-2 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        이 달의 하늘
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>
      <ul>
        {events.map((ev) => {
          const p = kstParts(ev.date);
          const dow = DOW[new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay()];
          const href = eventHref(ev);
          return (
            <li key={ev.kind + ev.date} className="flex gap-5 border-b border-gold/10 py-4 last:border-b-0">
              <span className="w-24 flex-none pt-0.5 text-sm text-gold-soft">
                {p.month}월 {p.day}일 ({dow})
              </span>
              <div>
                <p className="font-display text-lg text-starlight">{eventTitle(ev)}</p>
                <p className="mt-1 max-w-[46ch] break-keep text-guide text-starlight-dim">
                  {formatKstDateTime(ev.date)}. {eventDescription(ev)}
                  {href && (
                    <>
                      {" "}
                      <Link href={href} className="border-b border-gold/40 pb-px text-gold-soft transition-colors hover:text-starlight">
                        자세히 →
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
