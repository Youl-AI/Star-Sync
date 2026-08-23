# 별샘 관계축 심화 + 천문력 — 궁합 초대 링크 · 컴포짓 차트 · 천문력 표 설계

> 2026-08-24. 최종 기능 점검에서 사용자가 고른 3종. 프리뷰 없이 텍스트 설계로
> 승인됨(셋 다 기존 화면 문법의 연장이라 시각 쟁점이 없었다).

## 배경과 목표

기능 점검(2026-08-24)의 결론: 기능 트리는 사실상 완성이고 남은 의미 있는 것은
관계축 심화 둘과 천문력뿐. 나머지(프로그레션·일렉셔널·호라리·사주/타로 도구화)는
정체성 밖 또는 수요 없음으로 의도적 제외.

- **궁합 초대 링크**: 궁합의 실사용 마찰(상대 생일을 모름/입력을 못 시킴)을 침.
  링크 자체가 전파 수단이라 바이럴 성격.
- **컴포짓 차트**: 궁합(둘 사이의 각도) 다음 단계 — "관계 자체"를 제3의 차트로.
- **천문력 표**: 학습자·연구자용 원자료. "2026년 9월 천문력" 검색 선점.

## 전역 제약 (모든 태스크에 암묵 적용)

- 정적 export 유지. 서버·DB·외부 API 추가 금지.
- 출생 정보 저장은 localStorage `byeolsaem.birth.v1`만. **상대(그쪽) 정보는 어떤
  경로로도 저장하지 않는다** — 초대 링크로 온 데이터도 컴포넌트 상태까지만.
- 시각을 모르면 지어내지 않는다(컴포짓 상승궁 포함).
- 계산은 기존 자체 엔진(`ephemeris.ts` 계열)과 기존 crossing/각도 유틸 재사용.
- 애니메이션 도구 정책(CLAUDE.md) 준수. 새 모션은 CSS transition + `motion-reduce:`.
- 한국어 신규 문자열(주석·테스트 포함) 커밋 전 `python scripts/subset-maruburi.py`.
- 서브에이전트 `git add -A` 금지, here-string(@'…'@) 금지.
- 새 페이지는 `ogImage()`+`alternatesFor()`, sitemap, `prefetch-chunks.mjs`
  `NAV_TARGETS`, OG 카드까지 한 세트.
- 이징·지속시간 사이트 공용값(cubic-bezier(0.16,1,0.3,1), 진입 500ms 이하).

## 1. 궁합 초대 링크

### 데이터 형식

- `src/lib/invite.ts` (신규):

```ts
/** 초대에 담기는 것 — RitualData와 같은 모양의 부분집합. concern은 담지 않는다
    (관심사는 받는 쪽이 자기 화면에서 고른다 — SynastryReading의 기존 원칙). */
export interface InvitePayload {
  date: string;          // "1995-07-14"
  time: string | null;
  city: string;
}
export function encodeInvite(p: InvitePayload): string;   // base64url(JSON), 패딩 제거
export function decodeInvite(raw: string): InvitePayload | null;  // 실패·검증 불통과면 null
```

- 검증은 `birth-profile.ts`의 `DATE_PATTERN`/`TIME_PATTERN` 수준과 동일하게 —
  변조된 링크가 계산기까지 내려가면 안 된다. city는 비어 있지 않은 문자열이면
  통과(좌표 실패는 기존 UnknownPlace 경로가 받는다).
