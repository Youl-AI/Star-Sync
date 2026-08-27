"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { BirthMoment, Chart } from "@/lib/chart";
import {
  fractionalAge,
  l2PeriodsOf,
  zodiacalReleasing,
  type LotKey,
  type ZodiacalReleasing,
  type ZrPeriod,
} from "@/lib/time-lords";
import { SIGN_SYMBOL, ZODIAC_SIGNS } from "@/lib/zodiac";

/** "2028-01-15" -> "2028. 1" — 소수 나이 대신 사람의 달력으로 말한다. */
const yearMonth = (iso: string): string => {
  const [y, m] = iso.split("-");
  return `${y}. ${Number(m)}`;
};

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

  // 작은 장들을 들여다볼 장. null = 지금 장을 따라간다. 이전/다음 화살표로 평생치를
  // 넘겨 볼 수 있다(2026-08-28 — 다른 도구들은 전 생애 L2를 훑을 수 있다).
  const [selIdx, setSelIdx] = useState<number | null>(null);

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
  // 반대쪽 점의 시간표 — 이야기 요약이 "다른 시간표의 큰 전환"까지 말해 준다
  // (2026-08-28 피드백: 제일 가까운 큰 뉴스가 반대 토글에 숨어 있으면 못 본다).
  const otherLot: LotKey = shownLot === "spirit" ? "fortune" : "spirit";
  const zrOther = useMemo(
    () => zodiacalReleasing(natal, chart, otherLot, now),
    [natal, chart, otherLot, now],
  );
  if (!zr) return null;
  const age = fractionalAge(natal.date, now);

  // 들여다볼 장 — 선택이 없으면 지금 장. 순수 산술이라 memo가 필요 없다.
  const browsedL1 =
    selIdx !== null ? zr.l1[Math.max(0, Math.min(selIdx, zr.l1.length - 1))] : zr.currentL1;
  const browsingCurrent = browsedL1 === zr.currentL1;
  const browsedL2 = !browsedL1
    ? []
    : browsingCurrent
      ? zr.l2OfCurrent
      : l2PeriodsOf(natal.date, browsedL1, zr.fortuneSignIndex);
  const browsedIdx = browsedL1 ? zr.l1.indexOf(browsedL1) : -1;

  const switchLot = (next: LotKey) => {
    if (next === lot || swap !== "") return;
    setLot(next);
    setSelIdx(null); // 다른 시간표로 넘어가면 들여다보는 장도 그쪽의 지금 장부터.
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

      {/* 스와이프 무대 — 아래 내용 전체가 한 몸으로 밀리며 교체된다.
          lg에서는 본문 폭(max-w-2xl)을 살짝 벗어나 그림에 숨통을 준다 —
          글 블록들은 각자 max-w로 스스로 좁힌다. */}
      <div className="overflow-x-clip lg:-mx-24">
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
          <p className="mt-3 text-center text-meta text-starlight-dim">
            선분 하나가 인생의 한 장, 길이는 그 장의 햇수 — 작은 숫자는 장이 열리는 만 나이입니다
          </p>

          {/* 장 안의 작은 장들 — 화살표로 어느 장이든 넘겨 볼 수 있다. */}
          {browsedL1 && (
            <div className="mt-12">
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelIdx(browsedIdx - 1)}
                  disabled={browsedIdx <= 0}
                  aria-label="이전 장의 작은 장들 보기"
                  className="px-2 font-latin text-xl text-starlight-dim transition-[color,transform] duration-150 hover:text-gold-soft active:scale-[0.97] disabled:pointer-events-none disabled:opacity-25"
                >
                  ‹
                </button>
                <h3 className="break-keep text-center font-display text-lg text-starlight">
                  {browsingCurrent ? "지금 장" : `${browsedIdx + 1}번째 장`} 안의 작은 장들 —{" "}
                  {browsedL1.sign.ko.replace("자리", "")}의 {browsedL1.toAge - browsedL1.fromAge}년
                  <span className="ml-2 whitespace-nowrap text-meta tabular-nums text-starlight-dim">
                    {yearMonth(browsedL1.from)} – {yearMonth(browsedL1.to)}
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={() => setSelIdx(browsedIdx + 1)}
                  disabled={browsedIdx >= zr.l1.length - 1}
                  aria-label="다음 장의 작은 장들 보기"
                  className="px-2 font-latin text-xl text-starlight-dim transition-[color,transform] duration-150 hover:text-gold-soft active:scale-[0.97] disabled:pointer-events-none disabled:opacity-25"
                >
                  ›
                </button>
              </div>
              {!browsingCurrent && (
                <>
                  {/* 구경 중인 장의 한 줄 요약 — 어느 시절이고 어떤 성격의 장인지. */}
                  <p className="mx-auto mt-3 max-w-[56ch] break-keep text-center text-guide text-starlight-dim">
                    만 {browsedL1.fromAge}세부터 {browsedL1.toAge}세까지,{" "}
                    {browsedL1.sign.tagline}의 시간 — {chapterFrame(browsedL1)}
                  </p>
                  <p className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setSelIdx(null)}
                      className="text-meta text-gold-soft underline underline-offset-4 transition-colors hover:text-starlight"
                    >
                      지금 장으로 돌아가기
                    </button>
                  </p>
                </>
              )}
              <SubPath
                l2={browsedL2}
                current={browsingCurrent ? zr.currentL2 : null}
                entered={entered}
                vertical={false}
                className="hidden w-full sm:block"
              />
              <SubPath
                l2={browsedL2}
                current={browsingCurrent ? zr.currentL2 : null}
                entered={entered}
                vertical
                className="mx-auto w-full max-w-[340px] sm:hidden"
              />
              <p className="mt-4 text-center text-meta text-starlight-dim">
                별 하나가 달이 도는 작은 장, 날짜는 그 작은 장이 열리는 때 — 각·절정
                규칙은 작은 장에도 그대로라, 금테를 두른 별이 절정의 자리입니다
              </p>
              {zr.currentL1 && (
                <div className="mx-auto mt-8 max-w-[56ch] text-center">
                  <p className="break-keep leading-relaxed text-starlight">
                    지금은 {zr.currentL1.sign.ko}의 장 — {zr.currentL1.sign.tagline}의
                    시간입니다. {chapterFrame(zr.currentL1)}
                  </p>
                  {zr.currentL2 &&
                    (() => {
                      const nowL1 = zr.currentL1;
                      const next = zr.l2OfCurrent[zr.l2OfCurrent.indexOf(zr.currentL2) + 1];
                      const nextL1 = zr.l1[zr.l1.indexOf(nowL1) + 1];
                      return (
                        <p className="mt-3 break-keep text-guide text-starlight-dim">
                          그 안에서 지금 지나는 작은 장은 {yearMonth(zr.currentL2.from)}에
                          열린 {zr.currentL2.sign.ko}입니다.
                          {next
                            ? ` ${yearMonth(next.from)}에 ${next.sign.ko}로 넘어갑니다.`
                            : nextL1
                              ? ` 마지막 작은 장이라, ${yearMonth(nextL1.from)}에는 ${nowL1.sign.ko}의 장 전체가 막을 내리고 ${nextL1.sign.ko}의 장이 새로 열립니다.`
                              : ""}
                          {zr.currentL2.loosedBond &&
                            " 이 작은 장은 매듭 풀림으로 건너뛰어 시작되었습니다 — 흐름이 한 번 꺾인 자리입니다."}
                        </p>
                      );
                    })()}
                </div>
              )}
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

      <StorySummary
        spirit={shownLot === "spirit" ? zr : zrOther}
        fortune={shownLot === "fortune" ? zr : zrOther}
        age={age}
      />
    </section>
  );
}

