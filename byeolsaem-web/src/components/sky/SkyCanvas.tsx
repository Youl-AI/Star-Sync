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
      <Starfield count={tier === "lite" ? 400 : 1200} parallax={tier === "full"} />
    </Canvas>
  );
}
