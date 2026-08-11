"use client";
import Link from "next/link";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { formatBirthDate } from "@/lib/birth-profile";
import { formatPlacement } from "@/lib/chart";
import { describeElements, type ReadingPlacement } from "@/lib/reading";
import { GoldButton } from "@/components/ui/GoldButton";
import { LineDiamond } from "@/components/ui/LineDiamond";
import { ChartWheel, ChartWheelLegend } from "./ChartWheel";
import { ChartLoading, NoProfile, UnknownPlace } from "./NoProfile";
import { useChart } from "./useChart";

/**
 * 천궁도 전체 — 태어난 순간의 하늘을 계산하고 아톰으로 조립해 읽어 준다.
 *
 * 계산도 조립도 이 브라우저 안에서 끝난다. 어디에도 출생 정보를 보내지 않고,
 * 같은 정보를 넣으면 언제 다시 열어도 같은 글이 나온다.
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
    <div>
      <p className="text-center text-xs tracking-wide text-starlight-dim">
        {formatBirthDate(profile.date)}
        {profile.time ? ` ${profile.time}` : ""} · {profile.city}
      </p>

      {/* 세 줄 요약. 이 셋을 모르면 나머지는 배경이다. */}
      <div className="mx-auto mt-10 max-w-xl space-y-6">
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
          <div className="border-t border-gold/15 pt-5 text-sm leading-relaxed text-starlight-dim">
            상승궁은 태어난 시각을 알아야 정해집니다. 시각이 4분 어긋나면 1도가
            움직이므로, 모르는 채로 채워 넣지 않습니다.
          </div>
        )}
      </div>

      <div className="mt-14">
        <ChartWheel chart={chart} />
        <ChartWheelLegend />
        <p className="mx-auto mt-4 max-w-md break-keep text-center text-[11px] leading-relaxed text-starlight-dim">
          하우스는 홀사인(whole sign) 방식으로 나눴습니다. 상승궁이 든 별자리의 0도가
          1하우스의 시작이고, 다음 별자리가 차례로 2, 3하우스가 됩니다.
        </p>
      </div>

      <LineDiamond className="my-14" />

      <section className="mx-auto max-w-xl">
        <h2 className="text-center break-keep font-display text-xl text-starlight">
          하늘 전체의 무게
        </h2>
        <p className="mt-5 break-keep leading-relaxed text-starlight">
          {describeElements(reading.elements)}
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-starlight-dim">
          {reading.elements.map((entry) => (
            <li key={entry.element}>
              {entry.element} {entry.count}
            </li>
          ))}
        </ul>
      </section>

      {reading.lens && (
        <>
          <LineDiamond className="my-14" />
          <section className="mx-auto max-w-xl text-center">
            <p className="text-[11px] tracking-[0.28em] text-gold">{reading.lens.label}</p>
            <p className="mt-4 break-keep leading-relaxed text-starlight-dim">
              {reading.lens.summary} 아래 목록에서 이 관심사에 걸리는 자리를 앞에
              두었습니다.
            </p>
          </section>
        </>
      )}

      <LineDiamond className="my-14" />

      <section className="mx-auto max-w-xl">
        <h2 className="text-center break-keep font-display text-xl text-starlight">
          열 개의 별
        </h2>
        <ul className="mt-8 space-y-8">
          {reading.placements.map((item) => (
            <PlacementRow key={item.planet.key} item={item} />
          ))}
        </ul>
      </section>

      {reading.aspects.length > 0 && (
        <>
          <LineDiamond className="my-14" />
          <section className="mx-auto max-w-xl">
            <h2 className="text-center break-keep font-display text-xl text-starlight">
              별과 별 사이
            </h2>
            <p className="mx-auto mt-4 max-w-md break-keep text-center text-sm leading-relaxed text-starlight-dim">
              두 별이 특정한 각도로 만나면 서로의 작용이 섞입니다. 정확한 각도에
              가까운 것부터 {reading.aspects.length}개를 골랐습니다.
            </p>
            <ul className="mt-8 space-y-8">
              {reading.aspects.map((item) => (
                <li key={`${item.a.key}-${item.b.key}`} className="border-t border-gold/12 pt-6">
                  <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-lg text-starlight">
                      <span className="astro-symbol">{item.a.symbol}</span> {item.a.ko}
                      <span className="mx-2 text-gold-soft astro-symbol">{item.aspect.type.symbol}</span>
                      <span className="astro-symbol">{item.b.symbol}</span> {item.b.ko}
                    </span>
                    <span className="text-xs text-starlight-dim">
                      {item.aspect.type.ko} · 오차 {item.aspect.orb.toFixed(1)}도
                    </span>
                  </p>
                  <p className="mt-3 text-sm text-gold-soft">
                    {item.theme} — {item.headline}
                  </p>
                  <p className="mt-2 break-keep leading-relaxed text-starlight-dim">{item.body}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {reading.timeUnknown && (
        <div className="mx-auto mt-16 max-w-xl border-t border-gold/15 pt-8 text-center">
          <p className="break-keep leading-relaxed text-starlight-dim">
            태어난 시각을 남기지 않으셔서 상승궁과 하우스는 비워 두었습니다. 달의
            위치도 하루 사이에 13도까지 움직이므로 위 값은 정오를 기준으로 한
            것입니다. 시각을 찾으시면{" "}
            <Link href="/" className="border-b border-gold/40 pb-0.5 text-gold-soft">
              다시 남겨
            </Link>{" "}
            주세요.
          </p>
        </div>
      )}

      <div className="mt-20 border-t border-gold/15 pt-12 text-center">
        <p className="break-keep leading-relaxed text-starlight-dim">
          이 배치가 지금 하늘과 어떻게 만나는지는 날마다 달라집니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <GoldButton variant="solid" href="/today">
            오늘의 하늘 보기
          </GoldButton>
          <GoldButton variant="outline" href="/yearly">
            올해의 흐름 보기
          </GoldButton>
        </div>
      </div>
    </div>
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
    <div className="border-t border-gold/15 pt-5">
      <p className="flex items-baseline gap-3">
        <span className="astro-symbol text-lg text-gold-soft" aria-hidden>
          {symbol}
          {"︎"}
        </span>
        <span className="text-xs tracking-[0.2em] text-starlight-dim">{label}</span>
        <span className="font-display text-lg text-starlight">{value}</span>
      </p>
      <p className="mt-2 break-keep leading-relaxed text-starlight-dim">{text}</p>
    </div>
  );
}

function PlacementRow({ item }: { item: ReadingPlacement }) {
  return (
    <li
      className={`border-t pt-6 ${item.highlighted ? "border-gold/40" : "border-gold/12"}`}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="astro-symbol text-lg text-gold-soft" aria-hidden>
          {item.planet.symbol}
          {"︎"}
        </span>
        <span className="font-display text-lg text-starlight">
          {item.planet.ko} · {formatPlacement(item.placement)}
        </span>
        {item.house && (
          <span className="text-xs text-starlight-dim">
            {item.house.number}하우스 · {item.house.domain}
          </span>
        )}
        {item.placement.retrograde && (
          <span className="text-xs text-gold-soft">역행</span>
        )}
      </p>
      <p className="mt-3 break-keep leading-relaxed text-starlight">{item.inSign}</p>
      {item.inHouse && (
        <p className="mt-2 break-keep leading-relaxed text-starlight-dim">{item.inHouse}</p>
      )}
      {!item.planet.personal && (
        <p className="mt-2 text-xs leading-relaxed text-starlight-dim">
          {item.planet.ko}은(는) 한 별자리에 {item.planet.dwell} 머뭅니다. 같은 무렵에
          태어난 사람이 모두 같은 자리를 가지므로, 이 별은 개인보다 세대를 말합니다.
        </p>
      )}
    </li>
  );
}
