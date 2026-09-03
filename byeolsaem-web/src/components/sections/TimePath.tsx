"use client";
import { Link } from "@/components/ui/Link";
import { useEffect, useRef, useState } from "react";

/**
 * 시간의 별길 — 하루에서 일생까지, 같은 하늘을 다섯 배율로 읽는 다섯 정거장.
 *
 * 챕터스·주간이 쓰는 "선 위의 별" 문법을 홈에 올린 것(홈 재편 안 B,
 * 2026-08-28 승인). 오늘 정거장에는 숨쉬는 이중 링, 일생 끝에는 별.
 * 화면에 들어오면 선이 왼쪽부터 그어지고 정거장이 차례로 켜진다.
 *
 * 자체 진입 연출을 가지므로 Reveal로 감싸지 않는다 — 겹치면 이중 모션.
 */

const STOPS = [
  { href: "/today", label: "오늘", desc: "달의 위상과 자리", kind: "today" as const },
  { href: "/weekly", label: "이번 주", desc: "이레의 사건들", kind: "dot" as const },
  { href: "/calendar", label: "이 달", desc: "신월·보름·역행 달력", kind: "dot" as const },
  { href: "/yearly", label: "올해", desc: "느린 별들의 일 년", kind: "dot" as const },
  { href: "/chapters", label: "일생", desc: "인생의 시간표", kind: "star" as const },
];

function Marker({ kind }: { kind: (typeof STOPS)[number]["kind"] }) {
  if (kind === "star") {
    return (
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
        <path
          d="M10 1.5 11.9 7.6l6.4.7-4.8 4.3 1.4 6.3-4.9-3.5-4.9 3.5 1.4-6.3L.8 8.3l6.4-.7Z"
          fill="var(--color-gold)"
        />
      </svg>
    );
  }
  if (kind === "today") {
    return (
      <span className="relative flex size-6 items-center justify-center" aria-hidden>
        <span className="size-2.5 rounded-full bg-gold-soft" />
        <span className="star-breathe absolute inset-0 rounded-full border border-gold-soft" />
      </span>
    );
  }
  return <span className="size-2 rounded-full bg-starlight/75" aria-hidden />;
}

export function TimePath() {
  const ref = useRef<HTMLElement>(null);
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="mx-auto max-w-5xl px-6 py-28 md:py-36">
      <div
        className="text-center transition-opacity duration-700 ease-out motion-reduce:opacity-100 motion-reduce:transition-none"
        style={{ opacity: entered ? 1 : 0 }}
      >
        <p className="font-latin text-eyebrow tracking-[0.3em] text-starlight-dim">
          ONE SKY, FIVE SCALES
        </p>
        <h2 className="mt-3 break-keep font-display text-3xl text-starlight md:text-4xl">
          시간의 별길
        </h2>
        <p className="mx-auto mt-5 max-w-[46ch] break-keep text-guide text-starlight-dim">
          하루에서 일생까지 — 같은 하늘을 다섯 배율로 읽습니다.
        </p>
      </div>

      <div className="relative mx-auto mt-16 max-w-3xl">
        {/* 길 — 데스크톱은 가로, 모바일은 세로. 화면에 들어오면 그어진다. */}
        <span
          aria-hidden
          className="absolute inset-x-3 top-3 hidden h-px origin-left bg-gold/50 transition-transform duration-1000 ease-out motion-reduce:scale-x-100 motion-reduce:transition-none md:block"
          style={{ transform: `scaleX(${entered ? 1 : 0})` }}
        />
        <span
          aria-hidden
          className="absolute bottom-6 left-3 top-3 w-px origin-top bg-gold/50 transition-transform duration-1000 ease-out motion-reduce:scale-y-100 motion-reduce:transition-none md:hidden"
          style={{ transform: `scaleY(${entered ? 1 : 0})` }}
        />

        <ol className="flex flex-col gap-y-7 md:flex-row md:justify-between md:gap-y-0">
          {STOPS.map((stop, i) => (
            <li key={stop.href}>
              <Link
                href={stop.href}
                className="group flex items-center gap-x-4 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none md:flex-col md:gap-x-0 md:text-center"
                style={{
                  opacity: entered ? 1 : 0,
                  transform: entered ? "translateY(0)" : "translateY(8px)",
                  transitionDelay: `${250 + i * 130}ms`,
                }}
              >
                <span className="flex size-6 flex-none items-center justify-center">
                  <Marker kind={stop.kind} />
                </span>
                <span className="md:mt-4">
                  <span className="block break-keep font-display text-lg text-starlight transition-colors duration-200 group-hover:text-gold-soft">
                    {stop.label}
                  </span>
                  <span className="mt-0.5 block break-keep text-meta text-starlight-dim">
                    {stop.desc}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
