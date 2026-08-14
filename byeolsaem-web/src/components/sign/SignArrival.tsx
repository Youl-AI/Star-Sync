"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { EASE_IN_OUT, EASE_OUT, clearStyles, setStyles, tween, tweenAll } from "@/lib/tween";
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

    // 라우터의 scroll-to-top은 이 레이아웃 이펙트 **뒤에** 온다. 진에서 스크롤한
    // 채로 재면 그 오프셋만큼 카드가 아래에서 출발해, 응결된 성좌가 전환 순간
    // 뚝 떨어져 보인다(실측 226px). 먼저 우리가 맨 위로 올려놓고 재면 라우터의
    // 스크롤 리셋은 아무 일도 하지 않는 무동작이 된다.
    window.scrollTo(0, 0);
    const rect = card.getBoundingClientRect();
    // 진이 카드를 놓아 준 자리 = 화면 한가운데. "한가운데"는 innerWidth가 아니라
    // clientWidth 기준이다 — 진의 오버레이는 레이아웃(스크롤바 제외) 폭의 50%에
    // 놓이므로, innerWidth로 재면 스크롤바 절반만큼(실측 7px) 어긋난다.
    const centerTop =
      document.documentElement.clientHeight / 2 - rect.height / 2;
    const settle = rect.top - centerTop;

    // 성좌를 이어받아 그 주위로 카드를 응결시키는 본편. 진은 성좌만 날려 보냈다
    // — 카드가 미리 떠 있으면 아직 /sign인데 상세 카드가 보이는 셈이라는 피드백.
    // 전환 프레임의 연속성: 성좌 그림(data-morph-art)을 복제해 같은 화면 좌표에
    // 고정으로 띄워 두고(직전 프레임까지 진의 복제가 있던 바로 그 자리다), 카드
    // 전체를 그 아래에서 차오르게 한다. 카드가 다 차면 복제를 거두고 카드 안의
    // 성좌를 돌려놓는다 — 같은 그림·같은 좌표라 바꿔치기가 보이지 않는다.
    const art = card.querySelector<HTMLElement>("[data-morph-art]");
    let clone: HTMLElement | null = null;
    let handoff: ReturnType<typeof setTimeout> | undefined;

    if (settle >= 0 && art) {
      // 카드를 옮기는 대신 문서를 옮긴다. 처음부터 settle만큼 스크롤된 채 열면
      // 카드는 성좌가 응결된 그 자리에 정확히 놓인 채 한 픽셀도 움직이지 않는다.
      window.scrollTo(0, settle);

      const artRect = art.getBoundingClientRect();
      clone = art.cloneNode(true) as HTMLElement;
      setStyles(clone, {
        position: "fixed",
        left: `${artRect.left}px`,
        top: `${artRect.top}px`,
        width: `${artRect.width}px`,
        height: `${artRect.height}px`,
        margin: "0",
        "z-index": "30",
        "pointer-events": "none",
      });
      document.body.appendChild(clone);
      setStyles(art, { opacity: "0" });

      tween(card, { opacity: "0" }, { opacity: "1" }, { duration: 380, ease: EASE_OUT });
      handoff = setTimeout(() => {
        clearStyles(art, ["opacity"]);
        clone?.remove();
        clone = null;
      }, 400);
    } else {
      // 아주 큰 화면에서는 카드의 제자리가 화면 중앙보다 위라 스크롤로 맞출 수
      // 없다(음수 스크롤은 없다). 이때만 카드가 통째로 짧게 미끄러진다.
      const dx = document.documentElement.clientWidth / 2 - (rect.left + rect.width / 2);
      tween(card, { transform: `translate(${dx}px, ${-settle}px)` }, { transform: "none" }, {
        duration: 520,
        ease: EASE_IN_OUT,
      });
    }

    tweenAll(veils, { opacity: "0", transform: "translateY(12px)" }, { opacity: "1", transform: "none" }, {
      duration: 500,
      delay: 180,
      ease: EASE_OUT,
    });

    return () => {
      clearTimeout(handoff);
      clone?.remove();
      if (art) clearStyles(art, ["opacity"]);
      clearStyles(card, ["transform", "opacity"]);
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
