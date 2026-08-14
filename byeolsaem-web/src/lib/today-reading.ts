import { ASPECT_MEANINGS, pairTheme } from "@/content/atoms/aspects";
import { lensFor, type ConcernLens } from "@/content/atoms/concerns";
import {
  fillLife,
  HOUSE_AREAS,
  PLANET_AREAS,
  toneOf,
  TRANSIT_ADVICE,
  TRANSIT_LIFE,
} from "@/content/atoms/life";
import { MOON_PHASE_LINES, QUIET_DAY, TRANSIT_FRAMES } from "@/content/atoms/today";
import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import type { Chart } from "./chart";
import { PLANET_BY_KEY, type Planet } from "./planets";
import { findTransits, type TodaySky, type Transit } from "./today";

/**
 * 오늘의 카드를 조립한다.
 *
 * 앞면은 개인 정보가 없어도 만들 수 있다 — 달의 위상은 누가 보든 같기 때문이다.
 * 뒷면은 출생 차트가 있어야 나온다. 그래서 두 면을 따로 만든다.
 *
 * 뒷면의 조립 순서는 B안(2026-08-14 승인)이다: 오늘의 한 줄 → 관심사에 걸린
 * 것 → 나머지. 본문은 생활 언어(content/atoms/life.ts)로 말하고 별 이야기는
 * 근거 줄로 내린다.
 *
 * 조립은 결정론이다. 같은 날 같은 차트면 몇 번을 열어도 같은 글이 나온다.
 */

export interface TodayFront {
  /** "10월 3일 금요일" */
  dateLine: string;
  phaseTitle: string;
  phaseName: string;
  /** 밝게 보이는 면, 백분율. */
  illumination: number;
  moonSign: string;
  /** 카드의 라틴 표기용. "LEO SUN"에서 자리 이름만 떼어 쓴다. */
  moonSignLatin: string;
  phaseLine: string;
  /** 달이 지금 그 자리에서 어떻게 구는지. 출생 차트의 '달 × 별자리'와 같은 문장이다. */
  moonInSign: string;
}

export function todayFront(sky: TodaySky): TodayFront {
  const phase = MOON_PHASE_LINES[sky.moon.phase.key];
  return {
    dateLine: `${sky.date.month}월 ${sky.date.day}일 ${sky.date.weekday}요일`,
    phaseTitle: phase.title,
    phaseName: sky.moon.phase.ko,
    illumination: Math.round(sky.moon.illumination * 100),
    moonSign: sky.moon.sign.ko,
    moonSignLatin: sky.moon.sign.latin.replace(/ SUN$/, ""),
    phaseLine: phase.line,
    moonInSign: PLANET_IN_SIGN.moon[sky.moon.sign.key] ?? "",
  };
}

export interface TodayTransit {
  moving: Planet;
  fixed: Planet;
  aspectKo: string;
  aspectSymbol: string;
  /** 정확한 각도에서 벗어난 정도. */
  orb: number;
  /** 힘이 흐르는 각도인가, 마찰이 있는 각도인가. 0은 겹침. */
  harmony: number;
  span: string;
  /** 건드려지는 자리의 생활 이름 — "돈이 드나드는 자리". */
  area: string;
  /** 생활 언어 본문. 결론부터 말한다. */
  life: string;
  /** 별 이야기 근거 줄 — "자기 자신과 스스로에게 거는 제약 — 서로 밀어냅니다". */
  basis: string;
  /** 고른 관심사에 걸리는가. */
  inLens: boolean;
}

export interface TodayBack {
  /** 오늘의 한 줄 — 가장 앞에 세우는 항목의 첫 문장. 트랜짓이 없으면 null. */
  headline: string | null;
  /** 관심사에 걸린 것. 관심사가 없으면 빈 배열. */
  lensTransits: TodayTransit[];
  /** 나머지. */
  otherTransits: TodayTransit[];
  lensLabel: string | null;
  /** 해 볼 것 / 미룰 것 — 맨 앞 항목의 별에서 꺼낸다. */
  advice: { try: string; hold: string } | null;
  /** 트랜짓이 없는 날의 안내. 있으면 목록 대신 이것을 쓴다. */
  quiet: string | null;
  /** 강도순 부적 칩 2~3개. */
  chips: { symbol: string; label: string }[];
}

