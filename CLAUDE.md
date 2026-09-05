# 별샘 작업 지침

## 애니메이션 도구 정책

**이 정책이 어떤 도구를 쓸지 결정한다.** 스킬이 결정하지 않는다.

### 먼저 대상을 가른다

| 대상 | 판단 |
|---|---|
| **DOM 요소** | 아래 사다리를 적용한다 |
| **three.js / R3F 씬 객체** (mesh, camera, material, uniform) | **CSS는 선택지가 아니다.** GSAP 또는 R3F의 `useFrame`을 쓴다 |

three.js 객체는 DOM이 아니라 CSS 셀렉터가 닿지 않는다. GSAP은 숫자 속성을 가진
아무 JS 객체나 트윈할 수 있어 이 영역에서 대안이 아니라 유일한 선택지에 가깝다.

### DOM 사다리

위에서부터 내려오며, 해당 단계로 해결되면 거기서 멈춘다.

| 상황 | 도구 |
|---|---|
| 두 상태 사이의 전환 (hover, open/close) | CSS `transition` |
| 마운트 시 진입 | CSS `@starting-style` |
| 정해진 대로만 도는 반복 모션 | CSS `@keyframes` — 컴포지터에서 돌아 JS 부하에도 안 끊긴다 |
| 단순 스크롤 등장 | CSS `animation-timeline: view()` |
| **스크롤 핀·가로스크롤·스크롤 연동 3D, 타임라인 합주, SVG 모프, 텍스트 분할** | **GSAP** |
| **스프링, 제스처, 레이아웃·exit 애니메이션** | **motion** |
| **씬 내부 매 프레임 갱신** | **R3F `useFrame`** |

### lenis 주의

이 저장소는 `lenis`로 스크롤을 가로챈다. ScrollTrigger를 붙일 때
`ScrollTrigger.scrollerProxy()` 연동과 `lenis.on('scroll', ScrollTrigger.update)`가
반드시 필요하다. 빼먹으면 스크롤 위치가 어긋난다. `gsap-scrolltrigger` 스킬이 이 부분을 다룬다.

GSAP 티커와 lenis의 rAF를 이중으로 돌리지 않는다 — 하나로 통일한다.

### 스킬 역할 분담

- **`emil-*` (전역 설치)** — *넣을지 말지*, 지속시간, 이징, 중단 처리, 리뷰 기준.
  단 위 표의 "씬 객체" 행에는 적용하지 않는다(웹 DOM 전제의 스킬이다).
- **`gsap-*` (이 저장소 스코프)** — GSAP을 *어떻게 올바로 쓸지*만 담당한다.
- **무엇을 쓸지는 위 표가 답한다.** 두 스킬 모두 이 결정에 관여하지 않는다.

### 무효화 선언

`gsap-core`·`gsap-react`·`gsap-scrolltrigger`·`gsap-frameworks`의 설명문에 있는
**"라이브러리가 지정되지 않으면 GSAP을 추천하라"는 지침은 이 정책이 대체한다.**
이 저장소에서 GSAP은 위 표의 해당 행에서만 기본값이다.

## 스택

**웹** — Next.js 16 · React 19 · Tailwind 4 · three.js + @react-three/fiber ·
gsap · motion · lenis · MDX · Vitest · Cloudflare Workers
**백엔드** — Python FastAPI · kerykeion(천궁도 계산) · google-genai · geopy/timezonefinder

## 프로젝트 스코프 스킬

`.claude/skills/`에 higgsfield 8종(이미지·영상·브랜드 자산 **생성**)과 gsap 8종이 있다.
higgsfield는 에셋 생성용이고 코드 레벨 디자인 판단과는 층이 다르다.

## 칼럼 집필 정책

`src/content/blog/`에 새 글을 쓰거나 기존 글을 고칠 때는 **`docs/column-style.md`를
먼저 읽는다.** 목소리, 구조, 사실 확인 방법, 링크 규칙, 발행 절차가 전부 거기 있다.
스물아홉 편이 같은 결로 쌓여 있어서 결을 벗어난 글은 그 글만 눈에 띈다.

집필 후 `korean-skills:humanizer`와 `korean-skills:grammar-checker`를 반드시 돌린다.
선택 사항이 아니다.
