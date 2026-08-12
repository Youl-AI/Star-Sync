"use client";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { formatBirthDate } from "@/lib/birth-profile";
import { formatPlacement } from "@/lib/chart";
import { describeElements, type ReadingPlacement } from "@/lib/reading";
import { requestRitual } from "@/lib/ritual";
import { GoldButton } from "@/components/ui/GoldButton";
import { ChartWheel, ChartWheelLegend } from "./ChartWheel";
import { ChartLoading, NoProfile, UnknownPlace } from "./NoProfile";
import { useChart } from "./useChart";

/**
 * 천궁도 전체 — 태어난 순간의 하늘을 계산하고 아톰으로 조립해 읽어 준다.
 *
 * 계산도 조립도 이 브라우저 안에서 끝난다. 어디에도 출생 정보를 보내지 않고,
 * 같은 정보를 넣으면 언제 다시 열어도 같은 글이 나온다.
 *
 * 배치는 §11.4에서 정한 시안 B다. 히어로만 가운데에 두고 읽는 구간은 좌측으로
 * 내렸다. 수상작을 열어 세어 보니 긴 글은 예외 없이 좌측이었고, 가운데 정렬은
 * 줄마다 시작점이 달라져 눈이 다음 줄 머리를 찾는 데 시간을 쓴다 — 줄바꿈이 잦은
 * 한국어에서 더 크게 나타난다.
 *
 * 왼쪽 기둥은 스크롤을 따라오며 누구의 하늘을 보고 있는지 계속 말한다. 예전에는
 * 그 정보가 맨 위에 한 줄 있다가 사라졌다.
 */
