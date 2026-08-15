import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ZODIAC_SIGNS } from "../lib/zodiac";
import { SIGN_CONTENT, getSignBySlug, getSignContent } from "../lib/sign-content";

describe("별자리 메타데이터", () => {
  it("열두 자리 모두 기간·원소·특질·지배행성을 갖는다", () => {
    for (const s of ZODIAC_SIGNS) {
      expect(s.range, s.key).toMatch(/^\d{1,2}\. \d{1,2} - \d{1,2}\. \d{1,2}$/);
      expect(["불", "흙", "공기", "물"]).toContain(s.element);
      expect(["활동", "고정", "변통"]).toContain(s.quality);
      expect(s.ruler.length).toBeGreaterThan(0);
    }
  });

  it("원소는 셋씩, 특질은 넷씩 고르게 나뉜다", () => {
    const count = (pick: (s: (typeof ZODIAC_SIGNS)[number]) => string) =>
      ZODIAC_SIGNS.reduce<Record<string, number>>((acc, s) => {
        acc[pick(s)] = (acc[pick(s)] ?? 0) + 1;
        return acc;
      }, {});
    expect(count((s) => s.element)).toEqual({ 불: 3, 흙: 3, 공기: 3, 물: 3 });
    expect(count((s) => s.quality)).toEqual({ 활동: 4, 고정: 4, 변통: 4 });
  });
});

describe("별자리 본문", () => {
  it("슬러그로 별자리를 찾는다", () => {
    expect(getSignBySlug("libra")?.ko).toBe("천칭자리");
    expect(getSignBySlug("없는자리")).toBeUndefined();
  });

  it("열두 자리가 모두 본문을 갖는다", () => {
    for (const sign of ZODIAC_SIGNS) {
      expect(getSignContent(sign.key), sign.ko).toBeDefined();
    }
    expect(getSignContent("없는자리")).toBeUndefined();
  });

  it("본문 키는 모두 실재하는 별자리다", () => {
    const keys = new Set(ZODIAC_SIGNS.map((s) => s.key));
    for (const k of Object.keys(SIGN_CONTENT)) {
      expect(keys.has(k), `${k}는 없는 별자리`).toBe(true);
    }
  });

  it("작성된 본문은 모든 절을 채운다", () => {
    for (const [key, c] of Object.entries(SIGN_CONTENT)) {
      if (!c) continue;
      expect(c.opening.length, key).toBeGreaterThan(50);
      expect(c.nature.length, key).toBeGreaterThanOrEqual(2);
      expect(c.strengths.length, key).toBeGreaterThanOrEqual(3);
      expect(c.shadows.length, key).toBeGreaterThanOrEqual(3);
      expect(c.inRelationships.length, key).toBeGreaterThanOrEqual(2);
      expect(c.inWork.length, key).toBeGreaterThanOrEqual(2);
      expect(c.misread.length, key).toBeGreaterThanOrEqual(2);
    }
  });

  it("작성된 본문은 색인 가치가 있는 분량이다", () => {
    for (const [key, c] of Object.entries(SIGN_CONTENT)) {
      if (!c) continue;
      const chars = [
        c.opening,
        ...c.nature,
        ...c.strengths.flatMap((s) => [s.title, s.body]),
        ...c.shadows.flatMap((s) => [s.title, s.body]),
        ...c.inRelationships,
        ...c.inWork,
        ...c.misread.flatMap((m) => [m.question, m.answer]),
      ]
        .join("")
        .replace(/\s/g, "").length;
      // 스펙 §6.4가 요구하는 2,000자는 공백 포함 기준이라 여기서는 조금 낮춰 잡는다.
      expect(chars, `${key}: ${chars}자`).toBeGreaterThanOrEqual(1500);
    }
  });
});

describe("공유 카드", () => {
  const OG_DIR = join(process.cwd(), "public/og");

  it("사이트 기본 카드가 있다", () => {
    expect(existsSync(join(OG_DIR, "default.png"))).toBe(true);
  });

  /**
   * 별자리를 추가하거나 key를 바꾸면 카드가 없는 채로 메타데이터만 그 주소를
   * 가리키게 된다. 링크를 공유해 보기 전에는 아무도 모르는 종류의 고장이라
   * 여기서 막는다. 고치는 법: node --experimental-strip-types scripts/build-og.mjs
   */
  it("열두 별자리 카드가 모두 있다", () => {
    const missing = ZODIAC_SIGNS.filter(
      (s) => !existsSync(join(OG_DIR, "sign", `${s.key}.png`)),
    ).map((s) => s.key);
    expect(missing, "scripts/build-og.mjs를 다시 돌리세요").toEqual([]);
  });

  it("카드가 PNG이고 비어 있지 않다", () => {
    for (const s of ZODIAC_SIGNS) {
      const buf = readFileSync(join(OG_DIR, "sign", `${s.key}.png`));
      expect(buf.subarray(0, 4).toString("hex"), s.key).toBe("89504e47");
      expect(buf.length, s.key).toBeGreaterThan(10_000);
    }
  });
});
