/**
 * 내비게이션의 단일 소스 — 헤더 직통·오버레이 그룹이 전부 여기서 나온다.
 * 페이지가 늘면 이 파일만 늘린다(2026-08-23 IA 개편).
 */
export interface NavLink {
  href: string;
  label: string;
  desc: string;
}
export interface NavGroup {
  label: string;
  links: NavLink[];
}

export const DIRECT_LINKS = [
  { href: "/today", label: "오늘" },
  { href: "/natal", label: "천궁도" },
  { href: "/synastry", label: "궁합" },
] as const;

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "하늘의 시간",
    links: [
      { href: "/today", label: "오늘의 하늘", desc: "지금 이 순간 열 개의 별이 있는 자리" },
      { href: "/weekly", label: "이번 주", desc: "이레 동안 하늘에 일어나는 일" },
      { href: "/calendar", label: "하늘의 달력", desc: "신월과 보름, 역행의 시작과 끝" },
      { href: "/retrograde", label: "역행", desc: "수성 · 금성 · 화성이 물러서는 날들" },
    ],
  },
  {
    label: "나의 별",
    links: [
      { href: "/natal", label: "내 천궁도", desc: "태어난 순간의 하늘 전부" },
      { href: "/yearly", label: "한 해의 하늘", desc: "올해 내 별들을 지나는 흐름" },
      { href: "/solar-return", label: "솔라 리턴", desc: "생일마다 새로 그려지는 일 년의 지도" },
      { href: "/synastry", label: "궁합", desc: "두 하늘이 겹칠 때 생기는 각도" },
    ],
  },
  {
    label: "읽을거리",
    links: [
      { href: "/sign", label: "열두 별자리", desc: "각 자리의 성격과 곁에 서는 자리들" },
      { href: "/blog", label: "칼럼", desc: "별을 읽는 법에 대한 글" },
    ],
  },
];

/** 금색 새 표시(●). 출시 4주 뒤(2026-09-20께) 이 배열을 비운다. */
export const NAV_NEW: string[] = ["/weekly", "/calendar", "/solar-return"];
