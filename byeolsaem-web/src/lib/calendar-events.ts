import { lunationsBetween } from "./lunation";
import { sunIngresses } from "./ingress";
import { retrogradesOf, type RetroPlanet } from "./retrograde";

/**
 * 달력·위클리·ics가 공유하는 이벤트 조립기. 날짜 경계는 전부 KST다 —
 * "10월의 이벤트"는 한국 달력의 10월이어야 한다.
 */
export type CalendarEvent =
  | { kind: "new-moon" | "full-moon"; date: string; signKo: string }
  | { kind: "retro-start" | "retro-end"; date: string; planet: RetroPlanet; planetKo: string }
  | { kind: "ingress"; date: string; signKo: string };

const PLANET_KO: Record<RetroPlanet, string> = { mercury: "수성", venus: "금성", mars: "화성" };
const RETRO_PLANETS: RetroPlanet[] = ["mercury", "venus", "mars"];
const DAY_MS = 86400000;
/** 화성 역행이 78일 — 역행 구간을 놓치지 않는 탐색 여유. */
const RETRO_MARGIN_MS = 120 * DAY_MS;

/** KST 달력의 month(1~12)월이 차지하는 UTC 시간 범위. from 포함, to 제외. */
export function kstMonthRange(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(Date.UTC(year, month - 1, 1) - 9 * 3600000),
    to: new Date(Date.UTC(year, month, 1) - 9 * 3600000),
  };
}

export function eventsBetween(from: Date, to: Date): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const inRange = (iso: string) => {
    const t = Date.parse(iso);
    return t >= from.getTime() && t < to.getTime();
  };

  for (const l of lunationsBetween(from, to)) {
    events.push({ kind: l.kind === "new" ? "new-moon" : "full-moon", date: l.date, signKo: l.signKo });
  }
  for (const planet of RETRO_PLANETS) {
    const periods = retrogradesOf(
      planet,
      new Date(from.getTime() - RETRO_MARGIN_MS),
      new Date(to.getTime() + RETRO_MARGIN_MS),
    );
    for (const p of periods) {
      if (inRange(p.start)) events.push({ kind: "retro-start", date: p.start, planet, planetKo: PLANET_KO[planet] });
      if (inRange(p.end)) events.push({ kind: "retro-end", date: p.end, planet, planetKo: PLANET_KO[planet] });
    }
  }
  for (const ing of sunIngresses(from, to)) {
    events.push({ kind: "ingress", date: ing.date, signKo: ing.signKo });
  }
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

export function monthEvents(year: number, month: number): CalendarEvent[] {
  const { from, to } = kstMonthRange(year, month);
  return eventsBetween(from, to);
}

/** 그 달에 걸쳐 있는 역행 기간 — 그리드의 밴드 렌더용. 잘라내지 않고 원 구간을 준다. */
export function retroSpans(
  year: number,
  month: number,
): { planet: RetroPlanet; planetKo: string; start: string; end: string }[] {
  const { from, to } = kstMonthRange(year, month);
  const out: { planet: RetroPlanet; planetKo: string; start: string; end: string }[] = [];
  for (const planet of RETRO_PLANETS) {
    const periods = retrogradesOf(
      planet,
      new Date(from.getTime() - RETRO_MARGIN_MS),
      new Date(to.getTime() + RETRO_MARGIN_MS),
    );
    for (const p of periods) {
      if (Date.parse(p.start) < to.getTime() && Date.parse(p.end) >= from.getTime()) {
        out.push({ planet, planetKo: PLANET_KO[planet], start: p.start, end: p.end });
      }
    }
  }
  return out;
}

/**
 * 달력이 갖는 월 창 — 이전 1 + 당월 + 이후 10 = 12개월(KST 기준).
 * generateStaticParams·사이트맵·월 내비의 경계가 전부 이 함수를 본다.
 */
export function calendarMonths(now: Date): { year: number; month: number }[] {
  const kst = new Date(now.getTime() + 9 * 3600000);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth(); // 0-based
  const months: { year: number; month: number }[] = [];
  for (let offset = -1; offset <= 10; offset += 1) {
    const d = new Date(Date.UTC(y, m + offset, 1));
    months.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 });
  }
  return months;
}
