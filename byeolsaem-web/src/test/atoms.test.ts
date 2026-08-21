import { describe, expect, it } from "vitest";
import { ASPECT_MEANINGS, PLANET_PAIR_THEMES, pairKey, pairTheme, modeOf } from "@/content/atoms/aspects";
import { ASCENDANT_ATOMS, MIDHEAVEN_ATOMS } from "@/content/atoms/ascendant";
import { CONCERN_LENSES, lensFor } from "@/content/atoms/concerns";
import { HOUSES } from "@/content/atoms/houses";
import { PLANET_IN_HOUSE } from "@/content/atoms/planet-in-house";
import { PLANET_IN_SIGN } from "@/content/atoms/planet-in-sign";
import { ASPECT_TYPES, computeChart, type BirthMoment } from "@/lib/chart";
import { PLANETS, TIER_RANK } from "@/lib/planets";
import { assembleReading, describeElements } from "@/lib/reading";
import { ZODIAC_SIGNS } from "@/lib/zodiac";

const SIGN_KEYS = ZODIAC_SIGNS.map((s) => s.key);

describe("아톰 DB — 빈칸이 없어야 한다", () => {
  /**
   * 조립기는 아톰이 없으면 undefined를 그대로 화면에 내보낸다. 한 칸이라도
   * 비면 어떤 사람의 결과에는 빈 자리가 뜬다는 뜻이므로, 여기서 전수로 센다.
   */
  it("행성 × 별자리가 120칸 모두 차 있다", () => {
    let filled = 0;
    for (const planet of PLANETS) {
      for (const key of SIGN_KEYS) {
        const atom = PLANET_IN_SIGN[planet.key]?.[key];
        expect(atom, `${planet.ko} × ${key}`).toBeTruthy();
        expect(atom.length, `${planet.ko} × ${key}`).toBeGreaterThan(15);
        filled += 1;
      }
    }
    expect(filled).toBe(120);
  });

  it("행성 × 하우스가 120칸 모두 차 있다", () => {
    let filled = 0;
    for (const planet of PLANETS) {
      for (let house = 1; house <= 12; house += 1) {
        const atom = PLANET_IN_HOUSE[planet.key]?.[house];
        expect(atom, `${planet.ko} × ${house}하우스`).toBeTruthy();
        expect(atom.length, `${planet.ko} × ${house}하우스`).toBeGreaterThan(15);
        filled += 1;
      }
    }
    expect(filled).toBe(120);
  });

  it("상승궁과 중천 아톰이 열두 자리를 채운다", () => {
    for (const key of SIGN_KEYS) {
      expect(ASCENDANT_ATOMS[key], key).toBeTruthy();
      expect(MIDHEAVEN_ATOMS[key], key).toBeTruthy();
    }
    expect(Object.keys(ASCENDANT_ATOMS)).toHaveLength(12);
    expect(Object.keys(MIDHEAVEN_ATOMS)).toHaveLength(12);
  });

  it("하우스가 1번부터 12번까지 순서대로 있다", () => {
    expect(HOUSES.map((h) => h.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const house of HOUSES) {
      expect(house.domain.length, `${house.number}하우스`).toBeGreaterThan(5);
      expect(house.body.length, `${house.number}하우스`).toBeGreaterThan(40);
    }
  });

  it("어스펙트 다섯 종류가 모두 뜻을 갖는다", () => {
    for (const type of ASPECT_TYPES) {
      expect(ASPECT_MEANINGS[type.key], type.ko).toBeTruthy();
      expect(ASPECT_MEANINGS[type.key].body.length).toBeGreaterThan(40);
    }
  });

  it("각도마다 nuance 꼬리 한 줄이 있다", () => {
    for (const type of ASPECT_TYPES) {
      const { nuance } = ASPECT_MEANINGS[type.key];
      expect(nuance, type.ko).toBeTruthy();
      expect(nuance.length, type.ko).toBeGreaterThan(15);
      expect(nuance.endsWith("."), type.ko).toBe(true);
    }
  });

  it("modeOf가 다섯 각도를 세 모드로 접는다", () => {
    expect(modeOf("conjunction")).toBe("conjunction");
    expect(modeOf("sextile")).toBe("flowing");
    expect(modeOf("trine")).toBe("flowing");
    expect(modeOf("square")).toBe("friction");
    expect(modeOf("opposition")).toBe("friction");
  });

  /**
   * 열 개의 별에서 나오는 쌍은 45개다. 하나라도 빠지면 그 조합을 가진 사람의
   * 어스펙트 한 줄이 통째로 사라진다.
   */
  it("행성 쌍 45개가 모두 있다", () => {
    const expected = new Set<string>();
    for (let i = 0; i < PLANETS.length; i += 1) {
      for (let j = i + 1; j < PLANETS.length; j += 1) {
        expected.add(pairKey(PLANETS[i].key, PLANETS[j].key));
      }
    }
    expect(expected.size).toBe(45);
    for (const key of expected) {
      expect(PLANET_PAIR_THEMES[key], key).toBeTruthy();
    }
    expect(Object.keys(PLANET_PAIR_THEMES)).toHaveLength(45);
  });

  it("행성 쌍의 키는 순서를 바꿔도 같다", () => {
    expect(pairKey("moon", "sun")).toBe("sun-moon");
    expect(pairTheme("pluto", "venus")).toBe(pairTheme("venus", "pluto"));
  });

  /** 히어로의 관심사 목록과 렌즈가 어긋나면 고른 값이 조용히 무시된다. */
  it("히어로가 내놓는 관심사 일곱 개에 모두 렌즈가 있다", () => {
    const fromHero = ["재물운", "연애운", "직업운", "학업운", "건강운", "대인운", "이동운"];
    for (const label of fromHero) {
      expect(lensFor(label), label).toBeDefined();
    }
    expect(CONCERN_LENSES).toHaveLength(fromHero.length);
    for (const lens of CONCERN_LENSES) {
      expect(lens.houses.length, lens.label).toBeGreaterThan(0);
      expect(lens.planets.length, lens.label).toBeGreaterThan(0);
      for (const house of lens.houses) {
        expect(house).toBeGreaterThanOrEqual(1);
        expect(house).toBeLessThanOrEqual(12);
      }
    }
  });
});

describe("조립", () => {
  const moment: BirthMoment = {
    date: "1999-03-21",
    time: "09:30",
    latitude: 37.5665,
    longitude: 126.978,
    timezoneOffsetHours: 9,
  };

  it("모든 자리에 별자리 문장과 하우스 문장이 붙는다", () => {
    const reading = assembleReading(computeChart(moment), "재물운");
    expect(reading.placements).toHaveLength(10);
    for (const item of reading.placements) {
      expect(item.inSign, item.planet.ko).toBeTruthy();
      expect(item.inHouse, item.planet.ko).toBeTruthy();
      expect(item.house, item.planet.ko).not.toBeNull();
    }
    expect(reading.core.ascendant).not.toBeNull();
    expect(reading.core.midheaven).not.toBeNull();
  });

  it("관심사에 걸린 자리가 앞에 온다", () => {
    const reading = assembleReading(computeChart(moment), "연애운");
    expect(reading.lens?.key).toBe("love");
    const firstUnhighlighted = reading.placements.findIndex((p) => !p.highlighted);
    const lastHighlighted = reading.placements.map((p) => p.highlighted).lastIndexOf(true);
    expect(lastHighlighted).toBeLessThan(firstUnhighlighted);
  });

  it("행성 목록은 개인 → 사회 → 세대 순으로 선다", () => {
    // 렌즈 없이 조립하면 highlighted가 전부 false라 tier만이 순서를 정한다.
    const reading = assembleReading(computeChart(moment), null);
    const ranks = reading.placements.map((p) => TIER_RANK[p.planet.tier]);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i], `${reading.placements[i].planet.ko}의 자리`).toBeGreaterThanOrEqual(
        ranks[i - 1],
      );
    }
  });

  it("tier 배정이 스펙 §3과 같다", () => {
    const byTier = (tier: string) =>
      PLANETS.filter((p) => p.tier === tier).map((p) => p.key);
    expect(byTier("personal")).toEqual(["sun", "moon", "mercury", "venus", "mars"]);
    expect(byTier("social")).toEqual(["jupiter", "saturn"]);
    expect(byTier("generational")).toEqual(["uranus", "neptune", "pluto"]);
  });

  it("시각을 모르면 하우스 문장을 붙이지 않는다", () => {
    const reading = assembleReading(computeChart({ ...moment, time: null }), "직업운");
    expect(reading.timeUnknown).toBe(true);
    expect(reading.core.ascendant).toBeNull();
    for (const item of reading.placements) {
      expect(item.inHouse, item.planet.ko).toBeNull();
      expect(item.house, item.planet.ko).toBeNull();
    }
  });

  it("어스펙트마다 두 별의 주제와 각도의 뜻이 함께 붙는다", () => {
    const reading = assembleReading(computeChart(moment));
    expect(reading.aspects.length).toBeGreaterThan(0);
    expect(reading.aspects.length).toBeLessThanOrEqual(6);
    for (const item of reading.aspects) {
      expect(item.theme).toBeTruthy();
      expect(item.headline).toBeTruthy();
      expect(item.body.length).toBeGreaterThan(40);
    }
  });

  it("같은 입력이면 같은 글이 나온다", () => {
    const a = assembleReading(computeChart(moment), "재물운");
    const b = assembleReading(computeChart(moment), "재물운");
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("원소 분포를 한 문장으로 말한다", () => {
    expect(describeElements([{ element: "불", count: 6 }, { element: "물", count: 4 }]))
      .toContain("6개가 불에 몰려");
    expect(
      describeElements([
        { element: "불", count: 3 },
        { element: "흙", count: 3 },
        { element: "공기", count: 2 },
        { element: "물", count: 2 },
      ]),
    ).toContain("네 원소가 모두 채워져");
  });
});
