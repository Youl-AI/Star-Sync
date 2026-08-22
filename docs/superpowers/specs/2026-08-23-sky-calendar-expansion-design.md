# 별샘 확장 — 하늘의 달력 · 위클리 · 솔라 리턴 · PWA · 내비 개편 설계

> 2026-08-23. 브레인스토밍에서 승인된 설계. 프리뷰 아티팩트 2건(달력·위클리 / 새 내비)으로
> 시각 방향까지 확정됨. 구현 계획은 writing-plans로 별도 작성.

## 배경과 목표

기존 콘텐츠 재활용이 아니라, 다른 점성술 서비스(CHANI·Co-Star·포스텔러)에는 있지만
별샘에 없는 기능을 채운다. 동시에 페이지가 9개 → 12개로 늘므로 내비게이션을
확장 가능한 구조로 재편한다.

- **하늘의 달력**: 신월·보름·역행·태양 인그레스를 월간 그리드로. 검색 유입("2026년 10월 신월")과 재방문 목적.
- **달력 내보내기(.ics)**: 캘린더 구독으로 푸시 알림 인프라 없이 알림 효과. 부가 기능 — 페이지 가치의 본체 아님(사용자 확인됨).
- **위클리**: /today(하루)와 /yearly(일 년) 사이의 빈 시간 축.
- **솔라 리턴**: 생일마다 새로 그려지는 한 해 차트. 한국 무료 웹에 거의 없어 색인 선점 가치.
- **PWA**: manifest만으로 홈 화면 설치. 서비스 워커 없음.
- **내비 개편**: 헤더 직통 3개 + 전체화면 오버레이 메뉴(전 해상도 통일).

## 전역 제약 (모든 태스크에 암묵 적용)

- 정적 export 유지. 서버·DB·외부 API 추가 금지. 모든 계산은 기존 자체 천문 엔진(`src/lib/ephemeris.ts` 계열)으로.
- 출생 정보는 localStorage `byeolsaem.birth.v1`만. 새 저장 채널 금지. 서버 HTML은 항상 "정보 없음" 상태로 그린다(`WithoutBirthProfile` 원칙).
- "지금" 값이 필요한 화면은 빌드 시점 값을 props로 받고 마운트 후 실측으로 교체한다(`TodayCard`의 `initialSky`/`builtAt` 계약과 동일). 크롤러가 빈 화면을 보면 안 된다.
- 애니메이션 도구 정책(CLAUDE.md): 월 전환·오버레이는 CSS(View Transitions / transition)로. GSAP·motion 신규 도입 없음. 모든 새 모션은 `motion-reduce:` 처리.
- 한국어 신규 문자열(주석·테스트 포함)이 생기면 커밋 전 `python scripts/subset-maruburi.py` 실행 — `fonts.test.ts`가 실패로 잡는다.
- 서브에이전트 `git add -A` 금지. 디스패치마다 명시 스테이징 목록.
- 새 페이지는 `scripts/prefetch-chunks.mjs`의 `NAV_TARGETS`에 추가(내비로 갈 수 있는 페이지의 청크가 프리페치 대상).
- 새 페이지 전부: `ogImage()` 헬퍼(`src/lib/metadata.ts`)로 openGraph 완성, sitemap 등록, `scripts/build-og.mjs` `PAGE_CARDS`에 카드 추가.
- 이징·지속시간은 사이트 공용 값: `cubic-bezier(0.16,1,0.3,1)`, 진입 500ms 이하, 스태거 60ms.

## 1. 계산 라이브러리 (신규 2 + 재사용)

### `src/lib/ingress.ts` (신규)

태양이 별자리 경계(황경 30° 배수)를 넘는 순간.

```ts
export interface Ingress {
  /** 넘어간 뒤의 별자리 */ signKo: string;
  /** 정확한 순간 (ISO) */ date: string;
}
export function sunIngresses(from: Date, to: Date): Ingress[];
```

- 방법: 하루 간격으로 `Math.floor(sunPosition(jd).longitude / 30)` 변화를 훑고
  이분법으로 좁힌다. 정지 조건 0.0002일 — `lunation.ts`의 `PRECISION_DAYS`와 동일.
