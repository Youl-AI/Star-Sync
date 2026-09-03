import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * 사이트 안의 모든 내부 링크. `next/link`를 직접 쓰지 않고 이것을 쓴다.
 *
 * 차이는 하나 — 프리페치를 끈 채로 온다.
 *
 * Next의 `<Link>`는 화면에 들어오는 순간 그 페이지의 RSC 데이터를 미리
 * 받아 두려 한다. 그런데 정적 export가 굽는 파일은 세그먼트별 디렉터리인데
 * (`/today/__next.<id>/today/__PAGE__.txt`) 브라우저가 요청하는 이름은 그
 * 조각들을 점으로 이어 붙인 것이라(`/today/__next.<id>.today.__PAGE__.txt`)
 * 서로 맞지 않는다. Next 자체 서버는 이 둘을 매핑해 주지만 우리는 Cloudflare가
 * 파일을 그대로 내주므로, 프리페치가 전부 404로 떨어졌다 — 2026-09-04 실측으로
 * 페이지를 한 번 열 때마다 13~15건.
 *
 * `experimental.prefetchInlining: false`도 시험했지만 요청이 25건으로 늘기만
 * 했다. 점 표기는 인라이닝과 무관하게 쓰이는 이름이었다.
 *
 * 끄는 데 대가가 없다는 근거: 이동은 이미 프리페치 없이 빠르다(클릭에서 렌더까지
 * 62ms 실측). 페이지가 전부 정적이라 받아 올 데이터가 없고, 페이지를 그릴 JS
 * 청크는 postbuild의 prefetch-chunks.mjs가 따로 미리 깔아 두기 때문이다.
 * 그러니 404 나던 프리페치는 아무도 쓰지 않는 헛요청이었다.
 *
 * 나중에 Next가 이름을 맞춰 주면 기본값을 되돌리면 된다. 그때 고칠 곳은 이 파일
 * 하나다 — 그러라고 스물다섯 군데의 import를 여기로 모았다.
 */
export function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
