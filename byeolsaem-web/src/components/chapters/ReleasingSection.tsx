"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BirthMoment, Chart } from "@/lib/chart";
import { fractionalAge, zodiacalReleasing, type LotKey, type ZrPeriod } from "@/lib/time-lords";
import { SIGN_SYMBOL } from "@/lib/zodiac";

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
 * 조디악 릴리징 — 생의 성좌(L1) + 현재 장의 L2 스트립 + 범례.
 *
 * L1은 상자가 아니라 하나의 성좌다("생의 성좌" 컨셉, 2026-08-27 승인):
 * 장의 경계마다 별, 선분의 길이가 연수, "지금"은 선 위의 정확한 나이 위치에
 * 이중 링을 두른 별로 찍힌다 — 부적 카드의 성좌 그림과 같은 문법이다.
 *
 * 기본은 정신의 점(사람들이 가장 궁금해하는 커리어 질문). 토글은 세그먼티드
 * 컨트롤 + 방향 있는 스와이프(모션 패스), 상태는 컴포넌트 안에만 산다.
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
  const [shownLot, setShownLot] = useState<LotKey>("spirit");
  const [swap, setSwap] = useState<SwapPhase>("");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 첫 등장 — 성좌가 왼쪽부터 그려진다(선이 자라고 별이 따라 뜬다).
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
        인생 전체를 책처럼 몇 년짜리 장(章)으로 나눠 읽는 기법입니다. 첫 장은
        출생 차트의 {LOT_LABEL[shownLot].name}({zr.lotSign.ko})에서 열리고,
        별자리마다 정해진 연수만큼 한 장씩 이어집니다 — 지금이 몇 장인지,
        다음 장이 언제 열리는지를 봅니다.
      </p>

      {/* 점 토글 — 세그먼티드 컨트롤. 하이라이트가 두 칸 사이를 미끄러진다.
          grid-cols-2 + nowrap: 두 칸이 긴 쪽 라벨의 폭으로 같아져 줄바꿈이
          없다(2026-08-27 피드백). 좁은 화면에서는 점 이름만 남는다. */}
      <div
        className="relative mx-auto mt-8 grid w-fit grid-cols-2 border border-gold/40"
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
            className={`relative z-[1] whitespace-nowrap px-4 py-2 text-meta tracking-wide transition-[color,transform] duration-150 active:scale-[0.97] ${
              lot === key ? "text-gold-soft" : "text-starlight-dim hover:text-starlight"
            }`}
          >
            {LOT_LABEL[key].name}
            <span className="max-sm:hidden"> — {LOT_LABEL[key].scope}</span>
          </button>
        ))}
      </div>

      {/* 스와이프 무대 — 아래 내용 전체가 한 몸으로 밀리며 교체된다. */}
      <div className="overflow-x-clip">
        <div
          className={`transition-[transform,opacity,filter] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${swapClass}`}
        >
          {/* 생의 성좌 — 데스크톱은 가로, 좁은 화면은 세로로 흐른다. */}
          <div className="mt-10">
            <ChapterPath
              l1={zr.l1}
              current={zr.currentL1}
              age={age}
              entered={entered}
              vertical={false}
              className="hidden w-full sm:block"
            />
            <ChapterPath
              l1={zr.l1}
              current={zr.currentL1}
              age={age}
              entered={entered}
              vertical
              className="mx-auto w-full max-w-[340px] sm:hidden"
            />
          </div>

          {/* 현재 장의 L2 */}
          {zr.currentL1 && (
            <div className="mt-12">
              <h3 className="break-keep text-center font-display text-lg text-starlight">
                지금 장의 속살 — {zr.currentL1.sign.ko.replace("자리", "")}의 {zr.currentL1.toAge - zr.currentL1.fromAge}년
              </h3>
              <SubPath
                l2={zr.l2OfCurrent}
                current={zr.currentL2}
                entered={entered}
                vertical={false}
                className="hidden w-full sm:block"
              />
              <SubPath
                l2={zr.l2OfCurrent}
                current={zr.currentL2}
                entered={entered}
                vertical
                className="mx-auto w-full max-w-[340px] sm:hidden"
              />
              <p className="mt-4 text-center text-meta text-starlight-dim">
                위 성좌의 빛나는 선분을 곧게 펴서 확대한 것 — 달이 도는 작은 장(L2), 숫자는 만 나이
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

      {/* 범례 — 서양 용어 병기: 아는 사람에게는 다리가 되고, 처음 보는
          사람에게는 검색할 열쇠말이 된다(2026-08-28 피드백). */}
      <div className="mx-auto mt-10 grid max-w-[60ch] gap-2.5 text-guide text-starlight-dim">
        <p className="break-keep">
          <b className="font-medium text-gold-soft">각(角)의 장</b>
          <span className="text-meta"> · 앵귤러</span> — 행운의 점에서
          1·4·7번째 자리. 삶의 무대가 크게 움직이는 장으로 읽습니다.
        </p>
        <p className="break-keep">
          <b className="font-medium text-gold-soft">절정의 장</b>
          <span className="text-meta"> · 피크</span> — 행운의 점에서 열
          번째 자리. 이 시기의 일이 가장 멀리까지 보이는 장입니다.
        </p>
        <p className="break-keep">
          <b className="font-medium text-gold-soft">매듭 풀림</b>
          <span className="text-meta"> · 루싱 오브 본드</span> — 작은 장이 출발
          자리로 되돌아오는 순간 맞은편 자리로 건너뜁니다. 흐름이 한 번 꺾이는
          지점입니다.
        </p>
      </div>
    </section>
  );
}

