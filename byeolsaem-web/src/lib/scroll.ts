// Lenis 인스턴스를 SmoothScroll이 여기 등록해두면, 페이지 어디서든 부드러운
// 스크롤로 특정 요소까지 이동시킬 수 있다. Lenis가 도는 동안 네이티브
// scrollIntoView를 쓰면 두 시스템이 스크롤 위치를 두고 다투므로, 켜져 있을 때는
// 반드시 Lenis 쪽으로 요청을 넘긴다.
interface Scroller {
  scrollTo(target: HTMLElement, options?: { onComplete?: () => void }): void;
}

let scroller: Scroller | null = null;

export function registerScroller(instance: Scroller | null): void {
  scroller = instance;
}

/**
 * id로 지정한 요소까지 스크롤한다. 이동이 끝나면 onDone을 부른다.
 *
 * onDone이 "도착 후"에 불려야 하는 이유: 호출자(세 개의 문)는 스크롤이 끝난 뒤에
 * 히어로 연출을 시작시킨다. 연출 중에 GSAP Flip이 getBoundingClientRect로 위치를
 * 재는데, 그 사이에도 페이지가 움직이고 있으면 잘못된 좌표로 보간해 달이 엉뚱한
 * 곳으로 튄다.
 */
export function scrollToId(id: string, onDone?: () => void): void {
  const el = typeof document === "undefined" ? null : document.getElementById(id);
  if (!el) {
    onDone?.();
    return;
  }

  if (scroller) {
    scroller.scrollTo(el, { onComplete: () => onDone?.() });
    return;
  }

  // Lenis가 없는 경우(= reduced-motion이라 아예 기동하지 않았거나 아직 마운트
  // 전). reduced-motion 사용자에게는 애니메이션 없이 즉시 이동시킨다.
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });

  if (reduced) {
    onDone?.();
  } else {
    // 네이티브 smooth 스크롤은 완료 콜백이 없다. 넉넉한 고정 지연으로 대신한다.
    window.setTimeout(() => onDone?.(), 700);
  }
}
