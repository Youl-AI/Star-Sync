# 별샘 확장 구현 계획 — 하늘의 달력 · 위클리 · 솔라 리턴 · PWA · 내비 개편

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 신월·보름·역행·태양 인그레스를 담는 월간 달력(+ .ics 구독), 주간 하늘 페이지, 솔라 리턴 페이지, PWA manifest, 그리고 늘어난 페이지를 담는 전체화면 오버레이 내비게이션.

**Architecture:** 모든 천문 계산은 기존 자체 엔진(`ephemeris.ts` 계열)의 crossing-이분법 패턴을 재사용한다. 이벤트 조립기(`calendar-events.ts`) 하나를 달력·위클리·ics 셋이 공유한다. 페이지는 전부 정적 export, "지금" 값은 빌드 시점 props + 마운트 후 교체(TodayCard 계약).

**Tech Stack:** Next.js 16 정적 export · React 19 · Tailwind 4 · Vitest · satori(next/og) · Cloudflare Workers Assets

**스펙:** `docs/superpowers/specs/2026-08-23-sky-calendar-expansion-design.md`

## Global Constraints

- 정적 export 유지. 서버·DB·외부 API 추가 금지. 계산은 전부 `src/lib/ephemeris.ts` 계열.
- 출생 정보는 localStorage `byeolsaem.birth.v1`만. 서버 HTML은 항상 "정보 없음" 상태로 그린다.
- "지금" 값이 필요한 화면: 빌드 시점 값을 props로 받고 마운트 후 실측 교체(`TodayCard`의 `initialSky`/`builtAt` 계약).
- 애니메이션: 월 전환·오버레이는 CSS(View Transitions / transition)만. GSAP·motion 신규 사용 금지. 새 모션 전부 `motion-reduce:` 처리. 이징 `cubic-bezier(0.16,1,0.3,1)`, 스태거 60ms.
- 한국어 신규 문자열(주석·테스트 포함) 커밋 전 `python scripts/subset-maruburi.py` 실행. `PYTHONIOENCODING=utf-8` 필요. 안 하면 `fonts.test.ts` 실패.
- `git add -A` 금지. 각 커밋은 명시된 파일만 스테이징.
- 이분법 정지 조건은 사이트 공통 `0.0002`일.
- 모든 새 페이지: `alternatesFor()`+`ogImage()`(`src/lib/metadata.ts`), sitemap, OG 카드, prefetch `NAV_TARGETS`.
- 테스트 실행: `byeolsaem-web/`에서 `npx vitest run src/test/<파일>`.
- 빌드 확인: `byeolsaem-web/`에서 `npx tsc --noEmit` 후 `npm run build`.

## 파일 지도

| 파일 | 역할 |
|---|---|
| `src/lib/lunation.ts` (수정) | `lunationsBetween` 기간 스캔 추가 |
| `src/lib/ingress.ts` (신규) | 태양 인그레스 |
| `src/lib/calendar-copy.ts` (신규) | 이벤트 제목·해설·링크 문구 (컴포넌트·ics 공유) |
| `src/lib/calendar-events.ts` (신규) | 이벤트 조립기 + 월 창(`calendarMonths`) |
| `src/lib/solar-return.ts` (신규) | 솔라 리턴 순간·차트 |
| `src/lib/weekly-reading.ts` (신규) | 주간 데이터 + 헤드라인 + 개인 트랜싯 |
| `src/lib/nav-ambient.ts` (신규) | 내비 오버레이의 "지금 하늘" 데이터 (서버 전용) |
| `src/components/calendar/*` (신규) | MonthSection·MonthGrid·MonthEventList·CalMonthNav·IcsRow |
| `src/components/weekly/WeeklyCard.tsx` (신규) | 주간 카드 (클라이언트) |
| `src/components/solar/SolarScope.tsx` (신규) | 솔라 리턴 결과/예시 (클라이언트) |
| `src/components/nav/nav-map.ts` (신규) | 내비 그룹 데이터 (Veil 단일 소스) |
| `src/components/nav/Veil.tsx` (재작성) | 헤더 + 전체화면 오버레이 |
| `app/(night-static)/calendar/**` (신규) | 허브 + 월별 12장 |
| `app/(night-static)/weekly/page.tsx` (신규) | 위클리 |
| `app/(night-static)/solar-return/page.tsx` (신규) | 솔라 리턴 |
| `scripts/build-ics.mjs` (신규) | out/sky.ics 생성 (postbuild) |
| `scripts/build-pwa-icons.mjs` (신규) | PWA 아이콘 PNG |
| `public/manifest.webmanifest` (신규) | PWA manifest |

---

### Task 1: lunationsBetween — 삭망 기간 스캔

**Files:**
- Modify: `byeolsaem-web/src/lib/lunation.ts`
- Test: `byeolsaem-web/src/test/lunation-between.test.ts` (신규)

**Interfaces:**
- Consumes: 기존 `nextCrossing`(파일 내부), `Lunation`, `toJulianDay`/`fromJulianDay`, `moonPosition`, `signAtLongitude`
- Produces: `export function lunationsBetween(from: Date, to: Date): Lunation[]` — from 이상 to 미만의 신월·보름 전부, 시간순

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/lunation-between.test.ts
import { describe, expect, it } from "vitest";
import { lunationsBetween } from "@/lib/lunation";

