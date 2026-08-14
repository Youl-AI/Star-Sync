"use client";
import { Canvas } from "@react-three/fiber";
import { Aurora } from "./Aurora";
import { Starfield } from "./Starfield";

export default function SkyCanvas({ tier }: { tier: "full" | "lite" }) {
  return (
    <Canvas
      dpr={tier === "lite" ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 2], fov: 60 }}
      gl={{ antialias: false, powerPreference: "low-power" }}
    >
      {/* 빛의 장막(§10-2). 캔버스를 통째로 덮으므로 이 티어에서 CSS 배경은
          첫 페인트에만 잠깐 보인다. lite는 fbm 겹을 줄여 픽셀 비용을 낮춘다. */}
      <Aurora octaves={tier === "lite" ? 4 : 5} />
      {/* 여백이 느껴지도록 이전(1200/400)보다 낮춘 밀도. lite:full 비율(약 1:3)은 유지. */}
      <Starfield count={tier === "lite" ? 220 : 650} parallax={tier === "full"} />
    </Canvas>
  );
}
