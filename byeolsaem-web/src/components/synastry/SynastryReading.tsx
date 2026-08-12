"use client";
import { useEffect, useMemo, useState } from "react";
import { RESONANCE_NOTE } from "@/content/atoms/synastry";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { useInView } from "@/hooks/useInView";
import type { RitualData } from "@/components/hero/RitualForm";
import { formatBirthDate } from "@/lib/birth-profile";
import { computeChart, type Chart } from "@/lib/chart";
import { coordinatesFor, KOREA_UTC_OFFSET_HOURS } from "@/lib/coordinates";
import { openBirthPanel, requestRitual } from "@/lib/ritual";
import {
  synastryReading,
  type SynastryLine,
  type SynastryReading as SynastryReadingData,
} from "@/lib/synastry-reading";
import { ChartLoading, NoProfile, UnknownPlace } from "@/components/chart/NoProfile";
import { GoldButton } from "@/components/ui/GoldButton";
import { TalismanChip } from "@/components/ui/TalismanChip";
import { GoldThreads } from "./GoldThreads";

/**
 * 두 하늘의 만남.
 *
 * 상대의 정보는 저장하지 않는다. 내 출생 정보는 이 사이트를 쓰는 내내 같지만
 * 상대는 그렇지 않고, 무엇보다 **내 브라우저에 남의 생년월일을 남길 이유가
 * 없다.** 새로고침하면 사라지며, 화면에도 그렇게 적어 둔다.
 *
 * 입력은 같은 패널을 두 번째로 쓴다(RENEWAL_PLAN §11.4). 폼을 하나 더 만들면
 * 검증이 갈리는 순간부터 어느 쪽이 맞는지 알 수 없게 된다. onComplete만 바꿔
 * 끼우면 결과가 저장소 대신 이 화면의 상태로 간다.
 */
