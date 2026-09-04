import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Analytics } from "@/components/analytics/Analytics";
import { SkipLink } from "@/components/nav/SkipLink";
import "./globals.css";

const maruburi = localFont({
  src: [
    { path: "../fonts/MaruBuri-Regular.woff2", weight: "400" },
    { path: "../fonts/MaruBuri-Bold.woff2", weight: "700" },
  ],
  variable: "--font-maruburi",
  display: "swap",
});

/**
 * 라틴 제목용. `LIBRA SUN`·`MERCURY RETROGRADE`처럼 자간을 넓게 벌린 대문자가
 * 이 사이트 라틴 표기의 전부라, 로마 비문 계열인 Cinzel이 그대로 맞는다.
 *
 * 고르는 과정에서 실제로 갈린 지점은 숫자였다. 후보 중 Marcellus 계열은 숫자가
 * 올드스타일이라 `2026. 10. 24`가 `2О26. IО. 24`처럼 들쭉날쭉해진다. 이 사이트는
 * 날짜와 도수를 도처에 쓰므로 라이닝 숫자가 아니면 쓸 수 없다(RENEWAL_PLAN §11.6).
 *
 * 라틴 서브셋만 받는다(25.9KB). 한글은 마루부리와 Pretendard가 맡으므로
 * latin-ext는 필요 없다.
 */
const cinzel = localFont({
  src: "../fonts/Cinzel.woff2",
  variable: "--font-cinzel",
  display: "swap",
  // 폴백이 마루부리 라틴이면 자간 벌린 자리에서 폭이 크게 달라 글이 튄다.
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  // 공유 카드의 og:image는 절대 주소여야 한다. 이 값이 없으면 Next가
  // http://localhost:3000을 넣어 배포본에 그대로 박힌다(실측).
  metadataBase: new URL("https://byeolsaem.com"),
  title: "별샘 | 당신이 태어난 밤, 하늘은 기억하고 있어요",
  description:
    "태어난 순간의 실제 하늘로 읽는 나의 이야기. 천궁도, 오늘의 하늘, 별자리 궁합.",
  // PWA — 홈 화면에 설치할 때 이름·아이콘·테마색을 읽어가는 곳(scripts/build-pwa-icons.mjs 참고).
  manifest: "/manifest.webmanifest",
  verification: {
    // 네이버 서치어드바이저 소유 확인. 한국어 사이트라 네이버 유입이 구글만큼
    // 중요한데 그동안 등록조차 되어 있지 않았다. 확인이 끝난 뒤에도 지우지
    // 않는다 — 네이버가 주기적으로 다시 확인하고, 사라지면 소유가 풀린다.
    other: { "naver-site-verification": "e9216a2372ff9e5f3f684e9f5d3c7e192783c1b5" },
  },
  alternates: {
    // 수집기와 RSS 리더가 주소를 몰라도 피드를 찾을 수 있게 한다(lib/rss.ts 참고).
    types: { "application/rss+xml": "/rss.xml" },
  },
  /**
   * 링크 미리보기. 자기 카드를 따로 두지 않은 모든 경로가 이 그림을 쓴다
   * (별자리 상세만 자기 성좌를 쓴다).
   *
   * 그림은 scripts/build-og.mjs가 미리 구워 public/og/에 둔 **파일**이다. Next의
   * opengraph-image 파일 규칙도 되지만 그 결과물은 확장자가 없는 주소로 나가고,
   * 우리 호스트는 확장자로 content-type을 정해서 타입 헤더 없이 서빙된다
   * — 카카오·X는 그걸 보고 이미지를 그릴지 정하므로 미리보기가 죽는다(실측).
   */
  openGraph: {
    type: "website",
    siteName: "별샘",
    locale: "ko_KR",
    url: "https://byeolsaem.com",
    images: [{ url: "/og/default.png", width: 1200, height: 630, alt: "별샘" }],
  },
  twitter: { card: "summary_large_image" },
};

// 설치된 상태에서 상태 표시줄·주소창 색을 사이트 잉크색으로 맞춘다(manifest.webmanifest의
// theme_color와 같은 값 — 브라우저 크롬과 PWA 셸이 어긋나지 않게).
export const viewport: Viewport = { themeColor: "#0b1026" };

/**
 * 최상위 레이아웃은 문서 뼈대와 폰트만 맡는다.
 *
 * 사이트는 두 세계로 나뉜다(스펙 §1). 밤은 도구 페이지, 새벽은 읽는 페이지다.
 * 배경·네비·스크롤 연출은 세계마다 다르므로 각 라우트 그룹의 레이아웃이 갖는다:
 *
 *   (night) — 먹빛 하늘 + WebGL 별하늘 + 얇은 베일 네비
 *   (dawn)  — 미색 종이 + 읽기 진행선. Three.js를 아예 싣지 않는다.
 *
 * 이전에는 여기서 SkyBackdrop을 전역으로 마운트했는데, 그러면 밝은 문서
 * 페이지에도 밤하늘이 깔리고 `/sign`·`/blog`에 Three.js 번들이 따라붙는다
 * (성능 가드레일 위반, RENEWAL_PLAN §7). 그래서 그룹별 레이아웃으로 내렸다.
 *
 * 배경색도 그룹이 정한다. body에 색을 박아두면 두 세계 중 한쪽에서 반드시
 * 어긋나므로, 기본값만 globals.css에 두고 새벽 그룹이 덮어쓴다.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${maruburi.variable} ${cinzel.variable}`}>
      <body className="min-h-[100dvh] antialiased">
        {/* 문서의 첫 초점 자리. 머리글보다 앞에 온다(SkipLink 주석 참고). */}
        <SkipLink />
        {/* 초대 fragment 스크럽 — GA(afterInteractive)가 로드되기 전에, 동기로 실행되는
            이 한 줄이 #i=…를 주소에서 걷어 메모리로 옮긴다. gtag의 dl= 파라미터는
            location.href 전체를 구글로 보내므로, 걷어내지 않으면 초대에 담긴 출생
            정보가 애널리틱스로 새어 나간다(최종 리뷰 M-1). */}
        <Script id="invite-hash-scrub" strategy="beforeInteractive">
          {`(function(){try{var h=location.hash;if(h&&h.indexOf("#i=")===0){window.__inviteHash=h;history.replaceState(null,"",location.pathname+location.search);}}catch(e){}})();`}
        </Script>
        {children}
        {/* 측정은 광고와 달리 메인까지 전부 덮는다(Analytics 주석 참고). */}
        <Analytics />
      </body>
    </html>
  );
}
