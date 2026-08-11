/**
 * 천궁도에 올라가는 열 개의 별.
 *
 * 태양과 달은 천문학적으로 행성이 아니지만 점성술에서는 같은 자리에 놓고
 * 읽는다. 그래서 이름을 '행성'이 아니라 '별'로 쓴다 — 화면에 나가는 글도
 * 같은 말을 쓴다.
 *
 * `speed`는 한 별자리를 지나는 데 걸리는 대략의 시간이다. 이 값이 그 별이
 * 개인에 대해 말해 주는 양을 정한다 — 명왕성처럼 20년씩 머무는 별은 같은
 * 세대 전체가 같은 값을 갖기 때문에 개인의 이야기가 되지 못한다.
 */

export type PlanetKey =
  | "sun"
  | "moon"
  | "mercury"
  | "venus"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "pluto";

export interface Planet {
  key: PlanetKey;
  ko: string;
  /** 점성술 기호. 컬러 이모지로 바뀌지 않게 .astro-symbol과 함께 쓴다. */
  symbol: string;
  /** 이 별이 맡는 영역, 한 마디로. */
  governs: string;
  /** 한 별자리에 머무는 기간 */
  dwell: string;
  /**
   * 개인차트에서 개인을 말해 주는 별인가. false면 같은 시기에 태어난 사람이
   * 모두 같은 값을 가지므로, 별자리보다 하우스와 어스펙트로 읽어야 한다.
   */
  personal: boolean;
}

export const PLANETS: Planet[] = [
  {
    key: "sun",
    ko: "태양",
    symbol: "☉",
    governs: "무엇을 향해 가는 사람인가",
    dwell: "약 한 달",
    personal: true,
  },
  {
    key: "moon",
    ko: "달",
    symbol: "☽",
    governs: "무엇에 안심하고 무엇에 흔들리는가",
    dwell: "약 2일 반",
    personal: true,
  },
  {
    key: "mercury",
    ko: "수성",
    symbol: "☿",
    governs: "생각하고 말하고 배우는 방식",
    dwell: "약 3주",
    personal: true,
  },
  {
    key: "venus",
    ko: "금성",
    symbol: "♀",
    governs: "무엇을 좋아하고 어떻게 사랑하는가",
    dwell: "약 한 달",
    personal: true,
  },
  {
    key: "mars",
    ko: "화성",
    symbol: "♂",
    governs: "원하는 것을 어떻게 밀어붙이는가",
    dwell: "약 두 달",
    personal: true,
  },
  {
    key: "jupiter",
    ko: "목성",
    symbol: "♃",
    governs: "어디서 넓어지고 무엇을 믿는가",
    dwell: "약 1년",
    personal: true,
  },
  {
    key: "saturn",
    ko: "토성",
    symbol: "♄",
    governs: "어디서 막히고 무엇을 쌓는가",
    dwell: "약 2년 반",
    personal: true,
  },
  {
    key: "uranus",
    ko: "천왕성",
    symbol: "♅",
    governs: "어디서 틀을 깨는가",
    dwell: "약 7년",
    personal: false,
  },
  {
    key: "neptune",
    ko: "해왕성",
    symbol: "♆",
    governs: "어디서 경계가 흐려지는가",
    dwell: "약 14년",
    personal: false,
  },
  {
    key: "pluto",
    ko: "명왕성",
    symbol: "♇",
    governs: "어디서 무너지고 다시 세워지는가",
    dwell: "약 20년",
    personal: false,
  },
];

export const PLANET_BY_KEY: Record<PlanetKey, Planet> = Object.fromEntries(
  PLANETS.map((p) => [p.key, p]),
) as Record<PlanetKey, Planet>;
