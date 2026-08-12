import { ASPECT_MEANINGS, pairTheme } from "@/content/atoms/aspects";
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
  headline: string;
  body: string;
}

export interface TodayBack {
  transits: TodayTransit[];
  /** 트랜짓이 없는 날의 안내. 있으면 목록 대신 이것을 쓴다. */
  quiet: string | null;
  /** 강도순 부적 칩 2~3개. */
  chips: { symbol: string; label: string }[];
}

export function todayBack(sky: TodaySky, natal: Chart): TodayBack {
  const found = findTransits(sky, natal, 4);
  const transits = found.map(describe);

  return {
    transits,
    quiet: transits.length === 0 ? QUIET_DAY : null,
    // 칩은 목록의 앞 세 개를 그대로 쓴다. 따로 고르면 목록과 칩이 서로 다른
    // 이야기를 하게 되고, 어느 쪽이 오늘인지 알 수 없어진다.
    chips: transits.slice(0, 3).map((t) => ({
      symbol: t.moving.symbol,
      label: `${t.moving.ko} ${t.aspectKo} ${t.fixed.ko}`,
    })),
  };
}

function describe(transit: Transit): TodayTransit {
  const moving = PLANET_BY_KEY[transit.transiting];
  const fixed = PLANET_BY_KEY[transit.natal];
  const meaning = ASPECT_MEANINGS[transit.type.key];
  const frame = TRANSIT_FRAMES[transit.transiting];
  const theme = pairTheme(transit.transiting, transit.natal);

  return {
    moving,
    fixed,
    aspectKo: transit.type.ko,
    aspectSymbol: transit.type.symbol,
    orb: transit.orb,
    harmony: transit.type.harmony,
    span: frame?.span ?? "며칠",
    // 제목은 어느 두 힘이 만나는지, 본문은 그 사이가 어떤지와 얼마나 가는지.
    headline: theme ? `${theme} — ${meaning.headline}` : meaning.headline,
    body: `${meaning.body} ${frame?.brings ?? ""}`.trim(),
  };
}
