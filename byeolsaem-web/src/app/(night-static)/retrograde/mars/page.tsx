import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { GoldButton } from "@/components/ui/GoldButton";
import { PlaceBand } from "@/components/place/PlaceBand";
import { CheckItem, Faq, Fact } from "@/components/retrograde/RetroPageBits";
import { RetrogradeLoop } from "@/components/retrograde/RetrogradeLoop";
import { RetrogradeStatusBand } from "@/components/retrograde/RetrogradeStatusBand";
import { alternatesFor } from "@/lib/metadata";
import {
  formatZodiacDegree,
  retrogradeLoop,
  retrogradesOf,
  shadowPeriod,
} from "@/lib/retrograde";
import {
  formatKstDate,
  kstParts,
  retrogradeStatus,
  type RetrogradePeriod,
} from "@/lib/retrograde-clock";

/**
 * 화성 역행 — 역행 페이지 셋 중 막내.
 *
 * 화성은 지구보다 바깥 궤도라 원리가 안쪽 두 행성과 다르다 — 화성이 지구를
 * 추월하는 것이 아니라 **지구가 화성을 추월한다.** 안쪽 트랙의 지구가 바깥
 * 트랙의 화성을 앞지르는 구간에서, 화성이 뒤로 밀리는 것처럼 보인다.
 *
 * 약 26개월마다 한 번, 두 달 반쯤 이어진다. 셋 중 가장 드물고 가장 길다.
 * 창을 8년으로 잡는 이유 — 26개월 주기라 4년 창이면 두 번도 안 잡힌다.
 */

const now = new Date();
const PERIODS = retrogradesOf(
  "mars",
  new Date(Date.UTC(now.getUTCFullYear() - 2, 0, 1)),
  new Date(Date.UTC(now.getUTCFullYear() + 6, 0, 1)),
);

function featuredPeriod(status: ReturnType<typeof retrogradeStatus>): RetrogradePeriod {
  if (status.state === "retrograde") return status.period;
  if (status.state === "direct") return status.next;
  return PERIODS[PERIODS.length - 1];
}

export function generateMetadata(): Metadata {
  const status = retrogradeStatus(PERIODS, now);
  const featured = featuredPeriod(status);
  const year = kstParts(featured.start).year;
  const asWords = (iso: string) => {
    const { month, day } = kstParts(iso);
    return `${month}월 ${day}일`;
  };
  const span = `${asWords(featured.start)}부터 ${asWords(featured.end)}까지`;
  const ongoing = status.state === "retrograde";
  return {
    title: `${year}년 화성 역행 — ${span} | 별샘`,
    description: ongoing
      ? `지금 화성이 역행 중입니다. ${span}. 추진력과 욕구를 맡는 별이 되돌아가는 두 달 반 동안 무엇을 점검하면 되는지, 날짜와 함께 정리했습니다.`
      : `${year}년 화성 역행은 ${span}입니다. 약 26개월마다 한 번, 두 달 반 — 추진력과 욕구를 맡는 별이 되돌아가는 시기의 뜻과 점검 목록.`,
    alternates: alternatesFor("/retrograde/mars"),
  };
}

function buildFaqs(featured: RetrogradePeriod, shadow: { start: string; end: string }) {
  const year = kstParts(featured.start).year;
  return [
    {
      question: "지금 화성 역행 중인가요?",
      answer:
        "이 페이지 상단의 띠가 지금 이 순간의 계산 결과를 보여줍니다. 역행 중이면 끝나는 날까지, 순행 중이면 다음 역행까지 며칠 남았는지가 나옵니다.",
    },
    {
      question: `${year}년 화성 역행은 언제인가요?`,
      answer: `${formatKstDate(featured.start)}부터 ${formatKstDate(featured.end)}까지입니다. 앞뒤의 그림자 기간까지 넓게 보면 ${formatKstDate(shadow.start)}부터 ${formatKstDate(shadow.end)}까지 이어집니다.`,
    },
    {
      question: "화성 역행은 얼마나 자주 오나요?",
      answer:
        "약 26개월에 한 번 — 세 역행 중 가장 드물고, 한 번에 두 달 반쯤으로 가장 깁니다. 역행이 없는 해가 더 많아서, 오는 해에는 그만큼 크게 다뤄집니다.",
    },
    {
      question: "왜 화성만 원리가 다르다고 하나요?",
      answer:
        "수성·금성은 지구보다 안쪽 궤도라 그들이 지구를 추월할 때 역행으로 보이지만, 화성은 지구보다 바깥 궤도입니다. 안쪽 트랙의 지구가 바깥 트랙의 화성을 앞지르는 구간에서 화성이 뒤로 밀리는 것처럼 보입니다. 고속도로에서 옆 차선의 느린 차를 추월할 때 그 차가 뒤로 가는 것처럼 보이는 것과 같습니다.",
    },
    {
      question: "화성 역행 때는 일을 시작하면 안 되나요?",
      answer:
        "두 달 반 동안 아무것도 시작하지 않는 삶은 없습니다. 전통적인 독법은 '새로 벌이기보다 이미 벌인 것을 끝내기 좋은 시기'입니다 — 미뤄 둔 마무리, 중단된 프로젝트의 재개는 오히려 이 시기와 결이 맞습니다.",
    },
    {
      question: "수성·금성 역행과 무엇이 다른가요?",
      answer:
        "수성이 말과 약속을, 금성이 마음이 매기는 값을 되짚는다면, 화성은 힘을 쓰는 방식을 되짚습니다. 무엇을 향해 달리고 있었는지, 그 속도가 내 것이 맞는지 — 엔진을 잠시 낮추고 정비하는 시기로 읽습니다.",
    },
  ];
}

