"use client";
import { useEffect, useRef } from "react";

/**
 * 안쪽 data-reveal 요소들을 각자 화면에 들어오는 순간 들여보낸다.
 *
 * 감시 대상이 섹션 전체가 아니라 요소 하나하나인 것이 핵심이다. 섹션은 위아래
 * 여백까지 합쳐 700px이 넘어서, 섹션의 위쪽 모서리가 화면에 걸리는 시점은 정작
 * 제목이 아직 화면 아래 1000px 밖에 있을 때다. 그 시점에 애니메이션을 시작하면
 * 사용자가 제목을 볼 때쯤에는 이미 다 끝나 있어서 아무 일도 없었던 것처럼
 * 보인다(실측: 리빌 발화 scrollY 90, 제목이 읽히는 위치는 scrollY 900 부근).
 *
 * 실제 움직임은 globals.css의 [data-reveal] 규칙이 맡는다. 여기서는 클래스만
 * 켜고 끈다.
 *
 * once가 아니라 토글인 이유: 위로 되감아 올라갈 때도 다시 들어와야 한다.
 * 화면 밖으로 나간 요소는 클래스를 잃고 처음 상태로 돌아가므로, 다시 내려오든
 * 올라오든 같은 등장을 반복한다.
 */
export function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");

    // 감소 모드에서는 옵저버를 아예 걸지 않고 처음부터 켜 둔다. globals.css의
    // 전역 transition-duration: .01ms 규칙은 움직임만 없앨 뿐, 옵저버를 기다리는
    // 동안 요소가 opacity 0으로 남아 있는 것은 해결해 주지 않는다.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((t) => t.classList.add("reveal-in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entry.target.classList.toggle("reveal-in", entry.isIntersecting);
        }
      },
      // 아래쪽 경계를 화면 안으로 18% 끌어올려, 요소가 화면 밑단에 겨우 걸친
      // 순간이 아니라 눈에 들어오기 시작하는 위치에서 발화하게 한다.
      { threshold: 0, rootMargin: "0px 0px -18% 0px" },
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
