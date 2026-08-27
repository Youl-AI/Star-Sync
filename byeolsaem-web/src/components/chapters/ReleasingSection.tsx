"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BirthMoment, Chart } from "@/lib/chart";
import { fractionalAge, zodiacalReleasing, type LotKey, type ZrPeriod } from "@/lib/time-lords";

const LOT_LABEL: Record<LotKey, { name: string; scope: string }> = {
  spirit: { name: "정신의 점", scope: "커리어와 행동의 장" },
  fortune: { name: "행운의 점", scope: "몸과 환경의 장" },
};

/** 현재 장의 풀이 — 장 유형 프레임 x 자리 원자(tagline) 한 줄 인용(스펙 §3.3). */
function chapterFrame(period: ZrPeriod): string {
  if (period.peak)
    return "행운의 점에서 열 번째 자리 — 이 장에서 하는 일이 가장 멀리까지 보이는 절정의 장입니다.";
  if (period.angular)
    return "행운의 점에서 모난 자리 — 삶의 무대가 크게 움직이는 장입니다.";
  return "모난 자리 사이의 장 — 무대가 바뀌기보다, 지난 장이 벌인 일을 살아 내는 시간입니다.";
}

/** 토글 전환 중의 스와이프 상태. out-*는 나가는 중, in-*은 들어올 준비 자세. */
type SwapPhase = "" | "out-left" | "out-right" | "in-left" | "in-right";

const SWAP_MS = 300;