- 태양만. 수·금·화 인그레스는 넣지 않는다(달력이 소음이 됨 — YAGNI).
- 검증: 2026년 춘분(3/20)·하지(6/21)·추분(9/23)·동지(12/22) 실측 대조.

### `src/lib/calendar-events.ts` (신규)

달력·위클리·ics가 공유하는 이벤트 조립기. 모든 날짜 경계는 KST.

```ts
export type CalendarEvent =
  | { kind: "new-moon" | "full-moon"; date: string; signKo: string }
  | { kind: "retro-start" | "retro-end"; date: string; planet: RetroPlanet; planetKo: string }
  | { kind: "ingress"; date: string; signKo: string };

/** month는 1~12. 그 달(KST) 안에 정확한 순간이 있는 이벤트만. */
export function monthEvents(year: number, month: number): CalendarEvent[];
/** 그 달에 걸쳐 있는 역행 기간(밴드 렌더용). 부분 겹침 포함. */
export function retroSpans(year: number, month: number): { planet: RetroPlanet; start: string; end: string }[];
/** from(포함)부터 to(제외)까지 — ics·위클리용 범용 조회. */
export function eventsBetween(from: Date, to: Date): CalendarEvent[];
```

- 소스: `nextLunations`를 반복 호출하지 말고 `lunation.ts`의 crossing 탐색을
  기간 스캔 형태로 일반화(내부 함수 `lunationsBetween` 추가 export)한다.
  역행은 `retrogradesOf(planet, from, to)` 그대로. 인그레스는 위 `sunIngresses`.
- 각 이벤트에 붙는 한 줄 설명문은 여기가 아니라 화면 쪽 상수로 둔다
  (`kind`별 고정 문구 + 자리 이름 삽입). 신규 문장은 사이트 어투(경어체, 단정)로.
- 검증(실측 고정값): 2026년 10월 = 금성 역행 시작 10/3 · 천칭 신월 10/11(KST — UTC로는 10/10 밤) ·
  태양 전갈 진입 10/23 · 수성 역행 시작 10/24 · 황소 보름 10/26.

### `src/lib/solar-return.ts` (신규)

```ts
/** natal 태양 황경으로 태양이 돌아오는 순간. targetYear 생일 근방 ±5일에서 탐색. */
export function solarReturnInstant(natal: BirthMoment, targetYear: number): Date;
/** 지금 나이해(직전 리턴 ~ 다음 리턴)의 리턴 차트. 장소는 출생 도시 그대로. */
export function solarReturnChart(natal: BirthMoment, now: Date): { instant: Date; chart: Chart };
```

- 방법: 출생 차트의 태양 황경(`computeChart` 결과에서)을 목표로,
  targetYear 생일 ±5일 창에서 `norm180(sunApparentLongitude(jd) - target)`의
  부호 반전을 이분법으로. `lunation.ts`의 `nextCrossing`과 같은 뼈대.
- "올해"의 정의: `now` 기준 직전 리턴. 생일이 아직 안 왔으면 작년 리턴 차트가 현재 유효.
  페이지에는 유효 기간("2026년 7월 14일 ~ 2027년 7월 14일")을 명시한다.
- 장소는 출생 도시 고정(현재 위치 방식도 있으나 우리는 위치를 수집하지 않음 —
  페이지에 관례 차이를 한 줄로 밝힌다).
- 검증: 리턴 순간의 태양 황경 = 출생 태양 황경 ± 0.01°. 리턴 시각은 해마다
  생일에서 ±1일 이내.

## 2. 하늘의 달력

### 라우트

- `app/(night-static)/calendar/page.tsx` — 이번 달. /today처럼 내용이 달마다 회전하는
  허브. canonical은 /calendar 자신.
- `app/(night-static)/calendar/[year]/[month]/page.tsx` — `generateStaticParams`로
  이전 1개월 + 당월 + 이후 10개월 = 12장. month는 2자리("09"). 각 장이 자기 canonical.
- 빌드마다 창이 한 달씩 미끄러진다 — 과거로 밀린 URL은 자연 소멸(404).
  sitemap에는 현재 창의 12개만 싣는다.

