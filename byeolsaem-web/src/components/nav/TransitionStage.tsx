"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * 페이지 전환 — View Transitions 크로스페이드 (2026-08-14 확정).
 *
 * 내부 링크로 이동할 때 브라우저가 이전 화면과 새 화면을 통째로 부드럽게 겹쳐
 * 넘긴다. 라우트 그룹이 배경·네비를 유지해 주는 위에 이 크로스페이드가 얹혀,
 * 콘텐츠 기둥이 한 프레임에 확 바뀌는 "뚝"이 사라진다. 시안 셋(입장 페이드 /
 * 커튼 / VT)을 실기기에서 비교해 이것으로 골랐다 — 가장 은은하고 대기 시간이
 * 없으며, 상시 비용도 0이다(전환 순간 0.3초만 스냅숏을 쓰고 버린다).
 *
 * 겸손한 강화다: View Transitions 미지원 브라우저와 감소 모드에서는 지금까지의
 * 즉시 전환 그대로다. /sign 진(陣)에서 상세로 가는 이동은 성좌 모프가 자체
 * 안무로 완결하므로 여기서 건드리지 않는다.
 */

/** 성좌 모프가 관할하는 이동인가 — 진에서 상세 페이지로. */
function isSignMorphNav(href: string, from: string) {
  return from === "/sign" && href.startsWith("/sign/");
}

export function TransitionStage() {
  const router = useRouter();

  // 캡처 단계 — 라우터의 위임 리스너보다 먼저 클릭을 읽는다.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!("startViewTransition" in document)) return;
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
        return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href");
      // 내부 경로 이동만. 해시·외부·새 탭은 그대로 둔다.
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;
      if (link?.getAttribute("target") === "_blank") return;
      if (href === location.pathname) return;
      if (isSignMorphNav(href, location.pathname)) return;

      e.preventDefault();

      const fromPath = location.pathname;
      (document as Document & {
        startViewTransition: (cb: () => Promise<void>) => unknown;
      }).startViewTransition(async () => {
        router.push(href);
        // 주의: 이 콜백이 도는 동안 브라우저는 렌더링을 정지시키므로
        // requestAnimationFrame은 한 번도 불리지 않는다 — rAF로 폴링하면
        // 영영 해결되지 않아 "timeout in DOM update"로 중단된다(실측).
        // 타이머는 정지 중에도 돌므로 타이머로 라우트 커밋을 감지한다.
        const deadline = performance.now() + 1200;
        await new Promise<void>((resolve) => {
          const check = () => {
            if (location.pathname !== fromPath || performance.now() > deadline) resolve();
            else setTimeout(check, 32);
          };
          check();
        });
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  return null;
}
