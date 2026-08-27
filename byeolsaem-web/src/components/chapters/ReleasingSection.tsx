"use client";
import { useMemo, useState } from "react";
import type { BirthMoment, Chart } from "@/lib/chart";
import { fractionalAge, zodiacalReleasing, type LotKey, type ZrPeriod } from "@/lib/time-lords";

const LOT_LABEL: Record<LotKey, { name: string; scope: string }> = {
  spirit: { name: "정신의 점", scope: "커리어와 행동의 장" },
  fortune: { name: "행운의 점", scope: "몸과 환경의 장" },
};

/**
 * 조디악 릴리징 — L1 타임라인 + 현재 장의 L2 스트립 + 범례(프리뷰 승인본).
 * 기본은 정신의 점(사람들이 가장 궁금해하는 커리어 질문). 토글은 컴포넌트
 * 상태만 — URL·저장 없음(스펙 §3.3).
 */
export function ReleasingSection({
  natal,
  chart,
  now,
}: {
  natal: BirthMoment;
  chart: Chart;
  now: Date;
}) {
  const [lot, setLot] = useState<LotKey>("spirit");
  const zr = useMemo(() => zodiacalReleasing(natal, chart, lot, now), [natal, chart, lot, now]);
  if (!zr) return null;
  const age = fractionalAge(natal.date, now);

  return (
    <section className="mt-24">
      <h2 className="break-keep text-center font-display text-2xl text-starlight">인생의 장</h2>
      <p className="mt-2 text-center font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
        ZODIACAL RELEASING
      </p>
      <p className="mx-auto mt-6 max-w-[56ch] break-keep text-center text-guide text-starlight-dim">
        {LOT_LABEL[lot].name}({zr.lotSign.ko})에서 출발해, 별자리마다 정해진
        연수만큼 인생을 장으로 나눕니다. 행운의 점에서 모난 자리의 장은 굵은
        사건의 장으로, 열 번째 자리의 장은 절정의 장으로 읽습니다.
      </p>

      {/* 점 토글 */}
      <div className="mt-8 flex justify-center gap-2" role="group" aria-label="릴리징 기준점">
        {(Object.keys(LOT_LABEL) as LotKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setLot(key)}
            aria-pressed={lot === key}
            className={`border px-4 py-2 text-meta tracking-wide transition-colors ${
              lot === key
                ? "border-gold bg-gold/10 text-gold-soft"
                : "border-gold/25 text-starlight-dim hover:text-starlight"
            }`}
          >
            {LOT_LABEL[key].name} — {LOT_LABEL[key].scope}
          </button>
        ))}
      </div>

      {/* L1 타임라인 — 장 폭은 연수에 비례 */}
      <div className="mt-12 flex flex-wrap gap-1">
        {zr.l1.map((p) => (
          <ChapterCell key={p.fromAge} period={p} current={p === zr.currentL1} age={age} />
        ))}
      </div>

      {/* 현재 장의 L2 */}
      {zr.currentL1 && (
        <div className="mt-12">
          <h3 className="break-keep text-center font-display text-lg text-starlight">
            지금 장의 속살 — {zr.currentL1.sign.ko.replace("자리", "")}의 {zr.currentL1.toAge - zr.currentL1.fromAge}년
          </h3>
          <div className="mt-5 flex flex-wrap gap-1">
            {zr.l2OfCurrent.map((p) => (
              <div
                key={p.fromAge}
                className={`min-w-[72px] flex-1 border px-1 py-2.5 text-center text-[12px] leading-normal ${
                  p === zr.currentL2
                    ? "border-gold bg-gold/10 text-gold-soft"
                    : "border-gold/15 bg-nebula/30 text-starlight-dim"
                }`}
              >
                {p.loosedBond && (
                  <span className="mb-0.5 block text-[10px] tracking-[0.08em] text-gold">매듭 풀림</span>
                )}
                {p.sign.ko.replace("자리", "")}
                <small className="mt-0.5 block text-[10px] tracking-[0.04em]">
                  {p.fromAge.toFixed(1)} – {p.toAge.toFixed(1)}
                </small>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-meta text-starlight-dim">
            긴 장 안에서 달이 도는 작은 장(L2) — 숫자는 만 나이
          </p>
        </div>
      )}

      {/* 범례 */}
      <div className="mx-auto mt-10 grid max-w-[60ch] gap-2.5 text-guide text-starlight-dim">
        <p className="break-keep">
          <b className="font-medium text-gold-soft">각(角)의 장</b> — 행운의 점에서
          1·4·7번째 자리. 삶의 무대가 크게 움직이는 장으로 읽습니다.
        </p>
        <p className="break-keep">
          <b className="font-medium text-gold-soft">절정의 장</b> — 행운의 점에서 열
          번째 자리. 이 시기의 일이 가장 멀리까지 보이는 장입니다.
        </p>
        <p className="break-keep">
          <b className="font-medium text-gold-soft">매듭 풀림</b> — 작은 장이 출발
          자리로 되돌아오는 순간 맞은편 자리로 건너뜁니다. 흐름이 한 번 꺾이는
          지점입니다.
        </p>
      </div>
    </section>
  );
}

function ChapterCell({ period, current, age }: { period: ZrPeriod; current: boolean; age: number }) {
  const years = period.toAge - period.fromAge;
  const badge = current
    ? `지금 · ${Math.floor(age - period.fromAge) + 1}년째`
    : period.peak
      ? "절정의 장"
      : period.angular
        ? "각(角)의 장"
        : null;
  return (
    <div
      className={`relative flex min-w-[92px] flex-col justify-between border px-2.5 pb-2.5 pt-3.5 ${
        current
          ? "border-gold bg-gradient-to-b from-gold/15 to-nebula/40 shadow-[0_0_22px_rgba(201,162,39,0.2)]"
          : "border-gold/20 bg-nebula/35"
      }`}
      style={{ flexGrow: years }}
    >
      {badge && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap border border-gold/50 bg-ink px-2 text-[10px] tracking-[0.08em] text-gold-soft">
          {badge}
        </span>
      )}
      <div>
        <p className={`font-display text-[15px] ${current ? "text-gold-soft" : "text-starlight"}`}>
          {period.sign.ko.replace("자리", "")}
        </p>
        <p className="mt-0.5 text-[11px] tracking-[0.05em] text-starlight-dim">{years}년</p>
      </div>
      <p className="mt-2 font-latin text-[11.5px] tracking-[0.1em] text-starlight-dim">
        {period.fromAge} – {period.toAge}
      </p>
    </div>
  );
}
