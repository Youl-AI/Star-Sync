# 인생의 시간표(/chapters) — 연간 프로펙션 + 조디악 릴리징 설계

2026-08-26. DC 피드백(조디악 릴리징 요청)에서 출발. 디자인 프리뷰
(artifact 289b9c39, "인생의 시간표") 승인됨 — UI 구성은 그 프리뷰가 기준이다.

## 0. 결정 요약 (사용자 승인)

- **한 페이지** `/chapters`, 메뉴 문구 **"인생의 시간표"** — "나의 별" 그룹에 추가.
- 위: **연간 프로펙션**(올해 카드 + 12년 스트립), 아래: **조디악 릴리징**
  (L1 타임라인 + 현재 장의 L2 스트립 + 각 배지 + 매듭 풀림).
- 릴리징 출발점: **정신의 점(기본) / 행운의 점 — 토글**.
- 깊이: **L1 + L2 + 각(角) + 매듭 풀림(루싱 오브 본드)**. L3는 하지 않는다.
- **출생 시각 필수.** 시각 없는 프로필이면 두 계산 모두 그리지 않고 정직하게
  안내한다(솔라리턴의 시각-미상 처리와 같은 원칙). 지어내는 값은 없다.
- 백엔드 수정 없음 — 전부 클라이언트 계산(`src/lib/chart.ts` 재사용).

## 1. 계산 라이브러리 — `src/lib/time-lords.ts` (신규)

의존: `computeChart`·`BirthMoment`·`Chart`(src/lib/chart.ts), `ZODIAC_SIGNS`·
`signAtLongitude`(src/lib/zodiac.ts). 스위스 천문력 정밀도 불필요 — 전부
순수 산술이라 vitest로 완전 검증 가능.

### 1.1 공통

- 자리 인덱스: 황경 0~360을 30도씩 — `Math.floor(longitude / 30)` (0=양자리).
- 모든 함수는 시각 미상(`chart.ascendant === null`)이면 `null`을 돌려준다.
  임의 시각 대입 금지.

### 1.2 연간 프로펙션

```ts
export interface ProfectionYear {
  /** 만 나이. 생일 당일부터 다음 생일 전날까지 같은 값. */
  age: number;
  /** 이 해가 열리는 생일. "2026-04-19" */
  from: string;
  /** 다음 생일. "2027-04-19" */
  to: string;
  /** 올해의 자리 */
  sign: ZodiacSign;
  /** 상승 자리를 1로 세는 방 번호 (1~12) */
  house: number;
  /** 올해의 주인 — 그 자리의 지배 행성 (전통 지배성) */
  lordKo: string;
}
export function profectionYears(natal: BirthMoment, chart: Chart, around: Date): ProfectionYear[] | null;
export function currentProfection(natal: BirthMoment, chart: Chart, now: Date): ProfectionYear | null;
```

- 연 경계는 **생일 날짜**(달력 날짜 비교, KST 기준). 솔라리턴 순간이 아니다 —
  프로펙션은 상징적 시간법이므로 달력 생일이 관례다.
- `house = (age % 12) + 1`. 자리 = 상승 자리에서 `age % 12`칸 전진(whole sign).
- 지배성은 **전통 지배성**: 양=화성, 황소=금성, 쌍둥이=수성, 게=달, 사자=태양,
  처녀=수성, 천칭=금성, 전갈=화성, 사수=목성, 염소=토성, 물병=토성, 물고기=목성.
  **ZODIAC_SIGNS의 `ruler`는 현대 지배성이다(확인됨: 전갈=명왕성, 물병=천왕성,
  물고기=해왕성) — 그대로 쓰면 안 된다.** time-lords.ts 안에 위 표를
  `TRADITIONAL_RULER: Record<signIndex, string>` 상수로 신설한다. 프로펙션·
  릴리징은 고전 기법이라 전통 지배성이 맞다.
- `profectionYears`는 현재 나이 앞뒤로 총 12칸(프리뷰: 현재−2 ~ 현재+9)을 준다.

### 1.3 점(Lot) 계산

```ts
export type LotKey = "fortune" | "spirit";
export function lotLongitude(chart: Chart, lot: LotKey): number | null;
```

- 주야 판정(sect): `norm360(sun.longitude − ascendant)`가 **180 미만이면 태양이
  지평선 아래 = 야간 출생**, 180 이상이면 주간. (하우스 1~6 구간이 지평선 아래 —
  whole sign이 아니라 도 단위 축 기준.)
- 행운의 점: 주간 `Asc + 달 − 태양`, 야간 `Asc + 태양 − 달` (norm360).
- 정신의 점: 행운과 공식 반대(주간 `Asc + 태양 − 달`, 야간 `Asc + 달 − 태양`).
- 점의 **자리**(whole sign)가 릴리징의 출발 자리다.

