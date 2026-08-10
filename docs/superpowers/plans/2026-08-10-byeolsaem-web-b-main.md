# 별샘 리뉴얼 B — 디자인 시스템 + WebGL 하늘 + 메인 페이지 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `byeolsaem-web/`에 Next.js 16.3 정적 사이트를 새로 세우고, 성소(Sanctum) 디자인 시스템과 히어로 3장면 시퀀스를 포함한 메인 페이지 1장을 완성한다 (백엔드 미연결, 결과는 목업).

**Architecture:** Next.js App Router + static export. Server Component 기본, WebGL·모션은 `'use client'` 잎 컴포넌트로 격리. 별하늘은 R3F(WebGL), 달·달무리는 DOM 요소(GSAP으로 장면 전환 이동). 디자인 토큰은 Tailwind v4 `@theme`.

**Tech Stack:** Next.js 16.3 / React 19.2 / Tailwind 4.3 / @react-three/fiber 9.7 + three r184 / GSAP 3.14 / motion / lenis / @phosphor-icons/react / vitest (유틸 테스트)

**디자인 스펙:** `docs/superpowers/specs/2026-08-10-byeolsaem-renewal-design.md` — 모든 색·형태·모션 값의 단일 출처. 이 계획과 충돌하면 스펙이 이긴다.

## Global Constraints

- 저장소 루트는 기존 사이트(운영 중). **`byeolsaem-web/` 밖의 기존 파일 수정 금지** (단 `.assetsignore`에 `byeolsaem-web` 추가는 Task 1에서 허용).
- 밤 팔레트: `--ink #0B0E1A` `--ink-raised #131629` `--starlight #E8E4D8` `--starlight-dim #9A96A8` `--gold #C9A227` `--gold-soft #E3C568`. 보라는 배경 성운 radial(`rgba(109,90,207,.16)` 상한)에만. 새벽 팔레트: `--paper #F5F3EE` `--ink-text #1d1b2e` `--ink-dim #6b6878` `--gold-dark #9c7c1a`.
- 액센트는 금 하나. 버튼·텍스트·테두리에 보라 금지. 텍스트/버튼 글로우 금지. 순검정·순백 금지.
- 서체: 마루부리(제목) + Pretendard Variable(본문), 셀프호스팅(`next/font/local`). Google Fonts `<link>` 금지.
- 이모지 화면 노출 금지(행성 기호 ♂♃☽ 등 유니코드 심볼은 허용). 아이콘은 Phosphor만, strokeWidth 1.5.
- em-dash(—) 화면 노출 금지.
- `h-screen` 금지 → `min-h-[100dvh]`. `window.addEventListener('scroll')` 금지. transform/opacity만 애니메이션.
- 모든 모션 `prefers-reduced-motion` 대응 (Motion `useReducedMotion` / CSS `@media`).
- GSAP과 Motion을 같은 컴포넌트 트리에 혼용 금지.
- 커밋 메시지 말미: `Co-Authored-By: Claude Fable 5 (1M context) <noreply@anthropic.com>`
- Node 24. 모든 명령은 `byeolsaem-web/`에서 실행 (Task 1 제외).

## File Structure (전체 조감)

```
byeolsaem-web/
├─ next.config.ts                  static export 설정
├─ vitest.config.ts
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx               폰트·토큰·전역 셸 (밤 테마)
│  │  ├─ page.tsx                 메인 (Server Component, 섹션 조립)
│  │  └─ globals.css              Tailwind v4 @theme 토큰
│  ├─ fonts/                      woff2 파일
│  ├─ lib/
│  │  ├─ random.ts                mulberry32 시드 PRNG
│  │  ├─ stars.ts                 별 좌표 생성
│  │  ├─ sky-tier.ts              WebGL 폴백 3단계 판정
│  │  └─ birth.ts                 생년월일 검증·도시 목록
│  ├─ components/
│  │  ├─ ui/
│  │  │  ├─ GoldButton.tsx        금 필 CTA (+아웃라인 변형)
│  │  │  ├─ LineDiamond.tsx       선-다이아-선 구분선
│  │  │  ├─ TalismanChip.tsx      부적 칩
│  │  │  └─ ArchCard.tsx          아치의 문 카드
│  │  ├─ brand/Wordmark.tsx       A2 기본 + A3 대형(수면 반영)
│  │  ├─ nav/Veil.tsx             얇은 베일 네비 + 모바일 오버레이
│  │  ├─ sky/
│  │  │  ├─ SkyCanvas.tsx         R3F 스타필드 (dynamic, ssr:false)
│  │  │  ├─ Starfield.tsx         Points 렌더
│  │  │  └─ SkyBackdrop.tsx       CSS 하늘(첫 페인트·폴백) + 캔버스 페이드인
│  │  ├─ hero/
│  │  │  ├─ HeroSequence.tsx      장면 상태 머신 (arrival→altar→ritual→complete)
│  │  │  ├─ Moon.tsx              DOM 달 + 달무리
│  │  │  ├─ RitualForm.tsx        4단계 입력 의식
│  │  │  └─ MockChart.tsx         목업 천궁도 SVG 선 드로잉
│  │  └─ sections/
│  │     ├─ TodayTeaser.tsx       오늘의 하늘 티저 (목업 데이터)
│  │     ├─ ThreeDoors.tsx        비대칭 벤토 3셀
│  │     ├─ ResultPreview.tsx     결과 미리보기 (ArchCard 재사용)
│  │     └─ Footer.tsx
│  └─ test/                       vitest 유닛 테스트
```

---

### Task 1: 프로젝트 스캐폴드 + 정적 빌드 검증

**Files:**
- Create: `byeolsaem-web/` (create-next-app), `byeolsaem-web/next.config.ts`
- Modify: `.assetsignore` (저장소 루트 — `byeolsaem-web` 한 줄 추가)

**Interfaces:**
- Produces: `npm run build`가 `byeolsaem-web/out/`에 정적 산출물 생성. 이후 모든 태스크의 검증 기반.

