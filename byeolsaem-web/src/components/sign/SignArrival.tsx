"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { EASE_IN_OUT, EASE_OUT, clearStyles, tween, tweenAll } from "@/lib/tween";
import { ARRIVE_MORPH_KEY, BACK_MORPH_KEY, clearMarker, takeMarker } from "./signMorph";

/**
 * 상세 페이지가 모프의 뒷부분을 받는 자리.
 *
 * 진(陣)은 성좌를 화면 한가운데로 날려 카드로 응결시키는 데까지만 한다. 그
 * 다음 프레임에 라우트가 바뀌면서 카드가 갑자기 페이지 위쪽 제자리에 나타나면
 * 방금 본 응결과 이어지지 않는다 — 그래서 여기서 카드를 **화면 한가운데에서
 * 받아** 제자리로 올려보낸다. 두 페이지가 한 동작의 앞뒤가 된다.
 *
 * 표식이 없으면(검색 결과에서 직접 착지, 새로고침, reduced-motion) 아무 일도
 * 하지 않는다. 그 경우 페이지는 처음부터 완성된 화면이어야 한다.
 *
 * 아래 두 개의 data 속성이 이 컴포넌트와 페이지 사이의 약속이다:
 * - `data-morph-card` — 한가운데에서 날아 들어올 카드. 하나만 있어야 한다.
 * - `data-morph-veil` — 카드가 오는 동안 뒤따라 떠오를 나머지 부분.
 */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SignArrival({ sign, children }: { sign: string; children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (takeMarker(ARRIVE_MORPH_KEY) !== sign) return;

    const card = root.querySelector<HTMLElement>("[data-morph-card]");
    if (!card) return;
    const veils = root.querySelectorAll<HTMLElement>("[data-morph-veil]");

    const rect = card.getBoundingClientRect();
    // 진이 카드를 놓아 준 자리 = 화면 한가운데. 그 지점에서 출발해 제자리로
    // 돌아온다. 진 쪽 오버레이도 같은 크기로 그리므로 배율 보정이 필요 없다.
    const dx = window.innerWidth / 2 - (rect.left + rect.width / 2);
    const dy = window.innerHeight / 2 - (rect.top + rect.height / 2);

    tween(card, { transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }, {
      duration: 520,
      ease: EASE_IN_OUT,
    });
    tweenAll(veils, { opacity: "0", transform: "translateY(12px)" }, { opacity: "1", transform: "none" }, {
      duration: 500,
      delay: 180,
      ease: EASE_OUT,
    });

    return () => {
      clearStyles(card, ["transform"]);
      for (const veil of veils) clearStyles(veil, ["opacity", "transform"]);
    };
  }, [sign]);

  useEffect(() => {
    // 돌아갈 표식은 진이 날려 보내면서 이미 남겨 두었다(signMorph.ts 참고).
    // 여기서 하는 일은 그 표식을 **거두는 것**이다 — 방문자가 별자리 구역을
    // 떠나기로 했다면 되돌아갈 성좌도 없다. 이게 없으면 상세 → 홈 → 다시
    // 목록으로 온 사람에게 성좌 하나가 난데없이 날아 들어온다.
    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      if (!href || href === "/sign" || href.startsWith("/sign/")) return;
      clearMarker(BACK_MORPH_KEY);
    };
    // 캡처 단계로 듣는다. 라우터가 클릭을 가로채 페이지를 갈아 끼우기 전에
    // 판단이 끝나야 한다.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
