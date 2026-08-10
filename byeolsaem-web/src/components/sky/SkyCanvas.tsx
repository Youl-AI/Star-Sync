"use client";
import { Canvas } from "@react-three/fiber";
import { Starfield } from "./Starfield";

export default function SkyCanvas({ tier }: { tier: "full" | "lite" }) {
  return (
    <Canvas
      dpr={tier === "lite" ? [1, 1.5] : [1, 2]}
      camera={{ position: [0, 0, 2], fov: 60 }}
      gl={{ antialias: false, powerPreference: "low-power" }}
    >
      {/* 여백이 느껴지도록 이전(1200/400)보다 낮춘 밀도. lite:full 비율(약 1:3)은 유지. */}
      <Starfield count={tier === "lite" ? 220 : 650} parallax={tier === "full"} />
    </Canvas>
  );
}
