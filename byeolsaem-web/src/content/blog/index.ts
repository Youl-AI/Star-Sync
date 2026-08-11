import type { ComponentType } from "react";

/**
 * 칼럼 목록.
 *
 * 본문은 옆에 놓인 `.mdx` 파일이고, 여기에는 본문이 스스로 알 수 없는 것만
 * 적는다 — 주소, 목록에 나갈 요약, 발행일, 순서.
 *
 * 새 글을 내는 절차는 두 단계다: `.mdx` 파일을 하나 만들고, 이 배열 맨 앞에
 * 한 줄을 더한다. 프런트매터를 손으로 파싱하는 방식도 검토했지만, 발행일이나
 * 슬러그가 틀려도 빌드가 통과해 버린다. 여기 적으면 타입이 잡아 준다.
 *
 * 파일 이름은 영문, 주소는 한글이다. 주소는 검색어와 같아야 하고, 파일 이름은
 * 어느 운영체제·번들러에서도 탈 없이 import되어야 하기 때문이다.
 */
export interface Post {
  /** 주소. `/blog/<slug>`가 된다. */
  slug: string;
  title: string;
  /** 목록과 검색 결과에 나가는 한 문장. */
  summary: string;
  /** 제목 위에 붙는 분류. */
  category: string;
  /** 발행일. YYYY-MM-DD. */
  published: string;
  /** 읽는 데 걸리는 대략의 시간(분). */
  readingMinutes: number;
  /** 본문. 정적 import라 번들러가 빌드 시점에 모두 찾아낸다. */
  load: () => Promise<{ default: ComponentType }>;
}

export const POSTS: Post[] = [
  {
    slug: "달의-위상-목표-달성법",
    title: "달의 위상으로 2주마다 목표를 세우는 법",
    summary:
      "달은 29.5일을 주기로 차오르고 이지러집니다. 신월에 세우고 만월에 정리하는 리듬, 그리고 태어난 순간의 달이 말해 주는 것.",
    category: "실전 점성학",
    published: "2026-03-15",
    readingMinutes: 4,
    load: () => import("./moon-phase.mdx"),
  },
  {
    slug: "수성역행-생존-가이드",
    title: "수성 역행 생존 가이드: 피해야 할 것과 활용법",
    summary:
      "수성 역행은 착시입니다. 그런데 왜 이 시기마다 일이 꼬일까요. 조심할 것, 오히려 잘 되는 것, 그리고 그림자 기간까지.",
    category: "생존 가이드",
    published: "2026-03-14",
    readingMinutes: 5,
    load: () => import("./mercury-retrograde.mdx"),
  },
  {
    slug: "상승궁-뜻",
    title: "남들이 보는 나 vs 진짜 나: 상승궁의 비밀",
    summary:
      "태어난 시간이 4분만 달라져도 바뀌는 자리. 첫인상을 만들고, 열두 하우스 전체의 기준점이 되는 상승궁 이야기.",
    category: "나를 아는 법",
    published: "2026-03-13",
    readingMinutes: 4,
    load: () => import("./ascendant.mdx"),
  },
  {
    slug: "명왕성-물병자리-2026",
    title: "바람의 시대: 명왕성 물병자리 이동이 뜻하는 2026년",
    summary:
      "248년에 한 바퀴 도는 별이 자리를 옮깁니다. 세대 전체가 공유하는 배치가 개인의 삶에서는 어떻게 갈라지는지.",
    category: "2026 흐름",
    published: "2026-03-12",
    readingMinutes: 5,
    load: () => import("./pluto-aquarius.mdx"),
  },
  {
    slug: "12하우스-뜻",
    title: "태양궁만으로는 부족한 이유: 12하우스가 말하는 것",
    summary:
      "별자리가 배우의 성격이라면 하우스는 그 배우가 서는 무대입니다. 같은 사자자리가 서로 다르게 사는 이유.",
    category: "점성학 기초",
    published: "2026-03-11",
    readingMinutes: 4,
    load: () => import("./houses.mdx"),
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((post) => post.slug === slug);
}

/** "2026. 3. 14" */
export function formatPublished(published: string): string {
  const [year, month, day] = published.split("-");
  return `${year}. ${Number(month)}. ${Number(day)}`;
}
