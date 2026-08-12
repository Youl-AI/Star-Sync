import { SkyBackdrop } from "@/components/sky/SkyBackdrop";
import { BirthPanel } from "@/components/birth/BirthPanel";
import { Veil } from "@/components/nav/Veil";
import { SmoothScroll } from "@/components/SmoothScroll";

/**
 * 밤 — 도구 페이지의 세계. 메인, /natal, /today, /synastry, /yearly가 여기 산다.
 *
 * WebGL 별하늘은 이 레이아웃에서만 마운트된다. 읽는 페이지(/blog, /about,
 * /privacy)와 정적 SEO 페이지(/sign, /retrograde)에는 Three.js 번들이 실리지
 * 않아야 하기 때문이다(RENEWAL_PLAN §7).
 */
export default function NightLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ink text-starlight">
      {/* 스크롤 등장 대상은 CSS에서 opacity 0으로 시작해 IntersectionObserver가
          켜주기를 기다린다. 자바스크립트가 아예 실행되지 않는 환경에서는 그
          신호가 영영 오지 않아 본문이 통째로 보이지 않게 되므로, 그때는 처음부터
          보이게 되돌린다. */}
      <noscript>
        <style>{`[data-reveal]{opacity:1;transform:none}`}</style>
      </noscript>
      {/* SkyBackdrop 자신은 fixed + z-0(컴포지팅 버그 회피, SkyBackdrop.tsx 주석 참고)이라
          일반 흐름 콘텐츠보다 스택 레벨상 위에 그려질 수 있다. 이를 막기 위해 {children}을
          relative z-10 래퍼로 감싸 명시적 스택 컨텍스트를 부여한다 — 페이지마다 이 래퍼를
          반복해서 챙길 필요가 없도록 레이아웃에서 한 번에 처리한다. Veil 네비(z-40)는
          그보다 항상 위에 있다. */}
      <SmoothScroll />
      <SkyBackdrop />
      <Veil />
      <div className="relative z-10">{children}</div>

      {/* 출생 정보를 어느 페이지에서든 받는다. 메인에는 히어로의 의식이 따로 있어
          여기서는 열리지 않는다 — requestRitual이 히어로 유무를 보고 고른다. */}
      <BirthPanel />
    </div>
  );
}
