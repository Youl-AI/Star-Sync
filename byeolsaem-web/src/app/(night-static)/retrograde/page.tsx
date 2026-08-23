import type { Metadata } from "next";
import Link from "next/link";
import { PlaceBand } from "@/components/place/PlaceBand";
import { JsonLd, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import { RetrogradeLoop } from "@/components/retrograde/RetrogradeLoop";
import { CheckItem, Faq, Fact } from "@/components/retrograde/RetroPageBits";
import { RetroRails, RetroTabs } from "@/components/retrograde/RetroSwitcher";
import { RetrogradeStatusBand } from "@/components/retrograde/RetrogradeStatusBand";
import { GoldButton } from "@/components/ui/GoldButton";
import { LineDiamond } from "@/components/ui/LineDiamond";
import { alternatesFor, ogImage } from "@/lib/metadata";
import {
  formatZodiacDegree,
  mercuryRetrogrades,
  retrogradeLoop,
  shadowPeriod,
} from "@/lib/retrograde";
import {
  formatKstDate,
  formatKstDateTime,
  formatKstMonthDay,
  kstParts,
  retrogradeStatus,
} from "@/lib/retrograde-clock";

/**
 * 제목과 설명이 날짜를 품는다.
 *
 * 사람들이 실제로 치는 말은 "수성역행"이 아니라 "2026 수성역행", "수성역행
 * 언제", "수성역행 끝나는 날"이다. 날짜는 이 페이지 안에 다 있었지만 제목에는
 * 없어서, 정작 그 검색어에는 걸리지 않았다.
 *
 * 빌드 시점에 계산된다 — 정적 내보내기라 배포할 때마다 그 시점의 다음 역행으로
 * 갱신된다.
 */
export function generateMetadata(): Metadata {
  const status = retrogradeStatus(PERIODS, now);
  const featured = featuredPeriod(status);
  const year = kstParts(featured.start).year;
  // 일정표의 "10. 24 — 11. 14"는 범위 표기라 그대로 좋지만, 문장 안에서는
  // "10. 24부터"가 읽히지 않는다. 여기서만 말하는 형태로 적는다.
  const asWords = (iso: string) => {
    const { month, day } = kstParts(iso);
    return `${month}월 ${day}일`;
  };
  const span = `${asWords(featured.start)}부터 ${asWords(featured.end)}까지`;
  const ongoing = status.state === "retrograde";

  return {
    title: `${year}년 수성 역행 — ${span} | 별샘`,
    description: ongoing
      ? `지금 수성 역행 중입니다. ${year}년 ${span} 이어지며, ${formatKstDate(featured.end)}에 끝납니다. 날짜는 궤도 계산으로 직접 구했고, 무엇을 한 번 더 확인하면 되는지도 함께 적었습니다.`
      : `${year}년 수성 역행은 ${span}입니다. 날짜를 어디서 가져오지 않고 궤도 계산으로 직접 구했습니다. 그림자 기간, 되짚는 각도, 무엇을 한 번 더 확인하면 되는지까지.`,
    alternates: alternatesFor("/retrograde"),
    openGraph: ogImage("/retrograde", "/og/retrograde.png"),
  };
}

/**
 * 빌드 시점에 앞뒤로 넉넉히 계산해 둔다.
 *
 * 작년부터 시작하는 이유는 "방금 끝난 역행"이 아직 사람들의 관심사이기 때문이고,
 * 3년 뒤까지 미리 구하는 이유는 이 페이지가 한동안 다시 빌드되지 않아도 표가
 * 비지 않게 하기 위해서다. 계산은 4년치를 훑어도 수십 밀리초다.
 */
/**
 * 자주 묻는 것.
 *
 * 화면과 구조화 데이터가 이 한 배열에서 함께 나온다. 스키마에만 있고 화면에는
 * 없는 문답은 구글 정책 위반이라 리치 결과가 통째로 막힌다 — 두 곳에 따로
 * 적어 두면 언젠가 반드시 어긋난다(JsonLd 주석 참고).
 */
function buildFaqs(
  featured: (typeof PERIODS)[number],
  shadow: { start: string; end: string },
) {
  const year = kstParts(featured.start).year;
  return [
    {
      question: "지금 수성 역행 중인가요?",
      answer: `${year}년의 이번 역행은 ${formatKstDate(featured.start)}에 시작해 ${formatKstDate(featured.end)}에 끝납니다. 이 페이지 위쪽 띠가 지금 이 순간이 그 안에 드는지 알려 줍니다. 날짜는 매번 조금씩 다르므로 외워 두기보다 그때 확인하는 편이 낫습니다.`,
    },
    {
      question: "이번 수성 역행은 언제 끝나나요?",
      answer: `${formatKstDateTime(featured.end)}입니다(한국 시간). 이 순간을 유(留)라고 부르며, 수성이 멈춰 선 것처럼 보이다가 다시 앞으로 가기 시작하는 때입니다. 다만 여운은 그림자 기간이 끝나는 ${formatKstDate(shadow.end)}까지로 봅니다.`,
    },
    {
      question: "그림자 기간이 무엇인가요?",
      answer: `수성이 역행으로 되짚어 갈 구간을 순행으로 먼저 지나는 앞 구간과, 역행이 끝난 뒤 같은 구간을 다시 지나는 뒤 구간입니다. 이번에는 ${formatKstDate(shadow.start)}부터 ${formatKstDate(shadow.end)}까지입니다. 같은 하늘을 세 번 지나는 셈이라, 역행 직전에 걸린 일이 역행 중에 뒤집히고 역행이 끝난 뒤에야 결론이 나는 일이 잦습니다.`,
    },
    {
      question: "역행 기간에 계약이나 이사를 하면 안 되나요?",
      answer:
        "안 되는 것은 없습니다. 다만 이 시기에는 조건을 잘못 이해한 채로 서명하는 일이 눈에 띄게 늘어난다고 봅니다. 날짜를 미룰 수 있으면 미루고, 미룰 수 없으면 조항을 한 번 더 읽으면 됩니다.",
    },
    {
      question: "역행 때 연락이 끊겼던 사람에게서 연락이 오는 이유가 있나요?",
      answer:
        "점성술에서 역행은 다시(re-) 하는 일과 묶입니다. 되돌아보고 다시 닿는 쪽으로 마음이 기우는 시기라, 옛 인연이 다시 닿는 일이 실제로 잦게 느껴집니다. 다만 그것은 돌아와야 할 이유가 생겼다는 신호가 아니라 시기의 성질입니다. 돌아온 사실보다 그 사이에 무엇이 달라졌는지를 보는 편이 낫습니다.",
    },
    {
      question: "수성 역행은 모두에게 똑같이 영향을 주나요?",
      answer:
        "아니요. 역행이 일어나는 하늘의 자리가 개인 차트의 어느 영역을 지나는지에 따라 다릅니다. 같은 역행이라도 누군가에게는 일의 영역이고 누군가에게는 관계의 영역입니다.",
    },
    {
      question: "여기 날짜는 어디서 가져온 건가요?",
      answer:
        "가져오지 않았습니다. 수성과 지구의 궤도 요소에서 위치를 직접 계산하고, 겉보기 황경의 변화율이 0이 되는 순간을 찾아 유 시각을 구했습니다. 빛이 오는 데 걸리는 시간과 세차운동까지 넣었습니다.",
    },
    {
      question: "다른 행성도 역행하나요?",
      answer:
        "합니다. 금성·화성·목성·토성 모두 역행하고, 바깥쪽 행성일수록 역행 기간이 깁니다. 수성이 유독 자주 화제가 되는 것은 주기가 짧아 자주 돌아오고, 맡은 영역이 일상과 가깝기 때문입니다. 금성과 화성의 역행은 각자의 페이지에서 날짜까지 볼 수 있습니다.",
    },
  ];
}

const now = new Date();
const PERIODS = mercuryRetrogrades(
  new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)),
  new Date(Date.UTC(now.getUTCFullYear() + 3, 0, 1)),
);

