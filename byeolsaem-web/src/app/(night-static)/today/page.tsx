import type { Metadata } from "next";
import { alternatesFor } from "@/lib/metadata";
import { PlaceBand } from "@/components/place/PlaceBand";
import { MoonPrimer } from "@/components/today/MoonPrimer";
import { TodayCard } from "@/components/today/TodayCard";

export const metadata: Metadata = {
  title: "오늘의 하늘 | 별샘",
  description:
    "오늘 밤 달의 위상과 별자리, 그리고 그 하늘이 당신의 출생 차트를 어디서 건드리는지. 무작위 운세가 아니라 실제 계산 결과입니다.",
  // 앞면(달의 위상)은 누구에게나 같으므로 색인해도 얇은 페이지가 아니다.
  // 다만 날짜가 매일 바뀌는 페이지라 정규 주소는 이 하나로 유지한다.
  alternates: alternatesFor("/today"),
};

export default function TodayPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
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
        <TodayCard />
      </div>

      {/* 카드는 브라우저가 그날 그리므로 HTML에는 남지 않는다. 날짜와 무관하게
          언제나 참인 이야기를 아래에 둔다(MoonPrimer 주석 참고). */}
      <MoonPrimer />
    </main>
  );
}
