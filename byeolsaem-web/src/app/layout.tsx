import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@/components/analytics/Analytics";
import { TransitionStage } from "@/components/nav/TransitionStage";
import "./globals.css";

const maruburi = localFont({
  src: [
    { path: "../fonts/MaruBuri-Regular.woff2", weight: "400" },
    { path: "../fonts/MaruBuri-Bold.woff2", weight: "700" },
  ],
  variable: "--font-maruburi",
  display: "swap",
});

/**
 * 라틴 제목용. `LIBRA SUN`·`MERCURY RETROGRADE`처럼 자간을 넓게 벌린 대문자가
 * 이 사이트 라틴 표기의 전부라, 로마 비문 계열인 Cinzel이 그대로 맞는다.
 *
 * 고르는 과정에서 실제로 갈린 지점은 숫자였다. 후보 중 Marcellus 계열은 숫자가
 * 올드스타일이라 `2026. 10. 24`가 `2О26. IО. 24`처럼 들쭉날쭉해진다. 이 사이트는
 * 날짜와 도수를 도처에 쓰므로 라이닝 숫자가 아니면 쓸 수 없다(RENEWAL_PLAN §11.6).
 *
 * 라틴 서브셋만 받는다(25.9KB). 한글은 마루부리와 Pretendard가 맡으므로
 * latin-ext는 필요 없다.
 */
const cinzel = localFont({
  src: "../fonts/Cinzel.woff2",
  variable: "--font-cinzel",
  display: "swap",
  // 폴백이 마루부리 라틴이면 자간 벌린 자리에서 폭이 크게 달라 글이 튄다.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "별샘 | 당신이 태어난 밤, 하늘은 기억하고 있어요",
  description:
    "태어난 순간의 실제 하늘로 읽는 나의 이야기. 천궁도, 오늘의 하늘, 별자리 궁합.",
  verification: {
    // 네이버 서치어드바이저 소유 확인. 한국어 사이트라 네이버 유입이 구글만큼
    // 중요한데 그동안 등록조차 되어 있지 않았다. 확인이 끝난 뒤에도 지우지
    // 않는다 — 네이버가 주기적으로 다시 확인하고, 사라지면 소유가 풀린다.
    other: { "naver-site-verification": "e9216a2372ff9e5f3f684e9f5d3c7e192783c1b5" },
  },
};

/**
 * 최상위 레이아웃은 문서 뼈대와 폰트만 맡는다.
 *
 * 사이트는 두 세계로 나뉜다(스펙 §1). 밤은 도구 페이지, 새벽은 읽는 페이지다.
 * 배경·네비·스크롤 연출은 세계마다 다르므로 각 라우트 그룹의 레이아웃이 갖는다:
 *
 *   (night) — 먹빛 하늘 + WebGL 별하늘 + 얇은 베일 네비
 *   (dawn)  — 미색 종이 + 읽기 진행선. Three.js를 아예 싣지 않는다.
 *
 * 이전에는 여기서 SkyBackdrop을 전역으로 마운트했는데, 그러면 밝은 문서
 * 페이지에도 밤하늘이 깔리고 `/sign`·`/blog`에 Three.js 번들이 따라붙는다
 * (성능 가드레일 위반, RENEWAL_PLAN §7). 그래서 그룹별 레이아웃으로 내렸다.
 *
 * 배경색도 그룹이 정한다. body에 색을 박아두면 두 세계 중 한쪽에서 반드시
 * 어긋나므로, 기본값만 globals.css에 두고 새벽 그룹이 덮어쓴다.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${maruburi.variable} ${cinzel.variable}`}>
      <body className="min-h-[100dvh] antialiased">
        {children}
        {/* 페이지 전환 크로스페이드(TransitionStage 주석 참고).
            두 세계 모두에 걸쳐야 하므로 여기, 문서 뼈대에 마운트한다. */}
        <TransitionStage />
        {/* 측정은 광고와 달리 메인까지 전부 덮는다(Analytics 주석 참고). */}
        <Analytics />
      </body>
    </html>
  );
}
