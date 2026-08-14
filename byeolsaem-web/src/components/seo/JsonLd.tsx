/**
 * 구조화 데이터(JSON-LD).
 *
 * 검색엔진에게 이 페이지가 무엇인지 기계가 읽는 형태로 한 번 더 말한다. 사람이
 * 보는 화면에는 아무 영향도 주지 않고, 대신 검색 결과의 생김새가 달라진다 —
 * 문답이 펼쳐지거나, 글에 발행일과 읽는 시간이 붙는 식이다.
 *
 * `<script type="application/ld+json">`은 브라우저가 실행하지 않으므로
 * next/script를 거치지 않는다. 그냥 문서에 박히면 된다.
 *
 * 여기 적는 값은 반드시 화면에 실제로 있는 것이어야 한다. 화면에 없는 문답을
 * 스키마에만 넣는 것은 구글 정책 위반이고, 적발되면 리치 결과가 통째로 막힌다.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify 결과에 </script>가 섞일 여지를 막는다. 우리 글에는 없지만,
      // 본문에서 값을 끌어오는 구조라 앞으로 들어올 수 있다.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export const SITE_URL = "https://byeolsaem.com";

/** 사이트의 이름과 주인. 홈에 한 번 둔다. */
export function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "별샘",
    alternateName: "Byeolsaem",
    url: SITE_URL,
    inLanguage: "ko",
    description:
      "태어난 순간의 실제 행성 배치를 계산해 읽어 주는 점성술 서비스. 무작위 카드가 아니라 천문 계산에서 출발합니다.",
    publisher: {
      "@type": "Organization",
      name: "별샘",
      url: SITE_URL,
    },
  };
}

/** 페이지 위치. 검색 결과의 주소 줄이 계층으로 바뀐다. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: `${SITE_URL}${step.path}`,
    })),
  };
}

/** 문답. 화면에 그대로 있는 것만 넣는다. */
export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
