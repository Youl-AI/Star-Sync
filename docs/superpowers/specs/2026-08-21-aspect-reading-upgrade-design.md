# 어스펙트 해석 업그레이드 스펙

> 확정일 2026-08-21 · 커뮤니티 피드백("해석이 애매모호하다")에서 출발한 브레인스토밍 최종본
> 대상: `/natal`의 "별과 별 사이" 섹션과 그 재료(`content/atoms/aspects.ts`, `lib/reading.ts`, `lib/chart.ts`)
> 구현 중 이 문서와 충돌하면 이 문서가 이긴다.

---

## 0. 문제

커뮤니티 게시 반응: "마주보는 자리입니다", "밀어내는 자리입니다" 같은 표현이 해석으로
느껴지지 않는다. 실제 차트 두 개(1995-07-14 09:30 서울, 1988-02-02 22:10 서울)를
돌려 원인을 셋으로 좁혔다.

**① 본문이 각도만 설명한다.** 현재 구조는 각도 5종이 본문을 독점하고, 행성 쌍은
동사 없는 명사구("자기 자신과 무너뜨렸다 다시 세우는 힘") 하나로만 등장한다. 그
결과 `태양 사각 명왕성`과 `달 사각 명왕성`이 **바이트 단위로 같은 문단**을 받는다.
6개 항목에 실제 문단이 3종뿐인 화면이 나온다.

**② 세대 각도가 상위를 차지한다.** 정렬 기준이 오브 하나뿐이라(`chart.ts:229`)
`토성 육분 해왕성`(1995년생 전원이 공유)이 1등에 선다. 여섯 자리 중 두 자리를
"이 사람 이야기가 아닌 것"이 먹는다.

**③ 계산해 둔 `strength`를 안 쓴다.** 오브 0.4도와 3.5도가 같은 톤으로 말한다.

