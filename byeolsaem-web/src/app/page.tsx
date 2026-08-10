import { HeroSequence } from "@/components/hero/HeroSequence";

// SkyBackdrop과 Veil은 layout.tsx에서 전역으로 마운트돼 있다 (relative z-10 래퍼 안에서
// 히어로가 그 위에 그려진다) — 여기서 다시 만들지 않는다.
export default function Home() {
  return (
    <main>
      <HeroSequence />
    </main>
  );
}
