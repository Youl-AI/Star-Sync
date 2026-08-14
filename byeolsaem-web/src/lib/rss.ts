import type { Post } from "@/content/blog";

/**
 * 칼럼 RSS.
 *
 * 네이버 서치어드바이저는 사이트맵도 받지만 새 글 수집은 RSS 쪽이 빠르고 확실하다
 * (2026-08-15 등록). 그래서 사이트맵과 별개로 하나 더 굽는다.
 *
 * 문자열을 손으로 만든다. 라이브러리를 하나 더 들이기에는 만들 것이 작고, XML은
 * 이스케이프만 정확하면 되는 형식이다. 대신 그 이스케이프를 빠뜨리면 제목에 &
 * 하나만 들어와도 피드 전체가 깨지므로, 값이 지나가는 길을 escape() 하나로
 * 좁혀 두고 테스트로 잡는다.
 */

const BASE = "https://byeolsaem.com";

/** XML에서 뜻을 갖는 다섯 글자. 값으로 들어가는 모든 문자열이 이 함수를 지난다. */
function escape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "2026-03-15" → "Sun, 15 Mar 2026 00:00:00 +0900"
 *
 * RSS의 pubDate는 RFC 822 형식이라 요일 이름과 영문 월 약자가 필요하다. 우리
 * 발행일은 날짜뿐이므로 한국 시간 자정으로 적는다 — Date의 toUTCString()을 쓰면
 * 같은 순간이라도 GMT로 환산되며 하루 전으로 보여서 목록의 날짜와 어긋난다.
 */
export function toRfc822(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const weekday = DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  const dd = String(day).padStart(2, "0");
  return `${weekday}, ${dd} ${MONTHS[month - 1]} ${year} 00:00:00 +0900`;
}

/**
 * 피드 전체를 만든다.
 *
 * lastBuildDate에 현재 시각을 쓰지 않는다. 빌드할 때마다 값이 달라지면 내용이
 * 그대로인데도 매 배포가 변경으로 잡히고, 수집기 입장에서도 새 글이 없는데
 * 갱신된 것처럼 보인다. 가장 최근 글의 발행일이 이 피드가 실제로 바뀐 때다.
 */
export function buildRss(posts: Post[]): string {
  const sorted = [...posts].sort((a, b) => (a.published < b.published ? 1 : -1));
  const latest = sorted[0]?.published;

  const items = sorted
    .map((post) => {
      const url = `${BASE}/blog/${encodeURIComponent(post.slug)}`;
      return `    <item>
      <title>${escape(post.title)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <pubDate>${toRfc822(post.published)}</pubDate>
      <category>${escape(post.category)}</category>
      <description>${escape(post.summary)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>별샘 칼럼</title>
    <link>${BASE}/blog</link>
    <description>태어난 순간의 하늘을 읽는 법. 상승궁과 하우스, 수성 역행, 달의 위상까지 계산에서 출발해 풀어 쓴 글.</description>
    <language>ko</language>
    <atom:link href="${BASE}/rss.xml" rel="self" type="application/rss+xml" />${
      latest ? `\n    <lastBuildDate>${toRfc822(latest)}</lastBuildDate>` : ""
    }
${items}
  </channel>
</rss>
`;
}
