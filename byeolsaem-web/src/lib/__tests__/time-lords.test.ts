import { describe, expect, it } from "vitest";
import { computeChart, type BirthMoment } from "../chart";
import { ZODIAC_SIGNS } from "../zodiac";
import {
  TRADITIONAL_RULER,
  SIGN_YEARS,
  ageOn,
  currentProfection,
  profectionYears,
} from "../time-lords";

/** 예시 인물과 같은 값 — 시각이 있어 상승궁이 선다. */
const NATAL: BirthMoment = {
  date: "1995-07-14",
  time: "09:30",
  latitude: 37.5665,
  longitude: 126.978,
  timezoneOffsetHours: 9,
};
const CHART = computeChart(NATAL);
/** 시각 미상 — 모든 계산이 null이어야 한다. */
const NATAL_NO_TIME: BirthMoment = { ...NATAL, time: null };
const CHART_NO_TIME = computeChart(NATAL_NO_TIME);

describe("전통 지배성과 연수표", () => {
  it("전통 지배성 — 현대 지배성(명왕성·천왕성·해왕성)이 없다", () => {
    expect(TRADITIONAL_RULER[7]).toBe("화성"); // 전갈
    expect(TRADITIONAL_RULER[10]).toBe("토성"); // 물병
    expect(TRADITIONAL_RULER[11]).toBe("목성"); // 물고기
    expect(TRADITIONAL_RULER).not.toContain("명왕성");
    expect(TRADITIONAL_RULER).not.toContain("천왕성");
    expect(TRADITIONAL_RULER).not.toContain("해왕성");
  });

  it("연수표가 스펙 값 그대로다", () => {
    expect(SIGN_YEARS).toEqual([15, 8, 20, 25, 19, 20, 8, 15, 12, 27, 27, 12]);
  });
});

describe("ageOn — 달력 생일 경계(KST)", () => {
  it("생일 전날은 n-1, 생일 당일은 n", () => {
    // 1995-07-14생. KST 2026-07-13 = 만 30, 2026-07-14 = 만 31.
    // Date는 UTC로 만들어 KST 정오가 되게 03:00Z를 쓴다.
    expect(ageOn("1995-07-14", new Date("2026-07-13T03:00:00Z"))).toBe(30);
    expect(ageOn("1995-07-14", new Date("2026-07-14T03:00:00Z"))).toBe(31);
  });
});

describe("연간 프로펙션", () => {
  const now = new Date("2026-08-26T03:00:00Z"); // 만 31세
  const current = currentProfection(NATAL, CHART, now)!;

  it("나이와 방 번호 — house = (age % 12) + 1", () => {
    expect(current.age).toBe(31);
    expect(current.house).toBe((31 % 12) + 1); // 8
  });

  it("자리 = 상승 자리에서 age % 12칸 전진 (whole sign)", () => {
    const ascIdx = Math.floor(CHART.ascendant! / 30);
    const expectIdx = (ascIdx + (31 % 12)) % 12;
    // ZODIAC_SIGNS[0] = 양자리 순서 — 라이브러리가 같은 배열을 쓴다
    expect(current.sign).toBe(ZODIAC_SIGNS[expectIdx]);
  });

  it("올해의 주인은 전통 지배성표에서 나온다", () => {
    const idx = (Math.floor(CHART.ascendant! / 30) + (31 % 12)) % 12;
    expect(current.lordKo).toBe(TRADITIONAL_RULER[idx]);
  });

  it("연 경계는 생일 날짜다", () => {
    expect(current.from).toBe("2026-07-14");
    expect(current.to).toBe("2027-07-14");
  });

  it("12년 스트립 — 현재−2부터 12칸, 자리 연속 전진", () => {
    const years = profectionYears(NATAL, CHART, now)!;
    expect(years).toHaveLength(12);
    expect(years[0].age).toBe(29);
    expect(years[2].age).toBe(31);
    // 이웃 칸의 자리 인덱스가 1씩 는다
    const i0 = ZODIAC_SIGNS.indexOf(years[0].sign);
    const i1 = ZODIAC_SIGNS.indexOf(years[1].sign);
    expect(i1).toBe((i0 + 1) % 12);
  });

  it("시각 미상이면 null", () => {
    expect(currentProfection(NATAL_NO_TIME, CHART_NO_TIME, now)).toBeNull();
    expect(profectionYears(NATAL_NO_TIME, CHART_NO_TIME, now)).toBeNull();
  });
});
