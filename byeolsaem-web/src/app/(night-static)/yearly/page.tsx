import type { Metadata } from "next";
import { PlaceBand } from "@/components/place/PlaceBand";
import { NextSteps } from "@/components/nav/NextSteps";
import { YearScope } from "@/components/yearly/YearScope";
import { getFortuneYear } from "@/lib/date";
import { alternatesFor } from "@/lib/metadata";
import { yearBackdrop } from "@/lib/yearly-reading";

/**
 * 한 해의 하늘.
 *
 * 목성과 토성의 자리, 수성 역행 날짜는 빌드할 때 계산해 HTML에 박는다. 이 부분은
 * 출생 정보가 없어도 성립하고 검색으로 들어오는 사람이 실제로 찾는 내용이라,
 * 자바스크립트가 돌기 전에 이미 거기 있어야 한다.
 *
 * 두 해를 만든다. 11월부터는 다음 해를 먼저 보여 주는 규칙(getFortuneYear)이 이
 * 사이트 전체에 있고, 신년 무렵의 검색은 다음 해로 몰린다.
 */
const YEARS = [getFortuneYear(new Date()), getFortuneYear(new Date()) + 1];
const BACKDROPS = YEARS.map(yearBackdrop);

export const metadata: Metadata = {
  title: `${YEARS[0]}·${YEARS[1]}년 하늘의 흐름 | 별샘`,
  description:
    `${YEARS[0]}년과 ${YEARS[1]}년 목성과 토성이 머무는 자리, 수성 역행 날짜, ` +
    "그리고 그 별들이 당신의 출생 차트와 정확히 각도를 맺는 날짜까지. 운세가 아니라 계산 결과입니다.",
  alternates: alternatesFor("/yearly"),
};

export default function YearlyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
      {/* 한 해의 장소: 별을 싣고 흐르는 밤의 강 — YearFlow의 강 은유가 여기서 시작된다 */}
      <PlaceBand src="/world/place-yearly.webp" />
      <header className="mx-auto max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">THE YEAR AHEAD</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          한 해의 하늘
        </h1>
        <p className="mx-auto mt-5 max-w-md break-keep leading-relaxed text-starlight-dim">
          느린 별들이 한 해 동안 어디에 머무는지, 그리고 당신의 자리와 언제 정확히 각도를
          맺는지. 뽑는 것이 아니라 구하는 것이라 날짜가 나옵니다.
        </p>
      </header>

      <div className="mt-14">
        <YearScope backdrops={BACKDROPS} />
      </div>

      <NextSteps
        lead={
          <>
            한 해는 넓게 보는 눈금입니다. 그 날짜들이 오늘 어디까지 와 있는지는
            오늘의 하늘이 짧게 잘라 보여 줍니다.
          </>
        }
        primary={{ href: "/today", label: "그래서 오늘은" }}
        secondary={{ href: "/natal", label: "이 날짜들이 걸리는 자리" }}
      />
    </main>
  );
}
