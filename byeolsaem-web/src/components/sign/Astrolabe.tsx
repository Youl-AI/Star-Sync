"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { EASE_IN_OUT, EASE_OUT, clearStyles, setStyles, tween, tweenAll } from "@/lib/tween";
import { SignGlyph } from "./SignGlyph";
import {
  ARRIVE_MORPH_KEY,
  ART_HEIGHT,
  ART_OFFSET_X,
  ART_OFFSET_Y,
  ART_WIDTH,
  BACK_MORPH_KEY,
  CARD_HEIGHT,
  CARD_WIDTH,
  archPath,
  setMarker,
  takeMarker,
} from "./signMorph";

/** 모프 각 단계의 길이(ms). 합쳐서 스펙이 말하는 0.8초 안에 들어온다. */
const FLIGHT_MS = 720;
const ARCH_DELAY_MS = 320;
const ARCH_MS = 500;

/**
 * 천구의 진 — 열두 성좌가 이중 금선 링 위에 떠 있고, 진 전체가 아주 느리게 돈다.
 *
 * 성좌를 하나의 큰 SVG로 그리지 않고 **열두 개의 독립 요소**로 배치한다. 스펙이
 * 못 박은 제약이다(§6.4): 선택한 성좌만 중앙으로 날아가 카드로 응결하는 FLIP
 * 모프를 붙이려면 그 성좌가 자기만의 DOM 노드를 갖고 있어야 한다. 한 덩어리
 * SVG 안의 <g>는 레이아웃 위치를 따로 가질 수 없어 FLIP이 성립하지 않는다.
 *
 * 자전은 CSS 애니메이션에 맡긴다. 분당 1° — 눈에 띄게 움직이는 것이 아니라,
 * 오래 보고 있으면 아까와 다르다는 것을 겨우 알아차리는 속도다. 호버하면 멈춘다.
 * 성좌 자체는 링과 반대로 돌려 늘 똑바로 서 있게 한다.
 */

// 성좌 하나가 놓이는 자리. 12시 방향부터 시계 방향으로 한 칸씩.
function angleFor(index: number) {
  return (index / ZODIAC_SIGNS.length) * 360;
}

/**
 * 서버에서는 useLayoutEffect가 경고를 낸다(실행될 수 없으므로). 하지만 역모프는
 * 첫 페인트 **전에** 링을 어둡게 만들어야 한다 — useEffect로 미루면 밝은 링이
 * 한 프레임 번쩍인 뒤 꺼진다.
 */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Morph = {
  index: number;
  /** in = 진에서 카드로(클릭), out = 카드에서 진으로(뒤로가기). */
  dir: "in" | "out";
};

