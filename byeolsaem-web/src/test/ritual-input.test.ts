import { describe, expect, it } from "vitest";
import { formatDateInput, formatTimeInput, parseBirthDate, parseTime } from "../lib/ritual-input";
import {
  OVERSEAS,
  PROVINCES,
  filterDistricts,
  filterProvinces,
  formatPlace,
  matchesQuery,
} from "../lib/regions";

describe("formatDateInput", () => {
  it("자리가 채워지는 즉시 구분자를 찍는다", () => {
    expect(formatDateInput("1")).toBe("1");
    expect(formatDateInput("199")).toBe("199");
    expect(formatDateInput("1999")).toBe("1999 . ");
    expect(formatDateInput("19990")).toBe("1999 . 0");
    expect(formatDateInput("199903")).toBe("1999 . 03 . ");
    expect(formatDateInput("19990321")).toBe("1999 . 03 . 21");
  });

  it("월의 첫 숫자가 2~9면 그 자리에서 월이 끝난다 — 0을 안 붙여도 된다", () => {
    // 20~92월은 없다. 시각 칸의 "9 : 30"과 같은 판정이다.
    expect(formatDateInput("19999")).toBe("1999 . 9 . ");
    expect(formatDateInput("1999927")).toBe("1999 . 9 . 27");
    expect(formatDateInput("199952")).toBe("1999 . 5 . 2");
  });

  it("1로 시작한 월은 다음 숫자가 3~9면 1월로 확정된다", () => {
    // 13~19월은 없다.
    expect(formatDateInput("199913")).toBe("1999 . 1 . 3");
    expect(formatDateInput("1999131")).toBe("1999 . 1 . 31");
  });

  it("1 다음 숫자를 보기 전에는 구분자를 찍지 않는다", () => {
    expect(formatDateInput("19991")).toBe("1999 . 1");
  });

  it("일곱 자리에서 한 읽기만 실재하면 그쪽으로 확정된다", () => {
    // 11월 0일은 없으므로 1월 10일이고, 12월 0일은 없으므로 1월 20일이다.
    expect(formatDateInput("1999110")).toBe("1999 . 1 . 10");
    expect(formatDateInput("1999120")).toBe("1999 . 1 . 20");
  });

  it("여덟 자리는 언제나 연 4·월 2·일 2다", () => {
    expect(formatDateInput("19991102")).toBe("1999 . 11 . 02");
    expect(formatDateInput("19990112")).toBe("1999 . 01 . 12");
  });

  it("이미 찍힌 구분자를 다시 넣어도 결과가 같다(재입력에 안정적)", () => {
    expect(formatDateInput("1999 . 03 . 21")).toBe("1999 . 03 . 21");
  });

  it("숫자 아닌 입력은 흘려버린다", () => {
    expect(formatDateInput("가1999나03다21")).toBe("1999 . 03 . 21");
  });

  it("8자리를 넘는 숫자는 받지 않는다", () => {
    expect(formatDateInput("199903219999")).toBe("1999 . 03 . 21");
  });

  it("구분자 위에서 지우면 숫자가 한 칸 실제로 지워진다", () => {
    // "1999 . " 에서 끝의 공백 하나를 지운 상태가 들어온다. 숫자 개수는 그대로라
    // 그냥 다시 포맷하면 화면이 멈춘 것처럼 보이므로 연도의 마지막 자리를 지운다.
    expect(formatDateInput("1999 .", "1999 . ")).toBe("199");
  });

  it("일반적인 백스페이스는 숫자 하나만 지운다", () => {
    expect(formatDateInput("1999 . 03 . 2", "1999 . 03 . 21")).toBe("1999 . 03 . 2");
  });
});

