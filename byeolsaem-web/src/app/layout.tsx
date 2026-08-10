import type { Metadata } from "next";
import localFont from "next/font/local";
import { SkyBackdrop } from "@/components/sky/SkyBackdrop";
import { Veil } from "@/components/nav/Veil";
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
        {/* SkyBackdrop을 layout에서 한 번만 마운트해 모든 페이지가 배경을 공유한다.
            SkyBackdrop 자신은 fixed + z-0(컴포지팅 버그 회피, SkyBackdrop.tsx 주석 참고)이므로
            일반 흐름 콘텐츠보다 스택 레벨상 위에 그려질 수 있다. 이를 막기 위해 {children}을
            relative z-10 래퍼로 감싸 명시적 스택 컨텍스트를 부여한다 — 페이지마다 이 래퍼를
            반복해서 챙길 필요가 없도록 layout 레벨에서 한 번에 처리한다. Veil 네비(z-40)는
            그보다 항상 위에 있다. */}
        <SkyBackdrop />
        <Veil />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
