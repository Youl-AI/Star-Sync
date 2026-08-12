import { BirthPanel } from "@/components/birth/BirthPanel";
import { Veil } from "@/components/nav/Veil";
import { StaticStars } from "@/components/sky/StaticStars";

/**
 * 밤의 배색은 그대로, 살아 있는 하늘은 없는 세계.
 *
 * `/sign`과 `/retrograde`가 여기 산다. 어두운 도구 페이지처럼 보이지만 성능
 * 가드레일이 이 둘에 Three.js 번들을 싣는 것을 금지한다(RENEWAL_PLAN §7).
 * 검색으로 처음 들어오는 사람이 가장 많은 페이지들이라, 첫 로드가 무거우면
 * 그대로 잃는다.
 *
 * 그래서 (night)에서 WebGL 캔버스와 부드러운 스크롤만 뺀 판이다. 배경은 CSS
 * 성운과 정지 별하늘로 충분하다 — 이 페이지들에서는 하늘이 주인공이 아니라
 * 바탕이다.
 */
export default function NightStaticLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink text-starlight">
      <noscript>
        <style>{`[data-reveal]{opacity:1;transform:none}`}</style>
      </noscript>

      <div className="nebula-bg pointer-events-none fixed inset-0 z-0" aria-hidden>
        <StaticStars />
      </div>

      <Veil />
      <div className="relative z-10">{children}</div>

      {/* 출생 정보를 어느 페이지에서든 받는다. 예전에는 메인으로 돌려보냈다. */}
      <BirthPanel />
    </div>
  );
}
