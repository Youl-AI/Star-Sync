"use client";
import { useEffect, useRef, useState } from "react";

/**
 * 요소가 화면에 들어왔는가. 한 번 들어오면 되돌리지 않는다.
 *
 * 왜 필요한가. 마운트할 때 시작하는 연출은 아무도 보지 못한다 — 화면 절반 아래에
 * 있는 그림은 사람이 스크롤로 내려오는 데 1~2초가 걸리고, 도착했을 때는 이미 다
 * 끝나 있다. 발화 시점은 마운트가 아니라 **눈에 들어오는 순간**이어야 한다.
 *
 * 감소 모드에서는 옵저버를 걸지 않고 처음부터 참을 돌려준다. 이 값을 쓰는 쪽이
 * 대개 "아직이면 감춰 둔다"로 시작하므로, 그대로 두면 움직임을 끈 사람에게 그림이
 * 영영 나타나지 않는다.
 *
 * `Reveal`과 나누어 쓴다. 그쪽은 [data-reveal]이 붙은 여러 요소를 한꺼번에
 * 맡고 클래스를 토글하는 반면, 이쪽은 한 요소의 상태 하나를 돌려준다 — SVG처럼
 * 무엇을 어떻게 그릴지가 그 상태에 달린 경우에 쓴다.
 */
export function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}
