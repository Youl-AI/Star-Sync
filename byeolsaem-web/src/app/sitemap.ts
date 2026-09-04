import type { MetadataRoute } from "next";
import { POSTS } from "@/content/blog";
import { SIGN_CONTENT } from "@/lib/sign-content";
import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { BUILD_MONTHS } from "@/lib/calendar-events";
import { isIndexableMonth } from "@/content/month-notes";

// 정적 export라 빌드 시점에 sitemap.xml로 구워진다.
export const dynamic = "force-static";

const BASE = "https://byeolsaem.com";

/**
 * 색인시킬 페이지만 싣는다. 본문이 아직 없는 별자리 상세는 뺀다 — 사이트맵에
 * 있는데 noindex인 주소는 Search Console에서 경고로 쌓여 신뢰만 깎는다.
 * (/natal·/synastry도 한동안 그래서 빠져 있었다. primer가 붙어 색인 대상이
 * 되면서 다시 들어왔다 — 각 페이지의 metadata 주석 참고.)
 *
 * lastModified는 아는 것만 적는다: 칼럼은 발행일이 있고, 나머지는 배포마다
 * 갱신되므로 굳이 거짓 날짜를 만들지 않는다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const tools: MetadataRoute.Sitemap = [
    // 끝의 슬래시를 붙이지 않는다. Next가 메인의 canonical을 BASE 그대로
    // 내보내므로, 여기에만 슬래시를 붙이면 사이트맵과 canonical의 표기가 갈린다
    // (같은 주소로 취급되긴 하지만 굳이 다르게 적을 이유가 없다).
    { url: BASE, priority: 1 },
    { url: `${BASE}/today`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/retrograde`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/retrograde/venus`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/retrograde/mars`, changeFrequency: "weekly", priority: 0.7 },
    // 계산은 브라우저가 하지만 안내 본문은 배포마다 그대로다.
    { url: `${BASE}/natal`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/synastry`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/yearly`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/sign`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/weekly`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/calendar`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/solar-return`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/chapters`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/ephemeris`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/method`, changeFrequency: "yearly", priority: 0.4 },
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

  // 손으로 쓴 글이 있는 달만 싣는다. 나머지는 화면에 그대로 있지만 색인 대상이
  // 아니다(content/month-notes.ts 주석 참고) — 사이트맵과 robots가 어긋나면
  // 수집기에 서로 다른 말을 하게 된다.
  const indexable = BUILD_MONTHS.filter((m) => isIndexableMonth(m.year, m.month));

  const months: MetadataRoute.Sitemap = indexable.map((m) => ({
    url: `${BASE}/calendar/${m.year}/${String(m.month).padStart(2, "0")}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const ephemerisMonths: MetadataRoute.Sitemap = indexable.map((m) => ({
    url: `${BASE}/ephemeris/${m.year}/${String(m.month).padStart(2, "0")}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...tools, ...signs, ...posts, ...months, ...ephemerisMonths];
}
