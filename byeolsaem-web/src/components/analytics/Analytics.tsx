import Script from "next/script";

/**
 * Google Analytics 4.
 *
 * 광고 스크립트와 달리 **메인을 포함한 모든 페이지**에 싣는다. 메인이 사람들이
 * 처음 닿는 자리라 거기 숫자가 가장 중요하고, gtag는 DOM에 끼어들지 않아
 * 레이아웃을 흔들지 않는다.
 *
 * 페이지 이동은 따로 보내지 않는다. 이 사이트의 내부 이동은 router.push, 즉
 * history.pushState인데, GA4의 향상된 측정('브라우저 기록 이벤트 기반 페이지
 * 변경', 기본 켜짐)이 그것을 이미 페이지 조회로 집계한다. 여기서 손으로 한 번
 * 더 보내면 같은 이동이 두 번 세어진다.
 *
 * 개인정보처리방침이 이미 이 도구를 쓴다고 적고 있다(§4). 이제 그 문장이
 * 사실이 됐다 — 리뉴얼 이후로는 코드가 빠져 있어 방침만 남아 있었다.
 */
const MEASUREMENT_ID = "G-DXZZZ1ZQP6";

export function Analytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
