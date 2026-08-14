import type { MetadataRoute } from "next";

// 정적 export라 빌드 시점에 robots.txt로 구워진다.
export const dynamic = "force-static";

/**
 * 크롤러 규칙. 전부 연다 — 색인에서 빼는 페이지(/natal, /synastry, 본문 없는
 * 별자리)는 각자 meta robots(noindex)로 말한다. robots.txt에서 막으면 크롤러가
 * 그 meta를 읽으러 들어오지도 못해, 오히려 "차단됐지만 색인됨" 상태로 남을 수
 * 있다(구글 문서의 오래된 함정).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://byeolsaem.com/sitemap.xml",
  };
}
