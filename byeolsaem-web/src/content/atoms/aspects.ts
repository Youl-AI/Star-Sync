import type { AspectKey } from "@/lib/chart";
import type { PlanetKey } from "@/lib/planets";

/**
 * 어스펙트 아톰.
 *
 * 45쌍 × 5각도 = 225개를 하나씩 쓰는 대신 두 축으로 나눠 적는다. 어스펙트의
 * 각도가 '두 힘이 어떤 사이인가'를 정하고, 행성 쌍이 '어떤 두 힘인가'를
 * 정하기 때문이다. 225개를 따로 쓰면 서로 거의 같은 문장이 225개 생기고,
 * 한 곳을 고칠 때 나머지 224곳이 어긋난다.
 *
 * 조립은 결정론이다. 같은 배치면 언제 다시 봐도 같은 문장이 나온다.
 */

/** 각도가 정하는 것 — 두 힘의 사이. */
export const ASPECT_MEANINGS: Record<AspectKey, { headline: string; body: string; nuance: string }> = {
  conjunction: {
    headline: "한자리에 겹쳐 있습니다",
    body:
      "두 힘이 같은 지점에 놓여 따로 떼어 보기 어렵습니다. 하나가 움직이면 다른 하나도 반드시 함께 움직입니다. 강하게 작용하는 대신, 본인은 그것이 두 가지라는 것을 잘 알아차리지 못합니다.",
    nuance: "두 힘이 한 몸처럼 붙어 있어, 본인은 이것이 두 가지라는 것을 잘 알아차리지 못합니다.",
  },
  sextile: {
    headline: "서로 도울 수 있습니다",
    body:
      "부딪히지 않고 손을 빌려줄 수 있는 사이입니다. 다만 저절로 작동하지는 않습니다. 의식해서 한쪽을 쓸 때 다른 쪽이 따라오는 구조라, 알아차리지 못하면 그냥 지나갑니다.",
    nuance: "저절로 작동하지는 않습니다. 의식해서 쓸 때만 열리는 통로입니다.",
  },
  square: {
    headline: "서로 밀어냅니다",
    body:
      "한쪽을 세우면 다른 쪽이 눌립니다. 이 마찰은 불편하지만 실제로 사람을 움직이게 하는 힘이기도 합니다. 편한 배치가 아무것도 시키지 않는 반면, 이 배치는 계속 결단을 요구합니다.",
    nuance: "이 마찰은 혼자 있을 때도 안에서 계속 돌아갑니다.",
  },
  trine: {
    headline: "힘들이지 않고 흐릅니다",
    body:
      "둘이 같은 방향을 보고 있어 애쓰지 않아도 이어집니다. 재능이 되는 자리입니다. 다만 너무 쉬워서 당연하게 여기고 끝까지 쓰지 않는 경우가 많습니다.",
    nuance: "너무 자연스러워서 본인만 이것이 재능인 줄 모르기 쉽습니다.",
  },
  opposition: {
    headline: "정면으로 마주 봅니다",
    body:
      "두 힘이 하늘의 반대편에서 서로를 바라봅니다. 한쪽을 고르면 다른 쪽이 반드시 불만을 냅니다. 어느 하나를 버리는 것이 아니라 둘 사이를 오가는 법을 익히는 것이 이 배치의 과제입니다.",
    nuance: "이 마찰은 주로 사람이나 상황을 통해 밖에서 옵니다.",
  },
};

/**
 * 행성 쌍이 정하는 것 — 어떤 두 힘인가.
 *
 * 키는 `PLANETS`의 순서대로 붙인 두 이름이다. 순서를 고정해 두지 않으면 같은
 * 쌍이 두 키로 갈라진다.
 */