/**
 * 조디악 릴리징 — L1 타임라인 + 현재 장의 L2 스트립 + 범례(프리뷰 승인본).
 * 기본은 정신의 점(사람들이 가장 궁금해하는 커리어 질문). 토글은 컴포넌트
 * 상태만 — URL·저장 없음(스펙 §3.3).
 *
 * 토글은 세그먼티드 컨트롤이다(2026-08-27 모션 패스). 금색 하이라이트가
 * 미끄러지고, 아래 내용이 같은 방향으로 밀리며 교체된다. 나가는 쪽에 blur를
 * 살짝 얹어 두 상태가 겹쳐 보이는 크로스페이드의 이음새를 가린다.
 * reduced-motion에서는 즉시 교체된다.
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
  // lot은 컨트롤(하이라이트·aria)의 상태, shownLot은 실제 그려진 내용의 상태.
  // 전환 중에는 둘이 잠시 어긋난다 — 컨트롤은 먼저 가고 내용이 뒤따른다.
  const [lot, setLot] = useState<LotKey>("spirit");
  const [shownLot, setShownLot] = useState<LotKey>("spirit");
  const [swap, setSwap] = useState<SwapPhase>("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 계산 결과의 첫 등장 스태거(모션 패스 02). 마운트 후 한 번만 —
  // 토글 전환의 스와이프와 겹치지 않는다.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const zr = useMemo(
    () => zodiacalReleasing(natal, chart, shownLot, now),
    [natal, chart, shownLot, now],
  );
  if (!zr) return null;
  const age = fractionalAge(natal.date, now);

  const switchLot = (next: LotKey) => {
    if (next === lot || swap !== "") return;
    setLot(next);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShownLot(next);
      return;
    }
    const dir = next === "fortune" ? "left" : "right";
    setSwap(`out-${dir}`);
    timer.current = window.setTimeout(() => {
      setShownLot(next);
      setSwap(`in-${dir}`);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setSwap("")),
      );
    }, SWAP_MS);
  };

  const swapClass =
    swap === "out-left"
      ? "-translate-x-7 opacity-0 blur-[2px]"
      : swap === "out-right"
        ? "translate-x-7 opacity-0 blur-[2px]"
        : swap === "in-left"
          ? "translate-x-7 opacity-0 transition-none"
          : swap === "in-right"
            ? "-translate-x-7 opacity-0 transition-none"
            : "translate-x-0 opacity-100";

  return (
    <section className="mt-24">
      <h2 className="break-keep text-center font-display text-2xl text-starlight">인생의 장</h2>
      <p className="mt-2 text-center font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
        ZODIACAL RELEASING
      </p>
      <p className="mx-auto mt-6 max-w-[56ch] break-keep text-center text-guide text-starlight-dim">
        {LOT_LABEL[shownLot].name}({zr.lotSign.ko})에서 출발해, 별자리마다 정해진
        연수만큼 인생을 장으로 나눕니다. 행운의 점에서 모난 자리의 장은 굵은
        사건의 장으로, 열 번째 자리의 장은 절정의 장으로 읽습니다.
      </p>

      {/* 점 토글 — 세그먼티드 컨트롤. 하이라이트가 두 칸 사이를 미끄러진다. */}
      <div
        className="relative mx-auto mt-8 flex w-fit border border-gold/40"
        role="group"
        aria-label="릴리징 기준점"
      >
        <div
          aria-hidden
          className={`absolute inset-y-0 left-0 -ml-px w-1/2 border-x border-gold bg-gold/15 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
            lot === "fortune" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        {(Object.keys(LOT_LABEL) as LotKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => switchLot(key)}
            aria-pressed={lot === key}
            className={`relative z-[1] flex-1 break-keep px-4 py-2 text-meta tracking-wide transition-[color,transform] duration-150 active:scale-[0.97] ${
              lot === key ? "text-gold-soft" : "text-starlight-dim hover:text-starlight"
            }`}
          >
            {LOT_LABEL[key].name} — {LOT_LABEL[key].scope}
          </button>
        ))}
      </div>

      {/* 스와이프 무대 — 아래 내용 전체가 한 몸으로 밀리며 교체된다. */}
      <div className="overflow-x-clip">
        <div
          className={`transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${swapClass}`}
        >
          {/* L1 타임라인 — 장 폭은 연수에 비례 */}
          <div className="mt-12 flex flex-wrap gap-x-1 gap-y-6">
            {zr.l1.map((p, i) => (
              <ChapterCell
                key={p.fromAge}
                period={p}
                current={p === zr.currentL1}
                age={age}
                first={i === 0}
                entered={entered}
                index={i}
              />
            ))}
          </div>

          {/* 현재 장의 L2 */}
          {zr.currentL1 && (
            <div className="mt-12">
              <h3 className="break-keep text-center font-display text-lg text-starlight">
                지금 장의 속살 — {zr.currentL1.sign.ko.replace("자리", "")}의 {zr.currentL1.toAge - zr.currentL1.fromAge}년
              </h3>
              <div className="mt-5 grid gap-1 [grid-template-columns:repeat(auto-fit,minmax(72px,1fr))]">
                {zr.l2OfCurrent.map((p) => (
                  <div
                    key={p.fromAge}
                    className={`border px-1 py-2.5 text-center text-[12px] leading-normal transition-colors duration-150 ${
                      p === zr.currentL2
                        ? "border-gold bg-gold/10 text-gold-soft"
                        : "border-gold/15 bg-nebula/30 text-starlight-dim hover:border-gold/40"
                    }`}
                  >
                    {p.loosedBond && (
                      <span className="mb-0.5 block text-[10px] tracking-[0.08em] text-gold">매듭 풀림</span>
                    )}
                    {p.sign.ko.replace("자리", "")}
                    <small className="mt-0.5 block text-[10px] tabular-nums tracking-[0.04em]">
                      {p.fromAge.toFixed(1)} – {p.toAge.toFixed(1)}
                    </small>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-meta text-starlight-dim">
                긴 장 안에서 달이 도는 작은 장(L2) — 숫자는 만 나이
              </p>
              <div className="mx-auto mt-8 max-w-[56ch] text-center">
                <p className="break-keep leading-relaxed text-starlight">
                  지금은 {zr.currentL1.sign.ko}의 장 — {zr.currentL1.sign.tagline}의
                  시간입니다. {chapterFrame(zr.currentL1)}
                </p>
                {zr.currentL2 && (
                  <p className="mt-3 break-keep text-guide text-starlight-dim">
                    그 안의 작은 장은 지금 {zr.currentL2.sign.ko}를 지나고 있습니다.
                    {zr.currentL2.loosedBond &&
                      " 이 작은 장은 매듭 풀림으로 건너뛰어 시작되었습니다 — 흐름이 한 번 꺾인 자리입니다."}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

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

function ChapterCell({
  period,
  current,
  age,
  first,
  entered,
  index,
}: {
  period: ZrPeriod;
  current: boolean;
  age: number;
  first: boolean;
  /** 첫 등장 스태거 — false에서 true로 한 번만 바뀐다. */
  entered: boolean;
  index: number;
}) {
  const years = period.toAge - period.fromAge;
  const badge = current
    ? `지금 · ${Math.floor(age - period.fromAge) + 1}년째`
    : period.peak
      ? "절정의 장"
      : first
        ? "제1장 · 점의 자리"
        : period.angular
          ? "각(角)의 장"
          : null;
  return (
    <div
      className={`relative flex min-w-[92px] basis-0 flex-col justify-between border px-2.5 pb-2.5 pt-3.5 transition-[opacity,transform,border-color,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 ${
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      } ${
        current
          ? "border-gold bg-gradient-to-b from-gold/15 to-nebula/40 shadow-[0_0_22px_rgba(201,162,39,0.2)]"
          : "border-gold/20 bg-nebula/35 hover:border-gold/50 hover:bg-nebula/60"
      }`}
      style={{
        flexGrow: years,
        // 스태거는 등장(opacity·transform)에만 — 호버의 색 전환은 즉시.
        transitionDelay: `${index * 60}ms, ${index * 60}ms, 0ms, 0ms`,
        transitionDuration: "500ms, 500ms, 150ms, 150ms",
      }}
    >
      {badge && (
        <span
          className={`absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap border border-gold/50 bg-ink px-2 text-[10px] tracking-[0.08em] text-gold-soft ${
            current ? "badge-breathe" : ""
          }`}
        >
          {badge}
        </span>
      )}
      <div>
        <p className={`font-display text-[15px] ${current ? "text-gold-soft" : "text-starlight"}`}>
          {period.sign.ko.replace("자리", "")}
        </p>
        <p className="mt-0.5 text-[11px] tracking-[0.05em] text-starlight-dim">{years}년</p>
      </div>
      <p className="mt-2 font-latin text-[11.5px] tabular-nums tracking-[0.1em] text-starlight-dim">
        {period.fromAge} – {period.toAge}
      </p>
    </div>
  );
}
