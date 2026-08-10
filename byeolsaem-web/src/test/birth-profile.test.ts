import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearBirthProfile,
  formatBirthDate,
  isBirthProfile,
  loadBirthProfile,
  saveBirthProfile,
  type BirthProfile,
} from "../lib/birth-profile";

const VALID: BirthProfile = {
  date: "1999-03-21",
  time: "21:44",
  city: "서울",
  concern: "연애운",
};

// vitest 기본 환경은 node라 localStorage가 없다. 실제 브라우저 저장소의
// 최소 계약(getItem/setItem/removeItem)만 흉내 내 붙여준다.
function installStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  });
  return store;
}

describe("isBirthProfile", () => {
  it("올바른 프로필을 통과시킨다", () => {
    expect(isBirthProfile(VALID)).toBe(true);
  });

  it("태어난 시간을 모르는 경우(null)도 유효하다", () => {
    expect(isBirthProfile({ ...VALID, time: null })).toBe(true);
  });

  it("손상되거나 옛 구조인 값을 거른다", () => {
    const bad: unknown[] = [
      null,
      "문자열",
      { ...VALID, date: "1999/03/21" }, // 구분자가 다름
      { ...VALID, date: "1999-3-21" }, // 0 패딩 없음
      { ...VALID, time: "25:00" }, // 존재하지 않는 시각
      { ...VALID, time: "9:30" }, // 0 패딩 없음
      { ...VALID, city: "   " }, // 공백뿐
      { ...VALID, concern: "" },
      { date: "1999-03-21" }, // 필드 누락
    ];
    for (const v of bad) expect(isBirthProfile(v)).toBe(false);
  });
});

describe("저장소 왕복", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installStorage();
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  it("저장한 뒤 읽으면 같은 값이 나온다", () => {
    expect(saveBirthProfile(VALID)).toBe(true);
    expect(loadBirthProfile()).toEqual(VALID);
  });

  it("저장한 적 없으면 null", () => {
    expect(loadBirthProfile()).toBeNull();
  });

  it("지우면 null로 돌아간다", () => {
    saveBirthProfile(VALID);
    clearBirthProfile();
    expect(loadBirthProfile()).toBeNull();
  });

  it("JSON이 깨져 있어도 던지지 않고 null", () => {
    store.set("byeolsaem.birth.v1", "{이건 JSON이 아니다");
    expect(loadBirthProfile()).toBeNull();
  });

  it("구조가 맞지 않는 값은 신뢰하지 않는다", () => {
    store.set("byeolsaem.birth.v1", JSON.stringify({ birthday: "1999-03-21" }));
    expect(loadBirthProfile()).toBeNull();
  });
});

describe("저장소가 없는 환경", () => {
  it("읽기는 null, 쓰기는 false를 돌려줄 뿐 던지지 않는다", () => {
    expect(loadBirthProfile()).toBeNull();
    expect(saveBirthProfile(VALID)).toBe(false);
    expect(() => clearBirthProfile()).not.toThrow();
  });
});

describe("formatBirthDate", () => {
  it("앞의 0을 떼고 사람이 읽는 표기로 바꾼다", () => {
    expect(formatBirthDate("1999-03-21")).toBe("1999. 3. 21");
    expect(formatBirthDate("2001-12-05")).toBe("2001. 12. 5");
  });

  it("형식이 다르면 원본을 그대로 돌려준다", () => {
    expect(formatBirthDate("어제")).toBe("어제");
  });
});
