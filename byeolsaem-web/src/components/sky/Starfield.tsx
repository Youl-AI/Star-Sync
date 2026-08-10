"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateStars } from "@/lib/stars";

export function Starfield({ count, parallax }: { count: number; parallax: boolean }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const positions = useMemo(() => {
    const stars = generateStars(count, 20260810);
    const arr = new Float32Array(count * 3);
    stars.forEach((s, i) => {
      arr[i * 3] = s.x * 6;
      arr[i * 3 + 1] = s.y * 4;
      arr[i * 3 + 2] = s.z * 2 - 3;
    });
    return arr;
  }, [count]);

  useFrame((_, dt) => {
    if (!group.current) return;
    group.current.rotation.z += dt * 0.004; // 하늘의 자전
    if (parallax) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * 0.03, 0.05);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.03, 0.05);
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.02} sizeAttenuation color="#e8e4d8" transparent opacity={0.9} />
      </points>
    </group>
  );
}
