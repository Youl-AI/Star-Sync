"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectSkyTier, type SkyTier } from "@/lib/sky-tier";

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

export function SkyBackdrop() {
  const [tier, setTier] = useState<SkyTier | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const webgl = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    const t = detectSkyTier({
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      isMobile: matchMedia("(max-width: 768px)").matches,
      webgl,
    });
    setTier(t);
    if (t !== "static") requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    // z-0(양수 아님)을 쓴다: 이 환경 Chromium에서 fixed 조상에 음수 z-index(-z-10)가
    // 걸리면 WebGL 캔버스의 GPU 컴포지팅 레이어가 화면에 전혀 합성되지 않는 버그가
    // 재현됨(같은 요소의 CSS 그라디언트는 정상 표시, three.js 드로우콜/씬 그래프도
    // 전부 정상 — dev-browser로 격리 테스트해 확인). DOM에서 SkyBackdrop을 콘텐츠보다
    // 먼저 렌더링하고, z-index:auto인 형제 콘텐츠는 이후 DOM 순서로 위에 그려지므로
    // z-0 + 형제 콘텐츠 순서만으로 "배경" 의도는 동일하게 유지된다. Veil 네비(z-40)는
    // 이 값보다 항상 위에 있다.
    <div className="nebula-bg pointer-events-none fixed inset-0 z-0" aria-hidden>
      {tier && tier !== "static" && (
        <div
          className={`h-full w-full transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <SkyCanvas tier={tier} />
        </div>
      )}
    </div>
  );
}