export function SynastryReading() {
  const { profile, ready } = useBirthProfile();
  const [partner, setPartner] = useState<RitualData | null>(null);
  /** 아래 목록에서 짚고 있는 만남. 그림의 실 한 가닥이 이것을 따라 밝아진다. */
  const [activeId, setActiveId] = useState<string | null>(null);

  const myChart = useChartOf(profile);
  const theirChart = useChartOf(partner);

  const reading = useMemo(
    () => (myChart && theirChart ? synastryReading(myChart, theirChart) : null),
    [myChart, theirChart],
  );

  const askPartner = () =>
    openBirthPanel({
      kicker: "THEIR SKY",
      title: "상대의 밤하늘",
      description:
        "상대의 정보는 저장하지 않습니다. 이 화면을 떠나거나 새로고침하면 사라집니다.",
      onComplete: setPartner,
    });

  if (!ready) return <ChartLoading />;
  if (!profile) return <NoProfile what="궁합" />;
  if (!myChart) return <UnknownPlace city={profile.city} />;

  return (
    <div className="grid items-start gap-10 md:grid-cols-[150px_minmax(0,1fr)] md:gap-12">
      <aside
        className="border-b border-gold/18 pb-5 md:sticky md:top-24 md:border-b-0 md:border-r md:pb-0 md:pr-5 md:text-right"
        aria-label="이 궁합의 두 사람"
      >
        <p className="font-latin text-eyebrow tracking-[0.2em] text-gold">TWO SKIES</p>
        <p className="mt-2 text-meta text-starlight-dim">나</p>
        <p className="text-meta text-gold-soft">{formatBirthDate(profile.date)}</p>
        <button
          type="button"
          onClick={() => requestRitual()}
          className="mt-1 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
        >
          고치기
        </button>

        <p className="mt-5 text-meta text-starlight-dim">그쪽</p>
        {partner ? (
          <>
            <p className="text-meta text-gold-soft">{formatBirthDate(partner.date)}</p>
            <button
              type="button"
              onClick={askPartner}
              className="mt-1 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
            >
              다른 사람으로
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={askPartner}
            className="border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
          >
            정보 넣기
          </button>
        )}
      </aside>

      <div className="min-w-0">
        {!partner && <AskPartner onAsk={askPartner} />}
        {partner && !theirChart && (
          <div className="py-8">
            <UnknownPlace city={partner.city} />
          </div>
        )}
        {partner && theirChart && reading && (
          <>
            <Resonance reading={reading} />

            <div className="mt-12">
              <GoldThreads
                mine={myChart}
                theirs={theirChart}
                lines={reading.lines}
                activeId={activeId}
              />
            </div>

            {reading.empty ? (
              <p className="mt-10 max-w-[52ch] break-keep leading-relaxed text-starlight">
                {reading.empty}
              </p>
            ) : (
              <>
                <div className="mt-10 flex flex-wrap gap-2.5">
                  {reading.chips.map((chip) => (
                    <TalismanChip key={chip.label} symbol={chip.symbol} label={chip.label} />
                  ))}
                </div>

                <section className="mt-16">
                  <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
                    두 하늘이 닿는 자리
                    <span aria-hidden className="h-px flex-1 bg-gold/25" />
                  </h2>
                  <p className="max-w-[52ch] break-keep text-guide text-starlight-dim">
                    이름이 붙어 있는 조합을 앞에 두고, 그다음은 무게가 실린 것부터{" "}
                    {reading.lines.length}개입니다. 한 줄에 커서를 올리면 위 그림에서 그
                    실이 밝아집니다.
                  </p>
                  <ul className="mt-8 space-y-8">
                    {reading.lines.map((line) => (
                      <LineRow
                        key={line.id}
                        line={line}
                        onEnter={() => setActiveId(line.id)}
                        onLeave={() => setActiveId(null)}
                      />
                    ))}
                  </ul>
                </section>
              </>
            )}

            <p className="mt-14 max-w-[52ch] break-keep text-meta text-starlight-dim">
              상대의 정보는 어디에도 저장되지 않았습니다. 계산은 이 브라우저 안에서
              끝났고, 새로고침하면 사라집니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** 출생 정보 한 벌에서 차트를. 좌표를 찾지 못하면 null이다. */
function useChartOf(data: RitualData | null): Chart | null {
  return useMemo(() => {
    if (!data) return null;
    const coordinates = coordinatesFor(data.city);
    if (!coordinates) return null;
    return computeChart({
      date: data.date,
      time: data.time,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezoneOffsetHours: KOREA_UTC_OFFSET_HOURS,
    });
  }, [data]);
}

function AskPartner({ onAsk }: { onAsk: () => void }) {
  return (
    <div className="max-w-[52ch]">
      <p className="break-keep leading-relaxed text-starlight">
        당신의 하늘은 준비됐습니다. 상대가 태어난 순간을 넣으면 두 하늘이 서로의 어디를
        건드리는지 계산합니다.
      </p>
      <p className="mt-3 break-keep text-guide text-starlight-dim">
        상대의 정보는 <b className="font-normal text-gold-soft">저장하지 않습니다.</b> 이
        화면을 떠나거나 새로고침하면 사라집니다 — 남의 생년월일을 내 브라우저에 남길
        이유가 없습니다.
      </p>
      <div className="mt-8">
        <GoldButton variant="solid" onClick={onAsk}>
          상대의 하늘 넣기
        </GoldButton>
      </div>
    </div>
  );
}

/**
 * 앞에 세우는 숫자 — 이름이 붙어 있는 조합이 몇 개 맺혀 있는가.
 *
 * 숫자보다 그 숫자가 무엇인지가 먼저다. 궁합 점수로 읽히면 이 페이지는 계산이
 * 아니라 점괘가 된다 — 그래서 세는 방법을 숫자 바로 옆에 붙여 둔다. 아래 목록에서
 * 직접 세어 보면 같은 값이 나온다.
 */
function Resonance({ reading }: { reading: SynastryReadingData }) {
  const [frame, started] = useInView<HTMLDivElement>(0.5);
  const shown = useCountUp(reading.named, started);

  return (
    <div ref={frame} className="flex flex-wrap items-start gap-x-10 gap-y-6">
      <div className="flex-none">
        <p className="font-latin text-eyebrow tracking-[0.24em] text-gold">RESONANCE</p>
        <p className="mt-1 font-display text-6xl tabular-nums text-starlight">
          {shown}
          <span className="ml-1 font-display text-2xl text-starlight-dim">{" / 12"}</span>
        </p>
        <p className="mt-1 font-display text-lg text-gold-soft">{reading.bandLabel}</p>
      </div>
      <div className="min-w-0 flex-1 basis-72">
        <p className="max-w-[52ch] break-keep leading-relaxed text-starlight">{reading.bandLine}</p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-meta text-starlight-dim">
          <li>맺힌 각도 모두 {reading.total}</li>
          <li>흐르는 각도 {reading.flowing}</li>
          <li>부딪히는 각도 {reading.friction}</li>
          <li>겹치는 각도 {reading.overlapping}</li>
          {reading.tightest !== null && <li>가장 정확한 오차 {reading.tightest.toFixed(1)}도</li>}
        </ul>
        <p className="mt-5 max-w-[52ch] break-keep text-meta text-starlight-dim">
          {RESONANCE_NOTE}
        </p>
      </div>
    </div>
  );
}

/** 0에서 그 값까지 올라간다. 화면에 들어온 뒤에 시작해야 눈에 보인다. */
function useCountUp(target: number, run: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    const DURATION = 1100;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // 끝에서 부드럽게 멎는다. 일정한 속도로 세면 마지막에 뚝 끊긴다.
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, run]);

  return value;
}

/*
 * 탭 순서에는 넣지 않는다. 커서를 올리면 위 그림의 실이 밝아지지만 그것뿐이고,
 * 키보드로 들를 자리로 만들면 아무 일도 일어나지 않는 정거장이 열 개 생긴다 —
 * 화면 낭독기에는 "이 항목으로 무엇을 할 수 있다"는 신호로 들린다. 실이 밝아지는
 * 것은 커서를 쓰는 사람을 위한 덤이고, 내용은 이미 이 줄에 다 적혀 있다.
 */
function LineRow({
  line,
  onEnter,
  onLeave,
}: {
  line: SynastryLine;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <li
      className={`border-t pt-6 ${line.harmony > 0 ? "border-gold/40" : "border-gold/12"}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-lg text-starlight">
          내 <span className="astro-symbol">{line.mine.symbol}</span> {line.mine.ko}
          <span className="mx-2 astro-symbol text-gold-soft">{line.aspectSymbol}</span>그쪽{" "}
          <span className="astro-symbol">{line.theirs.symbol}</span> {line.theirs.ko}
        </span>
        <span className="text-meta text-starlight-dim">
          {line.aspectKo} · 오차 {line.orb.toFixed(1)}도
        </span>
      </p>
      <p className="mt-3 max-w-[52ch] break-keep text-guide text-gold-soft">
        {line.meeting} — {line.headline}
      </p>
      <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">{line.body}</p>
      {line.highlight && (
        <p className="mt-3 max-w-[52ch] break-keep border-l-2 border-gold/40 pl-4 leading-relaxed text-starlight">
          {line.highlight}
        </p>
      )}
    </li>
  );
}
