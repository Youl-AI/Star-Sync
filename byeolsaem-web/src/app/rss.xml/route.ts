import { POSTS } from "@/content/blog";
import { buildRss } from "@/lib/rss";

// 정적 export라 빌드 시점에 rss.xml로 구워진다. robots.ts·sitemap.ts와 같은 방식이다.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildRss(POSTS), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
