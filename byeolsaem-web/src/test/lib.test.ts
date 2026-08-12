import { describe, expect, it } from "vitest";
import { mulberry32 } from "../lib/random";
import { generateStars } from "../lib/stars";
import { detectSkyTier } from "../lib/sky-tier";
import { validateBirthDate } from "../lib/birth";
import { getFortuneYear } from "../lib/date";
import { eul, eun, gwa, iga } from "../lib/josa";

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
      expect(Math.abs(s.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.z)).toBeLessThanOrEqual(1);
      expect(s.size).toBeGreaterThanOrEqual(0.5);
      expect(s.size).toBeLessThanOrEqual(2);
      expect(s.phase).toBeGreaterThanOrEqual(0);
      expect(s.phase).toBeLessThan(2 * Math.PI);
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

describe("getFortuneYear", () => {
  it("1월~10월은 올해를 반환", () => {
    expect(getFortuneYear(new Date(2026, 0, 1))).toBe(2026);
    expect(getFortuneYear(new Date(2026, 9, 31))).toBe(2026);
  });
  it("11월부터는 내년을 반환", () => {
    expect(getFortuneYear(new Date(2026, 10, 1))).toBe(2027);
    expect(getFortuneYear(new Date(2026, 11, 31))).toBe(2027);
  });
  it("연말/연초 경계", () => {
    expect(getFortuneYear(new Date(2025, 11, 31, 23, 59))).toBe(2026);
    expect(getFortuneYear(new Date(2026, 0, 1, 0, 0))).toBe(2026);
  });
});

describe("조사", () => {
  it("받침이 있으면 과·이·을·은", () => {
    expect(gwa("방식")).toBe("과");
    expect(iga("방식")).toBe("이");
    expect(eul("방식")).toBe("을");
    expect(eun("방식")).toBe("은");
  });

  it("받침이 없으면 와·가·를·는", () => {
    expect(gwa("자리")).toBe("와");
    expect(iga("자리")).toBe("가");
    expect(eul("자리")).toBe("를");
    expect(eun("자리")).toBe("는");
  });

  it("한글이 아니면 받침이 있는 쪽으로 적는다", () => {
    // 숫자와 라틴 표기는 읽는 방식이 제각각이라 한쪽으로 정해 둔다.
    expect(gwa("MOON")).toBe("과");
    expect(iga("2027")).toBe("이");
    expect(gwa("")).toBe("과");
  });
});
