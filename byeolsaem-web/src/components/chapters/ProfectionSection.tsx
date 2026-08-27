import { HOUSE_BY_NUMBER } from "@/content/atoms/houses";
import { LineDiamond } from "@/components/ui/LineDiamond";
import type { ProfectionYear } from "@/lib/time-lords";

/**
 * 올해 카드 + 12년 스트립(프리뷰 승인본). 자리·방 설명은 기존 원자를
 * 재사용한다 — 새로 쓰는 문장은 프레임 한 벌뿐이다.
 */
export function ProfectionSection({
  profection,
  years,
}: {
  profection: ProfectionYear;
  years: ProfectionYear[];
}) {
  const house = HOUSE_BY_NUMBER[profection.house];
  return (
    <section className="mt-4">
      <h2 className="break-keep text-center font-display text-2xl text-starlight">올해의 자리</h2>
      <p className="mt-2 text-center font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
        ANNUAL PROFECTIONS
      </p>

      <div className="mx-auto mt-10 max-w-[520px] border border-gold/50 bg-gradient-to-b from-nebula/85 to-ink px-8 py-10 text-center shadow-[0_0_44px_rgba(201,162,39,0.12)]">
        <p className="font-latin text-eyebrow tracking-[0.3em] text-gold">
          AGE {profection.age} · {profection.from.slice(0, 7).replace("-", ". ")} –{" "}
          {profection.to.slice(0, 7).replace("-", ". ")}
        </p>
        <p className="mt-3 break-keep font-display text-3xl text-starlight">
          {profection.sign.ko}의 해
        </p>
        <p className="mt-2 text-meta text-starlight-dim">
          {house.ko} · 올해의 주인 <b className="font-medium text-gold-soft">{profection.lordKo}</b>
        </p>
        <LineDiamond className="mt-6" />
        <p className="mx-auto mt-5 max-w-[40ch] break-keep text-guide leading-relaxed text-starlight">
          {house.domain}의 방에 불이 들어온 해입니다. 올해의 주인이{" "}
          {profection.lordKo}이므로, {profection.lordKo}이(가) 어디를 지나는지가
          올해 트랜짓 읽기의 축이 됩니다.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-6 gap-1 md:grid-cols-12">
        {years.map((y) => (
          <div
            key={y.age}
            className={`border px-1 py-3 text-center leading-normal ${
              y.age === profection.age
                ? "border-gold bg-gold/10 shadow-[0_0_18px_rgba(201,162,39,0.18)]"
                : "border-gold/20 bg-nebula/35"
            }`}
          >
            <span className="block font-latin text-[12px] tracking-[0.08em] text-starlight-dim">{y.age}</span>
            <span
              className={`mt-1 block text-[12.5px] ${
                y.age === profection.age ? "text-gold-soft" : "text-starlight"
              }`}
            >
              {y.sign.ko.replace("자리", "")}
            </span>
            <span className="mt-0.5 block text-[10.5px] text-starlight-dim">{y.house}번째 방</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-meta text-starlight-dim">
        앞뒤 열두 해 — 현재 나이가 금색으로 표시됩니다
      </p>
    </section>
  );
}
