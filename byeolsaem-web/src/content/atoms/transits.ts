import type { AspectKey } from "@/lib/chart";
import type { PlanetKey } from "@/lib/planets";

/**
 * 트랜싯 한 줄을 풀어 읽는 아톰 — "하늘의 금성이 내 화성과 육분을 이룹니다"가
 * 무슨 말인지 모르는 사람을 위한 것(요청 2026-08-28).
 *
 * 시나스트리 아톰과 같은 조립식이다: 하늘 쪽 10 + 내 쪽 10 + 각 5 = 25개로
 * 500가지 조합을 덮는다. 문장은 "하늘의 X — [흘러오는 것]. 내 Y — [건드려지는
 * 부분]. [각이 정하는 만남의 방식]" 차례로 붙는다.
 */

/** 하늘 쪽 — 이 별이 지금 흘려보내고 있는 것. */
export const TRANSIT_SKY: Record<PlanetKey, string> = {
  sun: "지금 계절이 비추는 초점",
  moon: "그날그날의 기분과 물결",
  mercury: "오가는 말과 소식",
  venus: "끌림과 호감의 흐름",
  mars: "밀어붙이는 기세",
  jupiter: "넓혀 주는 기회의 바람",
  saturn: "무게를 재러 오는 시험",
  uranus: "예고 없는 전환",
  neptune: "경계가 풀리는 안개",
  pluto: "바닥부터 뒤집는 압력",
};

/** 내 쪽 — 태어난 하늘의 이 별이 맡고 있는 부분. */
export const TRANSIT_SELF: Record<PlanetKey, string> = {
  sun: "내가 향하는 방향",
  moon: "안심하고 불안해지는 마음",
  mercury: "생각하고 말하는 방식",
  venus: "좋아하고 아끼는 방식",
  mars: "원하는 것을 미는 힘",
  jupiter: "믿고 넓히려는 마음",
  saturn: "버티고 책임지는 축",
  uranus: "관성을 깨고 싶은 충동",
  neptune: "꿈꾸고 스며드는 감각",
  pluto: "깊이 쥐고 놓지 않는 것",
};

/** 각이 정하는 만남의 방식. 주어는 언제나 "두 힘"이다. */
export const TRANSIT_FRAME: Record<AspectKey, string> = {
  conjunction:
    "두 힘이 같은 자리에 겹칩니다. 그 주제가 이 날 유난히 진하게 켜집니다 — 순도가 높은 만큼, 좋게도 세게도 그대로 옵니다.",
  sextile:
    "두 힘이 가볍게 손을 내밉니다. 저절로 벌어지지는 않지만, 그쪽으로 한 걸음 움직이면 평소보다 수월하게 풀립니다.",
  trine:
    "두 힘이 힘들이지 않고 흘러듭니다. 애쓰지 않아도 그 부분이 순하게 굴러가는 날입니다.",
  square:
    "두 힘이 정면으로 부딪힙니다. 걸리적거림이 생기지만, 실제로 움직이게 만드는 것도 이 마찰입니다.",
  opposition:
    "두 힘이 반대편에서 마주 섭니다. 밖에서 오는 일이 그 부분을 정면으로 시험해 오는 날입니다.",
};