### 화면 (프리뷰 아티팩트 확정안)

- 월 헤더: "2026년 10월" + 이전/다음 달 링크.
- 7열 그리드: 신월(채운 금점)·보름(빈 금점)은 날짜 칸 우상단 점 + 짧은 라벨,
  역행 기간은 칸 하단의 가는 색 밴드(금성·수성·화성 각각 다른 색), 인그레스는 라벨.
  모바일(<560px)은 칸 안 라벨을 숨기고 점·밴드만 — 상세는 아래 목록이 담당.
- 그리드 아래 "이 달의 하늘" 날짜순 목록: 이벤트마다 굵은 제목 + 정확한 KST 시각 +
  한 줄 해설 + 관련 페이지 링크(역행 → 해당 역행 페이지).
- 맨 아래 .ics 구독 행(§3) — 구석의 선택 기능 톤.
- 데이터는 전부 빌드 시점 계산(이벤트 시각은 불변이므로 마운트 교체 불필요).
  단 /calendar 허브의 "오늘" 표시(오늘 날짜 칸 강조)만 마운트 후 클라이언트에서 얹는다.

### 월 전환 모션

- Link 내비게이션(정적 12장) + View Transitions. 그리드 컨테이너에
  `view-transition-name: calendar-grid`를 주고, 이동 방향(이전/다음)을 클릭 시
  `<html data-cal-dir="prev|next">`로 심어 CSS에서 좌/우 슬라이드를 분기한다.
- 루트 크로스페이드(globals.css의 180ms)는 그대로 — 이름을 분리했으므로 충돌 없음.
- `prefers-reduced-motion`: 슬라이드 대신 기본 크로스페이드.

### SEO

- 제목 패턴: "2026년 10월 하늘의 달력 — 신월·보름·역행". 월별 FAQ(신월 언제/보름 언제)
  JSON-LD는 허브 제외 월별 페이지에만.
- OG 카드: 바퀴(wheel) 모티프 1장을 12장이 공유.

## 3. 달력 내보내기 (.ics)

- `scripts/build-ics.mjs` (postbuild 체인에 추가: prefetch-chunks 다음).
  `eventsBetween(now, now+12개월)`을 `out/sky.ics`로.
- VCALENDAR: `X-WR-CALNAME:별샘 — 하늘의 달력`, `REFRESH-INTERVAL;VALUE=DURATION:P1D`.
  이벤트는 종일(`DTSTART;VALUE=DATE`, KST 날짜), `SUMMARY`는 목록 제목과 동일 문구,
  `DESCRIPTION`에 한 줄 해설 + 페이지 URL.
- **UID는 이벤트 내용 기반으로 안정적으로**: `new-moon-20261010@byeolsaem.com` 형식.
  재배포 때 바뀌면 구독자 캘린더에 중복이 쌓인다.
- `public/_headers`에 `/sky.ics → Cache-Control: public, max-age=86400` 추가.
- 페이지 쪽 버튼: URL 복사(`navigator.clipboard`) + 구글/애플 안내 한 줄.
  webcal:// 링크도 함께(애플 계열 즉시 구독).
- 검증: 생성 파일의 BEGIN/END 짝, UID 유일성, 이벤트 수 = eventsBetween 결과 수.

## 4. 위클리 (/weekly)

- `app/(night-static)/weekly/page.tsx`. 주 = 월요일 00:00 ~ 일요일 24:00 KST.
- `src/lib/weekly-reading.ts` (신규):

```ts
export interface WeeklyData {
  /** 주 시작(월요일) ISO */ weekStart: string;
  events: CalendarEvent[];                    // eventsBetween(주 범위)
  /** 가장 큰 사건에서 규칙 기반 생성. 사건 없으면 조용한 주 문구. */
  headline: string;
  summary: string;                            // 헤드라인 아래 1~2문장
}
export function weeklyData(now: Date): WeeklyData;

export interface WeeklyPersonal {
  /** 요일별로 내 차트에 1° 이내로 닿는 트랜싯. 쌍별 최소 orb 날 하나만. */
  touches: { date: string; text: string }[];
}
export function weeklyPersonal(now: Date, natal: Chart): WeeklyPersonal;
```

