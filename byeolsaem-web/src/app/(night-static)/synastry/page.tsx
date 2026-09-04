import type { Metadata } from "next";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { alternatesFor, ogImage } from "@/lib/metadata";
import { PlaceBand } from "@/components/place/PlaceBand";
import { NextSteps } from "@/components/nav/NextSteps";
import { SynastryPrimer } from "@/components/synastry/SynastryPrimer";
import { SynastryReading } from "@/components/synastry/SynastryReading";

export const metadata: Metadata = {
  title: "궁합 | 별샘",
  description:
    "두 사람의 출생 차트가 서로의 어디를 건드리는지 계산합니다. 궁합 점수가 아니라 두 하늘이 맺는 실제 각도이고, 상대의 정보는 저장하지 않습니다. 초대 링크를 보내면 상대는 따로 가입하지 않고, 자기 태어난 날짜와 시간만 넣어 자신의 하늘 결과를 바로 확인할 수 있습니다.",
  // /natal과 같은 이유로 noindex를 풀었다(그쪽 주석 참고). SynastryPrimer가
  // 두 사람의 정보 없이도 읽을 것을 깔아 준다.
  alternates: alternatesFor("/synastry"),
  openGraph: ogImage("/synastry", "/og/synastry.png"),
};

export default function SynastryPage() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-6 pb-32 pt-28">
      {/* 화면에 있는 문답만 스키마로 낸다(자체 원칙) — 아래 답변은 프라이머 원문이다. */}
      <JsonLd data={breadcrumbSchema([{ name: "별샘", path: "/" }, { name: "궁합", path: "/synastry" }])} />
      <JsonLd
        data={faqSchema([
          { question: "두 하늘을 겹쳐 본다는 것은 무엇인가요?",
            answer:
              "궁합(시나스트리)은 두 사람의 천궁도를 나란히 놓고, 한쪽의 별이 다른 쪽의 별과 어떤 각도를 이루는지 보는 방법입니다. 내 금성이 상대의 화성과 120도를 맺는다면, 내가 좋아하는 방식과 상대가 밀어붙이는 방식이 서로 통한다는 뜻으로 읽습니다." },
          { question: "왜 궁합 점수를 내지 않나요?",
            answer:
              "낼 수 없기 때문입니다. 두 사람이 잘 지낼지는 하늘이 정하지 않습니다. 하늘이 말해 주는 것은 두 사람이 서로의 어디를 건드리는가까지이고, 그 다음은 두 사람의 몫입니다." },
          { question: "상대의 정보는 저장되나요?",
            answer:
              "내 출생 정보는 이 브라우저에 저장되지만 상대의 것은 저장하지 않습니다. 이 화면을 떠나거나 새로고침하면 사라집니다 — 남의 생년월일을 내 브라우저에 남길 이유가 없습니다." },
        ])}
      />
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