/**
 * 이야기로 읽기 — 위 그림의 조각들을 이야기로 엮는다(2026-08-28 피드백:
 * 조각은 다 있는데 엮어 주는 문단이 없어 처음 보는 사람이 길을 잃는다).
 * 두 시간표를 전부 풀어 준다 — 토글로 오르내리는 동선 없이 여기서 다
 * 읽히도록. 순서는 언제나 큰 뉴스부터: 지금 몇 번째 장을 몇 년째인가,
 * 다음에 무엇이 언제 오는가, 절정은 언제인가.
 */
function StorySummary({
  spirit,
  fortune,
  age,
}: {
  spirit: ZodiacalReleasing | null;
  fortune: ZodiacalReleasing | null;
  age: number;
}) {
  if (!spirit && !fortune) return null;
  return (
    <div className="mx-auto mt-14 max-w-[58ch] border-t border-gold/15 pt-10">
      <h3 className="break-keep text-center font-display text-lg text-starlight">이야기로 읽기</h3>
      {spirit && <LotStory zr={spirit} age={age} />}
      {fortune && <LotStory zr={fortune} age={age} />}
    </div>
  );
}

/** 한 점(Lot)의 시간표를 세 문단의 이야기로. */
function LotStory({ zr, age }: { zr: ZodiacalReleasing; age: number }) {
  const cur = zr.currentL1;
  if (!cur) return null;
  const curIdx = zr.l1.indexOf(cur);
  const nextL1 = zr.l1[curIdx + 1];
  const yearsIn = Math.floor(age - cur.fromAge) + 1;
  const l2 = zr.currentL2;
  const nextL2 = l2 ? zr.l2OfCurrent[zr.l2OfCurrent.indexOf(l2) + 1] : undefined;

  // 절정의 장 — 목록에 없으면 100세 안에 오지 않는 것이다. 자리 이름은
  // 행운의 점 자리에서 아홉 칸 앞으로 세어 알아낸다.
  const peaks = zr.l1.filter((p) => p.peak);
  const futurePeak = peaks.find((p) => p.fromAge > age);
  const pastPeak = [...peaks].reverse().find((p) => p.toAge <= age);
  const first = zr.l1[0];
  const fortuneIdx =
    (((ZODIAC_SIGNS.indexOf(first.sign) - (first.houseFromFortune - 1)) % 12) + 12) % 12;
  const peakSignKo = ZODIAC_SIGNS[(fortuneIdx + 9) % 12].ko;

  const gold = "font-medium text-gold-soft";
  return (
    <div className="mt-8">
      <p className="text-center text-meta tracking-[0.12em] text-gold-soft">
        {LOT_LABEL[zr.lot].scope.replace("의 장", "")}의 시간표 — {LOT_LABEL[zr.lot].name}
      </p>
      <div className="mt-4 grid gap-4 break-keep leading-relaxed text-starlight-dim">
        <p>
          {curIdx === 0 ? (
            <>
              이 시간표의 1장은 태어나며 함께 열린{" "}
              <b className={gold}>{cur.sign.ko}의 장</b>
              ({cur.toAge - cur.fromAge}년)입니다. 올해로 {yearsIn}년째, 이 장은{" "}
              {yearMonth(cur.to)}까지 이어집니다 — 아직 첫 장 안을 걷는,{" "}
              {cur.sign.tagline}의 시간입니다.
            </>
          ) : (
            <>
              지금은 <b className={gold}>{yearMonth(cur.from)}</b>에 열린{" "}
              {curIdx + 1}번째 장, <b className={gold}>{cur.sign.ko}의 장</b>
              ({cur.toAge - cur.fromAge}년)의 {yearsIn}년째 —{" "}
              {cur.sign.tagline}의 시간입니다. 이 장은 {yearMonth(cur.to)}까지
              이어집니다.
            </>
          )}
          {l2 && (
            <>
              {" "}그 안의 작은 흐름은 {yearMonth(l2.from)}부터의 {l2.sign.ko}
              {l2.loosedBond && " — 매듭 풀림으로 건너뛰어 시작된, 흐름이 한 번 꺾인 자리"}
              입니다.
            </>
          )}
        </p>
        <p>
          다음에 올 일:{" "}
          {nextL2 && (
            <>
              <b className={gold}>{yearMonth(nextL2.from)}</b>에 작은 흐름이{" "}
              {nextL2.sign.ko}로 넘어가고,{" "}
            </>
          )}
          {nextL1 ? (
            <>
              <b className={gold}>{yearMonth(nextL1.from)}</b>에는{" "}
              {cur.sign.ko}의 장 전체가 막을 내리고{" "}
              <b className={gold}>{nextL1.sign.ko}의 장</b>
              ({nextL1.toAge - nextL1.fromAge}년)이 새로 열립니다
              {nextL1.peak
                ? " — 그 장이 바로 절정의 장입니다"
                : nextL1.angular
                  ? " — 삶의 무대가 크게 움직이는 각(角)의 장입니다"
                  : ""}
              .
            </>
          ) : (
            <>이 장이 시간표의 마지막 장입니다.</>
          )}
        </p>
        <p>
          {cur.peak ? (
            <>
              그리고 지금 이 장이 바로 <b className={gold}>절정의 장</b>입니다 —
              여기서 하는 일이 가장 멀리까지 보입니다.
            </>
          ) : futurePeak ? (
            <>
              이 시간표의 <b className={gold}>절정의 장</b>은{" "}
              <b className={gold}>{yearMonth(futurePeak.from)}</b>에 열리는{" "}
              {futurePeak.sign.ko}의 장(만 {futurePeak.fromAge}세부터{" "}
              {futurePeak.toAge}세까지)입니다.
            </>
          ) : pastPeak ? (
            <>
              절정의 장({pastPeak.sign.ko})은 만 {pastPeak.fromAge}세부터{" "}
              {pastPeak.toAge}세까지 — 이미 지나왔습니다. 이제는 그 시절에 심은
              것을 거두는 순서입니다.
            </>
          ) : (
            <>
              절정의 장({peakSignKo})은 100세 안에 오지 않는 시간표입니다 —
              대신 각(角)의 장들이 삶의 굵은 마디가 됩니다.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

const ASTRO_FONT = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "Noto Sans Symbols", sans-serif';

/**
 * 장 안의 작은 장들 — 위 성좌의 현재 선분을 곧게 펴서 확대한 직선.
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
  const H = vertical ? 40 + n * 46 : 230;
  const LINE = vertical ? 84 : 112;
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
        // 소수 나이("28.3")는 사람 말이 아니다 — 그 작은 장이 열리는 달력으로.
        const opens = yearMonth(p.from);
        return (
          <g key={p.fromAge} textAnchor={vertical ? "start" : "middle"}>
            {cur && (
              <circle cx={x} cy={y} r={10.5} fill="none" stroke="var(--color-gold-soft)" strokeWidth={1.1} className="star-breathe" />
            )}
            {/* 절정의 작은 장 — 정적 금테(숨쉬는 링은 "지금" 전용). */}
            {p.peak && !cur && (
              <circle cx={x} cy={y} r={8.5} fill="none" stroke="var(--color-gold)" strokeWidth={1} opacity={0.75} />
            )}
            <circle
              cx={x}
              cy={y}
              r={cur ? 5.2 : edge ? 4.8 : 3.8}
              fill={
                cur
                  ? "var(--color-gold-soft)"
                  : p.angular || p.peak
                    ? "var(--color-gold-soft)"
                    : "var(--color-starlight)"
              }
              opacity={cur || edge || p.angular || p.peak ? 1 : 0.75}
            />
            {vertical ? (
              <>
                <text x={x + 24} y={y} fill={cur ? "var(--color-gold-soft)" : "var(--color-starlight)"} fontSize={14} style={{ fontFamily: "var(--font-display)" }}>
                  {p.sign.ko.replace("자리", "")}
                </text>
                <text x={x + 24} y={y + 16} fill="rgba(154,150,168,0.85)" fontSize={11} style={{ fontFamily: "var(--font-latin)", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }}>
                  {opens}
                </text>
                {cur && (
                  <text x={x - 16} y={y - 10} textAnchor="end" fill="var(--color-gold)" fontSize={10.5} style={{ letterSpacing: "0.08em" }}>
                    지금
                  </text>
                )}
                {p.loosedBond && (
                  <text x={x - 16} y={y + 5} textAnchor="end" fill="var(--color-gold)" fontSize={10} style={{ letterSpacing: "0.06em" }}>
                    매듭 풀림
                  </text>
                )}
              </>
            ) : (
              <>
                <text x={x} y={up ? y - 33 : y + 30} fill={cur ? "var(--color-gold-soft)" : "var(--color-starlight)"} fontSize={14.5} style={{ fontFamily: "var(--font-display)" }}>
                  {p.sign.ko.replace("자리", "")}
                </text>
                <text x={x} y={up ? y - 18 : y + 46} fill="rgba(154,150,168,0.85)" fontSize={11.5} style={{ fontFamily: "var(--font-latin)", letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}>
                  {opens}
                </text>
                {cur && (
                  <text x={x} y={up ? y + 30 : y - 20} fill="var(--color-gold)" fontSize={11} style={{ letterSpacing: "0.1em" }}>
                    지금
                  </text>
                )}
                {p.loosedBond && (
                  <text x={x} y={up ? y - 50 : y + 62} fill="var(--color-gold)" fontSize={10.5} style={{ letterSpacing: "0.06em" }}>
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

/**
 * 생의 성좌. 장의 경계가 별, 선분이 장이다. 각의 장은 선분이 밝고, "지금"은
 * 현재 장 선분 위 정확한 나이 위치에 이중 링(성좌 그림에서 가장 밝은 별의
 * 문법)으로 찍힌다. 첫 등장 때 선이 왼쪽(위)부터 자라며 별이 따라 뜬다.
 *
 * 선은 일직선이다. 처음에는 성좌처럼 위아래로 꺾었는데, 높낮이가 없는
 * 정보인데도 상승장/하락장처럼 읽혔다(2026-08-28 실사용 보고). 뜻 없는
 * 높낮이가 뜻으로 오독되면 장식이 아니라 결함이다.
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
  const H = vertical ? 90 * n : 216;
  const M0 = vertical ? 26 : 34;
  const M1 = vertical ? H - 26 : W - 34;
  const AXIS = vertical ? 92 : 112;

  const pos = (a: number) => M0 + (M1 - M0) * (a / total);
  const bounds = [...l1.map((p) => p.fromAge), total];
  const nodes = bounds.map(
    (b): [number, number] => (vertical ? [AXIS, pos(b)] : [pos(b), AXIS]),
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
            y={vertical ? y + 4 : y + 23}
            textAnchor={vertical ? "end" : "middle"}
            fill="rgba(154,150,168,0.8)"
            fontSize={12}
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
              <text x={mx + 32} y={my - 4} fill={cur ? "var(--color-gold-soft)" : "rgba(227,197,104,0.7)"} fontSize={15} style={{ fontFamily: ASTRO_FONT }}>
                {SIGN_SYMBOL[p.sign.key]}
                {"\uFE0E"}
              </text>
              <text x={mx + 55} y={my - 4} fill={tone} fontSize={14} style={{ fontFamily: "var(--font-display)" }}>
                {label}
              </text>
              {badge && (
                <text x={mx + 32} y={my + 15} fill="var(--color-gold)" fontSize={10.5} style={{ letterSpacing: "0.06em" }}>
                  {badge}
                </text>
              )}
            </g>
          );
        }
        const up = i % 2 === 0;
        const ly = my + (up ? -52 : 50);
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
              y2={ly + (up ? 8 : -14)}
              stroke="rgba(201,162,39,0.18)"
              strokeWidth={1}
            />
            <text x={mx} y={ly} fill={cur ? "var(--color-gold-soft)" : "rgba(227,197,104,0.7)"} fontSize={17} style={{ fontFamily: ASTRO_FONT }}>
              {SIGN_SYMBOL[p.sign.key]}
              {"\uFE0E"}
            </text>
            <text x={mx} y={ly + 21} fill={tone} fontSize={15} style={{ fontFamily: "var(--font-display)" }}>
              {label}
            </text>
            {badge && (
              <text x={mx} y={ly + 38} fill="var(--color-gold)" fontSize={11} style={{ letterSpacing: "0.08em" }}>
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