- 헤드라인 규칙: 우선순위 역행 시작 > 역행 끝 > 신월/보름 > 인그레스 > 없음.
  각 kind별 템플릿 문장(총 6개 내외, 완결 문장 "…다."로 끝남 — 텍스트 계약 테스트).
  겹치면 상위 1개 + summary에서 나머지 언급. 사건 없는 주: "이번 주 하늘은
  조용합니다" 계열 고정 문구 — 조용함을 정직하게 말하는 것이 사이트 어투.
- 요일 목록: 사건 있는 날만 행으로, 사건 없는 연속 구간은 "월–목 · 큰 이동 없음"
  한 행으로 접는다(프리뷰 확정안).
- 개인 섹션: `weeklyPersonal` — 주 7일 각 정오 KST의 행성 위치로 natal 대비
  각도를 스캔, orb 1° 이내만, 같은 (트랜싯 행성, natal 행성, 각) 쌍은 orb 최소인
  날 하나로 dedupe. 문장은 기존 트랜싯 어휘(`today-reading.ts`의 표현)를 재사용.
  출생 정보 없으면 이 섹션 자체가 접히고 입력 유도 한 줄(빈 화면 금지 원칙 —
  전역 사건 목록은 항상 보인다).
- 빌드 시점 주간 데이터 → props, 마운트 후 실측 교체(주 경계가 지나면 클라이언트가
  새 주를 계산).
- OG 카드: 지평선(horizon) 모티프.

## 5. 솔라 리턴 (/solar-return)

- `app/(night-static)/solar-return/page.tsx`. 서버 HTML은 소개 + 예시 상태.
- 컴포넌트 `src/components/solar/SolarReturnReading.tsx`:
  - 출생 정보 있으면: `solarReturnChart` → 유효 기간 명시 → `ChartWheel` 재사용으로
    리턴 차트 렌더 → 해석 세 축:
    1. **리턴 상승궁** — 기존 `content/atoms/ascendant.ts` 원자 재사용 + "올해의 첫인상" 프레임 문장
    2. **리턴 태양의 하우스** — 기존 `content/atoms/planet-in-house.ts` 재사용 + "올해 빛이 모이는 방" 프레임
    3. **리턴 달의 자리** — 기존 자리 어휘 재사용 + "올해 마음이 머무는 곳" 프레임
    프레임 문장만 신규(축당 1~2문장). 새 해석 원자 세트를 만들지 않는다.
  - 없으면: `ExampleSky` 패턴 그대로 — `EXAMPLE_BIRTH`(1995-07-14)의 2026년 리턴을
    예시로 렌더, 예시임을 명시.
- 페이지 본문에 개념 설명(솔라 리턴이 뭔지, 생일 차트 관례 — 장소는 출생지 기준
  사용을 명시) + FAQ 3개(JSON-LD).
- OG 카드: 고리(rings) 모티프.

## 6. PWA

- `public/manifest.webmanifest`: name "별샘", short_name "별샘",
  start_url "/", display "standalone", background_color·theme_color = 밤 배경색
  (globals.css의 잉크색과 일치), icons 192/512(+ maskable 512).
- 아이콘: `scripts/build-pwa-icons.mjs` — build-og와 같은 satori 파이프라인으로
  기존 금색 별 모티프를 192/512 PNG로. 수작업 에셋 금지(재현 가능해야 함).
- `layout.tsx`에 manifest 링크 + `theme-color` 메타.
- **서비스 워커 없음** — 오프라인은 목표가 아니고 캐시 무효화 부채만 생긴다.
  크롬·삼성인터넷·사파리 모두 manifest만으로 홈 화면 설치가 된다.
- 검증: Lighthouse installability 통과(수동 1회) + manifest JSON 파싱 테스트.

## 7. 내비 개편 (마지막 단계 — 새 페이지가 실재한 뒤)

프리뷰 아티팩트 확정안. `Veil.tsx` 재작성.

