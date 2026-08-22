"use client";
import { useMemo, useState, useEffect } from "react";
import { ChartWheel } from "@/components/chart/ChartWheel";
import { GoldButton } from "@/components/ui/GoldButton";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { coordinatesFor, KOREA_UTC_OFFSET_HOURS } from "@/lib/coordinates";
import { EXAMPLE_BIRTH, exampleSolarReturn } from "@/lib/example-sky";
import { formatKstDate } from "@/lib/retrograde-clock";
import { requestRitual } from "@/lib/ritual";
import { solarReturnChart } from "@/lib/solar-return";
import { composeSolarReading, type SolarAxis } from "./solar-reading";

/**
 * 솔라 리턴 본문 — 내 정보가 있으면 내 리턴 차트, 없으면 예시(EXAMPLE_BIRTH)를
 * 보여준다.
 *
 * `useBirthProfile`의 `profile`은 클라이언트에서 저장소를 읽기 전까지 항상
 * null이다(ready 가드는 그 훅 안쪽에 있다 — 여기서 따로 `!ready`로 분기하지
 * 않는다). 그래서 이 컴포넌트가 만드는 첫 그림 — 서버 HTML과 하이드레이션
 * 전 클라이언트 첫 렌더 — 은 언제나 예시 쪽이다. 크롤러가 보는 것도 이 예시다.
 *
 * `now`도 같은 이유로 useState(null) → useEffect에서 채운다. 마운트 전에는
 * `now`가 없으므로 `exampleSolarReturn(new Date())`를 그대로 쓴다 — 어느 해의
 * 리턴이든 예시라는 사실과 프레임 문장은 같다.
 */
export function SolarScope() {
  const { profile } = useBirthProfile();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const mine = useMemo(() => {
    if (!profile || !now) return null;
    const coordinates = coordinatesFor(profile.city);
    if (!coordinates) return null;
    return solarReturnChart(
      {
        date: profile.date,
        time: profile.time,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        timezoneOffsetHours: KOREA_UTC_OFFSET_HOURS,
      },
      now,
    );
  }, [profile, now]);

  // 서버 HTML과 첫 그림은 언제나 예시 쪽(위 주석 참고).
  const data = useMemo(() => mine ?? exampleSolarReturn(now ?? new Date()), [mine, now]);
  const reading = useMemo(() => composeSolarReading(data.chart), [data.chart]);
  const isExample = mine === null;
  const timeUnknown = mine !== null && profile?.time === null;

  return (
    <div className="mx-auto max-w-2xl">
      {isExample && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border border-gold/35 bg-ink-raised/85 px-5 py-4">
          <div className="min-w-[240px] flex-1">
            <p className="break-keep text-starlight">
              아직 내 하늘을 열기 전입니다 — 아래는 예시입니다.
            </p>
            <p className="mt-1 break-keep text-meta text-starlight-dim">{EXAMPLE_BIRTH.label}</p>
          </div>
          <GoldButton variant="solid" onClick={() => requestRitual()}>
            내 하늘 열기
          </GoldButton>
        </div>
      )}

      <p className="mt-8 break-keep text-guide text-starlight-dim">
        이번 리턴의 유효 기간 —{" "}
        <span className="text-starlight">
          {formatKstDate(data.instant.toISOString())} ~ {formatKstDate(data.nextInstant.toISOString())}
        </span>
      </p>

      <div className="mt-8">
        <ChartWheel chart={data.chart} />
      </div>

      {reading.ascendant && <AxisSection axis={reading.ascendant} />}
      {reading.sunHouse && <AxisSection axis={reading.sunHouse} />}
      {reading.moonSign && <AxisSection axis={reading.moonSign} />}

      {timeUnknown && (
        <div className="mt-12 border-t border-gold/15 pt-8">
          <p className="max-w-[52ch] break-keep text-guide text-starlight-dim">
            태어난 시각을 알면 두 축이 더 열립니다 — 올해의 첫인상(상승궁)과 올해
            빛이 모이는 방(태양의 하우스)은 시각이 있어야 정해집니다.
          </p>
        </div>
      )}
    </div>
  );
}

function AxisSection({ axis }: { axis: SolarAxis }) {
  return (
    <section className="mt-12">
      <h2 className="break-keep font-display text-xl text-starlight">{axis.title}</h2>
      <p className="mt-2 max-w-[56ch] break-keep text-meta text-gold-soft">{axis.frame}</p>
      <p className="mt-3 max-w-[62ch] break-keep leading-relaxed text-starlight-dim">{axis.body}</p>
    </section>
  );
}
