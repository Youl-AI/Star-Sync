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
 * 금성 역행 — /retrograde(수성)의 형제 페이지.
 *
 * 수성 페이지의 FAQ가 "금성·화성도 역행합니다"라고 답해 놓고 정작 그 페이지가
 * 없었다(정찰 2026-08-22 ③). 계산기는 이미 행성을 인자로 받고, 부품
 * (상태 띠·고리·표·문답)도 전부 범용이라 이 파일이 하는 일은 금성의
 * 산문을 쓰는 것뿐이다.
 *
 * 금성은 약 19개월(584일 회합 주기)마다 40일 남짓 역행한다. 수성처럼 잦지
 * 않은 대신 한 번이 길고, 관장 영역이 사랑·관계·돈이라 검색은 수성 다음으로
 * 많다. 창을 7년으로 잡는 이유 — 수성의 4년 창이면 금성은 두 번밖에 안
 * 잡혀서 일정 표가 휑해진다.
 */

const now = new Date();
const PERIODS = retrogradesOf(
  "venus",
  new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)),
  new Date(Date.UTC(now.getUTCFullYear() + 6, 0, 1)),
);

function featuredPeriod(status: ReturnType<typeof retrogradeStatus>): RetrogradePeriod {
  if (status.state === "retrograde") return status.period;
  if (status.state === "direct") return status.next;
  return PERIODS[0];
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
    title: `${year}년 금성 역행 — ${span} | 별샘`,
    description: ongoing
      ? `지금 금성이 역행 중입니다. ${span}. 사랑·관계·돈을 맡는 별이 되돌아가는 시기에 무엇을 점검하면 되는지, 날짜와 함께 정리했습니다.`
      : `${year}년 금성 역행은 ${span}입니다. 약 19개월마다 한 번, 40일 남짓 — 사랑·관계·돈을 맡는 별이 되돌아가는 시기의 뜻과 점검 목록.`,
    alternates: alternatesFor("/retrograde/venus"),
  };
}

function buildFaqs(featured: RetrogradePeriod, shadow: { start: string; end: string }) {
  const year = kstParts(featured.start).year;
  return [
    {
      question: "지금 금성 역행 중인가요?",
      answer:
        "이 페이지 상단의 띠가 지금 이 순간의 계산 결과를 보여줍니다. 역행 중이면 끝나는 날까지, 순행 중이면 다음 역행까지 며칠 남았는지가 나옵니다.",
    },
    {
      question: `${year}년 금성 역행은 언제인가요?`,
      answer: `${formatKstDate(featured.start)}부터 ${formatKstDate(featured.end)}까지입니다. 앞뒤의 그림자 기간까지 넓게 보면 ${formatKstDate(shadow.start)}부터 ${formatKstDate(shadow.end)}까지 이어집니다.`,
    },
    {
      question: "금성 역행은 얼마나 자주 오나요?",
      answer:
        "약 19개월에 한 번, 한 번에 40일 남짓입니다. 수성이 한 해 세 번 도는 것과 비교하면 드문 대신 한 번이 두 배로 깁니다. 8년이 지나면 거의 같은 자리에서 다시 시작하는 것도 금성만의 규칙입니다 — 여덟 해 동안의 다섯 역행 지점을 하늘에 이으면 오각형이 그려집니다.",
    },
    {
      question: "금성 역행 때 전 애인에게서 연락이 온다는 말이 있던데요?",
      answer:
        "금성이 사랑과 관계를 맡는 별이라, 역행이 '지난 관계를 되짚는 시기'로 읽히기 때문입니다. 연락이 오게 만드는 힘이 하늘에 있는 것은 아니고, 온다면 답하기 전에 그 관계가 끝났던 이유를 먼저 떠올려 보라는 것이 이 시기의 전통적인 독법입니다.",
    },
    {
      question: "역행 때 머리를 자르거나 시술을 받으면 안 되나요?",
      answer:
        "금지가 아니라 재검토의 시기로 읽습니다. 금성은 아름다움의 기준도 맡는 별이라, 역행 중의 큰 변화(강한 염색, 시술, 고가의 스타일 전환)는 시기가 지나고 나서 마음이 바뀌기 쉽다고 봅니다. 미루기 어렵다면, 오래 생각해 온 것만 하고 충동적인 것은 넘기는 정도면 충분합니다.",
    },
    {
      question: "수성 역행과 무엇이 다른가요?",
      answer:
        "수성은 말·계약·기기처럼 오가는 것들을 맡고, 금성은 사랑·돈·취향처럼 마음이 매기는 값을 맡습니다. 그래서 수성 역행이 '확인하라'는 시기라면 금성 역행은 '내가 정말 좋아하는 게 맞나 되물어라'는 시기에 가깝습니다.",
    },
  ];
}

