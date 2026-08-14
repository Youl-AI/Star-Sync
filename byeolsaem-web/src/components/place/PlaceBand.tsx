/**
 * 도구 페이지 상단의 "장소" 밴드.
 *
 * 메인의 수직 세계가 확정한 세계관 — 모든 도구는 샘의 세계 어딘가에서 열린다 —
 * 을 각 페이지 첫 화면에 한 장의 그림으로 새긴다. 그림 상단 1/3은 거의 검게
 * 생성해 두었으므로 pt-28 아래에 오는 제목이 그대로 읽히고, 하단은 CSS 마스크로
 * 배경색에 녹아 어디에도 절단면이 없다(.place-band 주석 참고).
 *
 * 서버 컴포넌트다. (night-static) 그룹의 성능 규칙(§7) 때문에 여기서는 어떤
 * 스크립트도 싣지 않는다 — 움직임이 필요한 페이지는 본문 컴포넌트가 알아서 한다.
 */
export function PlaceBand({ src, children }: { src: string; children?: React.ReactNode }) {
  return (
    <div className="place-band" aria-hidden>
      {/* 첫 화면을 채우는 그림이라 즉시 내려받는다. 장식이므로 대체 텍스트는 비운다. */}
      <img src={src} alt="" fetchPriority="high" decoding="async" />
      {/* 페이지별 연출 층(예: /natal 촛불 글로우). 순수 CSS만 허용 — §7. */}
      {children}
    </div>
  );
}
