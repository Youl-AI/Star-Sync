# 어스펙트 해석 업그레이드 1단계(구조) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 어스펙트 순위에 개인성 가중치를 넣고, 오브 세기를 말로 표기하고, nuance·modeOf 등 2단계(내용 채움)가 딛고 설 구조를 세운다.

**Architecture:** `chart.ts`는 기하만 안다 — 손대지 않는다. 개인성 가중치·세기 구간·세대 라벨은 해석의 관심사이므로 전부 `lib/reading.ts`에 산다. `planets.ts`의 `personal: boolean`을 `tier` 3단으로 대체하고 소비자 3곳을 함께 옮긴다. 본문은 이번 단계에서는 기존 `ASPECT_MEANINGS.body` 그대로다(2단계에서 PAIR_READINGS로 교체).

**Tech Stack:** Next.js 16 정적 export · Vitest · Python(폰트 서브셋 스크립트)

## Global Constraints

스펙: `docs/superpowers/specs/2026-08-21-aspect-reading-upgrade-design.md` — 충돌 시 스펙이 이긴다.

- 런타임 AI 없음. 같은 배치면 같은 문장 (RENEWAL_PLAN §2.3).
- `ASPECT_MEANINGS`의 `headline`·`body`는 유지한다 — `/today`·`/yearly`가 쓴다 (스펙 §6).
- tier 배정: personal = 태양·달·수성·금성·화성 / social = 목성·토성 / generational = 천왕성·해왕성·명왕성 (스펙 §3).
- 가중치 (스펙 §3, 이 값 그대로): personal-personal 1.0 · personal-social 0.85 · personal-generational 0.7 · social-social 0.5 · social-generational 0.35 · generational-generational 0.15.
- 세기 구간 (스펙 §4): strength ≥ 0.8 → "거의 정확" / ≥ 0.55 → "뚜렷" / 그 외 → "넓게 걸침".
- nuance 다섯 줄과 세대 라벨 문장은 스펙 §2.1·§3의 확정 문안 그대로 — 한 글자도 바꾸지 않는다.
- 한국어 문자열을 추가한 태스크는 커밋 전 `python scripts/subset-maruburi.py`를 돌린다. 안 돌리면 `fonts.test.ts`가 막는다(의도된 게이트).
- 모든 명령은 `byeolsaem-web/`에서 실행한다.

---

### Task 1: planets.ts — `personal: boolean`을 `tier` 3단으로

**Files:**
- Modify: `byeolsaem-web/src/lib/planets.ts`
- Modify: `byeolsaem-web/src/lib/reading.ts` (ordered 정렬)
- Modify: `byeolsaem-web/src/components/chart/NatalReading.tsx:472` (세대 노트 조건)
- Test: `byeolsaem-web/src/test/atoms.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: `export type PlanetTier = "personal" | "social" | "generational"`, `Planet.tier: PlanetTier` (기존 `personal` 필드는 삭제), `export const TIER_RANK: Record<PlanetTier, number>` (planets.ts에서, personal=0 social=1 generational=2)

- [ ] **Step 1: 실패하는 테스트로 교체**

`byeolsaem-web/src/test/atoms.test.ts`의 기존 테스트(140~144행 부근)를 교체한다:

```ts
// 기존 — 삭제
it("세대를 말하는 별은 개인을 말하는 별보다 뒤에 온다", () => {
  const reading = assembleReading(computeChart(moment), null);
  const order = reading.placements.map((p) => p.planet.personal);
  expect(order.lastIndexOf(true)).toBeLessThan(order.indexOf(false));
});

// 신규 — 이것으로 대체
it("행성 목록은 개인 → 사회 → 세대 순으로 선다", () => {
  // 렌즈 없이 조립하면 highlighted가 전부 false라 tier만이 순서를 정한다.
  const reading = assembleReading(computeChart(moment), null);
  const ranks = reading.placements.map((p) => TIER_RANK[p.planet.tier]);
  for (let i = 1; i < ranks.length; i++) {
    expect(ranks[i], `${reading.placements[i].planet.ko}의 자리`).toBeGreaterThanOrEqual(
      ranks[i - 1],
    );
  }
});

