import { ArchCard } from "@/components/ui/ArchCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { TodayDate } from "./TodayDate";

// 레이아웃 패밀리: 2열 (텍스트 + ArchCard). 히어로 CTA("나의 밤하늘 보기")와
// 겹치지 않도록 이 섹션의 CTA는 /today로 향하는 별도 의도(오늘의 카드)를 갖는다.
export function TodayTeaser() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-28 md:py-40">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_auto]">
        <div>
          {/* 섹션 전체에서 유일하게 허용된 아이브로: 오늘 날짜가 그 역할을 겸한다 */}
          <TodayDate />
          <h2 className="mt-3 break-keep font-display text-3xl md:text-4xl">오늘 밤, 하늘은 이렇게 흐릅니다</h2>
          <p className="mt-4 max-w-md break-keep leading-relaxed text-starlight-dim">
            무작위 카드가 아니라 실제 오늘의 하늘. 달의 위상과 행성의 각도가 매일 새로운 카드를 만듭니다.
          </p>
          <div className="mt-8">
            <GoldButton variant="outline" href="/today">
              오늘의 카드 열기
            </GoldButton>
          </div>
        </div>
        <ArchCard name="하현달" latin="MOON IN SCORPIO" tagline="깊이 파고드는 날" width={190}>
          <div
            className="mx-auto mt-4 size-14 rounded-full border border-gold/60"
            style={{
              boxShadow: `inset 14px 0 12px -8px color-mix(in srgb, var(--color-gold) 35%, transparent)`,
            }}
          />
        </ArchCard>
      </div>
    </section>
  );
}
