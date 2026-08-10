import type { Metadata } from "next";
import localFont from "next/font/local";
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
        <Veil />
        {children}
      </body>
    </html>
  );
}
