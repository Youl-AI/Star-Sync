import { HeroSequence } from "@/components/hero/HeroSequence";
import { TodayTeaser } from "@/components/sections/TodayTeaser";
import { ThreeDoors } from "@/components/sections/ThreeDoors";
import { ResultPreview } from "@/components/sections/ResultPreview";
import { Footer } from "@/components/sections/Footer";
import { Reveal } from "@/components/Reveal";

// SkyBackdrop과 Veil은 layout.tsx에서 전역으로 마운트돼 있다 (relative z-10 래퍼 안에서
// 히어로가 그 위에 그려진다) — 여기서 다시 만들지 않는다.
// 아래 4개 섹션은 서로 다른 레이아웃 패밀리를 쓴다: 2열(TodayTeaser) → 비대칭
// 벤토(ThreeDoors) → 중앙 스택(ResultPreview) → 푸터 바(Footer). 섹션 배경은
// 모두 투명 또는 nebula-bg 뿐이라 SkyBackdrop이 계속 비쳐 보인다.
// HeroSequence는 Reveal로 감싸지 않는다: LCP 보호(첫 화면 콘텐츠는 즉시 보여야
// 함) + 이미 GSAP이 자체 진입 연출을 담당하는 영역이라 CSS Reveal과 겹치면
// 이중 모션이 된다. Footer는 스크롤 맨 끝에 있어 진입 모션의 체감 효과가
// 낮고 필수 고지 문구가 지연 없이 보이는 편이 접근성상 낫다고 판단해 제외했다.
export default function Home() {
  return (
    <main>
      <HeroSequence />
      <Reveal>
        <TodayTeaser />
      </Reveal>
      <Reveal>
        <ThreeDoors />
      </Reveal>
      <Reveal>
        <ResultPreview />
      </Reveal>
      <Footer />
    </main>
  );
}