- [ ] **Step 1: 스캐폴드** (저장소 루트에서)

```bash
npx create-next-app@latest byeolsaem-web --typescript --tailwind --app --src-dir --no-eslint --use-npm --skip-install
cd byeolsaem-web && npm install
```

프롬프트가 나오면: import alias 기본값(`@/*`) 수락, Turbopack 질문은 기본값.

- [ ] **Step 2: next.config.ts를 아래로 교체**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

export default nextConfig;
```

- [ ] **Step 3: Cloudflare 자산 제외** — 저장소 루트 `.assetsignore` 끝에 `byeolsaem-web` 한 줄 추가 (개발 중 소스가 byeolsaem.com에 노출되는 것 방지).

- [ ] **Step 4: 빌드 검증**

Run: `npm run build`
Expected: 성공, `out/index.html` 존재 (`ls out/index.html`).

- [ ] **Step 5: Commit**

```bash
git add byeolsaem-web .assetsignore
git commit -m "feat(web): scaffold Next.js 16 static-export app for renewal"
```

---

### Task 2: 폰트 셀프호스팅 + 디자인 토큰 + 전역 셸

**Files:**
- Create: `byeolsaem-web/src/fonts/` (woff2 3개), Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Delete: `src/app/page.tsx` 기본 내용 → 임시 확인용으로 교체

**Interfaces:**
- Produces: Tailwind 유틸 `bg-ink text-starlight text-gold bg-paper …`, CSS 변수 `--font-maruburi` `--font-pretendard`, `<body>`가 밤 테마 기본.

- [ ] **Step 1: 폰트 파일 확보**

```bash
npm i pretendard
mkdir -p src/fonts
cp node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 src/fonts/
curl -fL -o src/fonts/MaruBuri-Regular.woff2 https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Regular.woff2
curl -fL -o src/fonts/MaruBuri-Bold.woff2 https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/MaruBuri-Bold.woff2
```

curl 404면: https://hangeul.naver.com 마루부리 페이지에서 woff2 수동 다운로드 후 같은 경로에 배치 (라이선스: 네이버 무료 배포, 셀프호스팅 허용).

- [ ] **Step 2: globals.css 교체**

```css
@import "tailwindcss";

@theme {
  /* 밤 */
  --color-ink: #0b0e1a;
  --color-ink-raised: #131629;
  --color-nebula: #1a1f3d;
  --color-starlight: #e8e4d8;
  --color-starlight-dim: #9a96a8;
  --color-gold: #c9a227;
  --color-gold-soft: #e3c568;
  /* 새벽 */
  --color-paper: #f5f3ee;
  --color-ink-text: #1d1b2e;
  --color-ink-dim: #6b6878;
  --color-gold-dark: #9c7c1a;

  --font-display: var(--font-maruburi), serif;
  --font-body: var(--font-pretendard), sans-serif;
}

html {
  background: var(--color-ink);
}

body {
  font-family: var(--font-body);
  color: var(--color-starlight);
  font-variant-numeric: tabular-nums;
}

.font-display {
  font-family: var(--font-display);
}

/* 성운: 보라는 여기에만 (스펙 §1.1) */
.nebula-bg {
  background:
    radial-gradient(ellipse 60% 50% at 62% 38%, rgba(109, 90, 207, 0.16), transparent 70%),
    linear-gradient(115deg, #0b0d1c 0%, #0e1024 45%, #221d4a 100%);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: layout.tsx 교체**

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
});

const maruburi = localFont({
  src: [
    { path: "../fonts/MaruBuri-Regular.woff2", weight: "400" },
    { path: "../fonts/MaruBuri-Bold.woff2", weight: "700" },
  ],
  variable: "--font-maruburi",
  display: "swap",
});

