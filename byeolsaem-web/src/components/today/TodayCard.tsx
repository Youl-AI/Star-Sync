"use client";
import { useEffect, useMemo, useState } from "react";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { formatBirthDate } from "@/lib/birth-profile";
import { computeChart } from "@/lib/chart";
import { coordinatesFor, KOREA_UTC_OFFSET_HOURS } from "@/lib/coordinates";
import { requestRitual } from "@/lib/ritual";
import { todaySky } from "@/lib/today";
import { todayBack, todayFront } from "@/lib/today-reading";
import { ArchCard } from "@/components/ui/ArchCard";
import { GoldButton } from "@/components/ui/GoldButton";
import { TalismanChip } from "@/components/ui/TalismanChip";
import { MoonDisc } from "./MoonDisc";

/**
 * 오늘의 카드.
 *
 * 앞면은 누구에게나 같다 — 달의 위상은 태양과 달의 각도 하나로 정해지므로 개인
 * 정보가 없어도 보여 줄 수 있다. 그래서 처음 온 사람도 빈 화면을 보지 않는다.
 * 뒤집으면 오늘 하늘이 내 출생 차트를 어디서 건드리는지가 나온다(스펙 §6.3).
 *
 * 날짜는 마운트한 뒤에 정한다. 정적 export라 빌드 시점의 날짜가 HTML에 박히면
 * "오늘"이 배포한 날로 영구히 굳는다. 서버가 만든 첫 렌더와 어긋나지 않도록
 * 그 전까지는 어느 쪽으로도 단정하지 않는다.
 */
export function TodayCard() {
  const { profile, ready } = useBirthProfile();
  const [now, setNow] = useState<Date | null>(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const sky = useMemo(() => (now ? todaySky(now) : null), [now]);
  const front = useMemo(() => (sky ? todayFront(sky) : null), [sky]);

  const back = useMemo(() => {
    if (!sky || !profile) return null;
    const coordinates = coordinatesFor(profile.city);
    if (!coordinates) return null;
    const natal = computeChart({
      date: profile.date,
      time: profile.time,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezoneOffsetHours: KOREA_UTC_OFFSET_HOURS,
    });
    return todayBack(sky, natal);
  }, [sky, profile]);

  if (!sky || !front) {
    return (
      <p className="py-16 text-center text-guide text-starlight-dim" aria-live="polite">
        오늘의 하늘을 여는 중입니다.
      </p>
    );
  }

  const canFlip = ready && back !== null;

  return (
    <div className="grid items-start gap-10 md:grid-cols-[150px_minmax(0,1fr)] md:gap-12">
      <aside
        className="border-b border-gold/18 pb-5 md:sticky md:top-24 md:border-b-0 md:border-r md:pb-0 md:pr-5 md:text-right"
        aria-label="오늘 날짜와 하늘"
      >
        <p className="font-latin text-eyebrow tracking-[0.2em] text-gold">TONIGHT</p>
        <p className="mt-2 text-meta text-starlight-dim">{front.dateLine}</p>
        <p className="text-meta text-starlight-dim">
          {front.phaseName} · {front.illumination}%
        </p>
        <p className="text-meta text-starlight-dim">달 {front.moonSign}</p>
        {profile ? (
          <>
            <p className="mt-3 text-meta text-gold-soft">{formatBirthDate(profile.date)}</p>
            <button
              type="button"
              onClick={() => requestRitual()}
              className="mt-2 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
            >
              고치기
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => requestRitual()}
            className="mt-3 border-b border-gold/40 pb-0.5 text-meta text-gold-soft transition-colors hover:text-starlight"
          >
            내 하늘 열기
          </button>
        )}
      </aside>

      <div className="min-w-0">
        <div className="flex flex-wrap items-start gap-x-12 gap-y-8">
          <div className="flex-none">
            <ArchCard
              name={front.phaseTitle}
              latin={`MOON IN ${front.moonSignLatin}`}
              tagline={`${front.phaseName} · 밝은 면 ${front.illumination}%`}
              width={240}
            >
              <MoonDisc illumination={sky.moon.illumination} phase={sky.moon.phase.key} />
            </ArchCard>
          </div>

          <div className="min-w-0 flex-1 basis-72">
            <p className="max-w-[52ch] break-keep leading-relaxed text-starlight">
              {front.phaseLine}
            </p>
            {front.moonInSign && (
              <p className="mt-4 max-w-[52ch] break-keep text-guide text-starlight-dim">
                달이 {front.moonSign}에 있습니다. {front.moonInSign}
              </p>
            )}

            {canFlip && !flipped && (
              <div className="mt-8">
                <GoldButton variant="solid" onClick={() => setFlipped(true)}>
                  내 하늘과 겹쳐 보기
                </GoldButton>
              </div>
            )}
            {ready && !profile && (
              <p className="mt-8 max-w-[52ch] break-keep text-guide text-starlight-dim">
                여기까지는 오늘 밤 하늘을 보는 모든 사람이 같습니다. 태어난 순간을
                남기면 이 하늘이 <b className="font-normal text-starlight">당신의</b>{" "}
                어디를 건드리는지까지 볼 수 있습니다.
              </p>
            )}
            {ready && profile && back === null && (
              <p className="mt-8 max-w-[52ch] break-keep text-guide text-starlight-dim">
                &lsquo;{profile.city}&rsquo;의 좌표를 찾지 못해 내 차트와 겹쳐 볼 수
                없습니다. 태어난 곳을 다시 골라 주세요.
              </p>
            )}
          </div>
        </div>

        {flipped && back && <TransitList back={back} />}
      </div>
    </div>
  );
}

function TransitList({ back }: { back: NonNullable<ReturnType<typeof todayBack>> }) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        오늘 하늘이 건드리는 자리
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>

      {back.quiet ? (
        <p className="max-w-[52ch] break-keep text-guide text-starlight">{back.quiet}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2.5">
            {back.chips.map((chip) => (
              <TalismanChip key={chip.label} symbol={chip.symbol} label={chip.label} />
            ))}
          </div>

          <ul className="mt-10 space-y-8">
            {back.transits.map((t) => (
              <li
                key={`${t.moving.key}-${t.fixed.key}-${t.aspectKo}`}
                className={`border-t pt-6 ${t.harmony > 0 ? "border-gold/40" : "border-gold/12"}`}
              >
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-lg text-starlight">
                    오늘의 <span className="astro-symbol">{t.moving.symbol}</span> {t.moving.ko}
                    <span className="mx-2 astro-symbol text-gold-soft">{t.aspectSymbol}</span>내{" "}
                    <span className="astro-symbol">{t.fixed.symbol}</span> {t.fixed.ko}
                  </span>
                  <span className="text-meta text-starlight-dim">
                    {t.aspectKo} · 오차 {t.orb.toFixed(1)}도 · 약 {t.span}
                  </span>
                </p>
                <p className="mt-3 max-w-[52ch] text-guide text-gold-soft">{t.headline}</p>
                <p className="mt-2 max-w-[52ch] break-keep leading-relaxed text-starlight-dim">
                  {t.body}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="mt-10 max-w-[52ch] break-keep text-meta text-starlight-dim">
        오늘 하늘은 한국 시간 정오를 기준으로 계산했습니다. 달은 하루에 13도를 움직이므로
        이른 아침과 늦은 밤은 이 값과 조금 다릅니다.
      </p>
    </section>
  );
}