describe("parseBirthDate", () => {
  it("0을 붙이지 않은 입력을 읽는다", () => {
    expect(parseBirthDate("1999 . 9 . 27")).toEqual({ ok: true, y: 1999, mo: 9, d: 27 });
    expect(parseBirthDate("1999927")).toEqual({ ok: true, y: 1999, mo: 9, d: 27 });
    expect(parseBirthDate("199915")).toEqual({ ok: true, y: 1999, mo: 1, d: 5 });
  });

  it("여덟 자리와 구분자 표기를 그대로 읽는다", () => {
    expect(parseBirthDate("19990321")).toEqual({ ok: true, y: 1999, mo: 3, d: 21 });
    expect(parseBirthDate("1999 . 03 . 21")).toEqual({ ok: true, y: 1999, mo: 3, d: 21 });
  });

  it("두 읽기가 모두 실재하면 추측하지 않고 둘을 돌려준다", () => {
    // 1999112 — 1월 12일도 11월 2일도 실재한다. 잘못 추측한 생일은 차트를
    // 평생 틀리게 만들므로, 여기서는 확정하지 않는 것이 맞다.
    const parsed = parseBirthDate("1999112");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok && parsed.ambiguous) {
      expect(parsed.ambiguous.a).toEqual({ mo: 1, d: 12 });
      expect(parsed.ambiguous.b).toEqual({ mo: 11, d: 2 });
    } else {
      throw new Error("ambiguous여야 한다");
    }
  });

  it("한 읽기만 실재하는 일곱 자리는 그쪽으로 확정된다", () => {
    expect(parseBirthDate("1999110")).toEqual({ ok: true, y: 1999, mo: 1, d: 10 });
    expect(parseBirthDate("1999120")).toEqual({ ok: true, y: 1999, mo: 1, d: 20 });
  });

  it("1999123도 애매하다 — 1월 23일과 12월 3일", () => {
    const parsed = parseBirthDate("1999123");
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.ambiguous ? parsed.ambiguous.b : null).toEqual({ mo: 12, d: 3 });
  });

  it("실재하지 않는 날짜는 거른다", () => {
    expect(parseBirthDate("19990230").ok).toBe(false);
    expect(parseBirthDate("19991345").ok).toBe(false);
    // 미래의 날짜도 생일이 아니다.
    expect(parseBirthDate("20990101").ok).toBe(false);
  });

  it("덜 적은 입력은 거른다", () => {
    expect(parseBirthDate("1999").ok).toBe(false);
    expect(parseBirthDate("19991").ok).toBe(false);
    // "199911"은 11월로 읽히고 일이 없다 — 1월 1일로 추측하지 않는다.
    expect(parseBirthDate("199911").ok).toBe(false);
  });
});

describe("formatTimeInput", () => {
  it("0~2로 시작하면 두 자리를 채운 뒤 구분자를 찍는다", () => {
    expect(formatTimeInput("2")).toBe("2");
    expect(formatTimeInput("21")).toBe("21 : ");
    expect(formatTimeInput("214")).toBe("21 : 4");
    expect(formatTimeInput("2144")).toBe("21 : 44");
  });

  it("3 이상으로 시작하면 시가 한 자리로 확정되어 바로 구분자를 찍는다", () => {
    expect(formatTimeInput("9")).toBe("9 : ");
    expect(formatTimeInput("930")).toBe("9 : 30");
    expect(formatTimeInput("7")).toBe("7 : ");
  });

  it("0시대와 자정 직후도 두 자리로 다룬다", () => {
    expect(formatTimeInput("00")).toBe("00 : ");
    expect(formatTimeInput("0005")).toBe("00 : 05");
  });

  it("분은 두 자리를 넘기지 않는다", () => {
    expect(formatTimeInput("214499")).toBe("21 : 44");
  });

  it("빈 입력은 빈 값으로 둔다(태어난 시간을 모르는 경우)", () => {
    expect(formatTimeInput("")).toBe("");
  });
});