대조군: 같은 저장소의 `planet-in-sign.ts`(달·처녀 — "불안을 감정으로 겪지 않고
할 일 목록으로 바꿔 처리하려 합니다")는 이미 알아볼 수 있는 문장이다. 어스펙트
층만 조합으로 때워져 있다. 작문의 문제가 아니라 구조의 문제다.

## 1. 목표 / 비목표

**목표**
- 어스펙트 본문의 주인을 각도에서 행성 쌍으로 옮긴다 (45쌍 × 3모드 = 135문단).
- 개인 행성이 낀 각도가 세대 각도보다 위에 서게 한다.
- 오브 세기를 말로 표기한다.
- 평생과제 줄이 라벨 되읽기를 멈추고 실제 문장을 쓴다.

**비목표**
- 궁합(`synastry.ts`)은 자기 표(SYNASTRY_ASPECTS)를 쓰므로 이번 범위 밖.
  같은 병을 앓지만 별도 라운드로 다룬다.
- `/today`·`/yearly`의 트랜싯 문장도 범위 밖 — 단 호환은 깨지 않는다(§6).
- 마이너 어스펙트(150도 등) 추가 안 함. AI 런타임 호출 안 함 — 결정론 유지.

## 2. 자료 구조

### 2.1 ASPECT_MEANINGS — 유지 + nuance 추가

```ts
export const ASPECT_MEANINGS: Record<AspectKey, {
  headline: string;  // 유지 — /today·/yearly의 basis 줄이 쓴다
  body: string;      // 유지 — /yearly의 트랜싯 본문이 쓴다 (yearly-reading.ts:206)
  nuance: string;    // 신설 — 출생 차트에서 3모드가 뭉갠 5방 구분을 되살리는 꼬리 한 줄
}> = { ... };
```

nuance 다섯 줄 (확정 문안, 구현 시 이대로):

| 각도 | nuance |
| --- | --- |
| conjunction | 두 힘이 한 몸처럼 붙어 있어, 본인은 이것이 두 가지라는 것을 잘 알아차리지 못합니다. |
| sextile | 저절로 작동하지는 않습니다. 의식해서 쓸 때만 열리는 통로입니다. |
| square | 이 마찰은 혼자 있을 때도 안에서 계속 돌아갑니다. |
| trine | 너무 자연스러워서 본인만 이것이 재능인 줄 모르기 쉽습니다. |
| opposition | 이 마찰은 주로 사람이나 상황을 통해 밖에서 옵니다. |

### 2.2 PAIR_READINGS — 신설, 본문이 사는 곳

```ts
export type AspectMode = "conjunction" | "flowing" | "friction";

/** 각도 → 모드. sextile·trine은 flowing, square·opposition은 friction. */
export function modeOf(key: AspectKey): AspectMode;

/** 45쌍 × 3모드 = 135문단. 외행성쌍 포함 전부 채운다 — 빈칸 분기를 만들지 않는다. */
export const PAIR_READINGS: Record<string, Record<AspectMode, string>>;
// 키는 기존 pairKey()가 만드는 "sun-moon" 형식 그대로.
```

테마 명사구는 기존 `PLANET_PAIR_THEMES`를 그대로 쓴다. 복제하지 않는다 —
`/today`·`/yearly`가 같은 표를 읽고 있고, 한 곳을 고치면 세 페이지가 함께 맞는다.

### 2.3 조립 (lib/reading.ts)

```
본문 = PAIR_READINGS[pairKey(a,b)][modeOf(type.key)] + " " + ASPECT_MEANINGS[type.key].nuance
```

`ReadingAspect.body`가 이 값을 담는다. 화면(`NatalReading.tsx`)은 구조 변경 없음 —
`item.body` 한 덩어리를 그대로 렌더한다.

## 3. 순위 — 세기 × 개인성

`chart.ts`의 `findAspects`는 기하만 안다 — 손대지 않는다. 개인성은 해석의 관심사이므로
`reading.ts`의 `assembleReading`이 자를 때(slice 전에) 가중치를 곱해 재정렬한다.

```ts
/** 행성의 층: 개인(태양~화성) / 사회(목성·토성) / 세대(천왕성~명왕성) */
const TIER_WEIGHTS: Record<string, number> = {
  "personal-personal": 1.0,
  "personal-social": 0.85,
  "personal-generational": 0.7,
  "social-social": 0.5,
  "social-generational": 0.35,
  "generational-generational": 0.15,
};
정렬키 = aspect.strength × TIER_WEIGHTS[tierPair(a, b)]
```

`Planet`에 `tier: "personal" | "social" | "generational"` 필드를 추가한다.
기존 `personal: boolean`은 이미 이 정보의 절반을 갖고 있다 — boolean을 tier로
대체하고 기존 사용처(`reading.ts`의 ordered 정렬)를 `tier === "personal"`로 바꾼다.
같은 사실을 두 필드로 들고 있으면 언젠가 어긋난다.

검증된 효과 (1995-07-14 차트): 세대 각도 둘이 1·3등 → 최하위로 내려간다.

**세대 각도 라벨:** 두 행성 모두 tier가 personal이 아니면 본문 뒤에 한 줄 붙인다 —
"비슷한 시기에 태어난 사람들이 함께 가지는 각도입니다." 지어내지 않고 사실을
밝히는 것이 이 서비스의 결이다(시각 미상 때 하우스를 비우는 것과 같은 원칙).

## 4. 오브 세기를 말로

이미 있는 `aspect.strength`(= 1 − orb/allowed)를 구간으로 자른다:

| strength | 표기 |
| --- | --- |
| ≥ 0.8 | 거의 정확 |
| ≥ 0.55 | 뚜렷 |
| 그 외 | 넓게 걸침 |

`NatalReading.tsx`의 메타 줄에 붙인다: `대립 · 오브 1.1도 · 거의 정확`.
ToneBadge의 `span` prop은 쓰지 않는다 — 세기는 각도의 속성이라 오브 옆이 제자리고,
ToneBadge는 순풍/마찰 판정만 말하게 둔다. 구간 함수는 `lib/reading.ts`에 두고
테스트한다.

## 5. 평생과제 재작성

현재: 테마 라벨 되읽기("밀어붙이는 힘과 그것을 붙잡는 제동이 계속 부딪힙니다").
변경: 가장 정확한 마찰 각도의 **friction 문단 첫 문장**을 쓰고, 기존 꼬리를 잇는다.

```
text  = PAIR_READINGS[pair].friction의 첫 문장
        + " 편한 배치는 아니지만, 당신을 실제로 움직여 온 것도 이 마찰입니다."
basis = 변경 없음 ("화성 대립 토성 · 태어난 순간부터 평생 가는 각도")
```

첫 문장 추출은 마침표 기준 split — 그래서 §7의 작문 규칙에 "첫 문장이 홀로 서야
한다"가 들어간다.

## 6. 호환 — 깨지 말아야 할 것

| 소비자 | 쓰는 것 | 영향 |
| --- | --- | --- |
| `today-reading.ts:165` | `meaning.headline` | 없음 (headline 유지) |
| `yearly-reading.ts:203-206` | `headline` + `body` | 없음 (둘 다 유지) |
| `synastry-reading.ts` | 자기 표(SYNASTRY_ASPECTS) | 없음 |
| `atoms.test.ts:65-90` | ASPECT_MEANINGS·PLANET_PAIR_THEMES 전수 | nuance 검사 추가만 |

`ASPECT_MEANINGS.body`는 출생 차트에서만 은퇴하고 표에는 남는다. 트랜싯은 "지나가는
행성 대 내 행성"이라 일반 각도 설명이 상대적으로 덜 아프고, 그쪽 업그레이드는
비목표(§1)다.

## 7. 작문 기준 — 135문단 전부

1. **2~3문장. 첫 문장은 동사로 끝나는 완결 서술** — 평생과제(§5)가 홀로 떼어 쓴다.
   둘째 문장부터 알아볼 수 있는 장면을 넣는다.
2. **기하 어휘 금지**: "마주 보", "밀어내", "밀어냅", "반대편", "각도", "어스펙트",
   "배치", "자리입니다". 기하는 headline과 심볼이 이미 말한다.
3. **friction 모드는 훈계·경고로 끝내지 않는다.** 이 마찰이 실제로 무엇을 시키는지로
   끝낸다.
4. **운명 단정 금지** ("~하게 됩니다"식 예언 아님), 경어 `~합니다` 체.
5. 외행성쌍 7개(사회×사회 포함)는 세대의 문장으로 쓴다 — `planet-in-sign.ts`가
   천왕성·해왕성·명왕성에서 이미 하는 방식과 같다.

기준 예시 (sun-pluto, friction — 이 톤이 합격선):

> 무언가를 세게 밀고 나가다가 스스로 무너뜨리고 다시 짓는 일을 반복합니다.
> 적당히 하는 법이 없어서 주변이 먼저 지치기도 합니다. 이 강도는 버리는 것이
> 아니라 쏟을 곳을 고르는 것이 과제입니다.

## 8. 작문 파이프라인

1. LLM이 135문단 초안을 뽑는다 (빌드 전, 저장소 밖 작업).
2. `korean-skills:humanizer`로 AI 문체 흔적을 걷어낸다.
3. **사용자가 읽고 고친 최종본만** `.ts`로 커밋한다.
4. 커밋 전 `python scripts/subset-maruburi.py` 재실행 — 새 글자가 서브셋에 없으면
   `fonts.test.ts`가 막는다(의도된 게이트).

런타임에는 AI가 전혀 없으므로 "같은 배치면 같은 문장" 약속(RENEWAL_PLAN §2.3)은
그대로다.

## 9. 단계

**1단계 — 구조 (초안 없이 배포 가능):** §3 순위, §4 세기 표기, §2.1 nuance,
세대 라벨, 테스트 골격. PAIR_READINGS가 아직 없는 동안 조립기는 기존
`ASPECT_MEANINGS.body`로 폴백한다. 폴백 코드는 2단계에서 제거한다.

**2단계 — 내용:** 135문단 검수 완료분을 채우고 폴백을 지운다. 부분 채움 상태로
배포하지 않는다 — 같은 화면에 두 세대의 문장이 섞이면 티가 난다.

## 10. 테스트

`atoms.test.ts` 확장 + 필요시 분리:

- PAIR_READINGS 45키 × 3모드 = 135칸 전수, 각 문단 50자 이상.
- 금지 어휘(§7-2) 검사 — PAIR_READINGS 본문 한정. headline·nuance는 제외.
- 첫 문장이 "다."로 끝나는지 (§5의 split이 기대는 규칙).
- `modeOf` 매핑 5종.
- 세기 구간 함수 경계값 (0.8, 0.55).
- 재정렬: 고정 차트에서 개인×개인 각도가 세대×세대보다 앞에 오는지.
- 세대 라벨: 두 행성 모두 비개인일 때만 붙는지.
- 기존 검사(빈칸 전수, pairKey 대칭) 유지.
