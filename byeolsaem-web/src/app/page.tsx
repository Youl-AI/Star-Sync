import { HeroSequence } from "@/components/hero/HeroSequence";
import { TodayTeaser } from "@/components/sections/TodayTeaser";
import { ThreeDoors } from "@/components/sections/ThreeDoors";
import { ResultPreview } from "@/components/sections/ResultPreview";
import { Footer } from "@/components/sections/Footer";

// SkyBackdrop과 Veil은 layout.tsx에서 전역으로 마운트돼 있다 (relative z-10 래퍼 안에서
// 히어로가 그 위에 그려진다) — 여기서 다시 만들지 않는다.
// 아래 4개 섹션은 서로 다른 레이아웃 패밀리를 쓴다: 2열(TodayTeaser) → 비대칭
// 벤토(ThreeDoors) → 중앙 스택(ResultPreview) → 푸터 바(Footer). 섹션 배경은
// 모두 투명 또는 nebula-bg 뿐이라 SkyBackdrop이 계속 비쳐 보인다.
export default function Home() {
  return (
    <main>
      <HeroSequence />
      <TodayTeaser />
      <ThreeDoors />
      <ResultPreview />
      <Footer />
    </main>
  );
}
