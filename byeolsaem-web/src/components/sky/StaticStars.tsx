import { generateStars } from "@/lib/stars";

// 움직이지 않는 별하늘. 두 곳이 쓴다.
//   1) SkyBackdrop의 static 티어 — WebGL 미지원 또는 prefers-reduced-motion
//   2) (night-static) 라우트 그룹 — Three.js를 아예 싣지 않는 페이지들
//
// generateStars의 결정론적 좌표를 그대로 재사용해 외부 이미지 파일 없이 렌더한다.
// 애니메이션이 전혀 없어야 하므로 transition/transform을 일절 쓰지 않는다.
const STATIC_STAR_COUNT = 150;
const STATIC_STARS = generateStars(STATIC_STAR_COUNT, 1);

export function StaticStars({ className = "absolute inset-0" }: { className?: string }) {
  return (
    <div className={`${className} overflow-hidden`} aria-hidden>
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
