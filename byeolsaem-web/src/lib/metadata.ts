import type { Metadata } from "next";

/**
 * 페이지의 정규 주소(canonical)를 RSS 링크와 함께 만든다.
 *
 * 두 값을 굳이 한 함수에서 같이 만드는 이유가 있다. Next의 metadata 상속은
 * `alternates`를 **통째로 갈아끼운다** — 페이지가 canonical만 적으면 루트
 * 레이아웃(layout.tsx)이 넣어 둔 RSS 링크가 그 페이지에서 사라진다.
 * 실제로 그랬다: 배포본에서 `/today`와 `/yearly`에만
 * `<link rel="alternate" type="application/rss+xml">`이 없었다(2026-08-17 실측).
 *
 * canonical이 필요한 이유는 물음표 뒤다. `/sign/scorpio/` 같은 경로 변형은
 * 호스트가 307로 정리하지만, `?utm_source=kakao`나 페이스북이 붙이는
 * `?fbclid=…`는 리다이렉트에 걸리지 않고 그대로 200으로 열린다. 같은 글이
 * 여러 주소로 세어지면 링크 평가가 그만큼 쪼개진다.
 *
 * 경로는 metadataBase(https://byeolsaem.com) 기준의 절대 경로로 준다.
 * 한글 슬러그는 Next가 URL로 만들 때 알아서 퍼센트 인코딩한다.
 *
 * 색인시키지 않는 페이지(`robots: { index: false }`)에는 쓰지 않는다.
 * 색인하지 말라면서 정규 주소를 알려 주는 것은 서로 어긋나는 신호다.
 */
export function alternatesFor(path: string): Metadata["alternates"] {
  return {
    canonical: path,
    types: { "application/rss+xml": "/rss.xml" },
  };
}

/**
 * 페이지 전용 공유 카드. Next의 metadata 병합은 얕아서 페이지가 openGraph를
 * 선언하면 레이아웃의 siteName·locale까지 통째로 사라진다(최종 리뷰
 * 2026-08-22에서 실측). 그래서 이미지 하나를 얹을 때도 공유 필드를 함께 낸다.
 */
export function ogImage(path: string, image: string) {
  return {
    type: "website" as const,
    siteName: "별샘",
    locale: "ko_KR",
    url: path,
    images: [{ url: image, width: 1200, height: 630 }],
  };
}