it("tier 배정이 스펙 §3과 같다", () => {
  const byTier = (tier: string) =>
    PLANETS.filter((p) => p.tier === tier).map((p) => p.key);
  expect(byTier("personal")).toEqual(["sun", "moon", "mercury", "venus", "mars"]);
  expect(byTier("social")).toEqual(["jupiter", "saturn"]);
  expect(byTier("generational")).toEqual(["uranus", "neptune", "pluto"]);
});
```

import 줄에 `TIER_RANK`를 추가한다: `import { PLANETS, TIER_RANK } from "@/lib/planets";`

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/test/atoms.test.ts`
Expected: FAIL — `TIER_RANK`가 planets.ts에 없어 import 에러, 또는 `p.tier` undefined.

- [ ] **Step 3: planets.ts 구현**

`Planet` 인터페이스에서 `personal: boolean` 필드와 그 주석을 삭제하고 교체:

```ts
export type PlanetTier = "personal" | "social" | "generational";

/** 정렬용 서열. 개인을 말하는 별이 앞에 선다. */
export const TIER_RANK: Record<PlanetTier, number> = {
  personal: 0,
  social: 1,
  generational: 2,
};

export interface Planet {
  // ...기존 필드 유지...
  /**
   * 이 별이 말하는 층. personal은 개인, social(목성·토성)은 또래 몇 년,
   * generational(천왕성~명왕성)은 한 세대가 같은 값을 갖는다. 층이 낮을수록
   * 별자리로 읽을 수 있고, 낮지 않으면 하우스와 어스펙트로 읽어야 한다.
   */
  tier: PlanetTier;
}
```

PLANETS 배열의 각 항목에서 `personal: true/false`를 tier로 바꾼다:
sun·moon·mercury·venus·mars → `tier: "personal"` / jupiter·saturn → `tier: "social"` / uranus·neptune·pluto → `tier: "generational"`.

주의: 현재 코드는 목성·토성이 `personal: true`다. 스펙 §3이 이 둘을 social로
내리므로 **행성 목록 정렬이 실제로 바뀐다** — 의도된 변화다.

- [ ] **Step 4: 소비자 2곳 이행**

`byeolsaem-web/src/lib/reading.ts` — import에 `TIER_RANK` 추가
(`import { PLANET_BY_KEY, TIER_RANK, type Planet } from "./planets";`), ordered 정렬 교체:

```ts
// 기존
const ordered = [...placements].sort((a, b) => {
  if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
  if (a.planet.personal !== b.planet.personal) return a.planet.personal ? -1 : 1;
  return 0;
});

// 신규 — 관심사에 걸린 것 → 개인 → 사회 → 세대
const ordered = [...placements].sort((a, b) => {
  if (a.highlighted !== b.highlighted) return a.highlighted ? -1 : 1;
  return TIER_RANK[a.planet.tier] - TIER_RANK[b.planet.tier];
});
```

`byeolsaem-web/src/components/chart/NatalReading.tsx:472` — 조건만 교체
(같은 세 행성이 대상이므로 화면 문구는 그대로):

```tsx
// 기존:  {!item.planet.personal && (
// 신규:  {item.planet.tier === "generational" && (
```

- [ ] **Step 5: 전체 테스트**

Run: `npx vitest run` 그리고 `npx tsc --noEmit`
Expected: 전부 PASS. (`.personal` 참조가 남아 있으면 타입 검사가 잡는다.)

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor(planets): one tier field instead of a boolean and a comment

Jupiter and Saturn were marked personal, which let a cohort aspect
outrank a natal one downstream. Three tiers name what the boolean
blurred, and the spec's ranking weights need all three."
```

---

### Task 2: aspects.ts — nuance 다섯 줄과 modeOf

**Files:**
- Modify: `byeolsaem-web/src/content/atoms/aspects.ts`
- Test: `byeolsaem-web/src/test/atoms.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `ASPECT_MEANINGS` 각 항목에 `nuance: string` 추가 (headline·body 유지), `export type AspectMode = "conjunction" | "flowing" | "friction"`, `export function modeOf(key: AspectKey): AspectMode`

- [ ] **Step 1: 실패하는 테스트 추가**

`atoms.test.ts`의 어스펙트 describe 블록에:

```ts
it("각도마다 nuance 꼬리 한 줄이 있다", () => {
  for (const type of ASPECT_TYPES) {
    const { nuance } = ASPECT_MEANINGS[type.key];
    expect(nuance, type.ko).toBeTruthy();
    expect(nuance.length, type.ko).toBeGreaterThan(15);
    expect(nuance.endsWith("."), type.ko).toBe(true);
  }
});

it("modeOf가 다섯 각도를 세 모드로 접는다", () => {
  expect(modeOf("conjunction")).toBe("conjunction");
  expect(modeOf("sextile")).toBe("flowing");
  expect(modeOf("trine")).toBe("flowing");
  expect(modeOf("square")).toBe("friction");
  expect(modeOf("opposition")).toBe("friction");
});
```

import에 `modeOf` 추가.

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/test/atoms.test.ts`
Expected: FAIL — `modeOf` 미정의.

- [ ] **Step 3: 구현**

`aspects.ts`의 타입을 `Record<AspectKey, { headline: string; body: string; nuance: string }>`로
넓히고, 각 항목에 스펙 §2.1의 확정 문안을 그대로 넣는다:

```ts
conjunction: { ..., nuance: "두 힘이 한 몸처럼 붙어 있어, 본인은 이것이 두 가지라는 것을 잘 알아차리지 못합니다." },
sextile:     { ..., nuance: "저절로 작동하지는 않습니다. 의식해서 쓸 때만 열리는 통로입니다." },
square:      { ..., nuance: "이 마찰은 혼자 있을 때도 안에서 계속 돌아갑니다." },
trine:       { ..., nuance: "너무 자연스러워서 본인만 이것이 재능인 줄 모르기 쉽습니다." },
opposition:  { ..., nuance: "이 마찰은 주로 사람이나 상황을 통해 밖에서 옵니다." },
```

(`...`는 기존 headline·body 유지를 뜻한다 — 이 두 필드는 건드리지 않는다.)

파일 끝에 (2단계의 PAIR_READINGS가 이 모드로 본문을 찾는다):

```ts
/**
 * 본문 기준으로는 각도가 세 모드로 접힌다 — 겹침 / 순풍(육분·삼각) /
 * 마찰(사각·대립). 5방의 구분은 nuance 한 줄이 유지한다(스펙 §2).
 */
export type AspectMode = "conjunction" | "flowing" | "friction";

export function modeOf(key: AspectKey): AspectMode {
  if (key === "conjunction") return "conjunction";
  if (key === "sextile" || key === "trine") return "flowing";
  return "friction";
}
```

- [ ] **Step 4: 서브셋 재생성 후 전체 테스트**

```bash
python scripts/subset-maruburi.py
npx vitest run
```
Expected: 전부 PASS (nuance의 새 글자가 서브셋에 들어갔는지 fonts.test가 확인).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(aspects): five nuance tails and the three-mode fold

Stage 2 replaces the aspect body with per-pair paragraphs folded to
three modes; the nuance line is what keeps square distinct from
opposition once they share a body."
```

---

### Task 3: reading.ts — 개인성 가중 순위, 세기 표기, 세대 라벨

**Files:**
- Modify: `byeolsaem-web/src/lib/reading.ts`
- Test: `byeolsaem-web/src/test/atoms.test.ts`

**Interfaces:**
- Consumes: Task 1의 `PlanetTier`·`TIER_RANK`, `Aspect.strength` (chart.ts에 이미 있음)
- Produces: `export function tierWeight(a: PlanetTier, b: PlanetTier): number`, `export function strengthLabel(strength: number): string`, `ReadingAspect.strengthKo: string`, 세대 각도 본문 뒤에 붙는 고정 문장

- [ ] **Step 1: 실패하는 테스트 추가**