- URL 형식: `https://byeolsaem.com/synastry#i=<encoded>`. **fragment(#)인 이유**:
  # 뒤는 브라우저 밖으로 나가지 않는다 — 서버 로그·Web Analytics·리퍼러 어디에도
  출생 정보가 남지 않는다. 이 이유를 invite.ts 머리 주석에 명시한다.

### 만들기 (보내는 쪽)

- `src/components/synastry/InviteButton.tsx` (신규, 클라이언트): 내 profile로
  `encodeInvite` → 버튼 하나 **"초대 링크 보내기"**.
  - `navigator.share`가 있으면(모바일 전반) **OS 공유 시트**를 연다 —
    `share({ title: "별샘 궁합 초대", text: "두 하늘이 만나는 자리를 봐요", url })`.
    받는 앱(카톡·인스타·문자·무엇이든)은 사용자가 고른다. URL이 문자열로
    전달되므로 fragment(#i=)가 그대로 산다.
  - 없으면(데스크톱 등) `navigator.clipboard.writeText` + "복사됐습니다" 2초
    (IcsRow 복사 버튼 패턴)로 폴백.
  - 사용자 취소(AbortError)는 조용히 무시한다.
  - 카카오 SDK는 쓰지 않는다 — 사이트의 공유 관례를 여기서 확정한다:
    **이미지 카드 공유 = 카카오(기존 KakaoShareButton), 링크 공유 = OS 공유
    시트.** (설계 변천: URL 복사만 → 카카오 주 버튼 → 본 방식. 2026-08-24
    사용자 결정 — 요즘 링크는 인스타 등 채널이 다양해 특정 앱을 주 버튼으로
    박을 이유가 없다.)
- 버튼 **위에** 고정 동의 문구(항상 노출, 접지 않음) — 누르기 전에 읽힌다:
  "링크에는 내 생년월일시와 출생지가 담깁니다. 궁합을 보고 싶은 사람에게만 보내세요."
- 배치: SynastryReading의 결과 화면 하단(공유 버튼 무리 곁) + 상대 입력 전
  화면("그쪽의 하늘을 기다립니다" 자리)에도 하나 — 상대를 앉혀 놓고 입력시키는
  대신 링크로 보내는 것이 이 기능의 존재 이유다.
- profile 없으면 버튼 대신 "내 정보를 먼저 넣으면 초대 링크를 만들 수 있습니다"
  한 줄(requestRitual 링크).

### 받기 (받는 쪽)

- SynastryReading 마운트 시 `location.hash`에서 `#i=`를 읽어 `decodeInvite` →
  성공하면 `setPartner(payload)` + 초대 배너 상태 on. 실패(변조·깨짐)면 조용히
  무시하고 평소 화면(에러 화면을 만들지 않는다 — 링크가 깨졌다는 것 외에 할 말이
  없다).
- 초대 배너: 결과/입력 화면 상단에 한 줄 —
  "누군가 궁합을 청했습니다 · {formatBirthDate(date)}의 하늘이 도착해 있어요."
  상세(시각·출생지)는 표시하지 않는다(계산에만 쓴다). 기존 사이드바의 "그쪽"
  생년월일 표시는 그대로.
- 받는 쪽에 내 profile이 없으면: 기존 흐름 그대로 "내 밤하늘 열기" 유도 —
  입력하면 자기 localStorage에 정상 저장되고(신규 방문자 온보딩 겸함) 결과가 뜬다.
  이때 예시(ExampleMeeting)가 아니라 초대 배너 + 유도가 우선한다.
- "다른 사람으로"를 누르면 초대 데이터는 버려진다(setPartner가 덮어씀). fragment는
  history.replaceState로 지우지 **않는다** — 새로고침해도 초대가 유지되는 쪽이
  받는 사람에게 편하고, 지워도 이미 주소창·카톡에 남아 있어 보안 이득이 없다.

## 2. 컴포짓 차트

### 계산 — `src/lib/composite.ts` (신규)

```ts
/** 두 차트의 행성별 원호 중간점 차트. 관계 자체를 제3의 인격처럼 읽는 관례. */
export interface CompositeChart {
  placements: Placement[];        // house는 전부 null
  aspects: Aspect[];              // findAspects 재사용
  /** 둘 다 시각을 알 때만 — 두 상승궁의 중간점. 아니면 null(지어내지 않는다). */
  ascendant: number | null;
}
export function compositeChart(mine: Chart, theirs: Chart): CompositeChart;
```

- 중간점은 **짧은 호의 중간**: `mid = a + norm180(b - a) / 2` 후 0~360 정규화.
  정확히 180° 대립이면 관례상 어느 쪽이든 유효하나 **작은 황경 쪽 + 90°**로
  고정한다(결정론 — 테스트가 지킨다).
- retrograde 플래그는 컴포짓에서 의미가 없으므로 전부 false. house는 null
  (컴포짓 하우스는 장소 문제가 학파마다 갈려 다루지 않는다 — 스펙 결정).
- sign/degree는 중간점 황경에서 `signAtLongitude`로 재계산.

### 읽기 — `src/components/synastry/CompositeSection.tsx` (신규)

- 궁합 결과 맨 아래(공유 버튼 무리 위) 새 섹션 **"우리 사이에 생긴 세 번째 하늘"**.
  도입 2문장: 궁합이 둘 사이의 각도라면, 컴포짓은 두 하늘의 한가운데에 생기는
  제3의 차트라는 것 + 관계 자체의 성격으로 읽는다는 것.
- 세 축(솔라 리턴의 AxisSection 문법 그대로 — 프레임 + 원자 본문):
  1. **관계의 태양** — 프레임 "이 관계가 무엇을 향해 가는가입니다." +
     `PLANET_IN_SIGN.sun[sign.key]`
  2. **관계의 달** — 프레임 "둘이 함께 있을 때 흐르는 기류입니다." +
     `PLANET_IN_SIGN.moon[sign.key]`
  3. **관계의 금성** — 프레임 "이 관계가 애정을 표현하는 방식입니다." +
     `PLANET_IN_SIGN.venus[sign.key]`
  새 해석 원자를 만들지 않는다. 프레임 문장만 신규(축당 1문장, "다." 종결).
- 원자 문장이 개인용 서술("~자기를 증명합니다")이라 관계 주어와 어긋나는 축이
  있으면 프레임이 그 간극을 잇는다 — 원자 문장을 고치지 않는다(natal과 공유
  중이므로).
- ExampleMeeting에도 같은 섹션(예시 두 사람의 컴포짓) — 빈 화면 없음 원칙.
- 컴포짓 상승궁은 null이면 섹션에서 통째로 생략(안내문도 없음 — 세 축이 본체다).

## 3. 천문력 표 — /ephemeris

### 데이터 — `src/lib/ephemeris-table.ts` (신규)

```ts
export interface EphemerisRow {
  /** KST 자정 기준 날짜 "2026-09-01" */
  date: string;
  cells: {
    planet: PlanetKey;
    signKo: string;
    symbol: string;       // 행성 기호 (PLANETS에서)
    degree: number;       // 자리 안 도수 0~29
    minute: number;       // 분 0~59
    retrograde: boolean;
  }[];
}
export function monthTable(year: number, month: number): EphemerisRow[];
```

- 각 날의 KST 00:00(= 전날 15:00 UTC)에서 10행성 황경 → sign·도·분·역행 여부.
  역행 판정은 `longitudeRate`(retrograde.ts) < 0. 달·태양은 항상 false.
- 계산량: 31일 × 10행성 × 12개월 — 빌드 시간 허용 범위(달력과 같은 급).

### 라우트

- 달력과 같은 뼈대: `/ephemeris` 허브(당월) + `/ephemeris/[year]/[month]` 12장,
  창은 **`BUILD_MONTHS` 공유**(단일 빌드 시계 — calendar-events.ts의 것을 그대로
  import). CalMonthNav 재사용(라벨만 "2026년 9월 천문력"), 허브 canonical은
  /ephemeris 자신, 월별은 자기 canonical. 허브에는 빌드-달 어긋남 안내를 붙인다 —
  기존 CurrentMonthNotice에 `hrefBase?: string` prop(기본 "/calendar")을 추가해
  재사용하고, 달력 허브는 무변경으로 지나가게 한다.
- 표 렌더 `src/components/ephemeris/EphemerisTable.tsx` (서버):
  행=날짜, 열=10행성(기호 헤더 + 툴팁 대신 위쪽 범례), 칸="♑ 12°34′" + 역행이면
  ℞ 표시(금색). `overflow-x-auto` 컨테이너 필수(모바일 가로 스크롤),
  `font-variant-numeric: tabular-nums`. 인그레스·삭망이 있는 날은 행 아래
  작은 줄로 표기(monthEvents 재사용).
- 허브 소개문: 천문력이 무엇인지 3문장 + "표 읽는 법"(기호 범례, ℞ 뜻, KST 자정
  기준임) + 천궁도·달력으로 가는 NextSteps. 학습자 대상이라 설명 한 단계
  친절하게, 어투는 사이트 그대로.
- FAQ JSON-LD 2개(월별): "이 표는 언제 기준인가요?"(KST 자정), "℞는 무엇인가요?".

## 내비·SEO 마감

- nav-map.ts 읽을거리 그룹에 `{ href: "/ephemeris", label: "천문력", desc: "날짜별 행성 위치의 원자료" }`.
  NAV_NEW에 /ephemeris 추가(기존 3개는 제거 시점 지나면 함께 정리).
- sitemap: /ephemeris + 월별 12장(BUILD_MONTHS).
- OG 카드 1장: `{ file: "ephemeris.png", eyebrow: "EPHEMERIS", title: "천문력", sub: "날짜별 행성 위치, 원자료 그대로", motif: "horizon" }`.
- prefetch NAV_TARGETS += ephemeris.html.
- 궁합 페이지 메타 description에 초대 링크 언급 한 구절 추가(검색 스니펫 개선).

## 구현 순서

1. **컴포짓**: composite.ts(테스트 먼저 — 중간점 수학, 180° 케이스, 상승궁 null 규칙)
   → CompositeSection → SynastryReading·ExampleMeeting 배선.
2. **초대 링크**: invite.ts(왕복·변조 테스트) → InviteButton → SynastryReading
   수신 배선(배너·우선순위).
3. **천문력**: ephemeris-table.ts(실측 대조 테스트) → EphemerisTable → 라우트 13장
   → 내비·SEO 마감.
4. **마감**: 폰트 서브셋·빌드·배포·dev-browser 실측(초대 링크 왕복 실연 포함).

## 테스트 전략

- 컴포짓: 알려진 쌍 실측(EXAMPLE_BIRTH × EXAMPLE_PARTNER_BIRTH의 컴포짓 태양
  자리를 수계산으로 고정), 중간점이 항상 두 황경의 짧은 호 안에 있음(속성 테스트
  — 임의 쌍 수십 개), 정확히 180°에서 결정론.
- 초대: encode→decode 왕복 동일성, 깨진 base64·필드 누락·형식 위반 → null,
  URL-안전 문자만 포함.
- 천문력: 특정일 실측(2026-10-24 수성 ℞ 시작 무렵 수성 retrograde=true,
  2026-09-23 태양이 천칭 0~1도), 행 수 = 그 달 일수.
- 텍스트 계약: 프레임 문장 "다." 종결, 동의 문구 존재(InviteButton 렌더 테스트는
  두지 않는다 — 문자열 상수를 lib에 두고 상수 테스트로 대신한다).
- 실측: 초대 링크를 dev-browser에서 실제로 생성 → 새 컨텍스트(localStorage 없는
  상태)에서 열어 배너·유도·결과까지 왕복.
- **인앱 브라우저 fragment 보존 실측**(배포 후, 사용자 휴대폰): OS 공유 시트로
  카톡에 보낸 링크를 카톡 인앱 브라우저로 열었을 때 `#i=`가 살아 있는지.
  떨어뜨리는 채널이 확인되면 쿼리(`?i=`) 방식으로 전환한다(쿼리는 Web
  Analytics에 남을 수 있으나 우리 서버 로그는 없고, 메시지 전송 자체가 이미
  같은 정보를 담는다 — 수용 가능한 절충으로 기록).

## 하지 않는 것

- 상대 정보 저장, 초대 만료·횟수 제한(서버 없이는 불가능하고, 필요도 없다).
- 컴포짓 차트 휠·하우스·행성 전체 나열(세 축이 본체 — YAGNI).
- 데이비슨 차트, 프로그레션, 일렉셔널, 호라리, 보이드 문(점검에서 제외 확정).
- 천문력 CSV/다운로드.
