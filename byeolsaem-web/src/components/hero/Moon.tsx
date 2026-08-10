// 히어로의 달 — 채워진 원반이 아니라 "달무리(halo)"다.
// 얇은 금색 테두리 + 은은한 발광 + 안쪽 작은 동심원 하나뿐이라 배경 별하늘이
// 안쪽으로 그대로 비쳐 보인다. absolute 배치는 부모(HeroSequence의 section)를 기준으로 하고,
// id="hero-moon"은 다음 태스크(GSAP 장면 전환)가 이동 애니메이션 대상으로 참조한다.
export function Moon({ className = "" }: { className?: string }) {
  return (
    <div id="hero-moon" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <div className="relative">
        <div className="size-[260px] rounded-full border border-gold/50 shadow-[0_0_90px_14px_rgba(201,162,39,0.16),inset_0_0_60px_rgba(201,162,39,0.12)] md:size-[400px]" />
        <div className="absolute inset-[18%] rounded-full border border-gold/25" />
      </div>
    </div>
  );
}