export default function MarsRetrogradePage() {
  const status = retrogradeStatus(PERIODS, now);
  const featured = featuredPeriod(status);
  const loop = retrogradeLoop(featured, 21, "mars");
  const shadow = shadowPeriod(featured, "mars");
  const faqs = buildFaqs(featured, shadow);
  const year = kstParts(featured.start).year;

  const byYear = PERIODS.reduce<Record<number, RetrogradePeriod[]>>((acc, period) => {
    const y = kstParts(period.start).year;
    (acc[y] ??= []).push(period);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <JsonLd
        data={breadcrumbSchema([
          { name: "별샘", path: "/" },
          { name: "수성 역행", path: "/retrograde" },
          { name: "화성 역행", path: "/retrograde/mars" },
        ])}
      />
      <JsonLd data={faqSchema(faqs)} />

      <PlaceBand src="/world/place-retro.webp" />
      <header className="mx-auto max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">
          <span className="astro-symbol">♂︎</span> MARS RETROGRADE
        </p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          {year}년 화성 역행
        </h1>
        <p className="mt-3 font-display text-lg text-gold-soft">
          {formatKstDate(featured.start)} — {formatKstDate(featured.end)}
        </p>
      </header>

      <div className="mt-10">
        <RetrogradeStatusBand periods={PERIODS} initial={status} />
      </div>

      <section className="mt-16">
        <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
          이번 역행이 하늘에 그리는 길
          <span aria-hidden className="h-px flex-1 bg-gold/25" />
        </h2>
        <p className="max-w-[52ch] break-keep text-guide text-starlight-dim">
          점 하나가 하루입니다. 두 달 반의 되짚음이라 고리도 셋 중 가장 큽니다.
        </p>
        <div className="mt-8">
          <RetrogradeLoop samples={loop} period={featured} subject="화성" />
        </div>
        <dl className="mx-auto mt-10 grid max-w-md gap-3">
          <Fact label="역행 시작" value={formatKstDate(featured.start)} />
          <Fact label="역행 끝" value={formatKstDate(featured.end)} />
          <Fact label="이어지는 날" value={`${Math.round(featured.days)}일`} />
          <Fact label="되짚는 길" value={`황경 ${featured.arc.toFixed(1)}도`} />
          <Fact label="시작 지점" value={formatZodiacDegree(featured.startLongitude)} />
          <Fact label="그림자 기간" value={`${formatKstDate(shadow.start)} — ${formatKstDate(shadow.end)}`} />
        </dl>
      </section>

      <section className="mt-16">
        <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
          역행 일정
          <span aria-hidden className="h-px flex-1 bg-gold/25" />
        </h2>
        <ul className="space-y-6">
          {Object.entries(byYear).map(([y, periods]) => (
            <li key={y} className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
              <span className="font-display text-lg text-gold-soft">{y}년</span>
              <span className="break-keep text-guide text-starlight-dim">
                {periods
                  .map(
                    (period) =>
                      `${formatKstDate(period.start)} ~ ${formatKstDate(period.end)} (${Math.round(period.days)}일)`,
                  )
                  .join(" · ")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-[52ch] break-keep text-meta text-starlight-dim">
          해를 걸치는 역행은 시작한 해에 적었습니다. 없는 해가 더 많습니다.
        </p>
      </section>

      <article className="mt-16 space-y-10">
        <section>
          <h2 className="mb-4 break-keep font-display text-xl text-starlight">
            화성 역행은 무엇인가
          </h2>
          <p className="max-w-[62ch] break-keep leading-relaxed text-starlight-dim">
            수성·금성과는 원리가 다릅니다. 그 둘은 지구보다 안쪽에서 빠르게 돌며
            지구를 추월하지만, 화성은 지구보다 바깥 궤도를 약 687일에 돕니다.
            안쪽 트랙의 지구가 바깥 트랙의 화성을 앞지르는 구간 — 그때 지구에서
            본 화성이 뒤로 밀리는 것처럼 보입니다. 어느 쪽이든 실제로 되돌아가는
            별은 없고, 시작과 끝은 계산으로 정확히 나옵니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 break-keep font-display text-xl text-starlight">
            무엇을 맡는 별인가
          </h2>
          <p className="max-w-[62ch] break-keep leading-relaxed text-starlight-dim">
            점성술에서 화성은 원하는 것을 향해 몸을 움직이는 힘 — 추진력, 경쟁,
            욕구, 그리고 화를 맡습니다. 그 별이 되돌아가는 두 달 반은 액셀에서
            발을 떼고 엔진을 정비하는 시기로 읽습니다. 새로 벌이는 일에는 힘이
            평소처럼 실리지 않는 대신, 멈춰 있던 일을 끝내는 데는 오히려 결이
            맞습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 break-keep font-display text-xl text-starlight">
            이 시기에 점검할 것
          </h2>
          <p className="max-w-[62ch] break-keep leading-relaxed text-starlight-dim">
            금지 목록이 아닙니다. 두 달 반 동안 시동을 끄고 사는 사람은 없습니다 —
            힘이 새는 자리를 한 번 더 보라는 목록입니다.
          </p>
          <ul className="mt-6 space-y-5">
            <CheckItem what="새로 벌이는 큰 일">
              시작하지 말라가 아니라, 시작 전의 계획을 평소보다 한 번 더. 이 시기의
              추진력은 출발보다 정비에 맞는 결입니다.
            </CheckItem>
            <CheckItem what="미뤄 둔 마무리">
              중단된 프로젝트, 끝내지 못한 정리 — 역행과 결이 맞는 유일한 가속
              구간입니다. 되짚는 시기에는 되짚는 일이 잘 됩니다.
            </CheckItem>
            <CheckItem what="화가 나는 순간">
              평소보다 도화선이 짧아진다고 읽는 시기입니다. 보내기 전의 화난 메시지
              하루 묵히기 — 수성 역행의 규칙이 여기서도 통합니다.
            </CheckItem>
            <CheckItem what="몸을 쓰는 일">
              무리한 기록 경신이나 새 운동의 급한 강도 올리기보다, 자세를 다듬는
              시기로. 부상은 대개 서두름에서 옵니다.
            </CheckItem>
            <CheckItem what="경쟁과 담판">
              연봉 협상, 담판, 승부수처럼 밀어붙여야 하는 일은 급하지 않다면 시기
              뒤로. 급하다면 밀어붙이는 대신 준비로 이기는 쪽으로.
            </CheckItem>
          </ul>
        </section>

        <section>
          <h2 className="mb-6 break-keep font-display text-xl text-starlight">자주 묻는 것</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Faq key={faq.question} question={faq.question}>
                <p className="max-w-[58ch] break-keep leading-relaxed">{faq.answer}</p>
              </Faq>
            ))}
          </div>
        </section>
      </article>

      <div className="mt-20 border-t border-gold/15 pt-12 text-center">
        <p className="mx-auto max-w-md break-keep leading-relaxed text-starlight-dim">
          이 역행이 당신의 하늘에서는 어느 방을 지나는지 — 태어난 순간을 넣으면
          바로 나옵니다.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <GoldButton variant="solid" href="/natal">
            내 천궁도 보기
          </GoldButton>
          <GoldButton variant="outline" href="/retrograde">
            수성 역행 보기
          </GoldButton>
        </div>
        <p className="mt-6 text-meta text-starlight-dim">
          <Link
            href="/retrograde/venus"
            className="border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:text-starlight"
          >
            금성 역행도 있습니다 →
          </Link>
        </p>
      </div>
    </main>
  );
}