```ts
it("세기 구간이 스펙 §4의 경계에서 갈린다", () => {
  expect(strengthLabel(0.95)).toBe("거의 정확");
  expect(strengthLabel(0.8)).toBe("거의 정확");
  expect(strengthLabel(0.79)).toBe("뚜렷");
  expect(strengthLabel(0.55)).toBe("뚜렷");
  expect(strengthLabel(0.54)).toBe("넓게 걸침");
});

it("tierWeight는 순서에 대칭이고 스펙 §3의 값을 낸다", () => {
  expect(tierWeight("personal", "personal")).toBe(1.0);
  expect(tierWeight("personal", "social")).toBe(0.85);
  expect(tierWeight("social", "personal")).toBe(0.85);
  expect(tierWeight("personal", "generational")).toBe(0.7);
  expect(tierWeight("social", "social")).toBe(0.5);
  expect(tierWeight("generational", "social")).toBe(0.35);
  expect(tierWeight("generational", "generational")).toBe(0.15);
});

it("개인이 낀 각도가 세대끼리의 각도보다 앞에 선다", () => {
  // 1995-07-14 09:30 서울 — 세대 각도(토성 육분 해왕성, 오브 0.3)가
  // 오브로는 1등이지만 가중치가 끌어내려야 한다.
  const chart = computeChart({
    date: "1995-07-14", time: "09:30",
    latitude: 37.5, longitude: 127.0, timezoneOffsetHours: 9,
  });
  const reading = assembleReading(chart, null);
  const isPersonalPair = reading.aspects.map(
    (x) => x.a.tier === "personal" || x.b.tier === "personal",
  );
  expect(isPersonalPair[0]).toBe(true);
  const firstNonPersonal = isPersonalPair.indexOf(false);
  if (firstNonPersonal !== -1) {
    expect(isPersonalPair.lastIndexOf(true)).toBeLessThan(firstNonPersonal);
  }
});

it("두 행성 모두 개인이 아니면 세대 라벨이 본문에 붙는다", () => {
  const chart = computeChart({
    date: "1995-07-14", time: "09:30",
    latitude: 37.5, longitude: 127.0, timezoneOffsetHours: 9,
  });
  const reading = assembleReading(chart, null, 10);
  const label = "비슷한 시기에 태어난 사람들이 함께 가지는 각도입니다.";
  for (const item of reading.aspects) {
    const bothNonPersonal = item.a.tier !== "personal" && item.b.tier !== "personal";
    expect(item.body.endsWith(label), `${item.a.ko}-${item.b.ko}`).toBe(bothNonPersonal);
  }
});
```

import에 `strengthLabel, tierWeight` 추가 (`@/lib/reading`에서).

- [ ] **Step 2: 실패 확인**

Run: `npx vitest run src/test/atoms.test.ts`
Expected: FAIL — `strengthLabel`·`tierWeight` 미정의.

- [ ] **Step 3: 구현**

`reading.ts`의 planets import를 넓힌다:

```ts
import { PLANET_BY_KEY, TIER_RANK, type Planet, type PlanetTier } from "./planets";
```

파일에 추가:

```ts
/**
 * 개인성 가중치 (스펙 §3). 오브가 아무리 정확해도 세대끼리의 각도는 이 사람
 * 고유의 이야기가 아니다 — 순위는 세기 × 이 가중치로 정한다. chart.ts는 기하만
 * 알므로 여기(해석)에서 곱한다.
 */
const TIER_WEIGHTS: Record<string, number> = {
  "personal-personal": 1.0,
  "personal-social": 0.85,
  "personal-generational": 0.7,
  "social-social": 0.5,
  "social-generational": 0.35,
  "generational-generational": 0.15,
};

export function tierWeight(a: PlanetTier, b: PlanetTier): number {
  const [x, y] = TIER_RANK[a] <= TIER_RANK[b] ? [a, b] : [b, a];
  return TIER_WEIGHTS[`${x}-${y}`];
}

/** 오브 세기를 말로 (스펙 §4). 화면 메타 줄이 쓴다. */
export function strengthLabel(strength: number): string {
  if (strength >= 0.8) return "거의 정확";
  if (strength >= 0.55) return "뚜렷";
  return "넓게 걸침";
}

/** 세대 각도임을 밝히는 고정 문장 (스펙 §3). 지어내지 않고 사실을 말한다. */
const GENERATIONAL_NOTE = "비슷한 시기에 태어난 사람들이 함께 가지는 각도입니다.";
```

`ReadingAspect` 인터페이스에 추가:

```ts
/** "거의 정확" — 오브 세기를 말로. */
strengthKo: string;
```

`toReadingAspect` 반환부를 교체:

