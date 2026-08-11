import { describe, expect, it } from "vitest";
import { ZODIAC_SIGNS, getSunSign } from "../lib/zodiac";

describe("getSunSign", () => {
  it("대표 날짜들이 맞는 자리로 간다", () => {
    expect(getSunSign("1999-09-27").key).toBe("libra");
    expect(getSunSign("2000-04-05").key).toBe("aries");
    expect(getSunSign("1995-08-01").key).toBe("leo");
    expect(getSunSign("1990-06-01").key).toBe("gemini");
  });

  it("연말~연초에 걸친 염소자리를 올바르게 다룬다", () => {
    expect(getSunSign("1999-12-22").key).toBe("capricorn");
    expect(getSunSign("1999-12-31").key).toBe("capricorn");
    expect(getSunSign("2000-01-01").key).toBe("capricorn");
    expect(getSunSign("2000-01-19").key).toBe("capricorn");
    expect(getSunSign("2000-01-20").key).toBe("aquarius");
  });

  it("경계 날짜가 시작일 기준으로 갈린다", () => {
    expect(getSunSign("2000-03-20").key).toBe("pisces");
    expect(getSunSign("2000-03-21").key).toBe("aries");
    expect(getSunSign("2000-09-22").key).toBe("virgo");
    expect(getSunSign("2000-09-23").key).toBe("libra");
    expect(getSunSign("2000-11-21").key).toBe("scorpio");
    expect(getSunSign("2000-11-22").key).toBe("sagittarius");
  });

  it("형식이 깨진 입력은 던지지 않고 기본 자리로 떨어진다", () => {
    expect(getSunSign("")).toBe(ZODIAC_SIGNS[0]);
    expect(getSunSign("어제")).toBe(ZODIAC_SIGNS[0]);
  });
});

describe("ZODIAC_SIGNS 데이터", () => {
  it("12개 자리가 모두 있고 키가 겹치지 않는다", () => {
    expect(ZODIAC_SIGNS).toHaveLength(12);
    expect(new Set(ZODIAC_SIGNS.map((s) => s.key)).size).toBe(12);
  });

  it("성좌마다 별과 선이 있고 형태가 서로 다르다", () => {
    for (const s of ZODIAC_SIGNS) {
      expect(s.stars.length).toBeGreaterThanOrEqual(4);
      expect(s.path).toMatch(/^M/);
    }
    expect(new Set(ZODIAC_SIGNS.map((s) => s.path)).size).toBe(12);
  });

  it("모든 별이 260×200 viewBox 안에 있다", () => {
    for (const s of ZODIAC_SIGNS) {
      for (const [x, y] of s.stars) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(260);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(200);
      }
    }
  });

  it("선이 지나는 좌표는 모두 등록된 별이다(허공에서 꺾이지 않는다)", () => {
    for (const s of ZODIAC_SIGNS) {
      const starSet = new Set(s.stars.map(([x, y]) => `${x},${y}`));
      const points = s.path.match(/[ML]\s*(\d+)\s+(\d+)/g) ?? [];
      for (const p of points) {
        const m = p.match(/(\d+)\s+(\d+)/)!;
        expect(starSet.has(`${m[1]},${m[2]}`), `${s.key}의 선이 별 없는 좌표 (${m[1]},${m[2]})를 지남`).toBe(true);
      }
    }
  });
});
