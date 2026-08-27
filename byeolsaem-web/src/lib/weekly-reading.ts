import { TRANSIT_FRAME, TRANSIT_SELF, TRANSIT_SKY } from "@/content/atoms/transits";
import { eventsBetween, type CalendarEvent } from "./calendar-events";
import { eventTitle } from "./calendar-copy";
import { ASPECT_TYPES, angleBetween, longitudeOf, type Chart } from "./chart";
import { toJulianDay } from "./ephemeris";
import { PLANETS } from "./planets";
import { kstParts } from "./retrograde-clock";

/**
 * 이번 주 하늘 — /today(하루)와 /yearly(일 년) 사이의 시간 축.
 * 주는 한국 달력의 월요일 00:00에 시작한다.
 */
const DAY_MS = 86400000;
const KST_MS = 9 * 3600000;
const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function kstWeekStart(now: Date): Date {
  const kst = new Date(now.getTime() + KST_MS);
  const dow = (kst.getUTCDay() + 6) % 7; // 월=0
  return new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - dow) - KST_MS);
}

export interface WeeklyData {
  /** 주 시작(월요일 00:00 KST)의 UTC ISO */
  weekStart: string;
  events: CalendarEvent[];
  headline: string;
  summary: string;
}

/** 헤드라인이 앞세우는 순서 — 역행이 삭망보다, 삭망이 인그레스보다 크다. */
const PRIORITY: CalendarEvent["kind"][] = ["retro-start", "retro-end", "new-moon", "full-moon", "ingress"];

function headlineOf(ev: CalendarEvent): string {
  switch (ev.kind) {
    case "retro-start": return `${ev.planetKo}이 걸음을 되짚기 시작하는 주입니다.`;
    case "retro-end": return `${ev.planetKo}이 다시 앞으로 걷기 시작하는 주입니다.`;
    case "new-moon": return `${ev.signKo} 신월에서 새로 시작하는 주입니다.`;
    case "full-moon": return `${ev.signKo} 보름이 한가운데 놓인 주입니다.`;
    case "ingress": return `태양이 ${ev.signKo}로 들어서는 주입니다.`;
  }
}

/** 요약문에 끼워 넣는 명사형 이름. 다섯 kind 모두 받침으로 끝나 "이 있습니다"와 항상 맞물린다. */
function summaryName(ev: CalendarEvent): string {
  return ev.kind === "ingress" ? `태양의 ${ev.signKo} 진입` : eventTitle(ev);
}

export function weeklyData(now: Date): WeeklyData {
  const start = kstWeekStart(now);
  const end = new Date(start.getTime() + 7 * DAY_MS);
  const events = eventsBetween(start, end);

  if (events.length === 0) {
    return {
      weekStart: start.toISOString(),
      events,
      headline: "이번 주 하늘은 조용합니다.",
      summary: "큰 이동 없이 지나가는 주입니다. 벌여 둔 것을 마저 하기 좋은 시간입니다.",
    };
  }
  const top = [...events].sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind))[0];
  const rest = events.filter((e) => e !== top);
  const summary =
    rest.length === 0
      ? "이 주의 하늘은 이 사건 하나로 요약됩니다."
      : `그 밖에 ${rest.map((e) => `${kstParts(e.date).day}일 ${summaryName(e)}`).join(", ")}이 있습니다.`;
  return { weekStart: start.toISOString(), events, headline: headlineOf(top), summary };
}

export interface WeeklyTouch {
  /** 그 날 정오 KST의 UTC ISO */
  date: string;
  dowKo: string;
  text: string;
  /** 별길 그림의 짧은 라벨 — "금성–화성 육분" 꼴로 조립한다. */
  movingKo: string;
  fixedKo: string;
  aspectKo: string;
  /** 펼치면 나오는 풀이 — 트랜싯 아톰 세 조각을 이어 붙인다. */
  detail: string;
}

/**
 * 이번 주 내 차트에 닿는 각도 — 일곱 날의 정오 하늘을 natal과 겹쳐 본다.
 * orb 1도 이내만 싣고, 같은 (움직이는 별, 내 별, 각) 쌍은 orb가 가장 작은 날
 * 하나만 남긴다. 트랜싯 어휘는 /today 뒷면과 같은 결이다.
 */
export function weeklyPersonal(weekStart: Date, natal: Chart): WeeklyTouch[] {
  const best = new Map<string, { orb: number; touch: WeeklyTouch }>();
  const planetKo = new Map(PLANETS.map((p) => [p.key, p.ko]));

  for (let day = 0; day < 7; day += 1) {
    const at = new Date(weekStart.getTime() + day * DAY_MS + (12 - 9) * 3600000); // 정오 KST
    const jd = toJulianDay(at);
    const dowKo = DOW_KO[new Date(at.getTime() + 9 * 3600000).getUTCDay()];
    for (const moving of PLANETS) {
      const movingLon = longitudeOf(moving.key, jd);
      for (const fixed of natal.placements) {
        for (const type of ASPECT_TYPES) {
          const orb = Math.abs(angleBetween(movingLon, fixed.longitude) - type.angle);
          if (orb > 1) continue;
          const key = `${moving.key}-${fixed.planet}-${type.key}`;
          const touch: WeeklyTouch = {
            date: at.toISOString(),
            dowKo,
            // natal 별 이름 10개(태양·달·수성·금성·화성·목성·토성·천왕성·해왕성·명왕성)는
            // 전부 받침으로 끝나므로 "과"가 항상 맞다("와"를 쓰면 어긋난다).
            text: `${dowKo}요일 — 하늘의 ${moving.ko}이 내 ${planetKo.get(fixed.planet)}과 ${type.ko}을 이룹니다.`,
            movingKo: moving.ko,
            fixedKo: planetKo.get(fixed.planet) ?? fixed.planet,
            aspectKo: type.ko,
            detail: `하늘의 ${moving.ko} — ${TRANSIT_SKY[moving.key]}. 내 ${planetKo.get(fixed.planet)} — ${TRANSIT_SELF[fixed.planet]}. ${TRANSIT_FRAME[type.key]}`,
          };
          const prev = best.get(key);
          if (!prev || orb < prev.orb) best.set(key, { orb, touch });
        }
      }
    }
  }
  return [...best.values()]
    .sort((a, b) => a.touch.date.localeCompare(b.touch.date))
    .map((v) => v.touch);
}
