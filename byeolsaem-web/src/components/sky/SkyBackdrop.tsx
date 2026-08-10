"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectSkyTier, type SkyTier } from "@/lib/sky-tier";
import { generateStars } from "@/lib/stars";

const SkyCanvas = dynamic(() => import("./SkyCanvas"), { ssr: false });

// static 티어(WebGL 미지원 또는 prefers-reduced-motion) 전용 정지 별하늘.
// generateStars의 결정론적 좌표를 그대로 재사용해 외부 이미지 파일 없이 렌더한다.
// 애니메이션이 전혀 없어야 하므로 transition/transform을 일절 쓰지 않는다.
const STATIC_STAR_COUNT = 150;
const STATIC_STARS = generateStars(STATIC_STAR_COUNT, 1);

function StaticStars() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {STATIC_STARS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-starlight"
          style={{
            left: `${((s.x + 1) / 2) * 100}%`,
            top: `${((s.y + 1) / 2) * 100}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: 0.3 + ((s.z + 1) / 2) * 0.5,
          }}
        />
      ))}
    </div>
  );
}

export function SkyBackdrop() {
  const [tier, setTier] = useState<SkyTier | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const webgl = !!ctx;
    // 지원 감지용으로만 만든 임시 canvas라 컨텍스트를 계속 들고 있을 이유가 없다.
    // WEBGL_lose_context로 즉시 해제해 GPU 리소스를 낭비하지 않는다.
    ctx?.getExtension("WEBGL_lose_context")?.loseContext();
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
    // 전부 정상 — dev-browser로 격리 테스트해 확인).
    //
    // 주의: z-0 + fixed는 자체 스택 컨텍스트를 만들고, CSS 페인트 순서상 positioned
    // z-index:0 요소는 "일반 흐름(non-positioned) 콘텐츠" 페인트 단계보다 나중에
    // 그려진다 — 이는 DOM 순서와 무관하다. 즉 이 배경을 콘텐츠보다 먼저 렌더링해도
    // 위에 있는 GoldButton 등 position 없는 콘텐츠가 이 배경 아래로 가려질 수 있다
    // (실제로 발생했던 버그). 그래서 이 컴포넌트만으로는 안전하지 않고, 반드시
    // layout.tsx에서 {children}을 relative z-10 래퍼로 감싸 명시적 스택 레벨을 부여해야
    // 한다(layout.tsx 주석 참고). Veil 네비는 명시적 z-40이라 항상 이 값보다 위다.
    <div className="nebula-bg pointer-events-none fixed inset-0 z-0" aria-hidden>
      {tier === "static" && <StaticStars />}
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
