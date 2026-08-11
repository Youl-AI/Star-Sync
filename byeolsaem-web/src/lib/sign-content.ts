import { SIGN_BODIES } from "@/content/signs";
import { ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

/**
 * 별자리 페이지의 본문 구조.
 *
 * 이 타입이 아톰 DB(RENEWAL_PLAN §2)가 채워야 할 목표 모양이다. 본문을 먼저
 * 쓰고 구조를 나중에 맞추면 열두 페이지가 제각각이 되므로, 틀을 먼저 못 박고
 * 내용을 부어 넣는다.
 *
 * 분량 기준: 검색으로 들어오는 1층 페이지라 본문이 얇으면 색인 가치가 없다.
 * 한 별자리당 2,000자 이상을 목표로 한다(스펙 §6.4).
 */
export interface SignContent {
  /** 한 문단짜리 도입. 이 별자리를 한마디로 세운다. */
  opening: string;
  /** 성질 — 이 별자리가 세상을 대하는 기본 자세. */
  nature: string[];
  /** 강점. 제목과 설명 한 쌍. */
  strengths: { title: string; body: string }[];
  /** 그늘. 약점이 아니라 강점이 과할 때 생기는 그림자로 쓴다. */
  shadows: { title: string; body: string }[];
  /** 관계에서 어떻게 나타나는가. */
  inRelationships: string[];
  /** 일과 돈에서 어떻게 나타나는가. */
  inWork: string[];
  /** 자주 오해받는 지점 — 이 별자리 이야기에서 가장 많이 검색되는 대목. */
  misread: { question: string; answer: string }[];
}

/**
 * 열두 자리의 본문. 실제 글은 `src/content/signs/`에 자리마다 한 파일씩 있다.
 *
 * Partial로 두는 이유는 남았다. 지금은 열둘이 다 차 있지만, 새 절이 추가되거나
 * 자리 하나를 다시 쓰는 동안 비는 상태가 생길 수 있고, 그때 상세 페이지는 빈
 * 껍데기 대신 "쓰는 중"을 내보내며 색인에서 빠져야 한다(RENEWAL_PLAN §2.4).
 */
export const SIGN_CONTENT: Partial<Record<string, SignContent>> = SIGN_BODIES;

export function getSignBySlug(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((s) => s.key === slug);
}

export function getSignContent(slug: string): SignContent | undefined {
  return SIGN_CONTENT[slug];
}
