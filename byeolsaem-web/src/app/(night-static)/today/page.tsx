import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { alternatesFor, ogImage } from "@/lib/metadata";
import { PlaceBand } from "@/components/place/PlaceBand";
import { NextSteps } from "@/components/nav/NextSteps";
import { MoonPrimer } from "@/components/today/MoonPrimer";
import { TodayCard } from "@/components/today/TodayCard";
import { todaySky } from "@/lib/today";

export const metadata: Metadata = {
  title: "오늘의 하늘 | 별샘",
  description:
    "오늘 밤 달의 위상과 별자리, 그리고 그 하늘이 당신의 출생 차트를 어디서 건드리는지. 무작위 운세가 아니라 실제 계산 결과입니다.",
  // 앞면(달의 위상)은 누구에게나 같으므로 색인해도 얇은 페이지가 아니다.
  // 다만 날짜가 매일 바뀌는 페이지라 정규 주소는 이 하나로 유지한다.
  alternates: alternatesFor("/today"),
  openGraph: ogImage("/today", "/og/today.png"),
};

export default function TodayPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
      {/* 화면에 있는 문답만 스키마로 낸다(자체 원칙) — 아래 답변은 프라이머 원문이다. */}
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "오늘", path: "/today" }])} />
      <JsonLd
        data={faqSchema([
          { question: "달은 왜 매일 다른가요?",
            answer:
              "달은 지구를 한 바퀴 도는 데 약 29.5일이 걸립니다. 그동안 태양·지구·달이 이루는 각도가 계속 달라지고, 우리 눈에는 그 각도가 달의 밝은 면 크기로 보입니다." },
          { question: "오늘 하늘이 나를 건드린다는 말은 무슨 뜻인가요?",
            answer:
              "점성술에서 트랜짓은 지금 하늘에 있는 별이 태어난 순간의 내 별과 특정한 각도를 이루는 일을 말합니다. 태어난 순간의 배치는 평생 그 자리에 있고, 그 위를 오늘의 별들이 지나갑니다." },
          { question: "이 페이지의 숫자는 어디서 오나요?",
            answer:
              "태양과 달, 행성의 위치를 궤도 요소에서 직접 계산하고, 그 값으로 위상과 각도를 구합니다. 어느 단계에서도 무작위로 고르거나 뽑는 과정이 없어서, 같은 날 같은 출생 정보라면 몇 번을 열어도 같은 글이 나옵니다." },
        ])}
      />
      {/* 오늘의 하늘이 열리는 장소: 별이 비치는 샘의 수면 */}
      <PlaceBand src="/world/place-today.webp" />
      <header className="mx-auto max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">TONIGHT&rsquo;S SKY</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          오늘의 하늘
        </h1>
        <p className="mx-auto mt-5 max-w-md break-keep leading-relaxed text-starlight-dim">
          무작위로 뽑은 카드가 아니라 오늘 실제 하늘입니다. 달의 위상과 자리는 누구에게나
          같고, 그 하늘이 어디를 건드리는지는 태어난 순간마다 다릅니다.
        </p>
      </header>

      <div className="mt-14">
        {/* 빌드 시점의 하늘을 첫 렌더로 내보낸다 — 검색엔진과 첫 페인트가 빈
          화면 대신 이것을 본다. 마운트 후 오늘 값으로 갈아 끼우는 계약은
          RetrogradeStatusBand와 같다(최종 리뷰 2026-08-22). */}
      <TodayCard initialSky={todaySky(new Date())} builtAt={new Date().toISOString()} />
      </div>

      {/* 카드는 브라우저가 그날 그리므로 HTML에는 남지 않는다. 날짜와 무관하게
          언제나 참인 이야기를 아래에 둔다(MoonPrimer 주석 참고). */}
      <MoonPrimer />

      <NextSteps
        lead={
          <>
            오늘 하늘이 당신의 어디를 건드리는지는 태어난 순간마다 다릅니다. 그
            자리들이 어디인지는 천궁도가 통째로 보여 줍니다.
          </>
        }
        primary={{ href: "/natal", label: "내 하늘 전체 보기" }}
        secondary={{ href: "/yearly", label: "올해는 어떤가" }}
      />
    </main>
  );
}
