import type { Metadata } from "next";
import Link from "next/link";
import { Astrolabe } from "@/components/sign/Astrolabe";
import { SignPrimer } from "@/components/sign/SignPrimer";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { SIGN_CONTENT } from "@/lib/sign-content";

export const metadata: Metadata = {
  title: "열두 개의 방 | 별샘",
  description:
    "양자리부터 물고기자리까지 열두 별자리. 기간, 원소, 지배 행성과 성질을 실제 성좌와 함께 봅니다.",
};

export default function SignIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
      {/* data-morph-fade: 성좌가 카드로 날아가는 동안 진(Astrolabe)이 이 요소들을
          완전히 지운다. 전환 프레임에 배경과 성좌 말고 아무것도 남지 않아야
          라우트가 바뀌는 순간이 눈에 보이지 않는다(Astrolabe 타이밍 주석). */}
      <header className="text-center" data-morph-fade>
        <p className="text-eyebrow tracking-[0.28em] text-gold">황도 12궁</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          열두 개의 방
        </h1>
        <p className="mx-auto mt-5 max-w-md break-keep leading-relaxed text-starlight-dim">
          태양은 한 해에 걸쳐 이 열두 방을 차례로 지납니다. 당신이 태어난 날, 태양은 그중
          한 곳에 있었습니다.
        </p>
      </header>

      <div className="mt-16">
        <Astrolabe />
      </div>

      {/*
        진(陣)은 마우스가 있는 환경의 즐거움이고, 검색엔진과 키보드·모바일
        사용자에게는 목록이 필요하다. 같은 열두 링크를 글자로도 놓는다 — 진의
        성좌들은 이미 <Link>지만 그림뿐이라 문맥이 없다.
      */}
      <nav aria-label="별자리 목록" className="mt-20 border-t border-gold/15 pt-10" data-morph-fade>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3 md:grid-cols-4">
          {ZODIAC_SIGNS.map((s) => {
            const ready = Boolean(SIGN_CONTENT[s.key]);
            return (
              <li key={s.key}>
                <Link
                  href={`/sign/${s.key}`}
                  className="group flex items-baseline justify-between gap-2 border-b border-transparent py-2.5 transition-colors hover:border-gold/30"
                >
                  <span className="font-display text-base text-starlight">{s.ko}</span>
                  <span className="font-latin text-meta tracking-wide text-starlight-dim transition-colors group-hover:text-gold-soft">
                    {ready ? s.range : "준비 중"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 진과 링크만으로는 크롤러가 읽을 글이 없다(SignPrimer 주석 참고). */}
      <SignPrimer />

      <p className="mt-16 text-center text-sm text-starlight-dim" data-morph-fade>
        태양만으로는 절반입니다.{" "}
        <Link
          href="/"
          className="border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:text-starlight"
        >
          태어난 시각까지 넣어 내 하늘 전체를 보기
        </Link>
      </p>
    </main>
  );
}