export const metadata: Metadata = {
  title: "별샘 | 당신이 태어난 밤, 하늘은 기억하고 있어요",
  description:
    "태어난 순간의 실제 하늘로 읽는 나의 이야기. 천궁도, 오늘의 하늘, 별자리 궁합.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${maruburi.variable}`}>
      <body className="min-h-[100dvh] bg-ink text-starlight antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: page.tsx를 임시 토큰 확인 화면으로 교체**

```tsx
export default function Home() {
  return (
    <main className="nebula-bg min-h-[100dvh] p-10">
      <h1 className="font-display text-4xl text-starlight">별샘</h1>
      <p className="mt-2 text-starlight-dim">밤의 의식, 낮의 기록</p>
      <span className="mt-4 inline-block rounded-full border border-gold/50 px-4 py-2 text-sm text-gold-soft">
        ♂ 화성 ☌ 태양 · 2.1°
      </span>
    </main>
  );
}
```

- [ ] **Step 5: 검증** — `npm run build` 성공 후 `npm run dev`로 열어 마루부리 제목·금 칩·성운 배경 육안 확인 (dev-browser 스크린샷).

- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(web): self-hosted fonts, sanctum design tokens, global shell"`

---

### Task 3: vitest + 코어 유틸 (PRNG · 별 생성 · 폴백 판정 · 생일 검증) TDD

**Files:**
- Create: `byeolsaem-web/vitest.config.ts`, `src/lib/random.ts`, `src/lib/stars.ts`, `src/lib/sky-tier.ts`, `src/lib/birth.ts`, `src/test/lib.test.ts`

**Interfaces:**
- Produces:
  - `mulberry32(seed: number): () => number` (0~1)
  - `generateStars(count: number, seed: number): Star[]` — `Star = { x: number; y: number; z: number; size: number; phase: number }` (x,y,z ∈ [-1,1] 정규화, size ∈ [0.5,2], phase ∈ [0,2π))
  - `detectSkyTier(o: { reducedMotion: boolean; isMobile: boolean; webgl: boolean }): "full" | "lite" | "static"`
  - `validateBirthDate(y: number, m: number, d: number): boolean` / `KO_CITIES: { ko: string; en: string }[]` (20개)

- [ ] **Step 1: vitest 설치·설정**

```bash
npm i -D vitest
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["src/test/**/*.test.ts"] } });
```

`package.json` scripts에 `"test": "vitest run"` 추가.

- [ ] **Step 2: 실패하는 테스트 작성** — `src/test/lib.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { mulberry32 } from "../lib/random";
import { generateStars } from "../lib/stars";
import { detectSkyTier } from "../lib/sky-tier";
import { validateBirthDate } from "../lib/birth";

describe("mulberry32", () => {
  it("같은 시드는 같은 수열", () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("0~1 범위", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe("generateStars", () => {
  it("개수·결정론·범위", () => {
    const s1 = generateStars(50, 1), s2 = generateStars(50, 1);
    expect(s1).toHaveLength(50);
    expect(s1).toEqual(s2);
    for (const s of s1) {
      expect(Math.abs(s.x)).toBeLessThanOrEqual(1);
      expect(s.size).toBeGreaterThanOrEqual(0.5);
      expect(s.size).toBeLessThanOrEqual(2);
    }
  });
});

describe("detectSkyTier", () => {
  it("reduced motion이면 무조건 static", () =>
    expect(detectSkyTier({ reducedMotion: true, isMobile: false, webgl: true })).toBe("static"));
  it("webgl 미지원이면 static", () =>
    expect(detectSkyTier({ reducedMotion: false, isMobile: false, webgl: false })).toBe("static"));
  it("모바일은 lite", () =>
    expect(detectSkyTier({ reducedMotion: false, isMobile: true, webgl: true })).toBe("lite"));
  it("데스크톱+webgl은 full", () =>
    expect(detectSkyTier({ reducedMotion: false, isMobile: false, webgl: true })).toBe("full"));
});

describe("validateBirthDate", () => {
  it("정상", () => expect(validateBirthDate(1999, 3, 21)).toBe(true));
  it("존재하지 않는 날", () => expect(validateBirthDate(2001, 2, 30)).toBe(false));
  it("미래·1900 이전 거부", () => {
    expect(validateBirthDate(2999, 1, 1)).toBe(false);
    expect(validateBirthDate(1899, 12, 31)).toBe(false);
  });
});
```

- [ ] **Step 3: 실패 확인** — `npm test` → 모듈 없음 에러로 FAIL.

- [ ] **Step 4: 구현**

`src/lib/random.ts`:

```ts
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

`src/lib/stars.ts`:

```ts
import { mulberry32 } from "./random";

export interface Star { x: number; y: number; z: number; size: number; phase: number }

export function generateStars(count: number, seed: number): Star[] {
  const r = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    x: r() * 2 - 1,
    y: r() * 2 - 1,
    z: r() * 2 - 1,
    size: 0.5 + r() * 1.5,
    phase: r() * Math.PI * 2,
  }));
}
```

`src/lib/sky-tier.ts`:

```ts
export type SkyTier = "full" | "lite" | "static";

export function detectSkyTier(o: { reducedMotion: boolean; isMobile: boolean; webgl: boolean }): SkyTier {
  if (o.reducedMotion || !o.webgl) return "static";
  return o.isMobile ? "lite" : "full";
}
```

`src/lib/birth.ts`:

```ts
export function validateBirthDate(y: number, m: number, d: number): boolean {
  if (y < 1900) return false;
  const date = new Date(y, m - 1, d);
  if (date.getTime() > Date.now()) return false;
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export const KO_CITIES: { ko: string; en: string }[] = [
  { ko: "서울", en: "Seoul" }, { ko: "부산", en: "Busan" }, { ko: "인천", en: "Incheon" },
  { ko: "대구", en: "Daegu" }, { ko: "대전", en: "Daejeon" }, { ko: "광주", en: "Gwangju" },
  { ko: "울산", en: "Ulsan" }, { ko: "수원", en: "Suwon" }, { ko: "성남", en: "Seongnam" },
  { ko: "고양", en: "Goyang" }, { ko: "용인", en: "Yongin" }, { ko: "창원", en: "Changwon" },
  { ko: "청주", en: "Cheongju" }, { ko: "전주", en: "Jeonju" }, { ko: "천안", en: "Cheonan" },
  { ko: "제주", en: "Jeju" }, { ko: "포항", en: "Pohang" }, { ko: "김해", en: "Gimhae" },
  { ko: "춘천", en: "Chuncheon" }, { ko: "강릉", en: "Gangneung" },
];
```

- [ ] **Step 5: 통과 확인** — `npm test` → 전부 PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(web): core utils with tests (prng, stars, sky tier, birth validation)"`

---

### Task 4: UI 코어 컴포넌트 (GoldButton · LineDiamond · TalismanChip · ArchCard)

**Files:**
- Create: `src/components/ui/GoldButton.tsx`, `src/components/ui/LineDiamond.tsx`, `src/components/ui/TalismanChip.tsx`, `src/components/ui/ArchCard.tsx`

**Interfaces:**
- Produces:
  - `<GoldButton variant="solid"|"outline" href?>{label}</GoldButton>`
  - `<LineDiamond className?>` (가로 구분선), `<LineDiamond vertical>` 지원 안 함(YAGNI)
  - `<TalismanChip symbol="♂" label="화성 ☌ 태양 · 2.1°" onClick? theme="night"|"dawn">`
  - `<ArchCard width={212}> {상단영역} + name/latin/tagline props` — 정확한 시그니처:

```ts
interface ArchCardProps {
  name: string;        // "사자자리"
  latin: string;       // "LEO · 7.23 - 8.22"
  tagline: string;     // "태양이 스스로를 비추는 방"
  width?: number;      // 기본 212 (높이는 1.5배)
  children?: React.ReactNode; // 아치 상단 영역 (성좌 SVG 등)
}
```

- [ ] **Step 1: 구현**

`GoldButton.tsx`:

```tsx
import Link from "next/link";

export function GoldButton({
  variant = "solid", href, children,
}: { variant?: "solid" | "outline"; href?: string; children: React.ReactNode }) {
  const cls =
    variant === "solid"
      ? "bg-gold text-ink font-bold hover:bg-gold-soft"
      : "border border-gold/60 text-gold-soft hover:border-gold";
  const base = `inline-block rounded-full px-6 py-3 text-sm tracking-wide transition-colors active:scale-[0.98] ${cls}`;
  return href ? <Link href={href} className={base}>{children}</Link>
              : <button className={base}>{children}</button>;
}
```

`LineDiamond.tsx`:

```tsx
export function LineDiamond({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden>
      <span className="h-px w-6 bg-gold/50" />
      <span className="size-[3px] rotate-45 bg-gold-soft/70" />
      <span className="h-px w-6 bg-gold/50" />
    </div>
  );
}
```

`TalismanChip.tsx`:

```tsx
export function TalismanChip({
  symbol, label, theme = "night", onClick,
}: { symbol: string; label: string; theme?: "night" | "dawn"; onClick?: () => void }) {
  const cls = theme === "night"
    ? "border-gold/50 text-gold-soft"
    : "border-gold-dark/50 text-gold-dark bg-gold-dark/5";
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-transform active:scale-[0.98] ${cls}`}>
      <span aria-hidden>{symbol}</span>
      <span>{label}</span>
    </button>
  );
}
```

`ArchCard.tsx` (스펙 §4: 이중 베젤, 쐐기별, 상단 반경 = 폭 절반):

```tsx
import { LineDiamond } from "./LineDiamond";