export function Astrolabe() {
  const router = useRouter();
  const [hovered, setHovered] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const [morph, setMorph] = useState<Morph | null>(null);

  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const artRefs = useRef<(SVGSVGElement | null)[]>([]);
  const ringRef = useRef<SVGSVGElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const archRef = useRef<SVGPathElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(quiet);

    // 상세 페이지에서 뒤로가기를 눌러 돌아왔는가. 표식이 있으면 그 성좌가
    // 중앙의 카드에서 제 자리로 되돌아가는 역모프로 화면을 연다.
    const back = takeMarker(BACK_MORPH_KEY);
    if (!back || quiet) return;
    const index = ZODIAC_SIGNS.findIndex((s) => s.key === back);
    if (index >= 0) setMorph({ index, dir: "out" });
  }, []);

  useIsoLayoutEffect(() => {
    if (!morph) return;
    const { index, dir } = morph;
    const art = artRefs.current[index];
    const flyer = flyerRef.current;
    const target = targetRef.current;
    const overlay = overlayRef.current;
    const arch = archRef.current;
    const fill = fillRef.current;
    const ring = ringRef.current;
    const caption = captionRef.current;
    if (!art || !flyer || !target || !overlay || !arch || !fill || !ring || !caption) return;

    const others = slotRefs.current.filter((el, i): el is HTMLDivElement => !!el && i !== index);
    const sign = ZODIAC_SIGNS[index];
    const length = arch.getTotalLength();

    // FLIP의 계산 부분. 성좌가 링 위에서 차지한 자리와 카드 안에서 앉을 자리를
    // 재고, 그 둘을 잇는 이동과 배율을 구한다. 날아가는 복제는 늘 출발 자리에
    // 놓고, 목적지 상태를 transform으로 표현한다 — 그래야 순방향과 역방향이
    // 같은 두 값을 서로 반대로 쓰기만 하면 된다.
    const from = art.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const scale = to.width / from.width;
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const landed = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${scale.toFixed(4)})`;

    setStyles(overlay, { visibility: "visible" });
    setStyles(art, { opacity: "0" });
    setStyles(flyer, {
      left: `${from.left}px`,
      top: `${from.top}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
      opacity: "1",
    });
    setStyles(arch, { "stroke-dasharray": `${length}` });

    let timer: ReturnType<typeof setTimeout>;

    if (dir === "in") {
      // 나머지 열한 개는 물러난다. 선택한 것만 남기려는 것이지 지우려는 것이
      // 아니므로 완전히 0으로 보내지 않는다.
      tweenAll(others, { opacity: "1", transform: "none" }, { opacity: "0.05", transform: "scale(0.93)" }, {
        duration: 500,
        ease: EASE_IN_OUT,
      });
      tweenAll([ring, caption], { opacity: "1" }, { opacity: "0" }, { duration: 450, ease: EASE_IN_OUT });

      tween(flyer, { transform: "none" }, { transform: landed }, {
        duration: FLIGHT_MS,
        ease: EASE_IN_OUT,
      });

      // 아치 테두리가 선으로 그려지며 성좌를 감싼다 — 응결의 마지막 획이다.
      tween(
        arch,
        { "stroke-dashoffset": `${length}`, opacity: "0" },
        { "stroke-dashoffset": "0", opacity: "1" },
        { duration: ARCH_MS, delay: ARCH_DELAY_MS, ease: EASE_IN_OUT },
      );
      tween(fill, { opacity: "0" }, { opacity: "1" }, { duration: 400, delay: 420, ease: EASE_OUT });

      timer = setTimeout(() => {
        // 상세 페이지가 이 표식을 보고 카드를 화면 한가운데에서 받아 제자리로
        // 올려보낸다. 없으면 연출 없이 완성된 화면으로 뜬다.
        setMarker(ARRIVE_MORPH_KEY, sign.key);
        // 돌아올 길도 지금 적어 둔다. 이유는 signMorph.ts의 BACK_MORPH_KEY 참고.
        setMarker(BACK_MORPH_KEY, sign.key);
        router.push(`/sign/${sign.key}`);
      }, ARCH_DELAY_MS + ARCH_MS);
    } else {
      // 감쌌던 선이 먼저 풀리고, 그 다음 성좌가 제 자리로 돌아간다.
      tweenAll(others, { opacity: "0.05", transform: "scale(0.93)" }, { opacity: "1", transform: "none" }, {
        duration: 600,
        delay: 240,
        ease: EASE_OUT,
      });
      tweenAll([ring, caption], { opacity: "0" }, { opacity: "1" }, {
        duration: 600,
        delay: 240,
        ease: EASE_OUT,
      });
      tween(fill, { opacity: "1" }, { opacity: "0" }, { duration: 280, ease: EASE_IN_OUT });
      tween(
        arch,
        { "stroke-dashoffset": "0", opacity: "1" },
        { "stroke-dashoffset": `${length}`, opacity: "0" },
        { duration: 340, ease: EASE_IN_OUT },
      );
      tween(flyer, { transform: landed }, { transform: "none" }, {
        duration: 680,
        delay: 160,
        ease: EASE_IN_OUT,
      });

      timer = setTimeout(() => setMorph(null), 160 + 680);
    }

    return () => {
      clearTimeout(timer);
      // 인라인으로 박아 둔 것을 전부 걷어낸다. 이 요소들은 React가 그린 것이라
      // 남겨 두면 다음 렌더의 클래스가 먹지 않는다.
      clearStyles(art, ["opacity"]);
      for (const element of others) clearStyles(element, ["opacity", "transform"]);
      clearStyles(ring, ["opacity"]);
      clearStyles(caption, ["opacity"]);
    };
  }, [morph, router]);

  const active = hovered === null ? null : ZODIAC_SIGNS[hovered];
  const still = hovered !== null || morph !== null;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,620px)]">
      {/* 이중 금선 링 + 사분 눈금 + 도수 점. 배경 도판이라 하나의 SVG로 충분하다 —
          움직이는 것은 성좌뿐이다. */}
      <svg
        ref={ringRef}
        viewBox="0 0 400 400"
        className="absolute inset-0 size-full"
        aria-hidden
      >
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
          still ? "[animation-play-state:paused]" : ""
        }`}
        style={{ transformOrigin: "50% 50%" }}
      >
        {ZODIAC_SIGNS.map((sign, i) => {
          const rad = (angleFor(i) - 90) * (Math.PI / 180);
          const lit = hovered === i;
          return (
            <div
              key={sign.key}
              ref={(el) => {
                slotRefs.current[i] = el;
              }}
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
                onClick={(e) => {
                  // 새 탭·새 창으로 여는 조합키는 건드리지 않는다. 모프는 이
                  // 탭에서 이동할 때만 의미가 있다.
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  // reduced-motion에서는 모프 없이 즉시 이동한다(스펙 §7).
                  if (reduced || morph) return;
                  e.preventDefault();
                  setMorph({ index: i, dir: "in" });
                }}
                className={`flex size-full items-center justify-center rounded-full outline-offset-4 ${
                  reduced ? "" : "astrolabe-counterspin"
                }`}
              >
                <SignGlyph
                  sign={sign}
                  lit={lit}
                  className="pointer-events-none w-[128%] shrink-0"
                  ref={(el) => {
                    artRefs.current[i] = el;
                  }}
                />
              </Link>
            </div>
          );
        })}
      </div>

      {/* 중앙 문구. 아무것도 짚지 않았을 때는 방 전체의 이름을, 짚었을 때는 그
          방의 이름을 부른다. */}
      <div
        ref={captionRef}
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
      >
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

      {/*
        모프 무대. 진의 상자 안이 아니라 화면 전체에 고정한다 — 성좌는 링을 벗어나
        화면 한가운데까지 날아가야 하고, 진의 상자는 회전 중이라 그 안에 두면
        날아가는 궤적까지 함께 돌아 버린다.
      */}
      {morph && (
        <div ref={overlayRef} className="pointer-events-none invisible fixed inset-0 z-50">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: CARD_WIDTH,
              height: CARD_HEIGHT,
              marginLeft: -CARD_WIDTH / 2,
              marginTop: -CARD_HEIGHT / 2,
            }}
          >
            {/* 카드의 속. 아치 선이 다 그려질 때 함께 차오른다 — 선만 남기고
                넘기면 상세 페이지에서 배경이 갑자기 생겨 한 번 튄다. */}
            <div
              ref={fillRef}
              className="absolute inset-0 bg-gradient-to-b from-nebula/90 to-ink opacity-0"
              style={{
                borderRadius: `${CARD_WIDTH / 2}px ${CARD_WIDTH / 2}px 10px 10px`,
                boxShadow:
                  "0 0 44px 6px color-mix(in srgb, var(--color-gold) 12%, transparent)",
              }}
            />
            <svg
              viewBox={`0 0 ${CARD_WIDTH} ${CARD_HEIGHT}`}
              className="absolute inset-0 size-full"
              aria-hidden
            >
              <path
                ref={archRef}
                d={archPath()}
                fill="none"
                stroke="var(--color-gold)"
                strokeWidth="1.2"
                opacity="0"
              />
            </svg>
            {/* 카드 안에서 성좌가 앉을 자리. 보이지 않는 기준 상자다. */}
            <div
              ref={targetRef}
              className="absolute"
              style={{ left: ART_OFFSET_X, top: ART_OFFSET_Y, width: ART_WIDTH, height: ART_HEIGHT }}
            />
          </div>

          <div ref={flyerRef} className="fixed left-0 top-0 opacity-0">
            <SignGlyph sign={ZODIAC_SIGNS[morph.index]} lit className="size-full" />
          </div>
        </div>
      )}
    </div>
  );
}
