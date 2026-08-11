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
    <html lang="ko" className={`${pretendard.variable} ${maruburi.variable}`}>
      <body className="min-h-[100dvh] antialiased">{children}</body>
    </html>
  );
}
