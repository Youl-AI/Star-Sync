"use client";
import { useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Aurora } from "./Aurora";
import { Starfield } from "./Starfield";

/**
 * 이 하늘을 초당 몇 번 그릴지 정한다.
 *
 * 커튼은 uTime * 0.05로 흐르고 별은 그보다 더 느리게 돈다 — 60fps로 그릴 이유가
 * 처음부터 없었다. 반면 비용은 프레임 수에 정비례한다: 화면을 덮는 프래그먼트
 * 셰이더라 한 프레임이 곧 화면 전체의 픽셀 비용이다.
 *
 * 30fps로 내리면 그 비용이 절반이 되고, 눈에는 차이가 없다(0.05 속도로 흐르는
 * 빛에서 16ms와 33ms는 같은 그림이다). 스크롤은 브라우저가 60fps로 계속 굴리므로
 * 글이 끊기지 않는다 — 느려지는 것은 배경 하늘뿐이다.
 */
function PaceKeeper({ fps, onTooSlow }: { fps: number; onTooSlow?: () => void }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    const interval = 1000 / fps;
    let raf = 0;
    let lastDraw = 0;

    /**
     * 이름으로 거르지 못한 기기를 실측으로 거른다.
     *
     * 브라우저가 1초에 소화하는 프레임 수를 센다. 하늘이 감당 가능한 기기에서는
     * 이 값이 화면 주사율(대개 60)에 붙어 있다 — 하늘은 30번만 그리고 나머지
     * 프레임은 놀기 때문이다. 이 값이 계속 40 아래로 눌려 있다면 이 페이지는
     * 이미 숨이 차다는 뜻이고, 그때 덜어낼 수 있는 가장 큰 짐이 하늘이다.
     *
     * 처음 1초는 세지 않는다 — 셰이더 컴파일과 첫 페인트가 섞여 있다.
     */
    let ticks = 0;
    let windowStart = 0;
    let warmup = true;
    let strikes = 0;
    const FLOOR = 40;
    const STRIKES = 3;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);

      if (now - lastDraw >= interval) {
        lastDraw = now;
        invalidate();
      }

      ticks += 1;
      if (windowStart === 0) windowStart = now;
      if (now - windowStart < 1000) return;

      const achieved = (ticks * 1000) / (now - windowStart);
      ticks = 0;
      windowStart = now;
      if (warmup) {
        warmup = false;
        return;
      }
      // 숨은 탭은 브라우저가 rAF를 초당 한 번까지 늦춘다 — 느린 것이 아니라
      // 쉬는 중이므로 판정하지 않는다. 돌아왔을 때 하늘이 없으면 안 된다.
      if (document.visibilityState !== "visible") {
        strikes = 0;
        return;
      }
      strikes = achieved < FLOOR ? strikes + 1 : 0;
      if (strikes >= STRIKES && onTooSlow) {
        cancelAnimationFrame(raf);
        onTooSlow();
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate, onTooSlow]);
  return null;
}

export default function SkyCanvas({
  tier,
  onTooSlow,
}: {
  tier: "full" | "lite";
  onTooSlow?: () => void;
}) {
  return (
    <Canvas
      /**
       * DPR 1 고정. 이전에는 최대 2까지 올렸는데, 이 캔버스의 비용은 거의 전부
       * Aurora의 프래그먼트 셰이더라 픽셀 수에 정비례한다 — 2배 DPI면 픽셀이
       * 4배, 즉 셰이더 비용도 4배다. 그 대가로 얻는 것은 "흐릿한 빛 커튼의
       * 더 선명한 흐릿함"뿐이라 값을 못 한다(2026-08-14 프로파일: 메인 페이지
       * 스크롤 22fps, 셰이더 해상도를 절반으로 낮추면 31fps로 회복).
       * 별은 gl_PointSize 하한이 1px이라 이 값에서도 사라지지 않는다.
       */
      dpr={1}
      camera={{ position: [0, 0, 2], fov: 60 }}
      gl={{ antialias: false, powerPreference: "low-power" }}
      // PaceKeeper가 부를 때만 그린다. 기본값(always)은 스크롤 여부와 무관하게
      // 60fps로 화면 전체 셰이더를 돌린다.
      frameloop="demand"
    >
      <PaceKeeper fps={tier === "lite" ? 20 : 30} onTooSlow={onTooSlow} />
      {/* 빛의 장막(§10-2). 캔버스를 통째로 덮으므로 이 티어에서 CSS 배경은
          첫 페인트에만 잠깐 보인다. lite는 fbm 겹을 줄여 픽셀 비용을 낮춘다. */}
      <Aurora octaves={tier === "lite" ? 2 : 3} />
      {/* 여백이 느껴지도록 이전(1200/400)보다 낮춘 밀도. lite:full 비율(약 1:3)은 유지. */}
      <Starfield count={tier === "lite" ? 220 : 650} parallax={tier === "full"} />
    </Canvas>
  );
}