export function NatalReading() {
  const { profile, ready } = useBirthProfile();
  const state = useChart(profile);

  if (!ready) return <ChartLoading />;
  if (!profile) return <NoProfile what="천궁도" />;
  if (state?.status === "unknown-place") return <UnknownPlace city={profile.city} />;
  if (state?.status !== "ready") return <ChartLoading />;

  const { chart, reading } = state;
  const { core } = reading;

  return (
    <div className="grid items-start gap-10 md:grid-cols-[150px_minmax(0,1fr)] md:gap-12">
      <BirthRail
        date={formatBirthDate(profile.date)}
        time={profile.time}
        city={profile.city}
        concern={reading.lens?.label}
      />

      <div className="min-w-0">
        {/* 세 줄 요약. 이 셋을 모르면 나머지는 배경이다. */}
        <section className="space-y-6">
          <CoreLine
            symbol="☉"
            label="태양"
            value={formatPlacement(core.sun.placement)}
            text={core.sun.inSign}
          />
          <CoreLine
            symbol="☽"
            label="달"
            value={formatPlacement(core.moon.placement)}
            text={core.moon.inSign}
          />
          {core.ascendant ? (
            <CoreLine
              symbol="ASC"
              label="상승궁"
              value={core.ascendant.sign.ko}
              text={core.ascendant.text}
            />
          ) : (
            <div className="border-t border-gold/15 pt-5 text-guide text-starlight-dim">
              상승궁은 태어난 시각을 알아야 정해집니다. 시각이 4분 어긋나면 1도가
              움직이므로, 모르는 채로 채워 넣지 않습니다.
            </div>
          )}
        </section>

        {/* 원반과 그 원반을 읽는 법을 나란히 둔다. 예전에는 그림이 가운데 있고
            설명이 아래에 있어서, 설명을 읽는 동안 그림이 눈에서 벗어났다. */}
        <figure className="mt-14 flex flex-wrap items-start gap-x-10 gap-y-6">
          <div className="w-full max-w-[340px] flex-none">
            <ChartWheel chart={chart} />
          </div>
          <figcaption className="min-w-0 flex-1 basis-64 space-y-4">
            <ChartWheelLegend />
            <p className="break-keep text-meta text-starlight-dim">
              하우스는 홀사인(whole sign) 방식으로 나눴습니다. 상승궁이 든 별자리의 0도가
              1하우스의 시작이고, 다음 별자리가 차례로 2, 3하우스가 됩니다.
            </p>
          </figcaption>
        </figure>

        <Section title="하늘 전체의 무게">
          <p className="break-keep leading-relaxed text-starlight">
            {describeElements(reading.elements)}
          </p>
          <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-meta text-starlight-dim">
            {reading.elements.map((entry) => (
              <li key={entry.element}>
                {entry.element} {entry.count}
              </li>
            ))}
          </ul>
        </Section>

        {reading.lens && (
          <Section title={`${reading.lens.label}으로 본다면`}>
            <p className="break-keep leading-relaxed text-starlight-dim">
              {reading.lens.summary} 아래 목록에서 이 관심사에 걸리는 자리를 앞에
              두었습니다.
            </p>
          </Section>
        )}

        <Section title="열 개의 별">
          <ul className="space-y-8">
            {reading.placements.map((item) => (
              <PlacementRow key={item.planet.key} item={item} />
            ))}
          </ul>
        </Section>

        {reading.aspects.length > 0 && (
          <Section title="별과 별 사이">
            <p className="max-w-[52ch] break-keep text-guide text-starlight">
              두 별이 특정한 각도로 만나면 서로의 작용이 섞입니다. 정확한 각도에
              가까운 것부터 {reading.aspects.length}개를 골랐습니다.
            </p>
            <ul className="mt-8 space-y-8">
              {reading.aspects.map((item) => (
                <li key={`${item.a.key}-${item.b.key}`} className="border-t border-gold/12 pt-6">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-lg text-starlight">
                      <span className="astro-symbol">{item.a.symbol}</span> {item.a.ko}
                      <span className="mx-2 astro-symbol text-gold-soft">{item.aspect.type.symbol}</span>
                      <span className="astro-symbol">{item.b.symbol}</span> {item.b.ko}
                    </span>
                    <span className="text-meta text-starlight-dim">
                      {item.aspect.type.ko} · 오차 {item.aspect.orb.toFixed(1)}도
                    </span>
                  </p>
                  <p className="mt-3 text-guide text-gold-soft">
                    {item.theme} — {item.headline}
                  </p>
                  <p className="mt-2 break-keep leading-relaxed text-starlight-dim">{item.body}</p>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {reading.timeUnknown && (
          <div className="mt-16 border-t border-gold/15 pt-8">
            <p className="max-w-[52ch] break-keep text-guide text-starlight-dim">
              태어난 시각을 남기지 않으셔서 상승궁과 하우스는 비워 두었습니다. 달의
              위치도 하루 사이에 13도까지 움직이므로 위 값은 정오를 기준으로 한
              것입니다. 시각을 찾으시면{" "}
              <button
                type="button"
                onClick={() => requestRitual()}
                className="border-b border-gold/40 pb-0.5 text-gold-soft transition-colors hover:text-starlight"
              >
                다시 남겨
              </button>{" "}
              주세요.
            </p>
          </div>
        )}

        <div className="mt-20 border-t border-gold/15 pt-12">
          <p className="max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
            이 배치가 지금 하늘과 어떻게 만나는지는 날마다 달라집니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <GoldButton variant="solid" href="/today">
              오늘의 하늘 보기
            </GoldButton>
            <GoldButton variant="outline" href="/yearly">
              올해의 흐름 보기
            </GoldButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 왼쪽 붙박이 기둥. 누구의 하늘을 보고 있는지 스크롤 내내 말해 준다.
 *
 * 데스크톱에서는 오른쪽에 금선을 세우고 오른쪽 정렬로 붙여 본문 쪽 가장자리를
 * 만든다. 모바일에서는 세로로 세울 자리가 없으므로 위쪽 가로줄로 눕힌다.
 */
function BirthRail({
  date,
  time,
  city,
  concern,
}: {
  date: string;
  time: string | null;
  city: string;
  concern?: string;
}) {
  return (
    <aside
      className="border-b border-gold/18 pb-5 md:sticky md:top-24 md:border-b-0 md:border-r md:pb-0 md:pr-5 md:text-right"
      aria-label="이 하늘의 출생 정보"
    >
      <p className="font-latin text-eyebrow tracking-[0.2em] text-gold">BORN</p>
      <p className="mt-2 text-meta text-starlight-dim">{date}</p>
      <p className="text-meta text-starlight-dim">{time ?? "시각 모름"}</p>
      <p className="text-meta text-starlight-dim">{city}</p>
      {concern && <p className="mt-3 text-meta text-gold-soft">{concern}</p>}
      <button
        type="button"
        onClick={() => requestRitual()}
        className="mt-4 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
      >
        고치기
      </button>
    </aside>
  );
}

/** 좌측 정렬 섹션. 제목 오른쪽으로 금선이 뻗어 읽는 폭의 끝을 표시한다. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        {title}
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>
      {children}
    </section>
  );
}

function CoreLine({
  symbol,
  label,
  value,
  text,
}: {
  symbol: string;
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[30px_minmax(0,1fr)] gap-x-3 border-t border-gold/15 pt-5">
      <span className="astro-symbol text-lg leading-snug text-gold-soft" aria-hidden>
        {symbol}
        {"︎"}
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3">
          <span className="text-meta tracking-[0.2em] text-starlight-dim">{label}</span>
          <span className="font-display text-lg text-starlight">{value}</span>
        </p>
        <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">{text}</p>
      </div>
    </div>
  );
}

function PlacementRow({ item }: { item: ReadingPlacement }) {
  return (
    <li
      className={`grid grid-cols-[30px_minmax(0,1fr)] gap-x-3 border-t pt-6 ${
        item.highlighted ? "border-gold/40" : "border-gold/12"
      }`}
    >
      <span className="astro-symbol text-lg leading-snug text-gold-soft" aria-hidden>
        {item.planet.symbol}
        {"︎"}
      </span>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-lg text-starlight">
            {item.planet.ko} · {formatPlacement(item.placement)}
          </span>
          {item.house && (
            <span className="text-meta text-starlight-dim">
              {item.house.number}하우스 · {item.house.domain}
            </span>
          )}
          {item.placement.retrograde && (
            <span className="text-meta text-gold-soft">역행</span>
          )}
        </p>
        <p className="mt-3 max-w-[52ch] break-keep leading-relaxed text-starlight">{item.inSign}</p>
        {item.inHouse && (
          <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
            {item.inHouse}
          </p>
        )}
        {!item.planet.personal && (
          <p className="mt-2 max-w-[52ch] break-keep text-meta text-starlight-dim">
            {item.planet.ko}은(는) 한 별자리에 {item.planet.dwell} 머뭅니다. 같은 무렵에
            태어난 사람이 모두 같은 자리를 가지므로, 이 별은 개인보다 세대를 말합니다.
          </p>
        )}
      </div>
    </li>
  );
}
