import { monthEvents, retroSpans } from "@/lib/calendar-events";
import { CalMonthNav } from "./CalMonthNav";
import { MonthEventList } from "./MonthEventList";
import { MonthGrid } from "./MonthGrid";

export function MonthSection({
  year,
  month,
  prevHref,
  nextHref,
  headingAs = "h1",
}: {
  year: number;
  month: number;
  prevHref: string | null;
  nextHref: string | null;
  headingAs?: "h1" | "h2";
}) {
  const events = monthEvents(year, month);
  const spans = retroSpans(year, month);
  return (
    <section style={{ viewTransitionName: "calendar-grid" }}>
      <CalMonthNav label={`${year}년 ${month}월`} prevHref={prevHref} nextHref={nextHref} as={headingAs} />
      <div className="flex flex-wrap gap-x-5 gap-y-1 pt-3 text-meta text-starlight-dim">
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-gold" /> 신월</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full border border-gold" /> 보름</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 bg-[#8ca5cd]/85" /> 수성 역행</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 bg-[#c98f8f]/85" /> 금성 역행</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-3.5 bg-[#cd8f6a]/85" /> 화성 역행</span>
      </div>
      <MonthGrid year={year} month={month} events={events} spans={spans} />
      <MonthEventList events={events} />
    </section>
  );
}