export function todayBack(sky: TodaySky, natal: Chart, concern?: string | null): TodayBack {
  const lens = concern ? (lensFor(concern) ?? null) : null;
  const found = findTransits(sky, natal, 4);
  const transits = found.map((transit) => describe(transit, natal, lens));

  const lensTransits = transits.filter((t) => t.inLens);
  const otherTransits = transits.filter((t) => !t.inLens);
  // 한 줄과 조언은 같은 항목에서 나온다 — 관심사에 걸린 것이 있으면 그쪽이 오늘의
  // 머리가 되고, 없으면 가장 정확한 각도가 맡는다.
  const top = lensTransits[0] ?? transits[0] ?? null;

  return {
    headline: top ? firstSentence(top.life) : null,
    lensTransits,
    otherTransits,
    lensLabel: lens?.label ?? null,
    advice: top ? TRANSIT_ADVICE[top.moving.key] : null,
    quiet: transits.length === 0 ? QUIET_DAY : null,
    // 칩은 목록의 앞 세 개를 그대로 쓴다. 따로 고르면 목록과 칩이 서로 다른
    // 이야기를 하게 되고, 어느 쪽이 오늘인지 알 수 없어진다.
    chips: transits.slice(0, 3).map((t) => ({
      symbol: t.moving.symbol,
      label: `${t.moving.ko} ${t.aspectKo} ${t.fixed.ko}`,
    })),
  };
}

function firstSentence(text: string): string {
  const end = text.indexOf("다.");
  return end === -1 ? text : text.slice(0, end + 2);
}

/** 건드려지는 자리의 생활 이름. 하우스를 알면 하우스가, 모르면 별의 자리가 말한다. */
function areaOf(natal: Chart, planet: Planet["key"]): string {
  const placement = natal.placements.find((p) => p.planet === planet);
  if (placement?.house != null) return HOUSE_AREAS[placement.house];
  return PLANET_AREAS[planet];
}

/**
 * 하우스를 알면 하우스로만 판정한다. 본문이 "돈이 드나드는 자리"처럼 하우스의
 * 생활 이름으로 말하는 이상, 행성 목록으로 걸린 항목(예: 7하우스의 토성)이
 * 재물운 배지 아래 서면 글과 배지가 서로 다른 이야기를 한다 — 실측에서 발견.
 * 시각을 몰라 하우스가 없을 때만 행성 목록이 대신 판정한다.
 */
function matchesLens(natal: Chart, planet: Planet["key"], lens: ConcernLens): boolean {
  const placement = natal.placements.find((p) => p.planet === planet);
  if (placement?.house != null) return lens.houses.includes(placement.house);
  return lens.planets.includes(planet);
}

function describe(transit: Transit, natal: Chart, lens: ConcernLens | null): TodayTransit {
  const moving = PLANET_BY_KEY[transit.transiting];
  const fixed = PLANET_BY_KEY[transit.natal];
  const meaning = ASPECT_MEANINGS[transit.type.key];
  const frame = TRANSIT_FRAMES[transit.transiting];
  const theme = pairTheme(transit.transiting, transit.natal);
  const span = frame?.span ?? "며칠";
  const area = areaOf(natal, transit.natal);

  return {
    moving,
    fixed,
    aspectKo: transit.type.ko,
    aspectSymbol: transit.type.symbol,
    orb: transit.orb,
    harmony: transit.type.harmony,
    span,
    area,
    life: fillLife(TRANSIT_LIFE[toneOf(transit.type.harmony)][transit.transiting], area, span),
    basis: theme ? `${theme} — ${meaning.headline}` : meaning.headline,
    inLens: lens ? matchesLens(natal, transit.natal, lens) : false,
  };
}
