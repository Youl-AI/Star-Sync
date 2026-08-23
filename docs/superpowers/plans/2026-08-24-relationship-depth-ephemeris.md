# 관계축 심화 + 천문력 구현 계획 — 궁합 초대 링크 · 컴포짓 차트 · 천문력 표

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 궁합에 초대 링크(OS 공유 시트)와 컴포짓 차트 섹션을 더하고, 천문력 표 페이지 13장을 만든다.

**Architecture:** 셋 다 기존 문법의 연장 — 초대는 URL fragment에 출생 정보를 인코딩해 기존 파트너 상태에 꽂고, 컴포짓은 솔라 리턴의 "프레임+원자" 수법을 궁합 결과에 얹으며, 천문력은 달력의 월별 라우트 뼈대(BUILD_MONTHS·CalMonthNav)를 그대로 재사용한다.

**Tech Stack:** Next.js 16 정적 export · React 19 · Vitest · 자체 천문 엔진

**스펙:** `docs/superpowers/specs/2026-08-24-relationship-depth-ephemeris-design.md`

## Global Constraints

- 정적 export 유지. 서버·DB·외부 API 추가 금지.
- **상대(그쪽) 정보는 어떤 경로로도 저장하지 않는다** — 초대 링크 데이터도 컴포넌트 상태까지만.
- 시각을 모르면 지어내지 않는다(컴포짓 상승궁은 둘 다 시각 알 때만).
- 초대 URL은 fragment(`#i=`) — # 뒤는 서버 로그·애널리틱스·리퍼러에 안 남는다(invite.ts 머리 주석에 명시).
- 카카오 SDK는 초대에 쓰지 않는다. 공유 관례: 이미지 카드=카카오, 링크=OS 공유 시트(`navigator.share`) + 클립보드 폴백.
- 동의 문구 원문(글자 그대로): "링크에는 내 생년월일시와 출생지가 담깁니다. 궁합을 보고 싶은 사람에게만 보내세요."
- 한국어 신규 문자열(주석·테스트 포함) 커밋 전 `python scripts/subset-maruburi.py` (PYTHONIOENCODING=utf-8). 변경분 함께 스테이징.
- `git add -A` 금지. 커밋 메시지에 PowerShell here-string(@'…'@) 금지 — 일반 따옴표 다중행 또는 Bash 도구.
- 새 페이지 세트: `alternatesFor()`+`ogImage()`, sitemap, OG 카드, prefetch `NAV_TARGETS`.
- 프레임·안내 문장은 "다."로 끝나는 완결 문장(테스트가 지킨다).
- 테스트: `byeolsaem-web/`에서 `npx vitest run src/test/<파일>`. 빌드: `npx tsc --noEmit` 후 `npm run build`.
- 커밋 끝에 항상: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

## 파일 지도

| 파일 | 역할 |
|---|---|
| `src/lib/composite.ts` (신규) | 중간점 차트 계산 |
| `src/components/synastry/composite-reading.ts` (신규) | 세 축 조립(프레임+원자) — solar-reading.ts와 같은 층 |
| `src/components/synastry/CompositeSection.tsx` (신규) | "우리 사이에 생긴 세 번째 하늘" 렌더 |
| `src/lib/invite.ts` (신규) | 초대 인코딩·디코딩·해시 파싱 |
| `src/components/synastry/InviteButton.tsx` (신규) | OS 공유 시트 + 클립보드 폴백 + 동의 문구 |
| `src/components/synastry/SynastryReading.tsx` (수정) | 컴포짓 섹션·초대 송수신 배선 |
| `src/components/synastry/ExampleMeeting.tsx` (수정) | 예시에도 컴포짓 섹션 |
| `src/lib/ephemeris-table.ts` (신규) | 월별 행성 위치 표 데이터 |
| `src/components/ephemeris/EphemerisTable.tsx` (신규) | 표 렌더(서버) |
| `src/components/calendar/CurrentMonthNotice.tsx` (수정) | `hrefBase` prop 추가 |
| `app/(night-static)/ephemeris/**` (신규) | 허브 + 월별 12장 |
| nav-map·sitemap·build-og·prefetch (수정) | 마감 |

---

### Task 1: 컴포짓 계산 — composite.ts

**Files:**
- Create: `byeolsaem-web/src/lib/composite.ts`
- Test: `byeolsaem-web/src/test/composite.test.ts`

**Interfaces:**
- Consumes: `findAspects`, `computeChart`, `Placement`, `Aspect`, `Chart` (`./chart`); `norm180` (`./ephemeris`); `signAtLongitude` (`./zodiac`)
- Produces:

```ts
export interface CompositeChart {
  placements: Placement[];   // house 전부 null, retrograde 전부 false
  aspects: Aspect[];
  ascendant: number | null;  // 둘 다 시각 알 때만(두 상승궁의 중간점)
}
export function compositeChart(mine: Chart, theirs: Chart): CompositeChart;
export function arcMidpoint(a: number, b: number): number;  // 테스트용으로도 export
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/composite.test.ts
import { describe, expect, it } from "vitest";
import { arcMidpoint, compositeChart } from "@/lib/composite";
import { computeChart } from "@/lib/chart";
import { angleBetween } from "@/lib/chart";

const MINE = computeChart({
  date: "1995-07-14", time: "09:30",
  latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9,
});
const THEIRS = computeChart({
  date: "1997-04-19", time: "20:10",
  latitude: 35.1796, longitude: 129.0756, timezoneOffsetHours: 9,
});

describe("arcMidpoint", () => {
  it("짧은 호의 중간이다", () => {
    expect(arcMidpoint(10, 30)).toBeCloseTo(20, 6);
    // 350°와 10° 사이의 짧은 호는 0°를 지난다 — 산술 평균(180)이 아니라 0.
    expect(arcMidpoint(350, 10)).toBeCloseTo(0, 6);
    expect(arcMidpoint(10, 350)).toBeCloseTo(0, 6);
  });
  it("중간점은 항상 두 점 어느 쪽에서도 반호 이내다 (속성)", () => {
    for (let i = 0; i < 50; i += 1) {
      const a = (i * 71.3) % 360;
      const b = (i * 137.7 + 40) % 360;
      const mid = arcMidpoint(a, b);
      expect(angleBetween(a, mid)).toBeLessThanOrEqual(90.0001);
      expect(angleBetween(b, mid)).toBeLessThanOrEqual(90.0001);
    }
  });
  it("정확한 대립(180°)은 작은 황경 쪽 + 90°로 결정론", () => {
    expect(arcMidpoint(10, 190)).toBeCloseTo(100, 6);
    expect(arcMidpoint(190, 10)).toBeCloseTo(100, 6);
    expect(arcMidpoint(0, 180)).toBeCloseTo(90, 6);
  });
});

describe("compositeChart", () => {
  const composite = compositeChart(MINE, THEIRS);

  it("행성 10개, house 전부 null, retrograde 전부 false", () => {
    expect(composite.placements).toHaveLength(10);
    expect(composite.placements.every((p) => p.house === null)).toBe(true);
    expect(composite.placements.every((p) => p.retrograde === false)).toBe(true);
  });
  it("각 행성의 황경이 두 차트 그 행성의 중간점이다", () => {
    for (const p of composite.placements) {
      const a = MINE.placements.find((x) => x.planet === p.planet)!.longitude;
      const b = THEIRS.placements.find((x) => x.planet === p.planet)!.longitude;
      expect(p.longitude).toBeCloseTo(arcMidpoint(a, b), 6);
    }
  });
  it("둘 다 시각을 알면 상승궁도 중간점이다", () => {
    expect(composite.ascendant).not.toBeNull();
    expect(composite.ascendant).toBeCloseTo(arcMidpoint(MINE.ascendant!, THEIRS.ascendant!), 6);
  });
  it("한쪽이라도 시각을 모르면 상승궁은 null — 지어내지 않는다", () => {
    const noTime = computeChart({
      date: "1997-04-19", time: null,
      latitude: 35.1796, longitude: 129.0756, timezoneOffsetHours: 9,
    });
    expect(compositeChart(MINE, noTime).ascendant).toBeNull();
  });
  it("sign·degree가 중간점 황경과 일치한다", () => {
    for (const p of composite.placements) {
      expect(p.longitude >= 0 && p.longitude < 360).toBe(true);
      expect(p.degree).toBe(Math.floor(p.longitude % 30));
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/composite.test.ts` → FAIL (모듈 없음)

- [ ] **Step 3: 구현**

```ts
// src/lib/composite.ts
import { findAspects, type Aspect, type Chart, type Placement } from "./chart";
import { norm180 } from "./ephemeris";
import { signAtLongitude } from "./zodiac";

/**
 * 컴포짓 차트 — 두 차트의 행성별 원호 중간점으로 세우는 제3의 차트.
 * 궁합이 둘 사이에 오가는 각도라면, 컴포짓은 "이 관계 자체"를 하나의
 * 인격처럼 읽는 관례다.
 *
 * 중간점은 짧은 호의 중간을 쓴다. 정확히 180° 대립이면 어느 쪽 중간도
 * 관례상 유효하므로, 작은 황경 쪽 + 90°로 고정해 결정론을 지킨다.
 *
 * 하우스는 다루지 않는다 — 컴포짓의 장소를 무엇으로 볼지는 학파마다 갈리고,
 * 우리는 갈리는 것을 지어내지 않는다(스펙 결정). 상승궁만은 둘 다 시각을
 * 알 때 두 상승궁의 중간점으로 낸다.
 */
export interface CompositeChart {
  placements: Placement[];
  aspects: Aspect[];
  ascendant: number | null;
}

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

export function arcMidpoint(a: number, b: number): number {
  const diff = norm180(b - a);
  if (Math.abs(Math.abs(diff) - 180) < 1e-9) {
    return norm360(Math.min(norm360(a), norm360(b)) + 90);
  }
  return norm360(a + diff / 2);
}

export function compositeChart(mine: Chart, theirs: Chart): CompositeChart {
  const placements: Placement[] = mine.placements.map((p) => {
    const other = theirs.placements.find((x) => x.planet === p.planet);
    // 두 차트 모두 computeChart 산출물이라 행성 목록이 같다 — 없으면 버그다.
    if (!other) throw new Error(`composite: ${p.planet} missing in partner chart`);
    const longitude = arcMidpoint(p.longitude, other.longitude);
    return {
      planet: p.planet,
      longitude,
      sign: signAtLongitude(longitude),
      degree: Math.floor(longitude % 30),
      house: null,
      retrograde: false, // 중간점에서 역행은 의미가 없다
    };
  });

  return {
    placements,
    aspects: findAspects(placements),
    ascendant:
      mine.ascendant !== null && theirs.ascendant !== null
        ? arcMidpoint(mine.ascendant, theirs.ascendant)
        : null,
  };
}
```

- [ ] **Step 4: 통과 확인** — `npx vitest run src/test/composite.test.ts` → PASS, 이어서 `npx vitest run` 전체 회귀

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/composite.ts src/test/composite.test.ts <변경된 폰트 파일>
git commit -m "feat(composite): two skies learn to meet in the middle"
```

---

### Task 2: 컴포짓 읽기 — composite-reading.ts

**Files:**
- Create: `byeolsaem-web/src/components/synastry/composite-reading.ts`
- Test: `byeolsaem-web/src/test/composite-reading.test.ts`

**Interfaces:**
- Consumes: `CompositeChart`(Task 1), `PLANET_IN_SIGN`(`@/content/atoms/planet-in-sign`)
- Produces:

```ts
export interface CompositeAxis { title: string; frame: string; body: string; }
export interface CompositeReading { sun: CompositeAxis; moon: CompositeAxis; venus: CompositeAxis; }
export function composeCompositeReading(composite: CompositeChart): CompositeReading;
export const COMPOSITE_INTRO: string;  // 도입 2문장
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/composite-reading.test.ts
import { describe, expect, it } from "vitest";
import { composeCompositeReading, COMPOSITE_INTRO } from "@/components/synastry/composite-reading";
import { compositeChart } from "@/lib/composite";
import { computeChart } from "@/lib/chart";

