import type { Metadata } from "next";
import { SynastryReading } from "@/components/synastry/SynastryReading";

export const metadata: Metadata = {
  title: "궁합 | 별샘",
  description:
    "두 사람의 출생 차트가 서로의 어디를 건드리는지 계산합니다. 궁합 점수가 아니라 두 하늘이 맺는 실제 각도이고, 상대의 정보는 저장하지 않습니다.",
  // 두 사람의 출생 정보가 있어야 내용이 생기는 페이지다. 검색엔진이 보는 것은
  // 안내뿐이므로 색인시키지 않는다 — 얇은 페이지가 색인되면 사이트 전체의
  // 평가가 내려간다(RENEWAL_PLAN §2.4).
  robots: { index: false, follow: true },
};

export default function SynastryPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
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
    </main>
  );
}
