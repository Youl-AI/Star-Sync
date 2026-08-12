// 핀(스크롤 고정) 연출이 켜지는 조건. 세 곳(메인 세 개의 문, /natal 원반,
// /yearly 가로 강)이 같은 값을 읽는다 — 한 곳만 조건이 다르면 어떤 기기에서는
// 어떤 페이지만 붙박이가 되어 사이트가 오락가락해 보인다.
//
// 좁은 화면을 빼는 이유: 핀은 그림과 설명을 한 화면에 붙들어 두는 장치인데,
// 모바일 세로 화면에는 둘이 나란히 설 자리가 없다. 감소 모드를 빼는 이유는
// 스펙 §4.4 그대로다 — 스크롤 연출은 즉시 표시로 내려앉는다.
export const PIN_MEDIA = "(min-width: 768px) and (prefers-reduced-motion: no-preference)";

/** 지금 이 화면이 핀 연출 대상인가. SSR에서는 false — 서버는 화면 폭을 모른다. */
export function pinCapable(): boolean {
  return typeof window !== "undefined" && window.matchMedia(PIN_MEDIA).matches;
}

/**
 * 문서 높이가 변하면 ScrollTrigger의 자리 계산을 다시 하게 한다.
 *
 * 이 사이트의 페이지는 마운트 뒤에도 키가 자란다 — 히어로의 장면 접기, 출생
 * 정보를 읽은 뒤에야 그려지는 천궁도와 연간 리포트. ScrollTrigger는 만들어질
 * 때와 window load에서만 재는데, 그 사이·이후에 위 내용이 끼어들면 핀의
 * 시작점이 실제 자리에서 수백 px 어긋난다(실측: 문 섹션 1505 vs 계산 2330).
 *
 * refresh 자체가 핀 스페이서로 높이를 바꿔 관찰자가 또 울리므로, 마지막으로 잰
 * 높이와 같으면 아무것도 하지 않는다 — 한두 번 만에 수렴한다.
 */
export function refreshOnBodyGrowth(
  refresh: () => void,
): () => void {
  let lastHeight = document.body.offsetHeight;
  let raf = 0;
  const observer = new ResizeObserver(() => {
    const height = document.body.offsetHeight;
    if (height === lastHeight) return;
    lastHeight = height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(refresh);
  });
  observer.observe(document.body);
  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
  };
}