export default function VenusRetrogradePage() {
  const status = retrogradeStatus(PERIODS, now);
  const featured = featuredPeriod(status);
  const loop = retrogradeLoop(featured, 14, "venus");
  const shadow = shadowPeriod(featured, "venus");
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
          { name: "금성 역행", path: "/retrograde/venus" },
        ])}
      />
      <JsonLd data={faqSchema(faqs)} />

      <PlaceBand src="/world/place-retro.webp" />
      <header className="mx-auto max-w-xl text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">
          <span className="astro-symbol">♀︎</span> VENUS RETROGRADE
        </p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          {year}년 금성 역행
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
          점 하나가 하루입니다. 금성은 수성보다 느긋하게, 그러나 더 길게 같은
          하늘을 되짚습니다.
        </p>
        <div className="mt-8">
          <RetrogradeLoop samples={loop} period={featured} subject="금성" />
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
          수성처럼 해마다 오지 않습니다 — 없는 해가 절반쯤 됩니다.
        </p>
      </section>

      <article className="mt-16 space-y-10">
        <section>
          <h2 className="mb-4 break-keep font-display text-xl text-starlight">
            금성 역행은 무엇인가
          </h2>
          <p className="max-w-[62ch] break-keep leading-relaxed text-starlight-dim">
            금성은 지구보다 안쪽 궤도를 약 225일에 한 바퀴 돕니다. 안쪽 트랙을
            더 빠르게 도는 금성이 지구를 따라잡아 추월하는 구간에서, 지구에서 본
            금성은 잠시 뒤로 가는 것처럼 보입니다. 실제로 되돌아가는 별은 없습니다
            — 두 궤도의 속도 차이가 만드는 겉보기 현상이고, 그래서 시작과 끝이
            계산으로 정확히 나옵니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 break-keep font-display text-xl text-starlight">
            무엇을 맡는 별인가
          </h2>
          <p className="max-w-[62ch] break-keep leading-relaxed text-starlight-dim">
            점성술에서 금성은 사랑과 관계, 돈과 소유, 그리고 아름답다고 느끼는
            기준을 맡습니다. 그 별이 되돌아가는 시기는 이 영역들을 새로 벌이기보다
            되짚는 때로 읽습니다 — 지금의 관계는 어떻게 시작되었는지, 이 소비는
            정말 내 취향인지, 좋아한다고 말해 온 것들이 아직도 좋은지. 약 40일,
            황경 15도 안팎을 되밟는 동안 같은 질문이 형태를 바꿔 돌아옵니다.
          </p>
        </section>

        <section>
          <h2 className="mb-4 break-keep font-display text-xl text-starlight">
            이 시기에 점검할 것
          </h2>
          <p className="max-w-[62ch] break-keep leading-relaxed text-starlight-dim">
            역행이 무언가를 망가뜨리는 것은 아닙니다. 40일마다 사랑도 소비도 멈추는
            삶은 없습니다 — 아래는 금지가 아니라, 이 시기에 한 번 더 들여다보면
            좋은 자리들입니다.
          </p>
          <ul className="mt-6 space-y-5">
            <CheckItem what="다시 연락해 오는 사람">
              끝난 관계의 연락이 유난히 이 시기에 옵니다. 답하기 전에, 그때 끝났던
              이유가 지금 달라졌는지부터.
            </CheckItem>
            <CheckItem what="큰 소비와 값비싼 취향">
              역행이 끝난 뒤에도 여전히 갖고 싶을지. 장바구니에 40일 묵혀도 되는
              것은 대개 묵혀도 됩니다.
            </CheckItem>
            <CheckItem what="외모의 큰 변화">
              오래 생각해 온 변화는 무방하고, 충동적인 것은 시기가 지나면 마음이
              바뀌기 쉬운 쪽입니다.
            </CheckItem>
            <CheckItem what="관계의 큰 결정">
              고백·이별·재회 같은 결정은 이 시기의 감정이 평소의 것인지 한 번
              걸러서. 결정 자체보다 서두름이 문제를 만듭니다.
            </CheckItem>
            <CheckItem what="돈이 오가는 약속">
              빌려주는 돈, 공동 지출, 계약금 — 금액과 조건을 문서로 남기면 시기가
              지나고 나서 서로 기억이 다른 일을 막습니다.
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
            href="/retrograde/mars"
            className="border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:text-starlight"
          >
            화성 역행도 있습니다 →
          </Link>
        </p>
      </div>
    </main>
  );
}
