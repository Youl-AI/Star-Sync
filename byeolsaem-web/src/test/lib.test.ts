import { describe, expect, it } from "vitest";
import { mulberry32 } from "../lib/random";
import { generateStars } from "../lib/stars";
import { detectSkyTier } from "../lib/sky-tier";
import { validateBirthDate } from "../lib/birth";

describe("mulberry32", () => {
  it("같은 시드는 같은 수열", () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it("0~1 범위", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe("generateStars", () => {
  it("개수·결정론·범위", () => {
    const s1 = generateStars(50, 1), s2 = generateStars(50, 1);
    expect(s1).toHaveLength(50);
    expect(s1).toEqual(s2);
    for (const s of s1) {
      expect(Math.abs(s.x)).toBeLessThanOrEqual(1);
      expect(s.size).toBeGreaterThanOrEqual(0.5);
      expect(s.size).toBeLessThanOrEqual(2);
    }
  });
});

describe("detectSkyTier", () => {
  it("reduced motion이면 무조건 static", () =>
    expect(detectSkyTier({ reducedMotion: true, isMobile: false, webgl: true })).toBe("static"));
  it("webgl 미지원이면 static", () =>
    expect(detectSkyTier({ reducedMotion: false, isMobile: false, webgl: false })).toBe("static"));
  it("모바일은 lite", () =>
    expect(detectSkyTier({ reducedMotion: false, isMobile: true, webgl: true })).toBe("lite"));
  it("데스크톱+webgl은 full", () =>
    expect(detectSkyTier({ reducedMotion: false, isMobile: false, webgl: true })).toBe("full"));
});

describe("validateBirthDate", () => {
  it("정상", () => expect(validateBirthDate(1999, 3, 21)).toBe(true));
  it("존재하지 않는 날", () => expect(validateBirthDate(2001, 2, 30)).toBe(false));
  it("미래·1900 이전 거부", () => {
    expect(validateBirthDate(2999, 1, 1)).toBe(false);
    expect(validateBirthDate(1899, 12, 31)).toBe(false);
  });
});