describe("parseTime", () => {
  it("자동으로 찍힌 구분자가 들어간 표기를 그대로 읽는다", () => {
    expect(parseTime("21 : 44")).toEqual({ ok: true, value: "21:44" });
    expect(parseTime("9 : 30")).toEqual({ ok: true, value: "09:30" });
  });

  it("구분자가 없거나 다른 모양이어도 읽는다", () => {
    expect(parseTime("2144")).toEqual({ ok: true, value: "21:44" });
    expect(parseTime("21:44")).toEqual({ ok: true, value: "21:44" });
    expect(parseTime("21.44")).toEqual({ ok: true, value: "21:44" });
  });

  it("빈 값은 오류가 아니라 '모름'이다", () => {
    expect(parseTime("   ")).toEqual({ ok: true, value: null });
  });

  it("없는 시각은 거른다", () => {
    expect(parseTime("25 : 00")).toEqual({ ok: false });
    expect(parseTime("21 : 77")).toEqual({ ok: false });
    expect(parseTime("아홉시")).toEqual({ ok: false });
  });
});

describe("행정구역 목록", () => {
  it("광역자치단체가 17개다(개편 전 기준)", () => {
    expect(PROVINCES).toHaveLength(17);
  });

  it("세종만 하위 구역이 없다", () => {
    const empty = PROVINCES.filter((p) => p.districts.length === 0).map((p) => p.name);
    expect(empty).toEqual(["세종특별자치시"]);
  });

  it("서울은 자치구 25개다", () => {
    expect(filterDistricts("서울특별시", "")).toHaveLength(25);
  });

  it("군위군은 대구에 있고 경북에는 없다", () => {
    expect(filterDistricts("대구광역시", "")).toContain("군위군");
    expect(filterDistricts("경상북도", "")).not.toContain("군위군");
  });

  it("이름이 겹치는 구가 여러 시도에 각각 있다", () => {
    expect(filterDistricts("부산광역시", "중구")).toEqual(["중구"]);
    expect(filterDistricts("대전광역시", "중구")).toEqual(["중구"]);
  });
});

describe("행정구역 검색", () => {
  it("줄임말로 찾을 수 있다", () => {
    expect(filterProvinces("서울").map((p) => p.name)).toEqual(["서울특별시"]);
    expect(filterProvinces("경기").map((p) => p.name)).toEqual(["경기도"]);
    expect(filterProvinces("충남").map((p) => p.name)).toEqual(["충청남도"]);
  });

  it("2026년 개편 이후 이름으로도 개편 전 지역이 걸린다", () => {
    const names = filterProvinces("전남광주통합특별시").map((p) => p.name);
    expect(names).toEqual(["광주광역시", "전라남도"]);
    expect(filterProvinces("제물포구").map((p) => p.name)).toEqual(["인천광역시"]);
  });

  it("옛 이름으로도 찾을 수 있다", () => {
    expect(filterProvinces("전라북도").map((p) => p.name)).toEqual(["전북특별자치도"]);
    expect(filterProvinces("강원도").map((p) => p.name)).toEqual(["강원특별자치도"]);
  });

  it("빈 검색어는 전부 돌려준다", () => {
    expect(filterProvinces("")).toHaveLength(17);
    expect(filterProvinces("   ")).toHaveLength(17);
  });

  it("걸리는 것이 없으면 빈 목록", () => {
    expect(filterProvinces("없는곳")).toEqual([]);
  });

  it("해외는 부분 입력으로도 걸린다", () => {
    expect(matchesQuery(OVERSEAS, [], "해")).toBe(true);
    expect(matchesQuery(OVERSEAS, [], "서울")).toBe(false);
  });

  it("없는 시도의 시군구를 물으면 빈 목록", () => {
    expect(filterDistricts("있을리없는도", "")).toEqual([]);
  });
});

describe("formatPlace", () => {
  it("시군구가 있으면 붙이고 없으면 시도만 쓴다", () => {
    expect(formatPlace("서울특별시", "강남구")).toBe("서울특별시 강남구");
    expect(formatPlace("세종특별자치시", null)).toBe("세종특별자치시");
  });
});