export const PLANET_PAIR_THEMES: Record<string, string> = {
  "sun-moon": "밖으로 향하는 의지와 안에서 움직이는 감정",
  "sun-mercury": "자기 자신과 그것을 설명하는 말",
  "sun-venus": "자기 자신과 좋아하는 것",
  "sun-mars": "무엇을 향하는가와 그것을 어떻게 밀어붙이는가",
  "sun-jupiter": "자기 자신과 넓히려는 힘",
  "sun-saturn": "자기 자신과 스스로에게 거는 제약",
  "sun-uranus": "자기 자신과 틀을 깨려는 충동",
  "sun-neptune": "자기 자신과 경계를 흐리는 힘",
  "sun-pluto": "자기 자신과 무너뜨렸다 다시 세우는 힘",
  "moon-mercury": "느끼는 것과 말로 옮기는 것",
  "moon-venus": "안심하는 방식과 사랑하는 방식",
  "moon-mars": "감정과 그것이 곧바로 행동이 되는 통로",
  "moon-jupiter": "감정과 그것을 부풀리는 힘",
  "moon-saturn": "감정과 그것을 눌러 두는 힘",
  "moon-uranus": "감정과 예고 없이 오는 흔들림",
  "moon-neptune": "감정과 남의 것까지 흘러드는 통로",
  "moon-pluto": "감정과 그 밑바닥의 강도",
  "mercury-venus": "생각하는 방식과 좋아하는 방식",
  "mercury-mars": "말과 그것이 무기가 되는 순간",
  "mercury-jupiter": "구체적인 정보와 큰 그림",
  "mercury-saturn": "생각과 그것을 검증하는 엄격함",
  "mercury-uranus": "생각과 갑자기 튀어나오는 착상",
  "mercury-neptune": "논리와 이미지",
  "mercury-pluto": "말과 그 아래 숨은 의도",
  "venus-mars": "끌리는 마음과 다가가는 힘",
  "venus-jupiter": "좋아하는 것과 그것을 키우려는 마음",
  "venus-saturn": "애정과 그 앞에 세워진 벽",
  "venus-uranus": "애정과 그것을 흔드는 자유",
  "venus-neptune": "사랑과 상상 속의 대상",
  "venus-pluto": "애정과 그것을 삼키는 강도",
  "mars-jupiter": "밀어붙이는 힘과 그것을 키우는 확신",
  "mars-saturn": "밀어붙이는 힘과 그것을 붙잡는 제동",
  "mars-uranus": "행동과 갑작스러움",
  "mars-neptune": "행동과 방향을 흐리는 안개",
  "mars-pluto": "힘과 그 밑의 집요함",
  "jupiter-saturn": "넓히려는 힘과 지키려는 힘",
  "jupiter-uranus": "확장과 파격",
  "jupiter-neptune": "믿음과 환상",
  "jupiter-pluto": "확장과 근본적인 변형",
  "saturn-uranus": "지키려는 구조와 그것을 깨려는 충동",
  "saturn-neptune": "현실의 벽과 그것을 녹이는 힘",
  "saturn-pluto": "굳어진 구조와 그것을 무너뜨리는 압력",
  "uranus-neptune": "파격과 몽상",
  "uranus-pluto": "급격한 변화와 근본적인 변형",
  "neptune-pluto": "한 세대가 공유하는 이상과 그 이면",
};

const PLANET_ORDER: PlanetKey[] = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
];

/** 두 별을 언제나 같은 순서로 세워 키를 만든다. */
export function pairKey(a: PlanetKey, b: PlanetKey): string {
  const [first, second] =
    PLANET_ORDER.indexOf(a) <= PLANET_ORDER.indexOf(b) ? [a, b] : [b, a];
  return `${first}-${second}`;
}

export function pairTheme(a: PlanetKey, b: PlanetKey): string | undefined {
  return PLANET_PAIR_THEMES[pairKey(a, b)];
}

/**
 * 본문 기준으로는 각도가 세 모드로 접힌다 — 겹침 / 순풍(육분·삼각) /
 * 마찰(사각·대립). 5방의 구분은 nuance 한 줄이 유지한다(스펙 §2).
 */
export type AspectMode = "conjunction" | "flowing" | "friction";

export function modeOf(key: AspectKey): AspectMode {
  if (key === "conjunction") return "conjunction";
  if (key === "sextile" || key === "trine") return "flowing";
  return "friction";
}
