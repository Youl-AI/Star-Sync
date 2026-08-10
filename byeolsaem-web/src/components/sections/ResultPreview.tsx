import { ArchCard } from "@/components/ui/ArchCard";
import { LineDiamond } from "@/components/ui/LineDiamond";
import { TalismanChip } from "@/components/ui/TalismanChip";

// 레이아웃 패밀리: 중앙 스택. 텍스트 → 구분선 → ArchCard → 부적 칩, 모두 한
// 세로줄을 따라 정렬된다. 가짜 스크린샷 대신 실제 ArchCard/TalismanChip을
// 그대로 렌더해 결과 미리보기로 삼는다.
export function ResultPreview() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-28 text-center md:py-40">
      <h2 className="break-keep font-display text-3xl md:text-4xl">이런 이야기를 받게 됩니다</h2>
      <p className="mx-auto mt-4 max-w-md break-keep leading-relaxed text-starlight-dim">
        추상적인 운세가 아니라 실제 행성 배치를 근거로 한 구체적인 해석과 상징 카드입니다.
      </p>

      <LineDiamond className="my-10" />

      <div className="flex flex-col items-center gap-8">
        <ArchCard name="봄의 불꽃" latin="ARIES SUN" tagline="시작을 두려워하지 않는 사람">
          <div
            className="mx-auto mt-4 size-16 rounded-full border border-gold/50"
            style={{
              boxShadow: `0 0 30px 4px color-mix(in srgb, var(--color-gold) 18%, transparent)`,
            }}
          />
        </ArchCard>
        <div className="flex flex-wrap justify-center gap-2.5">
          <TalismanChip symbol="☉" label="태양 양자리" />
          <TalismanChip symbol="♂" label="화성 사자자리" />
        </div>
      </div>
    </section>
  );
}