### 1.4 조디악 릴리징

```ts
export interface ZrPeriod {
  sign: ZodiacSign;
  /** 이 장이 열리는 만 나이(년, 소수). L1은 정수 연수 경계. */
  fromAge: number;
  toAge: number;
  /** 달력 날짜로도. "2027-04-19" 형식 — 생일 기준 환산. */
  from: string;
  to: string;
  /** 행운의 점 자리 기준 몇 번째 자리인가 (1~12). 각 판정용. */
  houseFromFortune: number;
  /** 1·4·7·10이면 true — 각(角)의 장. */
  angular: boolean;
  /** 10번째면 true — 절정의 장. UI가 각과 구분해 배지를 단다. */
  peak: boolean;
  /** 매듭 풀림으로 건너뛰어 시작된 장인가 (L2 전용). */
  loosedBond: boolean;
}
export interface ZodiacalReleasing {
  lot: LotKey;
  lotSign: ZodiacSign;
  l1: ZrPeriod[];               // 0세부터 100세 넘길 때까지
  currentL1: ZrPeriod | null;   // now 기준
  l2OfCurrent: ZrPeriod[];      // 현재 L1 장의 L2 전체
  currentL2: ZrPeriod | null;
}
export function zodiacalReleasing(natal: BirthMoment, chart: Chart, lot: LotKey, now: Date): ZodiacalReleasing | null;
```

- **자리별 연수표** (행성 소년기 연수): 양 15 · 황소 8 · 쌍둥이 20 · 게 25 ·
  사자 19 · 처녀 20 · 천칭 8 · 전갈 15 · 사수 12 · 염소 27 · 물병 27 · 물고기 12.
- **L1**: 점의 자리에서 시작, 황도 순서로 연수표만큼. 누적 나이가 100을 넘는
  장까지 만들고 멈춘다.
- **L2**: L1 장의 자리에서 시작, 같은 순서로 **자리별 연수를 "월"로** 배정
  (양 15개월, 게 25개월…). L1 장 길이를 다 채우면 잘라낸다(마지막 칸은 부분).
- **매듭 풀림(루싱 오브 본드)**: L2 열이 한 바퀴를 돌아 **자기 L1 장의 자리로
  되돌아오는 차례**가 되면, 그 자리를 반복하는 대신 **맞은편 자리로 건너뛰어**
  이어간다. 건너뛴 첫 장에 `loosedBond: true`. (한 바퀴 = 211개월이므로 17년
  7개월보다 긴 L1 — 쌍둥이·게·사자·처녀·염소·물병 — 에서만 생긴다.)
- **각 판정은 릴리징을 어느 점에서 돌리든 항상 행운의 점 자리 기준이다** —
  정신의 점 릴리징에서도 `houseFromFortune`은 행운의 점에서 센다. 이것이 고전
  관례(발렌스)이고, 10번째 자리 장이 절정기다. UI 배지: 10번째 = "절정의 장",
  1·4·7번째 = "각(角)의 장".
- 나이↔날짜 환산: 프로펙션과 같은 달력 생일 기준. 소수 나이는 개월 수를 생일에
  더해 날짜로 바꾼다(일 단위 오차 ±1일 허용 — 상징적 시간법이라 충분).

## 2. 페이지 — `src/app/(night-static)/chapters/page.tsx` (신규)

- (night-static) 그룹, SSG. 메타: title "인생의 시간표 — 프로펙션과 조디악
  릴리징", description(확정): "연간 프로펙션으로 올해의 별자리와 주인 행성을,
  조디악 릴리징으로 인생의 장을 계산합니다. 태어난 순간에 감긴 시계를 읽는
  고전 점성술의 시간법 — 무료, 로그인 없음." FAQ JSON-LD 2문항: "연간 프로펙션이 뭔가요",
  "조디악 릴리징이 뭔가요" — 본문에 실제로 보이는 문답만 스키마로 낸다.
- 정적 셸: 제목·소개·두 기법 설명(예시 데이터 없이 개념 설명만). 계산 영역은
  클라이언트 컴포넌트가 마운트 후 채운다 — TodayCard 계약(빌드값 없음, 저장
  프로필로 계산)과 같은 흐름.

## 3. 클라이언트 컴포넌트 — `src/components/chapters/` (신규)

### 3.1 `ChaptersScope.tsx` (프로필 게이트)

SolarScope와 같은 골격 재사용:
- 저장 프로필 없음 → 입력 유도(기존 BirthMenu/입력 플로우로 안내).
- 도시 좌표 해석 실패 → UnknownPlace와 같은 분기.
- **시각 미상 → 계산 영역 전체를 안내문으로 대체**: "프로펙션과 릴리징은 둘 다
  상승궁에서 출발합니다. 태어난 시각이 있어야 계산할 수 있습니다." + 시각 찾는
  법 칼럼(/blog/태어난-시간-모를-때) 링크. 부분 표시 없음 — 반쪽 계산은 없다.

