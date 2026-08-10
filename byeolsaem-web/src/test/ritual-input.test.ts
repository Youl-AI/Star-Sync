import { describe, expect, it } from "vitest";
import { formatDateInput, formatTimeInput, parseTime } from "../lib/ritual-input";
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
