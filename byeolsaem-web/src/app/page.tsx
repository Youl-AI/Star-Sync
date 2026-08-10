import { Wordmark } from "@/components/brand/Wordmark";
import { ArchCard } from "@/components/ui/ArchCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { LineDiamond } from "@/components/ui/LineDiamond";
import { TalismanChip } from "@/components/ui/TalismanChip";

export default function Home() {
  return (
    <main className="nebula-bg min-h-[100dvh] p-10">
      <h1 className="font-display text-4xl text-starlight">별샘</h1>
      <p className="mt-2 text-starlight-dim">밤의 의식, 낮의 기록</p>
      <span className="mt-4 inline-block rounded-full border border-gold/50 px-4 py-2 text-sm text-gold-soft">
        <span className="astro-symbol">{"♂︎"}</span> 화성 <span className="astro-symbol">{"☌︎"}</span> 태양 · 2.1°
      </span>

      <section className="mt-16 space-y-16">
        <div>
          <h2 className="font-display text-lg text-starlight-dim">Wordmark</h2>
          <div className="mt-4 flex flex-wrap items-end gap-16">
            <div>
              <p className="mb-2 text-xs text-starlight-dim">nav</p>
              <Wordmark size="nav" />
            </div>
            <div>
              <p className="mb-2 text-xs text-starlight-dim">hero</p>
              <Wordmark size="hero" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-starlight-dim">GoldButton</h2>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <GoldButton variant="solid">시작하기</GoldButton>
            <GoldButton variant="outline">더 알아보기</GoldButton>
            <GoldButton variant="solid" href="/somewhere">
              링크 버튼
            </GoldButton>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-starlight-dim">LineDiamond</h2>
          <div className="mt-4 w-64">
            <LineDiamond />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-starlight-dim">TalismanChip</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <TalismanChip symbol="♂" label="화성 ☌ 태양 · 2.1°" theme="night" />
            <TalismanChip symbol="♀" label="금성 △ 달 · 4.6°" theme="dawn" />
            <TalismanChip symbol="☿" label="수성 □ 목성 · 1.3°" theme="night" />
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg text-starlight-dim">ArchCard</h2>
          <div className="mt-4 flex flex-wrap items-end gap-8">
            <ArchCard name="사자자리" latin="LEO · 7.23 - 8.22" tagline="태양이 스스로를 비추는 방" />
            <ArchCard
              name="전갈자리"
              latin="SCORPIO · 10.23 - 11.22"
              tagline="깊은 물속에 잠긴 진실"
              width={260}
            />
            <ArchCard name="물고기자리" latin="PISCES · 2.19 - 3.20" tagline="두 세계를 잇는 꿈" width={180} />
          </div>
        </div>
      </section>
    </main>
  );
}