const ASTRO_FONT = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "Noto Sans Symbols", sans-serif';

/**
 * 지금 장의 속살 — 위 성좌의 현재 선분을 곧게 펴서 확대한 직선.
 *
 * 정거장은 등간격이다: L2에서 정보는 차례이지 비례가 아니고(대체 전의 표도
 * 등폭이었다), 비례로 그리면 8개월짜리 작은 장의 라벨이 설 자리가 없다.
 * 양 끝의 큰 별 = 성좌의 두 경계 별. 현재 작은 장은 이중 링, 매듭 풀림으로
 * 건너뛴 자리는 앞 구간이 점선이 된다.
 */
function SubPath({
  l2,
  current,
  entered,
  vertical,
  className,
}: {
  l2: ZrPeriod[];
  current: ZrPeriod | null;
  entered: boolean;
  vertical: boolean;
  className?: string;
}) {
  const n = l2.length;
  if (n === 0) return null;
  const curIdx = current ? l2.indexOf(current) : -1;

  const W = vertical ? 320 : 900;
  const H = vertical ? 40 + n * 42 : 190;
  const LINE = vertical ? 84 : 96;
  const M0 = vertical ? 26 : 44;
  const M1 = vertical ? H - 26 : W - 44;
  const stop = (i: number): [number, number] => {
    const main = n === 1 ? (M0 + M1) / 2 : M0 + ((M1 - M0) * i) / (n - 1);
    return vertical ? [LINE, main] : [main, LINE];
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={`${className ?? ""} transition-opacity duration-500 ease-out motion-reduce:opacity-100 motion-reduce:transition-none`}
      style={{ transitionDelay: "600ms", opacity: entered ? 1 : 0 }}
      role="img"
      aria-label="현재 장의 작은 장들"
    >
      {/* 구간 선 — 매듭 풀림으로 건너뛴 자리 앞은 점선. */}
      {l2.slice(1).map((p, i) => {
        const [x1, y1] = stop(i);
        const [x2, y2] = stop(i + 1);
        return (
          <line
            key={p.fromAge}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="rgba(227,197,104,0.5)"
            strokeWidth={1.6}
            strokeDasharray={p.loosedBond ? "3 5" : undefined}
          />
        );
      })}

      {/* 정거장 별과 라벨 */}
      {l2.map((p, i) => {
        const [x, y] = stop(i);
        const cur = i === curIdx;
        const edge = i === 0 || i === n - 1;
        const up = i % 2 === 0;
        const range = `${p.fromAge.toFixed(1)} – ${p.toAge.toFixed(1)}`;
        return (
          <g key={p.fromAge} textAnchor={vertical ? "start" : "middle"}>
            {cur && (
              <circle cx={x} cy={y} r={9} fill="none" stroke="var(--color-gold-soft)" strokeWidth={1.1} className="star-breathe" />
            )}
            <circle
              cx={x}
              cy={y}
              r={cur ? 4.6 : edge ? 4.4 : 3.2}
              fill={cur ? "var(--color-gold-soft)" : "var(--color-starlight)"}
              opacity={cur || edge ? 1 : 0.75}
            />
            {vertical ? (
              <>
                <text x={x + 22} y={y - 1} fill={cur ? "var(--color-gold-soft)" : "var(--color-starlight)"} fontSize={12.5} style={{ fontFamily: "var(--font-display)" }}>
                  {p.sign.ko.replace("자리", "")}
                </text>
                <text x={x + 22} y={y + 13} fill="rgba(154,150,168,0.85)" fontSize={9.5} style={{ fontFamily: "var(--font-latin)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>
                  {range}
                </text>
                {p.loosedBond && (
                  <text x={x - 14} y={y + 3.5} textAnchor="end" fill="var(--color-gold)" fontSize={9} style={{ letterSpacing: "0.06em" }}>
                    매듭 풀림
                  </text>
                )}
              </>
            ) : (
              <>
                <text x={x} y={up ? y - 30 : y + 27} fill={cur ? "var(--color-gold-soft)" : "var(--color-starlight)"} fontSize={12} style={{ fontFamily: "var(--font-display)" }}>
                  {p.sign.ko.replace("자리", "")}
                </text>
                <text x={x} y={up ? y - 17 : y + 40} fill="rgba(154,150,168,0.85)" fontSize={9.5} style={{ fontFamily: "var(--font-latin)", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                  {range}
                </text>
                {p.loosedBond && (
                  <text x={x} y={up ? y - 44 : y + 54} fill="var(--color-gold)" fontSize={9} style={{ letterSpacing: "0.06em" }}>
                    매듭 풀림
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** 성좌처럼 살짝 꺾이는 결정론적 오프셋 — 무작위면 렌더마다 그림이 흔들린다. */
const WOBBLE = [18, -22, 12, -16, 20, -12, 16, -18, 14];

/**
 * 생의 성좌. 장의 경계가 별, 선분이 장이다. 각의 장은 선분이 밝고, "지금"은
 * 현재 장 선분 위 정확한 나이 위치에 이중 링(성좌 그림에서 가장 밝은 별의
 * 문법)으로 찍힌다. 첫 등장 때 선이 왼쪽(위)부터 자라며 별이 따라 뜬다.
 */
function ChapterPath({
  l1,
  current,
  age,
  entered,
  vertical,
  className,
}: {
  l1: ZrPeriod[];
  current: ZrPeriod | null;
  age: number;
  entered: boolean;
  vertical: boolean;
  className?: string;
}) {
  const total = l1[l1.length - 1].toAge;
  const n = l1.length;
  const W = vertical ? 320 : 900;
  const H = vertical ? 90 * n : 250;
  const M0 = vertical ? 26 : 34;
  const M1 = vertical ? H - 26 : W - 34;
  const AXIS = vertical ? 96 : 125;

  const pos = (a: number) => M0 + (M1 - M0) * (a / total);
  const node = (i: number): [number, number] => {
    const main = pos(l1[i] ? l1[i].fromAge : total);
    const off = AXIS + WOBBLE[i % WOBBLE.length] * (vertical ? 0.8 : 1);
    return vertical ? [off, main] : [main, off];
  };
  const bounds = [...l1.map((p) => p.fromAge), total];
  const nodes = bounds.map((_, i) =>
    i < n ? node(i) : (vertical
      ? [AXIS + WOBBLE[n % WOBBLE.length] * 0.8, pos(total)]
      : [pos(total), AXIS + WOBBLE[n % WOBBLE.length]]) as [number, number],
  );

  const curIdx = current ? l1.indexOf(current) : -1;
  // "지금" 별 — 현재 장 선분 위를 나이 비율로 보간.
  let nowPt: [number, number] | null = null;
  if (curIdx >= 0) {
    const [x1, y1] = nodes[curIdx];
    const [x2, y2] = nodes[curIdx + 1];
    const f = (age - l1[curIdx].fromAge) / (l1[curIdx].toAge - l1[curIdx].fromAge);
    nowPt = [x1 + (x2 - x1) * f, y1 + (y2 - y1) * f];
  }

  const seg = (i: number) => {
    const [x1, y1] = nodes[i];
    const [x2, y2] = nodes[i + 1];
    return { x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) };
  };
  const STEP = 140;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="인생의 장 타임라인">
      {/* 선분(장) — 왼쪽부터 순서대로 그려진다. */}
      {l1.map((p, i) => {
        const s = seg(i);
        const cur = i === curIdx;
        return (
          <line
            key={p.fromAge}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={cur ? "var(--color-gold-soft)" : p.angular || p.peak ? "rgba(201,162,39,0.85)" : "rgba(201,162,39,0.45)"}
            strokeWidth={cur ? 2.2 : 1.4}
            strokeDasharray={s.len}
            strokeDashoffset={entered ? 0 : s.len}
            className="transition-[stroke-dashoffset] duration-[450ms] ease-out motion-reduce:transition-none motion-reduce:[stroke-dashoffset:0]"
            style={{ transitionDelay: `${i * STEP}ms` }}
          />
        );
      })}

      {/* 경계 별과 경계 나이 */}
      {nodes.map(([x, y], i) => (
        <g
          key={i}
          className="transition-opacity duration-300 ease-out motion-reduce:opacity-100 motion-reduce:transition-none"
          style={{ transitionDelay: `${i * STEP + 120}ms`, opacity: entered ? 1 : 0 }}
        >
          <circle cx={x} cy={y} r={4.4} fill="var(--color-starlight)" />
          <text
            x={vertical ? x - 16 : x}
            y={vertical ? y + 4 : y + (WOBBLE[i % WOBBLE.length] > 0 ? 21 : -13)}
            textAnchor={vertical ? "end" : "middle"}
            fill="rgba(154,150,168,0.8)"
            fontSize={11}
            style={{ fontFamily: "var(--font-latin)", letterSpacing: "0.08em" }}
          >
            {bounds[i]}
          </text>
        </g>
      ))}

      {/* 장 라벨 — 선분 중앙에서 위아래(좌우) 교대 */}
      {l1.map((p, i) => {
        const s = seg(i);
        const mx = (s.x1 + s.x2) / 2;
        const my = (s.y1 + s.y2) / 2;
        const cur = i === curIdx;
        const tone = cur ? "var(--color-gold-soft)" : "var(--color-starlight)";
        const badge = cur
          ? `지금 · ${Math.floor(age - p.fromAge) + 1}년째`
          : p.peak
            ? "절정의 장"
            : i === 0
              ? "제1장 · 점의 자리"
              : p.angular
                ? "각(角)의 장"
                : null;
        const label = `${p.sign.ko.replace("자리", "")} · ${p.toAge - p.fromAge}년`;
        if (vertical) {
          return (
            <g
              key={p.fromAge}
              className="transition-opacity duration-300 ease-out motion-reduce:opacity-100 motion-reduce:transition-none"
              style={{ transitionDelay: `${i * STEP + 200}ms`, opacity: entered ? 1 : 0 }}
            >
              <text x={mx + 34} y={my - 4} fill={cur ? "var(--color-gold-soft)" : "rgba(227,197,104,0.7)"} fontSize={13} style={{ fontFamily: ASTRO_FONT }}>
                {SIGN_SYMBOL[p.sign.key]}
                {"\uFE0E"}
              </text>
              <text x={mx + 54} y={my - 4} fill={tone} fontSize={12.5} style={{ fontFamily: "var(--font-display)" }}>
                {label}
              </text>
              {badge && (
                <text x={mx + 34} y={my + 14} fill="var(--color-gold)" fontSize={9.5} style={{ letterSpacing: "0.06em" }}>
                  {badge}
                </text>
              )}
            </g>
          );
        }
        const up = i % 2 === 0;
        const ly = my + (up ? -46 : 46);
        return (
          <g
            key={p.fromAge}
            textAnchor="middle"
            className="transition-opacity duration-300 ease-out motion-reduce:opacity-100 motion-reduce:transition-none"
            style={{ transitionDelay: `${i * STEP + 200}ms`, opacity: entered ? 1 : 0 }}
          >
            <line
              x1={mx}
              y1={my + (up ? -9 : 9)}
              x2={mx}
              y2={ly + (up ? 6 : -12)}
              stroke="rgba(201,162,39,0.18)"
              strokeWidth={1}
            />
            <text x={mx} y={ly} fill={cur ? "var(--color-gold-soft)" : "rgba(227,197,104,0.7)"} fontSize={15} style={{ fontFamily: ASTRO_FONT }}>
              {SIGN_SYMBOL[p.sign.key]}
              {"\uFE0E"}
            </text>
            <text x={mx} y={ly + 19} fill={tone} fontSize={13.5} style={{ fontFamily: "var(--font-display)" }}>
              {label}
            </text>
            {badge && (
              <text x={mx} y={ly + 35} fill="var(--color-gold)" fontSize={10} style={{ letterSpacing: "0.08em" }}>
                {badge}
              </text>
            )}
          </g>
        );
      })}

      {/* "지금" — 이중 링을 두른 별. 성좌가 다 그려진 뒤 마지막에 뜬다. */}
      {nowPt && (
        <g
          className="transition-opacity duration-400 ease-out motion-reduce:opacity-100 motion-reduce:transition-none"
          style={{ transitionDelay: `${n * STEP + 250}ms`, opacity: entered ? 1 : 0 }}
        >
          <circle cx={nowPt[0]} cy={nowPt[1]} r={10} fill="none" stroke="var(--color-gold-soft)" strokeWidth={1.1} className="star-breathe" />
          <circle cx={nowPt[0]} cy={nowPt[1]} r={4.8} fill="var(--color-gold-soft)" />
        </g>
      )}
    </svg>
  );
}