describe("lunationsBetween", () => {
  // 2026년 10월(KST) 실측: 신월 10/10, 보름 10/26 근방.
  it("2026년 10월에 신월 하나와 보름 하나를 찾는다", () => {
    const from = new Date(Date.UTC(2026, 9, 1) - 9 * 3600000);
    const to = new Date(Date.UTC(2026, 10, 1) - 9 * 3600000);
    const found = lunationsBetween(from, to);
    const news = found.filter((l) => l.kind === "new");
    const fulls = found.filter((l) => l.kind === "full");
    expect(news).toHaveLength(1);
    expect(fulls).toHaveLength(1);
  });

  it("결과가 시간순이고 전부 범위 안이다", () => {
    const from = new Date(Date.UTC(2026, 0, 1));
    const to = new Date(Date.UTC(2026, 6, 1));
    const found = lunationsBetween(from, to);
    // 6개월 ≈ 삭망 각 6번 안팎
    expect(found.length).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < found.length; i += 1) {
      expect(found[i].date >= found[i - 1].date).toBe(true);
    }
    for (const l of found) {
      expect(Date.parse(l.date)).toBeGreaterThanOrEqual(from.getTime());
      expect(Date.parse(l.date)).toBeLessThan(to.getTime());
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/lunation-between.test.ts` → FAIL ("lunationsBetween" is not exported)

- [ ] **Step 3: 구현** — `lunation.ts` 끝에 추가:

```ts
/**
 * from(포함)부터 to(제외)까지의 모든 신월·보름, 시간순.
 * 달력·위클리·ics가 같은 목록을 쓰기 위한 기간 스캔이다.
 */
export function lunationsBetween(from: Date, to: Date): Lunation[] {
  const out: Lunation[] = [];
  const endJd = toJulianDay(to);
  const targets = [
    { target: 0, kind: "new" as const },
    { target: 180, kind: "full" as const },
  ];
  for (const { target, kind } of targets) {
    let jd = toJulianDay(from);
    // 12개월 스캔이면 삭망 각 13번 — 40이면 3년치까지 안전하다.
    for (let guard = 0; guard < 40; guard += 1) {
      const found = nextCrossing(jd, target);
      if (found <= jd || found >= endJd) break;
      out.push({
        kind,
        date: fromJulianDay(found).toISOString(),
        signKo: signAtLongitude(moonPosition(found).longitude).ko,
      });
      jd = found + 1;
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 4: 통과 확인** — 같은 명령, 기존 `today.test.ts` 등도 함께: `npx vitest run` → 전부 PASS

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/lunation.ts src/test/lunation-between.test.ts public/fonts src/lib/font-subset*
git commit -m "feat(lunation): the moon phases learn to be listed, not just found"
```
(서브셋 산출물 경로는 `git status`로 확인해 실제 변경된 폰트 파일만 스테이징. 이하 모든 태스크 동일.)

---

### Task 2: 태양 인그레스

**Files:**
- Create: `byeolsaem-web/src/lib/ingress.ts`
- Test: `byeolsaem-web/src/test/ingress.test.ts`

**Interfaces:**
- Consumes: `sunPosition`, `toJulianDay`, `fromJulianDay` (`./ephemeris`), `signAtLongitude` (`./zodiac`)
- Produces: `export interface Ingress { signKo: string; date: string }`, `export function sunIngresses(from: Date, to: Date): Ingress[]`

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/ingress.test.ts
import { describe, expect, it } from "vitest";
import { sunIngresses } from "@/lib/ingress";

/** KST 날짜 문자열로 — 분지점 검증은 한국 날짜 기준이 읽기 쉽다. */
function kstDate(iso: string): string {
  return new Date(Date.parse(iso) + 9 * 3600000).toISOString().slice(0, 10);
}

describe("sunIngresses", () => {
  const YEAR = sunIngresses(new Date(Date.UTC(2026, 0, 1)), new Date(Date.UTC(2027, 0, 1)));

  it("한 해에 정확히 12번", () => {
    expect(YEAR).toHaveLength(12);
  });

  // 2026년 분지점 실측: 춘분 3/20, 하지 6/21, 추분 9/23, 동지 12/22 (KST).
  it.each([
    ["양자리", "2026-03-20"],
    ["게자리", "2026-06-21"],
    ["천칭자리", "2026-09-23"],
    ["염소자리", "2026-12-22"],
  ])("%s 진입이 %s", (signKo, date) => {
    const hit = YEAR.find((i) => i.signKo === signKo);
    expect(hit).toBeDefined();
    expect(kstDate(hit!.date)).toBe(date);
  });

  it("시간순", () => {
    for (let i = 1; i < YEAR.length; i += 1) {
      expect(YEAR[i].date > YEAR[i - 1].date).toBe(true);
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/ingress.test.ts` → FAIL (모듈 없음)

- [ ] **Step 3: 구현**

```ts
// src/lib/ingress.ts
import { fromJulianDay, sunPosition, toJulianDay } from "./ephemeris";
import { signAtLongitude } from "./zodiac";

/**
 * 태양 인그레스 — 태양이 별자리 경계(황경 30도 배수)를 넘는 순간.
 *
 * 하루 간격으로 별자리 인덱스 변화를 훑고 이분법으로 좁힌다 — 역행의 유(留)와
 * 삭망을 찾는 것과 같은 방법이다(retrograde.ts·lunation.ts 참고). 태양은 하루
 * 1도쯤 움직이므로 하루 걸음에 경계를 두 번 넘는 일은 없다.
 *
 * 태양만 다룬다. 수성·금성·화성 인그레스까지 실으면 달력이 소음이 된다.
 */
export interface Ingress {
  /** 넘어간 뒤의 별자리 */
  signKo: string;
  /** 정확한 순간 (ISO) */
  date: string;
}

/** 이분법 정지 조건 — 사이트 공통 정밀도(약 17초). */
const PRECISION_DAYS = 0.0002;

function signIndex(jd: number): number {
  return Math.floor(sunPosition(jd).longitude / 30) % 12;
}

export function sunIngresses(from: Date, to: Date): Ingress[] {
  const out: Ingress[] = [];
  const endJd = toJulianDay(to);
  let prevJd = toJulianDay(from);
  let prevIdx = signIndex(prevJd);
  for (let jd = prevJd + 1; jd <= endJd + 1; jd += 1) {
    const idx = signIndex(jd);
    if (idx !== prevIdx) {
      let low = prevJd;
      let high = jd;
      while (high - low > PRECISION_DAYS) {
        const mid = (low + high) / 2;
        if (signIndex(mid) === prevIdx) low = mid;
        else high = mid;
      }
      const at = (low + high) / 2;
      if (at >= toJulianDay(from) && at < endJd) {
        // 경계 위의 값은 부동소수 쪽에 따라 앞자리로 읽힐 수 있어, 새 자리의
        // 안쪽 1도를 물어 자리 이름을 정한다.
        out.push({ signKo: signAtLongitude(idx * 30 + 1).ko, date: fromJulianDay(at).toISOString() });
      }
    }
    prevJd = jd;
    prevIdx = idx;
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/test/ingress.test.ts` → PASS. 동지 날짜가 12/21로 나오면 테스트가 아니라 구현을 의심하지 말 것 — 실제 2026년 동지는 KST 12/22 오전이다. 확인 후에도 다르면 `kstDate` 계산부터 볼 것.

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/ingress.ts src/test/ingress.test.ts <변경된 폰트 파일>
git commit -m "feat(ingress): the sun's doorways between rooms get exact timestamps"
```

---

### Task 3: 이벤트 조립기 + 문구

**Files:**
- Create: `byeolsaem-web/src/lib/calendar-copy.ts`
- Create: `byeolsaem-web/src/lib/calendar-events.ts`
- Test: `byeolsaem-web/src/test/calendar-events.test.ts`

**Interfaces:**
- Consumes: `lunationsBetween`(Task 1), `sunIngresses`(Task 2), `retrogradesOf`·`RetroPlanet`(`./retrograde`), `kstParts`(`./retrograde-clock`)
- Produces:

```ts
export type CalendarEvent =
  | { kind: "new-moon" | "full-moon"; date: string; signKo: string }
  | { kind: "retro-start" | "retro-end"; date: string; planet: RetroPlanet; planetKo: string }
  | { kind: "ingress"; date: string; signKo: string };
export function eventsBetween(from: Date, to: Date): CalendarEvent[];
export function monthEvents(year: number, month: number): CalendarEvent[];       // month 1~12, KST 경계
export function retroSpans(year: number, month: number): { planet: RetroPlanet; planetKo: string; start: string; end: string }[];
export function kstMonthRange(year: number, month: number): { from: Date; to: Date };
export function calendarMonths(now: Date): { year: number; month: number }[];    // 이전 1 + 당월 + 이후 10 = 12
// calendar-copy.ts:
export function eventTitle(ev: CalendarEvent): string;      // "천칭자리 신월", "금성 역행 시작", "태양, 전갈자리로"
export function eventDescription(ev: CalendarEvent): string; // 한 줄 해설 (경어체 완결 문장)
export function eventHref(ev: CalendarEvent): string | null; // 역행 → 해당 페이지, 나머지 null
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/calendar-events.test.ts
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
  it("신월 10/10 (천칭)", () => {
    const hit = EVENTS.find((e) => e.kind === "new-moon");
    expect(hit && kstParts(hit.date).day).toBe(10);
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
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/calendar-events.test.ts` → FAIL (모듈 없음)

- [ ] **Step 3: calendar-copy.ts 구현**

```ts
// src/lib/calendar-copy.ts
import type { CalendarEvent } from "./calendar-events";

/**
 * 달력 이벤트의 문구 — 화면(달력·위클리)과 ics 파일이 같은 문장을 쓴다.
 * 여기 문장이 곧 구독자의 캘린더에 뜨는 글자다.
 */
export function eventTitle(ev: CalendarEvent): string {
  switch (ev.kind) {
    case "new-moon": return `${ev.signKo} 신월`;
    case "full-moon": return `${ev.signKo} 보름`;
    case "retro-start": return `${ev.planetKo} 역행 시작`;
    case "retro-end": return `${ev.planetKo} 역행 끝`;
    case "ingress": return `태양, ${ev.signKo}로`;
  }
}

export function eventDescription(ev: CalendarEvent): string {
  switch (ev.kind) {
    case "new-moon": return "달이 태양과 겹치는 날 — 새로 시작하기 좋은 자리로 읽습니다.";
    case "full-moon": return "달이 가장 차는 날 — 신월에 세운 것을 확인하고 정리하는 자리로 읽습니다.";
    case "retro-start": return retroStartDesc(ev.planetKo);
    case "retro-end": return `${ev.planetKo}이 다시 앞으로 걷기 시작합니다. 미뤄 둔 결정을 꺼내기 좋은 때입니다.`;
    case "ingress": return `태양이 ${ev.signKo}의 방으로 들어섭니다. 한 달 동안 이 자리의 주제가 계절의 기본값이 됩니다.`;
  }
}

function retroStartDesc(planetKo: string): string {
  if (planetKo === "수성") return "말·계약·기기를 맡는 별이 되돌아갑니다. 보내기 전에 한 번 더 확인하는 시기입니다.";
  if (planetKo === "금성") return "사랑·돈·취향을 맡는 별이 되돌아갑니다. 새로 벌이기보다 되짚는 시기입니다.";
  return "실행과 추진을 맡는 별이 되돌아갑니다. 밀어붙이기보다 전열을 다듬는 시기입니다.";
}

export function eventHref(ev: CalendarEvent): string | null {
  if (ev.kind !== "retro-start" && ev.kind !== "retro-end") return null;
  if (ev.planet === "mercury") return "/retrograde";
  return `/retrograde/${ev.planet}`;
}
```

- [ ] **Step 4: calendar-events.ts 구현**

```ts
// src/lib/calendar-events.ts
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
```

- [ ] **Step 5: 통과 확인** — `npx vitest run src/test/calendar-events.test.ts` → PASS (역행 계산이 느려 수 초 걸릴 수 있음)

- [ ] **Step 6: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/calendar-copy.ts src/lib/calendar-events.ts src/test/calendar-events.test.ts <변경된 폰트 파일>
git commit -m "feat(calendar): one assembler feeds the grid, the week, and the feed"
```

---

### Task 4: 솔라 리턴 계산

**Files:**
- Create: `byeolsaem-web/src/lib/solar-return.ts`
- Test: `byeolsaem-web/src/test/solar-return.test.ts`

**Interfaces:**
- Consumes: `birthJulianDay`, `computeChart`, `BirthMoment`, `Chart` (`./chart`); `fromJulianDay`, `norm180`, `sunApparentLongitude`, `toJulianDay` (`./ephemeris`)
- Produces:

```ts
export function solarReturnInstant(natal: BirthMoment, targetYear: number): Date;
export function solarReturnChart(natal: BirthMoment, now: Date): { instant: Date; nextInstant: Date; chart: Chart };
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/solar-return.test.ts
import { describe, expect, it } from "vitest";
import { solarReturnChart, solarReturnInstant } from "@/lib/solar-return";
import { birthJulianDay, type BirthMoment } from "@/lib/chart";
import { norm180, sunApparentLongitude, toJulianDay } from "@/lib/ephemeris";

// EXAMPLE_BIRTH과 같은 사람 — 예시 화면과 테스트가 같은 하늘을 본다.
const NATAL: BirthMoment = {
  date: "1995-07-14",
  time: "09:30",
  latitude: 37.5665,
  longitude: 126.978,
  timezoneOffsetHours: 9,
};

describe("solarReturnInstant", () => {
  it("리턴 순간의 태양 황경이 출생 태양 황경과 일치한다 (±0.01도)", () => {
    const natalSun = sunApparentLongitude(birthJulianDay(NATAL));
    const instant = solarReturnInstant(NATAL, 2026);
    const returnSun = sunApparentLongitude(toJulianDay(instant));
    expect(Math.abs(norm180(returnSun - natalSun))).toBeLessThan(0.01);
  });

  it("리턴은 생일 ±1일 안이다", () => {
    const instant = solarReturnInstant(NATAL, 2026);
    const birthday = Date.UTC(2026, 6, 14);
    expect(Math.abs(instant.getTime() - birthday)).toBeLessThan(2 * 86400000);
  });
});

describe("solarReturnChart", () => {
  it("생일이 지난 시점: 올해 리턴이 현재 차트다", () => {
    const { instant, nextInstant } = solarReturnChart(NATAL, new Date(Date.UTC(2026, 7, 23)));
    expect(instant.getUTCFullYear()).toBe(2026);
    expect(nextInstant.getUTCFullYear()).toBe(2027);
  });
  it("생일 전 시점: 작년 리턴이 아직 유효하다", () => {
    const { instant, nextInstant } = solarReturnChart(NATAL, new Date(Date.UTC(2026, 2, 1)));
    expect(instant.getUTCFullYear()).toBe(2025);
    expect(nextInstant.getUTCFullYear()).toBe(2026);
  });
  it("차트에 상승궁과 하우스가 있다 (출생 시각을 아는 사람)", () => {
    const { chart } = solarReturnChart(NATAL, new Date(Date.UTC(2026, 7, 23)));
    expect(chart.ascendant).not.toBeNull();
    expect(chart.placements.find((p) => p.planet === "sun")?.house).not.toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/solar-return.test.ts` → FAIL

- [ ] **Step 3: 구현**

```ts
// src/lib/solar-return.ts
import { birthJulianDay, computeChart, type BirthMoment, type Chart } from "./chart";
import { fromJulianDay, norm180, sunApparentLongitude, toJulianDay } from "./ephemeris";

/**
 * 솔라 리턴 — 태양이 출생 순간의 황경으로 돌아오는 순간과 그때의 차트.
 *
 * 그 순간의 하늘로 생일부터 다음 생일까지 한 해를 읽는 것이 솔라 리턴이다.
 * 장소는 출생지를 그대로 쓴다(현재 위치로 세우는 유파도 있으나 우리는 위치를
 * 수집하지 않는다 — 페이지가 이 관례 차이를 밝힌다).
 *
 * 탐색은 삭망·인그레스와 같은 뼈대다: 생일 근방 ±6일 창에서 부호 반전을 찾아
 * 이분법으로 좁힌다. 태양년(365.24일)과 달력년의 어긋남이 하루를 넘지 않으므로
 * 창 안에 반전이 반드시 하나 있다.
 */
const PRECISION_DAYS = 0.0002;

export function solarReturnInstant(natal: BirthMoment, targetYear: number): Date {
  const natalSun = sunApparentLongitude(birthJulianDay(natal));
  const [, m, d] = natal.date.split("-").map(Number);
  // 2/29 출생은 Date.UTC가 3/1로 굴리지만 창이 ±6일이라 반전을 놓치지 않는다.
  const guess = toJulianDay(new Date(Date.UTC(targetYear, m - 1, d, 12)));
  const offset = (jd: number) => norm180(sunApparentLongitude(jd) - natalSun);

  let low = guess - 6;
  let high = guess + 6;
  let prev = low;
  let prevOff = offset(low);
  for (let jd = low + 1; jd <= high; jd += 1) {
    const off = offset(jd);
    if (Math.sign(off) !== Math.sign(prevOff) && Math.abs(off) < 30) {
      low = prev;
      high = jd;
      break;
    }
    prev = jd;
    prevOff = off;
  }
  const lowSign = Math.sign(offset(low));
  while (high - low > PRECISION_DAYS) {
    const mid = (low + high) / 2;
    if (Math.sign(offset(mid)) === lowSign) low = mid;
    else high = mid;
  }
  return fromJulianDay((low + high) / 2);
}

export function solarReturnChart(
  natal: BirthMoment,
  now: Date,
): { instant: Date; nextInstant: Date; chart: Chart } {
  let year = now.getUTCFullYear();
  let instant = solarReturnInstant(natal, year);
  if (instant.getTime() > now.getTime()) {
    year -= 1;
    instant = solarReturnInstant(natal, year);
  }
  const nextInstant = solarReturnInstant(natal, year + 1);

  // 리턴 순간을 출생지의 지역시로 옮겨 BirthMoment 형태로 만든다.
  const local = new Date(instant.getTime() + natal.timezoneOffsetHours * 3600000);
  const chart = computeChart({
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
    latitude: natal.latitude,
    longitude: natal.longitude,
    timezoneOffsetHours: natal.timezoneOffsetHours,
  });
  return { instant, nextInstant, chart };
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/test/solar-return.test.ts` → PASS

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/solar-return.ts src/test/solar-return.test.ts <변경된 폰트 파일>
git commit -m "feat(solar-return): the sun's homecoming becomes a computable instant"
```

---

### Task 5: 달력 화면 부품

**Files:**
- Create: `byeolsaem-web/src/components/calendar/MonthGrid.tsx`
- Create: `byeolsaem-web/src/components/calendar/MonthEventList.tsx`
- Create: `byeolsaem-web/src/components/calendar/CalMonthNav.tsx`
- Create: `byeolsaem-web/src/components/calendar/MonthSection.tsx`
- Modify: `byeolsaem-web/src/app/globals.css` (파일 끝, `::view-transition-old(root)` 블록 뒤)

**Interfaces:**
- Consumes: `monthEvents`, `retroSpans`, `kstMonthRange`(Task 3), `eventTitle`·`eventDescription`·`eventHref`(Task 3), `kstParts`·`formatKstDateTime`(`@/lib/retrograde-clock`)
- Produces: `<MonthSection year month prevHref nextHref />` — 그리드 + 목록 + 월 내비를 통째로. 서버 컴포넌트(CalMonthNav만 클라이언트).

- [ ] **Step 1: MonthGrid** — 서버 컴포넌트. 시각 규칙은 프리뷰 아티팩트 확정안:
신월 = 채운 금점, 보름 = 테두리 금점, 역행 = 칸 하단 색 밴드(수성 파랑 `#8ca5cd`·금성 분홍 `#c98f8f`·화성 주황 `#cd8f6a` 계열, 투명도 0.85), 이벤트 라벨은 `sm` 이상에서만.

```tsx
// src/components/calendar/MonthGrid.tsx
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
```

- [ ] **Step 2: MonthEventList**

```tsx
// src/components/calendar/MonthEventList.tsx
import Link from "next/link";
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
```

- [ ] **Step 3: CalMonthNav** — 방향 있는 View Transition의 방아쇠. 클라이언트.

```tsx
// src/components/calendar/CalMonthNav.tsx
"use client";
import Link from "next/link";

/**
 * 월 이동 링크. 누르는 순간 문서 루트에 방향을 심어 두면 TransitionStage가 여는
 * View Transition에서 globals.css의 방향별 슬라이드가 걸린다. 전환이 끝날 때쯤
 * 지운다 — 남겨 두면 달력과 무관한 다음 이동까지 슬라이드된다.
 */
function setDir(dir: "prev" | "next") {
  document.documentElement.dataset.calDir = dir;
  window.setTimeout(() => {
    delete document.documentElement.dataset.calDir;
  }, 600);
}

export function CalMonthNav({
  label,
  prevHref,
  nextHref,
}: {
  label: string;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const cls = "text-sm text-starlight-dim transition-colors hover:text-gold-soft";
  return (
    <div className="flex items-baseline justify-between border-b border-gold/20 pb-3">
      <h1 className="break-keep font-display text-2xl text-starlight md:text-3xl">{label}</h1>
      <div className="flex items-baseline gap-5">
        {prevHref ? (
          <Link href={prevHref} className={cls} onClick={() => setDir("prev")}>
            ‹ 이전 달
          </Link>
        ) : (
          <span className="text-sm text-starlight-dim/40">‹ 이전 달</span>
        )}
        {nextHref ? (
          <Link href={nextHref} className={cls} onClick={() => setDir("next")}>
            다음 달 ›
          </Link>
        ) : (
          <span className="text-sm text-starlight-dim/40">다음 달 ›</span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: MonthSection** — 셋을 묶는 서버 컴포넌트. 허브와 월별 페이지가 같이 쓴다.

```tsx
// src/components/calendar/MonthSection.tsx
import { monthEvents, retroSpans } from "@/lib/calendar-events";
import { CalMonthNav } from "./CalMonthNav";
import { MonthEventList } from "./MonthEventList";
import { MonthGrid } from "./MonthGrid";

export function MonthSection({
  year,
  month,
  prevHref,
  nextHref,
}: {
  year: number;
  month: number;
  prevHref: string | null;
  nextHref: string | null;
}) {
  const events = monthEvents(year, month);
  const spans = retroSpans(year, month);
  return (
    <section style={{ viewTransitionName: "calendar-grid" }}>
      <CalMonthNav label={`${year}년 ${month}월`} prevHref={prevHref} nextHref={nextHref} />
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
```

- [ ] **Step 5: globals.css 슬라이드** — 파일 끝(724행 `::view-transition-old(root)` 블록 뒤)에 추가:

```css
/* 달력의 월 이동 — 그리드만 방향 있게 미끄러진다. 이름을 분리했으므로 루트
   크로스페이드(위 180ms)는 페이지의 나머지에 그대로 걸린다. 방향은 CalMonthNav가
   클릭 순간 html[data-cal-dir]로 심는다. 감소 모드에서는 TransitionStage가 전환
   자체를 열지 않으므로 여기 올 일이 없다. */
@keyframes cal-slide-out {
  to { transform: translateX(calc(var(--cal-dir) * -32px)); opacity: 0; }
}
@keyframes cal-slide-in {
  from { transform: translateX(calc(var(--cal-dir) * 32px)); opacity: 0; }
}
html[data-cal-dir="next"] { --cal-dir: 1; }
html[data-cal-dir="prev"] { --cal-dir: -1; }
html[data-cal-dir] ::view-transition-old(calendar-grid) {
  animation: cal-slide-out 200ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
html[data-cal-dir] ::view-transition-new(calendar-grid) {
  animation: cal-slide-in 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
```

- [ ] **Step 6: 타입 확인** — `npx tsc --noEmit` → 에러 0 (페이지가 아직 없어 렌더 경로는 다음 태스크에서 검증)

- [ ] **Step 7: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/calendar/MonthGrid.tsx src/components/calendar/MonthEventList.tsx src/components/calendar/CalMonthNav.tsx src/components/calendar/MonthSection.tsx src/app/globals.css <변경된 폰트 파일>
git commit -m "feat(calendar): a month of sky becomes a grid, a list, and a sliding door"
```

---

### Task 6: 달력 라우트 — 허브 + 월별 12장

**Files:**
- Create: `byeolsaem-web/src/app/(night-static)/calendar/page.tsx`
- Create: `byeolsaem-web/src/app/(night-static)/calendar/[year]/[month]/page.tsx`

**Interfaces:**
- Consumes: `MonthSection`(Task 5), `calendarMonths`·`monthEvents`(Task 3), `eventTitle`(Task 3), `alternatesFor`·`ogImage`, `JsonLd`·`breadcrumbSchema`·`faqSchema`(`@/components/seo/JsonLd`), `formatKstDate`·`kstParts`(`@/lib/retrograde-clock`), `NextSteps`(`@/components/nav/NextSteps`), `PlaceBand`
- Produces: 라우트 `/calendar`, `/calendar/[year]/[month]` (12장). 월 내비 href 규칙 — 창 안이면 `/calendar/YYYY/MM`(월 2자리), 밖이면 null.

- [ ] **Step 1: 공통 헬퍼와 월별 페이지**

```tsx
// src/app/(night-static)/calendar/[year]/[month]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { MonthSection } from "@/components/calendar/MonthSection";
import { NextSteps } from "@/components/nav/NextSteps";
import { PlaceBand } from "@/components/place/PlaceBand";
import { eventTitle } from "@/lib/calendar-copy";
import { calendarMonths, monthEvents } from "@/lib/calendar-events";
import { alternatesFor, ogImage } from "@/lib/metadata";
import { formatKstDate, kstParts } from "@/lib/retrograde-clock";

/**
 * 월별 달력 — /calendar 허브의 형제. "2026년 10월 신월" 같은 검색이 이 주소로
 * 들어온다. 창은 빌드 시점의 이전 1 + 당월 + 이후 10 = 12장이고, 빌드마다 한 달씩
 * 미끄러진다. 밀려난 과거 주소는 자연히 404가 된다 — 사이트맵도 같은 창만 싣는다.
 */
const MONTHS = calendarMonths(new Date());

const pad = (n: number) => String(n).padStart(2, "0");
export const monthHref = (m: { year: number; month: number }) => `/calendar/${m.year}/${pad(m.month)}`;

export function generateStaticParams() {
  return MONTHS.map((m) => ({ year: String(m.year), month: pad(m.month) }));
}

function parseParams(params: { year: string; month: string }) {
  const year = Number(params.year);
  const month = Number(params.month);
  const idx = MONTHS.findIndex((m) => m.year === year && m.month === month);
  return { year, month, idx };
}

export async function generateMetadata({ params }: { params: Promise<{ year: string; month: string }> }): Promise<Metadata> {
  const { year, month, idx } = parseParams(await params);
  if (idx < 0) return {};
  const events = monthEvents(year, month);
  const headline = events.map((e) => eventTitle(e)).slice(0, 4).join(" · ");
  const path = monthHref({ year, month });
  return {
    title: `${year}년 ${month}월 하늘의 달력 — 신월·보름·역행 | 별샘`,
    description: `${year}년 ${month}월의 하늘: ${headline || "조용한 달"}. 신월과 보름, 역행의 시작과 끝, 태양이 자리를 옮기는 날을 날짜와 시각까지 계산했습니다.`,
    alternates: alternatesFor(path),
    openGraph: ogImage(path, "/og/calendar.png"),
  };
}

export default async function CalendarMonthPage({ params }: { params: Promise<{ year: string; month: string }> }) {
  const { year, month, idx } = parseParams(await params);
  if (idx < 0) notFound();
  const events = monthEvents(year, month);

  const faqs = [
    events.find((e) => e.kind === "new-moon") && {
      question: `${year}년 ${month}월 신월은 언제인가요?`,
      answer: `${formatKstDate(events.find((e) => e.kind === "new-moon")!.date)}입니다. 달이 태양과 겹치는 정확한 순간을 계산한 값입니다.`,
    },
    events.find((e) => e.kind === "full-moon") && {
      question: `${year}년 ${month}월 보름달은 언제인가요?`,
      answer: `${formatKstDate(events.find((e) => e.kind === "full-moon")!.date)}입니다.`,
    },
    {
      question: "이 날짜는 어떻게 계산하나요?",
      answer: "별샘의 자체 천문 계산으로 태양과 달, 행성의 실제 위치를 구해 정확한 순간을 찾습니다. 한국 시간(KST) 기준입니다.",
    },
  ].filter(Boolean) as { question: string; answer: string }[];

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <JsonLd data={breadcrumbSchema([
        { name: "별샘", path: "/" },
        { name: "하늘의 달력", path: "/calendar" },
        { name: `${year}년 ${month}월`, path: monthHref({ year, month }) },
      ])} />
      <JsonLd data={faqSchema(faqs)} />
      <PlaceBand src="/world/place-retro.webp" />
      <header className="mb-10 text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">SKY CALENDAR</p>
      </header>
      <MonthSection
        year={year}
        month={month}
        prevHref={idx > 0 ? monthHref(MONTHS[idx - 1]) : null}
        nextHref={idx < MONTHS.length - 1 ? monthHref(MONTHS[idx + 1]) : null}
      />
      <NextSteps
        lead="이 달의 하늘이 당신의 차트에서는 어느 방을 지나는지 — 태어난 순간을 넣으면 바로 나옵니다."
        primary={{ href: "/natal", label: "내 천궁도 보기" }}
        secondary={{ href: "/weekly", label: "이번 주 하늘 보기" }}
      />
    </main>
  );
}
```

주의: Next 16에서 `params`는 Promise다 — `await params` 형태를 그대로 쓸 것. 빌드 에러가 나면 `node_modules/next/dist/docs/`의 라우팅 문서를 먼저 확인.

- [ ] **Step 2: 허브 /calendar**

```tsx
// src/app/(night-static)/calendar/page.tsx
import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";
import { MonthSection } from "@/components/calendar/MonthSection";
import { NextSteps } from "@/components/nav/NextSteps";
import { PlaceBand } from "@/components/place/PlaceBand";
import { calendarMonths } from "@/lib/calendar-events";
import { alternatesFor, ogImage } from "@/lib/metadata";

/**
 * 하늘의 달력 허브 — 이번 달. /today처럼 내용이 달마다 회전하는 페이지라
 * canonical은 /calendar 자신이다. 월별 상세는 [year]/[month]가 갖는다.
 */
const MONTHS = calendarMonths(new Date());
const CURRENT = MONTHS[1]; // [0]이 이전 달
const pad = (n: number) => String(n).padStart(2, "0");
const href = (m: { year: number; month: number }) => `/calendar/${m.year}/${pad(m.month)}`;

export const metadata: Metadata = {
  title: "하늘의 달력 — 신월·보름·역행이 있는 날 | 별샘",
  description:
    "이번 달 하늘에 일어나는 일을 한 장에: 신월과 보름의 정확한 시각, 역행의 시작과 끝, 태양이 자리를 옮기는 날. 전부 실제 천문 계산입니다.",
  alternates: alternatesFor("/calendar"),
  openGraph: ogImage("/calendar", "/og/calendar.png"),
};

export default function CalendarPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "하늘의 달력", path: "/calendar" }])} />
      <PlaceBand src="/world/place-retro.webp" />
      <header className="mx-auto mb-12 max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">SKY CALENDAR</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">하늘의 달력</h1>
        <p className="mx-auto mt-4 max-w-md break-keep text-guide text-starlight-dim">
          신월과 보름, 역행의 시작과 끝, 태양이 자리를 옮기는 날 — 한 달의 하늘을
          한 장에 담았습니다. 날짜와 시각은 전부 실제 천문 계산입니다.
        </p>
      </header>
      <MonthSection
        year={CURRENT.year}
        month={CURRENT.month}
        prevHref={href(MONTHS[0])}
        nextHref={href(MONTHS[2])}
      />
      <NextSteps
        lead="다가오는 역행이 궁금하다면 — 시작과 끝, 점검 목록까지 정리되어 있습니다."
        primary={{ href: "/retrograde", label: "수성 역행 보기" }}
        secondary={{ href: "/weekly", label: "이번 주 하늘 보기" }}
      />
    </main>
  );
}
```

- [ ] **Step 3: 빌드 확인** — `npx tsc --noEmit` 후 `npm run build`. out/에 `calendar.html` + `calendar/<year>/<month>.html` 12장이 생겼는지:
`Get-ChildItem out/calendar -Recurse -Filter *.html | Measure-Object` → Count 13 (허브 포함)

- [ ] **Step 4: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add "src/app/(night-static)/calendar" <변경된 폰트 파일>
git commit -m "feat(calendar): twelve months of sky get their own addresses"
```

---

### Task 7: .ics 구독

**Files:**
- Create: `byeolsaem-web/scripts/build-ics.mjs`
- Create: `byeolsaem-web/src/components/calendar/IcsRow.tsx`
- Modify: `byeolsaem-web/package.json` (postbuild)
- Modify: `byeolsaem-web/public/_headers`
- Modify: `byeolsaem-web/src/app/(night-static)/calendar/page.tsx` (IcsRow 추가)
- Test: `byeolsaem-web/src/test/ics.test.ts` (생성 로직을 lib으로 두고 스크립트는 얇게)
- Create: `byeolsaem-web/src/lib/ics.ts`

**Interfaces:**
- Consumes: `eventsBetween`(Task 3), `eventTitle`·`eventDescription`·`eventHref`(Task 3), `kstParts`
- Produces: `export function buildIcs(events: CalendarEvent[]): string` (lib), `out/sky.ics` (postbuild)

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/ics.test.ts
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
    expect(ics).toMatch(/UID:new-moon-20261010@byeolsaem\.com/);
  });
  it("종일 이벤트(KST 날짜)로 나간다", () => {
    expect(ics).toMatch(/DTSTART;VALUE=DATE:20261010/);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/ics.test.ts` → FAIL

- [ ] **Step 3: lib 구현**

```ts
// src/lib/ics.ts
import { eventDescription, eventHref, eventTitle } from "./calendar-copy";
import type { CalendarEvent } from "./calendar-events";
import { kstParts } from "./retrograde-clock";

/**
 * iCalendar 생성 — 캘린더 앱이 구독하는 /sky.ics의 본문.
 *
 * UID는 내용 기반(kind + KST 날짜 + 행성)이다. 무작위나 시각 기반이면 재배포마다
 * 새 이벤트로 보여 구독자 캘린더에 같은 신월이 겹겹이 쌓인다.
 * 종일 이벤트로 낸다 — 정확한 시각은 DESCRIPTION과 링크된 페이지가 말한다.
 * 줄은 RFC 5545대로 CRLF, 75바이트 넘는 줄은 접는다.
 */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 73) return line;
  // 한글이 잘리지 않게 글자 단위로 접는다.
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (new TextEncoder().encode(current + ch).length > 70) {
      out.push(current);
      current = " " + ch; // 이어지는 줄은 공백 하나로 시작
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function uidOf(ev: CalendarEvent): string {
  const p = kstParts(ev.date);
  const ymd = `${p.year}${String(p.month).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
  const planet = "planet" in ev ? `-${ev.planet}` : "";
  return `${ev.kind}${planet}-${ymd}@byeolsaem.com`;
}

export function buildIcs(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//byeolsaem//sky-calendar//KO",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:별샘 — 하늘의 달력",
    "X-WR-TIMEZONE:Asia/Seoul",
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
  ];
  for (const ev of events) {
    const p = kstParts(ev.date);
    const ymd = `${p.year}${String(p.month).padStart(2, "0")}${String(p.day).padStart(2, "0")}`;
    const href = eventHref(ev);
    const desc = eventDescription(ev) + (href ? ` https://byeolsaem.com${href}` : " https://byeolsaem.com/calendar");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uidOf(ev)}`,
      `DTSTAMP:${ymd}T000000Z`,
      `DTSTART;VALUE=DATE:${ymd}`,
      fold(`SUMMARY:${escapeText(eventTitle(ev))}`),
      fold(`DESCRIPTION:${escapeText(desc)}`),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/test/ics.test.ts` → PASS

- [ ] **Step 5: 스크립트 + postbuild + 헤더**

```js
// scripts/build-ics.mjs
/**
 * 빌드 산출물에 /sky.ics를 넣는다 — 캘린더 앱이 구독하는 주소.
 * 향후 12개월 이벤트. 실행: postbuild (prefetch-chunks 다음).
 * TS를 그대로 물어오므로 --experimental-strip-types로 돈다(build-og.mjs와 동일).
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { eventsBetween } from "../src/lib/calendar-events.ts";
import { buildIcs } from "../src/lib/ics.ts";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "out", "sky.ics");
const now = new Date();
const events = eventsBetween(now, new Date(now.getTime() + 365 * 86400000));
await writeFile(OUT, buildIcs(events), "utf-8");
console.log(`sky.ics — 이벤트 ${events.length}개, 12개월치`);
```

`package.json`:

```json
"postbuild": "node scripts/prefetch-chunks.mjs && node --experimental-strip-types scripts/build-ics.mjs"
```

`public/_headers` 끝에 추가:

```
/sky.ics
  Cache-Control: public, max-age=86400
```

- [ ] **Step 6: IcsRow** — 허브와 월별 페이지의 `<NextSteps …/>` 바로 위에 `<IcsRow />` 추가:

```tsx
// src/components/calendar/IcsRow.tsx
"use client";
import { useState } from "react";

/**
 * 캘린더 구독 안내 — 구석의 선택 기능. 직접 쓰는 사람은 소수라는 것을 알고
 * 만들었다(2026-08-23 결정). 페이지 가치의 본체는 달력 자체다.
 */
export function IcsRow() {
  const [copied, setCopied] = useState(false);
  const url = "https://byeolsaem.com/sky.ics";
  return (
    <div className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gold/10 pt-6">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          });
        }}
        className="border border-gold/25 px-4 py-2 text-meta tracking-[0.08em] text-gold-soft transition-colors hover:border-gold/50 hover:text-starlight motion-reduce:transition-none"
      >
        {copied ? "복사됐습니다" : "🗓 캘린더 구독 주소 복사"}
      </button>
      <a href="webcal://byeolsaem.com/sky.ics" className="text-meta text-gold-soft underline-offset-4 hover:underline">
        애플 캘린더로 바로 구독
      </a>
      <p className="w-full break-keep text-meta text-starlight-dim sm:w-auto">
        구글 캘린더는 설정 → 캘린더 추가 → URL로 추가에 붙여 넣으세요. 신월·보름·역행이 캘린더에 나타납니다.
      </p>
    </div>
  );
}
```

- [ ] **Step 7: 빌드 확인** — `npm run build` 후 `Test-Path out/sky.ics` → True. `Get-Content out/sky.ics -TotalCount 5`로 골격 눈검사.

- [ ] **Step 8: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/ics.ts src/test/ics.test.ts scripts/build-ics.mjs package.json public/_headers src/components/calendar/IcsRow.tsx "src/app/(night-static)/calendar" <변경된 폰트 파일>
git commit -m "feat(ics): the sky calendar learns to live inside other calendars"
```

---

### Task 8: 위클리 읽기

**Files:**
- Create: `byeolsaem-web/src/lib/weekly-reading.ts`
- Test: `byeolsaem-web/src/test/weekly.test.ts`

**Interfaces:**
- Consumes: `eventsBetween`·`CalendarEvent`(Task 3), `eventTitle`(Task 3), `longitudeOf`·`findAspects`·`angleBetween`·`ASPECT_TYPES`·`Chart`(`./chart`), `toJulianDay`(`./ephemeris`), `PLANETS`(`./planets`), `kstParts`
- Produces:

```ts
export function kstWeekStart(now: Date): Date;                       // 월요일 00:00 KST의 UTC 시각
export interface WeeklyData { weekStart: string; events: CalendarEvent[]; headline: string; summary: string; }
export function weeklyData(now: Date): WeeklyData;
export interface WeeklyTouch { date: string; dowKo: string; text: string; }
export function weeklyPersonal(weekStart: Date, natal: Chart): WeeklyTouch[];
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/weekly.test.ts
import { describe, expect, it } from "vitest";
import { kstWeekStart, weeklyData, weeklyPersonal } from "@/lib/weekly-reading";
import { computeChart } from "@/lib/chart";

describe("kstWeekStart", () => {
  it("일요일(KST)은 그 주 월요일로 돌아간다", () => {
    // 2026-08-23은 KST 일요일 → 주 시작은 8/17(월) 00:00 KST = 8/16 15:00 UTC
    const start = kstWeekStart(new Date(Date.UTC(2026, 7, 23, 3)));
    expect(start.toISOString()).toBe("2026-08-16T15:00:00.000Z");
  });
  it("월요일 아침은 같은 날이 주 시작이다", () => {
    const start = kstWeekStart(new Date(Date.UTC(2026, 7, 17, 0))); // KST 8/17 09:00 월
    expect(start.toISOString()).toBe("2026-08-16T15:00:00.000Z");
  });
});

describe("weeklyData", () => {
  it("수성 역행이 시작하는 주(2026-10-19~25)의 헤드라인이 역행을 앞세운다", () => {
    const data = weeklyData(new Date(Date.UTC(2026, 9, 20)));
    expect(data.headline).toContain("수성");
    expect(data.headline.endsWith("다.")).toBe(true);
  });
  it("조용한 주는 조용하다고 말한다", () => {
    // 2026-09-14~20 (KST): 삭망·역행·인그레스 없음 — 사전 실측으로 확인된 주.
    const data = weeklyData(new Date(Date.UTC(2026, 8, 16)));
    if (data.events.length === 0) {
      expect(data.headline).toContain("조용");
    }
    expect(data.headline.endsWith("다.")).toBe(true);
  });
});

describe("weeklyPersonal", () => {
  it("orb 1도 이내만, 쌍 중복 없음", () => {
    const natal = computeChart({
      date: "1995-07-14", time: "09:30",
      latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9,
    });
    const touches = weeklyPersonal(kstWeekStart(new Date(Date.UTC(2026, 9, 20))), natal);
    const keys = touches.map((t) => t.text.split(" — ")[1] ?? t.text);
    expect(new Set(keys).size).toBe(keys.length);
    for (const t of touches) expect(t.text.endsWith("다.")).toBe(true);
  });
});
```

주의(Step 1 실행 시): "조용한 주" 테스트의 주가 실측과 다르면(이벤트가 있으면) 조건 분기가 이미 지키므로 테스트는 깨지지 않는다 — 헤드라인 계약("다."로 끝)만 항상 검증된다.

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/weekly.test.ts` → FAIL

- [ ] **Step 3: 구현**

```ts
// src/lib/weekly-reading.ts
import { eventsBetween, type CalendarEvent } from "./calendar-events";
import { eventTitle } from "./calendar-copy";
import { ASPECT_TYPES, angleBetween, longitudeOf, type Chart } from "./chart";
import { toJulianDay } from "./ephemeris";
import { PLANETS, type PlanetKey } from "./planets";
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
      : `그 밖에 ${rest.map((e) => `${kstParts(e.date).day}일 ${eventTitle(e)}`).join(", ")}이 있습니다.`;
  return { weekStart: start.toISOString(), events, headline: headlineOf(top), summary };
}

export interface WeeklyTouch {
  /** 그 날 정오 KST의 UTC ISO */
  date: string;
  dowKo: string;
  text: string;
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
    for (const moving of PLANETS) {
      const movingLon = longitudeOf(moving.key as PlanetKey, jd);
      for (const fixed of natal.placements) {
        for (const type of ASPECT_TYPES) {
          const orb = Math.abs(angleBetween(movingLon, fixed.longitude) - type.angle);
          if (orb > 1) continue;
          const key = `${moving.key}-${fixed.planet}-${type.key}`;
          const dowKo = DOW_KO[new Date(at.getTime() + 9 * 3600000).getUTCDay()];
          const touch: WeeklyTouch = {
            date: at.toISOString(),
            dowKo,
            text: `${dowKo}요일 — 하늘의 ${moving.ko}이 내 ${planetKo.get(fixed.planet)}와 ${type.ko}을 이룹니다.`,
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
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/test/weekly.test.ts` → PASS

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/weekly-reading.ts src/test/weekly.test.ts <변경된 폰트 파일>
git commit -m "feat(weekly): seven days of sky learn to summarize themselves"
```

---

### Task 9: /weekly 페이지

**Files:**
- Create: `byeolsaem-web/src/components/weekly/WeeklyCard.tsx`
- Create: `byeolsaem-web/src/app/(night-static)/weekly/page.tsx`

**Interfaces:**
- Consumes: `weeklyData`·`weeklyPersonal`·`kstWeekStart`·`WeeklyData`(Task 8), `eventTitle`·`eventDescription`·`eventHref`(Task 3), `useBirthProfile`, `coordinatesFor`(`@/lib/coordinates`), `computeChart`, `requestRitual`(`@/lib/ritual`), `kstParts`
- Produces: 라우트 `/weekly`

- [ ] **Step 1: WeeklyCard** — TodayCard 계약: 빌드 initial + 마운트 후 실측 교체.

```tsx
// src/components/weekly/WeeklyCard.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeChart } from "@/lib/chart";
import { coordinatesFor } from "@/lib/coordinates";
import { eventDescription, eventHref, eventTitle } from "@/lib/calendar-copy";
import { kstParts } from "@/lib/retrograde-clock";
import { requestRitual } from "@/lib/ritual";
import { kstWeekStart, weeklyData, weeklyPersonal, type WeeklyData } from "@/lib/weekly-reading";
import { useBirthProfile } from "@/hooks/useBirthProfile";

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 이번 주 카드. 서버 HTML은 빌드 시점의 주를 담고(크롤러가 본문을 본다),
 * 마운트 후 방문자의 "지금"으로 다시 계산한다 — 주가 바뀌어 있으면 새 주가 뜬다.
 */
export function WeeklyCard({ initial, builtAt }: { initial: WeeklyData; builtAt: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const { profile, ready } = useBirthProfile();

  const data = useMemo(() => (now ? weeklyData(now) : initial), [now, initial]);

  const touches = useMemo(() => {
    if (!profile) return null;
    const coordinates = coordinatesFor(profile.city);
    if (!coordinates) return null;
    const natal = computeChart({
      date: profile.date,
      time: profile.time,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezoneOffsetHours: coordinates.timezoneOffsetHours,
    });
    return weeklyPersonal(kstWeekStart(now ?? new Date(builtAt)), natal);
  }, [profile, now, builtAt]);

  const start = kstParts(data.weekStart);
  const endDate = new Date(Date.parse(data.weekStart) + 6 * 86400000 + 9 * 3600000);

  return (
    <section className="border border-gold/20 bg-ink-raised/60 px-7 py-9 md:px-10">
      <p className="text-meta tracking-[0.12em] text-gold-soft">
        {start.month}월 {start.day}일 – {endDate.getUTCMonth() + 1}월 {endDate.getUTCDate()}일
      </p>
      <h2 className="mt-3 break-keep font-display text-2xl text-starlight">{data.headline}</h2>
      <p className="mt-3 max-w-[52ch] break-keep text-guide text-starlight-dim">{data.summary}</p>

      <ul className="mt-8 border-t border-gold/10">
        {data.events.length === 0 && (
          <li className="py-5 text-guide text-starlight-dim">
            일곱 날 모두 큰 이동이 없습니다. 이런 주는 벌여 둔 것을 마저 하는 주입니다.
          </li>
        )}
        {data.events.map((ev) => {
          const p = kstParts(ev.date);
          const dow = DOW_KO[new Date(Date.parse(ev.date) + 9 * 3600000).getUTCDay()];
          const href = eventHref(ev);
          return (
            <li key={ev.kind + ev.date} className="flex gap-5 border-b border-gold/10 py-4 last:border-b-0">
              <span className="w-20 flex-none pt-0.5">
                <span className="text-sm text-gold-soft">{dow}요일</span>
                <span className="block text-meta text-starlight-dim">{p.month}/{p.day}</span>
              </span>
              <div>
                <p className="text-starlight">{eventTitle(ev)}</p>
                <p className="mt-0.5 max-w-[44ch] break-keep text-meta leading-relaxed text-starlight-dim">
                  {eventDescription(ev)}
                  {href && (
                    <>
                      {" "}
                      <Link href={href} className="text-gold-soft hover:text-starlight">자세히 →</Link>
                    </>
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-8 border-l-2 border-gold pl-5">
        {ready && !profile && (
          <p className="break-keep text-guide text-starlight-dim">
            태어난 순간을 넣어 두면, 이 주의 이동이 당신의 별과 닿는 각도가 여기에 덧붙습니다.{" "}
            <button
              type="button"
              onClick={requestRitual}
              className="border-b border-gold/40 pb-px text-gold-soft transition-colors hover:text-starlight"
            >
              내 밤하늘 만들기
            </button>
          </p>
        )}
        {profile && touches && touches.length > 0 && (
          <>
            <p className="font-display text-lg text-gold-soft">내 차트에는</p>
            <ul className="mt-2 space-y-1.5">
              {touches.map((t) => (
                <li key={t.text} className="break-keep text-guide text-starlight-dim">{t.text}</li>
              ))}
            </ul>
          </>
        )}
        {profile && touches && touches.length === 0 && (
          <p className="break-keep text-guide text-starlight-dim">
            이번 주는 당신의 별에 1도 이내로 닿는 각도가 없습니다. 하늘이 조용히 지나가는 주입니다.
          </p>
        )}
        {profile && touches === null && (
          <p className="break-keep text-guide text-starlight-dim">
            &lsquo;{profile.city}&rsquo;의 좌표를 찾지 못해 내 차트와 겹쳐 볼 수 없습니다.
          </p>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 페이지**

```tsx
// src/app/(night-static)/weekly/page.tsx
import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema } from "@/components/seo/JsonLd";
import { NextSteps } from "@/components/nav/NextSteps";
import { PlaceBand } from "@/components/place/PlaceBand";
import { WeeklyCard } from "@/components/weekly/WeeklyCard";
import { alternatesFor, ogImage } from "@/lib/metadata";
import { weeklyData } from "@/lib/weekly-reading";

/**
 * 이번 주 하늘 — /today(하루)와 /yearly(일 년) 사이의 빈 시간 축(2026-08-23 결정).
 * 내용이 주마다 회전하므로 canonical은 /weekly 자신이다.
 */
export const metadata: Metadata = {
  title: "이번 주 하늘 — 주간 점성술 캘린더 | 별샘",
  description:
    "이번 주 하늘에 실제로 일어나는 일을 요일별로: 신월·보름, 역행의 시작과 끝, 태양의 자리 이동. 조용한 주는 조용하다고 말합니다.",
  alternates: alternatesFor("/weekly"),
  openGraph: ogImage("/weekly", "/og/weekly.png"),
};

export default function WeeklyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "이번 주 하늘", path: "/weekly" }])} />
      <PlaceBand src="/world/place-retro.webp" />
      <header className="mx-auto mb-12 max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">THIS WEEK</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">이번 주 하늘</h1>
        <p className="mx-auto mt-4 max-w-md break-keep text-guide text-starlight-dim">
          이레 동안 하늘에 일어나는 일만 골라 담았습니다. 사건이 없는 날은 없다고
          말합니다 — 그것도 정보입니다.
        </p>
      </header>
      <WeeklyCard initial={weeklyData(new Date())} builtAt={new Date().toISOString()} />
      <NextSteps
        lead="한 주보다 넓게 보고 싶다면 — 이 달 전체의 하늘이 달력 한 장에 있습니다."
        primary={{ href: "/calendar", label: "하늘의 달력 보기" }}
        secondary={{ href: "/today", label: "오늘의 하늘 보기" }}
      />
    </main>
  );
}
```

- [ ] **Step 3: 빌드 확인** — `npx tsc --noEmit`, `npm run build`. `Select-String -Path out/weekly.html -Pattern "이번 주 하늘"` → 매치 (크롤러 가시성).

- [ ] **Step 4: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/weekly/WeeklyCard.tsx "src/app/(night-static)/weekly" <변경된 폰트 파일>
git commit -m "feat(weekly): the week between today and the year gets its own page"
```

---

### Task 10: /solar-return 페이지

**Files:**
- Create: `byeolsaem-web/src/components/solar/SolarScope.tsx`
- Create: `byeolsaem-web/src/app/(night-static)/solar-return/page.tsx`
- Modify: `byeolsaem-web/src/lib/example-sky.ts` (exampleSolarReturn 추가)
- Test: `byeolsaem-web/src/test/solar-scope.test.ts`

**Interfaces:**
- Consumes: `solarReturnChart`(Task 4), `EXAMPLE_BIRTH`, `ChartWheel`(`@/components/chart/ChartWheel` — 기존 시그니처는 파일을 열어 확인하고 natal 페이지의 호출을 그대로 따라할 것), `ASCENDANT_ATOMS`(`@/content/atoms/ascendant`), `PLANET_IN_HOUSE`(`@/content/atoms/planet-in-house`), `PLANET_IN_SIGN`(`@/content/atoms/planet-in-sign`), `signAtLongitude`, `useBirthProfile`, `coordinatesFor`, `formatKstDate`
- Produces: 라우트 `/solar-return`. `composeSolarReading(chart: Chart): SolarReading` — 테스트 가능한 순수 함수로 분리.

- [ ] **Step 1: 실패하는 테스트** — 해석 조립의 계약: 세 축이 나오고, 프레임 문장이 완결형.

```ts
// src/test/solar-scope.test.ts
import { describe, expect, it } from "vitest";
import { composeSolarReading } from "@/components/solar/solar-reading";
import { exampleSolarReturn } from "@/lib/example-sky";

describe("composeSolarReading", () => {
  const { chart } = exampleSolarReturn(new Date(Date.UTC(2026, 7, 23)));
  const reading = composeSolarReading(chart);

  it("세 축이 전부 나온다 (시각 있는 예시 차트)", () => {
    expect(reading.ascendant).not.toBeNull();
    expect(reading.sunHouse).not.toBeNull();
    expect(reading.moonSign).not.toBeNull();
  });
  it("각 축은 프레임 + 원자 본문으로 되어 있고 완결 문장이다", () => {
    for (const axis of [reading.ascendant!, reading.sunHouse!, reading.moonSign!]) {
      expect(axis.frame.endsWith("다.")).toBe(true);
      expect(axis.body.endsWith("다.")).toBe(true);
      expect(axis.title.length).toBeGreaterThan(2);
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/solar-scope.test.ts` → FAIL

- [ ] **Step 3: example-sky.ts에 추가**

```ts
// example-sky.ts 상단 import에 추가:
import { solarReturnChart } from "./solar-return";
import type { Chart } from "./chart";

// 파일 끝에 추가:
/**
 * 예시 솔라 리턴 — /solar-return의 정보 없음 화면. EXAMPLE_BIRTH과 같은 사람이다
 * (예시 인물이 페이지마다 다르면 사람처럼 보이기 시작한다 — exampleMeeting 주석 참고).
 * now에 따라 유효한 리턴이 달라지므로 캐시하지 않는다.
 */
export function exampleSolarReturn(now: Date): { instant: Date; nextInstant: Date; chart: Chart } {
  return solarReturnChart(
    {
      date: EXAMPLE_BIRTH.date,
      time: EXAMPLE_BIRTH.time,
      latitude: EXAMPLE_BIRTH.latitude,
      longitude: EXAMPLE_BIRTH.longitude,
      timezoneOffsetHours: EXAMPLE_BIRTH.timezoneOffsetHours,
    },
    now,
  );
}
```

- [ ] **Step 4: 해석 조립 (순수 함수)**

```ts
// src/components/solar/solar-reading.ts
import { ASCENDANT_ATOMS } from "@/content/atoms/ascendant";
import { PLANET_IN_HOUSE } from "@/content/atoms/planet-in-house";
import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import { signAtLongitude } from "@/lib/zodiac";
import type { Chart } from "@/lib/chart";

/**
 * 솔라 리턴 해석 — 새 해석 원자를 만들지 않는다(스펙 결정). 출생 차트용 원자를
 * "올해의" 프레임으로 다시 문맥화한다: 같은 문장이라도 '한 해짜리 첫인상'으로
 * 읽히게 하는 것은 프레임의 일이다.
 */
export interface SolarAxis {
  title: string;
  frame: string;
  body: string;
}
export interface SolarReading {
  ascendant: SolarAxis | null;
  sunHouse: SolarAxis | null;
  moonSign: SolarAxis | null;
}

export function composeSolarReading(chart: Chart): SolarReading {
  const asc = chart.ascendant !== null ? signAtLongitude(chart.ascendant) : null;
  const sun = chart.placements.find((p) => p.planet === "sun");
  const moon = chart.placements.find((p) => p.planet === "moon");

  return {
    ascendant: asc && {
      title: `올해의 첫인상 — ${asc.ko} 상승`,
      frame: "리턴 차트의 상승궁은 이번 한 해 당신이 세상에 나서는 방식입니다. 타고난 것이 아니라 올해만의 옷입니다.",
      body: ASCENDANT_ATOMS[asc.key],
    },
    sunHouse: sun?.house != null ? {
      title: `올해 빛이 모이는 방 — ${sun.house}하우스의 태양`,
      frame: "리턴 태양이 든 하우스는 이번 해의 무게중심입니다. 한 해의 에너지가 이 방으로 모입니다.",
      body: PLANET_IN_HOUSE.sun[sun.house],
    } : null,
    moonSign: moon ? {
      title: `올해 마음이 머무는 곳 — ${moon.sign.ko}의 달`,
      frame: "리턴 달의 자리는 이번 해 마음이 쉬는 방식입니다. 일 년 동안의 기본 감정값으로 읽습니다.",
      body: PLANET_IN_SIGN.moon[moon.sign.key],
    } : null,
  };
}
```

- [ ] **Step 5: 통과 확인** — `npx vitest run src/test/solar-scope.test.ts` → PASS

- [ ] **Step 6: SolarScope 클라이언트 컴포넌트** — 구조는 `ExampleSky`/`NatalReading` 패턴을 따른다. **작성 전에 `src/components/chart/ExampleSky.tsx`와 `src/components/chart/ChartWheel.tsx`를 열어 ChartWheel props와 예시 라벨 마크업을 그대로 가져올 것.** 뼈대:

```tsx
// src/components/solar/SolarScope.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { coordinatesFor } from "@/lib/coordinates";
import { solarReturnChart } from "@/lib/solar-return";
import { exampleSolarReturn } from "@/lib/example-sky";
import { EXAMPLE_BIRTH } from "@/lib/example-sky";
import { formatKstDate } from "@/lib/retrograde-clock";
import { requestRitual } from "@/lib/ritual";
import { composeSolarReading, type SolarAxis } from "./solar-reading";
// + ChartWheel import — 기존 natal 화면과 같은 방식으로

export function SolarScope() {
  const { profile, ready } = useBirthProfile();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const mine = useMemo(() => {
    if (!profile || !now) return null;
    const coordinates = coordinatesFor(profile.city);
    if (!coordinates) return null;
    return solarReturnChart(
      {
        date: profile.date, time: profile.time,
        latitude: coordinates.latitude, longitude: coordinates.longitude,
        timezoneOffsetHours: coordinates.timezoneOffsetHours,
      },
      now,
    );
  }, [profile, now]);

  // 서버 HTML과 첫 그림은 언제나 예시 쪽(WithoutBirthProfile 원칙)
  const data = mine ?? exampleSolarReturn(now ?? new Date());
  const reading = composeSolarReading(data.chart);
  const isExample = mine === null;
  // 렌더: (1) 예시면 EXAMPLE_BIRTH.label + "예시입니다" 배너 + 내 정보 넣기 버튼(requestRitual)
  //       (2) 유효 기간 줄: `${formatKstDate(data.instant.toISOString())} ~ ${formatKstDate(data.nextInstant.toISOString())}`
  //       (3) ChartWheel — natal과 같은 호출
  //       (4) 세 축: <AxisSection axis={reading.ascendant}/> 순서대로. axis null이면 건너뜀
  //           (시각 없는 profile.time === null이면 상승궁·하우스 축이 자연히 빠진다 — 그 경우
  //            "태어난 시각을 알면 두 축이 더 열립니다" 한 줄을 대신 보여준다)
  // …프리뷰 승인 톤과 기존 natal 화면의 계층을 그대로 따를 것.
}

function AxisSection({ axis }: { axis: SolarAxis }) {
  return (
    <section className="mt-12">
      <h2 className="break-keep font-display text-xl text-starlight">{axis.title}</h2>
      <p className="mt-2 max-w-[56ch] break-keep text-meta text-gold-soft">{axis.frame}</p>
      <p className="mt-3 max-w-[62ch] break-keep leading-relaxed text-starlight-dim">{axis.body}</p>
    </section>
  );
}
```

- [ ] **Step 7: 페이지**

```tsx
// src/app/(night-static)/solar-return/page.tsx
import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { NextSteps } from "@/components/nav/NextSteps";
import { PlaceBand } from "@/components/place/PlaceBand";
import { SolarScope } from "@/components/solar/SolarScope";
import { alternatesFor, ogImage } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "솔라 리턴 — 생일마다 새로 그려지는 한 해의 차트 | 별샘",
  description:
    "태양이 태어난 순간의 자리로 돌아오는 순간, 그때의 하늘로 생일부터 다음 생일까지 한 해를 읽습니다. 무료로 계산해 드립니다.",
  alternates: alternatesFor("/solar-return"),
  openGraph: ogImage("/solar-return", "/og/solar-return.png"),
};

const FAQS = [
  {
    question: "솔라 리턴이 무엇인가요?",
    answer:
      "태양이 당신이 태어난 순간의 위치로 정확히 돌아오는 순간의 하늘입니다. 해마다 생일 근방에 한 번 오고, 그 차트로 생일부터 다음 생일까지의 한 해를 읽습니다.",
  },
  {
    question: "생일과 같은 날인가요?",
    answer:
      "거의 같지만 꼭 같지는 않습니다. 지구의 공전이 달력과 조금씩 어긋나서, 리턴 순간은 생일 앞뒤 하루 사이에서 해마다 움직입니다. 별샘은 그 순간을 분 단위로 계산합니다.",
  },
  {
    question: "장소는 어디 기준인가요?",
    answer:
      "별샘은 출생지 기준으로 세웁니다. 리턴 순간의 현재 위치로 세우는 유파도 있지만, 별샘은 위치 정보를 수집하지 않기 때문에 출생지 관례를 따릅니다.",
  },
];

export default function SolarReturnPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "솔라 리턴", path: "/solar-return" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <PlaceBand src="/world/place-natal.webp" />
      <header className="mx-auto mb-12 max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">SOLAR RETURN</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">솔라 리턴</h1>
        <p className="mx-auto mt-4 max-w-md break-keep text-guide text-starlight-dim">
          해마다 생일 무렵, 태양은 당신이 태어난 순간의 자리로 정확히 돌아옵니다.
          그 순간의 하늘이 다음 생일까지 한 해의 지도가 됩니다.
        </p>
      </header>
      <SolarScope />
      {/* FAQ 섹션 — venus 페이지의 <Faq> 패턴 그대로 (RetroPageBits의 Faq 재사용) */}
      <NextSteps
        lead="한 해의 지도를 봤다면, 그 해를 지나는 느린 별들의 날짜도 함께 보세요."
        primary={{ href: "/yearly", label: "한 해의 하늘 보기" }}
        secondary={{ href: "/natal", label: "내 천궁도 보기" }}
      />
    </main>
  );
}
```

(`place-natal.webp`가 없으면 `Get-ChildItem public/world`로 실제 파일명을 확인해 natal 페이지가 쓰는 것과 같은 것을 쓸 것.)

- [ ] **Step 8: 빌드 확인** — `npx tsc --noEmit`, `npm run build`, `Select-String -Path out/solar-return.html -Pattern "올해의 첫인상"` → 매치 (예시가 서버 HTML에 있음)

- [ ] **Step 9: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/solar "src/app/(night-static)/solar-return" src/lib/example-sky.ts src/test/solar-scope.test.ts <변경된 폰트 파일>
git commit -m "feat(solar-return): the birthday sky becomes a year's map"
```

---

### Task 11: OG 카드 3장 + 사이트맵 + 프리페치

**Files:**
- Modify: `byeolsaem-web/scripts/build-og.mjs` (PAGE_CARDS)
- Modify: `byeolsaem-web/src/app/sitemap.ts`
- Modify: `byeolsaem-web/scripts/prefetch-chunks.mjs` (NAV_TARGETS)

- [ ] **Step 1: PAGE_CARDS에 추가** (`build-og.mjs` 255행 배열 끝):

```js
  { file: "calendar.png", eyebrow: "SKY CALENDAR", title: "하늘의 달력", sub: "신월과 보름, 역행의 시작과 끝", motif: "wheel" },
  { file: "weekly.png", eyebrow: "THIS WEEK", title: "이번 주 하늘", sub: "이레 동안 하늘에 일어나는 일", motif: "horizon" },
  { file: "solar-return.png", eyebrow: "SOLAR RETURN", title: "솔라 리턴", sub: "생일마다 새로 그려지는 일 년의 지도", motif: "rings" },
```

- [ ] **Step 2: 카드 생성** — `node --experimental-strip-types scripts/build-og.mjs` → `og/calendar.png`·`og/weekly.png`·`og/solar-return.png` 출력 확인. (전 카드가 재생성되지만 STARS가 고정 좌표라 기존 파일은 diff 없음 — `git status`로 새 3장만 뜨는지 확인.)

- [ ] **Step 3: sitemap.ts** — import에 `calendarMonths` 추가, `tools` 배열에:

```ts
    { url: `${BASE}/weekly`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/calendar`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/solar-return`, changeFrequency: "monthly", priority: 0.8 },
```

`posts` 아래에 월별 12장:

```ts
  const months: MetadataRoute.Sitemap = calendarMonths(new Date()).map((m) => ({
    url: `${BASE}/calendar/${m.year}/${String(m.month).padStart(2, "0")}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));
```

return에 `...months` 포함.

- [ ] **Step 4: prefetch-chunks.mjs** — `NAV_TARGETS`에 `"calendar.html"`, `"weekly.html"`, `"solar-return.html"` 추가. (월별 페이지는 넣지 않는다 — 허브의 청크와 같다.)

- [ ] **Step 5: 빌드 확인** — `npm run build`. postbuild 로그에서 청크 합집합 수가 이전(24개)보다 늘었는지, sitemap.xml에 `/calendar/`가 있는지: `Select-String -Path out/sitemap.xml -Pattern "calendar/2026"` → 매치.

- [ ] **Step 6: 커밋**

```bash
git add scripts/build-og.mjs scripts/prefetch-chunks.mjs src/app/sitemap.ts public/og/calendar.png public/og/weekly.png public/og/solar-return.png
git commit -m "feat(seo): the three new pages get cards, sitemap rows, and prefetch"
```

---

### Task 12: PWA

**Files:**
- Create: `byeolsaem-web/scripts/build-pwa-icons.mjs`
- Create: `byeolsaem-web/public/manifest.webmanifest`
- Modify: `byeolsaem-web/src/app/layout.tsx`
- Test: `byeolsaem-web/src/test/manifest.test.ts`

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/manifest.test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  const raw = readFileSync(join(__dirname, "..", "..", "public", "manifest.webmanifest"), "utf-8");
  const manifest = JSON.parse(raw);

  it("설치에 필요한 필드가 전부 있다", () => {
    expect(manifest.name).toBe("별샘");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable")).toBe(true);
  });
  it("테마색이 사이트 잉크색이다", () => {
    expect(manifest.theme_color).toBe("#0b1026");
    expect(manifest.background_color).toBe("#0b1026");
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/manifest.test.ts` → FAIL

- [ ] **Step 3: manifest**

```json
{
  "name": "별샘",
  "short_name": "별샘",
  "description": "당신이 태어난 밤, 하늘은 기억하고 있어요",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0b1026",
  "theme_color": "#0b1026",
  "icons": [
    { "src": "/pwa/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/pwa/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/pwa/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 4: 아이콘 스크립트** — build-og.mjs와 같은 satori 파이프라인. build-og.mjs의 폰트 로드 방식(파일 하단 `render` 부근)을 열어 그대로 가져올 것.

```js
// scripts/build-pwa-icons.mjs
/**
 * PWA 아이콘 — build-og와 같은 satori 렌더라 수작업 에셋이 없다.
 * 잉크 바탕에 금색 별 하나 + "별샘". maskable은 안전 영역(중앙 80%) 안에 그린다.
 * 아이콘이 바뀔 일이 생기면 이 스크립트를 고치고 다시 돌린다:
 *   node --experimental-strip-types scripts/build-pwa-icons.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { ImageResponse } from "next/og.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "pwa");
const h = React.createElement;
const INK = "#0b1026";
const GOLD = "#e3c568";

// 폰트 로드: build-og.mjs와 동일한 MaruBuri woff/ttf 경로를 복사해 올 것.
const font = await readFile(join(ROOT, /* build-og.mjs가 쓰는 폰트 경로 그대로 */));

function icon(size, maskable) {
  const scale = maskable ? 0.72 : 0.92; // maskable은 원형 마스크 안쪽에 들어가야 한다
  const starSize = Math.round(size * 0.34 * scale);
  const fontSize = Math.round(size * 0.22 * scale);
  return h("div", {
    style: {
      width: "100%", height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: INK,
      fontFamily: "MaruBuri", gap: Math.round(size * 0.04),
    },
  }, [
    h("div", { key: "star", style: { display: "flex", color: GOLD, fontSize: starSize, lineHeight: 1 } }, "✦"),
    h("div", { key: "name", style: { display: "flex", color: GOLD, fontSize, letterSpacing: Math.round(size * 0.02) } }, "별샘"),
  ]);
}

await mkdir(OUT, { recursive: true });
for (const [name, size, maskable] of [["icon-192.png", 192, false], ["icon-512.png", 512, false], ["icon-512-maskable.png", 512, true]]) {
  const res = new ImageResponse(icon(size, maskable), {
    width: size, height: size,
    fonts: [{ name: "MaruBuri", data: font, style: "normal" }],
  });
  await writeFile(join(OUT, name), Buffer.from(await res.arrayBuffer()));
  console.log(`pwa/${name}`);
}
```

("✦"가 MaruBuri 서브셋에 없으면 satori가 빈 칸을 그린다 — 그 경우 별 대신 div 원+선 조합(build-og의 MOTIFS 방식)으로 대체할 것.)

- [ ] **Step 5: 아이콘 생성** — `node --experimental-strip-types scripts/build-pwa-icons.mjs` → 3파일. 512 아이콘을 열어 눈검사(글자 잘림·빈 칸 여부).

- [ ] **Step 6: layout.tsx** — `metadata`에 `manifest: "/manifest.webmanifest"` 추가. `viewport` export가 이미 있으면 `themeColor: "#0b1026"`를 더하고, 없으면:

```ts
import type { Viewport } from "next";
export const viewport: Viewport = { themeColor: "#0b1026" };
```

- [ ] **Step 7: 통과 확인** — `npx vitest run src/test/manifest.test.ts` → PASS. `npm run build` 후 `Select-String -Path out/index.html -Pattern "manifest.webmanifest"` → 매치.

- [ ] **Step 8: 커밋**

```bash
git add public/manifest.webmanifest public/pwa scripts/build-pwa-icons.mjs src/app/layout.tsx src/test/manifest.test.ts
git commit -m "feat(pwa): the site learns to live on a home screen"
```

---

### Task 13: 내비 개편 — 전체화면 오버레이

**Files:**
- Create: `byeolsaem-web/src/components/nav/nav-map.ts`
- Create: `byeolsaem-web/src/lib/nav-ambient.ts`
- Create: `byeolsaem-web/src/components/nav/AmbientLine.tsx`
- Rewrite: `byeolsaem-web/src/components/nav/Veil.tsx`
- Create: `byeolsaem-web/src/components/nav/NavVeil.tsx`
- Modify: `<Veil />`를 렌더하는 레이아웃들 (`Grep "Veil" src/app`으로 찾아 `<NavVeil />`로 교체)
- Test: `byeolsaem-web/src/test/nav-ambient.test.ts`

**Interfaces:**
- Consumes: `lunationsBetween`(Task 1), `retrogradesOf`, `moonPosition`(`./moon`), `signAtLongitude`, `toJulianDay`/`fromJulianDay`, `retrogradeStatus`형 계산은 클라이언트에서 props로
- Produces: `navAmbient(now: Date): NavAmbient` (서버 전용 — 클라이언트 번들에 천문 엔진이 실리면 안 된다. `AmbientLine`은 props만 읽는다.)

- [ ] **Step 1: nav-map.ts** — 프리뷰 확정 문구 그대로:

```ts
// src/components/nav/nav-map.ts
/**
 * 내비게이션의 단일 소스 — 헤더 직통·오버레이 그룹이 전부 여기서 나온다.
 * 페이지가 늘면 이 파일만 늘린다(2026-08-23 IA 개편).
 */
export interface NavLink {
  href: string;
  label: string;
  desc: string;
}
export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const DIRECT_LINKS = [
  { href: "/today", label: "오늘" },
  { href: "/natal", label: "천궁도" },
  { href: "/synastry", label: "궁합" },
] as const;

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "하늘의 시간",
    links: [
      { href: "/today", label: "오늘의 하늘", desc: "지금 이 순간 열 개의 별이 있는 자리" },
      { href: "/weekly", label: "이번 주", desc: "이레 동안 하늘에 일어나는 일" },
      { href: "/calendar", label: "하늘의 달력", desc: "신월과 보름, 역행의 시작과 끝" },
      { href: "/retrograde", label: "역행", desc: "수성 · 금성 · 화성이 물러서는 날들" },
    ],
  },
  {
    label: "나의 별",
    links: [
      { href: "/natal", label: "내 천궁도", desc: "태어난 순간의 하늘 전부" },
      { href: "/yearly", label: "한 해의 하늘", desc: "올해 내 별들을 지나는 흐름" },
      { href: "/solar-return", label: "솔라 리턴", desc: "생일마다 새로 그려지는 일 년의 지도" },
      { href: "/synastry", label: "궁합", desc: "두 하늘이 겹칠 때 생기는 각도" },
    ],
  },
  {
    label: "읽을거리",
    links: [
      { href: "/sign", label: "열두 별자리", desc: "각 자리의 성격과 곁에 서는 자리들" },
      { href: "/blog", label: "칼럼", desc: "별을 읽는 법에 대한 글" },
    ],
  },
];

/** 금색 새 표시(●). 출시 4주 뒤(2026-09-20께) 이 배열을 비운다. */
export const NAV_NEW: string[] = ["/weekly", "/calendar", "/solar-return"];
```

- [ ] **Step 2: nav-ambient 테스트**

```ts
// src/test/nav-ambient.test.ts
import { describe, expect, it } from "vitest";
import { navAmbient } from "@/lib/nav-ambient";

describe("navAmbient", () => {
  const ambient = navAmbient(new Date(Date.UTC(2026, 7, 23)));

  it("달 자리 구간이 60일을 덮고 시간순이다", () => {
    expect(ambient.moonSegments.length).toBeGreaterThan(20); // 달은 자리마다 2~3일
    for (let i = 1; i < ambient.moonSegments.length; i += 1) {
      expect(ambient.moonSegments[i].until > ambient.moonSegments[i - 1].until).toBe(true);
    }
  });
  it("다가오는 삭망이 있다", () => {
    expect(ambient.lunations.length).toBeGreaterThanOrEqual(2);
  });
  it("역행 구간에 세 행성 정보가 담긴다 (미래 창 안의 것)", () => {
    // 2026-10-03 금성, 10-24 수성이 60일 창 안에 있다
    expect(ambient.retro.some((r) => r.planet === "venus")).toBe(true);
  });
});
```

- [ ] **Step 3: nav-ambient.ts**

```ts
// src/lib/nav-ambient.ts
import { fromJulianDay, toJulianDay } from "./ephemeris";
import { lunationsBetween, type Lunation } from "./lunation";
import { moonPosition } from "./moon";
import { retrogradesOf, type RetroPlanet } from "./retrograde";
import { signAtLongitude } from "./zodiac";

/**
 * 오버레이 메뉴의 "지금 하늘" 한 줄이 쓰는 데이터. 서버(빌드)에서만 계산한다 —
 * 천문 엔진이 내비 때문에 클라이언트 번들에 실리면 안 된다(retrograde-clock의
 * 분리 원칙과 동일). 클라이언트는 이 표에서 now에 맞는 조각을 고르기만 한다.
 * 값이 시각의 함수가 아니라 표라서, 배포가 며칠 묵어도 어긋나지 않는다.
 */
export interface NavAmbient {
  builtAt: string;
  /** 달이 이 시각(ISO)까지 이 자리에 있다 — 60일치, 시간순. */
  moonSegments: { until: string; signKo: string }[];
  /** 다가오는 삭망 — 60일치. */
  lunations: Lunation[];
  /** 60일 창과 겹치는 역행 구간. */
  retro: { planet: RetroPlanet; planetKo: string; start: string; end: string }[];
}

const DAY_MS = 86400000;
const WINDOW_DAYS = 60;
const PRECISION_DAYS = 0.0002;
const PLANET_KO: Record<RetroPlanet, string> = { mercury: "수성", venus: "금성", mars: "화성" };

function moonSignIndex(jd: number): number {
  return Math.floor(moonPosition(jd).longitude / 30) % 12;
}

export function navAmbient(now: Date): NavAmbient {
  const startJd = toJulianDay(now);
  const endJd = startJd + WINDOW_DAYS;

  // 달은 하루 13도 — 0.25일 걸음이면 경계를 놓치지 않는다.
  const moonSegments: { until: string; signKo: string }[] = [];
  let prevJd = startJd;
  let prevIdx = moonSignIndex(prevJd);
  for (let jd = startJd + 0.25; jd <= endJd; jd += 0.25) {
    const idx = moonSignIndex(jd);
    if (idx !== prevIdx) {
      let low = prevJd;
      let high = jd;
      while (high - low > PRECISION_DAYS) {
        const mid = (low + high) / 2;
        if (moonSignIndex(mid) === prevIdx) low = mid;
        else high = mid;
      }
      moonSegments.push({ until: fromJulianDay((low + high) / 2).toISOString(), signKo: signAtLongitude(prevIdx * 30 + 1).ko });
      prevIdx = idx;
    }
    prevJd = jd;
  }
  moonSegments.push({ until: fromJulianDay(endJd).toISOString(), signKo: signAtLongitude(prevIdx * 30 + 1).ko });

  const windowEnd = new Date(now.getTime() + WINDOW_DAYS * DAY_MS);
  const retro: NavAmbient["retro"] = [];
  for (const planet of ["mercury", "venus", "mars"] as const) {
    for (const p of retrogradesOf(planet, new Date(now.getTime() - 120 * DAY_MS), new Date(windowEnd.getTime() + 120 * DAY_MS))) {
      if (Date.parse(p.end) >= now.getTime() && Date.parse(p.start) < windowEnd.getTime()) {
        retro.push({ planet, planetKo: PLANET_KO[planet], start: p.start, end: p.end });
      }
    }
  }

  return {
    builtAt: now.toISOString(),
    moonSegments,
    lunations: lunationsBetween(now, windowEnd),
    retro,
  };
}
```

- [ ] **Step 4: 테스트 통과** — `npx vitest run src/test/nav-ambient.test.ts` → PASS

- [ ] **Step 5: AmbientLine (클라이언트, props만)**

```tsx
// src/components/nav/AmbientLine.tsx
"use client";
import { useEffect, useState } from "react";
import type { NavAmbient } from "@/lib/nav-ambient";

const DAY_MS = 86400000;

/** 오버레이 하단의 한 줄 — 열릴 때의 '지금'으로 계산한다. 표는 서버가 만들었다. */
export function AmbientLine({ ambient }: { ambient: NavAmbient }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  if (!now) return null;

  const t = now.getTime();
  const moon = ambient.moonSegments.find((s) => Date.parse(s.until) > t);
  const nextLunation = ambient.lunations.find((l) => Date.parse(l.date) > t);
  const active = ambient.retro.find((r) => Date.parse(r.start) <= t && t < Date.parse(r.end));
  const upcoming = ambient.retro
    .filter((r) => Date.parse(r.start) > t)
    .sort((a, b) => a.start.localeCompare(b.start))[0];

  const parts: string[] = [];
  if (moon) parts.push(`오늘 달은 ${moon.signKo}`);
  if (nextLunation) {
    const dday = Math.ceil((Date.parse(nextLunation.date) - t) / DAY_MS);
    parts.push(`다음 ${nextLunation.kind === "new" ? "신월" : "보름"}까지 ${dday}일`);
  }
  if (active) parts.push(`${active.planetKo} 역행 중`);
  else if (upcoming) {
    const dday = Math.ceil((Date.parse(upcoming.start) - t) / DAY_MS);
    parts.push(`${upcoming.planetKo} 역행까지 ${dday}일`);
  }
  if (parts.length === 0) return null;

  return (
    <p className="text-center text-meta tracking-[0.1em] text-starlight-dim">
      {parts.join(" · ")}
    </p>
  );
}
```

- [ ] **Step 6: Veil.tsx 재작성** — 프리뷰 아티팩트 확정 구조. 유지할 것: 스크롤 센티넬, Escape, body 스크롤 잠금, BirthMenu 자리(헤더 인장 + 오버레이 하단 sheet). 바꿀 것: 직통 3개(`DIRECT_LINKS`, `max-md:hidden`), "메뉴" 버튼(두 줄 아이콘 + 글자 — 열리면 X 변형, 기존 두 줄 스팬 로직 재사용), 오버레이는 전 해상도 공용.

핵심 마크업 (전체 파일은 기존 Veil의 상태 로직 + 아래 구조):

```tsx
// 오버레이 (기존 mobile-nav-overlay를 대체):
<div
  id="fullscreen-nav"
  inert={!open}
  aria-hidden={!open}
  className={`nebula-bg fixed inset-0 z-30 flex flex-col transition-opacity duration-300 ${
    open ? "opacity-100" : "pointer-events-none opacity-0"
  }`}
>
  <div className="h-16 flex-none" /> {/* 헤더 높이만큼 비운다 — 헤더는 위에 그대로 떠 있다 */}
  <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-8">
    <div className="grid w-full max-w-4xl gap-10 md:grid-cols-3 md:gap-14">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="border-b border-gold/20 pb-2.5 text-meta tracking-[0.28em] text-gold-soft">
            {group.label}
          </p>
          {group.links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${60 + i * 60}ms` : "0ms" }}
              className={`group mt-5 block transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 ${
                open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
              }`}
            >
              <span className="font-display text-xl text-starlight transition-colors group-hover:text-gold-soft">
                {link.label}
                {NAV_NEW.includes(link.href) && (
                  <span aria-hidden className="ml-1.5 align-super text-[0.55em] text-gold">●</span>
                )}
                {link.href === "/retrograde" && <RetroBadge retro={ambient.retro} />}
              </span>
              <span className="mt-0.5 block break-keep text-meta text-starlight-dim">{link.desc}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  </div>
  <div className="flex-none pb-7">
    <AmbientLine ambient={ambient} />
    <div className="mt-4 flex justify-center md:hidden">
      <BirthMenu variant="sheet" onNavigate={() => setOpen(false)} />
    </div>
  </div>
</div>
```

`RetroBadge` — Veil 파일 안의 작은 클라이언트 조각. `ambient.retro`에서 지금 역행 중이면 `역행 중`, 아니면 가장 가까운 시작의 `D-n`을 `<span className="ml-2 border border-gold/25 px-1.5 py-0.5 align-middle font-sans text-[0.6rem] tracking-[0.08em] text-gold">` 로. AmbientLine과 같은 계산이라 헬퍼를 nav-map가 아닌 Veil 내부 함수로 공유.

`Veil`의 props: `export function Veil({ ambient }: { ambient: NavAmbient })`.

- [ ] **Step 7: NavVeil + 레이아웃 교체**

```tsx
// src/components/nav/NavVeil.tsx
import { navAmbient } from "@/lib/nav-ambient";
import { Veil } from "./Veil";

/** 서버에서 앰비언트 표를 계산해 클라이언트 Veil에 넘긴다. */
export function NavVeil() {
  return <Veil ambient={navAmbient(new Date())} />;
}
```

`Grep "Veil" src/app --files_with_matches`로 찾은 레이아웃마다 `import { Veil } … <Veil />`을 `import { NavVeil } … <NavVeil />`로.

- [ ] **Step 8: 빌드 + 번들 검증** — `npx tsc --noEmit`, `npm run build`. **천문 엔진이 클라이언트로 새지 않았는지**: `Select-String -Path out/_next/static/chunks/*.js -Pattern "ORBITAL_ELEMENTS" -List`의 매치 파일 수가 개편 전과 같은지 (전: TodayCard 등이 쓰는 청크에만 있음. 늘었다면 Veil이 서버 전용 모듈을 직접 물었다는 뜻 — AmbientLine이 props만 받는지 확인).

- [ ] **Step 9: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/nav/nav-map.ts src/components/nav/AmbientLine.tsx src/components/nav/Veil.tsx src/components/nav/NavVeil.tsx src/lib/nav-ambient.ts src/test/nav-ambient.test.ts <교체된 레이아웃 파일들> <변경된 폰트 파일>
git commit -m "feat(nav): the mobile overlay grows up to hold the whole sky"
```

---

### Task 14: 상호링크 + 최종 검증 + 배포

**Files:**
- Modify: 기존 페이지들의 NextSteps/링크 (아래 목록)
- 검증만: 나머지

- [ ] **Step 1: 상호링크** — 자연스러운 자리에만(스펙: 달력 ↔ 역행 ↔ 위클리, 솔라 리턴 ↔ 한 해 ↔ 천궁도):
  - `/retrograde` 3형제의 하단 GoldButton 중 secondary 하나를 `/calendar`("하늘의 달력 보기")로 — 단 venus 페이지처럼 이미 두 버튼이 natal/형제 역행인 곳은 형제 역행이 RetroRails로 대체됐으므로 secondary를 달력으로 바꾼다.
  - `/today`의 TodayCard 아래나 기존 NextSteps에 `/weekly` 링크가 없으면 추가.
  - `/yearly`의 NextSteps secondary를 `/solar-return`으로.
  각 파일을 열어 기존 lead 문구 톤에 맞춰 한 줄씩 수정.

- [ ] **Step 2: 전체 테스트 + 빌드**

```
npx vitest run          → 전부 PASS
npx tsc --noEmit        → 에러 0
npm run build           → 성공, postbuild 로그(프리페치 + sky.ics) 확인
```

- [ ] **Step 3: 커밋 + 배포**

```bash
git add <1단계에서 수정한 페이지 파일들>
git commit -m "feat(links): the new pages join the site's walking paths"
```

레포 루트에서 `npx wrangler deploy`.

- [ ] **Step 4: dev-browser 실측** (배포 전파 수십 초 대기 후):
  1. `/calendar` — 그리드·목록·구독 행 렌더. "다음 달 ›" 클릭 → URL이 `/calendar/YYYY/MM`로, 그리드가 옆으로 미끄러지는지(시각 확인은 스크린샷).
  2. `/weekly` — 사건 목록 렌더. localStorage 클리어 상태에서 "내 밤하늘 만들기" 유도문 노출.
  3. `/solar-return` — localStorage 클리어 상태에서 예시 차트 + "올해의 첫인상" 노출.
  4. 아무 페이지에서 "메뉴" 클릭 — 오버레이 3그룹 + 하단 앰비언트 줄 + 역행 뱃지. Escape로 닫힘. 390px에서 1열 + BirthMenu.
  5. `https://byeolsaem.com/sky.ics` — BEGIN:VCALENDAR로 시작하는 응답.
  6. `/manifest.webmanifest` — 200 JSON.
  7. 콘솔 에러 0.
- [ ] **Step 5: 문제 없으면 push** — `git push`. 사용자에게 GSC·네이버 수집 요청 대상 URL 목록 전달: `/calendar`, `/weekly`, `/solar-return` (+월별은 사이트맵이 처리).

---

## 셀프 리뷰 결과 (계획 작성 시점)

- 스펙 커버리지: 계산 3종(T1–4) ✓ 달력+VT(T5–6) ✓ ics(T7) ✓ 위클리(T8–9) ✓ 솔라리턴(T10) ✓ OG/사이트맵/프리페치(T11) ✓ PWA(T12) ✓ 내비(T13) ✓ 상호링크·검증(T14) ✓ — 스펙의 "하지 않는 것"은 어느 태스크에도 없음.
- 타입 일관성: `CalendarEvent`·`calendarMonths`·`WeeklyData`·`NavAmbient` 시그니처가 생산 태스크와 소비 태스크에서 동일함을 확인.
- 미확정 지점 2곳은 태스크 안에 확인 지시로 명시: ChartWheel props(T10 Step 6), build-og 폰트 경로(T12 Step 4).