export function ArchCard({ name, latin, tagline, width = 212, children }: {
  name: string; latin: string; tagline: string; width?: number; children?: React.ReactNode;
}) {
  const h = width * 1.5, r = width / 2;
  return (
    <div style={{ width, height: h, borderRadius: `${r}px ${r}px 10px 10px` }}
         className="border border-gold/30 bg-gold/5 p-[7px]">
      <div style={{ borderRadius: `${r - 7}px ${r - 7}px 6px 6px` }}
           className="relative h-full overflow-hidden border border-gold/60 bg-gradient-to-b from-nebula/90 to-ink shadow-[0_0_44px_6px_rgba(201,162,39,0.12),inset_0_1px_0_rgba(232,228,216,0.07)]">
        <svg viewBox="0 0 14 14" className="absolute left-1/2 top-2.5 size-3 -translate-x-1/2" aria-hidden>
          <path d="M7 .5 8 4.6l4.5.6L9 8l1 4.5L7 9.9 4 12.5 5 8 1.5 5.2l4.5-.6Z" fill="var(--color-gold-soft)" />
        </svg>
        <div className="pt-8">{children}</div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 text-center">
          <div className="font-display text-xl tracking-wide">{name}</div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.32em] text-starlight-dim">{latin}</div>
          <LineDiamond className="my-2.5" />
          <div className="text-[11px] italic text-gold-soft">{tagline}</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: page.tsx 임시 화면에 4개 컴포넌트 나열해 육안 검증** (dev-browser 스크린샷 — 아치 곡률·베젤·칩 확인). 이 임시 나열은 Task 9에서 실제 히어로로 교체됨.
- [ ] **Step 3: 빌드** — `npm run build` PASS.
- [ ] **Step 4: Commit** — `git commit -am "feat(web): core ui components (gold button, line-diamond, talisman chip, arch card)"`

---

### Task 5: 워드마크 (A2 기본 + A3 수면)

**Files:**
- Create: `src/components/brand/Wordmark.tsx`

**Interfaces:**
- Produces: `<Wordmark size="nav"|"hero" />` — nav = A2(글자+ㅅ 어깨 금별), hero = A3(A2 + 물결 + 8% 반영). 내부는 마루부리 텍스트 + 별 SVG 오버레이 (SVG 패스 세공은 후속 폴리시로 미룸, YAGNI).

- [ ] **Step 1: 구현**

```tsx
function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 14" className={className} aria-hidden>
      <path d="M7 .5 8 4.6l4.5.6L9 8l1 4.5L7 9.9 4 12.5 5 8 1.5 5.2l4.5-.6Z" fill="var(--color-gold-soft)" />
    </svg>
  );
}

export function Wordmark({ size = "nav" }: { size?: "nav" | "hero" }) {
  const mark = (
    <span className={`font-display relative inline-block tracking-[0.1em] ${size === "hero" ? "text-5xl" : "text-xl"}`}>
      별샘
      <Star className={size === "hero" ? "absolute -top-1 right-6 size-3.5" : "absolute -top-0.5 right-2.5 size-2"} />
    </span>
  );
  if (size === "nav") return mark;
  return (
    <span className="inline-flex flex-col items-center">
      {mark}
      <svg viewBox="0 0 120 10" className="mt-0.5 h-2 w-28" aria-hidden>
        <path d="M4 5Q20 2 36 5T68 5T100 5T116 5" fill="none" stroke="var(--color-gold)" strokeOpacity=".55" strokeWidth=".8" />
      </svg>
      <span className="font-display -mt-1 scale-y-[-1] bg-gradient-to-b from-starlight to-transparent bg-clip-text text-5xl tracking-[0.1em] text-transparent opacity-10 blur-[0.6px]" aria-hidden>
        별샘
      </span>
    </span>
  );
}
```

- [ ] **Step 2: 임시 페이지에 두 사이즈 렌더, 육안 확인 + `npm run build` PASS.
- [ ] **Step 3: Commit** — `git commit -am "feat(web): wordmark A2 (fallen star) + A3 (reflection) variants"`

---

### Task 6: 네비게이션 "얇은 베일" + 모바일 오버레이

**Files:**
- Create: `src/components/nav/Veil.tsx`
- Modify: `src/app/layout.tsx` (body 안에 `<Veil />` 삽입)

**Interfaces:**
- Consumes: `Wordmark`, `GoldButton`
- Produces: `<Veil />` — 링크: 오늘의 하늘 `/today` · 천궁도 `/natal` · 궁합 `/synastry` · 칼럼 `/blog` (B에선 전부 미구현 경로 — `#` 대신 실제 경로로 두되 404 허용), CTA "내 밤하늘" `#hero-ritual`.

- [ ] **Step 1: 구현** (`'use client'` — 스크롤 상태·메뉴 토글. 스크롤 감지는 `IntersectionObserver`로 상단 센티넬 관찰, `addEventListener('scroll')` 금지 준수)

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Wordmark } from "../brand/Wordmark";

