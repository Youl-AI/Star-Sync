"use client";
import { useMemo } from "react";
import Link from "next/link";
import { nextLunations } from "@/lib/lunation";
import { PLANET_BY_KEY } from "@/lib/planets";
import { mercuryRetrogrades } from "@/lib/retrograde";
import { formatKstMonthDay, retrogradeStatus } from "@/lib/retrograde-clock";
import type { TodaySky } from "@/lib/today";

/**
 * 오늘 하늘의 나머지 — 열 행성의 자리표, 다가오는 삭망, 역행 카운트다운.
 *
 * 열 행성은 todaySky()가 이미 다 계산하는데 화면에는 달과 수성 역행 여부만
 * 나가고 있었다(정찰 2026-08-22). 첫 방문자에게도, "오늘 금성 어디"를 검색해
 * 온 사람에게도 여기가 답이 된다.
 *
 * 전부 시각을 쓰지 않는 정오 기준 값이라 개인 정보 없이 누구에게나 같다 —
 * 앞면 카드와 같은 원칙이다.
 */

/** 역행까지/역행 끝까지 카운트다운 띠. 사이트 전체에서 유일한 "내일 또 볼 숫자". */
export function RetroBand({ now }: { now: Date }) {
  const status = useMemo(() => {
    // 앞뒤로 넉넉히 — 진행 중인 구간을 놓치지 않으려면 과거도 조금 본다.
    const from = new Date(now.getTime() - 120 * 86400000);
    const to = new Date(now.getTime() + 540 * 86400000);
    return retrogradeStatus(mercuryRetrogrades(from, to), now);
  }, [now]);

  if (status.state === "unknown") return null;

  const line =
    status.state === "retrograde"
      ? {
          d: `D-${status.daysLeft}`,
          text: `수성 역행 중 — ${formatKstMonthDay(status.period.end)}에 끝납니다`,
        }
      : {
          d: `D-${status.daysUntil}`,
          text: `다음 수성 역행 — ${formatKstMonthDay(status.next.start)}부터`,
        };

  return (
    // 상자가 아니라 금선 두 줄 사이의 한 행 — 이 사이트의 구획 문법 그대로다.
    <Link
      href="/retrograde"
      className="group mb-10 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-gold/20 py-3.5 transition-colors hover:border-gold/45"
    >
      <span className="astro-symbol text-gold-soft" aria-hidden>
        ☿
      </span>
      <span className="font-display text-lg text-gold-soft">{line.d}</span>
      <span className="break-keep text-guide text-starlight-dim">{line.text}</span>
      <span className="ml-auto text-meta text-gold-soft transition-transform group-hover:translate-x-1 motion-reduce:translate-x-0">
        자세히 →
      </span>
    </Link>
  );
}

/** 열 행성이 오늘 어느 자리에 있는가. 역행 중인 별은 그렇게 말한다. */
export function PlanetsNow({ sky }: { sky: TodaySky }) {
  return (
    <section className="mt-16">
      <h2 className="mb-2 flex items-center gap-4 break-keep font-display text-xl text-starlight">
        오늘의 하늘, 열 개의 별
        <span aria-hidden className="h-px flex-1 bg-gold/25" />
      </h2>
      <p className="max-w-[52ch] break-keep text-meta text-starlight-dim">
        정오 기준의 자리입니다. 달만 하루에 13도씩 움직여 저녁에는 한 걸음 더 가
        있습니다.
      </p>
      <ul className="mt-6 grid gap-x-10 gap-y-0 sm:grid-cols-2">
        {sky.placements.map((p) => {
          const planet = PLANET_BY_KEY[p.planet];
          return (
            <li
              key={p.planet}
              className="flex items-baseline gap-3 border-t border-gold/12 py-2.5"
            >
              <span className="astro-symbol w-5 text-gold-soft" aria-hidden>
                {planet.symbol}
              </span>
              <span className="w-12 text-guide text-starlight">{planet.ko}</span>
              <span className="text-guide text-starlight-dim">
                {p.sign.ko} {Math.floor(p.degree)}도
              </span>
              {p.retrograde && (
                <span className="ml-auto text-meta tracking-[0.14em] text-gold-soft">역행</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 다가오는 삭망 — 칼럼이 시키는 "신월에 세우고 보름에 돌아보기"의 실제 날짜. */
export function ComingMoons({ now }: { now: Date }) {
  const { newMoon, fullMoon } = useMemo(() => nextLunations(now), [now]);
  // 먼저 오는 쪽을 앞에 — "다음"이라는 말의 상식.
  const ordered = [newMoon, fullMoon].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  return (
    <div className="mt-8 max-w-[52ch] border-l-2 border-gold/40 pl-5">
      <p className="text-meta tracking-[0.18em] text-gold">다가오는 달</p>
      {ordered.map((l) => (
        <p key={l.kind} className="mt-2 break-keep text-guide text-starlight">
          {l.kind === "new" ? "다음 신월" : "다음 보름"} —{" "}
          <b className="font-normal text-gold-soft">{formatKstMonthDay(l.date)}</b>
          <span className="text-starlight-dim"> · {l.signKo}</span>
        </p>
      ))}
      <p className="mt-2 break-keep text-meta text-starlight-dim">
        신월에 시작한 일은 보름에 한 번 돌아보게 됩니다.
      </p>
    </div>
  );
}