```ts
// 기존
return {
  aspect,
  a: PLANET_BY_KEY[aspect.a],
  b: PLANET_BY_KEY[aspect.b],
  theme,
  headline: meaning.headline,
  body: meaning.body,
};

// 신규
const a = PLANET_BY_KEY[aspect.a];
const b = PLANET_BY_KEY[aspect.b];
const bothNonPersonal = a.tier !== "personal" && b.tier !== "personal";
return {
  aspect,
  a,
  b,
  theme,
  headline: meaning.headline,
  body: bothNonPersonal ? `${meaning.body} ${GENERATIONAL_NOTE}` : meaning.body,
  strengthKo: strengthLabel(aspect.strength),
};
```

`assembleReading`의 aspects 조립을 교체:

```ts
// 기존
const aspects = chart.aspects
  .map(toReadingAspect)
  .filter((a): a is ReadingAspect => a !== null)
  .slice(0, aspectLimit);

// 신규 — chart.ts의 순수 세기 순서 위에 개인성 가중치를 곱해 다시 세운다
const aspects = chart.aspects
  .map(toReadingAspect)
  .filter((a): a is ReadingAspect => a !== null)
  .sort(
    (x, y) =>
      y.aspect.strength * tierWeight(y.a.tier, y.b.tier) -
      x.aspect.strength * tierWeight(x.a.tier, x.b.tier),
  )
  .slice(0, aspectLimit);
```

- [ ] **Step 4: 서브셋 재생성 후 전체 테스트**

```bash
python scripts/subset-maruburi.py
npx vitest run
```
Expected: 전부 PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(reading): a cohort aspect no longer outranks a natal one

Ranking was orb alone, so Saturn sextile Neptune - shared by everyone
born within a year - sat first. Strength times a personalness weight
reorders the list, the computed strength finally reaches the screen
as words, and pairs with no personal planet say so."
```

---

### Task 4: NatalReading.tsx — 메타 줄에 세기 표기

**Files:**
- Modify: `byeolsaem-web/src/components/chart/NatalReading.tsx` (218행 부근 메타 span)

**Interfaces:**
- Consumes: Task 3의 `ReadingAspect.strengthKo`
- Produces: 없음 (말단 화면)

- [ ] **Step 1: 메타 줄 수정**

```tsx
// 기존
<span className="text-meta text-starlight-dim">
  {item.aspect.type.ko} · <Term name="오브" /> {item.aspect.orb.toFixed(1)}도
</span>

// 신규 — 세기는 각도의 속성이라 오브 옆이 제자리다 (스펙 §4)
<span className="text-meta text-starlight-dim">
  {item.aspect.type.ko} · <Term name="오브" /> {item.aspect.orb.toFixed(1)}도 · {item.strengthKo}
</span>
```

ToneBadge는 건드리지 않는다 — 순풍/마찰 판정만 말하게 둔다 (스펙 §4).

- [ ] **Step 2: 전체 테스트 + 타입 검사 + 빌드**

```bash
npx vitest run && npx tsc --noEmit && npm run build
```
Expected: 전부 통과, 빌드 성공.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(natal): the meta line says how tight the aspect is

Orb 0.4 and orb 3.5 spoke in the same register. The strength the
chart already computes now reads as one of three words next to the
orb, where the number it interprets lives."
```

---

### Task 5: 배포와 실물 확인

**Files:** 없음 (검증·배포만)

- [ ] **Step 1: 저장소 루트에서 배포**

```bash
cd .. && npx wrangler deploy
```
Expected: `Deployed byeolsaem triggers` + Version ID 출력.

- [ ] **Step 2: 실물 확인**

배포된 `/natal`을 열어 (저장된 출생 정보 또는 1995-07-14 09:30 서울로) 확인:

- "별과 별 사이" 첫 항목이 개인 행성이 낀 각도인가 (세대 각도가 1등이면 실패)
- 메타 줄이 `대립 · 오브 1.1도 · 거의 정확` 형식인가
- 세대끼리 각도 본문 끝에 "비슷한 시기에 태어난 사람들이 함께 가지는 각도입니다."가 붙는가
- 행성 목록에서 목성·토성이 개인 다섯 별 뒤, 천왕성 앞에 서는가

Expected: 네 가지 모두 확인.
