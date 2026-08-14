"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectSkyTier, isSoftwareRenderer, type SkyTier } from "@/lib/sky-tier";
import { NightJourney } from "./NightJourney";
import { StaticStars } from "./StaticStars";

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

export function SkyBackdrop() {
  const [tier, setTier] = useState<SkyTier | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const webgl = !!ctx;
    // 누가 그리는가 — GPU인가 CPU인가. 이름을 숨기지 않는 확장이 있으면 그것을
    // 쓰고, 없으면 표준 RENDERER로 물러선다(sky-tier.ts 주석 참고).
    const debug = ctx?.getExtension("WEBGL_debug_renderer_info");
    const renderer = ctx
      ? String(
          (debug && ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL)) ??
            ctx.getParameter(ctx.RENDERER) ??
            "",
        )
      : null;
    // 지원 감지용으로만 만든 임시 canvas라 컨텍스트를 계속 들고 있을 이유가 없다.
    // WEBGL_lose_context로 즉시 해제해 GPU 리소스를 낭비하지 않는다.
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
    const t = detectSkyTier({
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      isMobile: matchMedia("(max-width: 768px)").matches,
      webgl,
      softwareRenderer: isSoftwareRenderer(renderer),
    });
    setTier(t);
    if (t !== "static") requestAnimationFrame(() => setVisible(true));
  }, []);

  /**
   * 감지로 걸러지지 않는 기기가 남는다 — 이름은 멀쩡한 GPU인데 이 셰이더를
   * 감당하지 못하는 내장 그래픽, 다른 창이 GPU를 물고 있는 상황, 발열로 성능이
   * 내려간 노트북. 그래서 이름 대신 실제로 그려낸 속도를 보고, 목표에 한참
   * 못 미치면 하늘을 정지 티어로 내린다. 한 번 내려간 뒤에는 올라오지 않는다.
   */
  const downgrade = () => setTier("static");

  return (
    // z-0(양수 아님)을 쓴다: 이 환경 Chromium에서 fixed 조상에 음수 z-index(-z-10)가
    // 걸리면 WebGL 캔버스의 GPU 컴포지팅 레이어가 화면에 전혀 합성되지 않는 버그가
    // 재현됨(같은 요소의 CSS 그라디언트는 정상 표시, three.js 드로우콜/씬 그래프도
    // 전부 정상 — dev-browser로 격리 테스트해 확인).
    //
    // 주의: z-0 + fixed는 자체 스택 컨텍스트를 만들고, CSS 페인트 순서상 positioned
    // z-index:0 요소는 "일반 흐름(non-positioned) 콘텐츠" 페인트 단계보다 나중에
    // 그려진다 — 이는 DOM 순서와 무관하다. 즉 이 배경을 콘텐츠보다 먼저 렌더링해도
    // 위에 있는 GoldButton 등 position 없는 콘텐츠가 이 배경 아래로 가려질 수 있다
    // (실제로 발생했던 버그). 그래서 이 컴포넌트만으로는 안전하지 않고, 반드시
    // layout.tsx에서 {children}을 relative z-10 래퍼로 감싸 명시적 스택 레벨을 부여해야
    // 한다(layout.tsx 주석 참고). Veil 네비는 명시적 z-40이라 항상 이 값보다 위다.
    // .nebula-bg는 이제 첫 페인트용 바탕으로만 남는다. 실제로 보이는 색은 그
    // 위에 겹친 NightJourney가 구간마다 갈아끼운다(초저녁 → 자정 → 여명).
    <div className="nebula-bg pointer-events-none fixed inset-0 z-0" aria-hidden>
      <NightJourney />
      {tier === "static" && <StaticStars />}
      {tier && tier !== "static" && (
        <div
          className={`h-full w-full transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <SkyCanvas tier={tier} onTooSlow={downgrade} />
        </div>
      )}
      {/* 질감 층(§10.1). 별 위·글 아래. 순수 CSS라 어느 티어에서도 값이 싸고,
          감소 모드에서는 전역 규칙이 그레인의 이동만 멈춘다(입자는 남는다). */}
      <div className="sky-vignette absolute inset-0" />
      <div className="film-grain absolute" />
    </div>
  );
}
