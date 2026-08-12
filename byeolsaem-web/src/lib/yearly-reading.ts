import { ASPECT_MEANINGS, pairTheme } from "@/content/atoms/aspects";
import {
  EMPTY_HALF,
  EXACT_COUNT_LINES,
  JUPITER_YEAR,
  QUIET_YEAR,
  SATURN_YEAR,
  YEAR_FRAMES,
} from "@/content/atoms/yearly";
import type { Chart } from "./chart";
import { PLANET_BY_KEY, type Planet, type PlanetKey } from "./planets";
import { formatZodiacDegree } from "./retrograde";
import type { RetrogradePeriod } from "./retrograde-clock";
import {
  findYearEvents,
  signSpans,
  yearRetrogrades,
  type SignSpan,
  type YearDate,
  type YearEvent,
} from "./yearly";

/**
 * 한 해의 카드를 조립한다.
 *
 * 앞면(`yearBackdrop`)은 개인 정보가 없어도 만들 수 있다 — 목성과 토성이 올해
 * 어느 자리에 있는지, 수성이 언제 역행하는지는 모두에게 같기 때문이다. 그래서
 * 이 부분은 빌드할 때 미리 계산해 HTML에 넣는다.
 *
 * 뒷면(`yearReading`)은 출생 차트가 있어야 나오고 브라우저에서 계산한다.
 *
 * 조립은 결정론이다. 같은 해 같은 차트면 몇 번을 열어도 같은 글이 나온다.
 */

export interface BackdropSpan {
  signKo: string;
  /** 그 자리에 들어선 날. 해가 시작될 때 이미 있었으면 null. */
  from: YearDate | null;
  text: string;
}

export interface BackdropRetrograde {
  /** "9월 17일 - 10월 9일" */
  range: string;
  startIso: string;
  endIso: string;
  days: number;
  /** "처녀자리 15도에서 사자자리 2도까지" */
  arc: string;
}

export interface YearBackdrop {
  year: number;
  jupiter: BackdropSpan[];
  saturn: BackdropSpan[];
  retrogrades: BackdropRetrograde[];
}

/** "3월 14일" */
export function formatYearDate(date: YearDate): string {
  return `${date.month}월 ${date.day}일`;
}

function backdropSpans(spans: SignSpan[], table: Record<string, string>): BackdropSpan[] {
  return spans.map((span) => ({
    signKo: span.sign.ko,
    from: span.from,
    text: table[span.sign.key] ?? "",
  }));
}

function kstMonthDay(iso: string): { month: number; day: number } {
  const kst = new Date(new Date(iso).getTime() + 9 * 3600_000);
  return { month: kst.getUTCMonth() + 1, day: kst.getUTCDate() };
}

function describeRetrograde(period: RetrogradePeriod): BackdropRetrograde {
  const from = kstMonthDay(period.start);
  const to = kstMonthDay(period.end);
  return {
    range: `${from.month}월 ${from.day}일 - ${to.month}월 ${to.day}일`,
    startIso: period.start,
    endIso: period.end,
    days: Math.round(period.days),
    arc: `${formatZodiacDegree(period.startLongitude)}에서 ${formatZodiacDegree(period.endLongitude)}까지`,
  };
}

export function yearBackdrop(year: number): YearBackdrop {
  return {
    year,
    jupiter: backdropSpans(signSpans("jupiter", year), JUPITER_YEAR),
    saturn: backdropSpans(signSpans("saturn", year), SATURN_YEAR),
    retrogrades: yearRetrogrades(year).map(describeRetrograde),
  };
}

export interface YearReadingEvent {
  /** 강물의 노드에서 이 항목으로 데려갈 때 쓰는 DOM id. */
  id: string;
  moving: Planet;
  fixed: Planet;
  aspectKo: string;
  aspectSymbol: string;
  /** 힘이 흐르는 각도인가, 마찰이 있는 각도인가. 0은 겹침. */
  harmony: number;
  exact: YearDate[];
  /** "3월 14일 · 7월 2일 · 11월 30일" */
  dateLine: string;
  countLine: string;
  span: string;
  headline: string;
  body: string;
}

export interface YearHalf {
  label: string;
  events: YearReadingEvent[];
  /** 사건이 없는 반년의 한 줄. */
  empty: string | null;
}

export interface YearReading {
  events: YearReadingEvent[];
  halves: [YearHalf, YearHalf];
  /** 올해 아무것도 걸리지 않은 경우의 안내. 있으면 목록 대신 이것을 쓴다. */
  quiet: string | null;
  chips: { symbol: string; label: string }[];
}

export function eventDomId(event: YearEvent): string {
  return `year-${event.transiting}-${event.natal}-${event.type.key}`;
}

/** 느릴수록 큰 값. 부적 칩은 오래 가는 것부터 고른다. */
const SLOWNESS: PlanetKey[] = ["jupiter", "saturn", "uranus", "neptune", "pluto"];

function describe(event: YearEvent): YearReadingEvent {
  const moving = PLANET_BY_KEY[event.transiting];
  const fixed = PLANET_BY_KEY[event.natal];
  const meaning = ASPECT_MEANINGS[event.type.key];
  const frame = YEAR_FRAMES[event.transiting];
  const theme = pairTheme(event.transiting, event.natal);

  return {
    id: eventDomId(event),
    moving,
    fixed,
    aspectKo: event.type.ko,
    aspectSymbol: event.type.symbol,
    harmony: event.type.harmony,
    exact: event.exact,
    dateLine: event.exact.map(formatYearDate).join(" · "),
    countLine: EXACT_COUNT_LINES[event.exact.length] ?? EXACT_COUNT_LINES[3],
    span: frame?.span ?? "그 무렵",
    headline: theme ? `${theme} — ${meaning.headline}` : meaning.headline,
    body: `${meaning.body} ${frame?.brings ?? ""}`.trim(),
  };
}

export function yearReading(natal: Chart, year: number): YearReading {
  const found = findYearEvents(natal, year);
  const events = found.map(describe);

  const first = events.filter((e) => e.exact[0].at < 0.5);
  const second = events.filter((e) => e.exact[0].at >= 0.5);

  // 칩은 가장 오래 가는 셋이다. 날짜순으로 앞의 셋을 쓰면 1월에 몰린 해에는
  // 한 해 전체가 1월처럼 보인다.
  const chips = [...events]
    .sort(
      (a, b) =>
        SLOWNESS.indexOf(b.moving.key) - SLOWNESS.indexOf(a.moving.key) ||
        a.exact[0].at - b.exact[0].at,
    )
    .slice(0, 3)
    .map((e) => ({
      symbol: e.moving.symbol,
      label: `${e.moving.ko} ${e.aspectKo} 내 ${e.fixed.ko}`,
    }));

  return {
    events,
    halves: [
      { label: "상반기", events: first, empty: first.length ? null : EMPTY_HALF },
      { label: "하반기", events: second, empty: second.length ? null : EMPTY_HALF },
    ],
    quiet: events.length === 0 ? QUIET_YEAR : null,
    chips,
  };
}
