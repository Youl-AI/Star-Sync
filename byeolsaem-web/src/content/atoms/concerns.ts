import type { PlanetKey } from "@/lib/planets";

/**
 * 관심사 렌즈.
 *
 * 천궁도 전체를 한 번에 늘어놓으면 읽는 사람은 아무것도 가져가지 못한다.
 * 히어로에서 고른 관심사에 해당하는 하우스와 별만 남겨 위에서부터 보여 준다
 * (RENEWAL_PLAN §2.3의 2번 단계).
 *
 * 어떤 하우스와 별을 볼지는 전통적인 대응을 그대로 따른다. 예를 들어 재물은
 * 2하우스(내가 버는 것)와 8하우스(함께 묶인 것), 그리고 금성과 목성이다.
 */
export interface ConcernLens {
  key: string;
  /** 히어로에서 고르는 이름과 정확히 같아야 한다. */
  label: string;
  /** 한 줄 설명 */
  summary: string;
  houses: number[];
  planets: PlanetKey[];
}

export const CONCERN_LENSES: ConcernLens[] = [
  {
    key: "wealth",
    label: "재물운",
    summary: "버는 방식과 쥐는 방식, 그리고 남과 얽힌 돈까지 함께 봅니다.",
    houses: [2, 8],
    planets: ["venus", "jupiter", "saturn"],
  },
  {
    key: "love",
    label: "연애운",
    summary: "무엇에 끌리고 어떻게 다가가며, 마주 앉은 상대를 어떻게 대하는지 봅니다.",
    houses: [5, 7],
    planets: ["venus", "mars", "moon"],
  },
  {
    key: "work",
    label: "직업운",
    summary: "세상에 어떤 모습으로 서는지, 매일의 일에서 무엇이 걸리는지 봅니다.",
    houses: [6, 10],
    planets: ["sun", "saturn", "mars"],
  },
  {
    key: "study",
    label: "학업운",
    summary: "어떻게 배우고 어떤 틀로 세상을 이해하는지 봅니다.",
    houses: [3, 9],
    planets: ["mercury", "jupiter"],
  },
  {
    key: "health",
    label: "건강운",
    summary: "몸을 쓰는 습관과 회복하는 방식을 봅니다.",
    houses: [1, 6],
    planets: ["mars", "saturn", "moon"],
  },
  {
    key: "people",
    label: "대인운",
    summary: "가까운 사람과 느슨한 무리, 두 종류의 관계를 나눠 봅니다.",
    houses: [7, 11],
    planets: ["venus", "mercury", "jupiter"],
  },
  {
    key: "move",
    label: "이동운",
    summary: "가까운 이동과 먼 곳, 그리고 뿌리를 옮기는 일을 봅니다.",
    houses: [3, 4, 9],
    planets: ["mercury", "jupiter", "uranus"],
  },
];

export function lensFor(label: string): ConcernLens | undefined {
  return CONCERN_LENSES.find((lens) => lens.label === label);
}
