import { HeroSequence } from "@/components/hero/HeroSequence";
import { TodayTeaser } from "@/components/sections/TodayTeaser";
import { ThreeDoors } from "@/components/sections/ThreeDoors";
import { ResultPreview } from "@/components/sections/ResultPreview";
import { Footer } from "@/components/sections/Footer";
import { Reveal } from "@/components/Reveal";
import { WithoutBirthProfile } from "@/components/WithoutBirthProfile";
import { NightEnd, NightPhase } from "@/components/sky/NightJourney";

// SkyBackdrop과 Veil은 layout.tsx에서 전역으로 마운트돼 있다 (relative z-10 래퍼 안에서
// 히어로가 그 위에 그려진다) — 여기서 다시 만들지 않는다.
// 아래 4개 섹션은 서로 다른 레이아웃 패밀리를 쓴다: 2열(TodayTeaser) → 중앙
// 스택(ResultPreview) → 비대칭 벤토(ThreeDoors) → 푸터 바(Footer). 섹션 배경은
// 모두 투명 또는 nebula-bg 뿐이라 SkyBackdrop이 계속 비쳐 보인다.
//
// 순서의 근거: 문을 열라고 권하기 전에 문 너머에 무엇이 있는지부터 보여준다.
// 그리고 그 안내는 아직 자기 결과를 보지 못한 사람에게만 필요하므로,
// 저장된 출생 정보가 있으면 통째로 내린다(WithoutBirthProfile 주석 참고).
// HeroSequence는 Reveal로 감싸지 않는다: LCP 보호(첫 화면 콘텐츠는 즉시 보여야
// 함) + 이미 GSAP이 자체 진입 연출을 담당하는 영역이라 CSS Reveal과 겹치면
// 이중 모션이 된다. Footer는 스크롤 맨 끝에 있어 진입 모션의 체감 효과가
// 낮고 필수 고지 문구가 지연 없이 보이는 편이 접근성상 낫다고 판단해 제외했다.
// NightPhase가 감싼 구간이 화면 중앙을 지나는 동안 배경이 그 시간대를 유지한다
// (NightJourney 참고). 초저녁 → 깊은 밤 → 자정 → 새벽 직전 → 여명.
// 결과 미리보기는 사람에 따라 빠지므로(WithoutBirthProfile) 자정 구간도 함께
// 사라진다 — 여정은 남은 구간끼리 이어져 끊기지 않는다.
export default function Home() {
  return (
    <main>
      <NightPhase index={0}>
        <HeroSequence />
      </NightPhase>
      <NightPhase index={1}>
        <Reveal>
          <TodayTeaser />
        </Reveal>
      </NightPhase>
      <WithoutBirthProfile>
        <NightPhase index={2}>
          <Reveal>
            <ResultPreview />
          </Reveal>
        </NightPhase>
      </WithoutBirthProfile>
      <NightPhase index={3}>
        <Reveal>
          <ThreeDoors />
        </Reveal>
      </NightPhase>
      <NightPhase index={4}>
        <Footer />
      </NightPhase>
      <NightEnd />
    </main>
  );
}
