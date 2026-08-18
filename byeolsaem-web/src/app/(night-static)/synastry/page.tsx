import type { Metadata } from "next";
import { alternatesFor } from "@/lib/metadata";
import { PlaceBand } from "@/components/place/PlaceBand";
import { NextSteps } from "@/components/nav/NextSteps";
import { SynastryPrimer } from "@/components/synastry/SynastryPrimer";
import { SynastryReading } from "@/components/synastry/SynastryReading";

export const metadata: Metadata = {
  title: "궁합 | 별샘",
  description:
    "두 사람의 출생 차트가 서로의 어디를 건드리는지 계산합니다. 궁합 점수가 아니라 두 하늘이 맺는 실제 각도이고, 상대의 정보는 저장하지 않습니다.",
  // /natal과 같은 이유로 noindex를 풀었다(그쪽 주석 참고). SynastryPrimer가
  // 두 사람의 정보 없이도 읽을 것을 깔아 준다.
  alternates: alternatesFor("/synastry"),
};

export default function SynastryPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
      {/* 궁합의 장소: 물결이 서로 겹치는 두 개의 샘 */}
      <PlaceBand src="/world/place-synastry.webp" />
      <header className="mx-auto max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">TWO SKIES</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">궁합</h1>
        <p className="mx-auto mt-5 max-w-md break-keep leading-relaxed text-starlight-dim">
          두 사람이 태어난 순간의 하늘을 나란히 놓고, 서로의 어디를 건드리는지 봅니다.
          잘 맞는지를 점수로 매기지는 않습니다 — 그것은 하늘이 정하지 않습니다.
        </p>
      </header>

      <div className="mt-14">
        <SynastryReading />
      </div>

      {/* 두 사람의 정보가 있어야 결과가 생긴다. 그 전에도 읽을 것을 둔다
          (SynastryPrimer 주석 참고). */}
      <SynastryPrimer />

      {/* 상대의 자리로 가는 개인화된 길은 결과 안에 있다(PartnerRoom).
          여기 있는 것은 정보가 없는 사람과 크롤러를 위한 정적인 길이다. */}
      <NextSteps
        lead={
          <>
            두 하늘이 맺는 각도는 관계의 이야기입니다. 그 전에 각자의 하늘이 있고,
            내 것을 알아야 무엇이 겹치는지도 보입니다.
          </>
        }
        primary={{ href: "/natal", label: "내 하늘 먼저 보기" }}
        secondary={{ href: "/sign", label: "열두 개의 방" }}
      />
    </main>
  );
}
