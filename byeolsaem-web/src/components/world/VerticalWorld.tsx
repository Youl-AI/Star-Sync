"use client";
import { useEffect, useRef } from "react";
import { requestRitual } from "@/lib/ritual";
import { useBirthProfile } from "@/hooks/useBirthProfile";
import { getSunSign } from "@/lib/zodiac";
import { scrollToId } from "@/lib/scroll";

/**
 * 별의 샘 — 수직 세계. 페이지 자체가 하나의 세로 공간이다:
 * 위 = 별하늘·산·샘(그림 A), 수면을 지나면 물속(그림 B), 그 아래 심연은
 * SkyBackdrop의 진짜 별하늘이 이어받는다. 전환은 전부 스크롤에 1:1로 묶인
 * 연속량(겹침 마스크·진폭·불투명도 램프)이라 "갑작스러운 장면 전환"이
 * 구조적으로 존재하지 않는다 (2026-08-14 프리뷰에서 확정된 문법).
 *
 * compress > 1이면 그림이 스크롤보다 빨리 흘러 여정이 짧아진다. 시각적
 * 변화는 거의 없고 콘텐츠 도달 스크롤만 줄어든다 — 재방문자를 위한 손잡이.
 */
export function VerticalWorld({
  compress = 1,
  topCrop = 0,
  showCopy = true,
}: {
  compress?: number;
  /**
   * 그림 A의 상단 하늘을 몇 vw 잘라내고 시작할지 — 여정 시작점을 샘 가까이로
   * 당긴다. 그림에 비례해야 하는 값이라 단위가 vw다(.vw-above 주석 참고).
   * 모바일(<768px)에서는 CSS가 크롭을 끄므로 여기 값은 데스크톱에만 작용한다.
   */
  topCrop?: number;
  showCopy?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const aboveRef = useRef<HTMLImageElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLCanvasElement>(null);

  // 첫 화면에서의 알아봄 — 이미 정보를 남긴 사람에게는 히어로가 인사를 바꾼다.
  // 서버 HTML은 언제나 첫 방문 카피다(WithoutBirthProfile과 같은 원칙: 검색엔진과
  // 처음 오는 사람이 보는 것이 그 HTML). ready 후에만 갈아끼우고, 그 순간이
  // 화면 안이므로 hero-greet 페이드로 덮는다.
  const { profile, ready } = useBirthProfile();
  const returning = ready && profile !== null;
  const sign = profile ? getSunSign(profile.date) : null;

  useEffect(() => {
    const wrap = wrapRef.current;
    const above = aboveRef.current;
    const rays = raysRef.current;
    const cv = fxRef.current;
    if (!wrap || !above || !rays || !cv) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const ease = (t: number) => t * t * (3 - 2 * t);

    // 압축: 그림 묶음이 스크롤보다 (k)배 빨리 지나가도록 위로 밀고,
    // 밀린 만큼 아래 여백을 당겨 뒤 콘텐츠가 제자리에서 만나게 한다.
    // 모바일은 그림 자체가 짧아 압축까지 하면 수면 통과가 눈 깜짝할 새라
    // 압축하지 않는다 — 크롭을 끄는 .vw-above의 768px 기준과 같은 선.
    const k = () => (innerWidth < 768 ? 1 : Math.max(1, compress));
    let maxShift = 0;
    const relayout = () => {
      const kNow = k();
      const total = wrap.scrollHeight;
      maxShift = total * (1 - 1 / kNow);
      wrap.style.marginBottom = kNow > 1 ? `${-maxShift}px` : "";
    };
    relayout();
    addEventListener("resize", relayout);
    if (!above.complete) above.addEventListener("load", relayout);

    let tx = 0,
      cx = 0,
      depth01 = 0,
      raf = 0;
    const onPointer = (e: PointerEvent) => {
      tx = e.clientX / innerWidth - 0.5;
    };
    addEventListener("pointermove", onPointer);

    const ctx = cv.getContext("2d")!;
    const resize = () => {
      cv.width = innerWidth;
      cv.height = innerHeight;
    };
    resize();
    addEventListener("resize", resize);

    /**
     * 금빛 알갱이 도장. 예전에는 알갱이마다 매 프레임 createRadialGradient로
     * 새 그라디언트를 만들어 원을 채웠다 — 스무 개면 초당 1200개의 그라디언트
     * 객체다. 빛무리는 하나뿐이고 달라지는 것은 크기와 밝기뿐이므로, 한 번
     * 구워 두고 찍는다.
     */
    const SPRITE = 64;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = SPRITE;
    const sctx = sprite.getContext("2d")!;
    const halo = sctx.createRadialGradient(
      SPRITE / 2, SPRITE / 2, 0,
      SPRITE / 2, SPRITE / 2, SPRITE / 2,
    );
    halo.addColorStop(0, "rgba(227,197,104,1)");
    halo.addColorStop(1, "rgba(227,197,104,0)");
    sctx.fillStyle = halo;
    sctx.fillRect(0, 0, SPRITE, SPRITE);

    const motes = Array.from({ length: 20 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.5,
      vy: 0.0003 + Math.random() * 0.0008,
      tw: Math.random() * Math.PI * 2,
      ts: 0.008 + Math.random() * 0.02,
    }));
    const bubbles = Array.from({ length: 8 }, () => ({
      x: Math.random(),
      y: 1 + Math.random(),
      r: 1.1 + Math.random() * 2.0,
      vy: 0.0012 + Math.random() * 0.0018,
      wob: Math.random() * Math.PI * 2,
    }));

    const frame = () => {
      cx += (tx - cx) * 0.05;
      const vh = innerHeight;
      const shift = Math.min(maxShift, scrollY * (k() - 1));

      // 수면의 화면 위치로 통과·깊이를 잰다. 수면은 그림 속 위치이므로 그림
      // 폭에 비례한다(A 하단 - 13.9vw ≈ 데스크톱에서 조율했던 22vh의 환산값).
      const aboveRect = above.getBoundingClientRect();
      const waterScreenY = aboveRect.bottom - aboveRect.width * 0.139;
      const centerY = vh * 0.55;
      // 그림은 스크롤에만 반응한다 — 포인터 시차도, 수면 일렁임도 주지 않는다.
      // 그림이 정확히 100vw라 어느 쪽으로든 밀면 가장자리가 드러나기 때문.
      // 살아있는 움직임은 빛줄기·입자·기포 레이어의 몫이다.
      wrap.style.transform = `translateY(${-shift}px)`;

      depth01 = clamp01((centerY - waterScreenY) / (vh * 3));
      const under = centerY > waterScreenY;
      rays.style.opacity = String(under ? Math.max(0, 0.9 - depth01 * 1.1) : 0);
      rays.style.transform = `translateY(${-depth01 * 16}vh) translateX(${cx * -10}px)`;

      // FX: 금빛 입자(위=솟음, 물속=부유) + 기포(물속만)
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!reduced) {
        for (const m of motes) {
          m.y -= m.vy * (under ? 0.45 : 1);
          m.tw += m.ts;
          if (m.y < -0.03) {
            m.y = 1.03;
            m.x = Math.random();
          }
          const a = 0.22 + 0.55 * Math.abs(Math.sin(m.tw * 2));
          const d = m.r * 8;
          ctx.globalAlpha = a;
          ctx.drawImage(sprite, m.x * cv.width - d / 2, m.y * cv.height - d / 2, d, d);
          ctx.globalAlpha = 1;
        }
        if (under) {
          const ba = Math.min(1, depth01 * 3) * (1 - depth01 * 0.5);
          for (const b of bubbles) {
            b.y -= b.vy;
            b.wob += 0.02;
            if (b.y < -0.05) {
              b.y = 1.05;
              b.x = Math.random();
            }
            const bx = (b.x + Math.sin(b.wob) * 0.007) * cv.width;
            const by = b.y * cv.height;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200,210,235,${0.3 * ba})`;
            ctx.lineWidth = 1;
            ctx.arc(bx, by, b.r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.fillStyle = `rgba(232,238,255,${0.42 * ba})`;
            ctx.arc(bx - b.r * 0.3, by - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onPointer);
      removeEventListener("resize", resize);
      removeEventListener("resize", relayout);
      wrap.style.transform = "";
      wrap.style.marginBottom = "";
    };
  }, [compress]);

  return (
    <>
      {/* overflow-hidden: topCrop의 음수 마진이 래퍼와 마진 상쇄를 일으켜
          카피까지 딸려 올라가는 것을 막는다(BFC). 잘린 하늘은 클리핑으로 사라진다. */}
      <div ref={wrapRef} className="relative overflow-hidden" style={{ willChange: "transform" }}>
        {showCopy && (
          /* key로 갈아끼워 재방문 카피가 hero-greet 페이드와 함께 통째로 등장한다.
             첫 방문 쪽에는 애니메이션을 걸지 않는다 — 서버 HTML 그대로가 첫 페인트다. */
          <div
            key={returning ? "returning" : "first"}
            /* 문자열 연결로 둔다: 템플릿 리터럴에서 `pt-[16vh]${…}`처럼 클래스 바로
               뒤에 보간이 붙으면 Tailwind 스캐너가 토큰을 잘못 읽어 규칙을 안 만든다. */
            className={"absolute inset-x-0 top-0 z-10 px-[8vw] pt-[16vh]" + (returning ? " hero-greet" : "")}
          >
            <p className="font-latin text-eyebrow tracking-[0.3em] text-gold">
              Byeolsaem · Your Night Sky
            </p>
            <h1 className="mt-4 break-keep font-display text-4xl leading-snug text-starlight md:text-6xl">
              {returning ? (
                <>
                  다시 밤이 내렸습니다,
                  <br />
                  <span className="font-light text-starlight-dim">
                    {sign?.ko}의 별이 샘 아래에 떠 있습니다
                  </span>
                </>
              ) : (
                <>
                  별이 솟는 샘,
                  <br />
                  <span className="font-light text-starlight-dim">
                    그 아래에 당신의 하늘이 있습니다
                  </span>
                </>
              )}
            </h1>
            <p className="mt-5 max-w-xl break-keep leading-relaxed text-starlight-dim">
              {returning
                ? "남겨 두신 그 밤의 하늘은 그대로 있습니다. 수면을 지나, 바로 별을 만나러 가세요."
                : "샘은 밤하늘을 머금은 우물입니다. 천천히 내려가 보세요 — 수면을 지나면, 물속이 곧 하늘입니다."}
            </p>
            <button
              type="button"
              onClick={() => (returning ? scrollToId("deep-result") : requestRitual())}
              className="mt-9 inline-block border border-gold bg-ink/35 px-8 py-3.5 text-sm tracking-[0.12em] text-gold-soft backdrop-blur-sm transition-colors hover:bg-gold hover:text-ink"
            >
              {returning ? "내 별 보러 가기" : "내 밤하늘 열기"}
            </button>
            <p className="mt-10 font-latin text-eyebrow tracking-[0.24em] text-starlight-dim">
              SCROLL — 샘 아래로
            </p>
          </div>
        )}
        {/* LCP 후보이므로 첫 그림은 eager. 두 번째는 스크롤해야 보인다.
            width/height는 원본 픽셀(1536×2752) — CSS가 100vw로 늘려도 비율 계산에
            쓰여, 바이트가 오기 전에 브라우저가 세로 자리를 예약한다. 이게 없으면
            로드 순간 그림 높이(모바일 ≈179vw)만큼 아래가 통째로 밀린다 —
            메인의 CLS 2.07은 전부 이 두 장이었다(Web Analytics 실측 2026-08-24). */}
        <img
          ref={aboveRef}
          src="/world/spring-above.webp"
          alt=""
          width={1536}
          height={2752}
          className="vw-art vw-above"
          style={
            topCrop > 0
              ? ({ "--vw-crop": `${topCrop}vw` } as React.CSSProperties)
              : undefined
          }
          fetchPriority="high"
        />
        <img
          src="/world/spring-below.webp"
          alt=""
          width={1536}
          height={2752}
          className="vw-art vw-below"
          loading="lazy"
        />
      </div>

      {/* 물속 첫 문장 — 심연(콘텐츠 구간)으로 넘어가는 숨고르기 */}
      <section className="relative z-10 grid min-h-[55vh] place-items-center px-[8vw] text-center">
        <div>
          <p className="break-keep font-display text-2xl text-starlight md:text-3xl">
            샘 아래는, 밤하늘이었습니다.
          </p>
          <p className="mt-3 break-keep text-meta text-starlight-dim">
            반짝임 하나하나가 태어난 순간의 별입니다
          </p>
        </div>
      </section>

      <div ref={raysRef} className="vw-rays" aria-hidden />
      <canvas
        ref={fxRef}
        className="pointer-events-none fixed inset-0 h-full w-full"
        aria-hidden
      />
    </>
  );
}