### 3.2 `ProfectionSection.tsx`

프리뷰 구성 그대로:
- 올해 카드: "AGE n · YYYY.M – YYYY.M" / "○○자리의 해" / "n번째 방 · 올해의
  주인 ★" / 한 단락 풀이.
- 12년 스트립: 현재−2 ~ +9, 현재 칸 금색 강조. 칸 = 나이·자리·방.
- 풀이 문구: 기존 원자 재사용 — 자리 한 줄(ZODIAC_SIGNS tagline 또는 signs
  콘텐츠), 방 의미 한 줄(houses 원자), 주인 행성 한 줄. 신규 문장은 프레임
  1벌("~번째 방에 불이 들어온 해입니다…")만.

### 3.3 `ReleasingSection.tsx`

- 토글: [정신의 점 — 커리어와 행동] / [행운의 점 — 몸과 환경]. 기본 정신.
  토글은 컴포넌트 상태만(URL·저장 없음).
- L1 타임라인: 가로 flex, 장 폭 ∝ 연수(프리뷰의 flex 비율 방식). 현재 장 금색
  발광, 배지: "지금 · n년째" / "절정의 장"(10번째) / "각(角)의 장"(1·4·7) /
  "제1장 · 점의 자리". 모바일: flex-wrap(프리뷰 그대로).
- L2 스트립: 현재 L1 장의 L2 전체. 현재 칸 강조, 매듭 풀림 칸은 구분 표시
  (배지 "매듭 풀림")와 함께.
- 범례: 각의 장 / 절정의 장 / 매듭 풀림 세 항목 — 프리뷰 문구를 기본으로 정리.
- 풀이 문구: 장 유형 프레임 3벌(일반/각·절정/매듭 풀림) × 자리 이름 조합.
  자리별 새 문장을 12벌 쓰지 않는다 — 자리 성격은 기존 원자 한 줄 인용.

## 4. 마감 (기존 관례 그대로)

- `nav-map.ts`: "나의 별" 그룹에 { href: "/chapters", label: "인생의 시간표",
  desc } 추가 + NAV_NEW에 "/chapters".
- sitemap: /chapters 0.6.
- OG 카드: build-og PAGE_CARDS에 chapters.png 1장 (eyebrow "TIME LORDS",
  title "인생의 시간표", motif "rings").
- prefetch-chunks 대상에 chapters.html (스크립트가 자동 수집하면 확인만).
- 폰트 서브셋 재실행(신규 한국어 문자열).
- 404 페이지·상호링크는 손대지 않는다(범위 밖).
- 칼럼 연계: 기존 글 수정은 범위 밖. 차기 칼럼 주제 풀에 "프로펙션"·"조디악
  릴리징" 2편을 추가할 수 있다는 메모만(집필은 이 스펙 범위 아님).

## 5. 테스트 (vitest, `src/lib/__tests__/time-lords.test.ts`)

1. 프로펙션 나이 경계: 생일 전날 나이 n−1·생일 당일 n, house = (age%12)+1.
2. 프로펙션 자리 전진: 상승 전갈 + 나이 29 → 여섯째 방 = 양자리.
3. 전통 지배성: 전갈→화성, 물병→토성, 물고기→목성 (현대 지배성 미사용 확인).
4. sect: 태양-상승 각도 180 경계 양쪽에서 주/야 반전, 행운·정신 공식 교차 검증
   (주간 행운 = 야간 정신).
5. L1 연수표: 출발 자리별 누적 나이가 표와 일치(예: 물고기 출발 → 12/27/35/55/80/99).
6. L2 총합: L1 장 길이(월)와 L2 칸 합이 일치, 마지막 칸 부분 절단.
7. 매듭 풀림: 염소(27년) L1에서 211개월 뒤 염소 차례에 게로 건너뜀 +
   `loosedBond` 플래그, 8년짜리 L1에서는 발생하지 않음.
8. 각 판정: 행운 물고기일 때 사수 장 = 10번째(절정), 정신의 점 릴리징에서도
   행운 기준 유지.
9. 시각 null: currentProfection·lotLongitude·zodiacalReleasing 전부 null.
10. renderToStaticMarkup 게이트: 시각 미상 프로필에서 계산 숫자가 마크업에
    없음(솔라리턴 테스트 패턴 재사용).

## 6. 하지 않는 것

- L3 이하 세분, 프로펙션 월/일 단위, 로트 추가(에로스·네세시티 등), 릴리징
  결과 공유 카드, URL 파라미터로 상태 공유, 백엔드 계산. 전부 수요 확인 전.
