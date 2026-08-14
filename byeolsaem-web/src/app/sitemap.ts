import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog";
import { SIGN_CONTENT } from "@/lib/sign-content";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

// 정적 export라 빌드 시점에 sitemap.xml로 구워진다.
export const dynamic = "force-static";

const BASE = "https://byeolsaem.com";

/**
 * 색인시킬 페이지만 싣는다. noindex인 /natal·/synastry, 본문이 아직 없는
 * 별자리 상세는 뺀다 — 사이트맵에 있는데 noindex인 주소는 Search Console에서
 * 경고로 쌓여 신뢰만 깎는다.
 *
 * lastModified는 아는 것만 적는다: 칼럼은 발행일이 있고, 나머지는 배포마다
 * 갱신되므로 굳이 거짓 날짜를 만들지 않는다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const tools: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, priority: 1 },
    { url: `${BASE}/today`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/retrograde`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/yearly`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/sign`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const signs: MetadataRoute.Sitemap = ZODIAC_SIGNS.filter((s) => SIGN_CONTENT[s.key]).map(
    (s) => ({
      url: `${BASE}/sign/${s.key}`,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  const posts: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${BASE}/blog/${encodeURIComponent(p.slug)}`,
    lastModified: p.published,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...tools, ...signs, ...posts];
}