describe("composeCompositeReading", () => {
  const composite = compositeChart(
    computeChart({ date: "1995-07-14", time: "09:30", latitude: 37.5665, longitude: 126.978, timezoneOffsetHours: 9 }),
    computeChart({ date: "1997-04-19", time: "20:10", latitude: 35.1796, longitude: 129.0756, timezoneOffsetHours: 9 }),
  );
  const reading = composeCompositeReading(composite);

  it("세 축이 전부 나오고 제목에 자리 이름이 붙는다", () => {
    expect(reading.sun.title).toContain("관계의 태양");
    expect(reading.moon.title).toContain("관계의 달");
    expect(reading.venus.title).toContain("관계의 금성");
    expect(reading.sun.title).toMatch(/자리/);
  });
  it("프레임과 본문이 완결 문장이다", () => {
    for (const axis of [reading.sun, reading.moon, reading.venus]) {
      expect(axis.frame.endsWith("다.")).toBe(true);
      expect(axis.body.endsWith("다.")).toBe(true);
    }
    expect(COMPOSITE_INTRO.endsWith("다.")).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/composite-reading.test.ts` → FAIL

- [ ] **Step 3: 구현**

```ts
// src/components/synastry/composite-reading.ts
import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import type { CompositeChart } from "@/lib/composite";

/**
 * 컴포짓의 세 축 — 새 해석 원자를 만들지 않는다(스펙 결정). 출생 차트용
 * PLANET_IN_SIGN을 "관계의" 프레임으로 다시 문맥화한다. 원자 문장이 개인
 * 주어로 서술되어 관계 주어와 간극이 있는 자리는 프레임이 잇는다 — 원자를
 * 고치면 natal과 갈라진다.
 */
export interface CompositeAxis {
  title: string;
  frame: string;
  body: string;
}
export interface CompositeReading {
  sun: CompositeAxis;
  moon: CompositeAxis;
  venus: CompositeAxis;
}

export const COMPOSITE_INTRO =
  "궁합이 두 하늘 사이에 오가는 각도라면, 컴포짓은 두 하늘의 한가운데에 생기는 세 번째 차트입니다. 관계 자체를 하나의 인격처럼 읽는 오래된 방법입니다.";

export function composeCompositeReading(composite: CompositeChart): CompositeReading {
  const of = (key: "sun" | "moon" | "venus") => composite.placements.find((p) => p.planet === key)!;
  const sun = of("sun");
  const moon = of("moon");
  const venus = of("venus");
  return {
    sun: {
      title: `관계의 태양 — ${sun.sign.ko}`,
      frame: "이 관계가 무엇을 향해 가는가입니다.",
      body: PLANET_IN_SIGN.sun[sun.sign.key],
    },
    moon: {
      title: `관계의 달 — ${moon.sign.ko}`,
      frame: "둘이 함께 있을 때 흐르는 기류입니다.",
      body: PLANET_IN_SIGN.moon[moon.sign.key],
    },
    venus: {
      title: `관계의 금성 — ${venus.sign.ko}`,
      frame: "이 관계가 애정을 표현하는 방식입니다.",
      body: PLANET_IN_SIGN.venus[venus.sign.key],
    },
  };
}
```

- [ ] **Step 4: 통과 + 회귀** — `npx vitest run` 전체 PASS

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/synastry/composite-reading.ts src/test/composite-reading.test.ts <변경된 폰트 파일>
git commit -m "feat(composite): the third sky borrows the natal vocabulary"
```

---

### Task 3: CompositeSection + 궁합·예시 배선

**Files:**
- Create: `byeolsaem-web/src/components/synastry/CompositeSection.tsx`
- Modify: `byeolsaem-web/src/components/synastry/SynastryReading.tsx` (공유 버튼 블록 직전)
- Modify: `byeolsaem-web/src/components/synastry/ExampleMeeting.tsx` (맨 아래)

**Interfaces:**
- Consumes: `compositeChart`(Task 1), `composeCompositeReading`·`COMPOSITE_INTRO`(Task 2), `Chart`
- Produces: `<CompositeSection mine={Chart} theirs={Chart} />`

- [ ] **Step 1: CompositeSection** — 솔라 리턴 `AxisSection`(src/components/solar/SolarScope.tsx 하단)의 계층·클래스 결을 그대로 따른다:

```tsx
// src/components/synastry/CompositeSection.tsx
import { compositeChart } from "@/lib/composite";
import type { Chart } from "@/lib/chart";
import {
  COMPOSITE_INTRO,
  composeCompositeReading,
  type CompositeAxis,
} from "./composite-reading";

/** 궁합 결과의 세 번째 섹션 — 관계 자체의 차트. 서버에서도 그려진다(예시 포함). */
export function CompositeSection({ mine, theirs }: { mine: Chart; theirs: Chart }) {
  const reading = composeCompositeReading(compositeChart(mine, theirs));
  return (
    <section className="mt-16">
      <h2 className="mb-4 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        우리 사이에 생긴 세 번째 하늘
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>
      <p className="max-w-[56ch] break-keep text-guide text-starlight-dim">{COMPOSITE_INTRO}</p>
      <Axis axis={reading.sun} />
      <Axis axis={reading.moon} />
      <Axis axis={reading.venus} />
    </section>
  );
}

function Axis({ axis }: { axis: CompositeAxis }) {
  return (
    <div className="mt-10">
      <h3 className="break-keep font-display text-lg text-starlight">{axis.title}</h3>
      <p className="mt-1.5 max-w-[56ch] break-keep text-meta text-gold-soft">{axis.frame}</p>
      <p className="mt-2.5 max-w-[62ch] break-keep leading-relaxed text-starlight-dim">{axis.body}</p>
    </div>
  );
}
```

- [ ] **Step 2: SynastryReading 배선** — `{partner && theirChart && reading && (…)}` 프래그먼트 안, 공유 버튼 블록(`{reading.oneLiner && (<div className="mt-14 …`) **바로 앞**에:

```tsx
            <CompositeSection mine={myChart} theirs={theirChart} />
```

(`reading.empty` 분기와 무관하게 렌더 — 닿는 각도가 없어도 컴포짓은 성립한다.) import 추가.

- [ ] **Step 3: ExampleMeeting 배선** — 파일을 열어 구조 확인 후, 예시 본문 마지막에 `<CompositeSection mine={mine} theirs={theirs} />` 추가(`exampleMeeting()`이 이미 mine/theirs Chart를 준다 — 그 컴포넌트가 쓰는 변수 그대로). 예시 라벨·주석 톤 유지.

- [ ] **Step 4: 검증** — `npx tsc --noEmit` 0 → `npm run build` → `Select-String -Path out/synastry.html -Pattern "세 번째 하늘"` 매치(예시가 서버 HTML에 있음) → `npx vitest run` 회귀

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/synastry/CompositeSection.tsx src/components/synastry/SynastryReading.tsx src/components/synastry/ExampleMeeting.tsx <변경된 폰트 파일>
git commit -m "feat(composite): the meeting page gains its third sky"
```

---

### Task 4: 초대 인코딩 — invite.ts

**Files:**
- Create: `byeolsaem-web/src/lib/invite.ts`
- Test: `byeolsaem-web/src/test/invite.test.ts`

**Interfaces:**
- Produces:

```ts
export interface InvitePayload { date: string; time: string | null; city: string; }
export function encodeInvite(p: InvitePayload): string;              // base64url, 패딩 없음
export function decodeInvite(raw: string): InvitePayload | null;     // 검증 불통과 → null
export function inviteUrl(p: InvitePayload): string;                 // https://byeolsaem.com/synastry#i=…
export function readInviteFromHash(hash: string): InvitePayload | null; // "#i=…" → payload
export const INVITE_CONSENT: string;                                 // 동의 문구 원문
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/invite.test.ts
import { describe, expect, it } from "vitest";
import {
  decodeInvite, encodeInvite, INVITE_CONSENT, inviteUrl, readInviteFromHash,
} from "@/lib/invite";

const P = { date: "1995-07-14", time: "09:30", city: "서울특별시" };

describe("invite 왕복", () => {
  it("encode→decode가 동일하다 (time null 포함)", () => {
    expect(decodeInvite(encodeInvite(P))).toEqual(P);
    const noTime = { ...P, time: null };
    expect(decodeInvite(encodeInvite(noTime))).toEqual(noTime);
  });
  it("인코딩 결과는 URL-안전 문자뿐이다 (한글 도시 포함)", () => {
    expect(encodeInvite(P)).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("변조·깨짐은 전부 null", () => {
    expect(decodeInvite("!!!not-base64!!!")).toBeNull();
    expect(decodeInvite("")).toBeNull();
    // 형식 위반: 날짜 아님
    expect(decodeInvite(encodeInvite({ ...P, date: "9999-99" } as never))).toBeNull();
    // 필드 누락
    const partial = btoa(JSON.stringify({ date: "1995-07-14" }))
      .replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
    expect(decodeInvite(partial)).toBeNull();
  });
  it("inviteUrl은 fragment를 쓴다", () => {
    expect(inviteUrl(P)).toMatch(/^https:\/\/byeolsaem\.com\/synastry#i=[A-Za-z0-9_-]+$/);
  });
  it("readInviteFromHash — #i= 접두를 벗기고 읽는다, 아니면 null", () => {
    const url = inviteUrl(P);
    expect(readInviteFromHash(url.slice(url.indexOf("#")))).toEqual(P);
    expect(readInviteFromHash("#other=1")).toBeNull();
    expect(readInviteFromHash("")).toBeNull();
  });
  it("동의 문구 원문이 스펙과 같다", () => {
    expect(INVITE_CONSENT).toBe(
      "링크에는 내 생년월일시와 출생지가 담깁니다. 궁합을 보고 싶은 사람에게만 보내세요.",
    );
  });
});
```

- [ ] **Step 2: 실패 확인** — `npx vitest run src/test/invite.test.ts` → FAIL

- [ ] **Step 3: 구현**

```ts
// src/lib/invite.ts
/**
 * 궁합 초대 링크 — 내 출생 정보를 URL fragment에 담아 보낸다.
 *
 * fragment(#)인 이유: # 뒤는 브라우저 밖으로 나가지 않는다. 서버 로그도, Web
 * Analytics도, 리퍼러도 이 값을 보지 못한다. 정적 사이트라 서버에 맡길 수도
 * 없고, 맡길 필요도 없다.
 *
 * 받는 쪽에서 이 데이터는 화면 상태까지만 간다 — localStorage에 저장하지
 * 않는다(SynastryReading의 "상대 정보는 저장하지 않는다" 원칙 그대로).
 *
 * 링크를 가진 사람은 담긴 정보를 해독할 수 있다. 그래서 만들기 버튼이 동의
 * 문구(INVITE_CONSENT)를 항상 먼저 보여준다.
 */
export interface InvitePayload {
  date: string;
  time: string | null;
  city: string;
}

export const INVITE_CONSENT =
  "링크에는 내 생년월일시와 출생지가 담깁니다. 궁합을 보고 싶은 사람에게만 보내세요.";

// birth-profile.ts와 같은 수준의 검증 — 변조된 링크가 계산기까지 내려가면 안 된다.
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isPayload(v: unknown): v is InvitePayload {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Record<string, unknown>;
  if (typeof p.date !== "string" || !DATE_PATTERN.test(p.date)) return false;
  if (p.time !== null && (typeof p.time !== "string" || !TIME_PATTERN.test(p.time))) return false;
  if (typeof p.city !== "string" || p.city.trim() === "") return false;
  return true;
}

/** UTF-8 안전 base64url. atob/btoa는 라틴만 다루므로 바이트로 오간다. */
export function encodeInvite(p: InvitePayload): string {
  const bytes = new TextEncoder().encode(JSON.stringify(p));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function decodeInvite(raw: string): InvitePayload | null {
  if (!raw) return null;
  try {
    const binary = atob(raw.replaceAll("-", "+").replaceAll("_", "/"));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return isPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function inviteUrl(p: InvitePayload): string {
  return `https://byeolsaem.com/synastry#i=${encodeInvite(p)}`;
}

export function readInviteFromHash(hash: string): InvitePayload | null {
  if (!hash.startsWith("#i=")) return null;
  return decodeInvite(hash.slice(3));
}
```

- [ ] **Step 4: 통과 + 회귀** — `npx vitest run` 전체 PASS

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/invite.ts src/test/invite.test.ts <변경된 폰트 파일>
git commit -m "feat(invite): a birth moment learns to travel inside a fragment"
```

---

### Task 5: InviteButton + 송수신 배선

**Files:**
- Create: `byeolsaem-web/src/components/synastry/InviteButton.tsx`
- Modify: `byeolsaem-web/src/components/synastry/SynastryReading.tsx`

**Interfaces:**
- Consumes: `inviteUrl`·`INVITE_CONSENT`·`readInviteFromHash`·`InvitePayload`(Task 4), `BirthProfile`(`@/lib/birth-profile`), `formatBirthDate`
- Produces: `<InviteButton profile={BirthProfile} />`

- [ ] **Step 1: InviteButton**

```tsx
// src/components/synastry/InviteButton.tsx
"use client";
import { useState } from "react";
import type { BirthProfile } from "@/lib/birth-profile";
import { INVITE_CONSENT, inviteUrl } from "@/lib/invite";

/**
 * 초대 링크 보내기 — 모바일은 OS 공유 시트(받는 앱은 사용자가 고른다),
 * 데스크톱 등 navigator.share가 없으면 클립보드 폴백. 카카오 SDK는 쓰지
 * 않는다 — 사이트의 공유 관례: 이미지 카드는 카카오, 링크는 공유 시트.
 */
export function InviteButton({ profile }: { profile: BirthProfile }) {
  const [copied, setCopied] = useState(false);
  const url = inviteUrl({ date: profile.date, time: profile.time, city: profile.city });

  const send = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "별샘 궁합 초대",
          text: "두 하늘이 만나는 자리를 봐요",
          url,
        });
      } catch {
        // 사용자가 시트를 닫은 것(AbortError) — 아무 일도 아니다.
      }
      return;
    }
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-[52ch]">
      <p className="break-keep text-meta text-starlight-dim">{INVITE_CONSENT}</p>
      <button
        type="button"
        onClick={send}
        className="mt-3 border border-gold/25 px-4 py-2 text-meta tracking-[0.08em] text-gold-soft transition-colors hover:border-gold/50 hover:text-starlight motion-reduce:transition-none"
      >
        {copied ? "복사됐습니다" : "초대 링크 보내기"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 송신 배선 (SynastryReading)** — 두 자리:
  1. 상대 입력 전 화면: `{!partner && <AskPartner onAsk={askPartner} />}` 아래에
     `{!partner && <div className="mt-10"><InviteButton profile={profile} /></div>}` —
     상대를 옆에 앉히는 대신 링크로 보내는 것이 이 기능의 존재 이유.
  2. 결과 하단 공유 무리: 공유 버튼 div(`mt-14 flex flex-wrap …`) 바로 아래 형제로
     `<div className="mt-8"><InviteButton profile={profile} /></div>`.

- [ ] **Step 3: 수신 배선 (SynastryReading)** — 상태·효과 추가:

```tsx
const [invited, setInvited] = useState<InvitePayload | null>(null);

// 초대 링크로 왔는가 — fragment는 마운트 후에만 읽을 수 있다(SSR엔 없다).
// history에서 지우지 않는다: 새로고침해도 초대가 유지되는 쪽이 받는 사람에게
// 편하고, 주소창·메시지에 이미 남아 있어 지워도 보안 이득이 없다.
useEffect(() => {
  const payload = readInviteFromHash(window.location.hash);
  if (payload) {
    setInvited(payload);
    setPartner({ ...payload, concern: null });
  }
}, []);
```

- 초대 배너: 본문 컬럼(`<div className="min-w-0">`) 맨 위에 —

```tsx
{invited && (
  <p className="mb-8 border border-gold/25 bg-ink-raised/60 px-4 py-3 break-keep text-guide text-starlight-dim">
    누군가 궁합을 청했습니다 · {formatBirthDate(invited.date)}의 하늘이 도착해 있어요.
  </p>
)}
```

- **우선순위 규칙**: 초대가 있으면 profile이 없어도 `ExampleMeeting`으로 빠지지
  않는다 — `if (!profile) return <ExampleMeeting />`를 `if (!profile && !invited)`로
  바꾸고, `!profile && invited`면 배너 + "내 밤하늘 열기" 유도(requestRitual 버튼,
  기존 문구 톤)만 보여준다. 입력이 끝나면(useBirthProfile이 갱신) 결과가 뜬다.
- "다른 사람으로"(askPartner)를 누르면 `setInvited(null)`도 함께 — 배너가 초대가
  아닌 상대 위에 남으면 거짓말이 된다.

- [ ] **Step 4: 검증** — `npx tsc --noEmit` 0 → `npm run build` → `npx vitest run` 회귀.
  수동 확인(로컬): `npm run dev` 없이도 빌드 산출물로 가능하지만, 여기서는 정적
  검증까지만 — 실연은 Task 8의 dev-browser 실측이 담당.

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/synastry/InviteButton.tsx src/components/synastry/SynastryReading.tsx <변경된 폰트 파일>
git commit -m "feat(invite): the meeting page learns to send for the other sky"
```

---

### Task 6: 천문력 데이터 — ephemeris-table.ts

**Files:**
- Create: `byeolsaem-web/src/lib/ephemeris-table.ts`
- Test: `byeolsaem-web/src/test/ephemeris-table.test.ts`

**Interfaces:**
- Consumes: `longitudeOf`(`./chart`), `toJulianDay`·`norm180`(`./ephemeris`), `signAtLongitude`(`./zodiac`), `PLANETS`·`PlanetKey`(`./planets`)
- Produces:

```ts
export interface EphemerisCell {
  planet: PlanetKey; symbol: string; signKo: string;
  degree: number; minute: number; retrograde: boolean;
}
export interface EphemerisRow { date: string; cells: EphemerisCell[]; }
export function monthTable(year: number, month: number): EphemerisRow[];
```

- [ ] **Step 1: 실패하는 테스트**

```ts
// src/test/ephemeris-table.test.ts
import { describe, expect, it } from "vitest";
import { monthTable } from "@/lib/ephemeris-table";

describe("monthTable", () => {
  it("행 수 = 그 달의 일수, 셀 수 = 10", () => {
    const oct = monthTable(2026, 10);
    expect(oct).toHaveLength(31);
    expect(monthTable(2026, 9)).toHaveLength(30);
    expect(oct[0].cells).toHaveLength(10);
    expect(oct[0].date).toBe("2026-10-01");
  });
  it("추분 다음날 태양은 천칭 0~1도다", () => {
    const row = monthTable(2026, 9).find((r) => r.date === "2026-09-24")!;
    const sun = row.cells.find((c) => c.planet === "sun")!;
    expect(sun.signKo).toBe("천칭자리");
    expect(sun.degree).toBeLessThanOrEqual(1);
  });
  it("수성 역행 중(2026-10-30)엔 수성 ℞, 순행 중(2026-10-01)엔 아님", () => {
    const on = monthTable(2026, 10).find((r) => r.date === "2026-10-30")!;
    expect(on.cells.find((c) => c.planet === "mercury")!.retrograde).toBe(true);
    const off = monthTable(2026, 10).find((r) => r.date === "2026-10-01")!;
    expect(off.cells.find((c) => c.planet === "mercury")!.retrograde).toBe(false);
  });
  it("태양·달은 역행하지 않는다", () => {
    for (const row of monthTable(2026, 10)) {
      expect(row.cells.find((c) => c.planet === "sun")!.retrograde).toBe(false);
      expect(row.cells.find((c) => c.planet === "moon")!.retrograde).toBe(false);
    }
  });
  it("도·분이 범위 안이다", () => {
    for (const c of monthTable(2026, 10)[14].cells) {
      expect(c.degree).toBeGreaterThanOrEqual(0);
      expect(c.degree).toBeLessThanOrEqual(29);
      expect(c.minute).toBeGreaterThanOrEqual(0);
      expect(c.minute).toBeLessThanOrEqual(59);
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — FAIL 확인

- [ ] **Step 3: 구현**

```ts
// src/lib/ephemeris-table.ts
import { longitudeOf } from "./chart";
import { norm180, toJulianDay } from "./ephemeris";
import { PLANETS, type PlanetKey } from "./planets";
import { signAtLongitude } from "./zodiac";

/**
 * 천문력 표 — 날짜별(KST 자정) 10행성의 위치. 해석이 아니라 원자료다.
 *
 * 역행 판정은 하루 전후의 황경 차이(수치 미분)로 한다 — retrograde.ts의
 * longitudeRate는 수·금·화만 알지만, 표는 목성~명왕성의 ℞도 보여줘야 한다.
 * 태양·달은 겉보기 역행이 없으므로 항상 false다.
 */
export interface EphemerisCell {
  planet: PlanetKey;
  symbol: string;
  signKo: string;
  degree: number;
  minute: number;
  retrograde: boolean;
}
export interface EphemerisRow {
  date: string;
  cells: EphemerisCell[];
}

const KST_MS = 9 * 3600000;
const NEVER_RETRO: PlanetKey[] = ["sun", "moon"];

export function monthTable(year: number, month: number): EphemerisRow[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rows: EphemerisRow[] = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const at = new Date(Date.UTC(year, month - 1, day) - KST_MS); // KST 자정
    const jd = toJulianDay(at);
    const cells = PLANETS.map((planet): EphemerisCell => {
      const lon = longitudeOf(planet.key, jd);
      const inSign = lon % 30;
      let degree = Math.floor(inSign);
      let minute = Math.round((inSign - degree) * 60);
      if (minute === 60) {
        // 59.5분 반올림이 60이 되면 도 쪽으로 올린다 — 29°60′은 표에 못 싣는다.
        minute = 0;
        degree += 1;
      }
      const retrograde = NEVER_RETRO.includes(planet.key)
        ? false
        : norm180(longitudeOf(planet.key, jd + 0.5) - longitudeOf(planet.key, jd - 0.5)) < 0;
      return {
        planet: planet.key,
        symbol: planet.symbol,
        signKo: signAtLongitude(lon).ko,
        degree,
        minute,
        retrograde,
      };
    });
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    rows.push({ date: `${year}-${mm}-${dd}`, cells });
  }
  return rows;
}
```

주의: `degree += 1`이 30이 되는 극단(29°59.5′)에서는 자리 이름과 도수가 한 칸
어긋나 보일 수 있으나, 표기 관례상 30°00′ 대신 다음 자리 0°00′으로 읽히는 것이
맞고 signKo는 lon 기준이라 이미 그 자리다 — 주석으로 남기고 그대로 둔다.
(정확히는 `degree === 30`이면 `degree = 0`으로 두는 것이 안전하다 — 구현에
`if (degree === 30) degree = 0;`을 `if (minute === 60)` 블록 뒤에 추가하라.)

- [ ] **Step 4: 통과 + 회귀** — `npx vitest run` 전체 PASS (역행 미분 계산으로 수 초 걸릴 수 있음)

- [ ] **Step 5: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/lib/ephemeris-table.ts src/test/ephemeris-table.test.ts <변경된 폰트 파일>
git commit -m "feat(ephemeris): the raw positions line up into daily rows"
```

---

### Task 7: 천문력 라우트 — 허브 + 월별 12장

**Files:**
- Create: `byeolsaem-web/src/components/ephemeris/EphemerisTable.tsx`
- Create: `byeolsaem-web/src/app/(night-static)/ephemeris/page.tsx`
- Create: `byeolsaem-web/src/app/(night-static)/ephemeris/[year]/[month]/page.tsx`
- Modify: `byeolsaem-web/src/components/calendar/CurrentMonthNotice.tsx` (`hrefBase` prop)

**Interfaces:**
- Consumes: `monthTable`(Task 6), `BUILD_MONTHS`(`@/lib/calendar-events`), `monthEvents`·`eventTitle`(달력 것 재사용), `CalMonthNav`(`@/components/calendar/CalMonthNav` — `label/prevHref/nextHref/as` props), `alternatesFor`·`ogImage`, `JsonLd`·`breadcrumbSchema`·`faqSchema`, `NextSteps`, `PlaceBand`, `kstParts`
- Produces: 라우트 `/ephemeris`, `/ephemeris/[year]/[month]` 12장

- [ ] **Step 1: CurrentMonthNotice에 hrefBase** — props에 `hrefBase?: string`(기본 `"/calendar"`), 링크 `href={\`${hrefBase}/${year}/${…}\`}`. 달력 허브는 무변경으로 지나간다. 주석 한 줄: `// 천문력 허브도 같은 어긋남 안내를 쓴다 — 목적지 베이스만 다르다.`

- [ ] **Step 2: EphemerisTable (서버)**

```tsx
// src/components/ephemeris/EphemerisTable.tsx
import { eventTitle } from "@/lib/calendar-copy";
import { monthEvents } from "@/lib/calendar-events";
import type { EphemerisRow } from "@/lib/ephemeris-table";
import { kstParts } from "@/lib/retrograde-clock";

/**
 * 천문력 표 렌더. 표가 화면보다 넓으므로 반드시 자기 컨테이너 안에서 가로
 * 스크롤한다(overflow-x-auto) — 페이지 몸통이 옆으로 밀리면 안 된다.
 * 숫자 열은 tabular-nums로 세로가 맞는다.
 */
export function EphemerisTable({ year, month, rows }: { year: number; month: number; rows: EphemerisRow[] }) {
  // 이 달의 사건(신월·보름·역행 경계·인그레스)을 날짜에 붙인다 — 표를 읽다가
  // "이 날 무슨 일이" 를 달력까지 안 가고 알 수 있게.
  const notes = new Map<number, string[]>();
  for (const ev of monthEvents(year, month)) {
    const p = kstParts(ev.date);
    if (p.month !== month) continue;
    (notes.get(p.day) ?? notes.set(p.day, []).get(p.day)!).push(eventTitle(ev));
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-gold/25 text-left">
            <th scope="col" className="py-2 pr-3 font-normal text-starlight-dim">날짜</th>
            {rows[0].cells.map((c) => (
              <th key={c.planet} scope="col" className="astro-symbol px-2 py-2 text-center font-normal text-gold-soft" title={c.planet}>
                {c.symbol}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const day = Number(row.date.slice(8));
            const note = notes.get(day);
            return (
              <tr key={row.date} className="border-b border-gold/10">
                <th scope="row" className="whitespace-nowrap py-1.5 pr-3 text-left font-normal text-starlight-dim">
                  {day}일{note && <span className="ml-2 text-[0.7rem] text-gold">{note.join(" · ")}</span>}
                </th>
                {row.cells.map((c) => (
                  <td key={c.planet} className="whitespace-nowrap px-2 py-1.5 text-center text-starlight">
                    <span className="astro-symbol text-gold-soft">{c.signKo.slice(0, 1)}</span>{" "}
                    {c.degree}°{String(c.minute).padStart(2, "0")}′
                    {c.retrograde && <span className="ml-0.5 text-gold" aria-label="역행">℞</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-meta text-starlight-dim">
        자리 표기는 첫 글자입니다 — 양·황·쌍·게·사·처·천·전·궁·염·물·물고기는 위 범례를 보세요.
      </p>
    </div>
  );
}
```

주의: 자리 첫 글자 축약은 "물병자리/물고기자리"가 "물"로 겹친다 — 구현 시
`signKo.slice(0, 1)` 대신 **두 글자**(`slice(0, 2)`: 물병/물고)로 하고 안내문도
맞춰 고칠 것. 범례(12자리 전체 이름)는 페이지 쪽 소개 아래 한 줄로 둔다.

- [ ] **Step 3: 월별 페이지** — 달력의 `[year]/[month]/page.tsx`(src/app/(night-static)/calendar/[year]/[month]/page.tsx)를 **열어 그대로 본뜬다**: `BUILD_MONTHS` import(자체 `calendarMonths(new Date())` 호출 금지 — 단일 빌드 시계), `pad`/`monthHref`(베이스만 `/ephemeris`), `generateStaticParams`, `parseParams`+`notFound`, `await params`. 다른 점만:
  - 제목: `${year}년 ${month}월 천문력 — 날짜별 행성 위치표 | 별샘`
  - description: `${year}년 ${month}월 매일 자정(KST)의 열 행성 위치. 별자리·도수·역행(℞)까지 실제 천문 계산 그대로의 원자료입니다.`
  - openGraph: `ogImage(path, "/og/ephemeris.png")`
  - 본문: eyebrow `EPHEMERIS` → `<CalMonthNav label={\`${year}년 ${month}월 천문력\`} …/>` (달력과 달리 view-transition-name 없음 — 표는 슬라이드 연출 대상이 아니다) → 범례 한 줄(12자리 두 글자 축약 ↔ 전체 이름) → `<EphemerisTable year month rows={monthTable(year, month)} />`
  - FAQ JSON-LD 2개: {"이 표는 언제 기준인가요?", "각 날짜의 한국 시간 자정(00:00 KST) 기준입니다. 하루 사이에도 달은 약 13도를 움직이므로, 정밀한 시각이 필요하면 천궁도 계산기를 쓰세요."} / {"℞ 표시는 무엇인가요?", "그 날 그 행성이 역행 중이라는 뜻입니다. 실제로 뒤로 도는 것이 아니라 지구에서 본 겉보기 움직임입니다."}
  - NextSteps: primary `/natal` "내 천궁도 보기", secondary `/calendar` "하늘의 달력 보기"

- [ ] **Step 4: 허브 /ephemeris** — 달력 허브(calendar/page.tsx)를 본뜬다: `BUILD_MONTHS[1]`이 당월, canonical `/ephemeris`, `<CurrentMonthNotice builtYear builtMonth hrefBase="/ephemeris" />`, 소개문(천문력이 무엇인지 3문장 — "천문력은 날짜별 행성 위치를 적은 표입니다. 점성술의 모든 해석은 이 원자료에서 시작합니다. 별샘의 다른 페이지가 답을 준다면, 이 표는 재료를 그대로 보여줍니다.") + "표 읽는 법"(℞·KST 자정·두 글자 축약) + 당월 표 + NextSteps.

- [ ] **Step 5: 검증** — `npx tsc --noEmit` 0 → `npm run build` → out/ephemeris.html + `out/ephemeris/<y>/<m>.html` 12장 확인, `Select-String -Path out/ephemeris.html -Pattern "℞|천문력"` 매치 → `npx vitest run` 회귀

- [ ] **Step 6: 폰트 서브셋 + 커밋**

```bash
python scripts/subset-maruburi.py
git add src/components/ephemeris "src/app/(night-static)/ephemeris" src/components/calendar/CurrentMonthNotice.tsx <변경된 폰트 파일>
git commit -m "feat(ephemeris): thirteen pages of raw sky positions"
```

---

### Task 8: 마감 — 내비·SEO·배포·실측

**Files:**
- Modify: `byeolsaem-web/src/components/nav/nav-map.ts`
- Modify: `byeolsaem-web/src/app/sitemap.ts`
- Modify: `byeolsaem-web/scripts/build-og.mjs`
- Modify: `byeolsaem-web/scripts/prefetch-chunks.mjs`
- Modify: `byeolsaem-web/src/app/(night-static)/synastry/page.tsx` (메타 description)

- [ ] **Step 1: nav-map** — 읽을거리 그룹에 `{ href: "/ephemeris", label: "천문력", desc: "날짜별 행성 위치의 원자료" }`. `NAV_NEW`: 기존 3개(/weekly·/calendar·/solar-return)는 제거 시점(2026-09-20께) 전이므로 유지하되, `/ephemeris` 추가.
- [ ] **Step 2: sitemap** — `{ url: \`${BASE}/ephemeris\`, changeFrequency: "monthly", priority: 0.6 }` + BUILD_MONTHS 기반 월별 12장(달력 months 블록과 같은 수법, priority 0.5).
- [ ] **Step 3: OG 카드** — PAGE_CARDS에 `{ file: "ephemeris.png", eyebrow: "EPHEMERIS", title: "천문력", sub: "날짜별 행성 위치, 원자료 그대로", motif: "horizon" }` → `node --experimental-strip-types scripts/build-og.mjs` → `git status`로 **새 1장만** 확인.
- [ ] **Step 4: prefetch** — `NAV_TARGETS` += `"ephemeris.html"`.
- [ ] **Step 5: 궁합 메타** — synastry/page.tsx의 description 끝에 초대 언급 한 구절(예: " 초대 링크를 보내면 상대가 자기 하늘만 넣어 바로 볼 수 있습니다.") — 기존 문장 톤 유지, 전체 160자 안팎 유지.
- [ ] **Step 6: 전체 검증 + 커밋 + 배포**

```
npx vitest run     → 전부 PASS
npx tsc --noEmit   → 0
npm run build      → postbuild 로그 확인
```

```bash
python scripts/subset-maruburi.py
git add src/components/nav/nav-map.ts src/app/sitemap.ts scripts/build-og.mjs scripts/prefetch-chunks.mjs "src/app/(night-static)/synastry/page.tsx" public/og/ephemeris.png <변경된 폰트 파일>
git commit -m "feat(seo): the ephemeris joins the map, the invite joins the pitch"
```

레포 루트에서 `npx wrangler deploy`.

- [ ] **Step 7: dev-browser 실측** (배포 전파 대기 후):
  1. `/synastry` (localStorage 클리어) — 예시에 "세 번째 하늘" 섹션 노출.
  2. 초대 왕복: `page.evaluate`로 localStorage에 프로필 심기 → /synastry에서 초대 URL을 DOM에서 얻거나 `inviteUrl` 로직으로 구성 → **localStorage 클리어 후** 그 URL로 이동 → 배너("누군가 궁합을 청했습니다") + "내 밤하늘 열기" 유도 확인 → 프로필 다시 심고 새로고침 → 결과 + 컴포짓 섹션까지 렌더.
  3. `/ephemeris` — 표 렌더, ℞ 존재(10월로 이동해 확인), 모바일 390px에서 표만 가로 스크롤(body는 안 밀림: `document.body.scrollWidth <= innerWidth`).
  4. 메뉴 오버레이 — 읽을거리에 "천문력" 노출.
  5. 콘솔 에러 0.
- [ ] **Step 8: push + 사용자 안내** — `git push`. 사용자에게: (a) GSC·네이버 수집 요청 `/ephemeris`, (b) **휴대폰 실측 1건** — 궁합에서 초대 링크를 카톡으로 보내고 인앱 브라우저로 열어 배너가 뜨는지(fragment 보존). 안 뜨면 보고 — 쿼리 방식 전환은 스펙에 절충 기준 기록됨.

---

## 셀프 리뷰 결과 (계획 작성 시점)

- 스펙 커버리지: 컴포짓 계산·읽기·배선(T1–3) ✓ 초대 인코딩·버튼·송수신(T4–5) ✓ 천문력 데이터·라우트(T6–7) ✓ 내비·SEO·실측(T8) ✓. 스펙의 "하지 않는 것" 전부 부재 확인.
- 타입 일관성: `CompositeChart`·`InvitePayload`·`EphemerisRow` 시그니처가 생산/소비 태스크에서 동일. `CalMonthNav` props(label/prevHref/nextHref)와 `as` 미사용(월별 h1 기본) 확인.
- 미확정 지점 명시 2곳: 자리 축약 두 글자 전환(T7 Step 2 주의), degree 30 캐리(T6 Step 3 주의) — 구현 지시에 포함됨.
