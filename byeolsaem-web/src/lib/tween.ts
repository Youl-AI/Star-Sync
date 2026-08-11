/**
 * CSS 트랜지션을 명령형으로 다루는 최소한의 도구.
 *
 * 애니메이션 라이브러리를 쓰지 않는 이유는 무게다. `/sign`과 `/sign/<별자리>`는
 * 검색으로 처음 들어오는 사람이 가장 많은 페이지이고, 성능 가드레일이 이 쪽에
 * 무거운 번들을 얹는 것을 금지한다(RENEWAL_PLAN §7). GSAP을 얹었을 때 이
 * 페이지의 청크가 565KB에서 667KB로 늘었다(실측) — 여기서 필요한 것은 위치와
 * 배율을 한 번 계산해 옮기는 일뿐이라, 그 대가를 치를 이유가 없다.
 *
 * 메인 페이지는 사정이 다르다. 거기는 이미 GSAP과 Three.js가 있고 연출도
 * 훨씬 복잡하다. 이 도구는 그쪽을 대체하려는 것이 아니다.
 */

/** 사이트 전체가 쓰는 감속 곡선. 빠르게 출발해 길게 멎는다. */
export const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
/** 날아가는 것에 쓰는 곡선. 양 끝이 모두 느려 궤적이 던져진 것처럼 보인다. */
export const EASE_IN_OUT = "cubic-bezier(0.5, 0, 0.2, 1)";

type Styles = Record<string, string>;

export function setStyles(element: Element, styles: Styles) {
  const target = element as HTMLElement;
  for (const [property, value] of Object.entries(styles)) {
    target.style.setProperty(property, value);
  }
}

export function clearStyles(element: Element, properties: string[]) {
  const target = element as HTMLElement;
  for (const property of properties) target.style.removeProperty(property);
  target.style.removeProperty("transition");
}

/**
 * 시작 상태를 먼저 박아 넣고, 브라우저가 그것을 인식하게 만든 뒤 목표 상태로
 * 옮긴다.
 *
 * 가운데의 `offsetWidth` 읽기가 핵심이다. 이게 없으면 브라우저는 같은 프레임에
 * 들어온 두 값 중 마지막 것만 보고 전이 없이 목표 상태로 건너뛴다. 레이아웃을
 * 강제로 계산시켜 시작 상태를 확정시키는, 이 방식의 유일한 관용구다.
 */
export function tween(
  element: Element,
  from: Styles,
  to: Styles,
  { duration, delay = 0, ease = EASE_OUT }: { duration: number; delay?: number; ease?: string },
) {
  const target = element as HTMLElement;
  target.style.setProperty("transition", "none");
  setStyles(target, from);
  void target.offsetWidth;
  target.style.setProperty(
    "transition",
    Object.keys(to)
      .map((property) => `${property} ${duration}ms ${ease} ${delay}ms`)
      .join(", "),
  );
  setStyles(target, to);
}

/** 여러 요소에 같은 전이를 건다. */
export function tweenAll(
  elements: Iterable<Element>,
  from: Styles,
  to: Styles,
  options: { duration: number; delay?: number; ease?: string },
) {
  for (const element of elements) tween(element, from, to, options);
}
