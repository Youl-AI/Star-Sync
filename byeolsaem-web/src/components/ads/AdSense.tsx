import Script from "next/script";

/**
 * 애드센스 로더.
 *
 * 이 스크립트를 부르는 페이지에만 광고가 붙을 수 있으므로, **어디에 두느냐가 곧
 * 광고 정책이다.** 그래서 개별 페이지가 아니라 라우트 그룹의 레이아웃에 둔다 —
 * 페이지가 늘어날 때마다 정책을 다시 챙기지 않아도 되고, 지금 어디에 광고가
 * 붙는지 파일 두 개만 보면 안다.
 *
 *   (dawn)        — 칼럼·소개·방침. 광고 있음
 *   (night-static) — 오늘·천궁도·궁합·한 해·별자리·역행. 광고 있음
 *   (night)        — 메인의 수직 세계. **광고 없음**
 *
 * 메인만 빼는 이유는 둘이다. 몰입 스크롤 한가운데에 자동 광고가 끼면 이 사이트가
 * 파는 것 자체가 망가지고, 그 페이지는 하늘 셰이더 비용을 덜어내는 데 한참을
 * 들인 곳이라(2026-08-14 성능 작업) 서드파티 스크립트를 다시 얹을 자리가 없다.
 *
 * 대시보드의 자동 광고에서 전면 광고(Interstitial)는 반드시 꺼야 한다 — 페이지
 * 이동마다 전체 화면을 덮어 크로스페이드 전환과 별자리 모프를 정면으로 깨뜨린다.
 */
const PUBLISHER_ID = "ca-pub-6538739927923803";

export function AdSense() {
  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`}
      crossOrigin="anonymous"
    />
  );
}
