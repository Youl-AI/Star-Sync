"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateStars } from "@/lib/stars";

// globals.css의 --color-starlight와 동일한 값. CSS 커스텀 프로퍼티를 런타임에 읽어
// 사용하는 것이 1순위이며, 이 상수는 (SSR 등으로) document에 접근할 수 없을 때만
// 쓰는 폴백이다 — 토큰 값이 바뀌면 이 한 곳만 맞춰주면 된다.
const STARLIGHT_FALLBACK = "#e8e4d8";

// gl_PointCoord 기준 별 스프라이트를 그리는 셰이더.
// - aSize: Star.size(0.5~2)를 그대로 받아 별마다 확실히 다른 크기로 렌더한다.
// - aAlpha: aSize에서 파생한 밝기(3제곱으로 왜곡해 "소수만 밝고 대다수는 흐릿"하게 만든다).
// - aPhase: Star.phase를 시간에 더해 별마다 다른 위상으로 아주 느리게 반짝이게 한다.
const VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aPhase;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSizeScale;

  varying float vAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

    // 진폭을 작게 유지한 아주 느린 반짝임 (촌스러운 깜빡임 방지)
    float twinkle = 0.88 + 0.12 * sin(uTime * 0.5 + aPhase);
    vAlpha = aAlpha * twinkle;

    float attenuation = uSizeScale / max(0.001, -mvPosition.z);
    // 상한을 48 -> 9로 낮췄다: 예전 상한(48px)에서는 가장 크고 가까운 별들이
    // 죄다 이 값에 clamp되어 큼직한 원반으로 뭉개져 렌즈 보케처럼 보였다.
    // 밤하늘은 아무리 밝은 별도 점광원이라 화면상 지름이 몇 픽셀을 넘지 않는다.
    gl_PointSize = clamp(aSize * uPixelRatio * attenuation, 1.0, 9.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // gl_PointCoord 중심으로부터의 거리로 둥글고 부드러운 알파 폴오프를 만든다
    // (사각 점 대신 가장자리가 자연스럽게 사라지는 원형 스프라이트).
    vec2 centered = gl_PointCoord - vec2(0.5);
    float dist = length(centered) * 2.0;
    // 가장자리를 더 빨리 죽여(0.7 지점부터 0으로) 부드러운 원반 대신 또렷한
    // 점처럼 보이게 한다 — 기존 smoothstep(1.0, 0.0, dist)는 반경 전체에 걸쳐
    // 서서히 페이드되어 큰 포인트 크기와 만나면 보케(렌즈 흐림)처럼 보였다.
    float falloff = smoothstep(0.7, 0.0, dist);

    float alpha = falloff * vAlpha;
    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function Starfield({ count, parallax }: { count: number; parallax: boolean }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();

  const { positions, sizes, alphas, phases } = useMemo(() => {
    const stars = generateStars(count, 20260810);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const phases = new Float32Array(count);

    stars.forEach((s, i) => {
      positions[i * 3] = s.x * 6;
      positions[i * 3 + 1] = s.y * 4;
      positions[i * 3 + 2] = s.z * 2 - 3;

      sizes[i] = s.size;

      // size(0.5~2) -> t(0~1) -> 3제곱으로 왜곡해 밝은 별을 소수로 만든다.
      const t = (s.size - 0.5) / 1.5;
      alphas[i] = 0.14 + 0.62 * t * t * t;

      phases[i] = s.phase;
    });

    return { positions, sizes, alphas, phases };
  }, [count]);

  const color = useMemo(() => {
    if (typeof document === "undefined") return new THREE.Color(STARLIGHT_FALLBACK);
    const token = getComputedStyle(document.documentElement).getPropertyValue("--color-starlight").trim();
    return new THREE.Color(token || STARLIGHT_FALLBACK);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uSizeScale: { value: 26 },
      uColor: { value: color },
    }),
    [color],
  );

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.z += dt * 0.004; // 하늘의 자전
    if (parallax) {
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * 0.03, 0.05);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.03, 0.05);
    }
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
      material.current.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    }
  });

  return (
    <group ref={group}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
          <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  );
}