/** 화면 맨 위에 그릴 구간 — 지금 진행 중이거나, 다음에 올 것. */
function featuredPeriod(status: ReturnType<typeof retrogradeStatus>) {
  if (status.state === "retrograde") return status.period;
  if (status.state === "direct") return status.next;
  return PERIODS[0];
}

export default function RetrogradePage() {
  const status = retrogradeStatus(PERIODS, now);
  const featured = featuredPeriod(status);
  const loop = retrogradeLoop(featured);
  const shadow = shadowPeriod(featured);
  const faqs = buildFaqs(featured, shadow);

  const byYear = PERIODS.reduce<Record<number, typeof PERIODS>>((acc, period) => {
    const year = kstParts(period.start).year;
    (acc[year] ??= []).push(period);
    return acc;
  }, {});
  // 일정표에서 "다음"을 달아 줄 구간 — 아직 시작하지 않은 것 중 가장 이른 것.
  const upcoming = PERIODS.find((period) => Date.parse(period.start) > now.getTime());

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <RetroRails current="mercury" />
      {/* 화면의 문답과 같은 배열에서 나온다(FAQS 주석 참고). */}
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "별샘", path: "/" },
          { name: "수성 역행", path: "/retrograde" },
        ])}
      />
      {/* 역행의 장소: 밤하늘에 고리를 그리며 되돌아가는 금빛 별 */}
      <PlaceBand src="/world/place-retro.webp" />
      <header className="text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">☿︎ MERCURY RETROGRADE</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          {kstParts(featured.start).year}년 수성 역행
        </h1>
        {/* 날짜를 제목 바로 아래 큰 글씨로. 이 페이지에 오는 사람의 첫 물음이
            거의 언제나 "언제부터 언제까지"다. */}
        <p className="mt-4 break-keep font-display text-lg text-gold-soft md:text-xl">
          {formatKstDate(featured.start)} — {formatKstDate(featured.end)}
        </p>
        <RetroTabs current="mercury" />
      </header>

      <div className="mt-14">
        <RetrogradeStatusBand periods={PERIODS} initial={status} />
      </div>

      <LineDiamond className="my-16" />

      <section>
        <h2 className="text-center break-keep font-display text-xl text-starlight">
          이번 역행이 하늘에 그리는 길
        </h2>
        <p className="mx-auto mt-4 max-w-md break-keep text-center text-sm leading-relaxed text-starlight-dim">
          {formatKstDate(featured.start)}부터 {formatKstDate(featured.end)}까지, 수성은{" "}
          {formatZodiacDegree(featured.startLongitude)}에서 멈춰{" "}
          {formatZodiacDegree(featured.endLongitude)}까지 {featured.arc.toFixed(1)}도를 되짚어
          갑니다.
        </p>

        <div className="mt-10">
          <RetrogradeLoop samples={loop} period={featured} />
        </div>

        <dl className="mx-auto mt-12 grid max-w-lg grid-cols-1 gap-x-10 gap-y-5 text-sm sm:grid-cols-2">
          <Fact label="역행 시작 (유)" value={formatKstDateTime(featured.start)} />
          <Fact label="역행 종료 (유)" value={formatKstDateTime(featured.end)} />
          <Fact label="기간" value={`${Math.round(featured.days)}일`} />
          <Fact label="되짚는 각도" value={`${featured.arc.toFixed(1)}도`} />
          <Fact label="그림자 기간 시작" value={formatKstDate(shadow.start)} />
          <Fact label="그림자 기간 종료" value={formatKstDate(shadow.end)} />
        </dl>
        <p className="mx-auto mt-6 max-w-lg break-keep text-center text-guide text-starlight">
          시각은 한국 시간(UTC+9) 기준입니다. 그림자 기간은 수성이 같은 도수를
          순행으로 먼저 지나고, 되돌아온 뒤 한 번 더 지나는 앞뒤 구간입니다.
        </p>
      </section>

      <LineDiamond className="my-16" />

      <section>
        <h2 className="text-center break-keep font-display text-xl text-starlight">역행 일정</h2>
        <div className="mx-auto mt-8 max-w-lg">
          {Object.entries(byYear).map(([year, periods]) => (
            <div key={year} className="mt-9 first:mt-0">
              <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">{year}</p>
              <ul className="mt-3 divide-y divide-gold/10">
                {periods.map((period) => {
                  // 이미 지나간 구간은 지우지 않고 흐리게 둔다. "방금 끝난 역행"을
                  // 확인하러 오는 사람이 적지 않다. 진행 중이거나 다음에 올 구간은
                  // 날짜 왼쪽에 작은 글자로 조용히 표시한다 — 목록에서 시선이
                  // 앉을 자리를 하나 정해 주는 것(가시성 점검, 2026-08-14).
                  const past = Date.parse(period.end) < now.getTime();
                  const ongoing =
                    Date.parse(period.start) <= now.getTime() &&
                    now.getTime() <= Date.parse(period.end);
                  const isNext = period === upcoming;
                  return (
                    <li
                      key={period.start}
                      className={`relative flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 ${
                        past ? "opacity-45" : ""
                      }`}
                    >
                      <span className="text-starlight">
                        {/* 넓은 화면에서는 본문 기둥 바깥 왼쪽에 매달아 날짜 정렬을
                            지킨다(li가 relative). 모바일은 바깥 여백이 24px뿐이라
                            잘리므로 날짜 앞 인라인으로 남는다. */}
                        {(ongoing || isNext) && (
                          <span className="mr-2.5 font-latin text-eyebrow tracking-[0.22em] text-gold-soft md:absolute md:right-full md:top-1/2 md:mr-0 md:-translate-y-1/2 md:whitespace-nowrap md:pr-5">
                            {ongoing ? "지금" : "다음"}
                          </span>
                        )}
                        {formatKstMonthDay(period.start)} — {formatKstMonthDay(period.end)}
                      </span>
                      <span className="text-meta text-starlight-dim">
                        {formatZodiacDegree(period.startLongitude)} →{" "}
                        {formatZodiacDegree(period.endLongitude)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <LineDiamond className="my-16" />

      <article className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
        <h2 className="break-keep font-display text-xl text-starlight">수성 역행이란</h2>
        <p className="mt-5">
          수성이 실제로 뒤로 가는 일은 없습니다. 역행은 지구에서 볼 때 수성이 별을
          배경으로 잠시 뒤로 물러나는 것처럼 보이는 현상이고, 원인은 두 행성의
          공전 속도 차이입니다. 수성은 88일에 태양을 한 바퀴 돌고 지구는 365일이
          걸립니다. 안쪽 트랙을 빠르게 달리던 차가 바깥쪽 차를 따라잡아 지나칠 때,
          바깥쪽에서 보면 그 차가 잠깐 뒤로 밀리는 것처럼 보이는 것과 같습니다.
        </p>
        <p className="mt-4">
          그래서 역행은 계산으로 정확히 정해집니다. 지구에서 본 수성의 황경이
          줄어들기 시작하는 순간이 역행의 시작이고, 다시 늘어나기 시작하는 순간이
          끝입니다. 이 두 지점을 유(留, station)라고 부릅니다 — 수성이 멈춰 선
          것처럼 보이는 때입니다.
        </p>

        <h2 className="mt-12 break-keep font-display text-xl text-starlight">
          얼마나 자주, 얼마나 오래
        </h2>
        <p className="mt-5">
          한 해에 세 번, 드물게 네 번입니다. 한 번에 3주 남짓 이어지고, 역행과
          역행 사이는 약 116일입니다. 위의 일정표는 이 주기를 가정해서 적은 것이
          아니라 매 순간의 위치를 계산해 얻은 결과이므로, 해마다 며칠씩 어긋나는
          실제 간격이 그대로 들어 있습니다.
        </p>
        <p className="mt-4">
          되짚어 가는 각도는 대체로 9도에서 16도 사이입니다. 이 값이 클수록 역행
          기간은 오히려 짧습니다. 수성이 지구에 가까이 있을 때 겉보기 움직임이
          빨라지기 때문입니다.
        </p>

        <h2 className="mt-12 break-keep font-display text-xl text-starlight">
          이 기간에 조심하라고들 하는 것
        </h2>
        <p className="mt-5">
          수성은 전령의 신 헤르메스의 이름을 가진 별이고, 점성술에서 의사소통·
          이동·계약·기록·전자기기를 맡습니다. 그래서 역행기에는 이 영역에서
          어긋남이 생긴다고 봅니다. 보낸 메일이 엉뚱하게 읽히고, 약속 시간이
          잘못 전달되고, 미뤄 뒀던 문제가 하필 지금 터지는 식입니다.
        </p>
        <p className="mt-4">
          다만 이것은 금지 목록이 아닙니다. 3주마다 계약을 못 하고 기기를 못 사는
          삶은 없습니다. 이 기간에 실제로 쓸모 있는 태도는 하나입니다 —{" "}
          <strong className="text-gold-soft">한 번 더 확인하는 것</strong>.
        </p>
        {/* 산문만 두면 "그래서 뭘 조심하라는 건데"가 남는다. 이 페이지에 오는
            사람이 가장 많이 찾는 것이 정확히 그 목록이라, 훑을 수 있게 끊어
            둔다. 금지가 아니라 확인 항목이라는 것이 각 줄의 형식에도 드러난다. */}
        <ul className="mt-6 space-y-4">
          <CheckItem what="계약과 서명">
            조항을 한 번 더 읽습니다. 미룰 수 있으면 유(留)가 지난 뒤로 미루고,
            미룰 수 없으면 읽고 서명합니다. 못 할 일은 아닙니다.
          </CheckItem>
          <CheckItem what="중고 거래와 큰 지출">
            상태와 조건을 직접 확인합니다. 특히 사진과 설명만 보고 정하는 거래에서
            어긋남이 잦습니다.
          </CheckItem>
          <CheckItem what="전자기기와 파일">
            사기 전에 보증 조건을, 쓰기 전에 백업을 봅니다. 미뤄 둔 고장이 하필
            이 시기에 드러나는 일이 많습니다.
          </CheckItem>
          <CheckItem what="약속과 일정">
            시간과 장소를 글로 남깁니다. 말로만 정한 약속이 서로 다르게 기억되는
            것이 이 기간의 전형입니다.
          </CheckItem>
          <CheckItem what="보내기 전의 글">
            메일과 메시지를 보내기 전에 다시 읽습니다. 쓴 사람의 뜻과 읽는 사람의
            해석이 벌어지는 것이 수성이 맡은 영역의 어긋남입니다.
          </CheckItem>
          <CheckItem what="다시 연락해 오는 사람">
            역행기에 옛 인연이 다시 닿는 일이 잦습니다. 이것은 신호가 아니라
            시기의 성질입니다 — 돌아온 사실보다 무엇이 달라졌는지를 봅니다.
          </CheckItem>
        </ul>

        <h2 className="mt-12 break-keep font-display text-xl text-starlight">
          되돌아가는 시기의 쓸모
        </h2>
        <p className="mt-5">
          역행은 앞으로 나아가는 일에는 불리하지만 되돌아가는 일에는 좋습니다.
          다시(re-) 하는 것들이 여기에 해당합니다. 멈춘 원고를 다시 고치고,
          연락이 끊겼던 사람에게 다시 닿고, 미뤄 둔 자리를 다시 정리하고, 결정을
          다시 검토하는 일입니다.
        </p>
        <p className="mt-4">
          그림자 기간을 함께 보면 이 시기의 모양이 더 분명해집니다. 수성은 같은
          하늘을 세 번 지납니다 — 한 번은 스쳐 가고, 한 번은 되짚어 오고, 마지막에
          다시 지나며 매듭을 짓습니다. 역행 직전에 걸린 일이 역행 중에 뒤집히고
          역행이 끝난 뒤에야 결론이 나는 일이 잦은 것은 이 구조 때문입니다.
        </p>

        <h2 className="mt-12 break-keep font-display text-xl text-starlight">자주 묻는 것</h2>
        <div className="mt-5 space-y-4">
          {faqs.map((faq) => (
            <Faq key={faq.question} question={faq.question}>
              {faq.answer}
            </Faq>
          ))}
        </div>
      </article>

      <div className="mt-20 border-t border-gold/15 pt-12 text-center">
        <p className="break-keep leading-relaxed text-starlight-dim">
          이 역행이 당신의 하늘에서는 어느 자리를 지나는지, 태어난 순간의 배치와
          겹쳐 보면 알 수 있습니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <GoldButton variant="solid" href="/">
            내 하늘에서 보기
          </GoldButton>
          <GoldButton variant="outline" href="/calendar">
            하늘의 달력 보기
          </GoldButton>
        </div>
        <p className="mt-10 text-meta text-starlight-dim">
          수성이 맡은 영역을 더 읽고 싶다면{" "}
          <Link
            href="/blog/수성역행-생존-가이드"
            className="border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:text-starlight"
          >
            수성 역행 생존 가이드
          </Link>
          를 보세요.
        </p>
      </div>
    </main>
  );
}


