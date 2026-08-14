import { generateStars } from "@/lib/stars";

// 정지 별하늘. 두 곳이 쓴다.
//   1) SkyBackdrop의 static 티어 — WebGL 미지원 또는 prefers-reduced-motion
//   2) (night-static) 라우트 그룹 — Three.js를 아예 싣지 않는 페이지들
//
// generateStars의 결정론적 좌표를 그대로 재사용해 외부 이미지 파일 없이 렌더한다.
// 반짝임은 CSS 키프레임(.static-star)이 맡는다 — 스크립트 0바이트라 (night-static)의
// 번들 규칙과 무관하고, 감소 모드에서는 미디어 쿼리가 애니메이션을 아예 붙이지
// 않아 원래의 "완전 정지" 하늘로 남는다. 주기와 시차도 좌표에서 결정론적으로
// 뽑는다: 같은 별은 언제나 같은 리듬으로 숨쉰다.
const STATIC_STAR_COUNT = 150;
const STATIC_STARS = generateStars(STATIC_STAR_COUNT, 1);

export function StaticStars({ className = "absolute inset-0" }: { className?: string }) {
  return (
    <div className={`${className} overflow-hidden`} aria-hidden>
      {STATIC_STARS.map((s, i) => (
        <span
          key={i}
          className="static-star absolute rounded-full bg-starlight"
          style={
            {
              left: `${((s.x + 1) / 2) * 100}%`,
              top: `${((s.y + 1) / 2) * 100}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              "--star-o": 0.3 + ((s.z + 1) / 2) * 0.5,
              "--star-dur": `${(3.5 + ((s.x + 1) / 2) * 4).toFixed(2)}s`,
              "--star-delay": `${(((s.y + 1) / 2) * -6).toFixed(2)}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
