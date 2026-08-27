# 인생의 시간표(/chapters) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 연간 프로펙션과 조디악 릴리징을 한 페이지(/chapters)로 — 전부 클라이언트 순수 산술, 출생 시각 필수.

**Architecture:** 신규 계산 라이브러리 `src/lib/time-lords.ts`가 기존 `computeChart` 결과를 받아 프로펙션·점(Lot)·릴리징을 산술로 만든다. 페이지는 (night-static) SSG 셸 + 클라이언트 `ChaptersScope`(SolarScope 패턴)가 마운트 후 저장 프로필로 계산해 채운다. 백엔드 수정 없음.

**Tech Stack:** Next.js 16(App Router, output export) · React 19 · Tailwind 4 · Vitest. 작업 디렉터리는 전부 `byeolsaem-web/`.

## Global Constraints

- **시각 미상이면 계산하지 않는다.** `chart.ascendant === null`이면 모든 time-lords 함수는 `null`. 임의 시각(정오 등) 대입 금지, 반쪽 표시 금지.
- **전통 지배성 사용.** `ZODIAC_SIGNS[].ruler`는 현대 지배성(전갈=명왕성, 물병=천왕성, 물고기=해왕성)이라 쓰면 안 된다 — `TRADITIONAL_RULER` 상수를 쓴다.
- **자리별 연수표(정확히 이 값):** 양 15 · 황소 8 · 쌍둥이 20 · 게 25 · 사자 19 · 처녀 20 · 천칭 8 · 전갈 15 · 사수 12 · 염소 27 · 물병 27 · 물고기 12.
- **각(角) 판정은 릴리징을 어느 점에서 돌리든 항상 행운의 점 자리 기준.**
- 주소 `/chapters`, 메뉴 문구 "인생의 시간표"(나의 별 그룹), NAV_NEW 추가.
- 커밋 메시지에 here-string(@'…'@) 금지 — `-m "..."` 한 줄 또는 `-m` 여러 개.
- `git add -A` 금지 — 파일을 명시해 스테이징.
- 페이지 메타 description(원문 고정): "연간 프로펙션으로 올해의 별자리와 주인 행성을, 조디악 릴리징으로 인생의 장을 계산합니다. 태어난 순간에 감긴 시계를 읽는 고전 점성술의 시간법 — 무료, 로그인 없음."

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/time-lords.ts` (신규) | 프로펙션·점·릴리징 계산 전부. UI 무관, 순수 함수 |
| `src/lib/__tests__/time-lords.test.ts` (신규) | 위 라이브러리의 전 규칙 검증 |
| `src/app/(night-static)/chapters/page.tsx` (신규) | SSG 셸: 메타·JSON-LD·헤더·개념 설명·FAQ |
| `src/components/chapters/ChaptersScope.tsx` (신규) | 프로필 게이트(없음/좌표실패/시각미상) + 두 섹션 배선 |
| `src/components/chapters/ProfectionSection.tsx` (신규) | 올해 카드 + 12년 스트립 |
| `src/components/chapters/ReleasingSection.tsx` (신규) | 점 토글 + L1 타임라인 + L2 스트립 + 범례 |
| `src/components/nav/nav-map.ts` (수정) | 메뉴·NAV_NEW |
| `src/app/sitemap.ts` (수정) | /chapters 0.6 |
| `scripts/build-og.mjs` (수정) | chapters.png 카드 |

---

### Task 1: time-lords 기초 — 상수와 연간 프로펙션

**Files:**
- Create: `src/lib/time-lords.ts`
- Test: `src/lib/__tests__/time-lords.test.ts`

**Interfaces:**
- Consumes: `Chart`, `BirthMoment` (`src/lib/chart.ts`), `ZODIAC_SIGNS`, `ZodiacSign` (`src/lib/zodiac.ts` — 배열 0번이 양자리).
- Produces (뒤 태스크가 그대로 씀):
  - `TRADITIONAL_RULER: string[]` (자리 인덱스 → 한글 행성명)
  - `SIGN_YEARS: number[]` (자리 인덱스 → 연수)
  - `ageOn(natalDate: string, now: Date): number`
  - `interface ProfectionYear { age: number; from: string; to: string; sign: ZodiacSign; house: number; lordKo: string }`
  - `currentProfection(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear | null`
  - `profectionYears(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear[] | null` (현재−2 ~ 현재+9, 12칸)

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/__tests__/time-lords.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeChart, type BirthMoment } from "../chart";
import { ZODIAC_SIGNS } from "../zodiac";
import {
  TRADITIONAL_RULER,
  SIGN_YEARS,
  ageOn,
  currentProfection,
  profectionYears,
} from "../time-lords";

/** 예시 인물과 같은 값 — 시각이 있어 상승궁이 선다. */
const NATAL: BirthMoment = {
  date: "1995-07-14",
  time: "09:30",
  latitude: 37.5665,
  longitude: 126.978,
  timezoneOffsetHours: 9,
};
const CHART = computeChart(NATAL);
/** 시각 미상 — 모든 계산이 null이어야 한다. */
const NATAL_NO_TIME: BirthMoment = { ...NATAL, time: null };
const CHART_NO_TIME = computeChart(NATAL_NO_TIME);

describe("전통 지배성과 연수표", () => {
  it("전통 지배성 — 현대 지배성(명왕성·천왕성·해왕성)이 없다", () => {
    expect(TRADITIONAL_RULER[7]).toBe("화성"); // 전갈
    expect(TRADITIONAL_RULER[10]).toBe("토성"); // 물병
    expect(TRADITIONAL_RULER[11]).toBe("목성"); // 물고기
    expect(TRADITIONAL_RULER).not.toContain("명왕성");
    expect(TRADITIONAL_RULER).not.toContain("천왕성");
    expect(TRADITIONAL_RULER).not.toContain("해왕성");
  });

  it("연수표가 스펙 값 그대로다", () => {
    expect(SIGN_YEARS).toEqual([15, 8, 20, 25, 19, 20, 8, 15, 12, 27, 27, 12]);
  });
});

describe("ageOn — 달력 생일 경계(KST)", () => {
  it("생일 전날은 n-1, 생일 당일은 n", () => {
    // 1995-07-14생. KST 2026-07-13 = 만 30, 2026-07-14 = 만 31.
    // Date는 UTC로 만들어 KST 정오가 되게 03:00Z를 쓴다.
    expect(ageOn("1995-07-14", new Date("2026-07-13T03:00:00Z"))).toBe(30);
    expect(ageOn("1995-07-14", new Date("2026-07-14T03:00:00Z"))).toBe(31);
  });
});

describe("연간 프로펙션", () => {
  const now = new Date("2026-08-26T03:00:00Z"); // 만 31세
  const current = currentProfection(NATAL, CHART, now)!;

  it("나이와 방 번호 — house = (age % 12) + 1", () => {
    expect(current.age).toBe(31);
    expect(current.house).toBe((31 % 12) + 1); // 8
  });

  it("자리 = 상승 자리에서 age % 12칸 전진 (whole sign)", () => {
    const ascIdx = Math.floor(CHART.ascendant! / 30);
    const expectIdx = (ascIdx + (31 % 12)) % 12;
    // ZODIAC_SIGNS[0] = 양자리 순서 — 라이브러리가 같은 배열을 쓴다
    expect(current.sign).toBe(ZODIAC_SIGNS[expectIdx]);
  });

  it("올해의 주인은 전통 지배성표에서 나온다", () => {
    const idx = (Math.floor(CHART.ascendant! / 30) + (31 % 12)) % 12;
    expect(current.lordKo).toBe(TRADITIONAL_RULER[idx]);
  });

  it("연 경계는 생일 날짜다", () => {
    expect(current.from).toBe("2026-07-14");
    expect(current.to).toBe("2027-07-14");
  });

  it("12년 스트립 — 현재−2부터 12칸, 자리 연속 전진", () => {
    const years = profectionYears(NATAL, CHART, now)!;
    expect(years).toHaveLength(12);
    expect(years[0].age).toBe(29);
    expect(years[2].age).toBe(31);
    // 이웃 칸의 자리 인덱스가 1씩 는다
    const i0 = ZODIAC_SIGNS.indexOf(years[0].sign);
    const i1 = ZODIAC_SIGNS.indexOf(years[1].sign);
    expect(i1).toBe((i0 + 1) % 12);
  });

  it("시각 미상이면 null", () => {
    expect(currentProfection(NATAL_NO_TIME, CHART_NO_TIME, now)).toBeNull();
    expect(profectionYears(NATAL_NO_TIME, CHART_NO_TIME, now)).toBeNull();
  });
});
```


- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/__tests__/time-lords.test.ts`
Expected: FAIL — `Cannot find module '../time-lords'`

- [ ] **Step 3: 구현**

`src/lib/time-lords.ts`:

```ts
import type { BirthMoment, Chart } from "./chart";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

/**
 * 고전 시간법(연간 프로펙션 · 조디악 릴리징) 계산.
 *
 * 실제 하늘(트랜짓)을 보지 않는다 — 출생 차트에 감긴 상징적 시계를 돌린다.
 * 그래서 스위스 천문력 정밀도가 필요 없고, 전부 순수 산술이라 vitest로
 * 완전히 검증된다. 시각 미상(chart.ascendant === null)이면 어떤 함수도
 * 값을 지어내지 않고 null을 돌려준다 — 사이트 전체의 원칙이다.
 */

/**
 * 전통 지배성. ZODIAC_SIGNS의 ruler는 현대 지배성(전갈=명왕성 등)이라
 * 고전 기법인 프로펙션·릴리징에는 쓰지 않는다. 인덱스 0 = 양자리.
 */
export const TRADITIONAL_RULER: string[] = [
  "화성", // 양
  "금성", // 황소
  "수성", // 쌍둥이
  "달", // 게
  "태양", // 사자
  "수성", // 처녀
  "금성", // 천칭
  "화성", // 전갈
  "목성", // 사수
  "토성", // 염소
  "토성", // 물병
  "목성", // 물고기
];

/**
 * 조디악 릴리징의 자리별 연수 — 지배 행성의 소년기 연수(발렌스).
 * 인덱스 0 = 양자리.
 */
export const SIGN_YEARS: number[] = [15, 8, 20, 25, 19, 20, 8, 15, 12, 27, 27, 12];

const HOUR_MS = 3600_000;
const KST_OFFSET_MS = 9 * HOUR_MS;

/** now를 KST 달력 날짜로 읽는다. */
function kstParts(now: Date): { y: number; m: number; d: number } {
  const t = new Date(now.getTime() + KST_OFFSET_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 만 나이 — KST 달력 생일 기준. 프로펙션·릴리징의 연 경계가 이것이다. */
export function ageOn(natalDate: string, now: Date): number {
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const { y, m, d } = kstParts(now);
  let age = y - by;
  if (m < bm || (m === bm && d < bd)) age -= 1;
  return age;
}

/** 생일에 정수 년을 더한 날짜 문자열. */
function birthdayPlusYears(natalDate: string, years: number): string {
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const rolled = new Date(Date.UTC(by + years, bm - 1, bd));
  return rolled.toISOString().slice(0, 10);
}

export interface ProfectionYear {
  /** 만 나이. 생일 당일부터 다음 생일 전날까지 같은 값. */
  age: number;
  /** 이 해가 열리는 생일. "2026-07-14" */
  from: string;
  /** 다음 생일. */
  to: string;
  sign: ZodiacSign;
  /** 상승 자리를 1로 세는 방 번호(1~12). */
  house: number;
  /** 올해의 주인 — 전통 지배성. */
  lordKo: string;
}

function profectionAt(natal: BirthMoment, chart: Chart, age: number): ProfectionYear | null {
  if (chart.ascendant === null) return null;
  const ascIdx = Math.floor(chart.ascendant / 30);
  const steps = ((age % 12) + 12) % 12;
  const signIdx = (ascIdx + steps) % 12;
  return {
    age,
    from: birthdayPlusYears(natal.date, age),
    to: birthdayPlusYears(natal.date, age + 1),
    sign: ZODIAC_SIGNS[signIdx],
    house: steps + 1,
    lordKo: TRADITIONAL_RULER[signIdx],
  };
}

export function currentProfection(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear | null {
  return profectionAt(natal, chart, ageOn(natal.date, now));
}

/** 현재−2부터 12칸 — 프리뷰의 12년 스트립. */
export function profectionYears(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear[] | null {
  if (chart.ascendant === null) return null;
  const age = ageOn(natal.date, now);
  const out: ProfectionYear[] = [];
  for (let a = age - 2; a < age - 2 + 12; a++) {
    const year = profectionAt(natal, chart, a);
    if (year) out.push(year);
  }
  return out;
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/__tests__/time-lords.test.ts`
Expected: PASS (전 항목)

- [ ] **Step 5: 커밋**

```bash
git add byeolsaem-web/src/lib/time-lords.ts byeolsaem-web/src/lib/__tests__/time-lords.test.ts
git commit -m "feat(chapters): annual profections learn to count the years"
```

---

### Task 2: 점(Lot) 계산 — 행운과 정신, 주야 반전

**Files:**
- Modify: `src/lib/time-lords.ts` (Task 1 파일 끝에 추가)
- Test: `src/lib/__tests__/time-lords.test.ts` (추가)

**Interfaces:**
- Consumes: Task 1의 파일. `norm360`은 `src/lib/ephemeris.ts`에서 import (chart.ts가 같은 함수를 쓴다 — export되어 있는지 확인하고, 없으면 `const norm360 = (x: number) => ((x % 360) + 360) % 360;`을 time-lords.ts 안에 둔다).
- Produces:
  - `type LotKey = "fortune" | "spirit"`
  - `isDayBirth(chart: Chart): boolean | null`
  - `lotLongitude(chart: Chart, lot: LotKey): number | null`

- [ ] **Step 1: 실패하는 테스트 추가**

테스트 파일에 추가:

```ts
import { isDayBirth, lotLongitude } from "../time-lords";

describe("점(Lot) — 주야 판정과 공식", () => {
  const sun = CHART.placements.find((p) => p.planet === "sun")!.longitude;
  const moon = CHART.placements.find((p) => p.planet === "moon")!.longitude;
  const asc = CHART.ascendant!;
  const norm = (x: number) => ((x % 360) + 360) % 360;

  it("주야 판정 — 태양-상승 각도로 지평선 위아래를 가른다", () => {
    // 오전 9시 30분 출생 — 태양이 지평선 위(주간)여야 한다.
    expect(isDayBirth(CHART)).toBe(true);
  });

  it("행운의 점 — 주간 공식 Asc + 달 − 태양", () => {
    expect(lotLongitude(CHART, "fortune")).toBeCloseTo(norm(asc + moon - sun), 6);
  });

  it("정신의 점은 행운과 공식이 반대다", () => {
    expect(lotLongitude(CHART, "spirit")).toBeCloseTo(norm(asc + sun - moon), 6);
  });

  it("야간 차트에서는 두 점의 공식이 서로 맞바뀐다", () => {
    // 같은 날 밤 11시 — 태양이 지평선 아래.
    const night = computeChart({ ...NATAL, time: "23:00" });
    expect(isDayBirth(night)).toBe(false);
    const nSun = night.placements.find((p) => p.planet === "sun")!.longitude;
    const nMoon = night.placements.find((p) => p.planet === "moon")!.longitude;
    expect(lotLongitude(night, "fortune")).toBeCloseTo(
      norm(night.ascendant! + nSun - nMoon), 6);
    expect(lotLongitude(night, "spirit")).toBeCloseTo(
      norm(night.ascendant! + nMoon - nSun), 6);
  });

  it("시각 미상이면 null", () => {
    expect(isDayBirth(CHART_NO_TIME)).toBeNull();
    expect(lotLongitude(CHART_NO_TIME, "fortune")).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/__tests__/time-lords.test.ts`
Expected: FAIL — `isDayBirth is not a function`

- [ ] **Step 3: 구현 추가**

`src/lib/time-lords.ts` 끝에:

```ts
const norm360 = (x: number): number => ((x % 360) + 360) % 360;

export type LotKey = "fortune" | "spirit";

function planetLongitude(chart: Chart, planet: "sun" | "moon"): number {
  return chart.placements.find((p) => p.planet === planet)!.longitude;
}

/**
 * 주간 출생인가. 상승-하강 축 기준 — 상승에서 황도 순서로 180도까지가
 * 지평선 아래(1~6방 구간)다. 태양이 그 구간에 있으면 야간.
 */
export function isDayBirth(chart: Chart): boolean | null {
  if (chart.ascendant === null) return null;
  const diff = norm360(planetLongitude(chart, "sun") - chart.ascendant);
  return diff >= 180;
}

/**
 * 행운의 점: 주간 Asc+달−태양, 야간 반전. 정신의 점은 그 반대.
 * 릴리징의 출발 자리는 이 값의 whole-sign 자리다.
 */
export function lotLongitude(chart: Chart, lot: LotKey): number | null {
  const day = isDayBirth(chart);
  if (day === null || chart.ascendant === null) return null;
  const sun = planetLongitude(chart, "sun");
  const moon = planetLongitude(chart, "moon");
  const dayFormula = lot === "fortune" ? day : !day;
  return dayFormula
    ? norm360(chart.ascendant + moon - sun)
    : norm360(chart.ascendant + sun - moon);
}
```

`norm360`이 `src/lib/ephemeris.ts`에 이미 export되어 있으면 위의 로컬 정의 대신 import한다 — 둘 다 두지 않는다.

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/__tests__/time-lords.test.ts`
Expected: PASS

- [ ] **Step 5: 커밋**

```bash
git add byeolsaem-web/src/lib/time-lords.ts byeolsaem-web/src/lib/__tests__/time-lords.test.ts
git commit -m "feat(chapters): fortune and spirit find their places by day and night"
```

---

### Task 3: 조디악 릴리징 — L1·L2·각·매듭 풀림

**Files:**
- Modify: `src/lib/time-lords.ts` (끝에 추가)
- Test: `src/lib/__tests__/time-lords.test.ts` (추가)

**Interfaces:**
- Consumes: Task 1·2의 전부.
- Produces:
  - `interface ZrPeriod { sign: ZodiacSign; fromAge: number; toAge: number; from: string; to: string; houseFromFortune: number; angular: boolean; peak: boolean; loosedBond: boolean }`
  - `interface ZodiacalReleasing { lot: LotKey; lotSign: ZodiacSign; l1: ZrPeriod[]; currentL1: ZrPeriod | null; l2OfCurrent: ZrPeriod[]; currentL2: ZrPeriod | null }`
  - `fractionalAge(natalDate: string, now: Date): number`
  - `zodiacalReleasing(natal: BirthMoment, chart: Chart, lot: LotKey, now: Date): ZodiacalReleasing | null`

- [ ] **Step 1: 실패하는 테스트 추가**

```ts
import { fractionalAge, zodiacalReleasing } from "../time-lords";

describe("조디악 릴리징", () => {
  const now = new Date("2026-08-26T03:00:00Z");
  const zr = zodiacalReleasing(NATAL, CHART, "fortune", now)!;
  const norm = (x: number) => ((x % 360) + 360) % 360;

  it("L1 — 점의 자리에서 출발, 연수표 누적, 100세 넘는 장까지", () => {
    const lotIdx = Math.floor(lotLongitude(CHART, "fortune")! / 30);
    expect(ZODIAC_SIGNS.indexOf(zr.l1[0].sign)).toBe(lotIdx);
    expect(zr.l1[0].fromAge).toBe(0);
    // 이웃 장: fromAge 연속 + 자리 1칸 전진
    for (let i = 1; i < zr.l1.length; i++) {
      expect(zr.l1[i].fromAge).toBe(zr.l1[i - 1].toAge);
      expect(ZODIAC_SIGNS.indexOf(zr.l1[i].sign)).toBe(
        (ZODIAC_SIGNS.indexOf(zr.l1[i - 1].sign) + 1) % 12,
      );
      // 장 길이 = 연수표
      expect(zr.l1[i].toAge - zr.l1[i].fromAge).toBe(
        SIGN_YEARS[ZODIAC_SIGNS.indexOf(zr.l1[i].sign)],
      );
    }
    // 마지막 장이 100세를 덮는다
    expect(zr.l1[zr.l1.length - 1].toAge).toBeGreaterThanOrEqual(100);
    expect(zr.l1[zr.l1.length - 2].toAge).toBeLessThan(100);
  });

  it("현재 장 — fractionalAge가 구간 안에 있다", () => {
    const age = fractionalAge(NATAL.date, now);
    expect(zr.currentL1).not.toBeNull();
    expect(age).toBeGreaterThanOrEqual(zr.currentL1!.fromAge);
    expect(age).toBeLessThan(zr.currentL1!.toAge);
  });

  it("L2 — 자리별 연수를 월로, 합이 L1 길이와 일치, 마지막 칸 부분 절단", () => {
    const l1 = zr.currentL1!;
    const months = Math.round((l1.toAge - l1.fromAge) * 12);
    const sum = zr.l2OfCurrent.reduce(
      (acc, p) => acc + Math.round((p.toAge - p.fromAge) * 12), 0);
    expect(sum).toBe(months);
    // 첫 L2는 L1과 같은 자리에서 시작
    expect(zr.l2OfCurrent[0].sign).toBe(l1.sign);
    expect(zr.currentL2).not.toBeNull();
  });

  it("각 판정 — 행운의 점 자리 기준 1·4·7·10, 10번째는 peak", () => {
    const fortuneIdx = Math.floor(lotLongitude(CHART, "fortune")! / 30);
    for (const p of zr.l1) {
      const idx = ZODIAC_SIGNS.indexOf(p.sign);
      const house = ((idx - fortuneIdx + 12) % 12) + 1;
      expect(p.houseFromFortune).toBe(house);
      expect(p.angular).toBe([1, 4, 7, 10].includes(house));
      expect(p.peak).toBe(house === 10);
    }
  });

  it("정신의 점 릴리징에서도 각 판정은 행운의 점 기준이다", () => {
    const spirit = zodiacalReleasing(NATAL, CHART, "spirit", now)!;
    const fortuneIdx = Math.floor(lotLongitude(CHART, "fortune")! / 30);
    const first = spirit.l1[0];
    const idx = ZODIAC_SIGNS.indexOf(first.sign);
    expect(first.houseFromFortune).toBe(((idx - fortuneIdx + 12) % 12) + 1);
  });

  it("매듭 풀림 — 긴 장(염소 27년)의 L2가 한 바퀴 돌면 맞은편으로 건너뛴다", () => {
    // 염소(27년) L1을 합성해 직접 검사한다 — 어느 차트든 규칙은 같다.
    // 염소 출발 L2: 염소27 물병27 물고기12 양15 황소8 쌍20 게25 사19 처20 천8 전15 사수12
    // 개월 누적: 27+27+12+15+8+20+25+19+20+8+15+12 = 208 → 다음 차례가 다시 염소(월 208).
    // 이때 맞은편 게자리로 건너뛰어야 한다. 총 길이 324개월(27년).
    const zrCap = zodiacalReleasingL2ForTest(9, 27 * 12); // 염소=9
    const jump = zrCap.find((p) => p.loosedBond);
    expect(jump).toBeDefined();
    expect(ZODIAC_SIGNS.indexOf(jump!.sign)).toBe(3); // 게자리
    // 건너뛴 지점 직전까지의 누적이 208개월
    const before = zrCap.slice(0, zrCap.indexOf(jump!));
    const monthsBefore = before.reduce(
      (acc, p) => acc + Math.round((p.toAge - p.fromAge) * 12), 0);
    expect(monthsBefore).toBe(208);
  });

  it("짧은 장(천칭 8년)에서는 매듭 풀림이 없다", () => {
    const zrLib = zodiacalReleasingL2ForTest(6, 8 * 12); // 천칭=6
    expect(zrLib.every((p) => !p.loosedBond)).toBe(true);
  });

  it("시각 미상이면 null", () => {
    expect(zodiacalReleasing(NATAL_NO_TIME, CHART_NO_TIME, "fortune", now)).toBeNull();
  });
});
```

테스트 전용 export `zodiacalReleasingL2ForTest(startSignIdx, totalMonths)`는 구현 Step에서 함께 만든다 — L2 분할 규칙을 차트와 무관하게 검증하기 위한 얇은 창구다.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/lib/__tests__/time-lords.test.ts`
Expected: FAIL — `zodiacalReleasing is not a function`

- [ ] **Step 3: 구현 추가**

`src/lib/time-lords.ts` 끝에:

```ts
export interface ZrPeriod {
  sign: ZodiacSign;
  /** 만 나이(년, 소수). */
  fromAge: number;
  toAge: number;
  /** 달력 날짜 환산("2027-07-14"). 월 단위 환산이라 ±1일 오차 허용. */
  from: string;
  to: string;
  /** 행운의 점 자리를 1로 세는 자리 번호 — 어느 점 릴리징이든 행운 기준. */
  houseFromFortune: number;
  /** 1·4·7·10번째 — 각(角)의 장. */
  angular: boolean;
  /** 10번째 — 절정의 장. */
  peak: boolean;
  /** 매듭 풀림(루싱 오브 본드)으로 건너뛰어 시작한 장(L2 전용). */
  loosedBond: boolean;
}

export interface ZodiacalReleasing {
  lot: LotKey;
  lotSign: ZodiacSign;
  l1: ZrPeriod[];
  currentL1: ZrPeriod | null;
  l2OfCurrent: ZrPeriod[];
  currentL2: ZrPeriod | null;
}

/** 만 나이의 소수부까지 — 생일 사이를 선형으로. */
export function fractionalAge(natalDate: string, now: Date): number {
  const whole = ageOn(natalDate, now);
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const last = Date.UTC(by + whole, bm - 1, bd) - KST_OFFSET_MS;
  const next = Date.UTC(by + whole + 1, bm - 1, bd) - KST_OFFSET_MS;
  return whole + (now.getTime() - last) / (next - last);
}

/** 생일 + 개월 수를 달력 날짜로. Date.UTC의 월 굴림에 맡긴다(±1일 허용). */
function ageToDate(natalDate: string, age: number): string {
  const [by, bm, bd] = natalDate.split("-").map(Number);
  const months = Math.round(age * 12);
  const rolled = new Date(Date.UTC(by, bm - 1 + months, bd));
  return rolled.toISOString().slice(0, 10);
}

function makePeriod(
  natalDate: string,
  signIdx: number,
  fromAge: number,
  toAge: number,
  fortuneIdx: number,
  loosedBond: boolean,
): ZrPeriod {
  const house = ((signIdx - fortuneIdx + 12) % 12) + 1;
  return {
    sign: ZODIAC_SIGNS[signIdx],
    fromAge,
    toAge,
    from: ageToDate(natalDate, fromAge),
    to: ageToDate(natalDate, toAge),
    houseFromFortune: house,
    angular: house === 1 || house === 4 || house === 7 || house === 10,
    peak: house === 10,
    loosedBond,
  };
}

/**
 * L2 분할. 자리별 연수를 "월"로 배정하고, 열이 한 바퀴 돌아 자기 L1 자리의
 * 차례로 되돌아오면 그 자리를 반복하는 대신 맞은편으로 건너뛴다(매듭 풀림).
 * 긴 장(염소·물병 27년)에서는 두 번째 귀환에도 같은 규칙을 다시 적용한다.
 */
function l2Periods(
  natalDate: string,
  startIdx: number,
  fromAge: number,
  totalMonths: number,
  fortuneIdx: number,
): ZrPeriod[] {
  const out: ZrPeriod[] = [];
  let cursor = 0;
  let idx = startIdx;
  let first = true;
  while (cursor < totalMonths) {
    let loosed = false;
    if (!first && idx === startIdx) {
      idx = (idx + 6) % 12;
      loosed = true;
    }
    const months = Math.min(SIGN_YEARS[idx], totalMonths - cursor);
    out.push(
      makePeriod(
        natalDate,
        idx,
        fromAge + cursor / 12,
        fromAge + (cursor + months) / 12,
        fortuneIdx,
        loosed,
      ),
    );
    cursor += months;
    idx = (idx + 1) % 12;
    first = false;
  }
  return out;
}

/** 테스트 전용 — L2 분할 규칙을 차트 없이 검증하는 창구. fortuneIdx는 0 고정. */
export function zodiacalReleasingL2ForTest(startIdx: number, totalMonths: number): ZrPeriod[] {
  return l2Periods("2000-01-01", startIdx, 0, totalMonths, 0);
}

export function zodiacalReleasing(
  natal: BirthMoment,
  chart: Chart,
  lot: LotKey,
  now: Date,
): ZodiacalReleasing | null {
  const lotLon = lotLongitude(chart, lot);
  const fortuneLon = lotLongitude(chart, "fortune");
  if (lotLon === null || fortuneLon === null) return null;
  const startIdx = Math.floor(lotLon / 30);
  const fortuneIdx = Math.floor(fortuneLon / 30);

  const l1: ZrPeriod[] = [];
  let ageCursor = 0;
  let idx = startIdx;
  while (ageCursor < 100) {
    const years = SIGN_YEARS[idx];
    l1.push(makePeriod(natal.date, idx, ageCursor, ageCursor + years, fortuneIdx, false));
    ageCursor += years;
    idx = (idx + 1) % 12;
  }

  const age = fractionalAge(natal.date, now);
  const currentL1 = l1.find((p) => age >= p.fromAge && age < p.toAge) ?? null;
  const l2OfCurrent = currentL1
    ? l2Periods(
        natal.date,
        ZODIAC_SIGNS.indexOf(currentL1.sign),
        currentL1.fromAge,
        Math.round((currentL1.toAge - currentL1.fromAge) * 12),
        fortuneIdx,
      )
    : [];
  const currentL2 = l2OfCurrent.find((p) => age >= p.fromAge && age < p.toAge) ?? null;

  return { lot, lotSign: ZODIAC_SIGNS[startIdx], l1, currentL1, l2OfCurrent, currentL2 };
}
```

- [ ] **Step 4: 통과 확인**

Run: `npx vitest run src/lib/__tests__/time-lords.test.ts`
Expected: PASS (매듭 풀림 208개월·게자리 건너뜀 포함 전부)

- [ ] **Step 5: 커밋**

```bash
git add byeolsaem-web/src/lib/time-lords.ts byeolsaem-web/src/lib/__tests__/time-lords.test.ts
git commit -m "feat(chapters): the chapters of a life unfold and loose their bond"
```

---

### Task 4: 페이지 셸 — /chapters

**Files:**
- Create: `src/app/(night-static)/chapters/page.tsx`

**Interfaces:**
- Consumes: `ChaptersScope`(Task 5가 만든다 — 이 태스크에서는 **임시로 렌더하지 않고**, Task 5에서 배선한다. 이 태스크의 산출물은 셸 전체와 자리 표시 주석 한 줄).
  - 대신 이 태스크에서는 `<ChaptersScope />` 자리에 `{/* Task 5: <ChaptersScope /> */}`를 두고 빌드가 통과해야 한다.
- 참고 패턴: `src/app/(night-static)/solar-return/page.tsx` (메타·JsonLd·PlaceBand·헤더·Faq·NextSteps 구조 전부 그대로).

- [ ] **Step 1: 페이지 작성**

`src/app/(night-static)/chapters/page.tsx`:

```tsx
import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { NextSteps } from "@/components/nav/NextSteps";
import { PlaceBand } from "@/components/place/PlaceBand";
import { Faq } from "@/components/retrograde/RetroPageBits";
import { alternatesFor, ogImage } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "인생의 시간표 — 프로펙션과 조디악 릴리징 | 별샘",
  description:
    "연간 프로펙션으로 올해의 별자리와 주인 행성을, 조디악 릴리징으로 인생의 장을 계산합니다. 태어난 순간에 감긴 시계를 읽는 고전 점성술의 시간법 — 무료, 로그인 없음.",
  alternates: alternatesFor("/chapters"),
  openGraph: ogImage("/chapters", "/og/chapters.png"),
};

const FAQS = [
  {
    question: "연간 프로펙션이 뭔가요?",
    answer:
      "생일마다 상승궁에서 한 칸씩 나아가 올해의 별자리와 올해의 주인 행성을 정하는 고전 기법입니다. 열두 해에 한 바퀴 돌아오고, 실제 하늘이 아니라 나이만으로 정해집니다. 그래서 태어난 시각이 꼭 필요합니다.",
  },
  {
    question: "조디악 릴리징이 뭔가요?",
    answer:
      "출생 차트의 행운의 점(또는 정신의 점)에서 출발해, 별자리마다 정해진 연수만큼 인생을 장(章)으로 나누는 헬레니즘 기법입니다. 장이 바뀔 때 삶의 무대가 바뀌고, 행운의 점에서 열 번째 자리의 장을 절정기로 읽습니다.",
  },
];

export default function ChaptersPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "인생의 시간표", path: "/chapters" }])} />
      <JsonLd data={faqSchema(FAQS)} />
      <PlaceBand src="/world/place-natal.webp" />
      <header className="mx-auto mb-12 max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">TIME LORDS</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">인생의 시간표</h1>
        <p className="mx-auto mt-4 max-w-md break-keep text-guide text-starlight-dim">
          실제 하늘을 보는 트랜짓과 달리, 여기서는 태어난 순간 감긴 시계를
          읽습니다. 올해가 어느 자리의 해인지, 지금이 인생의 몇 장(章)인지 —
          고전 점성술의 두 가지 시간법입니다.
        </p>
      </header>

      {/* Task 5: <ChaptersScope /> */}

      <section className="mt-20 border-t border-gold/15 pt-12">
        <h2 className="mb-6 break-keep font-display text-xl text-starlight">자주 묻는 것</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <Faq key={faq.question} question={faq.question}>
              <p className="max-w-[58ch] break-keep leading-relaxed">{faq.answer}</p>
            </Faq>
          ))}
        </div>
      </section>

      <NextSteps
        lead="시계가 가리키는 장을 봤다면, 그 해의 실제 하늘도 함께 보세요."
        primary={{ href: "/yearly", label: "한 해의 하늘 보기" }}
        secondary={{ href: "/solar-return", label: "솔라 리턴 보기" }}
      />
    </main>
  );
}
```

`PlaceBand`의 `src`는 solar-return과 같은 그림을 임시 공유한다 — 새 그림 제작은 범위 밖.

- [ ] **Step 2: 빌드 확인**

Run: `npm run build` (byeolsaem-web에서)
Expected: 성공, `out/chapters.html` 생성

- [ ] **Step 3: 커밋**

```bash
git add "byeolsaem-web/src/app/(night-static)/chapters/page.tsx"
git commit -m "feat(chapters): a shell awaits the time lords"
```

---

### Task 5: ChaptersScope + ProfectionSection

**Files:**
- Create: `src/components/chapters/ChaptersScope.tsx`
- Create: `src/components/chapters/ProfectionSection.tsx`
- Modify: `src/app/(night-static)/chapters/page.tsx` (주석 자리를 `<ChaptersScope />`로)

**Interfaces:**
- Consumes: Task 1~3의 time-lords 전부, `useBirthProfile`(src/hooks/useBirthProfile), `coordinatesFor`·`KOREA_UTC_OFFSET_HOURS`(src/lib/coordinates), `computeChart`(src/lib/chart), `UnknownPlace`(src/components/chart/NoProfile), `GoldButton`(src/components/ui/GoldButton), `requestRitual`(src/lib/ritual), `HOUSE_BY_NUMBER`(src/content/atoms/houses).
- Produces: `<ChaptersScope />` (props 없음), `<ProfectionSection profection years />`, Task 6이 쓸 게이트 구조.

- [ ] **Step 1: ChaptersScope 작성**

`src/components/chapters/ChaptersScope.tsx`:

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { UnknownPlace } from "@/components/chart/NoProfile";
import { GoldButton } from "@/components/ui/GoldButton";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { computeChart, type BirthMoment, type Chart } from "@/lib/chart";
import { coordinatesFor, KOREA_UTC_OFFSET_HOURS } from "@/lib/coordinates";
import { requestRitual } from "@/lib/ritual";
import { currentProfection, profectionYears } from "@/lib/time-lords";
import { ProfectionSection } from "./ProfectionSection";
import { ReleasingSection } from "./ReleasingSection";

/**
 * /chapters의 본문 게이트.
 *
 * 두 시간법 모두 상승궁에서 출발하므로 예시 차트를 보여주지 않는다 — 예시로
 * 흉내 내면 "아무 시각이나 넣어도 되는 계산"처럼 보인다. 프로필이 없으면
 * 열기를 권하고, 시각이 없으면 계산하지 않는 이유를 밝힌다. SolarScope와
 * 같은 마운트 계약: 서버 HTML과 첫 클라이언트 렌더는 항상 "열기 전" 화면.
 */
export function ChaptersScope() {
  const { profile } = useBirthProfile();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const natalAndChart = useMemo((): { natal: BirthMoment; chart: Chart } | null => {
    if (!profile || !now) return null;
    const coordinates = coordinatesFor(profile.city);
    if (!coordinates) return null;
    const natal: BirthMoment = {
      date: profile.date,
      time: profile.time,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezoneOffsetHours: KOREA_UTC_OFFSET_HOURS,
    };
    return { natal, chart: computeChart(natal) };
  }, [profile, now]);

  if (profile && now && !coordinatesFor(profile.city)) {
    return <UnknownPlace city={profile.city} />;
  }

  // 열기 전(서버 HTML 포함) — 계산 숫자는 하나도 그리지 않는다.
  if (!natalAndChart || !now) {
    return (
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-gold/35 bg-ink-raised/85 px-5 py-4">
        <p className="min-w-[240px] flex-1 break-keep text-starlight">
          이 페이지의 계산은 태어난 순간에서 출발합니다 — 내 하늘을 열면
          올해의 자리와 인생의 장이 바로 계산됩니다.
        </p>
        <GoldButton variant="solid" onClick={() => requestRitual()}>
          내 하늘 열기
        </GoldButton>
      </div>
    );
  }

  const { natal, chart } = natalAndChart;
  const profection = currentProfection(natal, chart, now);
  const years = profectionYears(natal, chart, now);

  // 시각 미상 — 반쪽 계산 없이 전체를 안내로 대체한다(스펙 §3.1).
  if (!profection || !years) {
    return (
      <div className="mx-auto max-w-2xl border border-gold/25 bg-ink-raised/60 px-6 py-8">
        <p className="break-keep leading-relaxed text-starlight">
          프로펙션과 릴리징은 둘 다 상승궁에서 출발합니다. 태어난 시각이
          있어야 계산할 수 있습니다 — 별샘은 모르는 값을 지어내지 않습니다.
        </p>
        <p className="mt-4 break-keep text-guide text-starlight-dim">
          출생 시각을 찾는 현실적인 방법을 칼럼에 정리해 두었습니다:{" "}
          <a href="/blog/태어난-시간-모를-때" className="text-gold-soft underline underline-offset-4">
            태어난 시간을 모를 때 볼 수 있는 것과 없는 것
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProfectionSection profection={profection} years={years} />
      <ReleasingSection natal={natal} chart={chart} now={now} />
    </div>
  );
}
```

- [ ] **Step 2: ProfectionSection 작성**

`src/components/chapters/ProfectionSection.tsx`:

```tsx
import { HOUSE_BY_NUMBER } from "@/content/atoms/houses";
import { LineDiamond } from "@/components/ui/LineDiamond";
import type { ProfectionYear } from "@/lib/time-lords";

/**
 * 올해 카드 + 12년 스트립(프리뷰 승인본). 자리·방 설명은 기존 원자를
 * 재사용한다 — 새로 쓰는 문장은 프레임 한 벌뿐이다.
 */
export function ProfectionSection({
  profection,
  years,
}: {
  profection: ProfectionYear;
  years: ProfectionYear[];
}) {
  const house = HOUSE_BY_NUMBER[profection.house];
  return (
    <section className="mt-4">
      <h2 className="break-keep text-center font-display text-2xl text-starlight">올해의 자리</h2>
      <p className="mt-2 text-center font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
        ANNUAL PROFECTIONS
      </p>

      <div className="mx-auto mt-10 max-w-[520px] border border-gold/50 bg-gradient-to-b from-nebula/85 to-ink px-8 py-10 text-center shadow-[0_0_44px_rgba(201,162,39,0.12)]">
        <p className="font-latin text-eyebrow tracking-[0.3em] text-gold">
          AGE {profection.age} · {profection.from.slice(0, 7).replace("-", ". ")} –{" "}
          {profection.to.slice(0, 7).replace("-", ". ")}
        </p>
        <p className="mt-3 break-keep font-display text-3xl text-starlight">
          {profection.sign.ko}의 해
        </p>
        <p className="mt-2 text-meta text-starlight-dim">
          {house.ko} · 올해의 주인 <b className="font-medium text-gold-soft">{profection.lordKo}</b>
        </p>
        <LineDiamond className="mt-6" />
        <p className="mx-auto mt-5 max-w-[40ch] break-keep text-guide leading-relaxed text-starlight">
          {house.domain}의 방에 불이 들어온 해입니다. 올해의 주인이{" "}
          {profection.lordKo}이므로, {profection.lordKo}이(가) 어디를 지나는지가
          올해 트랜짓 읽기의 축이 됩니다.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-6 gap-1 md:grid-cols-12">
        {years.map((y) => (
          <div
            key={y.age}
            className={`border px-1 py-3 text-center leading-normal ${
              y.age === profection.age
                ? "border-gold bg-gold/10 shadow-[0_0_18px_rgba(201,162,39,0.18)]"
                : "border-gold/20 bg-nebula/35"
            }`}
          >
            <span className="block font-latin text-[12px] tracking-[0.08em] text-starlight-dim">{y.age}</span>
            <span
              className={`mt-1 block text-[12.5px] ${
                y.age === profection.age ? "text-gold-soft" : "text-starlight"
              }`}
            >
              {y.sign.ko.replace("자리", "")}
            </span>
            <span className="mt-0.5 block text-[10.5px] text-starlight-dim">{y.house}번째 방</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-meta text-starlight-dim">
        앞뒤 열두 해 — 현재 나이가 금색으로 표시됩니다
      </p>
    </section>
  );
}
```

- [ ] **Step 3: 페이지 배선**

Task 4의 주석을 교체:

```tsx
import { ChaptersScope } from "@/components/chapters/ChaptersScope";
// …
      {/* Task 5: <ChaptersScope /> */}
```
→
```tsx
      <ChaptersScope />
```

주의: 이 시점에는 `ReleasingSection`이 아직 없다. **이 태스크에서 최소 스텁을 함께 만든다** — Task 6이 본 구현으로 교체한다:

`src/components/chapters/ReleasingSection.tsx` (스텁):

```tsx
"use client";
import type { BirthMoment, Chart } from "@/lib/chart";

/** Task 6이 본 구현으로 교체한다. 스텁은 아무것도 그리지 않는다. */
export function ReleasingSection(_props: { natal: BirthMoment; chart: Chart; now: Date }) {
  return null;
}
```

- [ ] **Step 4: 검증 — 빌드 + SSR 게이트**

Run: `npm run build && npm test`
Expected: 빌드 성공, 기존 테스트 전부 통과. `out/chapters.html`에 계산 숫자(나이·자리)가 없고 "내 하늘 열기" 유도가 있음 — `Select-String -Path out/chapters.html -Pattern "내 하늘 열기"`로 확인.

- [ ] **Step 5: 커밋**

```bash
git add byeolsaem-web/src/components/chapters/ "byeolsaem-web/src/app/(night-static)/chapters/page.tsx"
git commit -m "feat(chapters): this year's sign takes its card"
```

---

### Task 6: ReleasingSection — 토글·타임라인·L2·범례

**Files:**
- Modify: `src/components/chapters/ReleasingSection.tsx` (스텁 → 본 구현)

**Interfaces:**
- Consumes: `zodiacalReleasing`, `type LotKey`, `type ZrPeriod`(src/lib/time-lords), `LineDiamond`.
- Produces: 완성된 `<ReleasingSection natal chart now />`.

- [ ] **Step 1: 본 구현**

```tsx
"use client";
import { useMemo, useState } from "react";
import type { BirthMoment, Chart } from "@/lib/chart";
import { fractionalAge, zodiacalReleasing, type LotKey, type ZrPeriod } from "@/lib/time-lords";

const LOT_LABEL: Record<LotKey, { name: string; scope: string }> = {
  spirit: { name: "정신의 점", scope: "커리어와 행동의 장" },
  fortune: { name: "행운의 점", scope: "몸과 환경의 장" },
};

/**
 * 조디악 릴리징 — L1 타임라인 + 현재 장의 L2 스트립 + 범례(프리뷰 승인본).
 * 기본은 정신의 점(사람들이 가장 궁금해하는 커리어 질문). 토글은 컴포넌트
 * 상태만 — URL·저장 없음(스펙 §3.3).
 */
export function ReleasingSection({
  natal,
  chart,
  now,
}: {
  natal: BirthMoment;
  chart: Chart;
  now: Date;
}) {
  const [lot, setLot] = useState<LotKey>("spirit");
  const zr = useMemo(() => zodiacalReleasing(natal, chart, lot, now), [natal, chart, lot, now]);
  if (!zr) return null;
  const age = fractionalAge(natal.date, now);

  return (
    <section className="mt-24">
      <h2 className="break-keep text-center font-display text-2xl text-starlight">인생의 장</h2>
      <p className="mt-2 text-center font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
        ZODIACAL RELEASING
      </p>
      <p className="mx-auto mt-6 max-w-[56ch] break-keep text-center text-guide text-starlight-dim">
        {LOT_LABEL[lot].name}({zr.lotSign.ko})에서 출발해, 별자리마다 정해진
        연수만큼 인생을 장으로 나눕니다. 행운의 점에서 모난 자리의 장은 굵은
        사건의 장으로, 열 번째 자리의 장은 절정의 장으로 읽습니다.
      </p>

      {/* 점 토글 */}
      <div className="mt-8 flex justify-center gap-2" role="group" aria-label="릴리징 기준점">
        {(Object.keys(LOT_LABEL) as LotKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setLot(key)}
            aria-pressed={lot === key}
            className={`border px-4 py-2 text-meta tracking-wide transition-colors ${
              lot === key
                ? "border-gold bg-gold/10 text-gold-soft"
                : "border-gold/25 text-starlight-dim hover:text-starlight"
            }`}
          >
            {LOT_LABEL[key].name} — {LOT_LABEL[key].scope}
          </button>
        ))}
      </div>

      {/* L1 타임라인 — 장 폭 ∝ 연수 */}
      <div className="mt-12 flex flex-wrap gap-1">
        {zr.l1.map((p) => (
          <ChapterCell key={p.fromAge} period={p} current={p === zr.currentL1} age={age} />
        ))}
      </div>

      {/* 현재 장의 L2 */}
      {zr.currentL1 && (
        <div className="mt-12">
          <h3 className="break-keep text-center font-display text-lg text-starlight">
            지금 장의 속살 — {zr.currentL1.sign.ko.replace("자리", "")}의 {zr.currentL1.toAge - zr.currentL1.fromAge}년
          </h3>
          <div className="mt-5 flex flex-wrap gap-1">
            {zr.l2OfCurrent.map((p) => (
              <div
                key={p.fromAge}
                className={`min-w-[72px] flex-1 border px-1 py-2.5 text-center text-[12px] leading-normal ${
                  p === zr.currentL2
                    ? "border-gold bg-gold/10 text-gold-soft"
                    : "border-gold/15 bg-nebula/30 text-starlight-dim"
                }`}
              >
                {p.loosedBond && (
                  <span className="mb-0.5 block text-[10px] tracking-[0.08em] text-gold">매듭 풀림</span>
                )}
                {p.sign.ko.replace("자리", "")}
                <small className="mt-0.5 block text-[10px] tracking-[0.04em]">
                  {p.fromAge.toFixed(1)} – {p.toAge.toFixed(1)}
                </small>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-meta text-starlight-dim">
            긴 장 안에서 달이 도는 작은 장(L2) — 숫자는 만 나이
          </p>
        </div>
      )}

      {/* 범례 */}
      <div className="mx-auto mt-10 grid max-w-[60ch] gap-2.5 text-guide text-starlight-dim">
        <p className="break-keep">
          <b className="font-medium text-gold-soft">각(角)의 장</b> — 행운의 점에서
          1·4·7번째 자리. 삶의 무대가 크게 움직이는 장으로 읽습니다.
        </p>
        <p className="break-keep">
          <b className="font-medium text-gold-soft">절정의 장</b> — 행운의 점에서 열
          번째 자리. 이 시기의 일이 가장 멀리까지 보이는 장입니다.
        </p>
        <p className="break-keep">
          <b className="font-medium text-gold-soft">매듭 풀림</b> — 작은 장이 출발
          자리로 되돌아오는 순간 맞은편 자리로 건너뜁니다. 흐름이 한 번 꺾이는
          지점입니다.
        </p>
      </div>
    </section>
  );
}

function ChapterCell({ period, current, age }: { period: ZrPeriod; current: boolean; age: number }) {
  const years = period.toAge - period.fromAge;
  const badge = current
    ? `지금 · ${Math.floor(age - period.fromAge) + 1}년째`
    : period.peak
      ? "절정의 장"
      : period.angular
        ? "각(角)의 장"
        : null;
  return (
    <div
      className={`relative flex min-w-[92px] flex-col justify-between border px-2.5 pb-2.5 pt-3.5 ${
        current
          ? "border-gold bg-gradient-to-b from-gold/15 to-nebula/40 shadow-[0_0_22px_rgba(201,162,39,0.2)]"
          : "border-gold/20 bg-nebula/35"
      }`}
      style={{ flexGrow: years }}
    >
      {badge && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap border border-gold/50 bg-ink px-2 text-[10px] tracking-[0.08em] text-gold-soft">
          {badge}
        </span>
      )}
      <div>
        <p className={`font-display text-[15px] ${current ? "text-gold-soft" : "text-starlight"}`}>
          {period.sign.ko.replace("자리", "")}
        </p>
        <p className="mt-0.5 text-[11px] tracking-[0.05em] text-starlight-dim">{years}년</p>
      </div>
      <p className="mt-2 font-latin text-[11.5px] tracking-[0.1em] text-starlight-dim">
        {period.fromAge} – {period.toAge}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: 검증 — 빌드 + dev-browser 실측**

Run: `npm run build && npm test`, 배포 전이므로 `npx next dev` 또는 로컬 `out` 서빙으로 dev-browser 검사:
- localStorage에 시각 있는 프로필 저장 → /chapters에서 ① "○○의 해" 카드 ② 12칸 스트립 ③ L1 타임라인에 "지금" 배지 ④ 토글 클릭 시 출발 자리 변경 ⑤ L2 스트립 렌더.
- 시각 null 프로필 → 계산 숫자 없이 안내문 + 칼럼 링크만.
Expected: 전부 확인.

- [ ] **Step 3: 커밋**

```bash
git add byeolsaem-web/src/components/chapters/ReleasingSection.tsx
git commit -m "feat(chapters): the long chapters stretch across the page"
```

---

### Task 7: 마감 — 내비·사이트맵·OG·서브셋·검증

**Files:**
- Modify: `src/components/nav/nav-map.ts:32-39` ("나의 별" 그룹), `:51` (NAV_NEW)
- Modify: `src/app/sitemap.ts:38` 근방 (tools 목록)
- Modify: `scripts/build-og.mjs` (PAGE_CARDS)

**Interfaces:**
- Consumes: 없음(독립 마감).
- Produces: 완성된 배포 준비 상태.

- [ ] **Step 1: nav-map**

"나의 별" 그룹의 `/solar-return` 줄 다음에:

```ts
      { href: "/chapters", label: "인생의 시간표", desc: "올해의 자리와 인생의 장 — 고전 시간법" },
```

NAV_NEW:

```ts
export const NAV_NEW: string[] = ["/weekly", "/calendar", "/solar-return", "/ephemeris", "/chapters"];
```

- [ ] **Step 2: sitemap**

`/solar-return` 줄 다음에:

```ts
    { url: `${BASE}/chapters`, changeFrequency: "monthly", priority: 0.6 },
```

- [ ] **Step 3: OG 카드**

`scripts/build-og.mjs`의 PAGE_CARDS에 (ephemeris.png 줄 다음):

```js
  { file: "chapters.png", eyebrow: "TIME LORDS", title: "인생의 시간표", sub: "올해의 자리, 인생의 장", motif: "rings" },
```

Run: `node scripts/build-og.mjs` → `public/og/chapters.png` 생성 확인.

- [ ] **Step 4: 폰트 서브셋**

Run: `$env:PYTHONIOENCODING = "utf-8"; python scripts/subset-maruburi.py`
Expected: 신규 문자열 반영(대개 no-diff — KS X 1001 커버).

- [ ] **Step 5: 전체 검증**

Run: `npm test && npm run build`
Expected: 전 테스트 통과, 빌드 성공, `out/chapters.html` 존재, sitemap에 /chapters 포함(`Select-String -Path out/sitemap.xml -Pattern "chapters"`).

- [ ] **Step 6: 커밋**

```bash
git add byeolsaem-web/src/components/nav/nav-map.ts byeolsaem-web/src/app/sitemap.ts byeolsaem-web/scripts/build-og.mjs byeolsaem-web/public/og/chapters.png byeolsaem-web/public/fonts/
git commit -m "feat(chapters): the timetable takes its place among the stars"
```

폰트에 diff가 없으면 `byeolsaem-web/public/fonts/`는 스테이징 목록에서 뺀다.