const LINKS = [
  { href: "/today", label: "오늘의 하늘" },
  { href: "/natal", label: "천궁도" },
  { href: "/synastry", label: "궁합" },
  { href: "/blog", label: "칼럼" },
];

export function Veil() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} className="absolute top-0 h-6 w-px" aria-hidden />
      <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled ? "border-b border-gold/20 bg-ink-raised/75 backdrop-blur-md" : "bg-transparent"}`}>
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="별샘 홈"><Wordmark size="nav" /></Link>
          <div className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-starlight-dim transition-colors hover:text-starlight">
                {l.label}
              </Link>
            ))}
            <a href="#hero-ritual" className="rounded-full border border-gold/60 px-4 py-2 text-xs tracking-wider text-gold-soft transition-colors hover:border-gold">
              내 밤하늘
            </a>
          </div>
          <button onClick={() => setOpen(!open)} aria-label="메뉴" aria-expanded={open}
                  className="flex size-10 flex-col items-center justify-center gap-1.5 md:hidden">
            <span className={`h-px w-5 bg-starlight transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-5 bg-starlight transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </nav>
      </header>
      {open && (
        <div className="nebula-bg fixed inset-0 z-30 flex flex-col items-center justify-center gap-8 md:hidden">
          {LINKS.map((l, i) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  style={{ transitionDelay: `${i * 60}ms` }}
                  className="font-display text-2xl text-starlight">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: layout.tsx body에 `<Veil />` 추가** (children 위).
- [ ] **Step 3: 검증** — dev-browser 390px·1280px 스크린샷: 데스크톱 한 줄, 스크롤 시 베일, 모바일 햄버거→X 모프·오버레이. `npm run build` PASS.
- [ ] **Step 4: Commit** — `git commit -am "feat(web): thin-veil navigation with mobile overlay"`

---

### Task 7: 하늘 — CSS 폴백 + R3F 스타필드 + 티어 적용

**Files:**
- Create: `src/components/sky/SkyBackdrop.tsx`, `src/components/sky/SkyCanvas.tsx`, `src/components/sky/Starfield.tsx`

**Interfaces:**
- Consumes: `generateStars`, `detectSkyTier`
- Produces: `<SkyBackdrop />` — 항상 CSS 성운을 즉시 페인트하고, 티어가 full/lite면 WebGL 캔버스를 lazy 마운트 후 1초 페이드인. `position: fixed inset-0 -z-10`. 마우스 시차 포함(full만).

- [ ] **Step 1: 설치**

```bash
npm i three @react-three/fiber
npm i -D @types/three
```

- [ ] **Step 2: Starfield.tsx** (`'use client'`)

```tsx
"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateStars } from "@/lib/stars";

export function Starfield({ count, parallax }: { count: number; parallax: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const positions = useMemo(() => {
    const stars = generateStars(count, 20260810);
    const arr = new Float32Array(count * 3);
    stars.forEach((s, i) => { arr[i * 3] = s.x * 6; arr[i * 3 + 1] = s.y * 4; arr[i * 3 + 2] = s.z * 2 - 3; });
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.z += dt * 0.004; // 하늘의 자전
    if (parallax) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * 0.03, 0.05);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.03, 0.05);
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} sizeAttenuation color="#e8e4d8" transparent opacity={0.9} />
      </points>
    </group>
  );
}
```

- [ ] **Step 3: SkyCanvas.tsx** (`'use client'`)

```tsx
"use client";
import { Canvas } from "@react-three/fiber";
import { Starfield } from "./Starfield";

export default function SkyCanvas({ tier }: { tier: "full" | "lite" }) {
  return (
    <Canvas
      dpr={tier === "lite" ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 2], fov: 60 }}
      gl={{ antialias: false, powerPreference: "low-power" }}>
      <Starfield count={tier === "lite" ? 400 : 1200} parallax={tier === "full"} />
    </Canvas>
  );
}
```

- [ ] **Step 4: SkyBackdrop.tsx** (`'use client'` — 티어 판정 + 지연 마운트 + 페이드인)

```tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectSkyTier, type SkyTier } from "@/lib/sky-tier";

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

export function SkyBackdrop() {
  const [tier, setTier] = useState<SkyTier | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    const t = detectSkyTier({
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      isMobile: matchMedia("(max-width: 768px)").matches,
      webgl,
    });
    setTier(t);
    if (t !== "static") requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div className="nebula-bg fixed inset-0 -z-10" aria-hidden>
      {tier && tier !== "static" && (
        <div className={`h-full w-full transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}>
          <SkyCanvas tier={tier} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: page.tsx에 `<SkyBackdrop />` 삽입 후 검증** — dev-browser: 별 렌더·자전·마우스 시차 확인, 데스크톱/모바일 뷰포트. `npm run build` PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(web): webgl starfield with css-first paint and 3-tier fallback"`

---

### Task 8: 달 (DOM) + 히어로 장면 ① 도착

**Files:**
- Create: `src/components/hero/Moon.tsx`, `src/components/hero/HeroSequence.tsx` (이번 태스크에선 arrival 장면만)
- Modify: `src/app/page.tsx` (임시 나열 제거 → HeroSequence)

**Interfaces:**
- Consumes: `GoldButton`, `SkyBackdrop`(page 레벨)
- Produces: `<Moon state="corner"|"center" size?>` (absolute 배치, GSAP 이동 대상 ref 노출용 `id="hero-moon"`), `<HeroSequence />` — 이후 태스크가 이 컴포넌트에 장면을 추가.

- [ ] **Step 1: Moon.tsx**

```tsx
export function Moon({ className = "" }: { className?: string }) {
  return (
    <div id="hero-moon" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <div className="relative">
        <div className="size-[240px] rounded-full border border-gold/50 shadow-[0_0_80px_10px_rgba(201,162,39,0.14),inset_0_0_50px_rgba(201,162,39,0.10)] md:size-[320px]" />
        <div className="absolute inset-[18%] rounded-full border border-gold/25" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: HeroSequence.tsx — arrival 장면**

```tsx
"use client";
import { useState } from "react";
import { Moon } from "./Moon";

export type Scene = "arrival" | "altar" | "ritual" | "complete";

export function HeroSequence() {
  const [scene, setScene] = useState<Scene>("arrival");

  return (
    <section className="relative min-h-[100dvh] overflow-hidden" id="hero">
      <Moon className={scene === "arrival" ? "-right-16 -top-10 md:-right-24 md:-top-16" : "left-1/2 top-[26%] -translate-x-1/2 -translate-y-1/2"} />
      {scene === "arrival" && (
        <div className="absolute bottom-16 left-6 max-w-[34rem] md:left-12">
          <h1 className="font-display text-4xl leading-snug md:text-6xl">
            당신이 태어난 밤,<br />
            <em className="not-italic text-gold-soft">하늘은 기억하고 있어요</em>
          </h1>
          <p className="mt-4 text-sm text-starlight-dim">태어난 순간의 행성 배치로 읽는 나의 이야기</p>
          <div className="mt-7 flex items-center gap-5">
            <button onClick={() => setScene("altar")}
              className="rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-ink transition-transform active:scale-[0.98]">
              나의 밤하늘 보기
            </button>
            <a href="/today" className="border-b border-starlight-dim/40 pb-0.5 text-sm text-starlight-dim hover:text-starlight">
              오늘의 하늘
            </a>
          </div>
        </div>
      )}
      {scene !== "arrival" && (
        <div className="absolute inset-x-0 top-[45%] text-center" id="hero-ritual">
          <p className="font-display text-2xl">어느 밤에 태어나셨나요?</p>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: page.tsx 교체**

```tsx
import { SkyBackdrop } from "@/components/sky/SkyBackdrop";
import { HeroSequence } from "@/components/hero/HeroSequence";

export default function Home() {
  return (
    <main>
      <SkyBackdrop />
      <HeroSequence />
    </main>
  );
}
```

- [ ] **Step 4: 검증** — 스크린샷: 히어로가 뷰포트 안에 완결(헤드라인 2줄·CTA 보임), 달이 우상단 모서리 걸침, 클릭 시 즉시 중앙 상태로 점프(전환 애니메이션은 Task 9). 히어로 텍스트 요소 4개 이하 확인. `npm run build` PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat(web): hero arrival scene with corner moon"`

---

### Task 9: 장면 전환 (GSAP) — 달 이동 + 헤드라인 소산

**Files:**
- Modify: `src/components/hero/HeroSequence.tsx`

**Interfaces:**
- Produces: `startRitual()` 내부 함수 — CTA 클릭 시 1.2초 타임라인: 헤드라인 블록 opacity 0 + blur + y-이동으로 소산 → 달이 FLIP으로 중앙 이동 → altar 콘텐츠 페이드인 → `setScene("ritual")`. reduced-motion이면 즉시 전환.

- [ ] **Step 1: gsap 설치** — `npm i gsap`

- [ ] **Step 2: 전환 구현** — HeroSequence에 적용 (달 이동은 GSAP Flip: state capture → 클래스 교체 → `Flip.from`):

```tsx
"use client";
import { useRef, useState } from "react";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { Moon } from "./Moon";

gsap.registerPlugin(Flip);

export type Scene = "arrival" | "altar" | "ritual" | "complete";

export function HeroSequence() {
  const [scene, setScene] = useState<Scene>("arrival");
  const headline = useRef<HTMLDivElement>(null);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  function startRitual() {
    if (reduced()) { setScene("ritual"); return; }
    const moonEl = document.getElementById("hero-moon")!;
    const state = Flip.getState(moonEl);
    gsap.timeline({ onComplete: () => setScene("ritual") })
      .to(headline.current, { opacity: 0, filter: "blur(6px)", y: -24, duration: 0.5, ease: "power2.in" })
      .add(() => {
        setScene("altar"); // 리렌더로 달 위치 클래스가 중앙으로 바뀜
        requestAnimationFrame(() => Flip.from(state, { duration: 1.1, ease: "power3.inOut" }));
      })
      .to({}, { duration: 1.2 });
  }
  /* …scene 렌더링은 Task 8과 동일 구조, CTA onClick={startRitual},
     altar/ritual 장면 콘텐츠는 opacity-0 → animate-in (gsap.from 0.6s fade) … */
}
```

주의: `setScene("altar")` 리렌더 직후 같은 프레임에서 Flip.from을 호출해야 위치 점프가 안 보임. Moon의 위치는 scene에 따라 Tailwind 클래스로 선언(모서리/중앙) — GSAP은 그 차이만 보간.

- [ ] **Step 3: 검증** — dev-browser로 클릭 전후 녹화 확인: 헤드라인 소산 → 달 부드러운 중앙 이동 → "어느 밤에…" 페이드인. OS 모션 감소 설정에서 즉시 전환 확인. `npm run build` PASS.
- [ ] **Step 4: Commit** — `git commit -am "feat(web): hero scene transition with gsap flip moon travel"`

---

### Task 10: 입력 의식 (4단계) + 목업 천궁도 조립 + 목업 결과

**Files:**
- Create: `src/components/hero/RitualForm.tsx`, `src/components/hero/MockChart.tsx`
- Modify: `src/components/hero/HeroSequence.tsx` (ritual/complete 장면 연결)

**Interfaces:**
- Consumes: `validateBirthDate`, `KO_CITIES`, `ArchCard`, `TalismanChip`, `LineDiamond`
- Produces:
  - `<RitualForm onComplete={(data: RitualData) => void} />` — `RitualData = { date: string; time: string | null; city: string; concern: string }`
  - `<MockChart onDrawn: () => void>` — 목업 천궁도 SVG를 stroke-dashoffset으로 2초 드로잉 후 콜백.

- [ ] **Step 1: RitualForm 구현** — 4단계 스텝 상태, 언더라인 입력, 단계별 검증:

```tsx
"use client";
import { useState } from "react";
import { KO_CITIES, validateBirthDate } from "@/lib/birth";

export interface RitualData { date: string; time: string | null; city: string; concern: string }
const CONCERNS = ["재물운", "연애운", "직업운", "학업운", "건강운", "대인운", "이동운"];

export function RitualForm({ onComplete }: { onComplete: (d: RitualData) => void }) {
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState<string | null>("");
  const [city, setCity] = useState("");
  const [err, setErr] = useState("");

  const dateOk = () => {
    const m = date.match(/^(\d{4})[.\- ]?(\d{1,2})[.\- ]?(\d{1,2})$/);
    return !!m && validateBirthDate(+m[1], +m[2], +m[3]);
  };
  const next = (ok: boolean, msg: string) => { ok ? (setErr(""), setStep(step + 1)) : setErr(msg); };

  const underline = "w-full border-b border-gold/60 bg-transparent py-2 text-center font-display text-lg text-starlight outline-none placeholder:text-starlight-dim/50";

  return (
    <div className="mx-auto w-full max-w-xs text-center">
      {step === 0 && (<>
        <input className={underline} placeholder="1999 . 03 . 21" value={date}
               onChange={(e) => setDate(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && next(dateOk(), "실재하는 날짜를 입력해 주세요")} autoFocus />
        <p className="mt-3 text-[11px] tracking-wide text-starlight-dim">생년월일을 입력하면 그날의 하늘이 펼쳐집니다</p>
      </>)}
      {step === 1 && (<>
        <input className={underline} placeholder="21 : 44" value={time ?? ""}
               onChange={(e) => setTime(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && next(true, "")} />
        <button className="mt-3 text-[11px] text-starlight-dim underline underline-offset-4"
                onClick={() => { setTime(null); setStep(2); }}>
          태어난 시간을 몰라요
        </button>
      </>)}
      {step === 2 && (<>
        <input className={underline} list="cities" placeholder="태어난 도시" value={city}
               onChange={(e) => setCity(e.target.value)}
               onKeyDown={(e) => e.key === "Enter" && next(city.length > 0, "도시를 선택해 주세요")} />
        <datalist id="cities">{KO_CITIES.map((c) => <option key={c.en} value={c.ko} />)}</datalist>
      </>)}
      {step === 3 && (
        <div className="flex flex-wrap justify-center gap-2.5">
          {CONCERNS.map((c) => (
            <button key={c}
              onClick={() => onComplete({ date, time, city, concern: c })}
              className="rounded-full border border-gold/50 px-4 py-2 text-xs text-gold-soft transition-colors hover:border-gold hover:text-starlight active:scale-[0.98]">
              {c}
            </button>
          ))}
        </div>
      )}
      {err && <p className="mt-3 text-xs text-gold-soft/80">{err}</p>}
      <div className="mt-6 flex justify-center gap-2" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-1.5 rounded-full ${i <= step ? "bg-gold-soft" : "border border-starlight-dim/40"}`} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: MockChart 구현** — 고정 목업 성좌(7별 폴리라인) 드로잉:

```tsx
"use client";
import { useEffect, useRef } from "react";

const PATH = "M60 40 L110 80 L170 60 L200 120 L150 170 L90 150 L60 40";

export function MockChart({ onDrawn }: { onDrawn: () => void }) {
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    const p = ref.current!;
    const len = p.getTotalLength();
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    p.getBoundingClientRect(); // reflow
    p.style.transition = "stroke-dashoffset 2s ease-in-out";
    p.style.strokeDashoffset = "0";
    const t = setTimeout(onDrawn, 2100);
    return () => clearTimeout(t);
  }, [onDrawn]);
  return (
    <svg viewBox="0 0 260 200" className="mx-auto w-56">
      <path ref={ref} d={PATH} fill="none" stroke="var(--color-gold)" strokeWidth="0.9" opacity=".9" />
      {[[60,40],[110,80],[170,60],[200,120],[150,170],[90,150]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="2.4" fill="var(--color-starlight)" />
      ))}
    </svg>
  );
}
```

- [ ] **Step 3: HeroSequence에 연결** — `scene === "ritual"` → 달 아래 `<RitualForm onComplete={…setScene("complete")} />`; `scene === "complete"` → `<MockChart>` 드로잉 후 목업 결과(ArchCard: name="봄의 불꽃" latin="MOCK RESULT" tagline="곧 진짜 하늘이 연결됩니다" + TalismanChip 2개) 페이드인.
- [ ] **Step 4: 검증** — 전 시퀀스 통주행: 도착 → 전환 → 4단계 입력(검증 에러 포함) → 차트 드로잉 → 목업 카드. 모바일 390px 확인. `npm run build` PASS.
- [ ] **Step 5: Commit** — `git commit -am "feat(web): ritual input flow with mock chart assembly and result card"`

---

### Task 11: 메인 하위 섹션 (오늘의 하늘 · 세 개의 문 · 결과 미리보기 · 푸터)

**Files:**
- Create: `src/components/sections/TodayTeaser.tsx`, `ThreeDoors.tsx`, `ResultPreview.tsx`, `Footer.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `ArchCard`, `TalismanChip`, `GoldButton`, `LineDiamond`, `Wordmark size="hero"`
- Produces: 섹션 4개 Server Component (모션은 CSS/뷰포트 진입만, GSAP 없음).

- [ ] **Step 1: TodayTeaser** — 오늘 날짜(빌드타임 아님: 클라이언트에서 `new Date()` 렌더하는 소형 client 컴포넌트) + 목업 달 위상 카드(ArchCard 소형) + `/today` 링크. 코드:

```tsx
import { ArchCard } from "../ui/ArchCard";
import { GoldButton } from "../ui/GoldButton";

export function TodayTeaser() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-28 md:py-40">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <div>
          <h2 className="font-display text-3xl md:text-4xl">오늘 밤, 하늘은 이렇게 흐릅니다</h2>
          <p className="mt-4 max-w-md leading-relaxed text-starlight-dim">
            무작위 카드가 아니라 실제 오늘의 하늘. 달의 위상과 행성의 각도가 매일 새로운 카드를 만듭니다.
          </p>
          <div className="mt-8"><GoldButton variant="outline" href="/today">오늘의 카드 열기</GoldButton></div>
        </div>
        <ArchCard name="하현달" latin="MOON IN SCORPIO" tagline="깊이 파고드는 날" width={190}>
          <div className="mx-auto mt-4 size-14 rounded-full border border-gold/60 shadow-[inset_14px_0_12px_-8px_rgba(201,162,39,0.35)]" />
        </ArchCard>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: ThreeDoors** — 비대칭 벤토 (`grid-cols-5`: 큰 셀 col-span-3 + 작은 셀 2개 col-span-2 세로 스택, 모바일 1열). 셀: 천궁도(`/natal`, 성좌 SVG 미니), 궁합(`/synastry`, 금실 곡선 SVG), 연간(`/yearly/2027`, 강물 곡선 SVG). 각 셀 배경에 `nebula-bg` 변형 — 흰 카드 나열 금지. 각 SVG는 Task 4~10에서 만든 미니 성좌 스타일 재사용 (인라인 12줄 이내).
- [ ] **Step 3: ResultPreview** — "이런 이야기를 받게 됩니다" + ArchCard(결과 목업 재사용) + TalismanChip 2개 나열. 가짜 스크린샷 div 금지 — 실제 컴포넌트 렌더가 곧 미리보기.
- [ ] **Step 4: Footer** — `<Wordmark size="hero" />` 중앙, 아래 링크(소개 `/about` · 개인정보처리방침 `/privacy` · 문의 `mailto:hayoul1999@gmail.com`), 쿠팡 파트너스 고지 한 줄(`text-xs text-starlight-dim`): "이 사이트는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다."
- [ ] **Step 5: page.tsx에 4섹션 조립, 검증** — 레이아웃 패밀리 4종 상이 확인(히어로/2열/벤토/중앙 스택), 아이브로 0개, 마퀴 0개. 390px 1열 붕괴. `npm run build` PASS.
- [ ] **Step 6: Commit** — `git commit -am "feat(web): main page sections (today teaser, three doors, preview, footer)"`

---

### Task 12: Lenis + 뷰포트 진입 모션 + 마감 점검

**Files:**
- Create: `src/components/SmoothScroll.tsx`, `src/components/Reveal.tsx`
- Modify: `src/app/layout.tsx`, 섹션들에 Reveal 적용

**Interfaces:**
- Produces: `<SmoothScroll />` (전역 Lenis, reduced-motion 시 미기동), `<Reveal>{children}</Reveal>` (IntersectionObserver 기반 fade-up, Motion 의존 없이 CSS로 — GSAP/Motion 혼용 회피).

- [ ] **Step 1: 설치** — `npm i lenis`

- [ ] **Step 2: SmoothScroll.tsx**

```tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    let raf: number;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);
  return null;
}
```

- [ ] **Step 3: Reveal.tsx**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";

export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setInView(true), io.disconnect()),
      { threshold: 0.25 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
        inView ? "translate-y-0 opacity-100 blur-0" : "translate-y-8 opacity-0 blur-sm"}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: 적용** — layout에 `<SmoothScroll />`, TodayTeaser·ThreeDoors·ResultPreview를 `<Reveal>`로 감쌈 (히어로는 즉시 표시 — LCP 보호).
- [ ] **Step 5: 마감 점검 체크리스트 실행** (스펙 §7·§8 + taste-skill Pre-Flight 축약):
  - `npm run build && npm test` PASS
  - dev-browser: 데스크톱 1280 · 모바일 390 풀 스크린샷
  - 확인 항목: 히어로 뷰포트 완결 / CTA 한 줄 / 같은 의도 CTA 중복 없음("나의 밤하늘 보기" 계열 1종) / em-dash 0 / 이모지 0 / 커스텀 커서 0 / 스크롤 유도 문구 0 / 순검정·순백 0 / 보라는 성운에만 / Lighthouse(Chrome DevTools) Performance·A11y 90+
  - 미달 항목은 이 태스크 안에서 수정
- [ ] **Step 6: Commit** — `git commit -am "feat(web): lenis smooth scroll, reveal motion, pre-flight pass"`

---

## Self-Review 결과 (계획 작성 후 점검 완료)

- 스펙 §5(네비)·§6.1(히어로 3장면+하위 섹션)·§1~4(토큰·서체·카드·로고)·§7·8(모션·성능) → Task 2~12가 커버. §6.2~6.9(결과 실데이터·/today·/sign 등)는 B 범위 밖(스펙 §10) — 의도된 제외.
- 타입 일관성: `Scene`·`RitualData`·`SkyTier`·`Star` 정의 태스크와 소비 태스크 서명 일치 확인.
- 남은 정직한 리스크: MaruBuri CDN URL은 변동 가능(Task 2에 수동 폴백 명시), R3F v9 + Next 16 조합의 SSR 회피는 `ssr:false` dynamic으로 처리.
