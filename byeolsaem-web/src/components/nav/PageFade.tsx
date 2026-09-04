"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * 페이지가 바뀔 때 본문 기둥만 짧게 밝아진다.
 *
 * 원래 이 자리에는 View Transitions 크로스페이드(TransitionStage)가 있었다.
 * 링크 클릭을 가로채 document.startViewTransition을 열고, 그 콜백 안에서
 * router.push를 부른 뒤 주소가 바뀌기를 기다리는 방식이었다. 그런데 그
 * 기다림은 영영 끝나지 않는다 — 전환 콜백이 매달려 있는 동안 리액트가 새
 * 라우트를 커밋하지 못하고, 커밋되지 않으니 주소도 바뀌지 않는다. 결국 매번
 * 1200ms 마감 시각까지 버틴 뒤에야 풀렸다.
 *
 * 실측(2026-09-05, 정적 서버 + 크롬): 감소 모드에서 27~34ms이면 끝나는 이동이
 * 전환을 켜면 1.1~2.1초가 걸렸다. 그동안 화면은 옛 페이지 그대로 멈춰 있고,
 * 마감이 지난 뒤 새 화면이 툭 나타난다 — 크로스페이드는 걸리지도 않는다.
 * 브라우저가 "새 화면"으로 찍는 스냅숏이 아직 옛 내용이기 때문이다.
 *
 * 리액트 19.2 정식판에는 아직 <ViewTransition>이 없다(next 문서가 말하는 길은
 * 카나리아 전용). 그래서 같은 의도 — 기둥이 한 프레임에 갈리지 않게 —를
 * 브라우저 전환 없이 CSS 한 줄로 되찾는다. 옛 화면과 겹치지는 않지만 값이 0이고,
 * 무엇보다 이동이 즉시 일어난다.
 *
 * 첫 방문에는 걸지 않는다. 첫 화면까지 180ms 투명하게 두면 LCP가 그만큼 밀린다.
 */
export function PageFade({ className, children }: { className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return (
    <div key={pathname} className={first.current ? className : `page-fade ${className ?? ""}`}>
      {children}
    </div>
  );
}
