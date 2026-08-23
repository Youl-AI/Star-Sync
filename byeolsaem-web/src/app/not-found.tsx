import type { Metadata } from "next";
import Link from "next/link";
import { GoldButton } from "@/components/ui/GoldButton";

export const metadata: Metadata = {
  title: "길 잃은 별 | 별샘",
  // 없는 주소는 검색 결과에 남을 이유가 없다.
  robots: { index: false, follow: true },
};

// 404 — "밤하늘에 홀로 깜빡이는 별 하나"(스펙 §6.9).
//
// 라우트 그룹 밖에 있어서 (night)/(dawn) 어느 레이아웃도 받지 않는다. 존재하지
// 않는 주소는 어느 세계에 속하는지 알 수 없으므로 당연한 결과이고, 그래서 배경과
// 색을 이 파일이 직접 갖는다. WebGL도 싣지 않는다 — 길을 잃은 화면에서 무거운
// 씬을 내려받게 할 이유가 없다.
export default function NotFound() {
  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center text-starlight">
      <div className="nebula-bg pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative">
        {/* 홀로 깜빡이는 별 하나. 감소 모드에서는 globals.css의 전역 규칙이
            깜빡임을 멈춰 정지한 별로 남는다. */}
        <span
          className="mx-auto block size-1.5 rounded-full bg-starlight motion-safe:animate-lonely-star"
          aria-hidden
        />

        <p className="mt-10 font-display text-2xl leading-relaxed text-starlight md:text-3xl">
          길 잃은 별이네요
        </p>
        <p className="mt-4 text-sm text-starlight-dim">
          찾으시는 하늘이 이 자리에는 없습니다.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <GoldButton variant="solid" href="/">
            밤하늘로 돌아가기
          </GoldButton>
          <GoldButton variant="outline" href="/today">
            오늘의 하늘
          </GoldButton>
          <GoldButton variant="outline" href="/calendar">
            하늘의 달력
          </GoldButton>
        </div>

        <p className="mt-12 text-meta tracking-wide text-starlight-dim">
          주소가 잘못되었다면{" "}
          <Link
            href="/about"
            className="border-b border-starlight-dim/40 pb-0.5 transition-colors hover:text-starlight"
          >
            알려 주세요
          </Link>
        </p>
      </div>
    </div>
  );
}
