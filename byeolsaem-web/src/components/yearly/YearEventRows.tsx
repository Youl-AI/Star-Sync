"use client";
import type { YearReadingEvent } from "@/lib/yearly-reading";

/**
 * 접힌 사건 목록 — 좁은 화면과 감소 모드의 강(§11.5 A단계에서 정한 폴백).
 *
 * 강이 목차이고 풀이는 짚었을 때 나온다(스펙 §6.6). 예전처럼 열다섯 개를 전부
 * 펼쳐 두면 목차와 본문이 같은 내용을 두 번 쌓는다 — 접어 두고 누른 것만 연다.
 *
 * 여닫기는 grid-rows 전환으로 한다. max-height 방식은 넉넉한 값을 어림해야
 * 해서 짧은 글에서는 닫히는 동작이 한참 늦게 시작하는 것처럼 보인다.
 */
export function YearEventRows({
  events,
  openId,
  onToggle,
}: {
  events: YearReadingEvent[];
  /** 지금 열려 있는 사건. 강의 점을 눌러 열어 줄 수 있도록 부모가 쥔다. */
  openId: string | null;
  onToggle: (id: string | null) => void;
}) {
  return (
    <ul className="mt-8">
      {events.map((event) => {
        const open = event.id === openId;
        return (
          <li
            key={event.id}
            id={event.id}
            className={`scroll-mt-28 border-t ${
              event.harmony > 0 ? "border-gold/40" : "border-gold/12"
            }`}
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onToggle(open ? null : event.id)}
              className="flex w-full items-baseline gap-x-3 py-4 text-left"
            >
              <span
                aria-hidden
                className={`flex-none text-meta text-gold transition-transform duration-300 ${
                  open ? "rotate-90" : ""
                }`}
              >
                ›
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display text-starlight">
                  <span className="astro-symbol">{event.moving.symbol}</span> {event.moving.ko}
                  <span className="mx-1.5 astro-symbol text-gold-soft">{event.aspectSymbol}</span>내{" "}
                  <span className="astro-symbol">{event.fixed.symbol}</span> {event.fixed.ko}
                </span>
              </span>
              <span className="flex-none text-meta text-gold-soft">
                {event.exact[0].month}월 {event.exact[0].day}일
                {event.exact.length > 1 ? ` 외 ${event.exact.length - 1}` : ""}
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="max-w-[52ch] pb-6 pl-6">
                  <p className="text-meta text-starlight-dim">
                    {event.dateLine} · {event.aspectKo} · {event.countLine} 힘이 도는 기간은{" "}
                    {event.span}입니다.
                  </p>
                  <p className="mt-3 break-keep text-guide text-gold-soft">{event.headline}</p>
                  <p className="mt-2 break-keep leading-relaxed text-starlight-dim">
                    {event.body}
                  </p>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
