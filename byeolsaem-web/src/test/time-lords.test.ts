import { describe, expect, it } from "vitest";
import { computeChart, type BirthMoment } from "../lib/chart";
import { ZODIAC_SIGNS } from "../lib/zodiac";
import {
  TRADITIONAL_RULER,
  SIGN_YEARS,
  ageOn,
  currentProfection,
  profectionYears,
  isDayBirth,
  lotLongitude,
  fractionalAge,
  zodiacalReleasing,
  zodiacalReleasingL2ForTest,
} from "../lib/time-lords";

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

  it("12년 스트립 — 현재-2부터 12칸, 자리 연속 전진", () => {
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

describe("점(Lot) — 주야 판정과 공식", () => {
  const sun = CHART.placements.find((p) => p.planet === "sun")!.longitude;
  const moon = CHART.placements.find((p) => p.planet === "moon")!.longitude;
  const asc = CHART.ascendant!;
  const norm = (x: number) => ((x % 360) + 360) % 360;

  it("주야 판정 — 태양-상승 각도로 지평선 위아래를 가른다", () => {
    // 오전 9시 30분 출생 — 태양이 지평선 위(주간)여야 한다.
    expect(isDayBirth(CHART)).toBe(true);
  });

  it("행운의 점 — 주간 공식 Asc + 달 - 태양", () => {
    expect(lotLongitude(CHART, "fortune")).toBeCloseTo(norm(asc + moon - sun), 6);
  });

  it("정신의 점은 행운과 공식이 반대다", () => {
    expect(lotLongitude(CHART, "spirit")).toBeCloseTo(norm(asc + sun - moon), 6);
  });

  it("야간 차트에서는 두 점의 공식이 서로 맞바뀐다", () => {
    // 같은 날 밤 11시 — 태양이 지평선 아래.
    const night = computeChart({ ...NATAL, time: "23:00" });
    expect(isDayBirth(night)).toBe(false);
    const nSun = night.placements.find((p) => p.planet === "sun")!.longitude;
    const nMoon = night.placements.find((p) => p.planet === "moon")!.longitude;
    expect(lotLongitude(night, "fortune")).toBeCloseTo(
      norm(night.ascendant! + nSun - nMoon), 6);
    expect(lotLongitude(night, "spirit")).toBeCloseTo(
      norm(night.ascendant! + nMoon - nSun), 6);
  });

  it("시각 미상이면 null", () => {
    expect(isDayBirth(CHART_NO_TIME)).toBeNull();
    expect(lotLongitude(CHART_NO_TIME, "fortune")).toBeNull();
  });
});

describe("조디악 릴리징", () => {
  const now = new Date("2026-08-26T03:00:00Z");
  const zr = zodiacalReleasing(NATAL, CHART, "fortune", now)!;
  const norm = (x: number) => ((x % 360) + 360) % 360;

  it("L1 — 점의 자리에서 출발, 연수표 누적, 100세 넘는 장까지", () => {
    const lotIdx = Math.floor(lotLongitude(CHART, "fortune")! / 30);
    expect(ZODIAC_SIGNS.indexOf(zr.l1[0].sign)).toBe(lotIdx);
    expect(zr.l1[0].fromAge).toBe(0);
    // 이웃 장: fromAge 연속 + 자리 1칸 전진
    for (let i = 1; i < zr.l1.length; i++) {
      expect(zr.l1[i].fromAge).toBe(zr.l1[i - 1].toAge);
      expect(ZODIAC_SIGNS.indexOf(zr.l1[i].sign)).toBe(
        (ZODIAC_SIGNS.indexOf(zr.l1[i - 1].sign) + 1) % 12,
      );
      // 장 길이 = 연수표
      expect(zr.l1[i].toAge - zr.l1[i].fromAge).toBe(
        SIGN_YEARS[ZODIAC_SIGNS.indexOf(zr.l1[i].sign)],
      );
    }
    // 마지막 장이 100세를 덮는다
    expect(zr.l1[zr.l1.length - 1].toAge).toBeGreaterThanOrEqual(100);
    expect(zr.l1[zr.l1.length - 2].toAge).toBeLessThan(100);
  });

  it("현재 장 — fractionalAge가 구간 안에 있다", () => {
    const age = fractionalAge(NATAL.date, now);
    expect(zr.currentL1).not.toBeNull();
    expect(age).toBeGreaterThanOrEqual(zr.currentL1!.fromAge);
    expect(age).toBeLessThan(zr.currentL1!.toAge);
  });

  it("L2 — 자리별 연수를 월로, 합이 L1 길이와 일치, 마지막 칸 부분 절단", () => {
    const l1 = zr.currentL1!;
    const months = Math.round((l1.toAge - l1.fromAge) * 12);
    const sum = zr.l2OfCurrent.reduce(
      (acc, p) => acc + Math.round((p.toAge - p.fromAge) * 12), 0);
    expect(sum).toBe(months);
    // 첫 L2는 L1과 같은 자리에서 시작
    expect(zr.l2OfCurrent[0].sign).toBe(l1.sign);
    expect(zr.currentL2).not.toBeNull();
  });

  it("각 판정 — 행운의 점 자리 기준 1·4·7·10, 10번째는 peak", () => {
    const fortuneIdx = Math.floor(lotLongitude(CHART, "fortune")! / 30);
    for (const p of zr.l1) {
      const idx = ZODIAC_SIGNS.indexOf(p.sign);
      const house = ((idx - fortuneIdx + 12) % 12) + 1;
      expect(p.houseFromFortune).toBe(house);
      expect(p.angular).toBe([1, 4, 7, 10].includes(house));
      expect(p.peak).toBe(house === 10);
    }
  });

  it("정신의 점 릴리징에서도 각 판정은 행운의 점 기준이다", () => {
    const spirit = zodiacalReleasing(NATAL, CHART, "spirit", now)!;
    const fortuneIdx = Math.floor(lotLongitude(CHART, "fortune")! / 30);
    const first = spirit.l1[0];
    const idx = ZODIAC_SIGNS.indexOf(first.sign);
    expect(first.houseFromFortune).toBe(((idx - fortuneIdx + 12) % 12) + 1);
  });

  it("매듭 풀림 — 긴 장(염소 27년)의 L2가 한 바퀴 돌면 맞은편으로 건너뛴다", () => {
    // 염소(27년) L1을 합성해 직접 검사한다 — 어느 차트든 규칙은 같다.
    // 염소 출발 L2: 염소27 물병27 물고기12 양15 황소8 쌍20 게25 사19 처20 천8 전15 사수12
    // 개월 누적: 27+27+12+15+8+20+25+19+20+8+15+12 = 208 → 다음 차례가 다시 염소(월 208).
    // 이때 맞은편 게자리로 건너뛰어야 한다. 총 길이 324개월(27년).
    const zrCap = zodiacalReleasingL2ForTest(9, 27 * 12); // 염소=9
    const jump = zrCap.find((p) => p.loosedBond);
    expect(jump).toBeDefined();
    expect(ZODIAC_SIGNS.indexOf(jump!.sign)).toBe(3); // 게자리
    // 건너뛴 지점 직전까지의 누적이 208개월
    const before = zrCap.slice(0, zrCap.indexOf(jump!));
    const monthsBefore = before.reduce(
      (acc, p) => acc + Math.round((p.toAge - p.fromAge) * 12), 0);
    expect(monthsBefore).toBe(208);
  });

  it("짧은 장(천칭 8년)에서는 매듭 풀림이 없다", () => {
    const zrLib = zodiacalReleasingL2ForTest(6, 8 * 12); // 천칭=6
    expect(zrLib.every((p) => !p.loosedBond)).toBe(true);
  });

  it("시각 미상이면 null", () => {
    expect(zodiacalReleasing(NATAL_NO_TIME, CHART_NO_TIME, "fortune", now)).toBeNull();
  });
});
