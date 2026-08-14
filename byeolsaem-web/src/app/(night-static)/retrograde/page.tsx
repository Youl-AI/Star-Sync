import type { Metadata } from "next";
import Link from "next/link";
import { PlaceBand } from "@/components/place/PlaceBand";
import { RetrogradeLoop } from "@/components/retrograde/RetrogradeLoop";
import { RetrogradeStatusBand } from "@/components/retrograde/RetrogradeStatusBand";
import { GoldButton } from "@/components/ui/GoldButton";
import { LineDiamond } from "@/components/ui/LineDiamond";
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

export const metadata: Metadata = {
  title: "수성 역행 — 지금 역행 중인가요? | 별샘",
  description:
    "수성 역행 기간을 궤도 계산으로 직접 구했습니다. 지금이 역행 중인지, 다음 역행이 언제인지, 그리고 수성이 하늘에 그리는 실제 역행 고리까지.",
};

/**
 * 빌드 시점에 앞뒤로 넉넉히 계산해 둔다.
 *
 * 작년부터 시작하는 이유는 "방금 끝난 역행"이 아직 사람들의 관심사이기 때문이고,
 * 3년 뒤까지 미리 구하는 이유는 이 페이지가 한동안 다시 빌드되지 않아도 표가
 * 비지 않게 하기 위해서다. 계산은 4년치를 훑어도 수십 밀리초다.
 */
const now = new Date();
const PERIODS = mercuryRetrogrades(
  new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1)),
  new Date(Date.UTC(now.getUTCFullYear() + 3, 0, 1)),
);

export default function RetrogradePage() {
  const status = retrogradeStatus(PERIODS, now);
  // 화면 맨 위에 그릴 고리는 지금 진행 중이거나 다음에 올 구간이다.
  const featured =
    status.state === "retrograde" ? status.period : status.state === "direct" ? status.next : PERIODS[0];
  const loop = retrogradeLoop(featured);
  const shadow = shadowPeriod(featured);

  const byYear = PERIODS.reduce<Record<number, typeof PERIODS>>((acc, period) => {
    const year = kstParts(period.start).year;
    (acc[year] ??= []).push(period);
    return acc;
  }, {});
  // 일정표에서 "다음"을 달아 줄 구간 — 아직 시작하지 않은 것 중 가장 이른 것.
  const upcoming = PERIODS.find((period) => Date.parse(period.start) > now.getTime());

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      {/* 역행의 장소: 밤하늘에 고리를 그리며 되돌아가는 금빛 별 */}
      <PlaceBand src="/world/place-retro.webp" />
      <header className="text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">☿︎ MERCURY RETROGRADE</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          수성 역행
        </h1>
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
          <strong className="text-gold-soft">한 번 더 확인하는 것</strong>. 보내기
          전에 다시 읽고, 서명 전에 조항을 되짚고, 중요한 파일은 미리 복사해
          두는 정도면 충분합니다.
        </p>

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
          <Faq question="역행 기간에 계약이나 이사를 하면 안 되나요?">
            안 되는 것은 없습니다. 다만 이 시기에는 조건을 잘못 이해한 채로 서명하는
            일이 눈에 띄게 늘어난다고 봅니다. 날짜를 미룰 수 있으면 미루고, 미룰 수
            없으면 조항을 한 번 더 읽으면 됩니다.
          </Faq>
          <Faq question="수성 역행은 모두에게 똑같이 영향을 주나요?">
            아니요. 역행이 일어나는 하늘의 자리가 개인 차트의 어느 영역을 지나는지에
            따라 다릅니다. 같은 역행이라도 누군가에게는 일의 영역이고 누군가에게는
            관계의 영역입니다.
          </Faq>
          <Faq question="여기 날짜는 어디서 가져온 건가요?">
            가져오지 않았습니다. 수성과 지구의 궤도 요소에서 위치를 직접 계산하고,
            겉보기 황경의 변화율이 0이 되는 순간을 찾아 유 시각을 구했습니다. 빛이
            오는 데 걸리는 시간과 세차운동까지 넣었습니다.
          </Faq>
          <Faq question="다른 행성도 역행하나요?">
            합니다. 금성·화성·목성·토성 모두 역행하고, 바깥쪽 행성일수록 역행 기간이
            깁니다. 수성이 유독 자주 화제가 되는 것은 주기가 짧아 자주 돌아오고,
            맡은 영역이 일상과 가깝기 때문입니다.
          </Faq>
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
          <GoldButton variant="outline" href="/sign">
            열두 개의 방으로
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gold/10 pb-2">
      <dt className="shrink-0 text-meta text-starlight-dim">{label}</dt>
      <dd className="text-right text-starlight">{value}</dd>
    </div>
  );
}

/**
 * 문답 하나 — 네이티브 details라 자바스크립트 없이 접히고, 검색엔진은 답까지
 * 그대로 읽는다. 네 문답을 전부 펼쳐 두면 본문 아래가 텍스트 벽이 된다는
 * 가시성 점검(2026-08-14)에서 접는 쪽으로 바꿨다.
 */
function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-gold/12 pt-4 first:border-t-0 first:pt-0">
      <summary className="flex cursor-pointer list-none items-baseline gap-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="flex-none text-meta text-gold transition-transform duration-300 group-open:rotate-90"
        >
          ›
        </span>
        <span className="break-keep font-display text-lg text-starlight">{question}</span>
      </summary>
      <div className="mt-2 pl-6 text-starlight-dim">{children}</div>
    </details>
  );
}