- **헤더**: 로고 · 직통 3(오늘 /today · 천궁도 /natal · 궁합 /synastry) · "메뉴" 버튼
  (두 줄 아이콘 + 글자, 열리면 X로 변형) · `BirthMenu` 인장. 직통은 `max-md`에서 숨김.
- **오버레이**: 전 해상도 동일한 전체화면(성운 배경 nebula-bg). 기존 모바일 오버레이를
  대체 — 두 벌이 한 벌이 된다. 3그룹:

```
하늘의 시간: 오늘의 하늘 /today · 이번 주 /weekly · 하늘의 달력 /calendar · 역행 /retrograde
나의 별:    내 천궁도 /natal · 한 해의 하늘 /yearly · 솔라 리턴 /solar-return · 궁합 /synastry
읽을거리:   열두 별자리 /sign · 칼럼 /blog
```

- 각 링크: 큰 제목(font-display) + 한 줄 설명(프리뷰 문구 그대로). 진입 스태거 60ms,
  `cubic-bezier(0.16,1,0.3,1)`, 나갈 때는 같은 길(transition, 키프레임 금지).
  `inert`로 닫힌 상태를 보조기술에서 치운다(BirthMenu와 같은 수법).
- **앰비언트**: 역행 링크 옆 뱃지(역행 중이면 "☿ 역행 중", 아니면 가장 가까운
  시작 D-n) + 오버레이 하단 한 줄(오늘 달의 자리 · 다음 삭망 D-n · 역행 상태).
  열릴 때 클라이언트에서 계산(수 ms) — 빌드 값 불필요, SSR 불일치 없음(오버레이는
  서버 HTML에서 닫혀 있음).
- **새 표시**: `NAV_NEW = ["/weekly", "/calendar", "/solar-return"]` 상수의 금색 점(●).
  제거 시점을 상수 주석에 명시(출시 +4주).
- 그룹 데이터는 `src/components/nav/nav-map.ts`로 분리 — 푸터 사이트맵과 공유해
  두 곳이 어긋나지 않게 한다. `NextSteps`·`ThreeDoors` 등 상호링크에 새 페이지 반영
  (달력 ↔ 역행 ↔ 위클리, 솔라 리턴 ↔ 한 해 ↔ 천궁도).
- 스크롤 잠금·Escape·회전 대응은 기존 Veil 로직 유지.

## 구현 순서 (writing-plans 단계 구분)

1. **계산**: ingress.ts → calendar-events.ts → solar-return.ts (+ lunationsBetween 일반화). 전부 테스트 먼저.
2. **달력**: 월별 페이지 12장 + 허브 + View Transition 슬라이드 + OG/sitemap + build-ics.mjs.
3. **위클리**: weekly-reading.ts + 페이지 + 개인 섹션.
4. **솔라 리턴**: 페이지 + SolarReturnReading + 예시 상태.
5. **마감**: 내비 개편 + PWA + NAV_TARGETS·폰트 서브셋·상호링크 + 최종 리뷰 + 배포 검증.

각 단계 끝에 빌드가 통과하고 배포 가능한 상태여야 한다.

## 테스트 전략

- 수학: 알려진 천문 값 고정 대조(2026 분지점 4, 2026-10 이벤트 5, 솔라 리턴 황경 일치).
- 텍스트 계약: 위클리 헤드라인·프레임 문장이 "다."로 끝나는 완결 문장(기존
  firstSentence 계약과 동일 수법), 금지 기하 어휘 없음(aspects 테스트 재사용).
- ics: 구조 검증(짝, UID 유일성, 수).
- 화면: 배포 후 dev-browser 실측 — 달력 월 전환 슬라이드, 오버레이 여닫기,
  모바일 그리드 축약, 위클리/솔라 리턴 빈 상태(localStorage 클리어 후).

## 하지 않는 것

- 서비스 워커·오프라인·웹 푸시.
- 수·금·화 인그레스, 보이드 오브 코스 문.
- 프로필 여러 개 저장(보류 — 사용자 결정).
- 솔라 리턴 전용 해석 원자 신작(기존 원자 + 프레임 문장으로 충분).
- 월별 페이지 12장 밖의 과거 아카이브.
