"use client";
import { useEffect, useState } from "react";
import { HOUSE_BY_NUMBER } from "@/content/atoms/houses";
import { LineDiamond } from "@/components/ui/LineDiamond";
import type { ProfectionYear } from "@/lib/time-lords";

/** "2026-07-14" -> "2026. 7" — 사이트의 날짜 표기 관례(선행 0 없음). */
const yearMonth = (iso: string): string => {
  const [y, m] = iso.split("-");
  return `${y}. ${Number(m)}`;
};

/**
 * 올해 카드 + 12년 스트립(프리뷰 승인본). 자리·방 설명은 기존 원자를
 * 재사용한다 — 새로 쓰는 문장은 프레임 한 벌뿐이다.
 *
 * 계산 결과는 마운트 뒤에야 나타나므로 첫 등장에 짧은 상승 연출을 준다
 * (2026-08-27 모션 패스 02). 카드가 먼저 떠오르고 스트립 칸이 뒤따른다.
 * reduced-motion에서는 즉시 완성 화면.
 */
export function ProfectionSection({
  profection,
  years,
}: {
  profection: ProfectionYear;
  years: ProfectionYear[];
}) {
  const house = HOUSE_BY_NUMBER[profection.house];
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="mt-4">
      <h2 className="break-keep text-center font-display text-2xl text-starlight">올해의 자리</h2>
      <p className="mt-2 text-center font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
        ANNUAL PROFECTIONS
      </p>

      <div
        className={`mx-auto mt-10 max-w-[520px] border border-gold/50 bg-gradient-to-b from-nebula/85 to-ink px-8 py-10 text-center shadow-[0_0_44px_rgba(201,162,39,0.12)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <p className="font-latin text-eyebrow tracking-[0.3em] text-gold">
          AGE {profection.age} · {yearMonth(profection.from)} – {yearMonth(profection.to)}
        </p>
        <p className="mt-3 break-keep font-display text-3xl text-starlight">
          {profection.sign.ko}의 해
        </p>
        <p className="mt-2 text-meta text-starlight-dim">
          {house.ko} · 올해의 주인 <b className="font-medium text-gold-soft">{profection.lordKo}</b>
        </p>
        <LineDiamond className="mt-6" />
        <p className="mx-auto mt-5 max-w-[40ch] break-keep text-guide leading-relaxed text-starlight">
          {house.ko}에 불이 들어온 해입니다 — {house.domain}. 올해의 주인이{" "}
          {profection.lordKo}이므로, {profection.lordKo}이 어디를 지나는지가
          올해 트랜짓 읽기의 축이 됩니다.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-6 gap-1 md:grid-cols-12">
        {years.map((y, i) => (
          <div
            key={y.age}
            className={`border px-1 py-3 text-center leading-normal transition-[opacity,transform,border-color,background-color] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
              entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            } ${
              y.age === profection.age
                ? "border-gold bg-gold/10 shadow-[0_0_18px_rgba(201,162,39,0.18)]"
                : "border-gold/20 bg-nebula/35 hover:border-gold/45 hover:bg-nebula/60"
            }`}
            style={{
              // 카드(500ms)보다 반 박자 늦게, 30ms 간격으로 — 색 전환은 즉시.
              transitionDelay: `${180 + i * 30}ms, ${180 + i * 30}ms, 0ms, 0ms`,
              transitionDuration: "500ms, 500ms, 150ms, 150ms",
            }}
          >
            <span className="block font-latin text-[12px] tabular-nums tracking-[0.08em] text-starlight-dim">{y.age}</span>
            <span
              className={`mt-1 block text-[12.5px] ${
                y.age === profection.age ? "text-gold-soft" : "text-starlight"
              }`}
            >
              {y.sign.ko.replace("자리", "")}
            </span>
            <span className="mt-0.5 block whitespace-nowrap text-[10.5px] text-starlight-dim">{y.house}번째 방</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-meta text-starlight-dim">
        앞뒤 열두 해 — 현재 나이가 금색으로 표시됩니다
      </p>
    </section>
  );
}
