import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import Link from "next/link";
import { Astrolabe } from "@/components/sign/Astrolabe";
import { SignPrimer } from "@/components/sign/SignPrimer";
import { alternatesFor, ogImage } from "@/lib/metadata";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { SIGN_CONTENT } from "@/lib/sign-content";

export const metadata: Metadata = {
  title: "열두 개의 방 | 별샘",
  description:
    "양자리부터 물고기자리까지 열두 별자리. 기간, 원소, 지배 행성과 성질을 실제 성좌와 함께 봅니다.",
  alternates: alternatesFor("/sign"),
  openGraph: ogImage("/sign", "/og/sign.png"),
};

export default function SignIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
      {/* 화면에 있는 문답만 스키마로 낸다(자체 원칙) — 아래 답변은 프라이머 원문이다. */}
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "별자리", path: "/sign" }])} />
      <JsonLd
        data={faqSchema([
          { question: "흔히 말하는 별자리는 무엇인가요?",
            answer:
              "흔히 '별자리'라고 부르는 것은 태어난 날 태양이 있던 자리입니다. 태양은 한 해에 걸쳐 황도를 한 바퀴 돌고, 한 자리에 약 한 달 머뭅니다. 그래서 날짜만 알면 정해지고, 같은 기간에 태어난 사람은 모두 같은 값을 갖습니다." },
          { question: "별자리 날짜 경계는 왜 해마다 다른가요?",
            answer:
              "기간은 해마다 하루쯤 움직입니다. 태양이 자리를 옮기는 순간이 날짜 경계와 정확히 맞아떨어지지 않기 때문이라, 경계에 태어났다면 태어난 해의 실제 위치를 계산해 보는 편이 정확합니다." },
          { question: "열두 자리의 순서에는 이유가 있나요?",
            answer:
              "양자리가 첫 자리인 것은 춘분에서 시작하기 때문입니다. 낮이 밤을 넘어서는 지점이라, 아무것도 정해지지 않은 상태에서 먼저 움직이는 성질이 여기 놓입니다." },
        ])}
      />
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
