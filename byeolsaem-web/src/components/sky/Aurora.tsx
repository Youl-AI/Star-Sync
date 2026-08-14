"use client";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 빛의 장막(§10-2, 시안 B 확정 2026-08-13) — 오로라처럼 넘실대는 빛의 커튼.
 *
 * 화면 전체를 덮는 사각형 하나에 프래그먼트 셰이더로 그린다. 카메라와 무관하게
 * 정점을 클립 공간에 바로 놓으므로 별(Starfield)의 시차·자전과 간섭하지 않는다.
 * 별보다 먼저(renderOrder -1) 그려져 커튼 위에 별이 뜬다.
 *
 * 스크롤이 밤의 여정을 민다(uScroll 0→1):
 *   히어로   — 커튼이 가장 살아 있다.
 *   본문     — 가라앉는다. 읽는 글 뒤에서 빛이 출렁이면 안 된다.
 *   페이지 끝 — 여명. 커튼이 다시 옅게 올라오며 금빛으로 기운다.
 * 예전에 CSS 크로스페이드(NightJourney)가 하던 이야기를 셰이더가 이어받았다.
 * NightJourney는 이 캔버스가 없는 정지 티어의 바탕으로 남는다.
 *
 * 그레인·비네트는 여기서 굽지 않는다 — 캔버스 위 CSS 층(§10-1)이 이미 한다.
 */

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // 클립 공간 사각형. z를 최원면 근처에 둬 어떤 카메라에서도 화면을 덮는다.
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uScroll;
  uniform float uAspect;
  uniform vec2 uPointer;
  uniform float uIntensity;

  varying vec2 vUv;

  /* 팔레트: globals.css 토큰 그대로 */
  const vec3 INK    = vec3(0.043, 0.055, 0.102);
  const vec3 VIOLET = vec3(0.427, 0.353, 0.812);
  const vec3 GOLD   = vec3(0.788, 0.635, 0.153);
  const vec3 CREAM  = vec3(0.910, 0.894, 0.847);

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < OCTAVES; i++) {
      v += a * noise(p);
      p = rot * p;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = vec2(uv.x * uAspect, uv.y) + uPointer * 0.06;
    float slow = uTime * 0.05;

    /* 여정: 본문에서 가라앉는다(0.12~0.4). 커튼은 끝까지 돌아오지 않는다 —
       페이지 끝은 커튼의 자리가 아니라 여명의 자리다(아래 지평선 참고). */
    float calm = 1.0 - 0.72 * smoothstep(0.10, 0.38, uScroll);
    float dawn = smoothstep(0.80, 1.0, uScroll);

    vec3 col = INK * (0.92 - 0.10 * uScroll);

    /* 커튼 셋. x를 따라 넘실대는 밴드가 각자 다른 높이·속도로 흐른다. */
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float wave = fbm(vec2(p.x * 1.4 + fi * 4.7, slow + fi * 1.7));
      /* 스크롤이 커튼을 천천히 밀어 올린다 — 내려가는 사람의 시차. */
      float y = 0.30 + 0.38 * wave + fi * 0.10 + uScroll * 0.22;
      float band = exp(-abs(p.y - y) * (7.5 - fi * 1.8));
      float flow = fbm(vec2(p.x * 3.2 - slow * 2.2 + fi * 9.1, p.y * 2.2));
      vec3 tint = mix(VIOLET, GOLD, smoothstep(0.35, 0.75, flow) * (0.35 + fi * 0.22));
      col += tint * band * flow * 0.34 * calm * uIntensity;
    }

    /* 여명은 지평선에서 온다. 페이지 끝에서 화면 아래 모서리로부터 창백한
       금빛이 차오른다 — 커튼과 다른 그림이라 푸터가 자기 얼굴을 갖는다. */
    if (dawn > 0.001) {
      float horizon = exp(-uv.y * 3.2);
      float shimmer = fbm(vec2(p.x * 2.4 + slow * 0.6, uv.y * 3.0));
      vec3 dawnLight = mix(GOLD, CREAM, 0.45);
      col += dawnLight * horizon * (0.34 + 0.22 * shimmer) * dawn * uIntensity;
      col += VIOLET * exp(-uv.y * 1.4) * 0.10 * dawn;
    }

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Aurora({
  octaves = 3,
  intensity = 1,
}: {
  /**
   * fbm 겹 수. 이 셰이더의 비용은 여기에 정비례한다 — 픽셀 하나가 커튼 3장 ×
   * fbm 2회 = 6회 fbm을 돌고, fbm 한 번이 octaves × noise(=hash 4회)다. 겹마다
   * 진폭이 반씩 줄어 4번째 겹은 전체의 6%, 5번째는 3%인데 그 3%가 픽셀당
   * sin() 48회를 더 부른다. 흐릿한 빛 커튼에서는 보이지 않는 값이라 3에서
   * 끊는다(2026-08-14 프로파일).
   */
  octaves?: number;
  intensity?: number;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const { pointer } = useThree();
  const scroll = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uAspect: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: intensity },
    }),
    [intensity],
  );

  useFrame((state) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uAspect.value = state.size.width / state.size.height;

    // 문서의 어디쯤인가(0~1). 급브레이크가 걸리지 않게 눅여서 따라간다.
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max > 0 ? window.scrollY / max : 0;
    scroll.current += (target - scroll.current) * 0.06;
    m.uniforms.uScroll.value = scroll.current;

    const pv = m.uniforms.uPointer.value as THREE.Vector2;
    pv.x += (pointer.x - pv.x) * 0.04;
    pv.y += (pointer.y - pv.y) * 0.04;
  });

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        defines={{ OCTAVES: octaves }}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
