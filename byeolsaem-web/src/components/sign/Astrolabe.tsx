"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

/**
 * 천구의 진 — 열두 성좌가 이중 금선 링 위에 떠 있고, 진 전체가 아주 느리게 돈다.
 *
 * 성좌를 하나의 큰 SVG로 그리지 않고 **열두 개의 독립 요소**로 배치한다. 스펙이
 * 못 박은 제약이다(§6.4): 나중에 선택한 성좌만 중앙으로 날아가 카드로 응결하는
 * FLIP 모프를 붙이려면, 그 성좌가 자기만의 DOM 노드를 갖고 있어야 한다. 한
 * 덩어리 SVG 안의 <g>는 레이아웃 위치를 따로 가질 수 없어 FLIP이 성립하지 않는다.
 *
 * 자전은 CSS 애니메이션에 맡긴다. 분당 1° — 눈에 띄게 움직이는 것이 아니라,
 * 오래 보고 있으면 아까와 다르다는 것을 겨우 알아차리는 속도다. 호버하면 멈춘다.
 * 성좌 자체는 링과 반대로 돌려 늘 똑바로 서 있게 한다.
 */

const RING_DURATION_S = 360 * 60; // 분당 1° → 한 바퀴 6시간

// 성좌 하나가 놓이는 자리. 12시 방향부터 시계 방향으로 한 칸씩.
function angleFor(index: number) {
  return (index / ZODIAC_SIGNS.length) * 360;
}

export function Astrolabe() {
  const [hovered, setHovered] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const active = hovered === null ? null : ZODIAC_SIGNS[hovered];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,620px)]">
      {/* 이중 금선 링 + 사분 눈금 + 도수 점. 배경 도판이라 하나의 SVG로 충분하다 —
          움직이는 것은 성좌뿐이다. */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 size-full" aria-hidden>
        <g className={reduced ? undefined : "astrolabe-spin"} style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="186" fill="none" stroke="var(--color-gold)" strokeWidth=".7" opacity=".45" />
          <circle cx="200" cy="200" r="176" fill="none" stroke="var(--color-gold)" strokeWidth=".4" opacity=".22" />

          {/* 도수 점 — 30°마다 하나씩, 열두 방을 나눈다. */}
          {ZODIAC_SIGNS.map((s, i) => {
            const a = (angleFor(i) - 90) * (Math.PI / 180);
            return (
              <circle
                key={s.key}
                cx={200 + Math.cos(a) * 181}
                cy={200 + Math.sin(a) * 181}
                r={hovered === i ? 2.6 : 1.4}
                fill="var(--color-gold-soft)"
                opacity={hovered === i ? 1 : 0.5}
                className="transition-all duration-500"
              />
            );
          })}

          {/* 사분 눈금 — 네 방향만 길게. */}
          {[0, 90, 180, 270].map((deg) => {
            const a = (deg - 90) * (Math.PI / 180);
            return (
              <line
                key={deg}
                x1={200 + Math.cos(a) * 176}
                y1={200 + Math.sin(a) * 176}
                x2={200 + Math.cos(a) * 164}
                y2={200 + Math.sin(a) * 164}
                stroke="var(--color-gold)"
                strokeWidth=".7"
                opacity=".5"
              />
            );
          })}
        </g>
      </svg>

      {/* 열두 성좌. 각자 독립된 요소다(위 주석 참고). */}
      <div
        className={`absolute inset-0 ${reduced ? "" : "astrolabe-spin"} ${
          hovered !== null ? "[animation-play-state:paused]" : ""
        }`}
        style={{ transformOrigin: "50% 50%" }}
      >
        {ZODIAC_SIGNS.map((sign, i) => {
          const rad = (angleFor(i) - 90) * (Math.PI / 180);
          const lit = hovered === i;
          return (
            <div
              key={sign.key}
              // 자리는 삼각함수로 직접 잡는다.
              //
              // 처음에는 `rotate → translateY(-39%) → rotate` 방식으로 밀어냈는데,
              // 밀어낼 요소가 size-0이라 백분율 translate가 0px으로 계산되어
              // 열두 개가 전부 중앙에 포개졌다(실측: 모든 링크의 히트 판정이
              // 마지막 물고기자리로 넘어감). 백분율 translate는 컨테이너가 아니라
              // 자기 자신의 크기를 기준으로 삼는다.
              //
              // left/top의 백분율은 컨테이너 기준이므로 그런 함정이 없다. 크기도
              // 백분율로 두어, 화면이 좁아져 링이 작아지면 히트 영역도 같이 줄어
              // 이웃과 겹치지 않는다(간격은 늘 지름의 약 1.07배로 유지된다).
              className="absolute aspect-square w-[19%]"
              // calc()로 넘기지 않고 뺄셈까지 끝낸 값을 문자열로 굳힌다.
              // `calc(30.499999999999982% - 9.5%)`처럼 부동소수점 잡음이 실린
              // 식은 서버와 클라이언트가 서로 다르게 정리해 하이드레이션 불일치를
              // 낸다(실측). 소수 셋째 자리에서 끊으면 양쪽이 같은 글자를 만든다.
              style={{
                left: `${(50 + Math.cos(rad) * 39 - 9.5).toFixed(3)}%`,
                top: `${(50 + Math.sin(rad) * 39 - 9.5).toFixed(3)}%`,
              }}
            >
              {/*
                히트 영역은 그림보다 작은 원이다. 그림 상자를 그대로 링크로 쓰면
                가로세로가 이웃 간격보다 커서 엉뚱한 성좌가 포인터를 가로챈다.
                링크는 자리 크기에 꽉 찬 원으로 두고, 그림은 pointer-events를 끈
                채 그 밖으로 넘치게 그린다 — 보이는 크기는 유지하면서 충돌만 없앤다.
              */}
              <Link
                href={`/sign/${sign.key}`}
                aria-label={`${sign.ko} ${sign.range}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                className={`flex size-full items-center justify-center rounded-full outline-offset-4 ${
                  reduced ? "" : "astrolabe-counterspin"
                }`}
              >
                <svg
                  viewBox="0 0 260 200"
                  className="pointer-events-none w-[128%] shrink-0"
                  aria-hidden
                >
                  <path
                    d={sign.path}
                    fill="none"
                    stroke="var(--color-gold)"
                    strokeWidth={lit ? 1.6 : 1}
                    className="transition-all duration-500"
                    opacity={lit ? 0.95 : 0.3}
                  />
                  {sign.stars.map(([x, y]) => (
                    <circle
                      key={`${x}-${y}`}
                      cx={x}
                      cy={y}
                      r={lit ? 5 : 3.4}
                      fill="var(--color-starlight)"
                      className="transition-all duration-500"
                      opacity={lit ? 1 : 0.55}
                    />
                  ))}
                </svg>
              </Link>
            </div>
          );
        })}
      </div>

      {/* 중앙 문구. 아무것도 짚지 않았을 때는 방 전체의 이름을, 짚었을 때는 그
          방의 이름을 부른다. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <p
          key={active ? active.key : "idle"}
          className="motion-safe:animate-prompt-in font-display text-2xl text-starlight md:text-3xl"
        >
          {active ? active.ko : "열두 개의 방"}
        </p>
        <p className="mt-3 min-h-5 text-xs tracking-wide text-gold-soft">
          {active ? active.range : ""}
        </p>
        <p className="mt-1 min-h-5 text-[11px] text-starlight-dim">
          {active ? `${active.element} · ${active.quality} · ${active.ruler}` : "성좌에 손을 올려 보세요"}
        </p>
      </div>
    </div>
  );
}
